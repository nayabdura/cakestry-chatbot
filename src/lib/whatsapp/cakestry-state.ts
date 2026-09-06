import type { Language } from "@/lib/i18n";
import {
  CATEGORIES,
  PRODUCTS,
  SADAPAY_DETAILS,
  BAKERY_BUSINESS_INFO,
  calculateOrderTotals,
  findProductById,
  findProductsByCategory,
  findProductByName,
  type CakestryProduct,
} from "@/lib/cakestry";
import type { ReplyButton, ListRow } from "./types";

export type CakestryStepState =
  | "WELCOME"
  | "MAIN_MENU"
  | "CATEGORY_VIEW"
  | "PRODUCT_QUANTITY"
  | "CHEESE_ADDON"
  | "ORDER_CONFIRM_ITEMS"
  | "CHECKOUT_DELIVERY_TYPE"
  | "CHECKOUT_NAME"
  | "CHECKOUT_PHONE"
  | "CHECKOUT_ADDRESS"
  | "CHECKOUT_DATE_TIME"
  | "PAYMENT_VERIFICATION"
  | "CUSTOM_CAKE_WEIGHT"
  | "CUSTOM_CAKE_FLAVOR"
  | "CUSTOM_CAKE_DESIGN"
  | "CUSTOM_CAKE_DATE_TIME"
  | "MY_ORDER"
  | "MODIFY_ORDER"
  | "RESCHEDULE_ORDER"
  | "CANCEL_ORDER";

export interface CakestryOrderItem {
  productId: string;
  quantity: number;
  cheeseAddon?: boolean;
}

export interface CakestryOrderDraft {
  items: CakestryOrderItem[];
  deliveryType?: "DELIVERY" | "PICKUP";
  customerName?: string;
  phone?: string;
  deliveryAddress?: string;
  dateTime?: string;
  pendingQuantityProduct?: string;
  discountRequested?: boolean;
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
}

export interface CustomCakeDraft {
  weight?: string;
  flavor?: string;
  design?: string;
  dateTime?: string;
}

export interface CakestryStateData {
  version: 2;
  step: CakestryStepState;
  language: Language;
  selectedCategory?: string;
  selectedProduct?: string;
  orderDraft: CakestryOrderDraft;
  customCakeDraft?: CustomCakeDraft;
  updatedAt: string;
}

export const CATEGORY_BUTTON_PREFIX = "cat:";
export const PRODUCT_BUTTON_PREFIX = "prod:";
export const QUANTITY_BUTTON_PREFIX = "qty:";
export const OPTION_PREFIX = "opt:";
export const ADDON_PREFIX = "addon:";
export const ACTION_BUTTON_PREFIX = "act:";

export function initCakestryState(language: Language): CakestryStateData {
  return {
    version: 2,
    step: "WELCOME",
    language,
    orderDraft: { items: [] },
    updatedAt: new Date().toISOString(),
  };
}

export interface ActionOutcome {
  handled: boolean;
  state: CakestryStateData;
  reply: {
    text: string;
    buttons?: ReplyButton[];
    list?: { label: string; rows: ListRow[] };
    footer?: string;
  };
  completeOrder?: boolean;
  completeCustomCake?: boolean;
  escalate?: boolean;
}

