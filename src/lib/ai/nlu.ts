import {
  PRODUCTS,
  CATEGORIES,
  findProductById,
  resolveProductAlias,
  matchCategory,
  type CakestryProduct,
} from "@/lib/cakestry";
import type { Language } from "@/lib/i18n";
import { config } from "@/lib/config";

export interface ExtractedProduct {
  productId: string;
  productName: string;
  quantity: number;
  cheeseAddon?: boolean;
}

export interface CustomerDetailsExtracted {
  deliveryType?: "DELIVERY" | "PICKUP";
  name?: string;
  phone?: string;
  address?: string;
  dateTime?: string;
}

export interface StructuredNluOutput {
  intent:
    | "LANGUAGE_CHANGE"
    | "ADD_TO_CART"
    | "QUANTITY_UPDATE"
    | "REMOVE_FROM_CART"
    | "SELECT_CATEGORY"
    | "SELECT_PRODUCT"
    | "CHECKOUT"
    | "PROVIDE_DETAILS"
    | "VERIFY_PAYMENT"
    | "INQUIRE_CATALOG"
    | "CHECK_ORDER"
    | "CANCEL_ORDER"
    | "HUMAN_ESCALATE"
    | "GREETING"
    | "GENERAL_QUERY";
  targetLanguage?: Language;
  language: Language;
  selectedCategoryId?: string;
  selectedProductId?: string;
  products: ExtractedProduct[];
  quantityUpdate?: { quantity: number; targetProductId?: string };
  removedProductId?: string;
  customerDetails?: CustomerDetailsExtracted;
  ambiguousProducts?: string[];
  requiresClarification?: boolean;
  clarificationQuestion?: string;
  rawText: string;
}

export function detectLanguageChangeIntent(text: string): { isLanguageChange: boolean; targetLanguage?: Language } {
  const trimmed = text.trim();
  const lowered = trimmed.toLowerCase();

  if (lowered === "lang:en" || lowered === "english" || lowered === "inglish") {
    return { isLanguageChange: true, targetLanguage: "en" };
  }
  if (lowered === "lang:ur" || lowered === "urdu" || lowered === "urdo" || lowered === "اردو") {
    return { isLanguageChange: true, targetLanguage: "ur" };
  }

  const enRegex = /\b(english|inglish)\b/i;
  const enPhrases = [
    "conversation i'm english",
    "conversation english",
    "speak english",
    "talk english",
    "talk in english",
    "talk to me in english",
    "english please",
    "english mein",
    "english me",
    "in english",
    "switch to english",
    "change language to english",
    "change to english",
    "english me baat",
    "english mein baat",
    "mujhe english",
    "انگلیش",
    "انگلش",
  ];

  const urRegex = /\b(urdu|urdo)\b/i;
  const urPhrases = [
    "speak urdu",
    "talk urdu",
    "talk in urdu",
    "talk to me in urdu",
    "urdu please",
    "urdu mein",
    "urdu me",
    "in urdu",
    "switch to urdu",
    "change language to urdu",
    "change to urdu",
    "urdu me baat",
    "urdu mein baat",
    "mujhe urdu",
    "اردو",
    "اردو میں",
    "اردو میں بات",
  ];

  const hasEn = enRegex.test(lowered) || enPhrases.some((p) => lowered.includes(p));
  const hasUr = urRegex.test(lowered) || urPhrases.some((p) => lowered.includes(p));

  if (hasEn && !hasUr) {
    return { isLanguageChange: true, targetLanguage: "en" };
  }
  if (hasUr && !hasEn) {
    return { isLanguageChange: true, targetLanguage: "ur" };
  }

  return { isLanguageChange: false };
}

/**
 * Word to number helper for English and Roman Urdu numerals
 */
const WORD_NUMBER_MAP: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  ek: 1,
  aik: 1,
  do: 2,
  teen: 3,
  char: 4,
  chaar: 4,
  paanch: 5,
  panch: 5,
  che: 6,
  chhe: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  das: 10,
};

function parseWordOrDigitQuantity(text: string): number | undefined {
  const trimmed = text.trim().toLowerCase();
  const digitMatch = trimmed.match(/(?:^|\b|\s)(\d+)(?:x|\b|\s|$)/i);
  if (digitMatch) {
    const num = parseInt(digitMatch[1], 10);
    if (!isNaN(num) && num > 0 && num <= 100) return num;
  }
  for (const [word, val] of Object.entries(WORD_NUMBER_MAP)) {
    const wordRegex = new RegExp(`\\b${word}\\b`, "i");
    if (wordRegex.test(trimmed)) {
      return val;
    }
  }
  return undefined;
}

