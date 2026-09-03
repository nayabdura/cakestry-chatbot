/**
 * =============================================================================
 *  Intent detection
 * =============================================================================
 *
 *  Turns a free-text message into the structured things the API layer needs:
 *
 *    • `detectAction()`    — should the client open a form (quote, meeting,
 *      admission, support, career guidance) instead of collecting eight fields
 *      across eight conversational turns?
 *    • `shouldEscalate()`  — does this need a human, and therefore a ticket?
 *    • `suggestFollowUps()`— the quick-reply chips offered after the answer.
 *
 *  All of it is deterministic keyword work. The model writes the prose; this
 *  module decides what the product does, so behaviour stays predictable and
 *  testable rather than depending on the model remembering to emit a marker.
 * =============================================================================
 */
import type { Department } from "@/lib/brands";
import type { ChatAction } from "@/types";
import { matchService } from "@/data/marketing/services";
import { matchCourse } from "@/data/institute/courses";

// ------------------------------------------------------------ Escalation ----

const ESCALATION_TRIGGERS = [
  "talk to a human", "speak to a human", "talk to someone", "speak to someone",
  "real person", "human agent", "customer service", "call me", "call back",
  "callback", "admission officer", "sales team", "your team", "representative",
  "complaint", "complain", "refund", "not happy", "unhappy", "disappointed",
  "not helpful", "useless", "frustrated", "escalate", "manager", "supervisor",
  "legal", "shikayat", "baat karni hai", "baat karwao", "banda", "insan se baat",
];

/**
 * Should this exchange be escalated to a human, with a tracking ticket?
 * Used by the chat route to attach a ticket reference to the reply.
 */
export function shouldEscalate(message: string): boolean {
  const text = normalise(message);
  return ESCALATION_TRIGGERS.some((trigger) => text.includes(trigger));
}

// ------------------------------------------------------- Workflow actions ---

const QUOTE_TRIGGERS = [
  "quote", "quotation", "estimate", "how much would it cost", "send me a price",
  "price list", "pricing for", "proposal", "budget kitna", "rate kya",
];

const MEETING_TRIGGERS = [
  "book a meeting", "book meeting", "schedule a call", "schedule a meeting",
  "consultation", "appointment", "meet you", "zoom", "google meet",
  "office visit", "visit your office", "meeting rakhni", "meeting book",
];

const SUPPORT_TRIGGERS = [
  "support ticket", "raise a ticket", "open a ticket", "technical issue",
  "not working", "broken", "bug", "error", "billing issue", "invoice issue",
  "existing project", "my website is", "my bot is",
];

const ADMISSION_TRIGGERS = [
  "apply for admission", "want admission", "admission chahiye", "daakhla",
  "dakhla", "i want to enroll", "i want to enrol", "enroll me", "register me",
  "join the course", "join this course", "admission form", "admission process",
  "admission karwana", "admission lena",
];

const CAREER_TRIGGERS = [
  "which course should i", "which course is best for me", "confused about course",
  "guide me", "career guidance", "suggest a course", "recommend a course",
  "not sure which course", "kaunsa course", "konsa course", "course suggest",
  "what should i learn",
];

/**
 * Decide whether the client should open a structured form after this turn.
 *
 * Returns `undefined` for ordinary informational messages — most turns are just
 * conversation and should not be interrupted by a form.
 */
export function detectAction(
  message: string,
  department: Department | null
): ChatAction | undefined {
  if (!department) return undefined;
  const text = normalise(message);

  if (department === "MARKETING") {
    if (hit(text, QUOTE_TRIGGERS)) {
      return { kind: "QUOTE_FORM", subject: matchService(text)?.slug };
    }
    if (hit(text, MEETING_TRIGGERS)) {
      return { kind: "MEETING_FORM", subject: matchService(text)?.slug };
    }
    if (hit(text, SUPPORT_TRIGGERS)) {
      return { kind: "SUPPORT_FORM" };
    }
    return undefined;
  }

  if (hit(text, ADMISSION_TRIGGERS)) {
    return { kind: "ADMISSION_FORM", subject: matchCourse(text)?.slug };
  }
  if (hit(text, CAREER_TRIGGERS)) {
    return { kind: "CAREER_FORM" };
  }
  if (hit(text, MEETING_TRIGGERS)) {
    return { kind: "MEETING_FORM" };
  }
  if (hit(text, SUPPORT_TRIGGERS)) {
    return { kind: "SUPPORT_FORM" };
  }
  return undefined;
}

// -------------------------------------------------------- Follow-up chips ---

/**
 * Context-aware quick replies shown after an answer. Deliberately short — these
 * are chips, not sentences — and always department-appropriate.
 */
export function suggestFollowUps(
  department: Department | null,
  message: string
): string[] {
  if (!department) {
    return ["🎂 Cakestry Bakery", "🧁 Cakestry Events"];
  }

  const text = normalise(message);

  if (department === "MARKETING") {
    const service = matchService(text);
    if (service) {
      return [
        `${service.name} pricing`,
        `${service.name} process`,
        "See portfolio",
        "Request a quote",
        "Book a consultation",
      ];
    }
    if (hit(text, ["price", "cost", "pricing", "budget", "rate"])) {
      return ["Request a quote", "Book a consultation", "What's included?", "See portfolio"];
    }
    return [
      "Our services",
      "Portfolio",
      "Request a quote",
      "Book a consultation",
      "Talk to the team",
    ];
  }

  const course = matchCourse(text);
  if (course) {
    return [
      `${course.name} fee`,
      `${course.name} curriculum`,
      "Next batch",
      "Apply for admission",
      "Instalment plan",
    ];
  }
  if (hit(text, ["fee", "fees", "cost", "price", "instalment", "installment"])) {
    return ["Instalment plan", "Scholarships", "Apply for admission", "Next batch"];
  }
  return [
    "Courses",
    "Fee structure",
    "Next batch",
    "Apply for admission",
    "Career guidance",
  ];
}

// ------------------------------------------------------------------ utils ---

function normalise(text: string): string {
  return ` ${(text ?? "").toLowerCase().replace(/\s+/g, " ").trim()} `;
}

function hit(text: string, triggers: readonly string[]): boolean {
  return triggers.some((trigger) => text.includes(trigger));
}