export function processCakestryTurn(
  currentState: CakestryStateData | null,
  input: string,
  language: Language,
  waPhone: string
): ActionOutcome {
  let state = currentState || initCakestryState(language);
  state.language = language;
  state.updatedAt = new Date().toISOString();

  const trimmed = input.trim();
  const lowered = trimmed.toLowerCase();

  // Global triggers
  if (lowered === "menu" || lowered === "start" || lowered === "restart" || lowered === "main menu" || trimmed === `${ACTION_BUTTON_PREFIX}menu` || trimmed === `${ACTION_BUTTON_PREFIX}back_categories`) {
    state.step = "MAIN_MENU";
    state.selectedCategory = undefined;
    state.selectedProduct = undefined;
    return renderMainMenu(state);
  }

  const isCatalogueInquiry =
    lowered.includes("kiya kiya") ||
    lowered.includes("kya kya") ||
    lowered.includes("kya items") ||
    lowered.includes("kiya items") ||
    lowered.includes("aur kya") ||
    lowered.includes("aur kia") ||
    lowered.includes("or apky pass") ||
    lowered.includes("aur apky pass") ||
    lowered.includes("what items") ||
    lowered.includes("what do you have") ||
    lowered.includes("show menu") ||
    lowered.includes("kya milta");

  if (isCatalogueInquiry) {
    return renderCatalogueOverview(state);
  }

  if (trimmed === `${ACTION_BUTTON_PREFIX}human` || lowered.includes("human") || lowered.includes("agent") || lowered.includes("support")) {
    return {
      handled: true,
      state,
      escalate: true,
      reply: {
        text: language === "ur"
          ? "🎫 آپ کی درخواست کیکسٹری بیکری ٹیم کو منتقل کی جا رہی ہے۔ ہماری ٹیم کا نمائندہ جلد آپ سے رابطہ کرے گا۔ 🕐"
          : "🎫 Connecting you to the Cakestry Bakery team. A representative will contact you shortly. 🕐",
      },
    };
  }

  if (trimmed === `${ACTION_BUTTON_PREFIX}my_order` || lowered === "my order" || lowered === "track order" || trimmed === `${CATEGORY_BUTTON_PREFIX}my_order`) {
    state.step = "MY_ORDER";
    return renderMyOrder(state, waPhone);
  }

  // --- Handling button / user selections based on state or direct prefixes ---

  // Language selection
  if (trimmed.startsWith("lang:")) {
    const langCode = trimmed.slice(5);
    state.language = langCode === "ur" ? "ur" : "en";
    state.step = "MAIN_MENU";
    return renderMainMenu(state);
  }

  // Category tap (e.g. cat:signature_cakes)
  if (trimmed.startsWith(CATEGORY_BUTTON_PREFIX)) {
    const catId = trimmed.slice(CATEGORY_BUTTON_PREFIX.length);
    if (catId === "custom_cakes") {
      state.step = "CUSTOM_CAKE_WEIGHT";
      state.customCakeDraft = {};
      return renderCustomCakeWeight(state);
    }
    if (catId === "my_order") {
      state.step = "MY_ORDER";
      return renderMyOrder(state, waPhone);
    }
    if (catId === "location") {
      return renderLocationInfo(state);
    }

    state.selectedCategory = catId;
    state.step = "CATEGORY_VIEW";
    return renderCategoryView(state, catId);
  }

  // Product tap (e.g. prod:choc_dream)
  if (trimmed.startsWith(PRODUCT_BUTTON_PREFIX)) {
    const prodId = trimmed.slice(PRODUCT_BUTTON_PREFIX.length);
    const prod = findProductById(prodId);
    if (prod) {
      state.selectedProduct = prodId;
      state.step = "PRODUCT_QUANTITY";
      return renderProductQuantityPrompt(state, prod);
    }
  }

  // Quantity tap (e.g. qty:1)
  if (trimmed.startsWith(QUANTITY_BUTTON_PREFIX) || (state.step === "PRODUCT_QUANTITY" && !isNaN(parseInt(trimmed, 10)))) {
    const qtyNum = trimmed.startsWith(QUANTITY_BUTTON_PREFIX)
      ? parseInt(trimmed.slice(QUANTITY_BUTTON_PREFIX.length), 10)
      : parseInt(trimmed, 10);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      return {
        handled: true,
        state,
        reply: {
          text: state.language === "ur"
            ? "براہِ کرم صحیح تعداد لکھیں (مثلاً 1، 2، 3)۔"
            : "Please enter a valid quantity (e.g., 1, 2, 3).",
        },
      };
    }

    const prodId = state.selectedProduct;
    const prod = prodId ? findProductById(prodId) : undefined;
    if (prod) {
      state.orderDraft.pendingQuantityProduct = prodId;

      if (prod.allowCheeseAddon) {
        state.step = "CHEESE_ADDON";
        state.orderDraft.items.push({ productId: prod.id, quantity: qtyNum, cheeseAddon: false });
        return renderCheeseAddonPrompt(state, prod, qtyNum);
      } else {
        state.orderDraft.items.push({ productId: prod.id, quantity: qtyNum, cheeseAddon: false });
        state.step = "ORDER_CONFIRM_ITEMS";
        return renderOrderConfirmItems(state, prod, qtyNum);
      }
    }
  }

  // Cheese Addon response
  if (state.step === "CHEESE_ADDON" && (trimmed.startsWith(ADDON_PREFIX) || lowered.includes("yes") || lowered.includes("no") || lowered.includes("چیز"))) {
    const wantsCheese = trimmed === `${ADDON_PREFIX}yes` || lowered.includes("yes") || lowered.includes("ہاں") || lowered.includes("چیز");
    const lastItemIndex = state.orderDraft.items.length - 1;
    if (lastItemIndex >= 0) {
      state.orderDraft.items[lastItemIndex].cheeseAddon = wantsCheese;
    }
    state.step = "ORDER_CONFIRM_ITEMS";
    const lastItem = state.orderDraft.items[lastItemIndex];
    const prod = lastItem ? findProductById(lastItem.productId) : undefined;
    return renderOrderConfirmItems(state, prod, lastItem ? lastItem.quantity : 1);
  }

  // Add more items tap
  if (trimmed === `${ACTION_BUTTON_PREFIX}add_more` || lowered.includes("add more")) {
    state.step = "MAIN_MENU";
    return renderMainMenu(state);
  }

  // Checkout tap
  if (trimmed === `${ACTION_BUTTON_PREFIX}checkout` || lowered.includes("checkout")) {
    if (!state.orderDraft.items.length) {
      state.step = "MAIN_MENU";
      return renderMainMenu(state);
    }
    state.step = "CHECKOUT_DELIVERY_TYPE";
    return renderCheckoutDeliveryType(state);
  }

  // Delivery type choice
  if (state.step === "CHECKOUT_DELIVERY_TYPE" && (trimmed.startsWith(OPTION_PREFIX) || lowered.includes("delivery") || lowered.includes("pickup") || lowered.includes("ڈیلیوری"))) {
    const isPickup = trimmed === `${OPTION_PREFIX}pickup` || lowered.includes("pickup");
    state.orderDraft.deliveryType = isPickup ? "PICKUP" : "DELIVERY";
    state.step = "CHECKOUT_NAME";
    return renderCheckoutNamePrompt(state);
  }

  // Name step
  if (state.step === "CHECKOUT_NAME" && trimmed.length >= 2) {
    state.orderDraft.customerName = trimmed;
    state.step = "CHECKOUT_PHONE";
    return renderCheckoutPhonePrompt(state, waPhone);
  }

  // Phone step
  if (state.step === "CHECKOUT_PHONE") {
    state.orderDraft.phone = trimmed === "use_wa_number" || trimmed === `${OPTION_PREFIX}use_wa_phone` ? waPhone : trimmed;
    if (state.orderDraft.deliveryType === "DELIVERY") {
      state.step = "CHECKOUT_ADDRESS";
      return renderCheckoutAddressPrompt(state);
    } else {
      state.step = "CHECKOUT_DATE_TIME";
      return renderCheckoutDateTimePrompt(state);
    }
  }

  // Address step
  if (state.step === "CHECKOUT_ADDRESS" && trimmed.length >= 3) {
    state.orderDraft.deliveryAddress = trimmed;
    state.step = "CHECKOUT_DATE_TIME";
    return renderCheckoutDateTimePrompt(state);
  }

  // Date & Time step -> produces final Order Summary & SadaPay instructions
  if (state.step === "CHECKOUT_DATE_TIME" && trimmed.length >= 2) {
    state.orderDraft.dateTime = trimmed;
    state.step = "PAYMENT_VERIFICATION";
    return renderOrderSummaryAndPayment(state);
  }

  // Custom Cake Steps
  if (state.step === "CUSTOM_CAKE_WEIGHT") {
    if (!state.customCakeDraft) state.customCakeDraft = {};
    state.customCakeDraft.weight = trimmed;
    state.step = "CUSTOM_CAKE_FLAVOR";
    return renderCustomCakeFlavor(state);
  }

  if (state.step === "CUSTOM_CAKE_FLAVOR") {
    if (!state.customCakeDraft) state.customCakeDraft = {};
    state.customCakeDraft.flavor = trimmed;
    state.step = "CUSTOM_CAKE_DESIGN";
    return renderCustomCakeDesign(state);
  }

  if (state.step === "CUSTOM_CAKE_DESIGN") {
    if (!state.customCakeDraft) state.customCakeDraft = {};
    state.customCakeDraft.design = trimmed;
    state.step = "CUSTOM_CAKE_DATE_TIME";
    return renderCustomCakeDateTime(state);
  }

  if (state.step === "CUSTOM_CAKE_DATE_TIME") {
    if (!state.customCakeDraft) state.customCakeDraft = {};
    state.customCakeDraft.dateTime = trimmed;
    return renderCustomCakeComplete(state);
  }

  // Check if text matches a category or product directly
  const matchedProd = findProductByName(trimmed);
  if (matchedProd) {
    state.selectedProduct = matchedProd.id;
    state.step = "PRODUCT_QUANTITY";
    return renderProductQuantityPrompt(state, matchedProd);
  }

  const matchedCat = CATEGORIES.find(
    (c) => c.nameEn.toLowerCase().includes(lowered) || c.nameUr.toLowerCase().includes(lowered) || c.id === lowered
  );
  if (matchedCat) {
    if (matchedCat.id === "custom_cakes") {
      state.step = "CUSTOM_CAKE_WEIGHT";
      state.customCakeDraft = {};
      return renderCustomCakeWeight(state);
    }
    if (matchedCat.id === "my_order") {
      state.step = "MY_ORDER";
      return renderMyOrder(state, waPhone);
    }
    if (matchedCat.id === "location") {
      return renderLocationInfo(state);
    }
    state.selectedCategory = matchedCat.id;
    state.step = "CATEGORY_VIEW";
    return renderCategoryView(state, matchedCat.id);
  }

  // If not handled deterministically, return false so LLM NLU can answer general questions!
  return { handled: false, state, reply: { text: "" } };
}

