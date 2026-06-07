import { PrismaClient } from "@prisma/client";
import { carrierSeeds, inventorySeeds, productVariantSeeds, sampleProducts } from "../src/lib/sample-data";

const prisma = new PrismaClient();

async function main() {
  for (const product of sampleProducts) {
    const saved = await prisma.product.upsert({
      where: { sku: product.id },
      update: {
        name: product.name,
        unit: product.unit,
        defaultPrice: product.defaultPrice,
        distributorPrice: product.distributorPrice ?? null,
        packageRule: product.packageRule,
        description: product.description ?? null,
        weightPerUnitKg: product.weightPerUnitKg ?? estimateWeightKg(product.packageRule, product.unit),
        aliases: {
          deleteMany: {},
          create: product.aliases.map((alias) => ({ value: alias.value }))
        },
        variants: {
          deleteMany: {},
          create: productVariantSeeds
            .filter((variant) => variant.productId === product.id)
            .map((variant) => ({ code: variant.code, cartonCount: variant.cartonCount, tubeCount: variant.tubeCount }))
        }
      },
      create: {
        sku: product.id,
        name: product.name,
        unit: product.unit,
        defaultPrice: product.defaultPrice,
        distributorPrice: product.distributorPrice ?? null,
        packageRule: product.packageRule,
        description: product.description ?? null,
        weightPerUnitKg: product.weightPerUnitKg ?? estimateWeightKg(product.packageRule, product.unit),
        aliases: {
          create: product.aliases.map((alias) => ({ value: alias.value }))
        },
        variants: {
          create: productVariantSeeds
            .filter((variant) => variant.productId === product.id)
            .map((variant) => ({ code: variant.code, cartonCount: variant.cartonCount, tubeCount: variant.tubeCount }))
        }
      }
    });

    const seedStock = inventorySeeds.find((item) => item.productId === product.id);
    const movementCount = await prisma.inventoryMovement.count({ where: { productId: saved.id } });
    if (movementCount === 0 && seedStock) {
      await prisma.inventoryMovement.createMany({
        data: [
          { productId: saved.id, type: "purchase_in", quantity: seedStock.onHand, note: "Seed tồn đầu kỳ" },
          ...(seedStock.reserved > 0 ? [{ productId: saved.id, type: "reserve" as const, quantity: seedStock.reserved, note: "Seed hàng đã giữ" }] : [])
        ]
      });
    }
  }

  for (const carrier of carrierSeeds) {
    await prisma.carrier.upsert({
      where: { id: carrier.id },
      update: {
        name: carrier.name,
        phone: carrier.phone,
        route: carrier.route,
        note: carrier.note
      },
      create: {
        id: carrier.id,
        name: carrier.name,
        phone: carrier.phone,
        route: carrier.route,
        note: carrier.note
      }
    });
  }
}

function estimateWeightKg(packageRule: string | undefined, unit: string): number {
  if (!packageRule) return 1;
  const kgMatch = /(\d+(?:[.,]\d+)?)\s*kg/i.exec(packageRule);
  if (kgMatch && unit === "bao") return Number(kgMatch[1].replace(",", "."));
  if (unit === "thùng") return 12;
  if (unit === "can") return 1.7;
  return 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
