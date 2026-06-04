const vietnameseMarks = /[\u0300-\u036f]/g;

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(vietnameseMarks, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function compactAlias(value: string): string {
  return normalizeSearchText(value).replace(/\s+/g, "");
}