// ------------------------------------------------------------- View Renderers --

function renderMainMenu(state: CakestryStateData): ActionOutcome {
  const isUr = state.language === "ur";
  const text = isUr
    ? "کیکسٹری بیکری میں آپ کو کیا پسند آئے گا؟ 👇\nزمرہ منتخب کریں:"
    : "Welcome to Cakestry Bakery! 🎂\nHow can I help you today? Select a category below:";

  const rows: ListRow[] = CATEGORIES.map((cat) => ({
    id: `${CATEGORY_BUTTON_PREFIX}${cat.id}`,
    title: (isUr ? `${cat.icon} ${cat.nameUr}` : `${cat.icon} ${cat.nameEn}`).slice(0, 24),
    description: (isUr ? cat.descriptionUr : cat.descriptionEn).slice(0, 72),
  }));

  return {
    handled: true,
    state,
    reply: {
      text,
      list: {
        label: isUr ? "مینو کے زمرے" : "Main Categories",
        rows,
      },
    },
  };
}

function renderCategoryView(state: CakestryStateData, catId: string): ActionOutcome {
  const isUr = state.language === "ur";
  const cat = CATEGORIES.find((c) => c.id === catId);
  const products = findProductsByCategory(catId);

  let text = isUr
    ? `🎂 *${cat?.nameUr || "مصنوعات"}*\n\n`
    : `🎂 *${cat?.nameEn || "Products"}*\n\n`;

  products.forEach((p, idx) => {
    text += `${idx + 1}. *${isUr ? p.nameUr : p.nameEn}* — Rs. ${p.price.toLocaleString()}\n`;
  });

  text += isUr
    ? "\nآپ کون سا آرڈر کرنا چاہتے ہیں؟ کیک منتخب کریں یا بٹن دبائیں:"
    : "\nWhich product would you like to order? Select below:";

  const buttons: ReplyButton[] = products.slice(0, 2).map((p) => ({
    id: `${PRODUCT_BUTTON_PREFIX}${p.id}`,
    title: (isUr ? p.nameUr : p.nameEn).slice(0, 20),
  }));

  buttons.push({
    id: `${ACTION_BUTTON_PREFIX}back_categories`,
    title: isUr ? "⬅️ مین مینو" : "⬅️ Main Menu",
  });

  const listRows: ListRow[] = products.map((p) => ({
    id: `${PRODUCT_BUTTON_PREFIX}${p.id}`,
    title: (isUr ? p.nameUr : p.nameEn).slice(0, 24),
    description: `Rs. ${p.price.toLocaleString()} (${p.unit})`.slice(0, 72),
  }));

  return {
    handled: true,
    state,
    reply: {
      text,
      list: products.length > 2 ? { label: isUr ? "مصنوعات منتخب کریں" : "Select Product", rows: listRows } : undefined,
      buttons: products.length <= 2 ? buttons : [{ id: `${ACTION_BUTTON_PREFIX}back_categories`, title: isUr ? "⬅️ مین مینو" : "⬅️ Main Menu" }],
    },
  };
}

