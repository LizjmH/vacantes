export function searchTerms(query: string) {
  const normalized = query
    .slice(0, 200)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (/^[+\d()\s.-]+$/.test(normalized)) {
    const digits = normalized.replace(/\D/g, "");
    return digits ? [digits] : [];
  }
  return normalized.split(/\s+/).filter(Boolean);
}
