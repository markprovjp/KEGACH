import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

type KiotCustomer = {
  Id?: number;
  Code?: string;
  Name?: string;
  ContactNumber?: string;
  SubNumber?: string;
  Address?: string;
  LocationName?: string;
  WardName?: string;
  Comments?: string;
  Debt?: number;
  TotalInvoiced?: number;
  TotalRevenue?: number;
  InvoiceCount?: number;
  CustomerType?: string;
  Groups?: string;
  LastTradingDate?: string;
  IsActive?: boolean;
  IsDeleted?: boolean;
};

type KiotCustomerPage = {
  Data?: KiotCustomer[];
};

const prisma = new PrismaClient();

async function main() {
  const filePath = resolve(process.argv[2] ?? "khachhang.json");
  const pages = parseKiotPages(readFileSync(filePath, "utf8"));
  const byKiotId = new Map<number, KiotCustomer>();

  for (const customer of pages.flatMap((page) => page.Data ?? [])) {
    if (!customer.Id || customer.Id <= 0 || customer.IsActive === false || customer.IsDeleted === true || !customer.Name?.trim()) continue;
    byKiotId.set(customer.Id, customer);
  }

  let created = 0;
  let updated = 0;
  for (const customer of byKiotId.values()) {
    const existing = await prisma.customer.findUnique({ where: { kiotCustomerId: customer.Id } });
    await prisma.customer.upsert({
      where: { kiotCustomerId: customer.Id },
      update: toCustomerPayload(customer),
      create: toCustomerPayload(customer)
    });
    if (existing) updated += 1;
    else created += 1;
  }

  console.log(JSON.stringify({ pages: pages.length, imported: byKiotId.size, created, updated }, null, 2));
}

function parseKiotPages(rawText: string): KiotCustomerPage[] {
  return rawText
    .split(/\r?\n\s*\r?\n(?=\{\s*"Total1Value")/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => JSON.parse(chunk) as KiotCustomerPage);
}

function toCustomerPayload(customer: KiotCustomer) {
  return {
    kiotCustomerId: customer.Id!,
    kiotCustomerCode: customer.Code?.trim() || null,
    name: customer.Name!.trim(),
    phone: normalizePhone(customer.ContactNumber) || normalizePhone(customer.SubNumber) || null,
    address: buildAddress(customer),
    province: customer.LocationName?.trim() || null,
    note: customer.Comments?.trim() || null,
    debt: Number(customer.Debt ?? 0),
    totalInvoiced: Number(customer.TotalInvoiced ?? 0),
    totalRevenue: Number(customer.TotalRevenue ?? 0),
    invoiceCount: Number(customer.InvoiceCount ?? 0),
    customerType: customer.CustomerType?.trim() || null,
    groups: customer.Groups?.trim() || null,
    lastTradingAt: parseKiotDate(customer.LastTradingDate)
  };
}

function normalizePhone(value?: string): string | null {
  const phone = value?.replace(/\s+/g, "").trim();
  return phone || null;
}

function buildAddress(customer: KiotCustomer): string | null {
  const parts = [customer.Address, customer.WardName, customer.LocationName].map((part) => part?.trim()).filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function parseKiotDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) || date.getFullYear() <= 1 ? null : date;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