/**
 * Main NLU Entry Point
 * 1. Fast deterministic button/payload routing
 * 2. Primary LLM Semantic Understanding Layer (ChatGPT)
 * 3. Robust Data-Driven Server-Side Fallback
 */
export async function parseCustomerInputNLU(
  input: string,
  currentStep?: string,
  currentCartProductIds: string[] = []
): Promise<StructuredNluOutput> {
  const trimmed = input.trim();
  if (!trimmed) {
    return createEmptyNlu(trimmed);
  }

  const isUrdu = /[\u0600-\u06FF]/.test(trimmed);
  const lang: Language = isUrdu ? "ur" : "en";

  // 0a. Deterministic WhatsApp Interactive Button / List Row Payloads
  if (trimmed.startsWith("cat:")) {
    const catId = trimmed.slice(4);
    return { intent: "SELECT_CATEGORY", language: lang, selectedCategoryId: catId, products: [], rawText: trimmed };
  }
  if (trimmed.startsWith("prod:")) {
    const prodId = trimmed.slice(5);
    return { intent: "SELECT_PRODUCT", language: lang, selectedProductId: prodId, products: [], rawText: trimmed };
  }
  if (trimmed.startsWith("qty:")) {
    const qty = parseInt(trimmed.slice(4), 10) || 1;
    return {
      intent: "QUANTITY_UPDATE",
      language: lang,
      products: [],
      quantityUpdate: { quantity: qty, targetProductId: currentCartProductIds[currentCartProductIds.length - 1] },
      rawText: trimmed,
    };
  }
  if (trimmed.startsWith("addon:") || trimmed.startsWith("opt:") || trimmed.startsWith("delivery:")) {
    return { intent: "PROVIDE_DETAILS", language: lang, products: [], rawText: trimmed };
  }
  if (
    trimmed.startsWith("btn:menu") ||
    trimmed.startsWith("btn:back_categories") ||
    trimmed.startsWith("act:menu") ||
    trimmed.startsWith("act:back_categories")
  ) {
    return { intent: "INQUIRE_CATALOG", language: lang, products: [], rawText: trimmed };
  }
  if (trimmed.startsWith("btn:checkout") || trimmed.startsWith("act:checkout")) {
    return { intent: "CHECKOUT", language: lang, products: [], rawText: trimmed };
  }
  if (trimmed.startsWith("btn:human") || trimmed.startsWith("act:human")) {
    return { intent: "HUMAN_ESCALATE", language: lang, products: [], rawText: trimmed };
  }
  if (trimmed.startsWith("btn:my_order") || trimmed.startsWith("act:my_order")) {
    return { intent: "CHECK_ORDER", language: lang, products: [], rawText: trimmed };
  }

  // 0b. Active Checkout & Custom Cake Form Protection
  // When filling customer details (name, phone, address, date/time), customer text is strictly form input!
  if (currentStep?.startsWith("CHECKOUT_") || currentStep?.startsWith("CUSTOM_CAKE_")) {
    const lowered = trimmed.toLowerCase();
    const isCancelOrMenu =
      lowered === "menu" ||
      lowered === "cancel" ||
      lowered === "start" ||
      lowered === "restart" ||
      lowered === "hata do" ||
      lowered.includes("cancel order");

    if (!isCancelOrMenu) {
      return {
        intent: "PROVIDE_DETAILS",
        language: lang,
        products: [],
        customerDetails: {
          name: currentStep === "CHECKOUT_NAME" ? trimmed : undefined,
          phone: currentStep === "CHECKOUT_PHONE" ? trimmed : undefined,
          address: currentStep === "CHECKOUT_ADDRESS" ? trimmed : undefined,
          dateTime: currentStep === "CHECKOUT_DATE_TIME" ? trimmed : undefined,
        },
        rawText: trimmed,
      };
    }
  }

  // 0c. High Priority Explicit Language Switch
  const langChange = detectLanguageChangeIntent(trimmed);
  if (langChange.isLanguageChange && langChange.targetLanguage) {
    return {
      intent: "LANGUAGE_CHANGE",
      targetLanguage: langChange.targetLanguage,
      language: langChange.targetLanguage,
      products: [],
      rawText: trimmed,
    };
  }

  // 1. PRIMARY: Semantic Understanding Layer via LLM (OpenAI / ChatGPT)
  if (config.ai.openaiApiKey) {
    try {
      const llmResult = await extractWithChatGPT(trimmed, currentStep, currentCartProductIds);
      if (llmResult) {
        // Backend Validation: validate and normalize all extracted products strictly against live catalogue
        if (llmResult.products && llmResult.products.length > 0) {
          const validatedProducts: ExtractedProduct[] = [];
          for (const p of llmResult.products) {
            const resolved = findProductById(p.productId) || resolveProductAlias(p.productId || p.productName);
            if (resolved) {
              validatedProducts.push({
                productId: resolved.id,
                productName: resolved.nameEn,
                quantity: Math.max(1, p.quantity || 1),
                cheeseAddon: p.cheeseAddon || false,
              });
            }
          }
          llmResult.products = validatedProducts;

          // If customer named a single product WITHOUT quantity or ordering verb -> SELECT_PRODUCT (ask quantity!)
          const hasExplicitQty = typeof parseWordOrDigitQuantity(trimmed) === "number";
          const hasOrderVerb = /(?:add|order|chahiye|bhejo|kar do|kardo|bana do|pieces|pcs)\b/i.test(trimmed);

          if (llmResult.products.length === 1 && !hasExplicitQty && !hasOrderVerb) {
            llmResult.intent = "SELECT_PRODUCT";
            llmResult.selectedProductId = llmResult.products[0].productId;
            llmResult.products = [];
          }
        }

        // Validate category ID if present
        if (llmResult.selectedCategoryId) {
          const cat = CATEGORIES.find((c) => c.id === llmResult.selectedCategoryId);
          if (!cat) {
            const matched = matchCategory(llmResult.selectedCategoryId);
            llmResult.selectedCategoryId = matched?.id;
          }
        }

        return llmResult;
      }
    } catch (err) {
      console.warn("[NLU] ChatGPT extraction failed, falling back to data-driven parser:", err);
    }
  }

  // 2. BACKEND FALLBACK: Pure data-driven deterministic parser (offline / safe fallback)
  return parseDeterministicNLU(trimmed, currentStep, currentCartProductIds);
}

