import type { Language } from "@/lib/i18n";

/**
 * =============================================================================
 *  Cakestry Bakery Single Source of Truth Catalogue & Order Calculator
 * =============================================================================
 */

export interface CakestryCategory {
  id: string;
  nameEn: string;
  nameUr: string;
  icon: string;
  descriptionEn: string;
  descriptionUr: string;
}

export interface CakestryProduct {
  id: string;
  categoryId: string;
  nameEn: string;
  nameUr: string;
  price: number;
  unit: string; // e.g. "1 Cake", "Per Piece", "1 Slice"
  descriptionEn?: string;
  descriptionUr?: string;
  allowCheeseAddon?: boolean;
}

export const CHEESE_ADDON_PRICE = 70;
export const STANDARD_DELIVERY_FEE = 150;

export const SADAPAY_DETAILS = {
  accountTitle: process.env.SADAPAY_ACCOUNT_TITLE || "Ejaz Ahmad",
  accountNumber: process.env.SADAPAY_ACCOUNT_NUMBER || "0329-3110006",
  ownerName: process.env.SADAPAY_OWNER_NAME || "EJAZ AHMAD",
};

export const BAKERY_BUSINESS_INFO = {
  name: "Cakestry Bakery",
  location: "Jail Road, Bahawal Nagar, Pakistan",
  phone: "0329-3110006",
  email: "cakestry2026@gmail.com",
  openingHours: "11:00 AM to 2:00 AM (Monday to Sunday)",
};

export const CATEGORIES: CakestryCategory[] = [
  {
    id: "signature_cakes",
    nameEn: "Signature Cakes",
    nameUr: "سیگنیچر کیکس",
    icon: "🎂",
    descriptionEn: "Freshly baked signature cakes for every celebration.",
    descriptionUr: "ہر تقریب کے لیے تازہ بیک کیے گئے کیکس۔",
  },
  {
    id: "cupcakes",
    nameEn: "Cupcakes",
    nameUr: "کپ کیکس",
    icon: "🧁",
    descriptionEn: "Delicious individual cupcakes topped with rich frosting.",
    descriptionUr: "مزیدار کپ کیکس۔",
  },
  {
    id: "brownies",
    nameEn: "Premium Brownies",
    nameUr: "پریمیئم براؤنیز",
    icon: "🍫",
    descriptionEn: "Fudgy, rich and chocolatey premium brownies.",
    descriptionUr: "مزیدار چاکلیٹ براؤنیز۔",
  },
  {
    id: "donuts_slices",
    nameEn: "Donuts & Slices",
    nameUr: "ڈونٹس اور سلائس",
    icon: "🍩",
    descriptionEn: "Glazed donuts and gourmet cake slices.",
    descriptionUr: "ڈونٹس اور کیک سلائس۔",
  },
  {
    id: "pastries",
    nameEn: "Pastries",
    nameUr: "پیسٹریز",
    icon: "🥐",
    descriptionEn: "Creamy fresh pastries & rolls.",
    descriptionUr: "تازہ پیسٹریز۔",
  },
  {
    id: "wraps_sandwiches",
    nameEn: "Wraps & Sandwiches",
    nameUr: "ریپس اور سینڈوچ",
    icon: "🌯",
    descriptionEn: "Freshly prepared sandwiches & savory wraps.",
    descriptionUr: "تازہ سینڈوچ اور ریپس۔",
  },
  {
    id: "desserts_savories",
    nameEn: "Desserts & Savories",
    nameUr: "ڈیزرٹس اور سنیکس",
    icon: "🍰",
    descriptionEn: "Cream puffs, cheese balls, and mini savories.",
    descriptionUr: "کریم پفس، چیز بالز اور مزیدار سنیکس۔",
  },
  {
    id: "custom_cakes",
    nameEn: "Custom Cakes",
    nameUr: "کسٹم کیکس",
    icon: "🎨",
    descriptionEn: "Custom design cakes tailored to your theme and event.",
    descriptionUr: "آپ کی خواہش کے مطابق کسٹم ڈیزائن کیکس۔",
  },
  {
    id: "my_order",
    nameEn: "My Order / Booking",
    nameUr: "میرا آرڈر / بکنگ",
    icon: "📦",
    descriptionEn: "Check status or manage your current order.",
    descriptionUr: "اپنے آرڈر کی تفصیلات دیکھیں۔",
  },
  {
    id: "location",
    nameEn: "Location & Hours",
    nameUr: "لوکیشن اور اوقات",
    icon: "📍",
    descriptionEn: "Bakery address and opening hours.",
    descriptionUr: "بیکری کا پتہ اور کام کے اوقات۔",
  },
];

