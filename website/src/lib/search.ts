import type { SearchEntry } from "../types";

export function searchEntries(
  entries: readonly SearchEntry[],
  query: string,
): readonly SearchEntry[] {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) {
    return entries;
  }

  return entries
    .map((entry) => ({
      entry,
      score: scoreEntry(entry, terms),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) =>
      right.score - left.score ||
      left.entry.title.localeCompare(right.entry.title)
    )
    .map(({ entry }) => entry);
}

function scoreEntry(
  entry: SearchEntry,
  terms: readonly string[],
): number {
  const title = entry.title.toLowerCase();
  const id = entry.id.toLowerCase();
  const kind = entry.kind.toLowerCase();
  const text = entry.text.toLowerCase();
  let score = 0;

  for (const term of terms) {
    if (title.includes(term)) {
      score += 10;
    }

    if (id.includes(term)) {
      score += 6;
    }

    if (kind.includes(term)) {
      score += 3;
    }

    if (text.includes(term)) {
      score += 1;
    }
  }

  return score;
}
