import type { Language } from "@/lib/i18n";
import { BRANDS, type Department } from "@/lib/brands";
import type { ReplyButton } from "./types";

/**
 * =============================================================================
 *  WhatsApp channel copy for Cakestry Bakery
 * =============================================================================
 */

type Localised = Record<Language, string>;

export const DEPARTMENT_BUTTON_PREFIX = "dept:";
export const LANGUAGE_BUTTON_PREFIX = "lang:";
export const ACTION_BUTTON_PREFIX = "act:";

function pick(copy: Localised, language: Language): string {
  return copy[language] ?? copy.en;
}

// ---------------------------------------------------------------- Welcome ---

const WELCOME: Localised = {
  en: "Assalam-o-Alaikum! 👋\nWelcome to Cakestry Bakery 🎂\nWhere every bite creates a sweet memory ✨\nFreshly baked with love, just for you! ❤️\n\nHow would you like to chat?",
  ur: "السلام علیکم! 👋\nکیکسٹری بیکری میں خوش آمدید 🎂\nجہاں ہر نوالہ ایک میٹھی یاد بناتا ہے ✨\nتازہ بیک شدہ، صرف آپ کے لیے! ❤️\n\nآپ کس زبان میں بات کرنا چاہیں گے؟",
  ur_roman:
    "Assalam-o-Alaikum! 👋\nWelcome to Cakestry Bakery 🎂\nWhere every bite creates a sweet memory ✨\nFreshly baked with love, just for you! ❤️\n\nAap kis zabaan mein baat karna chahenge?",
  pa: "السلام علیکم! 👋\nکیکسٹری بیکری وچ جی آیاں نوں 🎂\nتازہ بیک کیتا، صرف تہاڈے لئی! ❤️",
};

const WELCOME_FOOTER: Localised = {
  en: "Reply *menu* any time to switch",
  ur: "تبدیلی کے لیے *menu* لکھیں",
  ur_roman: "Switch karne ke liye *menu* likhein",
  pa: "بدلݨ لئی *menu* لکھو",
};

export function welcomeMessage(language: Language): {
  text: string;
  buttons: ReplyButton[];
  footer: string;
} {
  return {
    text: pick(WELCOME, language),
    footer: pick(WELCOME_FOOTER, language),
    buttons: [
      {
        id: `${LANGUAGE_BUTTON_PREFIX}en`,
        title: `🇬🇧 English`,
      },
      {
        id: `${LANGUAGE_BUTTON_PREFIX}ur`,
        title: `🇵🇰 Urdu`,
      },
    ],
  };
}

// --------------------------------------------------- Department greetings ---

const MARKETING_GREETING: Localised = {
  en: "🎂 *Cakestry Bakery & Custom Cakes*\n\nWe craft custom birthday cakes, wedding cakes, fondant designs, fresh pastries and bakery delights in Bahawal Nagar.\n\nAsk me about prices, flavors, delivery or tap below to order.",
  ur: "🎂 *کیکسٹری بیکری اینڈ کسٹم کیکس*\n\nہم کسٹم برتھ ڈے کیکس، ویڈنگ کیکس، فاؤنڈنٹ ڈیزائنز اور تازہ پیسٹریز بناتے ہیں۔\n\nقیمت یا کیک کا آرڈر دینے کے لیے نیچے کلک کریں۔",
  ur_roman:
    "🎂 *Cakestry Bakery & Custom Cakes*\n\nHum custom birthday cakes, wedding cakes, fondant designs aur fresh pastries banate hain.\n\nPricing ya order ke liye neeche click karein.",
  pa: "🎂 *کیکسٹری بیکری تے کسٹم کیکس*\n\nاسی کسٹم کیک، پیسٹریز تے سالگرہ دے کیک بݨاندے آں۔\n\nریٹ یا آرڈر لئی تھلے کلک کرو۔",
};

