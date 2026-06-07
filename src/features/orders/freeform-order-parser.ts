import type { CatalogProduct } from "@/features/catalog/catalog-types";
import { buildProductSearchTokens } from "@/features/catalog/product-search-helpers";
import { compactAlias, normalizeSearchText } from "@/lib/normalize";

export type ParsedFreeformOrderLine = {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  enteredQuantity: number;
  enteredUnit: string;
  conversionNote?: string;
  rawLine: string;
  confidence: number;
};

export type FreeformOrderParseResult = {
  matched: ParsedFreeformOrderLine[];
  unmatched: string[];
};

type AliasEntry = {
  alias: string;
  product: CatalogProduct;
  weight: number;
};

const unitAliases: Record<string, string> = {
  t: "thùng",
  thung: "thùng",
  thùng: "thùng",
  bao: "bao",
  kg: "kg",
  can: "can",
  cai: "cái",
  cái: "cái",
  tuyp: "tuýp",
  tuýp: "tuýp",
  tube: "tuýp",
  tui: "túi",
  túi: "túi",
  bo: "bộ",
  bộ: "bộ"
};

const quantityWithUnitPattern = /(\d+(?:[.,]\d+)?)\s*(kg|thùng|thung|túi|tui|tuýp|tuyp|tube|bao|can|cái|cai|bộ|bo|t)(?=$|\s|[,.;])/giu;

export function parseFreeformOrderText(rawText: string, products: CatalogProduct[]): FreeformOrderParseResult {
  const aliasIndex = buildAliasIndex(products);
  const matched: ParsedFreeformOrderLine[] = [];
  const unmatched: string[] = [];

  for (const rawLine of splitLines(rawText)) {
    const product = findProduct(rawLine, products, aliasIndex);
    if (!product) {
      unmatched.push(rawLine);
      continue;
    }
    const entered = extractQuantity(rawLine);
    const converted = convertQuantity(entered.value, entered.unit, product);
    matched.push({
      productId: product.id,
      productName: product.name,
      quantity: converted.quantity,
      unit: product.unit,
      unitPrice: product.defaultPrice,
      enteredQuantity: entered.value,
      enteredUnit: entered.unit,
      conversionNote: converted.note,
      rawLine,
      confidence: product.id === findColorCodeProduct(rawLine, products)?.id ? 0.98 : 0.86
    });
  }

  return { matched, unmatched };
}

