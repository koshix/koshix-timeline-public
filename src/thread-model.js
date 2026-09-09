import { eventYear } from "./event-schema.js";
import {
  matchesSearchExpression,
  normalizeSearchText,
  parseSearchExpression,
  tokenizeSearchQuery,
} from "./search-query.js";

const SEARCH_FIELDS = [
  ["title", 8],
  ["search", 5],
  ["summary", 3],
  ["note", 2],
  ["region", 1],
  ["date", 1],
  ["end_date", 1],
];

const searchableTextOf = (event) =>
  normalizeSearchText(
    SEARCH_FIELDS.map(([field]) => event[field])
      .filter(Boolean)
      .join(" ")
  );

const searchTermsOf = (query) =>
  [...new Set(
    tokenizeSearchQuery(query).filter(
      (token) =>
        token !== "&&" &&
        token !== "||" &&
        token !== "(" &&
        token !== ")"
    )
  )];

const relevanceScore = (event, terms) => {
  let score = 0;

  for (const [field, weight] of SEARCH_FIELDS) {
    const value = normalizeSearchText(event[field]);
    if (!value) continue;

    for (const term of terms) {
      if (value.includes(term)) {
        score += weight;
      }
    }
  }

  return score;
};

export function buildConfiguredThreads(threads, events) {
  const byId = new Map(events.map((event) => [event.id, event]));

  return threads
    .map((thread) => ({
      ...thread,
      events: thread.items
        .map(({ id }) => byId.get(id))
        .filter(Boolean),
    }))
    .filter((thread) => thread.events.length > 1);
}

export function findThreadByKey(threads, key) {
  return threads.find((thread) => thread.key === key) || null;
}

export function buildDynamicThread({
  query,
  events,
  maxItems = 12,
}) {
  const text = String(query ?? "").trim();

  if (!text) {
    return {
      thread: null,
      error: null,
      totalMatches: 0,
      selectedCount: 0,
      matches: [],
    };
  }

  const expression = parseSearchExpression(text);

  if (expression.error) {
    return {
      thread: null,
      error: expression.error,
      totalMatches: 0,
      selectedCount: 0,
      matches: [],
    };
  }

  const terms = searchTermsOf(text);
  const candidates = events
    .filter((event) =>
      matchesSearchExpression(
        expression.root,
        searchableTextOf(event)
      )
    )
    .map((event) => ({
      event,
      score: relevanceScore(event, terms),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.event.importance ?? 2) -
          (a.event.importance ?? 2) ||
        eventYear(a.event) - eventYear(b.event)
    );

  const totalMatches = candidates.length;
  const selected = candidates
    .slice(0, Math.max(2, maxItems))
    .map(({ event }) => event)
    .sort(
      (a, b) =>
        eventYear(a) - eventYear(b) ||
        String(a.date || "").localeCompare(
          String(b.date || "")
        )
    );

  if (selected.length < 2) {
    return {
      thread: null,
      error: null,
      totalMatches,
      selectedCount: selected.length,
      matches: selected,
    };
  }

  return {
    thread: {
      key: `dynamic:${text}`,
      title: `${text}をたどる`,
      lead:
        `キーワード「${text}」に関連する共通年表の出来事を年代順にたどります。`,
      events: selected,
      dynamic: true,
      query: text,
    },
    error: null,
    totalMatches,
    selectedCount: selected.length,
    matches: selected,
  };
}