const INSTITUTE_GREETING: Localised = {
  en: "🧁 *Cakestry Special Events & Gift Boxes*\n\nSpecial event catering, dessert tables, corporate gift boxes, and anniversary packages with home delivery across Bahawal Nagar.\n\nAsk about packages or tap below to book.",
  ur: "🧁 *کیکسٹری اسپیشل ایونٹس اینڈ گفٹ باکسز*\n\nپارٹی کیٹرنگ، ڈیزرٹ ٹیبلز اور گفٹ باکسز بہاول نگر میں ہوم ڈیلیوری کے ساتھ۔\n\nبکنگ کے لیے نیچے کلک کریں۔",
  ur_roman:
    "🧁 *Cakestry Special Events & Gift Boxes*\n\nParty catering, dessert tables aur gift boxes Bahawal Nagar mein home delivery ke saath.\n\nBooking ke liye neeche click karein.",
  pa: "🧁 *کیکسٹری اسپیشل ایونٹس*\n\nپارٹی کیٹرنگ تے گفٹ باکسز بہاول نگر وچ ہوم ڈیلیوری نال۔\n\nبکنگ لئی تھلے کلک کرو۔",
};

export function departmentGreeting(
  department: Department,
  language: Language
): { text: string; buttons: ReplyButton[] } {
  return {
    text: pick(department === "MARKETING" ? MARKETING_GREETING : INSTITUTE_GREETING, language),
    buttons: quickActions(department, language),
  };
}

// ----------------------------------------------------------- Quick actions --

const GET_QUOTE: Localised = {
  en: "🎂 Order Cake",
  ur: "🎂 کیک آرڈر کریں",
  ur_roman: "🎂 Cake Order karein",
  pa: "🎂 کیک آرڈر کرو",
};

const APPLY: Localised = {
  en: "🧁 Event Booking",
  ur: "🧁 ایونٹ بک کریں",
  ur_roman: "🧁 Event Book karein",
  pa: "🧁 ایونٹ بک کرو",
};

const TALK_TO_TEAM: Localised = {
  en: "🙋 Bakery Support",
  ur: "🙋 بیکری ٹیم سے بات",
  ur_roman: "🙋 Bakery Team se baat",
  pa: "🙋 ٹیم نال گل",
};

const SWITCH: Localised = {
  en: "🔄 Switch Menu",
  ur: "🔄 مینو تبدیل کریں",
  ur_roman: "🔄 Switch Menu",
  pa: "🔄 مینو بدلݨا",
};

export function quickActions(department: Department, language: Language): ReplyButton[] {
  return [
    department === "MARKETING"
      ? { id: `${ACTION_BUTTON_PREFIX}capture`, title: pick(GET_QUOTE, language) }
      : { id: `${ACTION_BUTTON_PREFIX}capture`, title: pick(APPLY, language) },
    { id: `${ACTION_BUTTON_PREFIX}human`, title: pick(TALK_TO_TEAM, language) },
    { id: `${ACTION_BUTTON_PREFIX}menu`, title: pick(SWITCH, language) },
  ];
}

// ------------------------------------------------------------ Transactional --

const LEAD_CONFIRMED: Localised = {
  en: "✅ *Order Received, {name}!*\n\nYour cake order request is logged as *{reference}*.\n\nOur Cakestry Bakery team will contact you on {phone} to confirm design details and delivery slot.\n\nAnything else I can help with?",
  ur: "✅ *آرڈر موصول ہو گیا، {name}!*\n\nآپ کا کیک آرڈر *{reference}* نمبر پر درج ہو گیا ہے۔\n\nکیکسٹری بیکری کی ٹیم {phone} پر آپ سے رابطہ کرے گی۔",
  ur_roman:
    "✅ *Order Received, {name}!*\n\nAap ka cake order *{reference}* number par register ho gaya hai.\n\nCakestry Bakery team {phone} par call karke details confirm karegi.",
  pa: "✅ *آرڈر مل گیا، {name}!*\n\nتہاڈا کیک آرڈر *{reference}* نمبر تے درج ہو گیا اے۔\n\nکیکسٹری بیکری دی ٹیم {phone} تے رابطہ کرے گی۔",
};