function renderProductQuantityPrompt(state: CakestryStateData, prod: CakestryProduct): ActionOutcome {
  const isUr = state.language === "ur";
  const text = isUr
    ? `🎂 *${prod.nameUr}*\nقیمت: Rs. ${prod.price.toLocaleString()} (${prod.unit})\n\nآپ کتنی تعداد میں آرڈر کرنا چاہتے ہیں؟`
    : `🎂 *${prod.nameEn}*\nPrice: Rs. ${prod.price.toLocaleString()} (${prod.unit})\n\nHow many would you like to order?`;

  const buttons: ReplyButton[] = [
    { id: `${QUANTITY_BUTTON_PREFIX}1`, title: "1️⃣ One" },
    { id: `${QUANTITY_BUTTON_PREFIX}2`, title: "2️⃣ Two" },
    { id: `${QUANTITY_BUTTON_PREFIX}3`, title: "3️⃣ Three" },
  ];

  return {
    handled: true,
    state,
    reply: { text, buttons },
  };
}

function renderCheeseAddonPrompt(state: CakestryStateData, prod: CakestryProduct, qty: number): ActionOutcome {
  const isUr = state.language === "ur";
  const text = isUr
    ? `🧀 *ایکسٹرا چیز (Extra Cheese)*\nکیا آپ Rs. 70 میں ایکسٹرا چیز شامل کرنا چاہتے ہیں؟`
    : `🧀 *Extra Cheese Add-On*\nWould you like to add Extra Cheese for Rs. 70 per item?`;

  const buttons: ReplyButton[] = [
    { id: `${ADDON_PREFIX}yes`, title: isUr ? "✅ ہاں، چیز شامل کریں" : "✅ Yes (+Rs. 70)" },
    { id: `${ADDON_PREFIX}no`, title: isUr ? "❌ نہیں، شکریہ" : "❌ No Thanks" },
  ];

  return { handled: true, state, reply: { text, buttons } };
}