function splitLines(rawText: string): string[] {
  return rawText
    .split(/\r?\n|;/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function findProduct(rawLine: string, products: CatalogProduct[], aliasIndex: AliasEntry[]): CatalogProduct | undefined {
  const colorProduct = findColorCodeProduct(rawLine, products);
  if (colorProduct) return colorProduct;

  const sizeProduct = findSizeProduct(rawLine, products);
  if (sizeProduct) return sizeProduct;

  const compact = compactAlias(rawLine);
  return aliasIndex.find((entry) => entry.alias.length >= 2 && compact.includes(entry.alias))?.product;
}

function findColorCodeProduct(rawLine: string, products: CatalogProduct[]): CatalogProduct | undefined {
  const normalized = normalizeSearchText(rawLine);
  const compact = compactAlias(rawLine);
  const explicit = /\b(cat|b)\s*-?\s*(\d{1,2})\b/i.exec(normalized);
  const colorOnly = /\bmau\s*(\d{1,2})\b/i.exec(normalized) ?? /\bmau(\d{1,2})\b/i.exec(compact);
  const prefix = explicit?.[1]?.toLowerCase() || (colorOnly ? (normalized.includes("cat") ? "cat" : "b") : undefined);
  const number = explicit?.[2] || colorOnly?.[1];
  if (!prefix || !number) return undefined;

  const code = `${prefix}${number.padStart(2, "0")}`;
  return findExactCodeProduct(products, code) ?? findFamilyProduct(products, prefix);
}

function findExactCodeProduct(products: CatalogProduct[], code: string): CatalogProduct | undefined {
  const target = compactAlias(code);
  return products.find((product) => compactAlias(product.name) === target || compactAlias(product.sku ?? "") === target || product.aliases.some((alias) => compactAlias(alias.value) === target));
}

function findFamilyProduct(products: CatalogProduct[], prefix: string): CatalogProduct | undefined {
  return products.find((product) => {
    const name = normalizeSearchText(product.name);
    return prefix === "cat" ? name.includes("epoxy cat") : name.includes("bonbond");
  });
}

function findSizeProduct(rawLine: string, products: CatalogProduct[]): CatalogProduct | undefined {
  const normalized = normalizeSearchText(rawLine);
  const size = /(\d+(?:[.,]\d+)?)\s*(?:mm|ly)\b/i.exec(normalized)?.[1]?.replace(",", ".");
  if (!size) return undefined;
  const family = normalized.includes("chu thap") ? "ke chu thap" : "ke can bang";
  const target = normalizeSearchText(`${family} ${size}mm`);
  return products.find((product) => normalizeSearchText(product.name).includes(target));
}

function buildAliasIndex(products: CatalogProduct[]): AliasEntry[] {
  const entries = products.flatMap((product) => {
    const tokens = buildProductSearchTokens(product);
    return tokens.map((token) => ({ alias: compactAlias(token), product, weight: compactAlias(token).length }));
  });
  return entries
    .filter((entry) => entry.alias.length >= 2)
    .sort((a, b) => b.weight - a.weight);
}

function extractQuantity(rawLine: string): { value: number; unit: string } {
  const matches = Array.from(rawLine.matchAll(quantityWithUnitPattern));
  const match = matches[0];
  if (!match) return { value: 1, unit: "cái" };
  return {
    value: Number(match[1].replace(",", ".")),
    unit: normalizeUnit(match[2])
  };
}

function convertQuantity(quantity: number, enteredUnit: string, product: CatalogProduct): { quantity: number; note?: string } {
  const productUnit = normalizeUnit(product.unit);
  const inputUnit = normalizeUnit(enteredUnit);
  if (inputUnit === productUnit) return { quantity };

  const packageFactor = getPackageFactor(product, inputUnit, productUnit);
  if (packageFactor) {
    const converted = roundQuantity(quantity * packageFactor);
    return { quantity: converted, note: `${formatQuantity(quantity)} ${enteredUnit} = ${formatQuantity(converted)} ${product.unit}` };
  }

  return { quantity, note: `Giữ ${formatQuantity(quantity)} ${enteredUnit}; kiểm tra quy đổi sang ${product.unit}` };
}

function getPackageFactor(product: CatalogProduct, inputUnit: string, productUnit: string): number | undefined {
  const rule = normalizeSearchText(product.packageRule ?? "");
  if ((inputUnit === "thùng" || inputUnit === "bao") && productUnit === "kg") {
    const kg = /(\d+(?:[.,]\d+)?)\s*kg/.exec(rule)?.[1];
    if (kg) return Number(kg.replace(",", "."));
  }
  if (inputUnit === "thùng" && (productUnit === "tuýp" || productUnit === "cái")) {
    const count = /(\d+(?:[.,]\d+)?)\s*(?:cai|tuyp)/.exec(rule)?.[1];
    if (count) return Number(count.replace(",", "."));
    return 30;
  }
  if (inputUnit === "túi" && productUnit === "cái") {
    const count = /1\s*tui\s*(\d+(?:[.,]\d+)?)\s*cai/.exec(rule)?.[1];
    if (count) return Number(count.replace(",", "."));
  }
  return undefined;
}

function normalizeUnit(unit: string): string {
  return unitAliases[normalizeSearchText(unit)] ?? normalizeSearchText(unit);
}

function roundQuantity(value: number): number {
  return Number(value.toFixed(3));
}

function formatQuantity(value: number): string {
  return Number.isInteger(value) ? value.toLocaleString("vi-VN") : value.toLocaleString("vi-VN", { maximumFractionDigits: 3 });
}
