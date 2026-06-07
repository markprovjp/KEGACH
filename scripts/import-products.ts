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

type ExistingProduct = NonNullable<Awaited<ReturnType<typeof prisma.product.findUnique>>> & {
  aliases?: Array<{ value: string }>;
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
  let mergedDuplicates = 0;
  for (const product of products.values()) {
    const sku = canonicalSkuForKiotProduct(product);
    const existing = await prisma.product.findUnique({ where: { sku }, include: { aliases: true, inventoryMovement: true } });
    const saved = await prisma.product.upsert({
      where: { sku },
      update: toProductUpdatePayload(product, sku, existing ?? undefined),
      create: toProductCreatePayload(product, sku)
    });
    mergedDuplicates += await mergeOldKiotDuplicate(product.Code!.trim(), saved.id);
    const movements = await prisma.inventoryMovement.findMany({ where: { productId: saved.id } });
    await syncOnHand(saved.id, Number(product.OnHand ?? 0), movements, product);
    if (existing) updated += 1;
    else created += 1;
  }

  console.log(JSON.stringify({ pages: pages.length, imported: products.size, created, updated, mergedDuplicates }, null, 2));
}

export function parseKiotProductPages(rawText: string): KiotProductPage[] {
  return rawText
    .split(/\r?\n\s*\r?\n(?=\{\s*"TotalOnHand")/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => JSON.parse(chunk) as KiotProductPage);
}

export function canonicalSkuForKiotProduct(product: KiotProduct): string {
  const name = normalizeSearchText(product.Name || product.FullName || "");
  if (name === "nem") return "nem";
  if (name.includes("ke can bang 1mm")) return "ke-can-bang-1mm";
  if (name.includes("ke can bang 1.5mm")) return "ke-can-bang-1-5mm";
  if (name.includes("ke can bang 2mm")) return "ke-can-bang-2mm";
  if (name.includes("ke can bang 3mm")) return "ke-can-bang-3mm";
  if (name.includes("ke chu thap 1mm")) return "ke-chu-thap-1mm";
  if (name.includes("ke chu thap 1.5mm")) return "ke-chu-thap-1-5mm";
  if (name.includes("ke chu thap 2mm")) return "ke-chu-thap-2mm";
  if (name.includes("ke chu thap 3mm")) return "ke-chu-thap-3mm";
  if (name.includes("ke chu thap 5mm")) return "ke-chu-thap-5mm";
  return product.Code!.trim();
}

function displayNameForKiotProduct(product: KiotProduct, sku: string): string {
  const canonicalNames: Record<string, string> = {
    "ke-can-bang-1mm": "Ke cân bằng 1MM",
    "ke-can-bang-1-5mm": "Ke cân bằng 1.5MM",
    "ke-can-bang-2mm": "Ke cân bằng 2MM",
    "ke-can-bang-3mm": "Ke cân bằng 3MM",
    "ke-chu-thap-1mm": "Ke chữ thập 1MM",
    "ke-chu-thap-1-5mm": "Ke chữ thập 1.5MM",
    "ke-chu-thap-2mm": "Ke chữ thập 2MM",
    "ke-chu-thap-3mm": "Ke chữ thập 3MM",
    "ke-chu-thap-5mm": "Ke chữ thập 5MM",
    nem: "Nêm"
  };
  return canonicalNames[sku] ?? (product.FullName || product.Name)!.trim();
}

function toProductCorePayload(product: KiotProduct, sku: string, existing?: ExistingProduct) {
  const name = displayNameForKiotProduct(product, sku);
  const kiotPrice = Number(product.BasePrice ?? 0);
  return {
    sku,
    name,
    unit: inferUnit(product),
    defaultPrice: kiotPrice > 0 ? kiotPrice : existing?.defaultPrice ?? 0,
    distributorPrice: existing?.distributorPrice ?? null,
    packageRule: inferPackageRule(product),
    description: buildDescription(product, existing?.description ?? undefined),
    weightPerUnitKg: inferWeightKg(product)
  };
}

function toProductUpdatePayload(product: KiotProduct, sku: string, existing?: ExistingProduct) {
  const name = displayNameForKiotProduct(product, sku);
  const aliases = buildAliases(product, name, existing?.aliases?.map((alias) => alias.value));
  return {
    ...toProductCorePayload(product, sku, existing),
    aliases: {
      deleteMany: {},
      create: aliases.map((value) => ({ value }))
    },
    variants: {
      deleteMany: {}
    }
  };
}

function toProductCreatePayload(product: KiotProduct, sku: string) {
  const name = displayNameForKiotProduct(product, sku);
  const aliases = buildAliases(product, name);
  return {
    ...toProductCorePayload(product, sku),
    aliases: {
      create: aliases.map((value) => ({ value }))
    }
  };
}

function buildAliases(product: KiotProduct, name: string, existingAliases: string[] = []): string[] {
  const aliases = new Set<string>();
  for (const value of [...existingAliases, product.Code, product.Name, product.NameOriginal, name]) {
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
  if (name.includes("ke can bang") || name.includes("ke chu thap") || name === "nem" || name.startsWith("nem ")) return "kg";
  if (name.includes("kim") || name.includes("kich") || name.includes("sung") || name.includes("rach") || name.includes("sui")) return "cái";
  if (name.includes("biron")) return "bộ";
  return "cái";
}

function inferPackageRule(product: KiotProduct): string | null {
  const name = normalizeSearchText(product.Name || "");
  const compact = compactAlias(name);
  if (/^(b|cat)\d{1,2}$/.test(compact)) return "30 cái / thùng";
  if (name.includes("ke can bang") || name.includes("ke chu thap") || name === "nem" || name.startsWith("nem ")) return "30 kg / bao";
  return null;
}

function inferWeightKg(product: KiotProduct): number {
  const unit = inferUnit(product);
  if (unit === "kg") return 1;
  return 0;
}

function buildDescription(product: KiotProduct, existingDescription?: string): string | null {
  const parts = [
    existingDescription?.trim(),
    product.Description?.trim(),
    product.CategoryName ? `Nhóm Kiot: ${product.CategoryName}` : undefined,
    product.Code ? `Mã Kiot: ${product.Code}` : undefined,
    product.ProductId || product.Id ? `ID Kiot: ${product.ProductId || product.Id}` : undefined
  ].filter(Boolean);
  return parts.length ? parts.join(" | ") : null;
}

async function mergeOldKiotDuplicate(sourceSku: string, targetProductId: string): Promise<number> {
  const source = await prisma.product.findUnique({
    where: { sku: sourceSku },
    include: { inventoryMovement: true }
  });
  if (!source || source.id === targetProductId) return 0;

  await prisma.$transaction(async (tx) => {
    await tx.productAlias.deleteMany({ where: { productId: source.id } });
    await tx.productVariant.deleteMany({ where: { productId: source.id } });
    await tx.orderItem.updateMany({ where: { productId: source.id }, data: { productId: targetProductId } });
    await tx.packagingBatch.updateMany({ where: { rawProductId: source.id }, data: { rawProductId: targetProductId } });
    await tx.packagingBatch.updateMany({ where: { bagProductId: source.id }, data: { bagProductId: targetProductId } });
    await tx.packagingBatch.updateMany({ where: { finishedProductId: source.id }, data: { finishedProductId: targetProductId } });
    for (const movement of source.inventoryMovement) {
      if (movement.type === "manual_adjustment" && movement.note?.startsWith(`Sync tồn Kiot ${sourceSku}:`)) {
        await tx.inventoryMovement.delete({ where: { id: movement.id } });
      } else {
        await tx.inventoryMovement.update({ where: { id: movement.id }, data: { productId: targetProductId } });
      }
    }
    await tx.product.delete({ where: { id: source.id } });
  });
  return 1;
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

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
