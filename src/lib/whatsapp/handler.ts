import { Prisma } from "@prisma/client";
import type { Language as PrismaLanguage } from "@prisma/client";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { rateLimit } from "@/lib/redis";
import { logEvent, notifyTeam } from "@/lib/notify";
import { generateReference, shortId } from "@/lib/utils";
import { detectLanguage, type Language } from "@/lib/i18n";
import { BRANDS, type Department } from "@/lib/brands";
import {
  planAssistantTurn,
  shouldEscalate,
  streamAssistantReply,
  type ChatTurn,
} from "@/lib/ai";
import { parseCustomerInputNLU } from "@/lib/ai/nlu";
import { verifyPaymentScreenshot } from "./payment-verifier";
import { markAsRead, sendButtons, sendList, sendText, toDisplayPhone } from "./client";
import {
  busyNotice,
  escalationNotice,
  optOutConfirmation,
} from "./copy";
import type { InboundMessage } from "./types";
import {
  processCakestryTurn,
  type CakestryStateData,
} from "./cakestry-state";
import { calculateOrderTotals, SADAPAY_DETAILS } from "@/lib/cakestry";

/**
 * =============================================================================
 *  WhatsApp conversation handler for Cakestry Bakery
 * =============================================================================
 */

const LANGUAGE_MAP: Record<Language, PrismaLanguage> = {
  en: "EN",
  ur: "UR",
  ur_roman: "UR_ROMAN",
  pa: "PA",
};

const THREAD_WINDOW_MS = 24 * 60 * 60 * 1000;

const MENU_WORDS = ["menu", "start", "restart", "hi", "hello", "hey", "salam", "assalam o alaikum", "assalamualaikum", "aoa", "السلام علیکم", "مینو"];
const STOP_WORDS = ["stop", "unsubscribe", "opt out", "band karo", "do not message me", "broadcast band karo"];

