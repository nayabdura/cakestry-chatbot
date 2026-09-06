/**
 * Multilingual support for Cakestry Bakery — English · Urdu · Roman Urdu · Punjabi
 */

export type Language = "en" | "ur" | "ur_roman" | "pa";

export const LANGUAGES: readonly Language[] = ["en", "ur", "ur_roman", "pa"] as const;

export interface LanguageProfile {
  id: Language;
  label: string;
  nativeLabel: string;
  speechTag: string;
  rtl: boolean;
  promptDirective: string;
}

export const LANGUAGE_PROFILES: Record<Language, LanguageProfile> = {
  en: {
    id: "en",
    label: "English",
    nativeLabel: "English",
    speechTag: "en-US",
    rtl: false,
    promptDirective: "Reply in clear, warm English.",
  },
  ur: {
    id: "ur",
    label: "Urdu",
    nativeLabel: "اردو",
    speechTag: "ur-PK",
    rtl: true,
    promptDirective:
      "Reply in simple, natural Urdu using Urdu script.",
  },
  ur_roman: {
    id: "ur_roman",
    label: "Roman Urdu",
    nativeLabel: "Roman Urdu",
    speechTag: "ur-PK",
    rtl: false,
    promptDirective:
      "Reply ONLY in authentic Pakistani Roman Urdu (Latin script). Use natural conversational words like 'Ji bilkul', 'Aap ko kya chahiye', 'Meherbani', 'Humare paas'. NEVER use Indian Hindi words like 'Kripya', 'jaankari', 'dhanyawad', 'aavashyakta', 'namaste'.",
  },
  pa: {
    id: "pa",
    label: "Punjabi",
    nativeLabel: "پنجابی",
    speechTag: "pa-IN",
    rtl: true,
    promptDirective:
      "Reply in warm, conversational Punjabi (Shahmukhi script).",
  },
};

const ARABIC_SCRIPT = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

const PUNJABI_SCRIPT_MARKERS = [
  "تُسی", "تسی", "اسی", "کِنج", "کیویں", "ہَیگا", "ہَے نا",
  "میں تینوں", "تینوں", "سانوں", "ودھیا", "چنگا", "گل", "نال", "لئی", "دسو", "کر دیو",
];

const ROMAN_URDU_MARKERS = [
  "aap", "ap ", "kya", "kia", "kaise", "kese", "kesay", "kaisay", "hai", "hain",
  "nahi", "nahin", "mujhe", "mujhy", "mera", "meri", "hum", "tum", "kitna",
  "kitni", "kitne", "chahiye", "chahye", "batao", "bataen", "bta", "krna",
  "karna", "kar", "acha", "theek", "thik", "shukriya", "salam", "assalam",
  "janab", "bhai", "sir ji", "ji han", "jee", "please batao", "cake", "order",
];

const ROMAN_PUNJABI_MARKERS = [
  "tusi", "tussi", "tuhada", "tuhadi", "tuhanu", "asi", "assi", "sanu",
  "menu ", "mainu", "ohna", "ohde", "kiddan", "kidan", "kihda", "kehda",
  "changa", "wadhiya", "vadhiya", "sohna", "sohni", "gall", "naal",
];

export function detectLanguage(text: string): Language {
  const raw = (text ?? "").trim();
  if (!raw) return "en";

  if (ARABIC_SCRIPT.test(raw)) {
    const punjabiHits = PUNJABI_SCRIPT_MARKERS.filter((m) => raw.includes(m)).length;
    return punjabiHits >= 2 ? "pa" : "ur";
  }

  const lower = ` ${raw.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ")} `;
  const words = lower.trim().split(" ").filter(Boolean);

  const punjabiHits = countMarkers(lower, ROMAN_PUNJABI_MARKERS);
  const urduHits = countMarkers(lower, ROMAN_URDU_MARKERS);

  if (punjabiHits >= 2 || (punjabiHits >= 1 && words.length <= 4)) return "pa";
  if (urduHits >= 2 || (urduHits >= 1 && words.length <= 4)) return "ur_roman";

  return "en";
}

function countMarkers(haystack: string, markers: readonly string[]): number {
  let hits = 0;
  for (const marker of markers) {
    if (haystack.includes(marker.includes(" ") ? marker : ` ${marker} `)) hits += 1;
  }
  return hits;
}

export function isRtl(language: Language): boolean {
  return LANGUAGE_PROFILES[language].rtl;
}

export function speechTagFor(text: string): string {
  return LANGUAGE_PROFILES[detectLanguage(text)].speechTag;
}

export function asLanguage(value: unknown): Language | null {
  return LANGUAGES.includes(value as Language) ? (value as Language) : null;
}

type UiKey =
  | "welcome.title"
  | "welcome.subtitle"
  | "welcome.marketing"
  | "welcome.institute"
  | "welcome.marketingHint"
  | "welcome.instituteHint"
  | "chat.placeholder"
  | "chat.online"
  | "chat.newChat"
  | "chat.menu"
  | "chat.switch"
  | "chat.voice"
  | "chat.emptyTitle"
  | "chat.disclaimer"
  | "chat.tryAsking"
  | "form.submit"
  | "form.cancel"
  | "form.required";

