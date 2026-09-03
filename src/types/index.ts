/** Shared domain types used by both client and server code for Cakestry Bakery. */

import type { Department } from "@/lib/brands";
import type { Language } from "@/lib/i18n";

export type { Department, DepartmentSlug } from "@/lib/brands";
export type { Language } from "@/lib/i18n";

// ------------------------------------------------------------------- Chat ---

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  department?: Department | null;
  createdAt?: string;
}

export interface QuickReply {
  label: string;
  value?: string;
}

export type ChatActionKind =
  | "LEAD_FORM"
  | "MEETING_FORM"
  | "QUOTE_FORM"
  | "SUPPORT_FORM"
  | "ADMISSION_FORM"
  | "CAREER_FORM"
  | "CHOOSE_DEPARTMENT";

export interface ChatAction {
  kind: ChatActionKind;
  subject?: string;
}

export type ChatStreamEvent =
  | { type: "meta"; department: Department | null; language: Language }
  | { type: "chunk"; text: string }
  | {
      type: "done";
      ticketId?: string;
      department: Department | null;
      suggestions?: string[];
      action?: ChatAction;
    }
  | { type: "error"; message: string };

// -------------------------------------------------------- Knowledge base ----

export type KnowledgeKind =
  | "FAQ"
  | "ARTICLE"
  | "SERVICE"
  | "COURSE"
  | "POLICY"
  | "DOCUMENT";

export interface KnowledgeEntry {
  id: string;
  department: Department;
  kind: KnowledgeKind;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

// ------------------------------------------------------------- Catalogues ---

export interface PricePlaceholder {
  startingAt: string;
  model: string;
  note: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ServiceItem {
  slug: string;
  name: string;
  group: string;
  tagline: string;
  overview: string;
  benefits: string[];
  features: string[];
  process: string[];
  pricing: PricePlaceholder;
  portfolio: string[];
  faqs: FaqItem[];
  keywords: string[];
}

export interface CourseInstalment {
  label: string;
  detail: string;
}

export interface CourseItem {
  slug: string;
  name: string;
  group: string;
  tagline: string;
  overview: string;
  curriculum: string[];
  duration: string;
  fee: PricePlaceholder;
  instalments: CourseInstalment[];
  trainer: string;
  careers: string[];
  projects: string[];
  certification: string;
  eligibility: string;
  keywords: string[];
}

export interface MenuEntry {
  id: string;
  label: string;
  labelUr: string;
  prompt: string;
  action?: ChatAction;
  children?: MenuEntry[];
}

// ------------------------------------------------------------ Submissions ---

export interface LeadSubmission {
  name: string;
  company?: string;
  phone: string;
  email?: string;
  businessType?: string;
  service?: string;
  budget?: string;
  timeline?: string;
  requirements: string;
  conversationRef?: string;
}

export interface AdmissionSubmission {
  studentName: string;
  fatherName?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  qualification?: string;
  city?: string;
  course: string;
  preferredBatch?: string;
  notes?: string;
  conversationRef?: string;
}

export interface MeetingSubmission {
  department: Department;
  name: string;
  phone: string;
  email?: string;
  businessName?: string;
  preferredDate: string;
  preferredTime: string;
  mode: "OFFICE" | "ZOOM" | "GOOGLE_MEET" | "WHATSAPP";
  topic?: string;
  conversationRef?: string;
}

export interface TicketSubmission {
  department: Department;
  category: "TECHNICAL" | "BILLING" | "SALES" | "COMPLAINT" | "GENERAL";
  name: string;
  phone?: string;
  email?: string;
  subject: string;
  description: string;
  conversationRef?: string;
}

export interface SubmissionResult {
  ok: boolean;
  reference?: string;
  message: string;
}
