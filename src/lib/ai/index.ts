import { config } from "@/lib/config";
import { detectLanguage, type Language } from "@/lib/i18n";
import type { Department } from "@/lib/brands";
import type { AIProvider, ChatTurn } from "./types";
import { retrieveKnowledge } from "./knowledge";
import { buildSystemPrompt } from "./system-prompt";
import { routeDepartment, type RoutingDecision } from "./router";
import { createClaudeProvider } from "./providers/claude";
import { createOpenAIProvider } from "./providers/openai";
import { createGeminiProvider } from "./providers/gemini";

export type { AIProvider, ChatTurn } from "./types";
export { routeDepartment } from "./router";
export { retrieveKnowledge, searchKnowledge } from "./knowledge";
export { detectAction, shouldEscalate, suggestFollowUps } from "./intents";

/**
 * Resolve the configured AI provider. Selection is driven by AI_PROVIDER so
 * Cakestry AI Assistant provider resolver. Selection is driven by AI_PROVIDER so
 * model, or Gemini without any code change.
 */
export function getProvider(): AIProvider {
  switch (config.ai.provider) {
    case "openai":
      return createOpenAIProvider(false);
    case "ollama":
      return createOpenAIProvider(true);
    case "gemini":
      return createGeminiProvider();
    case "claude":
    default:
      return createClaudeProvider();
  }
}

export interface AssistantContext {
  /** Department pinned to the conversation so far (null = not yet chosen). */
  department: Department | null;
  /** Explicit pick from the welcome menu or department switcher. */
  requestedDepartment?: Department | null;
}

export interface AssistantPlan {
  department: Department | null;
  language: Language;
  routing: RoutingDecision;
  system: string;
}

/**
 * Work out how to handle this turn *before* any tokens are generated:
 * which business it belongs to, which language to answer in, and what system
 * prompt that combination produces.
 *
 * Kept separate from streaming so the API route can send a `meta` event to the
 * client immediately — the UI re-themes to the right brand while the model is
 * still thinking.
 */
export function planAssistantTurn(
  messages: ChatTurn[],
  context: AssistantContext
): AssistantPlan {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text = lastUser?.content ?? "";

  // An explicit pick from the UI always wins over inference.
  const routing: RoutingDecision = context.requestedDepartment
    ? {
        department: context.requestedDepartment,
        confidence: 1,
        switched:
          context.department != null &&
          context.department !== context.requestedDepartment,
        reason: "Selected by the user in the interface.",
      }
    : routeDepartment(text, context.department, messages);

  const language = detectLanguage(text);
  const relevant = routing.department
    ? retrieveKnowledge(routing.department, text)
    : [];

  return {
    department: routing.department,
    language,
    routing,
    system: buildSystemPrompt({
      department: routing.department,
      language,
      relevant,
      switched: routing.switched,
    }),
  };
}

/**
 * Stream the assistant's reply for a pre-computed plan.
 *
 * History is trimmed to the last 20 turns: enough for genuine conversation
 * memory, bounded enough to keep latency and token cost predictable.
 */
export async function* streamAssistantReply(
  messages: ChatTurn[],
  plan: AssistantPlan
): AsyncGenerator<string, void, unknown> {
  const provider = getProvider();
  yield* provider.streamChat({
    system: plan.system,
    messages: messages.slice(-20),
  });
}
