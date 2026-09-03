"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutGrid, RotateCcw, Repeat, Volume2, VolumeX } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { DepartmentPicker } from "./DepartmentPicker";
import { MenuPanel } from "./MenuPanel";
import { WorkflowForm } from "./WorkflowForm";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";
import { BRANDS, type Department } from "@/lib/brands";
import { departmentContent } from "@/data";
import { detectLanguage, speechTagFor, t, type Language } from "@/lib/i18n";
import { cn, generateConversationReference, shortId } from "@/lib/utils";
import type { ChatAction, ChatMessage, ChatStreamEvent } from "@/types";

const STORAGE_KEY = "cakestry.chat.v1";

interface PersistedState {
  reference: string;
  department: Department | null;
  messages: ChatMessage[];
}

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [streaming, setStreaming] = useState(false);
  const [voiceOut, setVoiceOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [activeForm, setActiveForm] = useState<ChatAction | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const conversationRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const departmentRef = useRef<Department | null>(null);

  // ---------------------------------------------------------------- restore --
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        conversationRef.current = parsed.reference ?? generateConversationReference();
        setDepartment(parsed.department ?? null);
        departmentRef.current = parsed.department ?? null;
        setMessages(parsed.messages ?? []);
      } else {
        conversationRef.current = generateConversationReference();
      }
    } catch {
      conversationRef.current = generateConversationReference();
    }
    setHydrated(true);
  }, []);

  // ---------------------------------------------------------------- persist --
  useEffect(() => {
    if (!hydrated || !conversationRef.current) return;
    const state: PersistedState = {
      reference: conversationRef.current,
      department,
      messages,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [messages, department, hydrated]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming, activeForm]);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechTagFor(text);
    window.speechSynthesis.speak(utterance);
  }, []);

  // ------------------------------------------------------------------- send --
  const send = useCallback(
    async (text: string, requestedDepartment?: Department) => {
      if (streaming || !text.trim()) return;

      setActiveForm(null);
      setQuickReplies([]);
      setLanguage(detectLanguage(text));

      const activeDepartment = requestedDepartment ?? departmentRef.current;
      const userMsg: ChatMessage = {
        id: shortId(12),
        role: "user",
        content: text,
        department: activeDepartment,
      };
      const assistantId = shortId(12);
      const history = [...messages, userMsg];

      setMessages([
        ...history,
        { id: assistantId, role: "assistant", content: "", department: activeDepartment },
      ]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationRef: conversationRef.current,
            department: departmentRef.current,
            requestedDepartment: requestedDepartment ?? null,
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(
            (await res.json().catch(() => null))?.error ?? "Request failed"
          );
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload) continue;

            let event: ChatStreamEvent;
            try {
              event = JSON.parse(payload);
            } catch {
              continue;
            }

            if (event.type === "meta") {
              if (event.department && event.department !== departmentRef.current) {
                departmentRef.current = event.department;
                setDepartment(event.department);
              }
              setLanguage(event.language);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId || m.id === userMsg.id
                    ? { ...m, department: event.department }
                    : m
                )
              );
            } else if (event.type === "chunk") {
              full += event.text;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m))
              );
            } else if (event.type === "done") {
              if (event.suggestions?.length) setQuickReplies(event.suggestions);
              if (event.action) setActiveForm(event.action);
            } else if (event.type === "error") {
              full = event.message;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m))
              );
            }
          }
        }

        if (voiceOut && full) speak(full);
      } catch (err: unknown) {
        if ((err as { name?: string })?.name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      m.content ||
                      "Sorry, I couldn't reach the assistant. Please check your connection and try again.",
                  }
                : m
            )
          );
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming, voiceOut, speak]
  );

  // -------------------------------------------------------------- controls --
  function pickDepartment(next: Department) {
    departmentRef.current = next;
    setDepartment(next);
    setQuickReplies([]);
    setActiveForm(null);
  }

  function switchDepartment() {
    const next: Department = department === "MARKETING" ? "INSTITUTE" : "MARKETING";
    pickDepartment(next);
    void send(
      `I'd like to talk about ${BRANDS[next].name} instead.`,
      next
    );
  }

  function stop() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  function reset() {
    stop();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    conversationRef.current = generateConversationReference();
    departmentRef.current = null;
    setDepartment(null);
    setMessages([]);
    setQuickReplies([]);
    setActiveForm(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  function appendAssistant(content: string) {
    setMessages((prev) => [
      ...prev,
      { id: shortId(12), role: "assistant", content, department: departmentRef.current },
    ]);
    setActiveForm(null);
  }

  // --------------------------------------------------------------- rendering -
  const brand = department ? BRANDS[department] : null;
  const isEmpty = messages.length === 0;
  const showPicker = isEmpty && !department;
  const defaultQuickReplies = department
    ? departmentContent(department).quickReplies
    : [];
  const chips = quickReplies.length ? quickReplies : defaultQuickReplies;
  const lastMessage = messages[messages.length - 1];
  const awaitingFirstToken =
    streaming && lastMessage?.role === "assistant" && !lastMessage.content;

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden"
      data-department={department ?? undefined}
    >
      {department && (
        <MenuPanel
          department={department}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onPrompt={(prompt) => void send(prompt)}
          onAction={(action) => setActiveForm(action)}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {department && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 px-2"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <LayoutGrid className="size-4" />
              <span className="hidden sm:inline">{t("chat.menu", language)}</span>
            </Button>
          )}
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-accent">
            <span className="size-2 shrink-0 rounded-full bg-accent" />
            <span className="truncate">
              {brand ? brand.shortName : t("chat.online", language)}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          {department && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 px-2"
              onClick={switchDepartment}
              disabled={streaming}
              title={`Switch to ${
                department === "MARKETING" ? "Cakestry Events" : "Cakestry Bakery"
              }`}
            >
              <Repeat className="size-4" />
              <span className="hidden sm:inline">{t("chat.switch", language)}</span>
            </Button>
          )}
          <Button
            variant={voiceOut ? "accent" : "ghost"}
            size="sm"
            className="gap-1.5 px-2"
            onClick={() => {
              if (voiceOut && typeof window !== "undefined") {
                window.speechSynthesis?.cancel();
              }
              setVoiceOut((v) => !v);
            }}
            aria-pressed={voiceOut}
          >
            {voiceOut ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            <span className="hidden sm:inline">{t("chat.voice", language)}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 px-2" onClick={reset}>
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">{t("chat.newChat", language)}</span>
          </Button>
        </div>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="scroll-slim flex-1 overflow-y-auto px-4 py-6">
        {showPicker ? (
          <div className="flex h-full flex-col items-center justify-center">
            <DepartmentPicker
              language={language}
              onPick={(next) => {
                pickDepartment(next);
                void send(
                  next === "MARKETING"
                    ? "I'm interested in Cakestry Bakery cakes and pastries."
                    : "I'm interested in Cakestry Special Events catering & gift boxes.",
                  next
                );
              }}
            />
          </div>
        ) : isEmpty && department ? (
          <div className="flex h-full flex-col items-center justify-center gap-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold">{t("chat.emptyTitle", language)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{brand?.tagline}</p>
            </div>
            <SuggestedQuestions
              department={department}
              language={language}
              onPick={(prompt) => void send(prompt)}
            />
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {messages.map((message) =>
              message.role === "assistant" && !message.content && awaitingFirstToken ? (
                <div key={message.id} className="flex gap-3">
                  <span className="mt-1 size-8 shrink-0" />
                  <TypingIndicator />
                </div>
              ) : (
                <MessageBubble key={message.id} message={message} onSpeak={speak} />
              )
            )}

            {activeForm && department && (
              <div className="ml-11">
                <WorkflowForm
                  action={activeForm}
                  department={department}
                  conversationRef={conversationRef.current}
                  onCancel={() => setActiveForm(null)}
                  onResult={appendAssistant}
                  onPrompt={(prompt) => {
                    setActiveForm(null);
                    void send(prompt);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick replies + composer */}
      <div className="border-t bg-background/60 px-4 py-3">
        <div className="mx-auto max-w-3xl space-y-2.5">
          {!showPicker && chips.length > 0 && (
            <div className="scroll-slim flex gap-2 overflow-x-auto pb-0.5">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={streaming}
                  onClick={() => void send(chip)}
                  className={cn(
                    "shrink-0 rounded-full border bg-secondary px-3 py-1 text-xs text-secondary-foreground transition",
                    "hover:border-primary/40 hover:bg-primary/10 disabled:opacity-50"
                  )}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          <ChatInput
            onSend={(text) => void send(text)}
            disabled={streaming}
            streaming={streaming}
            onStop={stop}
            placeholder={t("chat.placeholder", language)}
          />

          <p className="text-center text-[11px] text-muted-foreground">
            {t("chat.disclaimer", language)}
          </p>
        </div>
      </div>
    </div>
  );
}