export const PRODUCTS: CakestryProduct[] = [
  // --- Signature Cakes ---
  { id: "choc_dream", categoryId: "signature_cakes", nameEn: "Chocolate Dream Cake", nameUr: "چاکلیٹ ڈریم کیک", price: 1200, unit: "Per Cake" },
  { id: "honey_2p", categoryId: "signature_cakes", nameEn: "Honey Cake 2P", nameUr: "ہنی کیک (2 پاؤنڈ)", price: 1500, unit: "2 Pound" },
  { id: "pineapple_cake", categoryId: "signature_cakes", nameEn: "Pineapple Cake", nameUr: "پائن ایپل کیک", price: 800, unit: "Per Cake" },
  { id: "blueberry_cake", categoryId: "signature_cakes", nameEn: "Blueberry Cake", nameUr: "بلیو بیری کیک", price: 1200, unit: "Per Cake" },
  { id: "mango_cake", categoryId: "signature_cakes", nameEn: "Mango Cake", nameUr: "مینگو کیک", price: 1000, unit: "Per Cake" },
  { id: "kitkat_cake", categoryId: "signature_cakes", nameEn: "KitKat Cake", nameUr: "کٹ کیٹ کیک", price: 1200, unit: "Per Cake" },
  { id: "dairymilk_cake", categoryId: "signature_cakes", nameEn: "Dairy Milk Cake", nameUr: "ڈیری ملکی کیک", price: 1200, unit: "Per Cake" },
  { id: "ferrero_cake", categoryId: "signature_cakes", nameEn: "Ferrero Cake", nameUr: "فریرو کیک", price: 1200, unit: "Per Cake" },
  { id: "raffaello_cake", categoryId: "signature_cakes", nameEn: "Raffaello Cake", nameUr: "رافائیلو کیک", price: 1200, unit: "Per Cake" },
  { id: "vanilla_cake", categoryId: "signature_cakes", nameEn: "Vanilla Cake", nameUr: "ونیلا کیک", price: 1000, unit: "Per Cake" },
  { id: "strawberry_cake", categoryId: "signature_cakes", nameEn: "Strawberry Cake", nameUr: "اسٹرابیری کیک", price: 1200, unit: "Per Cake" },
  { id: "lotus_cake", categoryId: "signature_cakes", nameEn: "Lotus Cake", nameUr: "لوٹس کیک", price: 1200, unit: "Per Cake" },
  { id: "caramel_cake", categoryId: "signature_cakes", nameEn: "Caramel Cake", nameUr: "کیریمل کیک", price: 1000, unit: "Per Cake" },
  { id: "redvelvet_cake", categoryId: "signature_cakes", nameEn: "Red Velvet Cake", nameUr: "ریڈ ویلوٹ کیک", price: 1200, unit: "Per Cake" },
  { id: "coffeewalnut_cake", categoryId: "signature_cakes", nameEn: "Coffee Walnut Cake", nameUr: "کافی والنٹ کیک", price: 1200, unit: "Per Cake" },
  { id: "threemilk_cake", categoryId: "signature_cakes", nameEn: "Three Milk Cake", nameUr: "تھری ملکی کیک", price: 2800, unit: "Per Cake" },
  { id: "malteser_cake", categoryId: "signature_cakes", nameEn: "Chocolate Malteser Cake", nameUr: "چاکلیٹ مالٹیزر کیک", price: 1200, unit: "Per Cake" },
  { id: "choc_fudge", categoryId: "signature_cakes", nameEn: "Chocolate Fudge Cake", nameUr: "چاکلیٹ فج کیک", price: 1200, unit: "Per Cake" },
  { id: "diet_choc_cake", categoryId: "signature_cakes", nameEn: "Diet Chocolate Cake", nameUr: "ڈائٹ چاکلیٹ کیک", price: 1200, unit: "Per Cake" },
  { id: "coffee_cake", categoryId: "signature_cakes", nameEn: "Coffee Cake", nameUr: "کافی کیک", price: 1200, unit: "Per Cake" },
  { id: "blackforest_cake", categoryId: "signature_cakes", nameEn: "Black Forest Cake", nameUr: "بلیک فارسٹ کیک", price: 900, unit: "Per Cake" },

  // --- Cupcakes ---
  { id: "cup_lotus", categoryId: "cupcakes", nameEn: "Lotus Cup Cake", nameUr: "لوٹس کپ کیک", price: 250, unit: "Per Piece" },
  { id: "cup_nutella", categoryId: "cupcakes", nameEn: "Nutella Cup Cake", nameUr: "نوٹیلا کپ کیک", price: 250, unit: "Per Piece" },
  { id: "cup_redvelvet", categoryId: "cupcakes", nameEn: "Red Velvet Cup Cake", nameUr: "ریڈ ویلوٹ کپ کیک", price: 250, unit: "Per Piece" },
  { id: "cup_ferrero", categoryId: "cupcakes", nameEn: "Ferrero Chocolate Cup Cake", nameUr: "فریرو چاکلیٹ کپ کیک", price: 250, unit: "Per Piece" },
  { id: "cup_caramel_sundae", categoryId: "cupcakes", nameEn: "Caramel Sunday Cup Cake", nameUr: "کیریمل سنڈے کپ کیک", price: 250, unit: "Per Piece" },
  { id: "cup_nutella_sundae", categoryId: "cupcakes", nameEn: "Nutella Sunday Cup Cake", nameUr: "نوٹیلا سنڈے کپ کیک", price: 250, unit: "Per Piece" },
  { id: "cup_choc_sundae", categoryId: "cupcakes", nameEn: "Chocolate Sunday Cup Cake", nameUr: "چاکلیٹ سنڈے کپ کیک", price: 250, unit: "Per Piece" },

  // --- Premium Brownies ---
  { id: "brownie_nutella", categoryId: "brownies", nameEn: "Nutella Brownie", nameUr: "نوٹیلا براؤنی", price: 350, unit: "Per Piece" },
  { id: "brownie_walnut", categoryId: "brownies", nameEn: "Walnut Brownie", nameUr: "والنٹ براؤنی", price: 350, unit: "Per Piece" },

  // --- Donuts ---
  { id: "donut_nutella", categoryId: "donuts_slices", nameEn: "Nutella Donut", nameUr: "نوٹیلا ڈونٹ", price: 150, unit: "Per Piece" },
  { id: "donut_choc", categoryId: "donuts_slices", nameEn: "Chocolate Donut", nameUr: "چاکلیٹ ڈونٹ", price: 150, unit: "Per Piece" },
  { id: "donut_lotus", categoryId: "donuts_slices", nameEn: "Lotus Donut", nameUr: "لوٹس ڈونٹ", price: 150, unit: "Per Piece" },

  // --- Cake Slices ---
  { id: "slice_bake_cheese", categoryId: "donuts_slices", nameEn: "Bake Cheese Slice", nameUr: "بیک چیز کیک سلائس", price: 450, unit: "Per Slice" },
  { id: "slice_cheese", categoryId: "donuts_slices", nameEn: "Cheese Slice", nameUr: "چیز کیک سلائس", price: 450, unit: "Per Slice" },

  // --- Wraps & Sandwiches ---
  { id: "sandwich_grilled", categoryId: "wraps_sandwiches", nameEn: "Grilled Sandwich", nameUr: "گرلڈ سینڈوچ", price: 550, unit: "Per Sandwich", allowCheeseAddon: true },
  { id: "sandwich_chicken", categoryId: "wraps_sandwiches", nameEn: "Chicken Sandwich", nameUr: "چکن سینڈوچ", price: 450, unit: "Per Sandwich", allowCheeseAddon: true },
  { id: "sandwich_bbq", categoryId: "wraps_sandwiches", nameEn: "BBQ Sandwich", nameUr: "بی بی کیو سینڈوچ", price: 450, unit: "Per Sandwich", allowCheeseAddon: true },
  { id: "wrap_chicken_malai", categoryId: "wraps_sandwiches", nameEn: "Chicken Malai Boti Wrap", nameUr: "چکن ملائی بوٹی ریپ", price: 550, unit: "Per Wrap", allowCheeseAddon: true },
  { id: "wrap_bihari_boti", categoryId: "wraps_sandwiches", nameEn: "Bihari Boti Wrap", nameUr: "بہاری بوٹی ریپ", price: 499, unit: "Per Wrap", allowCheeseAddon: true },

  // --- Desserts & Savories ---
  { id: "cream_puffs", categoryId: "desserts_savories", nameEn: "Cream Puffs", nameUr: "کریم پفس", price: 150, unit: "Per Pack" },
  { id: "cream_rolls", categoryId: "desserts_savories", nameEn: "Cream Rolls", nameUr: "کریم رولز", price: 150, unit: "Per Pack" },
  { id: "dry_almond_cake", categoryId: "desserts_savories", nameEn: "Dry Almond Cake", nameUr: "ڈرائی آلمنڈ کیک", price: 1000, unit: "Per Cake" },
  { id: "chicken_patty", categoryId: "desserts_savories", nameEn: "Chicken Patty", nameUr: "چکن پیٹی", price: 150, unit: "Per Piece" },

  // --- Pastries ---
  { id: "pastry_molten_lava", categoryId: "pastries", nameEn: "Molten Lava Cupcake", nameUr: "مولٹن لاوا کپ کیک", price: 550, unit: "Per Piece" },
  { id: "pastry_milk", categoryId: "pastries", nameEn: "Milk Pastry", nameUr: "ملک پیسٹری", price: 250, unit: "Per Piece" },
  { id: "pastry_pistachio", categoryId: "pastries", nameEn: "Pistachio Pastry", nameUr: "پستہ پیسٹری", price: 299, unit: "Per Piece" },
  { id: "pastry_nutella", categoryId: "pastries", nameEn: "Nutella Pastry", nameUr: "نوٹیلا پیسٹری", price: 270, unit: "Per Piece" },
  { id: "pastry_lotus", categoryId: "pastries", nameEn: "Lotus Pastry", nameUr: "لوٹس پیسٹری", price: 280, unit: "Per Piece" },
  { id: "pastry_threemilk", categoryId: "pastries", nameEn: "Three Milk Pastry", nameUr: "تھری ملکی پیسٹری", price: 399, unit: "Per Piece" },
  { id: "pastry_muffin", categoryId: "pastries", nameEn: "Muffin", nameUr: "مفن", price: 120, unit: "Per Piece" },
  { id: "pastry_redvelvet", categoryId: "pastries", nameEn: "Red Velvet Pastry", nameUr: "ریڈ ویلوٹ پیسٹری", price: 270, unit: "Per Piece" },
  { id: "pastry_pineapple", categoryId: "pastries", nameEn: "Pineapple Pastry", nameUr: "پائن ایپل پیسٹری", price: 199, unit: "Per Piece" },
  { id: "pastry_blackforest", categoryId: "pastries", nameEn: "Black Forest Pastry", nameUr: "بلیک فارسٹ پیسٹری", price: 270, unit: "Per Piece" },
];