function renderOrderConfirmItems(state: CakestryStateData, prod?: CakestryProduct, qty: number = 1): ActionOutcome {
  const isUr = state.language === "ur";
  const totals = calculateOrderTotals(state.orderDraft.items);

  let text = isUr
    ? `✅ *آرڈر کارٹ میں شامل ہو گیا!* 🛒\n\n`
    : `✅ *Added to your Cart!* 🛒\n\n`;

  totals.itemized.forEach((item) => {
    const cheeseStr = item.cheeseAddon ? (isUr ? " (+چیز)" : " (+Extra Cheese)") : "";
    text += `• ${item.quantity}x *${isUr ? item.product.nameUr : item.product.nameEn}*${cheeseStr} = Rs. ${item.lineTotal.toLocaleString()}\n`;
  });

  text += isUr
    ? `\n*کل رقم (Subtotal): Rs. ${totals.subtotal.toLocaleString()}*`
    : `\n*Subtotal: Rs. ${totals.subtotal.toLocaleString()}*`;

  const buttons: ReplyButton[] = [
    { id: `${ACTION_BUTTON_PREFIX}add_more`, title: isUr ? "➕ مزید شامل کریں" : "➕ Add More Items" },
    { id: `${ACTION_BUTTON_PREFIX}checkout`, title: isUr ? "🛍️ چیک آؤٹ کریں" : "🛍️ Checkout Now" },
  ];

  return { handled: true, state, reply: { text, buttons } };
}

function renderCheckoutDeliveryType(state: CakestryStateData): ActionOutcome {
  const isUr = state.language === "ur";
  const text = isUr
    ? "🚚 *ڈیلیوری کی قسم*\nکیا آپ ہوم ڈیلیوری چاہتے ہیں یا خود بیکری سے پیک اپ کریں گے؟\n(بہاول نگر میں ہوم ڈیلیوری چارجز: Rs. 150)"
    : "🚚 *Delivery Option*\nWould you like Home Delivery or Self Pickup from bakery?\n(Standard Delivery Fee in Bahawal Nagar: Rs. 150)";

  const buttons: ReplyButton[] = [
    { id: `${OPTION_PREFIX}delivery`, title: isUr ? "🚚 ہوم ڈیلیوری" : "🚚 Home Delivery" },
    { id: `${OPTION_PREFIX}pickup`, title: isUr ? "🏪 پِک اپ" : "🏪 Self Pickup" },
  ];

  return { handled: true, state, reply: { text, buttons } };
}

function renderCheckoutNamePrompt(state: CakestryStateData): ActionOutcome {
  const isUr = state.language === "ur";
  const text = isUr
    ? "👤 *کسٹمر نام*\nبراہِ کرم آرڈر کنفرمیشن کے لیے اپنا مکمل نام لکھیں۔"
    : "👤 *Customer Name*\nPlease reply with your Full Name for the order receipt.";

  return { handled: true, state, reply: { text } };
}

function renderCheckoutPhonePrompt(state: CakestryStateData, waPhone: string): ActionOutcome {
  const isUr = state.language === "ur";
  const text = isUr
    ? `📞 *رابطہ نمبر*\nکیا ہم اس واٹس ایپ نمبر (${waPhone}) پر رابطہ کریں، یا کوئی دوسرا نمبر درج کرنا چاہتے ہیں؟`
    : `📞 *Contact Phone*\nShould we use your WhatsApp number (${waPhone}) or a different phone number?`;

  const buttons: ReplyButton[] = [
    { id: `${OPTION_PREFIX}use_wa_phone`, title: isUr ? "✅ یہی نمبر" : "✅ Use This Number" },
  ];

  return { handled: true, state, reply: { text, buttons } };
}

function renderCheckoutAddressPrompt(state: CakestryStateData): ActionOutcome {
  const isUr = state.language === "ur";
  const text = isUr
    ? "📍 *ڈیلیوری ایڈریس*\nبراہِ کرم بہاول نگر میں اپنا مکمل ڈیلیوری ایڈریس اور قریبی نشان درج کریں۔"
    : "📍 *Delivery Address*\nPlease type your complete Delivery Address & nearby landmark in Bahawal Nagar.";

  return { handled: true, state, reply: { text } };
}