function createEmptyNlu(rawText: string): StructuredNluOutput {
  return {
    intent: "GENERAL_QUERY",
    language: "en",
    products: [],
    rawText,
  };
}

/**
 * ChatGPT Structured JSON Extractor
 * Injects authoritative live catalogue data dynamically into the prompt.
 */
async function extractWithChatGPT(
  text: string,
  currentStep?: string,
  currentCartProductIds: string[] = []
): Promise<StructuredNluOutput | null> {
  const apiKey = config.ai.openaiApiKey;
  if (!apiKey) return null;

  // Pass dynamic catalogue data (both products and categories)
  const catalogList = PRODUCTS.map((p) => `id: "${p.id}", category: "${p.categoryId}", name: "${p.nameEn}", urdu: "${p.nameUr}", price: ${p.price}`).join("\n");
  const categoriesList = CATEGORIES.map((c) => `id: "${c.id}", name: "${c.nameEn}", urdu: "${c.nameUr}"`).join("\n");

  const systemPrompt = `You are the primary semantic NLU engine for Cakestry Bakery WhatsApp Chatbot.
Your job is to convert natural customer messages (English, Roman Urdu, Urdu Script, or mixed) into structured JSON.

Authoritative Categories:
${categoriesList}

Authoritative Products:
${catalogList}

RULES FOR SEMANTIC COMPREHENSION:
1. Intent Classification:
   - "SELECT_CATEGORY" / "BROWSE_CATEGORY": Customer wants to explore/view a category (e.g. "pastries", "show cakes", "brownies dikhao"). Set selectedCategoryId. DO NOT set intent to ADD_TO_CART.
   - "SELECT_PRODUCT": Customer specifically mentions one product without quantity (e.g. "molten lava", "nutella donut").
   - "ADD_TO_CART": Customer explicitly asks to buy/order product(s) with quantities or clear ordering intent (e.g. "2 chocolate fudge cakes and 1 black forest", "bhai ek strawberry cheesecake aur 2 donuts add kar do").
   - "QUANTITY_UPDATE": Customer changes or corrects a quantity (e.g. "make it 3", "actually 4", "nahi 2 kar do", "ek aur add karo"). Set quantityUpdate with targetProductId (from context if referenced relatively).
   - "REMOVE_FROM_CART": Customer asks to remove an item (e.g. "remove the cake", "ye wala hata do", "don't want that"). Set removedProductId.
   - "CHECKOUT": Customer wants to finalize / checkout (e.g. "checkout", "order confirm karna hai", "bill bnao").
   - "PROVIDE_DETAILS": Customer provides delivery details (name, phone, address, time, pickup/delivery). Set customerDetails.
   - "PAYMENT_INQUIRY": Customer asks how to pay or asks for bank/SadaPay details.
   - "VERIFY_PAYMENT": Customer says they sent money or provides transaction reference.
   - "INQUIRE_CATALOG": Customer asks for general menu or catalogue.
   - "GREETING": Customer sends a greeting (hello, hi, salam, aoa).
   - "LANGUAGE_CHANGE": Customer asks to switch language. Set targetLanguage ("en" | "ur").
   - "HUMAN_ESCALATE": Customer asks to speak to human/agent/owner.
2. Contextual References:
   - When customer says "that one", "make it 3", "remove that", resolve targetProductId using Current Cart Items or recently mentioned product.
3. Multi-Entity Understanding:
   - Extract ALL mentioned products and their quantities into the "products" array.
4. Output JSON strictly matching this structure:
{
  "intent": "SELECT_CATEGORY" | "SELECT_PRODUCT" | "ADD_TO_CART" | "QUANTITY_UPDATE" | "REMOVE_FROM_CART" | "CHECKOUT" | "PROVIDE_DETAILS" | "PAYMENT_INQUIRY" | "VERIFY_PAYMENT" | "INQUIRE_CATALOG" | "GREETING" | "LANGUAGE_CHANGE" | "HUMAN_ESCALATE" | "GENERAL_QUERY",
  "targetLanguage": "en" | "ur",
  "language": "en" | "ur",
  "selectedCategoryId": "id_or_empty",
  "selectedProductId": "id_or_empty",
  "products": [ { "productId": "exact_id", "productName": "name", "quantity": number, "cheeseAddon": boolean } ],
  "quantityUpdate": { "quantity": number, "targetProductId": "optional_id" },
  "removedProductId": "optional_id",
  "customerDetails": { "deliveryType": "DELIVERY" | "PICKUP", "name": "string", "phone": "string", "address": "string", "dateTime": "string" },
  "requiresClarification": boolean,
  "clarificationQuestion": "string"
}`;

  const res = await fetch(`${config.ai.openaiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.ai.model || "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      temperature: 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Context Step: ${currentStep || "UNKNOWN"}. Current Cart Items: ${currentCartProductIds.join(", ") || "empty"}. Customer Message: "${text}"`,
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;

  const parsed = JSON.parse(content);
  return {
    intent: parsed.intent || "GENERAL_QUERY",
    targetLanguage: parsed.targetLanguage,
    language: parsed.language || "en",
    selectedCategoryId: parsed.selectedCategoryId,
    selectedProductId: parsed.selectedProductId,
    products: Array.isArray(parsed.products) ? parsed.products : [],
    quantityUpdate: parsed.quantityUpdate,
    removedProductId: parsed.removedProductId,
    customerDetails: parsed.customerDetails,
    requiresClarification: parsed.requiresClarification || false,
    clarificationQuestion: parsed.clarificationQuestion,
    rawText: text,
  };
}

/**
 * Data-Driven Server-Side Offline NLU Parser (Safe Fallback)
 * Zero hardcoded product or category names. Works entirely from `PRODUCTS` and `CATEGORIES` data.
 */
export function parseDeterministicNLU(
  input: string,
  currentStep?: string,
  currentCartProductIds: string[] = []
): StructuredNluOutput {
  const trimmed = input.trim();
  const lowered = trimmed.toLowerCase();

  const isUrduScript = /[\u0600-\u06FF]/.test(trimmed);
  const language: Language = isUrduScript ? "ur" : "en";

  // High Priority 1: Check for Language Change
  const langChange = detectLanguageChangeIntent(trimmed);
  if (langChange.isLanguageChange && langChange.targetLanguage) {
    return {
      intent: "LANGUAGE_CHANGE",
      targetLanguage: langChange.targetLanguage,
      language: langChange.targetLanguage,
      products: [],
      rawText: trimmed,
    };
  }

  // Check for Human Handoff / Escalation
  if (lowered.includes("human") || lowered.includes("agent") || lowered.includes("support") || lowered.includes("talk to owner")) {
    return { intent: "HUMAN_ESCALATE", language, products: [], rawText: trimmed };
  }

  // Check for Order Status / Tracking
  if (lowered.includes("my order") || lowered.includes("track order") || lowered.includes("status") || lowered.includes("order status")) {
    return { intent: "CHECK_ORDER", language, products: [], rawText: trimmed };
  }

  // Check for Cancellation
  if (lowered.includes("cancel order") || lowered.includes("cancel my order") || lowered.includes("order cancel")) {
    return { intent: "CANCEL_ORDER", language, products: [], rawText: trimmed };
  }

  // Check for Item Removal (e.g. "remove black forest", "black forest nahi chahiye", "ye wala hata do", "remove that")
  if (
    lowered.includes("nahi chahiye") ||
    lowered.includes("nahe chahiye") ||
    lowered.includes("remove") ||
    lowered.includes("delete") ||
    lowered.includes("hata do") ||
    lowered.includes("hata dein")
  ) {
    const cleanText = lowered
      .replace(/(?:actually|yar|bhai|mujhe|mjhe|pls|please|nahi chahiye|nahe chahiye|remove|delete|cancel|don't want|ye wala|hata do|hata dein|that)/gi, "")
      .trim();

    const resolved = resolveProductAlias(cleanText);
    const targetId = resolved?.id || (currentCartProductIds.length > 0 ? currentCartProductIds[currentCartProductIds.length - 1] : undefined);

    if (targetId) {
      return {
        intent: "REMOVE_FROM_CART",
        language,
        products: [],
        removedProductId: targetId,
        rawText: trimmed,
      };
    }
  }

  // Check for Quantity Correction (e.g. "make it 3", "actually make it 4", "change to 2", "nahi 3 kar do", "3 pieces")
  const isQtyCorrectionPhrase =
    /(?:make\s*(?:it|that)?|change\s*(?:to)?|set\s*(?:to)?|actually|nahi|only)\b/i.test(lowered) ||
    /^(?:\d+|\w+)\s*(?:kar do|kar dein|kardo|krdo|pieces|pcs)?$/i.test(lowered);

  if (isQtyCorrectionPhrase && (currentStep === "ORDER_CONFIRM_ITEMS" || currentStep === "PRODUCT_QUANTITY" || currentCartProductIds.length > 0)) {
    const parsedVal = parseWordOrDigitQuantity(lowered);
    if (parsedVal && parsedVal > 0) {
      return {
        intent: "QUANTITY_UPDATE",
        language,
        products: [],
        quantityUpdate: {
          quantity: parsedVal,
          targetProductId: currentCartProductIds[currentCartProductIds.length - 1],
        },
        rawText: trimmed,
      };
    }
  }

  // Check for Relative Increment (e.g. "ek aur", "add another", "one more")
  if (
    (lowered.includes("ek aur") || lowered.includes("one more") || lowered.includes("add another") || lowered.includes("aik aur")) &&
    currentCartProductIds.length > 0
  ) {
    return {
      intent: "QUANTITY_UPDATE",
      language,
      products: [],
      quantityUpdate: {
        quantity: 2, // Relative bump handled in state machine
        targetProductId: currentCartProductIds[currentCartProductIds.length - 1],
      },
      rawText: trimmed,
    };
  }

  // Check for Checkout Intent
  if (lowered === "checkout" || lowered === "check out" || lowered.includes("proceed to checkout") || lowered.includes("bill bana dein")) {
    return { intent: "CHECKOUT", language, products: [], rawText: trimmed };
  }

  // Check for Category Match (Browsing intent)
  // Multi-Product Natural Language Extraction across live catalogue
  const extractedProducts: ExtractedProduct[] = [];

  // Split by line or natural delimiters ("and", "aur", commas)
  const segments = trimmed
    .split(/[\n,;]|(?:\s+and\s+)|(?:\s+aur\s+)/i)
    .map((s) => s.trim())
    .filter(Boolean);

  // Check if customer provided explicit quantity or ordering intent
  const parsedFullQty = parseWordOrDigitQuantity(lowered);
  const hasOrderingIntent =
    parsedFullQty != null ||
    lowered.includes("add") ||
    lowered.includes("order") ||
    lowered.includes("chahiye") ||
    lowered.includes("bhejo") ||
    lowered.includes("kar do") ||
    lowered.includes("kardo") ||
    lowered.includes("bana do");

  for (const seg of segments) {
    const segLower = seg.toLowerCase();
    const parsedQty = parseWordOrDigitQuantity(segLower);

    // Remove numbers and words for product resolution
    const cleanedSeg = segLower
      .replace(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|ek|aik|do|teen|char|chaar|paanch|che|saat|aath|nau|das)\b/gi, "")
      .replace(/(?:x|pieces|pcs|karna hai|chahiye|add|kardo|kar do)/gi, "")
      .trim();

    const matchedProd = resolveProductAlias(cleanedSeg) || resolveProductAlias(segLower);
    if (matchedProd) {
      if (typeof parsedQty === "number" || hasOrderingIntent || segments.length > 1) {
        const qty = parsedQty || parsedFullQty || 1;
        const existing = extractedProducts.find((p) => p.productId === matchedProd.id);
        if (existing) {
          existing.quantity = qty;
        } else {
          extractedProducts.push({
            productId: matchedProd.id,
            productName: matchedProd.nameEn,
            quantity: qty,
            cheeseAddon: segLower.includes("extra cheese") || segLower.includes("cheese"),
          });
        }
      } else {
        // Customer named single product without quantity or ordering verb -> ask quantity!
        return {
          intent: "SELECT_PRODUCT",
          language,
          selectedProductId: matchedProd.id,
          products: [],
          rawText: trimmed,
        };
      }
    }
  }

  // If no products matched via segments, test full text against live PRODUCTS dynamically
  if (extractedProducts.length === 0) {
    for (const prod of PRODUCTS) {
      const nameEnLower = prod.nameEn.toLowerCase();
      if (lowered.includes(nameEnLower) || (prod.nameUr && lowered.includes(prod.nameUr.toLowerCase()))) {
        if (hasOrderingIntent) {
          extractedProducts.push({
            productId: prod.id,
            productName: prod.nameEn,
            quantity: parsedFullQty || 1,
            cheeseAddon: lowered.includes("extra cheese") || lowered.includes("cheese"),
          });
        } else {
          return {
            intent: "SELECT_PRODUCT",
            language,
            selectedProductId: prod.id,
            products: [],
            rawText: trimmed,
          };
        }
      }
    }
  }

  if (extractedProducts.length > 0) {
    return {
      intent: "ADD_TO_CART",
      language,
      products: extractedProducts,
      rawText: trimmed,
    };
  }

  // Check single product selection
  const singleProd = resolveProductAlias(trimmed);
  if (singleProd) {
    return {
      intent: "SELECT_PRODUCT",
      language,
      selectedProductId: singleProd.id,
      products: [],
      rawText: trimmed,
    };
  }

  // Check for Category Match (Browsing intent, runs when no specific product is ordered)
  const catMatch = matchCategory(trimmed);
  if (catMatch) {
    return { intent: "SELECT_CATEGORY", language, selectedCategoryId: catMatch.id, products: [], rawText: trimmed };
  }

  // Check for Menu / Catalog Inquiry (e.g. "menu", "mujhe menu de dein", "show menu", "kya items hain")
  if (
    /\bmenu\b/i.test(lowered) ||
    /\bcatalog(?:ue)?\b/i.test(lowered) ||
    lowered.includes("kiya kiya") ||
    lowered.includes("kya kya") ||
    lowered.includes("kya items") ||
    lowered.includes("aur kya") ||
    lowered.includes("aur apky pass") ||
    lowered.includes("what items")
  ) {
    return { intent: "INQUIRE_CATALOG", language, products: [], rawText: trimmed };
  }

  // Check for Greeting (e.g. "hello", "hi", "salam", "aoa", "assalam-o-alaikum")
  if (/^(?:hi|hello|hey|salam|slam|aoa|assalam[- ]?o[- ]?alaikum|adaab)\b/i.test(lowered)) {
    return { intent: "GREETING", language, products: [], rawText: trimmed };
  }

  return {
    intent: "GENERAL_QUERY",
    language,
    products: [],
    rawText: trimmed,
  };
}

