/**
 * =============================================================================
 *  Cakestry Bakery AI Assistant — Dual-department registry
 * =============================================================================
 *
 *  The assistant serves TWO bakery divisions under one Cakestry Bakery umbrella:
 *
 *    1. Cakestry Bakery & Custom Cakes — fresh cakes, pastries, custom birthday designs
 *    2. Cakestry Events & Special Orders — party catering, dessert tables, gift boxes
 *
 * =============================================================================
 */

/** The two business departments the assistant routes between. */
export type Department = "MARKETING" | "INSTITUTE";

/** All departments, in menu order. */
export const DEPARTMENTS: readonly Department[] = ["MARKETING", "INSTITUTE"] as const;

/** URL/database-friendly slug for a department. */
export type DepartmentSlug = "marketing" | "institute";

export interface BrandContact {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  hours: string;
  website: string;
  mapUrl?: string;
}

export interface BrandProfile {
  id: Department;
  slug: DepartmentSlug;
  /** Full public name. */
  name: string;
  /** Compact name for headers and chips. */
  shortName: string;
  /** Emoji used in the welcome menu and quick replies. */
  emoji: string;
  /** One-line positioning statement. */
  tagline: string;
  /** Two-sentence description used on the landing page and in the AI prompt. */
  description: string;
  /** What this business exists to do — fed to the system prompt as scope. */
  purpose: readonly string[];
  /** Prefix for every reference id this business generates (leads, tickets…). */
  referencePrefix: string;
  /** Theme applied via `data-department` on a wrapping element. */
  theme: {
    /** Tailwind gradient stops used for hero panels and splash. */
    gradient: string;
    /** Accent colour name, for docs only — real values live in globals.css. */
    accentName: string;
  };
  contact: BrandContact;
}

export const BRANDS: Record<Department, BrandProfile> = {
  MARKETING: {
    id: "MARKETING",
    slug: "marketing",
    name: "Cakestry Bakery & Custom Cakes",
    shortName: "Cakestry Bakery",
    emoji: "🎂",
    tagline: "Crafting Delicious Custom Cakes & Bakery Delights in Bahawal Nagar.",
    description:
      "Cakestry Bakery is Bahawal Nagar's premier custom cake and bakery shop. We specialize in custom birthday cakes, wedding cakes, fondant designs, fresh pastries, and bakery items with fast local delivery.",
    purpose: [
      "Custom Cakes",
      "Fresh Bakery Items",
      "Birthday & Wedding Cakes",
      "Pastries & Desserts",
    ],
    referencePrefix: "CB",
    theme: {
      gradient: "from-[#ea580c] via-[#c2410c] to-[#9a3412]",
      accentName: "Bakery Amber",
    },
    contact: {
      phone: "0329-3110006",
      whatsapp: "0329-3110006",
      email: "cakestrybakery@gmail.com",
      address: "Jail Road, Bahawalnagar, Pakistan",
      city: "Bahawalnagar, Punjab, Pakistan",
      hours: "Every day, Monday to Sunday, 11:00 AM – 2:00 AM",
      website: "http://chatbot.cakestrybakery.com",
    },
  },

  INSTITUTE: {
    id: "INSTITUTE",
    slug: "institute",
    name: "Cakestry Special Events & Gift Boxes",
    shortName: "Cakestry Events",
    emoji: "🧁",
    tagline: "Special Event Catering, Dessert Tables & Gourmet Gift Boxes.",
    description:
      "Cakestry Special Events offers party catering, corporate cake gift boxes, dessert tables, and custom anniversary packages with doorstep delivery across Bahawalnagar.",
    purpose: ["Event Catering", "Dessert Tables", "Corporate Gift Boxes", "Custom Orders"],
    referencePrefix: "CE",
    theme: {
      gradient: "from-[#9d174d] via-[#be185d] to-[#831843]",
      accentName: "Berry Rose",
    },
    contact: {
      phone: "0329-3110006",
      whatsapp: "0329-3110006",
      email: "cakestrybakery@gmail.com",
      address: "Jail Road, Bahawalnagar, Pakistan",
      city: "Bahawalnagar, Punjab, Pakistan",
      hours: "Every day, Monday to Sunday, 11:00 AM – 2:00 AM",
      website: "http://chatbot.cakestrybakery.com",
    },
  },
};

/** Resolve a brand profile. Returns `null` for an undetermined department. */
export function brand(department: Department): BrandProfile;
export function brand(department: Department | null | undefined): BrandProfile | null;
export function brand(department: Department | null | undefined): BrandProfile | null {
  return department ? BRANDS[department] : null;
}

/** Map a slug (`"marketing"`) back to a department (`"MARKETING"`). */
export function departmentFromSlug(slug: string): Department | null {
  const normalised = slug.trim().toLowerCase();
  if (normalised === "marketing") return "MARKETING";
  if (normalised === "institute") return "INSTITUTE";
  return null;
}

/** Narrow an untrusted value to a `Department`. */
export function asDepartment(value: unknown): Department | null {
  return value === "MARKETING" || value === "INSTITUTE" ? value : null;
}
