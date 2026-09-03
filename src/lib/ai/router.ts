/**
 * =============================================================================
 *  Department router for Cakestry Bakery
 * =============================================================================
 */
import type { Department } from "@/lib/brands";
import type { ChatTurn } from "./types";

export interface RoutingDecision {
  department: Department | null;
  /** 0–1. Below `CONFIDENCE_FLOOR` we treat the result as undetermined. */
  confidence: number;
  /** True when the newest message moved the conversation to a new division. */
  switched: boolean;
  reason: string;
}

const CONFIDENCE_FLOOR = 0.55;

/** Phrases that unambiguously name one division — treated as an explicit pick. */
const EXPLICIT_MARKETING = [
  "cakestry bakery",
  "bakery cakes",
  "custom cakes",
  "🎂",
];

const EXPLICIT_INSTITUTE = [
  "cakestry events",
  "special events",
  "gift boxes",
  "event catering",
  "🧁",
];

const MARKETING_SIGNALS: Array<[string, number]> = [
  ["cake", 3], ["birthday cake", 3], ["wedding cake", 3], ["fondant", 3],
  ["pastry", 3], ["eclair", 3], ["brownie", 2], ["slice", 2],
  ["flavor", 2], ["pound", 3], ["weight", 2], ["delivery", 2],
  ["order cake", 3], ["cake price", 3], ["bahawal nagar", 2],
];

const INSTITUTE_SIGNALS: Array<[string, number]> = [
  ["event", 3], ["party catering", 3], ["dessert table", 3],
  ["gift box", 3], ["corporate gifts", 3], ["package", 2],
  ["guest count", 3], ["anniversary package", 3],
];

export function routeDepartment(
  message: string,
  current: Department | null = null,
  history: ChatTurn[] = []
): RoutingDecision {
  const text = normalise(message);

  const explicit = detectExplicit(text);
  if (explicit) {
    return {
      department: explicit,
      confidence: 1,
      switched: current != null && current !== explicit,
      reason: "User named the division explicitly.",
    };
  }

  const fresh = score(text);
  const freshWinner = pick(fresh);

  if (freshWinner) {
    if (current && freshWinner.department !== current && fresh.margin >= 4) {
      return {
        department: freshWinner.department,
        confidence: freshWinner.confidence,
        switched: true,
        reason: "Newest message clearly concerns the other division.",
      };
    }
    if (!current) {
      return {
        department: freshWinner.department,
        confidence: freshWinner.confidence,
        switched: false,
        reason: "Newest message matched division vocabulary.",
      };
    }
  }

  if (current) {
    return {
      department: current,
      confidence: 0.9,
      switched: false,
      reason: "Continuing the division already chosen in this conversation.",
    };
  }

  const historyText = history
    .slice(-6)
    .filter((t) => t.role === "user")
    .map((t) => normalise(t.content))
    .join(" ");
  const historic = score(historyText);
  const historicWinner = pick(historic);
  if (historicWinner) {
    return {
      department: historicWinner.department,
      confidence: historicWinner.confidence * 0.9,
      switched: false,
      reason: "Inferred from earlier messages in this conversation.",
    };
  }

  return {
    department: null,
    confidence: 0,
    switched: false,
    reason: "Not enough signal — ask user to choose division.",
  };
}

function normalise(text: string): string {
  return ` ${(text ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}🎂🧁\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

function detectExplicit(text: string): Department | null {
  const marketing = EXPLICIT_MARKETING.some((p) => text.includes(p));
  const institute = EXPLICIT_INSTITUTE.some((p) => text.includes(p));
  if (marketing && !institute) return "MARKETING";
  if (institute && !marketing) return "INSTITUTE";
  return null;
}

interface Scores {
  marketing: number;
  institute: number;
  margin: number;
}

function score(text: string): Scores {
  let marketing = 0;
  let institute = 0;
  for (const [term, weight] of MARKETING_SIGNALS) {
    if (text.includes(` ${term} `) || text.includes(`${term} `)) marketing += weight;
  }
  for (const [term, weight] of INSTITUTE_SIGNALS) {
    if (text.includes(` ${term} `) || text.includes(`${term} `)) institute += weight;
  }
  return { marketing, institute, margin: Math.abs(marketing - institute) };
}

function pick(
  scores: Scores
): { department: Department; confidence: number } | null {
  const total = scores.marketing + scores.institute;
  if (total === 0) return null;

  const department: Department =
    scores.marketing > scores.institute ? "MARKETING" : "INSTITUTE";
  const winner = Math.max(scores.marketing, scores.institute);
  const confidence = winner / total;

  if (confidence < CONFIDENCE_FLOOR || scores.margin < 2) return null;
  return { department, confidence };
}
