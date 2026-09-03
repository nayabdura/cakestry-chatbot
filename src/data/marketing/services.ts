import type { ServiceItem } from "@/types";

/**
 * =============================================================================
 *  Cakestry Bakery & Custom Cakes — Product & Service Catalogue
 * =============================================================================
 */

const PRICE_NOTE =
  "Indicative starting point only — final price depends on weight, custom fondant work, and delivery area in Bahawal Nagar.";

export const MARKETING_SERVICES: ServiceItem[] = [
  // ------------------------------------------------------------ Custom Cakes
  {
    slug: "custom-birthday-cakes",
    name: "Custom Birthday Cakes",
    group: "Custom Cakes",
    tagline: "Handcrafted birthday cakes with personalized fondant themes.",
    overview:
      "We design custom birthday cakes tailored to any theme — kids' cartoons, floral designs, sports, elegant gold drip, and 3D fondant characters. Available in 2 lbs, 3 lbs, 5 lbs, and multi-tier sizes.",
    benefits: [
      "100% fresh baked on your delivery date",
      "Custom name and age fondant writing included",
      "Available in Chocolate Fudge, Red Velvet, Vanilla Sponge & Lotus Biscoff",
      "Same-day order pickup and doorstep delivery in Bahawal Nagar",
    ],
    features: [
      "Flavors: Chocolate Fudge, Red Velvet, Lotus Biscoff, Nutella, Vanilla Berry",
      "Custom weight: 2 lbs, 3 lbs, 4 lbs, 5 lbs+",
      "Theme options: Kids, Elegant, Floral, Cartoon, 3D Fondant",
      "Eggless & Sugar-free options available on advance request",
    ],
    process: [
      "Choose your flavor and weight (2 lbs - 5 lbs+)",
      "Share your reference cake photo or theme preference",
      "Specify custom name text and delivery date/time slot",
      "Bakery team confirms order details and delivery address in Bahawal Nagar",
    ],
    pricing: {
      startingAt: "From PKR 2,500 / 2 lbs",
      model: "Priced by weight and fondant complexity",
      note: PRICE_NOTE,
    },
    portfolio: [
      "2-Tier Chocolate Fudge Superhero Birthday Cake",
      "3-Pound Elegant Pink Floral Gold Drip Cake",
      "Custom Cocomelon Theme Kids Birthday Cake",
    ],
    faqs: [
      {
        question: "How many days in advance should I order a custom birthday cake?",
        answer: "Standard birthday cakes can be prepared in 4–6 hours. Complex 3D fondant designs require at least 24 hours advance notice.",
      },
      {
        question: "Do you deliver cakes in Bahawal Nagar?",
        answer: "Yes! We offer safe, temperature-controlled doorstep cake delivery across Model Town and all main areas of Bahawal Nagar.",
      },
    ],
    keywords: [
      "birthday cake", "custom cake", "fondant cake", "cake order", "cake price",
      "chocolate cake", "red velvet", "cake delivery", "bahawal nagar cake",
    ],
  },

  {
    slug: "wedding-tiered-cakes",
    name: "Wedding & Engagement Tiered Cakes",
    group: "Custom Cakes",
    tagline: "Grand multi-tier wedding and engagement cakes.",
    overview:
      "Make your special day unforgettable with a showstopping 2-tier, 3-tier, or 4-tier wedding cake crafted with edible sugar flowers, metallic accents, and rich premium fillings.",
    benefits: [
      "Custom structural multi-tier design",
      "Free wedding cake tasting box prior to booking",
      "On-site setup at wedding marquee / venue in Bahawal Nagar",
    ],
    features: [
      "Tiers: 2-tier (6 lbs), 3-tier (10 lbs), 4-tier (15 lbs+)",
      "Decorations: Fresh roses, edible sugar flowers, gold leafing, lace embossing",
      "Flavors per tier: Mix Chocolate, Caramel Crunch, Lotus Biscoff, Vanilla Bean",
    ],
    process: [
      "Book a cake tasting consultation",
      "Select tier count, design theme, and flavor combinations",
      "Confirm event date, venue location, and delivery timing",
    ],
    pricing: {
      startingAt: "From PKR 8,500 / 2-Tier",
      model: "Priced per tier and flower detail level",
      note: PRICE_NOTE,
    },
    portfolio: [
      "3-Tier Royal Gold Leaf & White Rose Wedding Cake",
      "2-Tier Pearl & Blush Engagement Cake",
    ],
    faqs: [
      {
        question: "Do you set up the wedding cake at the venue?",
        answer: "Yes, our delivery team delivers and sets up multi-tier wedding cakes directly at your wedding venue in Bahawal Nagar.",
      },
    ],
    keywords: [
      "wedding cake", "engagement cake", "tiered cake", "shaadi cake", "barat cake", "walima cake",
    ],
  },

  {
    slug: "fresh-pastries-desserts",
    name: "Fresh Pastries & Slice Boxes",
    group: "Pastries & Sweets",
    tagline: "Freshly baked cake slices, eclairs, and tartlets daily.",
    overview:
      "Daily fresh pastry slices, Belgian chocolate eclairs, fruit tarts, brownies, and dessert cups available for store pickup or instant delivery.",
    benefits: [
      "Baked fresh every morning",
      "Individual slice packs & party boxes",
      "Rich Belgian chocolate & real dairy cream",
    ],
    features: [
      "Items: Chocolate Fudge Slice, Nutella Brownie, Pineapple Slice, Cream Eclair, Lotus Cup",
      "Packaging: Single slice box, 4-pack box, 6-pack box",
    ],
    process: [
      "Select your pastry slices or brownie box",
      "Order for immediate pickup or delivery in Bahawal Nagar",
    ],
    pricing: {
      startingAt: "From PKR 250 / slice",
      model: "Per slice or box pack",
      note: PRICE_NOTE,
    },
    portfolio: [
      "6-Piece Assorted Gourmet Brownie Box",
      "Belgian Chocolate Eclair & Cream Slice Pack",
    ],
    faqs: [
      {
        question: "What are your daily pastry hours?",
        answer: "Fresh pastries are ready every day by 10:00 AM at Model Town, Bahawal Nagar.",
      },
    ],
    keywords: [
      "pastry", "brownie", "eclair", "dessert", "slice", "cupcake", "tart",
    ],
  },
];

export const MARKETING_SERVICE_GROUPS = [
  "Custom Cakes",
  "Pastries & Sweets",
] as const;

export function findService(slug: string): ServiceItem | undefined {
  return MARKETING_SERVICES.find((s) => s.slug === slug);
}

export function matchService(text: string): ServiceItem | undefined {
  const q = text.toLowerCase();
  let best: { service: ServiceItem; score: number } | null = null;
  for (const service of MARKETING_SERVICES) {
    let score = 0;
    if (q.includes(service.name.toLowerCase())) score += 5;
    for (const kw of service.keywords) if (q.includes(kw)) score += 2;
    if (score > (best?.score ?? 0)) best = { service, score };
  }
  return best && best.score >= 2 ? best.service : undefined;
}
