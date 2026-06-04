import { compactAlias, normalizeSearchText } from "@/lib/normalize";
import type { CatalogProduct, ProductParseResult } from "./catalog-types";

const quantityPattern = /(?:=|:)\s*(\d+(?:[.,]\d+)?)\s*([a-zA-Z\u00C0-\u1EF9]+)?|\b(\d+(?:[.,]\d+)?)\s*([a-zA-Z\u00C0-\u1EF9]+)\b/u;

export function parseProductLines(rawText: string, products: CatalogProduct[]): ProductParseResult {
  const aliasIndex = buildAliasIndex(products);
  const matched = [];
  const unmatched = [];

  for (const rawLine of splitOrderLines(rawText)) {
    const normalized = normalizeSearchText(rawLine.replace(/^\*+/, ""));
    const compact = compactAlias(normalized);
    const found = Array.from(aliasIndex.entries()).find(([alias]) => compact.includes(alias));

    if (!found) {
      unmatched.push(rawLine);
      continue;
    }

    const [, product] = found;
    const quantity = extractQuantity(rawLine);
    matched.push({
      productId: product.id,
      productName: product.name,
      quantity: quantity.value,
      unit: quantity.unit ?? product.unit,
      rawLine,
      alias: found[0]
    });
  }

  return { matched, unmatched };
}

function splitOrderLines(rawText: string): string[] {
  return rawText
    .split(/\r?\n|;/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildAliasIndex(products: CatalogProduct[]): Map<string, CatalogProduct> {
  const entries = products.flatMap((product) => [product.name, ...product.aliases.map((alias) => alias.value)].map((value) => [compactAlias(value), product] as const));
  entries.sort((a, b) => b[0].length - a[0].length);
  return new Map(entries);
}

function extractQuantity(rawLine: string): { value: number; unit?: string } {
  const match = quantityPattern.exec(rawLine);
  if (!match) return { value: 1 };

  const rawQuantity = match[1] ?? match[3] ?? "1";
  const rawUnit = match[2] ?? match[4];
  return {
    value: Number(rawQuantity.replace(",", ".")),
    unit: rawUnit ? normalizeSearchText(rawUnit) : undefined
  };
}
