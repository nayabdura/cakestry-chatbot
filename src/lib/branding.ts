/**
 * Product-level branding for the Cakestry AI Assistant.
 *
 * `BRANDS` (src/lib/brands.ts) holds the two business profiles the assistant
 * routes between. This file holds the branding that sits ABOVE both of them —
 * the assistant's own identity and the Cakestry Bakery attribution rendered on
 * the splash screen, login, footer, about page, admin console and chat widget.
 */
import { BRANDS } from "./brands";

export const BRANDING = {
  product: {
    name: "Cakestry AI Assistant",
    shortName: "Cakestry AI",
    /** Umbrella group both businesses belong to. */
    group: "Cakestry Bakery",
    poweredBy: "Powered by Artificial Intelligence",
    description:
      "Official Customer Service & Order Assistant for Cakestry Bakery & Special Events in Bahawal Nagar.",
  },
  developer: {
    name: "Cakestry Bakery Bahawal Nagar",
    url: "https://cakestry.com",
    tagline: "Crafting Delicious Custom Cakes & Bakery Delights in Bahawal Nagar",
    attribution: "Designed & Developed for Cakestry Bakery Bahawal Nagar",
  },
  businesses: {
    marketing: BRANDS.MARKETING,
    institute: BRANDS.INSTITUTE,
  },
} as const;

/** Read a public branding value, allowing env overrides at build time. */
export const brandName =
  process.env.NEXT_PUBLIC_BRAND_NAME ?? BRANDING.developer.name;
export const brandUrl =
  process.env.NEXT_PUBLIC_BRAND_URL ?? BRANDING.developer.url;
export const brandTagline =
  process.env.NEXT_PUBLIC_BRAND_TAGLINE ?? BRANDING.developer.tagline;
