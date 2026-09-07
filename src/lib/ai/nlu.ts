import { PRODUCTS, findProductById, resolveProductAlias, matchCategory, type CakestryProduct } from "@/lib/cakestry";
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
  products: ExtractedProduct[];
  quantityUpdate?: { quantity: number; targetProductId?: string };
  removedProductId?: string;
  customerDetails?: CustomerDetailsExtracted;
  ambiguousProducts?: string[];
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
 * Main NLU Entry Point
 * Fast deterministic recognition runs first, then OpenAI ChatGPT JSON extraction, then fallback parser.
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
    return { intent: "SELECT_CATEGORY", language: lang, products: [], rawText: trimmed };
  }
  if (trimmed.startsWith("prod:")) {
    return { intent: "SELECT_PRODUCT", language: lang, products: [], rawText: trimmed };
  }
  if (trimmed.startsWith("qty:")) {
    return { intent: "QUANTITY_UPDATE", language: lang, products: [], rawText: trimmed };
  }
  if (trimmed.startsWith("addon:")) {
    return { intent: "PROVIDE_DETAILS", language: lang, products: [], rawText: trimmed };
  }
  if (trimmed.startsWith("btn:menu") || trimmed.startsWith("btn:back_categories")) {
    return { intent: "INQUIRE_CATALOG", language: lang, products: [], rawText: trimmed };
  }
  if (trimmed.startsWith("btn:checkout")) {
    return { intent: "CHECKOUT", language: lang, products: [], rawText: trimmed };
  }
  if (trimmed.startsWith("btn:human")) {
    return { intent: "HUMAN_ESCALATE", language: lang, products: [], rawText: trimmed };
  }

  // 0b. High Priority Language Change
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

  // 0c. Category Direct Match (e.g. "Pastries", "🥐 Pastries", "Brownies", "Donuts")
  const catMatch = matchCategory(trimmed);
  if (catMatch) {
    return {
      intent: "SELECT_CATEGORY",
      language: lang,
      products: [],
      rawText: trimmed,
    };
  }

  // 1. Try ChatGPT API if key is set
  if (config.ai.openaiApiKey) {
    try {
      const llmResult = await extractWithChatGPT(trimmed, currentStep, currentCartProductIds);
      if (llmResult && llmResult.products) {
        // Validate all extracted products against server-side catalogue
        const validatedProducts: ExtractedProduct[] = [];
        for (const p of llmResult.products) {
          const resolved = resolveProductAlias(p.productId || p.productName);
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
        return llmResult;
      }
    } catch (err) {
      console.warn("[NLU] ChatGPT extraction failed, using deterministic parser:", err);
    }
  }

  // 2. Deterministic Server-Side Parser (Zero-latency fallback)
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
 */
async function extractWithChatGPT(
  text: string,
  currentStep?: string,
  currentCartProductIds: string[] = []
): Promise<StructuredNluOutput | null> {
  const apiKey = config.ai.openaiApiKey;
  if (!apiKey) return null;

  const catalogList = PRODUCTS.map((p) => `id: "${p.id}", name: "${p.nameEn}", price: ${p.price}`).join("\n");

  const systemPrompt = `You are the NLU engine for Cakestry Bakery WhatsApp Chatbot.
Your job is to convert natural user text (English, Urdu, or Roman Urdu) into structured JSON.

Catalogue of valid products:
${catalogList}

Rules:
1. Extract ALL products mentioned in the text with their quantities.
2. If quantity is specified (e.g. "2 chocolate fudge cakes"), extract quantity: 2. Default quantity is 1 if unspecified.
3. NEVER invent products not in the catalogue.
4. If user requests language change (e.g. "English please", "Please conversation I'm english", "urdu mein baat karo"), set intent: "LANGUAGE_CHANGE" and targetLanguage: "en" | "ur".
5. If user corrects quantity (e.g. "nahi 3 kar do", "make that 3"), set intent: "QUANTITY_UPDATE" and quantityUpdate: { quantity: N }.
6. If user says to remove an item (e.g. "black forest nahi chahiye"), set intent: "REMOVE_FROM_CART" and removedProductId.
7. Return JSON matching this exact structure:
{
  "intent": "LANGUAGE_CHANGE" | "ADD_TO_CART" | "QUANTITY_UPDATE" | "REMOVE_FROM_CART" | "INQUIRE_CATALOG" | "CHECK_ORDER" | "CANCEL_ORDER" | "HUMAN_ESCALATE" | "GREETING" | "GENERAL_QUERY",
  "targetLanguage": "en" | "ur",
  "language": "en" | "ur",
  "products": [ { "productId": "exact_id", "productName": "name", "quantity": number } ],
  "quantityUpdate": { "quantity": number, "targetProductId": "optional_id" },
  "removedProductId": "optional_id",
  "customerDetails": { "deliveryType": "DELIVERY" | "PICKUP", "name": "string", "phone": "string", "address": "string", "dateTime": "string" }
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
        { role: "user", content: `Context Step: ${currentStep || "UNKNOWN"}. Current Cart Items: ${currentCartProductIds.join(", ")}. Text: "${text}"` },
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
    products: Array.isArray(parsed.products) ? parsed.products : [],
    quantityUpdate: parsed.quantityUpdate,
    removedProductId: parsed.removedProductId,
    customerDetails: parsed.customerDetails,
    rawText: text,
  };
}

/**
 * Deterministic Server-Side Offline NLU Parser
 * Handles English, Roman Urdu, Urdu, multi-line multi-product inputs, and quantity corrections.
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

  // Deterministic button prefixes
  if (trimmed.startsWith("cat:")) return { intent: "SELECT_CATEGORY", language, products: [], rawText: trimmed };
  if (trimmed.startsWith("prod:")) return { intent: "SELECT_PRODUCT", language, products: [], rawText: trimmed };
  if (trimmed.startsWith("qty:")) return { intent: "QUANTITY_UPDATE", language, products: [], rawText: trimmed };

  // Category match
  const catMatch = matchCategory(trimmed);
  if (catMatch) {
    return { intent: "SELECT_CATEGORY", language, products: [], rawText: trimmed };
  }

  // Check for Catalogue / Menu Inquiry
  if (
    lowered.includes("kiya kiya") ||
    lowered.includes("kya kya") ||
    lowered.includes("kya items") ||
    lowered.includes("aur kya") ||
    lowered.includes("aur apky pass") ||
    lowered.includes("show menu") ||
    lowered.includes("what items")
  ) {
    return { intent: "INQUIRE_CATALOG", language, products: [], rawText: trimmed };
  }

  // Check for Quantity Correction (e.g. "Nahi 3 kar do", "Make that 3", "actually 3", "qty 3")
  const qtyCorrectionMatch =
    lowered.match(/(?:nahi|actually|make that|change to|set to|qty|quantity)\s*(\d+)/i) ||
    lowered.match(/^(\d+)\s*(?:kar do|kar dein|kardo|krdo|pieces|pcs)?$/i);

  if (qtyCorrectionMatch && (currentStep === "ORDER_CONFIRM_ITEMS" || currentStep === "PRODUCT_QUANTITY" || currentCartProductIds.length > 0)) {
    const newQty = parseInt(qtyCorrectionMatch[1], 10);
    if (!isNaN(newQty) && newQty > 0) {
      return {
        intent: "QUANTITY_UPDATE",
        language,
        products: [],
        quantityUpdate: {
          quantity: newQty,
          targetProductId: currentCartProductIds[currentCartProductIds.length - 1],
        },
        rawText: trimmed,
      };
    }
  }

  // Check for Item Removal (e.g. "black forest nahi chahiye", "remove black forest")
  if (lowered.includes("nahi chahiye") || lowered.includes("nahe chahiye") || lowered.includes("remove") || lowered.includes("delete")) {
    const cleanText = lowered.replace(/(?:actually|yar|bhai|mujhe|mjhe|pls|please|nahi chahiye|nahe chahiye|remove|delete|cancel|don't want)/gi, "").trim();
    const resolved = resolveProductAlias(cleanText);
    if (resolved) {
      return {
        intent: "REMOVE_FROM_CART",
        language,
        products: [],
        removedProductId: resolved.id,
        rawText: trimmed,
      };
    }
  }

  // Multi-Product Extraction Phase
  const extractedProducts: ExtractedProduct[] = [];

  // Split multi-line input or phrases separated by newlines, commas, or 'and' / 'aur'
  const lines = trimmed
    .split(/[\n,;]|(?:\s+and\s+)|(?:\s+aur\s+)/i)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const lineLowered = line.toLowerCase();

    // Check if line contains a quantity number (e.g. "1 cream puffs", "2 chocolate fudge cakes", "karna hai 2")
    const qtyMatch = lineLowered.match(/(?:^|\s)(\d+)(?:\s*x|\s+|$)/i) || lineLowered.match(/karna hai\s*(\d+)/i) || lineLowered.match(/(\d+)\s*$/);
    let qty = 1;
    if (qtyMatch) {
      const parsedQty = parseInt(qtyMatch[1], 10);
      if (!isNaN(parsedQty) && parsedQty > 0 && parsedQty <= 50) {
        qty = parsedQty;
      }
    }

    // Clean leading/trailing quantity digits/words for product resolution
    const cleanedLine = lineLowered
      .replace(/^(?:\s*\d+\s*x?\s*|\s*karna hai\s*\d+\s*)/i, "")
      .replace(/(?:\s+\d+\s*)$/, "")
      .trim();

    // Try resolving product against authoritative catalogue
    const matchedProd = resolveProductAlias(lineLowered) || resolveProductAlias(cleanedLine);
    if (matchedProd) {
      // Check for duplicate in current extraction line
      const existing = extractedProducts.find((p) => p.productId === matchedProd.id);
      if (existing) {
        existing.quantity = qty;
      } else {
        extractedProducts.push({
          productId: matchedProd.id,
          productName: matchedProd.nameEn,
          quantity: qty,
          cheeseAddon: lineLowered.includes("extra cheese") || lineLowered.includes("cheese"),
        });
      }
    }
  }

  // If no products matched via line split, scan whole text across all products
  if (extractedProducts.length === 0) {
    for (const prod of PRODUCTS) {
      const nameEnLower = prod.nameEn.toLowerCase();
      if (lowered.includes(nameEnLower) || lowered.includes(prod.nameUr.toLowerCase())) {
        // Extract quantity near the product name if possible
        const prodRegex = new RegExp(`(\\d+)\\s*(?:x\\s*)?${nameEnLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
        const match = lowered.match(prodRegex);
        const qty = match ? parseInt(match[1], 10) : 1;

        extractedProducts.push({
          productId: prod.id,
          productName: prod.nameEn,
          quantity: isNaN(qty) || qty <= 0 ? 1 : qty,
          cheeseAddon: lowered.includes("extra cheese") || lowered.includes("cheese"),
        });
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

  return {
    intent: "GENERAL_QUERY",
    language,
    products: [],
    rawText: trimmed,
  };
}
