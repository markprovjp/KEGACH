import type { CatalogProduct } from "@/features/catalog/catalog-types";

export type ProductQuantityUnit = {
  value: string;
  label: string;
  factor: number;
};

const unitAliases: Record<string, string[]> = {
  "tuýp": ["tuýp", "tuyp", "cái", "cai"],
  "cái": ["cái", "cai"],
  "kg": ["kg", "ký", "ky", "cân", "can"],
  "túi": ["túi", "tui"],
  "can": ["can"],
  "bộ": ["bộ", "bo"]
};

export function getProductQuantityUnits(product?: Pick<CatalogProduct, "unit" | "packageRule">): ProductQuantityUnit[] {
  if (!product) return [{ value: "", label: "Chọn hàng", factor: 1 }];
  const baseUnit = normalizeUnit(product.unit);
  const units: ProductQuantityUnit[] = [{ value: baseUnit, label: baseUnit, factor: 1 }];
  const rule = normalizeRule(product.packageRule);
  if (!rule) return units;

  const baseAliases = unitAliases[baseUnit] ?? [baseUnit];
  const unitPattern = baseAliases.map(escapeRegExp).join("|");
  const directRule = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(?:${unitPattern})\\s*\\/\\s*(?:1\\s*)?(thùng|thung|bao)`, "i").exec(rule);
  if (directRule) {
    units.push({
      value: normalizeUnit(directRule[2]),
      label: normalizeUnit(directRule[2]),
      factor: Number(directRule[1].replace(",", "."))
    });
  }

  const nestedRule = /(\d+(?:[.,]\d+)?)\s*túi\s*\/\s*(?:1\s*)?thùng/i.exec(rule);
  if (nestedRule && baseUnit === "túi") {
    upsertUnit(units, { value: "thùng", label: "thùng", factor: Number(nestedRule[1].replace(",", ".")) });
  }

  return units;
}

export function convertProductQuantity(input: { product?: CatalogProduct; enteredQuantity: number; enteredUnit?: string }) {
  const units = getProductQuantityUnits(input.product);
  const unit = units.find((item) => item.value === normalizeUnit(input.enteredUnit || input.product?.unit || ""));
  const factor = unit?.factor ?? 1;
  const quantity = roundQuantity(Number(input.enteredQuantity || 0) * factor);
  const baseUnit = normalizeUnit(input.product?.unit ?? "");
  const enteredUnit = unit?.value ?? baseUnit;
  return {
    quantity,
    enteredUnit,
    conversionNote: enteredUnit && enteredUnit !== baseUnit ? `${formatNumber(input.enteredQuantity)} ${enteredUnit} = ${formatNumber(quantity)} ${baseUnit}` : undefined
  };
}

function upsertUnit(units: ProductQuantityUnit[], next: ProductQuantityUnit) {
  if (!units.some((unit) => unit.value === next.value)) units.push(next);
}

function normalizeRule(value?: string | null): string {
  return String(value ?? "").normalize("NFC").toLowerCase();
}

function normalizeUnit(value?: string | null): string {
  const normalized = String(value ?? "").trim().normalize("NFC").toLowerCase();
  if (["thung"].includes(normalized)) return "thùng";
  if (["tui"].includes(normalized)) return "túi";
  if (["tuyp", "tuýp"].includes(normalized)) return "tuýp";
  if (["cai"].includes(normalized)) return "cái";
  if (["bo"].includes(normalized)) return "bộ";
  return normalized;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function roundQuantity(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function formatNumber(value: number): string {
  return Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 3 });
}
