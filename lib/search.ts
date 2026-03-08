export function normalizeSearchQuery(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

export function buildTsQuery(value: string | null | undefined) {
  const normalized = normalizeSearchQuery(value);

  if (!normalized) {
    return "";
  }

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((token) => `${token}:*`)
    .join(" & ");
}

export function matchesSearch(haystack: string, query: string) {
  const normalizedQuery = normalizeSearchQuery(query).toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return haystack.toLowerCase().includes(normalizedQuery);
}
