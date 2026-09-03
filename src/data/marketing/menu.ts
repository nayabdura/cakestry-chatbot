import type { MenuEntry } from "@/types";
import { MARKETING_SERVICES } from "./services";

/**
 * Cakestry Bakery conversation menu.
 */
export const MARKETING_MENU: MenuEntry[] = [
  {
    id: "mk-about",
    label: "About Cakestry Bakery",
    labelUr: "کیکسٹری بیکری کے بارے میں",
    prompt: "Tell me about Cakestry Bakery — who you are and what you do.",
  },
  {
    id: "mk-services",
    label: "Cake Menu & Items",
    labelUr: "کیک مینو اور آئٹمز",
    prompt: "What cakes and bakery items does Cakestry Bakery offer?",
    children: MARKETING_SERVICES.map((service) => ({
      id: `mk-service-${service.slug}`,
      label: service.name,
      labelUr: service.name,
      prompt: `Tell me about ${service.name} — overview, flavor list, pricing and delivery details.`,
    })),
  },
  {
    id: "mk-reviews",
    label: "Customer Reviews",
    labelUr: "کسٹمرز کی رائے",
    prompt: "What do your customers say about Cakestry Bakery?",
  },
  {
    id: "mk-quote",
    label: "Order Custom Cake",
    labelUr: "کیک آرڈر کریں",
    prompt: "I'd like to place a custom cake order.",
    action: { kind: "QUOTE_FORM" },
  },
  {
    id: "mk-consultation",
    label: "Book Tasting Session",
    labelUr: "ٹیسٹنگ بُک کریں",
    prompt: "I'd like to book a free cake tasting session.",
    action: { kind: "MEETING_FORM" },
  },
  {
    id: "mk-support",
    label: "Order Support",
    labelUr: "آرڈر سپورٹ",
    prompt: "I need support with an existing order.",
    action: { kind: "SUPPORT_FORM" },
  },
  {
    id: "mk-contact",
    label: "Contact & Location",
    labelUr: "رابطہ اور لوکیشن",
    prompt: "How can I contact Cakestry Bakery or visit the store?",
  },
];

export const MARKETING_SUGGESTIONS = [
  {
    title: "Order Birthday Cake",
    titleUr: "سالگرہ کا کیک آرڈر کریں",
    prompt: "I want to order a custom birthday cake. What flavors are available?",
  },
  {
    title: "Wedding Tiered Cakes",
    titleUr: "ویڈنگ کیکس",
    prompt: "Tell me about wedding cake designs and pricing.",
  },
  {
    title: "Pastry Slices & Brownies",
    titleUr: "پیسٹریز اور براؤنیز",
    prompt: "What fresh pastries and brownie boxes do you have today?",
  },
  {
    title: "Delivery Areas",
    titleUr: "ڈیلیوری کی تفصیلات",
    prompt: "Do you deliver cakes in Bahawal Nagar?",
  },
];

export const MARKETING_QUICK_REPLIES = [
  "Cake Prices",
  "Order Custom Cake",
  "Flavors Available",
  "Bahawal Nagar Delivery",
  "اردو میں بتائیں",
];
