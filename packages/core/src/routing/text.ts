export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function titleFromRequest(request: string) {
  const compact = request.replace(/\s+/g, " ").trim();
  return compact.length <= 120 ? compact : `${compact.slice(0, 117).trimEnd()}...`;
}
