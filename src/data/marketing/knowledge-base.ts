import type { KnowledgeEntry } from "@/types";
import { BRANDS } from "@/lib/brands";
import { MARKETING_SERVICES } from "./services";

/**
 * =============================================================================
 *  Cakestry Bakery — Bakery Knowledge Base
 * =============================================================================
 */

const brand = BRANDS.MARKETING;

const COMPANY_ENTRIES: KnowledgeEntry[] = [
  {
    id: "mk-about",
    department: "MARKETING",
    kind: "ARTICLE",
    category: "About",
    question: "What is Cakestry Bakery and what do you offer?",
    answer: `${brand.description}\n\nWe specialize in **Custom Birthday Cakes**, **Tiered Wedding Cakes**, **Fresh Pastries**, and **Dessert Catering**. We are located in ${brand.contact.city} and deliver across all areas of Bahawal Nagar.`,
    keywords: ["about", "who are you", "cakestry bakery", "bakery bahawal nagar", "cakes", "what do you do"],
  },
  {
    id: "mk-why-us",
    department: "MARKETING",
    kind: "ARTICLE",
    category: "About",
    question: "Why should we order from Cakestry Bakery?",
    answer:
      "Three reasons our customers love us:\n\n1. **100% Fresh Daily:** Baked fresh on your order date using premium dairy cream & Belgian chocolate.\n2. **Custom Fondant Artists:** Custom 3D cake designs tailored to any theme or photo reference.\n3. **Safe Home Delivery:** Fast, temperature-controlled doorstep delivery in Bahawal Nagar.",
    keywords: ["why", "why choose", "best bakery", "cakestry advantage"],
  },
  {
    id: "mk-pricing",
    department: "MARKETING",
    kind: "POLICY",
    category: "Pricing",
    question: "How much do your cakes cost?",
    answer:
      "Cake pricing depends on weight (poundage) and fondant work. Indicative starting points:\n\n- Custom Birthday Cakes — from PKR 2,500 / 2 lbs\n- 2-Tier Wedding Cakes — from PKR 8,500\n- Fresh Pastry Slices — from PKR 250\n\nShare your theme and size requirements for an exact price quote!",
    keywords: ["price", "pricing", "cost", "cake price", "rate", "how much"],
  },
  {
    id: "mk-contact",
    department: "MARKETING",
    kind: "ARTICLE",
    category: "Contact",
    question: "How do I contact Cakestry Bakery?",
    answer: `**Phone / WhatsApp:** ${brand.contact.phone} / ${brand.contact.whatsapp}\n**Email:** ${brand.contact.email}\n**Bakery Address:** ${brand.contact.address}, ${brand.contact.city}\n**Opening Hours:** ${brand.contact.hours}\n**Website:** ${brand.contact.website}`,
    keywords: ["contact", "phone", "number", "email", "address", "location", "bakery address"],
  },
];

const SERVICE_ENTRIES: KnowledgeEntry[] = MARKETING_SERVICES.map((service) => ({
  id: `mk-service-${service.slug}`,
  department: "MARKETING" as const,
  kind: "SERVICE" as const,
  category: "Services",
  question: `Tell me about ${service.name}.`,
  answer: [
    `**${service.name}** — ${service.tagline}`,
    "",
    `**Overview**\n${service.overview}`,
    "",
    `**Highlights**\n${service.benefits.map((b) => `- ${b}`).join("\n")}`,
    "",
    `**Indicative pricing**\n${service.pricing.startingAt} · ${service.pricing.model}`,
  ].join("\n"),
  keywords: [service.slug.replace(/-/g, " "), service.name.toLowerCase(), ...service.keywords],
}));

export const MARKETING_KNOWLEDGE_BASE: KnowledgeEntry[] = [
  ...COMPANY_ENTRIES,
  ...SERVICE_ENTRIES,
];

export const MARKETING_KB_CATEGORIES = Array.from(
  new Set(MARKETING_KNOWLEDGE_BASE.map((e) => e.category))
);