function renderCheckoutDateTimePrompt(state: CakestryStateData): ActionOutcome {
  const isUr = state.language === "ur";
  const text = isUr
    ? "🕐 *تاریخ اور وقت*\nآپ کس تاریخ اور وقت پر اپنا آرڈر وصول کرنا چاہتے ہیں؟ (مثلاً: آج شام 6 بجے)"
    : "🕐 *Preferred Date & Time*\nWhen would you like your order delivered / ready for pickup? (e.g., Today at 6:00 PM)";

  return { handled: true, state, reply: { text } };
}

function renderOrderSummaryAndPayment(state: CakestryStateData): ActionOutcome {
  const isUr = state.language === "ur";
  const totals = calculateOrderTotals(state.orderDraft.items, state.orderDraft.deliveryType);
  state.orderDraft.subtotal = totals.subtotal;
  state.orderDraft.deliveryFee = totals.deliveryFee;
  state.orderDraft.total = totals.total;

  let text = isUr
    ? `📋 *کیکسٹری بیکری — آرڈر رسیپٹ*\n\n`
    : `📋 *CAKESTRY BAKERY — ORDER SUMMARY*\n\n`;

  text += isUr ? `👤 *نام:* ${state.orderDraft.customerName}\n` : `👤 *Name:* ${state.orderDraft.customerName}\n`;
  text += isUr ? `📞 *فون:* ${state.orderDraft.phone}\n` : `📞 *Phone:* ${state.orderDraft.phone}\n`;
  text += isUr ? `🚚 *قسم:* ${state.orderDraft.deliveryType === "DELIVERY" ? "ہوم ڈیلیوری" : "پک اپ"}\n` : `🚚 *Type:* ${state.orderDraft.deliveryType}\n`;
  if (state.orderDraft.deliveryAddress) {
    text += isUr ? `📍 *پتہ:* ${state.orderDraft.deliveryAddress}\n` : `📍 *Address:* ${state.orderDraft.deliveryAddress}\n`;
  }
  text += isUr ? `🕐 *وقت:* ${state.orderDraft.dateTime}\n\n` : `🕐 *Time:* ${state.orderDraft.dateTime}\n\n`;

  text += isUr ? `*آئٹمز:* \n` : `*Items:* \n`;
  totals.itemized.forEach((i) => {
    const cheeseStr = i.cheeseAddon ? (isUr ? " (+چیز)" : " (+Extra Cheese)") : "";
    text += `- ${i.quantity}x ${isUr ? i.product.nameUr : i.product.nameEn}${cheeseStr} @ Rs. ${i.product.price} = Rs. ${i.lineTotal.toLocaleString()}\n`;
  });

  text += `--------------------------------\n`;
  text += isUr ? `سب ٹوٹل: Rs. ${totals.subtotal.toLocaleString()}\n` : `Subtotal: Rs. ${totals.subtotal.toLocaleString()}\n`;
  text += isUr ? `ڈیلیوری فیس: Rs. ${totals.deliveryFee.toLocaleString()}\n` : `Delivery Fee: Rs. ${totals.deliveryFee.toLocaleString()}\n`;
  text += isUr ? `*کل رقم: Rs. ${totals.total.toLocaleString()}*\n\n` : `*TOTAL AMOUNT: Rs. ${totals.total.toLocaleString()}*\n\n`;

  text += isUr
    ? `💳 *سادا پے (SadaPay) ادائیگی کی تفصیلات:*\n` +
      `اکاؤنٹ ٹائٹل: *${SADAPAY_DETAILS.accountTitle}*\n` +
      `اکاؤنٹ نمبر: *${SADAPAY_DETAILS.accountNumber}*\n` +
      `مالک کا نام: *${SADAPAY_DETAILS.ownerName}*\n\n` +
      `آرڈر کی تصدیق کے لیے براہِ کرم سادا پے پیمنٹ کی اسکرین شاٹ یا منتقلی آئی ڈی یہاں بھیجیں۔ 📲`
    : `💳 *SADAPAY PAYMENT DETAILS:*\n` +
      `Account Title: *${SADAPAY_DETAILS.accountTitle}*\n` +
      `Account Number: *${SADAPAY_DETAILS.accountNumber}*\n` +
      `Owner Name: *${SADAPAY_DETAILS.ownerName}*\n\n` +
      `Please send your SadaPay payment screenshot or Transaction ID here to confirm your order! 📲`;

  return {
    handled: true,
    state,
    completeOrder: true,
    reply: { text },
  };
}

