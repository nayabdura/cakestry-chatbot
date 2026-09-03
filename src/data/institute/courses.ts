import type { CourseItem } from "@/types";

/**
 * =============================================================================
 *  Cakestry Special Events & Gift Boxes — Package Catalogue
 * =============================================================================
 */

const FEE_NOTE =
  "Indicative package price — final quote is confirmed by our event manager based on guest count and location.";

const STANDARD_INSTALMENTS = [
  { label: "Booking Advance", detail: "50% advance to confirm event date slot" },
  { label: "Balance Payment", detail: "50% on event morning / setup completion" },
];

export const INSTITUTE_COURSES: CourseItem[] = [
  {
    slug: "party-catering-package",
    name: "Birthday Party Catering Package",
    group: "Event Catering",
    tagline: "Complete dessert table & custom cake setup for birthdays.",
    overview:
      "A complete sweet bar setup for birthday parties: includes a 3-pound custom cake, 24 cupcakes, 20 brownie bites, 20 mini eclairs, and decorative display tables.",
    curriculum: [
      "Custom 3-Pound Fondant Cake",
      "24 Themed Cupcakes",
      "20 Fudgy Brownie Bites",
      "20 Mini Belgian Eclairs",
      "Table Decor & Display Stand Setup",
    ],
    duration: "Full event duration support",
    fee: { startingAt: "From PKR 15,000", model: "Complete Package", note: FEE_NOTE },
    instalments: STANDARD_INSTALMENTS,
    trainer: "Senior Bakery Event Stylist",
    careers: ["Personal Birthday Celebrations", "Kids Parties"],
    projects: ["Customized themed setup with helium balloon backdrops (optional)"],
    certification: "Cakestry Quality Guarantee",
    eligibility: "Advance booking required 3 days prior",
    keywords: ["party catering", "dessert table", "birthday package", "sweet bar", "event catering"],
  },

  {
    slug: "corporate-gift-boxes",
    name: "Corporate Cake & Gift Boxes",
    group: "Corporate Gifts",
    tagline: "Gourmet cake boxes for clients, staff, and festivals.",
    overview:
      "Custom branded bakery gift boxes featuring gourmet brownies, macaroons, cup cakes, and personalized corporate greeting cards.",
    curriculum: [
      "Custom Branded Rigid Box Packaging",
      "4-Piece / 6-Piece Gourmet Assortments",
      "Personalized Corporate Cards & Ribbons",
      "Doorstep Bulk Delivery in Bahawal Nagar",
    ],
    duration: "Bulk order turnaround: 24–48 hours",
    fee: { startingAt: "From PKR 1,200 / box", model: "Per Box (Min 10 boxes)", note: FEE_NOTE },
    instalments: STANDARD_INSTALMENTS,
    trainer: "Corporate Order Coordinator",
    careers: ["Corporate Gifting", "Eid Gifts", "New Year Gifts"],
    projects: ["Custom company logo printed on edible toppers"],
    certification: "Cakestry Corporate Partner",
    eligibility: "Minimum 10 boxes per order",
    keywords: ["gift box", "corporate gifts", "brownie box", "eid gifts", "custom box"],
  },
];

export const COURSE_GROUPS = [
  "Event Catering",
  "Corporate Gifts",
] as const;

export function findCourse(slug: string): CourseItem | undefined {
  return INSTITUTE_COURSES.find((c) => c.slug === slug);
}

export function matchCourse(text: string): CourseItem | undefined {
  const q = text.toLowerCase();
  let best: { course: CourseItem; score: number } | null = null;
  for (const course of INSTITUTE_COURSES) {
    let score = 0;
    if (q.includes(course.name.toLowerCase())) score += 5;
    for (const kw of course.keywords) if (q.includes(kw)) score += 2;
    if (score > (best?.score ?? 0)) best = { course, score };
  }
  return best && best.score >= 2 ? best.course : undefined;
}
