import type { KnowledgeEntry } from "@/types";
import { BRANDS } from "@/lib/brands";
import { INSTITUTE_COURSES } from "./courses";

/**
 * =============================================================================
 *  Cakestry Special Events & Gift Boxes — Knowledge Base
 * =============================================================================
 */

const brand = BRANDS.INSTITUTE;

const INSTITUTE_ENTRIES: KnowledgeEntry[] = [
  {
    id: "in-about",
    department: "INSTITUTE",
    kind: "ARTICLE",
    category: "About",
    question: "Tell me about Cakestry Special Events & Gift Boxes.",
    answer: `${brand.description}\n\nWe provide **Birthday Party Catering**, **Dessert Tables**, and **Corporate Gift Boxes** delivered across Bahawal Nagar.`,
    keywords: ["about", "events", "catering", "party catering", "gift box", "cakestry events"],
  },
  {
    id: "in-contact",
    department: "INSTITUTE",
    kind: "ARTICLE",
    category: "Contact",
    question: "How do I contact the events team?",
    answer: `**Phone / WhatsApp:** ${brand.contact.phone} / ${brand.contact.whatsapp}\n**Email:** ${brand.contact.email}\n**Office:** ${brand.contact.address}, ${brand.contact.city}\n**Hours:** ${brand.contact.hours}`,
    keywords: ["contact", "phone", "number", "email", "address"],
  },
];

const COURSE_ENTRIES: KnowledgeEntry[] = INSTITUTE_COURSES.map((course) => ({
  id: `in-course-${course.slug}`,
  department: "INSTITUTE" as const,
  kind: "COURSE" as const,
  category: "Packages",
  question: `Tell me about ${course.name}.`,
  answer: [
    `**${course.name}** — ${course.tagline}`,
    "",
    `**Overview**\n${course.overview}`,
    "",
    `**Included Items**\n${course.curriculum.map((c) => `- ${c}`).join("\n")}`,
    "",
    `**Pricing**\n${course.fee.startingAt} · ${course.fee.model}`,
  ].join("\n"),
  keywords: [course.slug.replace(/-/g, " "), course.name.toLowerCase(), ...course.keywords],
}));

export const INSTITUTE_KNOWLEDGE_BASE: KnowledgeEntry[] = [
  ...INSTITUTE_ENTRIES,
  ...COURSE_ENTRIES,
];

export const INSTITUTE_KB_CATEGORIES = Array.from(
  new Set(INSTITUTE_KNOWLEDGE_BASE.map((e) => e.category))
);