function renderCustomCakeWeight(state: CakestryStateData): ActionOutcome {
  const isUr = state.language === "ur";
  const text = isUr
    ? "🎨 *کسٹم کیک آرڈر*\nآپ کتنے پاؤنڈ کا کیک بنوانا چاہتے ہیں؟ (مثلاً: 2 پاؤنڈ، 3 پاؤنڈ، 5 پاؤنڈ)"
    : "🎨 *Custom Cake Order*\nWhat weight would you like for your custom cake? (e.g., 2 Pounds, 3 Pounds, 5 Pounds)";

  const buttons: ReplyButton[] = [
    { id: `${OPTION_PREFIX}2lbs`, title: "2 Pounds" },
    { id: `${OPTION_PREFIX}3lbs`, title: "3 Pounds" },
    { id: `${OPTION_PREFIX}5lbs`, title: "5 Pounds" },
  ];

  return { handled: true, state, reply: { text, buttons } };
}

function renderCustomCakeFlavor(state: CakestryStateData): ActionOutcome {
  const isUr = state.language === "ur";
  const text = isUr
    ? "🍰 *کیک کا ذائقہ (Flavor)*\nآپ کو کون سا ذائقہ پسند ہے؟ (مثلاً: چاکلیٹ فج، ریڈ ویلوٹ، ونیلا، لوٹس، کیریمل)"
    : "🍰 *Cake Flavor*\nWhich flavor would you prefer? (e.g., Chocolate Fudge, Red Velvet, Vanilla, Lotus, Caramel)";

  return { handled: true, state, reply: { text } };
}

function renderCustomCakeDesign(state: CakestryStateData): ActionOutcome {
  const isUr = state.language === "ur";
  const text = isUr
    ? "🎨 *ڈیزائن اور تھیم*\nبراہِ کرم اپنے کیک کے ڈیزائن کی تفصیل لکھیں یا تصویر یہاں بھیجیں۔ 🖼️"
    : "🎨 *Design & Theme*\nPlease describe your desired cake theme/design or send a reference image here. 🖼️";

  return { handled: true, state, reply: { text } };
}

function renderCustomCakeDateTime(state: CakestryStateData): ActionOutcome {
  const isUr = state.language === "ur";
  const text = isUr
    ? "🕐 *ایونٹ کی تاریخ اور وقت*\nآپ کا ایونٹ کس تاریخ اور وقت پر ہے؟"
    : "🕐 *Event Date & Time*\nWhen is your event? (Date and time required)";

  return { handled: true, state, reply: { text } };
}

function renderCustomCakeComplete(state: CakestryStateData): ActionOutcome {
  const isUr = state.language === "ur";
  const draft = state.customCakeDraft || {};

  let text = isUr
    ? `✅ *کسٹم کیک انکوائری موصول ہو گئی!* 🎨\n\n` +
      `وزن: ${draft.weight}\n` +
      `ذائقہ: ${draft.flavor}\n` +
      `ایونٹ وقت: ${draft.dateTime}\n\n` +
      `ہماری بیکری ٹیم آپ کی خواہش اور ڈیزائن کے مطابق قیمت اور ڈیزائن کنفرم کرنے کے لیے فوراً رابطہ کرے گی۔ 🎂`
    : `✅ *Custom Cake Request Received!* 🎨\n\n` +
      `Weight: ${draft.weight}\n` +
      `Flavor: ${draft.flavor}\n` +
      `Event Date/Time: ${draft.dateTime}\n\n` +
      `Our master baker will review your request and contact you immediately with pricing & customization details. 🎂`;

  return {
    handled: true,
    state,
    completeCustomCake: true,
    reply: { text },
  };
}

function renderMyOrder(state: CakestryStateData, waPhone: string): ActionOutcome {
  const isUr = state.language === "ur";
  const text = isUr
    ? `📦 *آپ کا فعال آرڈر*\nرابطہ نمبر: ${waPhone}\nسٹیٹس: *پروسیسنگ (Processing)* 🎂\n\nاگر آپ آرڈر تبدیل یا منسوخ کرنا چاہتے ہیں تو نیچے بٹن دبائیں:`
    : `📦 *Your Active Order*\nContact: ${waPhone}\nStatus: *In Processing* 🎂\n\nTo modify, reschedule, or cancel your order, tap an option below:`;

  const buttons: ReplyButton[] = [
    { id: `${ACTION_BUTTON_PREFIX}human`, title: isUr ? "✏️ آرڈر تبدیل کریں" : "✏️ Modify Order" },
    { id: `${ACTION_BUTTON_PREFIX}human`, title: isUr ? "❌ منسوخ کریں" : "❌ Cancel Order" },
    { id: `${ACTION_BUTTON_PREFIX}back_categories`, title: isUr ? "⬅️ مین مینو" : "⬅️ Main Menu" },
  ];

  return { handled: true, state, reply: { text, buttons } };
}

