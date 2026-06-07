import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const products = await prisma.product.findMany({
    include: { aliases: true, variants: { orderBy: { code: "asc" } } },
    orderBy: { name: "asc" }
  });
  return NextResponse.json(products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    unit: product.unit,
    defaultPrice: product.defaultPrice,
    distributorPrice: product.distributorPrice ?? undefined,
    packageRule: product.packageRule,
    description: product.description ?? undefined,
    imageUrl: product.imageUrl,
    weightPerUnitKg: product.weightPerUnitKg,
    aliases: product.aliases.map((alias) => ({ value: alias.value })),
    variants: product.variants.map((variant) => ({ code: variant.code, cartonCount: variant.cartonCount, tubeCount: variant.tubeCount, note: variant.note ?? undefined }))
  })));
}

export async function POST(request: Request) {
  const body = await request.json();
  const sku = body.sku || body.id || slugify(body.name);
  const product = await prisma.product.upsert({
    where: { sku },
    update: {
      name: body.name,
      unit: body.unit,
      defaultPrice: Number(body.defaultPrice ?? 0),
      distributorPrice: body.distributorPrice == null ? null : Number(body.distributorPrice),
      packageRule: body.packageRule || null,
      description: body.description || null,
      imageUrl: body.imageUrl || null,
      weightPerUnitKg: Number(body.weightPerUnitKg ?? 0),
      aliases: {
        deleteMany: {},
        create: (body.aliases ?? []).map((alias: { value: string }) => ({ value: alias.value }))
      },
      variants: {
        deleteMany: {},
        create: (body.variants ?? []).map((variant: { code: string; cartonCount: number; tubeCount: number; note?: string }) => ({
          code: variant.code,
          cartonCount: Number(variant.cartonCount ?? 0),
          tubeCount: Number(variant.tubeCount ?? 0),
          note: variant.note || null
        }))
      }
    },
    create: {
      sku,
      name: body.name,
      unit: body.unit,
      defaultPrice: Number(body.defaultPrice ?? 0),
      distributorPrice: body.distributorPrice == null ? null : Number(body.distributorPrice),
      packageRule: body.packageRule || null,
      description: body.description || null,
      imageUrl: body.imageUrl || null,
      weightPerUnitKg: Number(body.weightPerUnitKg ?? 0),
      aliases: {
        create: (body.aliases ?? []).map((alias: { value: string }) => ({ value: alias.value }))
      },
      variants: {
        create: (body.variants ?? []).map((variant: { code: string; cartonCount: number; tubeCount: number; note?: string }) => ({
          code: variant.code,
          cartonCount: Number(variant.cartonCount ?? 0),
          tubeCount: Number(variant.tubeCount ?? 0),
          note: variant.note || null
        }))
      }
    },
    include: { aliases: true, variants: { orderBy: { code: "asc" } } }
  });

  return NextResponse.json({
    id: product.id,
    sku: product.sku,
    name: product.name,
    unit: product.unit,
    defaultPrice: product.defaultPrice,
    distributorPrice: product.distributorPrice ?? undefined,
    packageRule: product.packageRule,
    description: product.description ?? undefined,
    imageUrl: product.imageUrl,
    weightPerUnitKg: product.weightPerUnitKg,
    aliases: product.aliases.map((alias) => ({ value: alias.value })),
    variants: product.variants.map((variant) => ({ code: variant.code, cartonCount: variant.cartonCount, tubeCount: variant.tubeCount, note: variant.note ?? undefined }))
  });
}

function slugify(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
