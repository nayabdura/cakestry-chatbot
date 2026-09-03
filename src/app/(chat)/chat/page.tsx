import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Cake } from "lucide-react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { CakestryBranding } from "@/components/branding/CakestryBranding";
import { BRANDING } from "@/lib/branding";
import { BRANDS } from "@/lib/brands";

export const metadata: Metadata = {
  title: "Cakestry AI Assistant",
  description:
    "Chat with the Cakestry Bakery AI Assistant — custom cakes, birthday & wedding cakes, pastries, event catering and gift boxes in Bahawal Nagar.",
};

export default function ChatPage() {
  return (
    <div className="bg-gradient-to-r from-orange-700 via-orange-800 to-amber-900 flex min-h-dvh flex-col items-center justify-center p-0 sm:p-6">
      <div className="flex h-dvh w-full max-w-4xl flex-col overflow-hidden bg-card shadow-glow sm:h-[min(92dvh,940px)] sm:rounded-3xl">
        {/* Widget header */}
        <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-orange-600 text-white shadow-soft">
              <Cake className="size-5" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold">{BRANDING.product.name}</span>
              <span className="text-[11px] text-muted-foreground">
                {BRANDS.MARKETING.emoji} {BRANDS.MARKETING.shortName} ·{" "}
                {BRANDS.INSTITUTE.emoji} {BRANDS.INSTITUTE.shortName}
              </span>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-3.5" /> Home
          </Link>
        </header>

        {/* Chat */}
        <div className="min-h-0 flex-1">
          <ChatWindow />
        </div>

        {/* Chat widget footer — branding */}
        <div className="border-t bg-card px-4 py-2.5">
          <CakestryBranding className="justify-center" />
        </div>
      </div>
    </div>
  );
}