function renderLocationInfo(state: CakestryStateData): ActionOutcome {
  const isUr = state.language === "ur";
  const text = isUr
    ? `📍 *کیکسٹری بیکری لوکیشن اور اوقات*\n\n` +
      `پتہ: جیل روڈ، بہاول نگر، پاکستان 🗺️\n` +
      `اوقاتِ کار: روزانہ 11:00 AM سے 2:00 AM 🕐\n` +
      `فون / واٹس ایپ: ${BAKERY_BUSINESS_INFO.phone}\n` +
      `ای میل: ${BAKERY_BUSINESS_INFO.email}\n\n` +
      `ہوم ڈیلیوری بہاول نگر شہر میں دستیاب ہے۔ 🚚`
    : `📍 *CAKESTRY BAKERY LOCATION & HOURS*\n\n` +
      `Address: Jail Road, Bahawal Nagar, Pakistan 🗺️\n` +
      `Opening Hours: Daily 11:00 AM to 2:00 AM 🕐\n` +
      `Phone/WhatsApp: ${BAKERY_BUSINESS_INFO.phone}\n` +
      `Email: ${BAKERY_BUSINESS_INFO.email}\n\n` +
      `Home delivery available across Bahawal Nagar. 🚚`;

  const buttons: ReplyButton[] = [
    { id: `${ACTION_BUTTON_PREFIX}back_categories`, title: isUr ? "⬅️ مین مینو" : "⬅️ Main Menu" },
  ];

  return { handled: true, state, reply: { text, buttons } };
}

function renderCatalogueOverview(state: CakestryStateData): ActionOutcome {
  const isUr = state.language === "ur";
  const text = isUr
    ? `🎂 *کیکسٹری بیکری مینو اور ورائٹی* 🍰\n\n` +
      `ہمارے پاس تمام تازگی سے تیار کردہ بیکری آئٹمز دستیاب ہیں:\n` +
      `1. 🎂 سیگنیچر کیکس (چاکلیٹ فج، ریڈ ویلوٹ، پائن ایپل، لوٹس، تھری ملکی...)\n` +
      `2. 🧁 کپ کیکس (نوٹیلا، لوٹس، ریڈ ویلوٹ...)\n` +
      `3. 🍫 پریمیئم براؤنیز (نوٹیلا، والنٹ...)\n` +
      `4. 🍩 ڈونٹس اور سلائس (چاکلیٹ ڈونٹس، چیز کیک سلائس...)\n` +
      `5. 🥐 پیسٹریز (مولٹن لاوا، بلیک فارسٹ، تھری ملکی...)\n` +
      `6. 🌯 ریپس اور سینڈوچ (کلب سینڈوچ، بی بی کیو ریپ، زنگر رول...)\n` +
      `7. 🍰 ڈیزرٹس اور سنیکس (کریم پفس، چیز بالز...)\n` +
      `8. 🎨 کسٹم کیکس (اپنی مرضی کا ڈیزائن اور وزن)\n\n` +
      `نیچے زمرہ منتخب کر کے تمام پروڈکٹس اور قیمتیں دیکھیں۔ 👇`
    : `🎂 *Cakestry Bakery Menu & Varieties* 🍰\n\n` +
      `We offer a rich variety of freshly baked goods:\n` +
      `1. 🎂 Signature Cakes (Chocolate Fudge, Red Velvet, Pineapple, Lotus, Three Milk...)\n` +
      `2. 🧁 Cupcakes (Nutella, Lotus, Red Velvet...)\n` +
      `3. 🍫 Premium Brownies (Nutella, Walnut...)\n` +
      `4. 🍩 Donuts & Slices (Glazed Donuts, Cheesecake Slices...)\n` +
      `5. 🥐 Pastries (Molten Lava, Black Forest, Three Milk...)\n` +
      `6. 🌯 Wraps & Sandwiches (Club Sandwich, BBQ Wrap, Zinger Roll...)\n` +
      `7. 🍰 Desserts & Savories (Cream Puffs, Cheese Balls...)\n` +
      `8. 🎨 Custom Cakes (Custom Theme & Servings)\n\n` +
      `Select a category below to explore products & prices! 👇`;

  const rows: ListRow[] = CATEGORIES.map((cat) => ({
    id: `${CATEGORY_BUTTON_PREFIX}${cat.id}`,
    title: (isUr ? `${cat.icon} ${cat.nameUr}` : `${cat.icon} ${cat.nameEn}`).slice(0, 24),
    description: (isUr ? cat.descriptionUr : cat.descriptionEn).slice(0, 72),
  }));

  return {
    handled: true,
    state,
    reply: {
      text,
      list: {
        label: isUr ? "مینو کے زمرے" : "Categories",
        rows,
      },
    },
  };
}
