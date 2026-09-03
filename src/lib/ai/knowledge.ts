import type { Department } from "@/lib/brands";
import type { KnowledgeEntry } from "@/types";
import { departmentContent } from "@/data";

/**
 * Department-scoped knowledge retrieval.
 *
 * Light keyword-overlap search — intentionally dependency-free (no embeddings)
 * so the system runs anywhere, including offline demos. It scores entries by
 * keyword hits, question-word overlap and category match, then returns the top
 * results, which are injected into the system prompt so the assistant answers
 * from Cakestry Bakery's own content before reaching for general model knowledge.
 *
 * The `department` argument is required and non-nullable by design: there is no
 * way to run an unscoped search, so a Marketing conversation can never surface
 * an Institute answer. Swapping this for a vector search later means changing
 * only this file — every call site already passes a department.
 */
export function retrieveKnowledge(
  department: Department,
  query: string,
  limit = 6
): KnowledgeEntry[] {
  const q = normalize(query);
  if (!q) return [];

  const terms = new Set(q.split(" ").filter((t) => t.length > 2));
  const { knowledgeBase } = departmentContent(department);

  return knowledgeBase
    .map((entry) => {
      let score = 0;

      for (const keyword of entry.keywords) {
        const kw = normalize(keyword);
        if (!kw) continue;
        if (q.includes(kw)) score += kw.includes(" ") ? 5 : 3;
      }

      for (const word of normalize(entry.question).split(" ")) {
        if (word.length > 2 && terms.has(word)) score += 1;
      }

      if (q.includes(normalize(entry.category))) score += 2;

      // Service/course entries are the most common intent — nudge them up when
      // the query already looks like a catalogue lookup.
      if ((entry.kind === "SERVICE" || entry.kind === "COURSE") && score > 0) {
        score += 1;
      }

      return { entry, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
}

/**
 * Natural-language search across one department's knowledge base, used by the
 * public search endpoint and the admin console. Returns entries plus their
 * score so the UI can show relevance.
 */
export function searchKnowledge(
  department: Department,
  query: string,
  limit = 10
): KnowledgeEntry[] {
  return retrieveKnowledge(department, query, limit);
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