export function findProductById(id: string): CakestryProduct | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function findProductsByCategory(categoryId: string): CakestryProduct[] {
  return PRODUCTS.filter((p) => p.categoryId === categoryId);
}

/**
 * Robust Product Alias Resolver & Fuzzy Matcher
 * Maps natural customer phrases, Roman Urdu, singular/plural, and abbreviations
 * strictly to valid server-side catalogue products.
 * NEVER returns random products or defaults when unmapped.
 */
export function resolveProductAlias(rawInput: string): CakestryProduct | undefined {
  if (!rawInput) return undefined;
  const lowered = rawInput.trim().toLowerCase();

  // 1. Direct ID / Exact Name Match
  const exact = PRODUCTS.find(
    (p) =>
      p.id.toLowerCase() === lowered ||
      p.nameEn.toLowerCase() === lowered ||
      p.nameUr.toLowerCase() === lowered
  );
  if (exact) return exact;

  // 2. Exact Manual Alias Mappings
  const ALIAS_MAP: Record<string, string> = {
    // Signature Cakes
    "black forest": "blackforest_cake",
    "black forest cake": "blackforest_cake",
    "black forest cakes": "blackforest_cake",
    "blackforest": "blackforest_cake",
    "blackforest cake": "blackforest_cake",

    "chocolate fudge": "choc_fudge",
    "chocolate fudge cake": "choc_fudge",
    "chocolate fudge cakes": "choc_fudge",
    "choc fudge": "choc_fudge",
    "fudge cake": "choc_fudge",
    "diet chocolate fudge cake": "choc_fudge", // Rule: "Diet Chocolate Fudge Cake" maps to Chocolate Fudge Cake
    "diet chocolate cake": "diet_choc_cake",

    "cream puff": "cream_puffs",
    "cream puffs": "cream_puffs",
    "puffs": "cream_puffs",
    "cream roll": "cream_rolls",
    "cream rolls": "cream_rolls",

    "pineapple cake": "pineapple_cake",
    "pineapple cakes": "pineapple_cake",

    "lotus cake": "lotus_cake",
    "lotus cakes": "lotus_cake",

    "three milk cake": "threemilk_cake",
    "threemilk cake": "threemilk_cake",
    "3 milk cake": "threemilk_cake",

    "honey cake": "honey_2p",
    "honey cake 2p": "honey_2p",

    "chocolate dream cake": "choc_dream",
    "dream cake": "choc_dream",

    // Cupcakes
    "lotus cup cake": "cup_lotus",
    "lotus cupcake": "cup_lotus",
    "lotus cupcakes": "cup_lotus",

    "nutella cup cake": "cup_nutella",
    "nutella cupcake": "cup_nutella",
    "nutella cupcakes": "cup_nutella",

    "red velvet cup cake": "cup_redvelvet",
    "red velvet cupcake": "cup_redvelvet",
    "red velvet cupcakes": "cup_redvelvet",

    "ferrero cup cake": "cup_ferrero",
    "ferrero cupcake": "cup_ferrero",

    // Brownies
    "nutella brownie": "brownie_nutella",
    "nutella brownies": "brownie_nutella",
    "walnut brownie": "brownie_walnut",
    "walnut brownies": "brownie_walnut",

    // Donuts & Slices
    "nutella donut": "donut_nutella",
    "chocolate donut": "donut_choc",
    "lotus donut": "donut_lotus",
    "bake cheese slice": "slice_bake_cheese",
    "cheese slice": "slice_cheese",
    "cheesecake slice": "slice_cheese",

    // Wraps & Sandwiches
    "grilled sandwich": "sandwich_grilled",
    "sandwich grilled": "sandwich_grilled",
    "chicken sandwich": "sandwich_chicken",
    "bbq sandwich": "sandwich_bbq",
    "chicken malai boti wrap": "wrap_chicken_malai",
    "malai boti wrap": "wrap_chicken_malai",
    "chicken malai boti": "wrap_chicken_malai",
    "bihari boti wrap": "wrap_bihari_boti",
    "bihari boti": "wrap_bihari_boti",

    // Desserts & Savories
    "dry almond cake": "dry_almond_cake",
    "chicken patty": "chicken_patty",
    "patty": "chicken_patty",

    // Pastries
    "molten lava": "pastry_molten_lava",
    "molten lava cupcake": "pastry_molten_lava",
    "black forest pastry": "pastry_blackforest",
    "pineapple pastry": "pastry_pineapple",
    "lotus pastry": "pastry_lotus",
    "three milk pastry": "pastry_threemilk",
    "pistachio pastry": "pastry_pistachio",
  };

  const aliasId = ALIAS_MAP[lowered];
  if (aliasId) {
    return findProductById(aliasId);
  }

  // 3. Substring matching with safety rules (only if specific product name fully matches a token)
  const matches = PRODUCTS.filter(
    (p) =>
      lowered.includes(p.nameEn.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(lowered)
  );

  // If exactly 1 match found, return it safely. If multiple or none, return undefined (never guess randomly!)
  if (matches.length === 1) {
    return matches[0];
  }

  return undefined;
}

export function findProductByName(name: string): CakestryProduct | undefined {
  return resolveProductAlias(name);
}

export function matchCategory(input: string): CakestryCategory | undefined {
  if (!input) return undefined;

  // Strip emojis, brackets, and extra punctuation
  const clean = input
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/[^\w\s\u0600-\u06FF]/g, " ")
    .trim()
    .toLowerCase();

  if (!clean) return undefined;

  // 1. Direct equality on ID, English Name, or Urdu Name
  for (const cat of CATEGORIES) {
    if (
      clean === cat.id.toLowerCase() ||
      clean === cat.nameEn.toLowerCase() ||
      clean === cat.nameUr.toLowerCase()
    ) {
      return cat;
    }
  }

  // 2. Exact word boundaries or robust keywords
  if (/\b(pastry|pastries)\b/i.test(clean) || clean.includes("پیسٹری")) {
    return CATEGORIES.find((c) => c.id === "pastries");
  }
  if (/\b(cupcake|cupcakes|cup cake|cup cakes)\b/i.test(clean) || clean.includes("کپ کیک")) {
    return CATEGORIES.find((c) => c.id === "cupcakes");
  }
  if (/\b(brownie|brownies)\b/i.test(clean) || clean.includes("براؤنی")) {
    return CATEGORIES.find((c) => c.id === "brownies");
  }
  if (/\b(donut|donuts|doughnut|doughnuts|slice|slices)\b/i.test(clean) || clean.includes("ڈونٹ") || clean.includes("سلائس")) {
    return CATEGORIES.find((c) => c.id === "donuts_slices");
  }
  if (/\b(wrap|wraps|sandwich|sandwiches)\b/i.test(clean) || clean.includes("ریپ") || clean.includes("سینڈوچ")) {
    return CATEGORIES.find((c) => c.id === "wraps_sandwiches");
  }
  if (/\b(dessert|desserts|savory|savories|cream puff|puff|puffs)\b/i.test(clean) || clean.includes("ڈیزرٹ") || clean.includes("سنیک")) {
    return CATEGORIES.find((c) => c.id === "desserts_savories");
  }
  if (/\b(custom|customized|custom cake|custom cakes|customized cake|customized cakes)\b/i.test(clean) || clean.includes("کسٹم")) {
    return CATEGORIES.find((c) => c.id === "custom_cakes");
  }
  if (/\b(signature cake|signature cakes|cake|cakes|birthday cake)\b/i.test(clean) || clean.includes("کیک")) {
    return CATEGORIES.find((c) => c.id === "signature_cakes");
  }

  return undefined;
}

export interface OrderItemState {
  productId: string;
  quantity: number;
  cheeseAddon?: boolean;
}

export function calculateOrderTotals(
  items: OrderItemState[],
  deliveryType: "DELIVERY" | "PICKUP" = "DELIVERY"
): {
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemized: Array<{ product: CakestryProduct; quantity: number; cheeseAddon: boolean; lineTotal: number }>;
} {
  let subtotal = 0;
  const itemized: Array<{ product: CakestryProduct; quantity: number; cheeseAddon: boolean; lineTotal: number }> = [];

  for (const item of items) {
    const product = findProductById(item.productId);
    if (!product) continue;
    const cheeseCost = item.cheeseAddon ? CHEESE_ADDON_PRICE * item.quantity : 0;
    const lineTotal = product.price * item.quantity + cheeseCost;
    subtotal += lineTotal;
    itemized.push({
      product,
      quantity: item.quantity,
      cheeseAddon: !!item.cheeseAddon,
      lineTotal,
    });
  }

  const deliveryFee = deliveryType === "DELIVERY" && subtotal > 0 ? STANDARD_DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  return { subtotal, deliveryFee, total, itemized };
}
