import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { compactAlias, normalizeSearchText } from "../src/lib/normalize";

type KiotProduct = {
  Id?: number;
  ProductId?: number;
  Code?: string;
  Name?: string;
  NameOriginal?: string;
  FullName?: string;
  CategoryName?: string;
  BasePrice?: number;
  OnHand?: number;
  Reserved?: number;
  Unit?: string;
  UnitListStr?: string;
  Description?: string;
  isActive?: boolean;
  isDeleted?: boolean;
};

type KiotProductPage = {
  Data?: KiotProduct[];
};

const prisma = new PrismaClient();

async function main() {
  const filePath = resolve(process.argv[2] ?? "sanpham.json");
  const pages = parseKiotProductPages(readFileSync(filePath, "utf8"));
  const products = new Map<number, KiotProduct>();

  for (const product of pages.flatMap((page) => page.Data ?? [])) {
    const id = product.ProductId || product.Id;
    if (!id || id <= 0 || product.isActive === false || product.isDeleted === true || !product.Name?.trim() || !product.Code?.trim()) continue;
    products.set(id, product);
  }

  let created = 0;
  let updated = 0;
  for (const product of products.values()) {
    const sku = product.Code!.trim();
    const existing = await prisma.product.findUnique({ where: { sku }, include: { inventoryMovement: true } });
    const saved = await prisma.product.upsert({
      where: { sku },
      update: toProductUpdatePayload(product),
      create: toProductCreatePayload(product)
    });
    await syncOnHand(saved.id, Number(product.OnHand ?? 0), existing?.inventoryMovement ?? [], product);
    if (existing) updated += 1;
    else created += 1;
  }

  console.log(JSON.stringify({ pages: pages.length, imported: products.size, created, updated }, null, 2));
}

export function parseKiotProductPages(rawText: string): KiotProductPage[] {
  return rawText
    .split(/\r?\n\s*\r?\n(?=\{\s*"TotalOnHand")/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => JSON.parse(chunk) as KiotProductPage);
}

function toProductCorePayload(product: KiotProduct) {
  const name = (product.FullName || product.Name)!.trim();
  return {
    sku: product.Code!.trim(),
    name,
    unit: inferUnit(product),
    defaultPrice: Number(product.BasePrice ?? 0),
    distributorPrice: null,
    packageRule: inferPackageRule(product),
    description: buildDescription(product),
    weightPerUnitKg: inferWeightKg(product)
  };
}

function toProductUpdatePayload(product: KiotProduct) {
  const name = (product.FullName || product.Name)!.trim();
  const aliases = buildAliases(product, name);
  return {
    ...toProductCorePayload(product),
    aliases: {
      deleteMany: {},
      create: aliases.map((value) => ({ value }))
    },
    variants: {
      deleteMany: {}
    }
  };
}

function toProductCreatePayload(product: KiotProduct) {
  const name = (product.FullName || product.Name)!.trim();
  const aliases = buildAliases(product, name);
  return {
    ...toProductCorePayload(product),
    aliases: {
      create: aliases.map((value) => ({ value }))
    }
  };
}

function buildAliases(product: KiotProduct, name: string): string[] {
  const aliases = new Set<string>();
  for (const value of [product.Code, product.Name, product.NameOriginal, name]) {
    const cleaned = value?.trim();
    if (cleaned && cleaned !== name) aliases.add(cleaned);
  }
  const normalized = normalizeSearchText(name);
  const compact = compactAlias(normalized);
  aliases.add(compact);
  const colorMatch = compact.match(/^(?:cat|b)(\d{1,2})$/);
  if (colorMatch) {
    const code = colorMatch[1].padStart(2, "0");
    aliases.add(compact.startsWith("cat") ? `cat${code}` : `b${code}`);
  }
  return Array.from(aliases);
}

function inferUnit(product: KiotProduct): string {
  if (product.Unit?.trim()) return product.Unit.trim();
  if (product.UnitListStr?.trim()) return product.UnitListStr.trim();
  const name = normalizeSearchText(product.Name || "");
  const compact = compactAlias(name);
  if (/^(b|cat)\d{1,2}$/.test(compact)) return "tuýp";
  if (name.includes("ke can bang") || name === "nem" || name.startsWith("nem ")) return "kg";
  if (name.includes("kim") || name.includes("kich") || name.includes("sung") || name.includes("rach") || name.includes("sui")) return "cái";
  if (name.includes("biron")) return "bộ";
  return "cái";
}

function inferPackageRule(product: KiotProduct): string | null {
  const name = normalizeSearchText(product.Name || "");
  const compact = compactAlias(name);
  if (/^(b|cat)\d{1,2}$/.test(compact)) return "30 cái / thùng";
  if (name.includes("ke can bang") || name === "nem" || name.startsWith("nem ")) return "30 kg / bao";
  return null;
}

function inferWeightKg(product: KiotProduct): number {
  const unit = inferUnit(product);
  if (unit === "kg") return 1;
  return 0;
}

function buildDescription(product: KiotProduct): string | null {
  const parts = [
    product.Description?.trim(),
    product.CategoryName ? `Nhóm Kiot: ${product.CategoryName}` : undefined,
    product.Code ? `Mã Kiot: ${product.Code}` : undefined,
    product.ProductId || product.Id ? `ID Kiot: ${product.ProductId || product.Id}` : undefined
  ].filter(Boolean);
  return parts.length ? parts.join(" | ") : null;
}

async function syncOnHand(productId: string, targetOnHand: number, currentMovements: Array<{ type: string; quantity: number }>, product: KiotProduct) {
  const currentOnHand = currentMovements.reduce((stock, movement) => {
    if (["purchase_in", "return_in", "manual_adjustment", "package_produce"].includes(movement.type)) return stock + movement.quantity;
    if (["ship", "damage_out", "package_consume"].includes(movement.type)) return stock - movement.quantity;
    return stock;
  }, 0);
  const delta = targetOnHand - currentOnHand;
  if (Math.abs(delta) < 0.0001) return;
  await prisma.inventoryMovement.create({
    data: {
      productId,
      type: "manual_adjustment",
      quantity: delta,
      note: `Sync tồn Kiot ${product.Code}: ${targetOnHand}`
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