const DICTIONARY: Record<UiKey, Record<Language, string>> = {
  "welcome.title": {
    en: "Welcome to Cakestry Bakery",
    ur: "کیکسٹری بیکری میں خوش آمدید",
    ur_roman: "Cakestry Bakery mein khush aamdeed",
    pa: "کیکسٹری بیکری وچ جی آیاں نوں",
  },
  "welcome.subtitle": {
    en: "Please select how I can assist your order today.",
    ur: "براہِ کرم منتخب کریں کہ میں آپ کی کیا مدد کر سکتا ہوں۔",
    ur_roman: "Select karein main aap ki kya madad kar sakta hoon.",
    pa: "دسو، میں تہاڈی کیہڑی مدد کر سکنا واں۔",
  },
  "welcome.marketing": {
    en: "Cakestry Bakery & Custom Cakes",
    ur: "کیکسٹری بیکری اینڈ کسٹم کیکس",
    ur_roman: "Cakestry Bakery & Custom Cakes",
    pa: "کیکسٹری بیکری تے کیکس",
  },
  "welcome.institute": {
    en: "Cakestry Special Events & Gifts",
    ur: "کیکسٹری اسپیشل ایونٹس",
    ur_roman: "Cakestry Special Events & Gifts",
    pa: "کیکسٹری اسپیشل ایونٹس",
  },
  "welcome.marketingHint": {
    en: "Custom birthday cakes, wedding cakes, fresh pastries & delivery",
    ur: "برتھ ڈے کیکس، ویڈنگ کیکس، پیسٹریز اور ہوم ڈیلیوری",
    ur_roman: "Birthday cakes, wedding cakes, pastries aur home delivery",
    pa: "سالگرہ کیک، ویڈنگ کیکس، پیسٹریز تے ڈیلیوری",
  },
  "welcome.instituteHint": {
    en: "Party catering, dessert tables & corporate gift boxes",
    ur: "پارٹی کیٹرنگ، ڈیزرٹ ٹیبلز اور گفٹ باکسز",
    ur_roman: "Party catering, dessert tables aur gift boxes",
    pa: "پارٹی کیٹرنگ تے گفٹ باکسز",
  },
  "chat.placeholder": {
    en: "Ask anything… (English, اردو, Roman Urdu or پنجابی)",
    ur: "کچھ بھی پوچھیں… (اردو یا انگریزی)",
    ur_roman: "Kuch bhi poochein… (Roman Urdu ya English)",
    pa: "کجھ وی پُچھو… (پنجابی یا انگریزی)",
  },
  "chat.online": {
    en: "Assistant online",
    ur: "اسسٹنٹ آن لائن",
    ur_roman: "Assistant online",
    pa: "اسسٹنٹ آن لائن",
  },
  "chat.newChat": {
    en: "New chat",
    ur: "نئی گفتگو",
    ur_roman: "Nayi chat",
    pa: "نویں گل بات",
  },
  "chat.menu": {
    en: "Menu",
    ur: "مینو",
    ur_roman: "Menu",
    pa: "مینو",
  },
  "chat.switch": {
    en: "Switch",
    ur: "تبدیل کریں",
    ur_roman: "Switch karein",
    pa: "بدلو",
  },
  "chat.voice": {
    en: "Voice",
    ur: "آواز",
    ur_roman: "Voice",
    pa: "آواز",
  },
  "chat.emptyTitle": {
    en: "How can I help you today?",
    ur: "میں آج آپ کی کیا مدد کر سکتا ہوں؟",
    ur_roman: "Main aaj aap ki kya madad kar sakta hoon?",
    pa: "میں اج تہاڈی کیہ مدد کر سکنا واں؟",
  },
  "chat.disclaimer": {
    en: "The assistant can make mistakes. Please confirm prices and delivery times with our bakery team.",
    ur: "قیمت اور ڈیلیوری کا وقت ہماری ٹیم سے تصدیق کر لیں۔",
    ur_roman: "Price aur delivery time team se confirm kar lein.",
    pa: "ریٹ تے ڈیلیوری ٹائم ٹیم کولوں پکا کر لوو۔",
  },
  "chat.tryAsking": {
    en: "Try asking about…",
    ur: "ان کے بارے میں پوچھیں…",
    ur_roman: "In ke baare mein poochein…",
    pa: "ایہناں بارے پُچھو…",
  },
  "form.submit": {
    en: "Submit",
    ur: "جمع کروائیں",
    ur_roman: "Submit karein",
    pa: "بھیجو",
  },
  "form.cancel": {
    en: "Cancel",
    ur: "منسوخ",
    ur_roman: "Cancel",
    pa: "رد کرو",
  },
  "form.required": {
    en: "This field is required.",
    ur: "یہ خانہ ضروری ہے۔",
    ur_roman: "Ye field zaroori hai.",
    pa: "ایہہ خانہ ضروری اے۔",
  },
};

export function t(key: UiKey, language: Language = "en"): string {
  return DICTIONARY[key]?.[language] ?? DICTIONARY[key]?.en ?? key;
}
