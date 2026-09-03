/**
 * Server-side runtime configuration for Cakestry Bakery.
 * Reads and validates environment variables once, and exposes a typed `config` object.
 */
import { z } from "zod";

const bool = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v == null ? def : /^(1|true|yes|on)$/i.test(v)));

const optional = z.string().optional();

const nodeEnv = z.preprocess((value) => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "development";
  if (raw === "development" || raw === "dev") return "development";
  if (raw === "test") return "test";
  return "production";
}, z.enum(["development", "test", "production"]));

const schema = z.object({
  NODE_ENV: nodeEnv.default("development"),
  APP_NAME: z.string().default("Cakestry AI Assistant"),
  APP_URL: z.string().default("http://localhost:3000"),

  DATABASE_URL: optional,
  REDIS_URL: optional,

  JWT_SECRET: z.string().default("super-secret-jwt-key-for-bakery-saas-platform-2026"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),

  AI_PROVIDER: z.enum(["claude", "openai", "ollama", "gemini"]).default("openai"),
  AI_MODEL: z.string().default("gpt-3.5-turbo"),
  AI_MAX_TOKENS: z.coerce.number().int().positive().default(1400),
  AI_THINKING: bool(false),

  ANTHROPIC_API_KEY: optional,
  OPENAI_API_KEY: optional,
  OPENAI_BASE_URL: z.string().default("https://api.openai.com/v1"),
  GEMINI_API_KEY: optional,

  // --- Notification & integration channels ---------------------------------
  SMTP_HOST: optional,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: optional,
  SMTP_PASSWORD: optional,
  SMTP_FROM: z.string().default("Cakestry Bakery <order@cakestry.com>"),

  SMS_API_KEY: optional,
  SMS_SENDER_ID: z.string().default("CAKESTRY"),

  // --- WhatsApp Business Cloud API (Meta) ----------------------------------
  WHATSAPP_PHONE_ID: optional,
  WHATSAPP_TOKEN: optional,
  WHATSAPP_VERIFY_TOKEN: optional,
  WHATSAPP_APP_SECRET: optional,
  WHATSAPP_API_VERSION: z.string().default("v21.0"),
  WHATSAPP_AUTO_REPLY: bool(true),

  GOOGLE_MAPS_API_KEY: optional,

  // --- Team routing --------------------------------------------------------
  SALES_NOTIFY_EMAIL: optional,
  ADMISSIONS_NOTIFY_EMAIL: optional,
});

const parsed = schema.safeParse(process.env);

const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-development-server";

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  console.error("Invalid environment configuration:", issues);

  if (!isBuildPhase) {
    throw new Error("Invalid environment configuration. See logs above.");
  }
  console.warn(
    "[config] Continuing the build with default values. Fix these variables " +
      "before the app is started, or it will refuse to boot."
  );
}

const env = parsed.success ? parsed.data : schema.parse({ NODE_ENV: "production" });

export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === "production",
  appName: env.APP_NAME,
  appUrl: env.APP_URL,

  databaseUrl: env.DATABASE_URL,
  redisUrl: env.REDIS_URL,

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  bcryptRounds: env.BCRYPT_ROUNDS,

  ai: {
    provider: env.AI_PROVIDER,
    model: env.AI_MODEL,
    maxTokens: env.AI_MAX_TOKENS,
    thinking: env.AI_THINKING,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    openaiApiKey: env.OPENAI_API_KEY,
    openaiBaseUrl: env.OPENAI_BASE_URL,
    geminiApiKey: env.GEMINI_API_KEY,
  },

  mail: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.SMTP_FROM,
    enabled: Boolean(env.SMTP_HOST && env.SMTP_USER),
  },

  sms: {
    apiKey: env.SMS_API_KEY,
    senderId: env.SMS_SENDER_ID,
    enabled: Boolean(env.SMS_API_KEY),
  },

  whatsapp: {
    phoneId: env.WHATSAPP_PHONE_ID,
    token: env.WHATSAPP_TOKEN,
    verifyToken: env.WHATSAPP_VERIFY_TOKEN,
    appSecret: env.WHATSAPP_APP_SECRET,
    apiVersion: env.WHATSAPP_API_VERSION,
    autoReply: env.WHATSAPP_AUTO_REPLY,
    enabled: Boolean(env.WHATSAPP_PHONE_ID && env.WHATSAPP_TOKEN),
    webhookReady: Boolean(env.WHATSAPP_VERIFY_TOKEN && env.WHATSAPP_APP_SECRET),
    webhookUrl: `${env.APP_URL.replace(/\/$/, "")}/webhook`,
  },

  maps: {
    apiKey: env.GOOGLE_MAPS_API_KEY,
  },

  routing: {
    salesEmail: env.SALES_NOTIFY_EMAIL,
    admissionsEmail: env.ADMISSIONS_NOTIFY_EMAIL,
  },
} as const;

export type AppConfig = typeof config;