export async function handleInbound(message: InboundMessage): Promise<void> {
  try {
    await route(message);
  } catch (error) {
    console.error("[whatsapp] handler failed:", error);
    await logEvent({
      level: "ERROR",
      action: "whatsapp.handler.failed",
      entity: "WhatsappContact",
      entityId: message.waId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function route(message: InboundMessage): Promise<void> {
  const waId = message.waId;
  const phone = toDisplayPhone(waId);

  const { allowed } = await rateLimit(`whatsapp:${waId}`, 20, 60);
  if (!allowed) {
    console.warn("[whatsapp] rate limited:", waId);
    return;
  }

  const contact = await upsertContact(message, phone);
  if (contact.isBlocked) return;

  const conversation = await resolveConversation(waId, phone, contact.profileName, contact.department || "MARKETING");

  const stored = await recordInbound(conversation.id, message, conversation.department || "MARKETING");
  if (!stored) return;

  void markAsRead(message.id).catch(() => {});

  const language = resolveLanguage(message, conversation.language);
  const context: Context = {
    waId,
    phone,
    language,
    conversationId: conversation.id,
    department: conversation.department || "MARKETING",
    profileName: contact.profileName ?? undefined,
  };

  const answer = message.replyId ?? message.text;
  const lowered = answer.trim().toLowerCase();

  // 1. Subscription Controls (STOP / Unsubscribe keeps contact record, orders, and history intact!)
  if (STOP_WORDS.some((word) => lowered.includes(word))) {
    await prisma.whatsappContact.update({ where: { waId }, data: { optedOut: true } });
    await say(context, optOutConfirmation(language));
    return;
  }
  if (contact.optedOut && MENU_WORDS.includes(lowered)) {
    await prisma.whatsappContact.update({ where: { waId }, data: { optedOut: false } });
  }

  // 2. Media & Payment Verification Screenshot check
  const storedCapture = conversation.capture ? (conversation.capture as unknown as CakestryStateData) : null;
  const isPaymentStep = storedCapture?.step === "PAYMENT_VERIFICATION";

  if (message.kind === "media" || (isPaymentStep && (lowered.includes("sadapay") || lowered.includes("trx") || lowered.includes("transaction")))) {
    const expectedTotal = storedCapture?.orderDraft.total || 0;
    const mediaContent = message.text || message.mediaKind || "SadaPay Payment Receipt";

    const verification = await verifyPaymentScreenshot(mediaContent, expectedTotal, message.kind === "media");

    await say(context, verification.customerMessage);

    if (verification.status === "verified") {
      if (storedCapture) {
        await recordCompletedOrder(context, storedCapture);
      }
      await clearCapture(conversation.id);
    }
    return;
  }

  // 3. Structured AI NLU Extraction
  const currentCartProducts = storedCapture?.orderDraft?.items?.map((i) => i.productId) || [];
  const nluResult = await parseCustomerInputNLU(answer, storedCapture?.step, currentCartProducts);

  // 4. Deterministic Cakestry State Machine Turn
  const outcome = processCakestryTurn(storedCapture, answer, language, phone, nluResult);

  // 5. Structured State Transition Logging
  console.log(`[STATE_TRANSITION] ${JSON.stringify({
    phone,
    messageId: message.id,
    previousState: storedCapture?.step || "INITIAL",
    intent: nluResult.intent,
    newState: outcome.state.step,
    language: outcome.state.language,
  })}`);

  if (outcome.handled) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { capture: outcome.state as unknown as Prisma.InputJsonValue },
    });

    await say(context, outcome.reply.text, {
      buttons: outcome.reply.buttons,
      list: outcome.reply.list,
      footer: outcome.reply.footer,
    });

    if (outcome.completeOrder) {
      await recordCompletedOrder(context, outcome.state);
    }
    if (outcome.completeCustomCake) {
      await recordCustomCakeInquiry(context, outcome.state);
    }
    if (outcome.escalate) {
      await escalate(context, "MARKETING", message.text);
    }
    return;
  }

  // 6. Freeform natural language question answered by ChatGPT Assistant
  const history = await loadHistory(conversation.id);
  const plan = planAssistantTurn(history, { department: "MARKETING" });
  await answerWithAssistant(context, history, plan);
}

// ------------------------------------------------------------------ Context --

interface Context {
  waId: string;
  phone: string;
  language: Language;
  conversationId: string;
  department: Department | null;
  profileName?: string;
}

// ------------------------------------------------------------- Conversation --

async function upsertContact(message: InboundMessage, phone: string) {
  return prisma.whatsappContact.upsert({
    where: { waId: message.waId },
    update: {
      lastInboundAt: message.timestamp,
      ...(message.profileName ? { profileName: message.profileName } : {}),
    },
    create: {
      waId: message.waId,
      phone,
      profileName: message.profileName,
      lastInboundAt: message.timestamp,
    },
  });
}

async function resolveConversation(
  waId: string,
  phone: string,
  profileName: string | null,
  department: Department | null
) {
  const since = new Date(Date.now() - THREAD_WINDOW_MS);

  const existing = await prisma.conversation.findFirst({
    where: { channel: "WHATSAPP", contactPhone: phone, updatedAt: { gte: since } },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    if (profileName && !existing.contactName) {
      return prisma.conversation.update({
        where: { id: existing.id },
        data: { contactName: profileName, title: `WhatsApp · ${profileName}` },
      });
    }
    return existing;
  }

  return prisma.conversation.create({
    data: {
      reference: `WA-CONV-${shortId(10)}`,
      channel: "WHATSAPP",
      contactPhone: phone,
      contactName: profileName,
      department: department || "MARKETING",
      title: profileName ? `WhatsApp · ${profileName}` : `WhatsApp · ${phone}`,
    },
  });
}

async function recordInbound(
  conversationId: string,
  message: InboundMessage,
  department: Department | null
): Promise<boolean> {
  const content =
    message.text ||
    (message.kind === "media" ? `[${message.mediaKind ?? "attachment"}]` : "[unsupported message]");

  try {
    await prisma.message.create({
      data: {
        conversationId,
        role: "USER",
        content,
        department: department || "MARKETING",
        language: LANGUAGE_MAP[detectLanguage(message.text)],
        externalId: message.id,
      },
    });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      console.info("[whatsapp] duplicate delivery ignored:", message.id);
      return false;
    }
    throw error;
  }
}

async function loadHistory(conversationId: string): Promise<ChatTurn[]> {
  const rows = await prisma.message.findMany({
    where: { conversationId, role: { in: ["USER", "ASSISTANT"] } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { role: true, content: true },
  });

  return rows
    .reverse()
    .map((row) => ({
      role: row.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: row.content,
    }))
    .filter((turn) => turn.content.trim().length > 0);
}

function resolveLanguage(message: InboundMessage, stored: PrismaLanguage): Language {
  if (message.kind === "reply" || !message.text.trim()) {
    const entry = Object.entries(LANGUAGE_MAP).find(([, value]) => value === stored);
    return (entry?.[0] as Language) ?? "en";
  }
  return detectLanguage(message.text);
}

// -------------------------------------------------------------- Responding --

async function say(
  context: Context,
  text: string,
  options?: { buttons?: Array<{ id: string; title: string }>; list?: { label: string; rows: Array<{ id: string; title: string; description?: string }> }; footer?: string }
): Promise<void> {
  const result = options?.list
    ? await sendList(context.waId, text, options.list.label, options.list.rows)
    : options?.buttons?.length
      ? await sendButtons(context.waId, text, options.buttons, options.footer)
      : await sendText(context.waId, text);

  await prisma.message
    .create({
      data: {
        conversationId: context.conversationId,
        role: "ASSISTANT",
        content: text,
        department: context.department || "MARKETING",
        language: LANGUAGE_MAP[context.language],
        externalId: result.messageId,
      },
    })
    .catch((error) => console.warn("[whatsapp] transcript write skipped:", error?.message));

  await prisma.conversation
    .update({
      where: { id: context.conversationId },
      data: { language: LANGUAGE_MAP[context.language], updatedAt: new Date() },
    })
    .catch(() => {});

  if (result.ok) {
    await prisma.whatsappContact
      .update({ where: { waId: context.waId }, data: { lastOutboundAt: new Date() } })
      .catch(() => {});
    return;
  }

  await logEvent({
    level: "ERROR",
    action: "whatsapp.send.failed",
    department: context.department,
    entity: "WhatsappContact",
    entityId: context.waId,
    message: result.error ?? "Unknown error sending to the WhatsApp Cloud API.",
    metadata: {
      to: context.phone,
      shape: options?.list ? "list" : options?.buttons?.length ? "buttons" : "text",
    },
  });
}

async function answerWithAssistant(
  context: Context,
  history: ChatTurn[],
  plan: ReturnType<typeof planAssistantTurn>
): Promise<void> {
  let text = "";
  try {
    for await (const chunk of streamAssistantReply(history, plan)) text += chunk;
  } catch (error) {
    console.error("[whatsapp] model error:", error);
    await say(context, busyNotice(context.department, context.language));
    return;
  }

  if (!text.trim()) {
    await say(context, busyNotice(context.department, context.language));
    return;
  }

  await say(context, text);
}

async function clearCapture(conversationId: string): Promise<void> {
  await prisma.conversation
    .update({ where: { id: conversationId }, data: { capture: Prisma.DbNull } })
    .catch(() => {});
}

async function recordCompletedOrder(context: Context, state: CakestryStateData): Promise<void> {
  const reference = `CK-ORD-${shortId(8)}`;
  const draft = state.orderDraft;
  const totals = calculateOrderTotals(draft.items, draft.deliveryType);

  const requirementsText = [
    `Cakestry Bakery WhatsApp Order`,
    `Delivery Type: ${draft.deliveryType || "DELIVERY"}`,
    draft.deliveryAddress ? `Delivery Address: ${draft.deliveryAddress}` : null,
    `Requested Time: ${draft.dateTime || "Not specified"}`,
    `Items:`,
    ...totals.itemized.map(
      (i) => `- ${i.quantity}x ${i.product.nameEn} ${i.cheeseAddon ? "(+Cheese)" : ""} = Rs. ${i.lineTotal}`
    ),
    `Subtotal: Rs. ${totals.subtotal}`,
    `Delivery Fee: Rs. ${totals.deliveryFee}`,
    `Total Amount: Rs. ${totals.total}`,
    `Payment Account Owner: ${SADAPAY_DETAILS.ownerName}`,
    `Payment Status: Verified / Complete`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const lead = await prisma.marketingLead.create({
      data: {
        reference,
        name: draft.customerName || context.profileName || context.phone,
        phone: draft.phone || context.phone,
        requirements: requirementsText,
        estimatedValue: totals.total,
        source: "WHATSAPP",
        stage: "QUALIFIED",
        conversationId: context.conversationId,
      },
    });

    await notifyTeam({
      department: "MARKETING",
      subject: `🎂 New Cakestry Order ${reference} — Rs. ${totals.total}`,
      body: requirementsText,
      link: `/admin/crm/leads/${lead.id}`,
    });

    await logEvent({
      action: "order.created",
      department: "MARKETING",
      entity: "MarketingLead",
      entityId: lead.id,
      message: `Order ${reference} placed on WhatsApp by ${context.phone}. Total Rs. ${totals.total}`,
    });
  } catch (error) {
    console.error("[whatsapp] recordCompletedOrder failed:", error);
  }
}

async function recordCustomCakeInquiry(context: Context, state: CakestryStateData): Promise<void> {
  const reference = `CK-CUST-${shortId(8)}`;
  const draft = state.customCakeDraft || {};

  const requirementsText = [
    `Cakestry Bakery Custom Cake Request`,
    `Weight: ${draft.weight || "Not specified"}`,
    `Flavor: ${draft.flavor || "Not specified"}`,
    `Design / Theme: ${draft.design || "Not specified"}`,
    `Event Date/Time: ${draft.dateTime || "Not specified"}`,
  ].join("\n");

  try {
    const ticket = await prisma.ticket.create({
      data: {
        reference,
        department: "MARKETING",
        subject: `🎨 Custom Cake Request from ${context.profileName || context.phone}`,
        description: requirementsText,
        contactName: context.profileName,
        contactPhone: context.phone,
        conversationId: context.conversationId,
      },
    });

    await notifyTeam({
      department: "MARKETING",
      subject: `🎨 Custom Cake Request ${reference}`,
      body: requirementsText,
      link: `/admin/tickets/${ticket.id}`,
    });
  } catch (error) {
    console.error("[whatsapp] recordCustomCakeInquiry failed:", error);
  }
}

async function escalate(
  context: Context,
  department: Department,
  request: string
): Promise<void> {
  const reference = generateReference("TKT", department);

  try {
    await prisma.ticket.create({
      data: {
        reference,
        department,
        category: "GENERAL",
        status: "OPEN",
        subject: "Human requested on WhatsApp",
        description: request || "The customer asked to speak to a person.",
        contactName: context.profileName ?? null,
        contactPhone: context.phone,
        conversationId: context.conversationId,
      },
    });

    await prisma.conversation.update({
      where: { id: context.conversationId },
      data: { handedOff: true },
    });

    await notifyTeam({
      department,
      subject: `WhatsApp handoff ${reference} — ${context.profileName ?? context.phone}`,
      body: [
        `A WhatsApp customer asked for a human.`,
        ``,
        `Ticket: ${reference}`,
        `WhatsApp: ${context.phone}`,
        context.profileName ? `Name: ${context.profileName}` : null,
        ``,
        `Their message:`,
        request || "—",
        ``,
        `Reply from ${BRANDS[department].contact.whatsapp} within 24 hours.`,
      ]
        .filter((line) => line !== null)
        .join("\n"),
      link: `/admin/support/tickets`,
    });

    await logEvent({
      action: "chat.escalated",
      department,
      entity: "Ticket",
      entityId: reference,
      message: `WhatsApp conversation handed to a human (${context.phone}).`,
      metadata: { channel: "WHATSAPP" },
    });
  } catch (error) {
    console.error("[whatsapp] escalation failed:", error);
  }

  await say(context, escalationNotice(department, context.language, reference));
}

export function autoReplyEnabled(): boolean {
  return config.whatsapp.enabled && config.whatsapp.autoReply;
}
