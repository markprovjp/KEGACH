import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const products = await prisma.product.findMany({
    include: { aliases: true },
    orderBy: { name: "asc" }
  });
  return NextResponse.json(products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    unit: product.unit,
    defaultPrice: product.defaultPrice,
    packageRule: product.packageRule,
    imageUrl: product.imageUrl,
    weightPerUnitKg: product.weightPerUnitKg,
    aliases: product.aliases.map((alias) => ({ value: alias.value }))
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
      packageRule: body.packageRule || null,
      imageUrl: body.imageUrl || null,
      weightPerUnitKg: Number(body.weightPerUnitKg ?? 0),
      aliases: {
        deleteMany: {},
        create: (body.aliases ?? []).map((alias: { value: string }) => ({ value: alias.value }))
      }
    },
    create: {
      sku,
      name: body.name,
      unit: body.unit,
      defaultPrice: Number(body.defaultPrice ?? 0),
      packageRule: body.packageRule || null,
      imageUrl: body.imageUrl || null,
      weightPerUnitKg: Number(body.weightPerUnitKg ?? 0),
      aliases: {
        create: (body.aliases ?? []).map((alias: { value: string }) => ({ value: alias.value }))
      }
    },
    include: { aliases: true }
  });

  return NextResponse.json({
    id: product.id,
    sku: product.sku,
    name: product.name,
    unit: product.unit,
    defaultPrice: product.defaultPrice,
    packageRule: product.packageRule,
    imageUrl: product.imageUrl,
    weightPerUnitKg: product.weightPerUnitKg,
    aliases: product.aliases.map((alias) => ({ value: alias.value }))
  });
}

function slugify(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