const ADMISSION_CONFIRMED: Localised = {
  en: "✅ *Booking Registered, {name}!*\n\nYour event booking inquiry is *{reference}*.\n\nA event manager from Cakestry Bakery will call you on {phone} to finalize dessert packages.\n\nAnything else you'd like to know?",
  ur: "✅ *بکنگ درج ہو گئی، {name}!*\n\nآپ کی بکنگ انکوائری *{reference}* پر درج ہو گئی ہے۔\n\nکیکسٹری ایونٹ مینیجر {phone} پر آپ سے رابطہ کرے گا۔",
  ur_roman:
    "✅ *Booking Registered, {name}!*\n\nAap ki booking inquiry *{reference}* par register ho gayi hai.\n\nCakestry Event manager {phone} par call karke confirm karega.",
  pa: "✅ *بکنگ درج ہو گئی، {name}!*\n\nتہاڈی بکنگ انکوائری *{reference}* اے۔\n\nکیکسٹری ایونٹ مینیجر {phone} تے کال کرے گا۔",
};

export function captureConfirmation(
  department: Department,
  language: Language,
  values: { name: string; reference: string; phone: string }
): string {
  const template = pick(
    department === "MARKETING" ? LEAD_CONFIRMED : ADMISSION_CONFIRMED,
    language
  );
  return template
    .replace("{name}", values.name.split(" ")[0])
    .replace("{reference}", values.reference)
    .replace("{phone}", values.phone);
}

const CAPTURE_CANCELLED: Localised = {
  en: "No problem — I've cancelled that. Ask me anything, or reply *menu* to start over.",
  ur: "کوئی بات نہیں — منسوخ کر دیا گیا۔ دوبارہ شروع کرنے کے لیے *menu* لکھیں۔",
  ur_roman:
    "Koi baat nahi — cancel kar diya. Dobara shuru karne ke liye *menu* likhein.",
  pa: "کوئی گل نئیں — منسوخ کر دِتا۔ *menu* لکھو۔",
};

export const captureCancelled = (language: Language) => pick(CAPTURE_CANCELLED, language);

const ESCALATED: Localised = {
  en: "🎫 Passed to bakery team — ticket reference: *{reference}*.\n\nSomeone will reply here shortly. You can also call {phone} during {hours}.",
  ur: "🎫 ہماری ٹیم کو بھیج دیا گیا ہے — آپ کا ٹکٹ: *{reference}*۔\n\nآپ {hours} کے دوران {phone} پر رابطہ کر سکتے ہیں۔",
  ur_roman:
    "🎫 Bakery team ko bhej diya gaya hai — ticket: *{reference}*.\n\nAap {hours} mein {phone} par call bhi kar sakte hain.",
  pa: "🎫 ٹیم نوں بھیج دِتا اے — ٹکٹ *{reference}* اے۔\n\n{phone} تے کال کر سکدے او۔",
};

export function escalationNotice(
  department: Department,
  language: Language,
  reference: string
): string {
  const brand = BRANDS[department];
  return pick(ESCALATED, language)
    .replace("{reference}", reference)
    .replace("{phone}", brand.contact.phone)
    .replace("{hours}", brand.contact.hours);
}

const MEDIA_ACK: Localised = {
  en: "📎 Received and attached to your order note.",
  ur: "📎 موصول ہو گیا اور آپ کی گفتگو سے منسلک کر دیا ہے۔",
  ur_roman: "📎 Received aur order note se attach kar diya.",
  pa: "📎 مل گیا اے۔",
};

export const mediaAcknowledgement = (language: Language) => pick(MEDIA_ACK, language);

const OPTED_OUT: Localised = {
  en: "You're unsubscribed from Cakestry broadcasts. 👍",
  ur: "آپ کیکسٹری کے پیغامات سے ان سبسکرائب ہو گئے ہیں۔ 👍",
  ur_roman: "Aap Cakestry broadcasts se unsubscribe ho gaye hain. 👍",
  pa: "تسی ان سبسکرائب ہو گئے او۔ 👍",
};

export const optOutConfirmation = (language: Language) => pick(OPTED_OUT, language);

const BUSY: Localised = {
  en: "Sorry, I'm having trouble replying right now. Please try again or call us on {phone}.",
  ur: "معذرت، ابھی دشواری ہو رہی ہے۔ {phone} پر کال کریں۔",
  ur_roman: "Maazrat, abhi reply karne mein dikkat ho rahi hai. {phone} par call karein.",
  pa: "معافی، {phone} تے کال کرو۔",
};

export function busyNotice(department: Department | null, language: Language): string {
  const phone = (department ? BRANDS[department] : BRANDS.MARKETING).contact.phone;
  return pick(BUSY, language).replace("{phone}", phone);
}
