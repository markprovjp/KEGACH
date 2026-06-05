import type { CatalogProduct, ProductVariant } from "@/features/catalog/catalog-types";
import { compactAlias, normalizeSearchText } from "@/lib/normalize";

export function buildProductSearchText(product: CatalogProduct): string {
  return buildProductSearchTokens(product).join(" ");
}

export function buildProductSearchTokens(product: CatalogProduct): string[] {
  const tokens = [product.id, product.sku, product.name, ...product.aliases.map((alias) => alias.value)];
  for (const variant of product.variants ?? []) {
    tokens.push(...buildVariantSearchTokens(product, variant));
  }
  return Array.from(new Set(tokens.filter(Boolean).flatMap((token) => [normalizeSearchText(String(token)), compactAlias(String(token))])));
}

export function buildVariantLabel(product: CatalogProduct): string {
  const variants = product.variants ?? [];
  if (variants.length === 0) return "";
  return variants.map((variant) => buildVariantDisplay(product, variant)).join(", ");
}

export function buildVariantSearchTokens(product: CatalogProduct, variant: ProductVariant): string[] {
  const code = String(variant.code).trim();
  const numeric = code.match(/\d+/)?.[0]?.padStart(2, "0");
  const prefixes = product.name.toLowerCase().includes("cat") ? ["cat", "c", "b"] : ["b", "bonbond"];
  const aliases = [code, code.toLowerCase(), code.toUpperCase()];

  if (numeric) {
    aliases.push(numeric, ...prefixes.map((prefix) => `${prefix}${numeric}`), ...prefixes.map((prefix) => `${prefix}-${numeric}`));
  }

  aliases.push(buildVariantDisplay(product, variant));
  return aliases;
}

function buildVariantDisplay(product: CatalogProduct, variant: ProductVariant): string {
  const code = displayVariantCode(product, variant.code);
  const chunks = [];
  if (variant.cartonCount) chunks.push(`${variant.cartonCount} thùng`);
  if (variant.tubeCount) chunks.push(`${variant.tubeCount} tuýp`);
  return `${code}${chunks.length ? ` (${chunks.join(" + ")})` : ""}`;
}

function displayVariantCode(product: CatalogProduct, code: string): string {
  const normalized = code.toUpperCase();
  const numeric = normalized.match(/^\d+$/)?.[0]?.padStart(2, "0");
  if (!numeric) return normalized;
  if (product.name.toLowerCase().includes("bonbond")) return `B${numeric}`;
  if (product.name.toLowerCase().includes("cat")) return `CAT${numeric}`;
  return normalized;
}
