import type { MenuEntry } from "@/types";
import { INSTITUTE_COURSES } from "./courses";

/**
 * Cakestry Special Events conversation menu.
 */
export const INSTITUTE_MENU: MenuEntry[] = [
  {
    id: "in-about",
    label: "About Special Events",
    labelUr: "اسپیشل ایونٹس کے بارے میں",
    prompt: "Tell me about Cakestry Special Events & Gift Boxes.",
  },
  {
    id: "in-courses",
    label: "Packages & Catering",
    labelUr: "پیکیجز اور کیٹرنگ",
    prompt: "What packages do you offer?",
    children: INSTITUTE_COURSES.map((course) => ({
      id: `in-course-${course.slug}`,
      label: course.name,
      labelUr: course.name,
      prompt: `Tell me about ${course.name} — included items, guest count, and pricing.`,
    })),
  },
  {
    id: "in-admissions",
    label: "Book Event Catering",
    labelUr: "ایونٹ بک کریں",
    prompt: "I want to book event catering.",
    action: { kind: "ADMISSION_FORM" },
  },
  {
    id: "in-contact",
    label: "Contact Events Team",
    labelUr: "رابطہ کریں",
    prompt: "How do I contact the event management team?",
  },
];

export const INSTITUTE_SUGGESTIONS = [
  {
    title: "Party Catering Package",
    titleUr: "پارٹی کیٹرنگ پیکیج",
    prompt: "Tell me about the Birthday Party Catering Package.",
  },
  {
    title: "Corporate Gift Boxes",
    titleUr: "کارپوریٹ گفٹ باکسز",
    prompt: "Tell me about Corporate Gift Boxes pricing and minimum order.",
  },
];

export const INSTITUTE_QUICK_REPLIES = [
  "Party Packages",
  "Gift Boxes",
  "Book Event",
  "Bahawal Nagar Delivery",
  "اردو میں بتائیں",
];
