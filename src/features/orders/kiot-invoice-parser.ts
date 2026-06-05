import type { CatalogProduct } from "@/features/catalog/catalog-types";
import { compactAlias } from "@/lib/normalize";

export type ParsedKiotInvoiceLine = {
  productId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  rawName: string;
};

export type ParsedKiotInvoice = {
  kiotInvoiceCode?: string;
  invoiceDate?: string;
  customerName?: string;
  customerPhone?: string;
  totalQuantity?: number;
  totalPayment?: number;
  customerPaid?: number;
  remainingDebt?: number;
  previousDebt?: number;
  nextDebt?: number;
  lines: ParsedKiotInvoiceLine[];
};

export function parseKiotInvoiceText(rawText: string, products: CatalogProduct[]): ParsedKiotInvoice {
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const aliasIndex = new Map<string, CatalogProduct>();
  for (const product of products) {
    aliasIndex.set(compactAlias(product.name), product);
    for (const alias of product.aliases) aliasIndex.set(compactAlias(alias.value), product);
  }

  const invoice: ParsedKiotInvoice = {
    kiotInvoiceCode: matchOne(rawText, /Số\s*hóa\s*đơn\s*:\s*(HD\d+)/i),
    invoiceDate: parseVietnameseDate(rawText),
    customerName: matchOne(rawText, /Khách\s*hàng\s*:\s*([^\n\r]+)/i),
    customerPhone: matchOne(rawText, /SĐT\s*:\s*([0-9\s]+)/i)?.replace(/\s+/g, ""),
    totalQuantity: parseMoneyAfterLabel(lines, "Tổng cộng", 0),
    totalPayment: parseMoneyAfterLabel(lines, "Tổng thanh toán", 0),
    customerPaid: parseMoneyAfterLabel(lines, "Khách hàng thanh toán", 0),
    remainingDebt: parseMoneyAfterLabel(lines, "Còn lại", 0),
    previousDebt: parseMoneyAfterLabel(lines, "Dư nợ trước", 0),
    nextDebt: parseMoneyAfterLabel(lines, "Dư nợ sau hóa đơn", 0),
    lines: []
  };

  invoice.lines = parseInvoiceLines(lines, aliasIndex);
  if (!invoice.totalPayment && invoice.lines.length > 0) {
    invoice.totalPayment = invoice.lines.reduce((sum, line) => sum + line.lineTotal, 0);
  }
  if (!invoice.remainingDebt && invoice.totalPayment) invoice.remainingDebt = invoice.totalPayment - (invoice.customerPaid ?? 0);
  return invoice;
}

export function estimateOrderWeightKg(lines: ParsedKiotInvoiceLine[], products: CatalogProduct[]): number {
  return Math.round(lines.reduce((sum, line) => {
    const product = products.find((item) => item.id === line.productId);
    return sum + line.quantity * estimateProductWeightKg(product);
  }, 0) * 10) / 10;
}

function parseInvoiceLines(lines: string[], aliasIndex: Map<string, CatalogProduct>): ParsedKiotInvoiceLine[] {
  const start = lines.findIndex((line) => compactAlias(line) === "thanhtien");
  if (start < 0) return [];
  const data = lines.slice(start + 1);
  const stop = data.findIndex((line) => compactAlias(line).startsWith("tongcong"));
  const tokens = (stop >= 0 ? data.slice(0, stop) : data).filter((line) => line !== "-");
  const rows: ParsedKiotInvoiceLine[] = [];

  for (let index = 0; index < tokens.length;) {
    if (!/^\d+$/.test(tokens[index])) {
      index += 1;
      continue;
    }
    const sku = tokens[index + 1];
    const rawName = tokens[index + 2];
    const quantity = parseNumber(tokens[index + 3]);
    const unitPrice = parseNumber(tokens[index + 4]);
    const lineTotal = parseNumber(tokens[index + 5]);
    if (!sku || !rawName || !quantity || !unitPrice) {
      index += 1;
      continue;
    }
    const product = aliasIndex.get(compactAlias(rawName));
    rows.push({
      productId: product?.id,
      productName: product?.name ?? rawName,
      sku,
      quantity,
      unitPrice,
      lineTotal: lineTotal || quantity * unitPrice,
      rawName
    });
    index += 6;
  }
  return rows;
}

function parseMoneyAfterLabel(lines: string[], label: string, offset: number): number | undefined {
  const index = lines.findIndex((line) => compactAlias(line).startsWith(compactAlias(label)));
  if (index < 0) return undefined;
  for (const line of lines.slice(index + offset + 1, index + offset + 5)) {
    const value = parseNumber(line);
    if (value !== undefined) return value;
  }
  return undefined;
}

function parseVietnameseDate(rawText: string): string | undefined {
  const match = /Ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i.exec(rawText);
  if (!match) return undefined;
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function matchOne(rawText: string, pattern: RegExp): string | undefined {
  return pattern.exec(rawText)?.[1]?.trim();
}

function parseNumber(value?: string): number | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/,/g, "").replace(/\./g, "").trim();
  if (!/^\d+$/.test(normalized)) return undefined;
  return Number(normalized);
}

function estimateProductWeightKg(product?: CatalogProduct): number {
  if (!product?.packageRule) return 1;
  const kg = /(\d+(?:[.,]\d+)?)\s*kg/i.exec(product.packageRule)?.[1];
  if (kg && product.unit === "bao") return Number(kg.replace(",", "."));
  if (product.unit === "can") return 1.7;
  if (product.unit === "thùng") return 12;
  return 1;
}
