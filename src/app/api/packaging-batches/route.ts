import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculatePackagingReconciliation } from "@/features/inventory/inventory-ledger";
import { getPackagingRuleByFinishedSku, isPackagingTripletAllowed, packagingRules } from "@/features/inventory/packaging-rules";

export async function GET() {
  const batches = await prisma.packagingBatch.findMany({
    include: {
      rawProduct: true,
      bagProduct: true,
      finishedProduct: true
    },
    orderBy: { createdAt: "desc" }
  });

  const reconciliation = calculatePackagingReconciliation(batches.map((batch) => ({
    rawKg: batch.rawKg,
    bagKg: batch.bagKg,
    finishedKg: batch.finishedKg
  })));
  const relatedSkus = Array.from(new Set(packagingRules.flatMap((rule) => [rule.finishedSku, rule.rawSku, rule.bagSku])));
  const relatedProducts = await prisma.product.findMany({
    where: { sku: { in: relatedSkus } },
    include: { inventoryMovement: true }
  });
  const productBySku = new Map(relatedProducts.map((product) => [product.sku, product]));
  const batchesByFinishedId = groupBatchesByFinishedProductId(batches);

  return NextResponse.json({
    reconciliation,
    materialRows: packagingRules.map((rule) => {
      const rawProduct = productBySku.get(rule.rawSku);
      const bagProduct = productBySku.get(rule.bagSku);
      const finishedProduct = productBySku.get(rule.finishedSku);
      const productBatches = finishedProduct ? batchesByFinishedId.get(finishedProduct.id) ?? [] : [];
      const itemReconciliation = calculatePackagingReconciliation(productBatches.map((batch) => ({
        rawKg: batch.rawKg,
        bagKg: batch.bagKg,
        finishedKg: batch.finishedKg
      })));
      return {
        key: rule.finishedSku,
        label: rule.label,
        packageKg: rule.packageKg,
        rawProduct: rawProduct?.name ?? rule.rawSku,
        bagProduct: bagProduct?.name ?? rule.bagSku,
        finishedProduct: finishedProduct?.name ?? rule.finishedSku,
        rawReceivedKg: rawProduct ? calculateReceivedKg(rawProduct.inventoryMovement) : 0,
        bagReceivedKg: bagProduct ? calculateReceivedKg(bagProduct.inventoryMovement) : 0,
        rawRemainingKg: rawProduct ? calculateOnHand(rawProduct.inventoryMovement) : 0,
        bagRemainingKg: bagProduct ? calculateOnHand(bagProduct.inventoryMovement) : 0,
        finishedRemainingKg: finishedProduct ? calculateOnHand(finishedProduct.inventoryMovement) : 0,
        finishedRemainingPackageCount: finishedProduct ? roundKg(calculateOnHand(finishedProduct.inventoryMovement) / rule.packageKg) : 0,
        ...itemReconciliation
      };
    }),
    batches: batches.map((batch) => ({
      id: batch.id,
      code: batch.code,
      rawProductId: batch.rawProductId,
      rawProduct: batch.rawProduct.name,
      bagProductId: batch.bagProductId,
      bagProduct: batch.bagProduct.name,
      finishedProductId: batch.finishedProductId,
      finishedProduct: batch.finishedProduct.name,
      rawKg: batch.rawKg,
      bagKg: batch.bagKg,
      finishedKg: batch.finishedKg,
      varianceKg: batch.bagKg - (batch.finishedKg - batch.rawKg),
      note: batch.note ?? "",
      createdAt: batch.createdAt.toISOString()
    }))
  });
}

function groupBatchesByFinishedProductId(batches: Awaited<ReturnType<typeof prisma.packagingBatch.findMany>>) {
  return batches.reduce((map, batch) => {
    const rows = map.get(batch.finishedProductId) ?? [];
    rows.push(batch);
    map.set(batch.finishedProductId, rows);
    return map;
  }, new Map<string, typeof batches>());
}

function calculateReceivedKg(movements: Array<{ type: string; quantity: number }>): number {
  return roundKg(movements.reduce((total, movement) => {
    if (movement.type === "purchase_in" || movement.type === "return_in") return total + movement.quantity;
    return total;
  }, 0));
}

function calculateOnHand(movements: Array<{ type: string; quantity: number }>): number {
  return roundKg(movements.reduce((stock, movement) => {
    if (["purchase_in", "return_in", "manual_adjustment", "package_produce"].includes(movement.type)) return stock + movement.quantity;
    if (["ship", "damage_out", "package_consume"].includes(movement.type)) return stock - movement.quantity;
    return stock;
  }, 0));
}

function roundKg(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export async function POST(request: Request) {
  const body = await request.json();
  const bagKg = Number(body.bagKg ?? 0);
  if (!body.rawProductId || !body.bagProductId || !body.finishedProductId) {
    return NextResponse.json({ error: "Thiếu sản phẩm hàng rời, túi bóng hoặc thành phẩm" }, { status: 422 });
  }
  const selectedProducts = await prisma.product.findMany({
    where: { id: { in: [body.rawProductId, body.bagProductId, body.finishedProductId] } },
    select: { id: true, sku: true }
  });
  const selectedById = new Map(selectedProducts.map((product) => [product.id, product]));
  const finishedSku = selectedById.get(body.finishedProductId)?.sku;
  const rawSku = selectedById.get(body.rawProductId)?.sku;
  const bagSku = selectedById.get(body.bagProductId)?.sku;
  const rule = getPackagingRuleByFinishedSku(finishedSku);
  if (!isPackagingTripletAllowed({ finishedSku, rawSku, bagSku })) {
    return NextResponse.json({ error: "Hàng rời và túi bóng phải đúng loại thành phẩm ke/nêm được phép đóng gói" }, { status: 422 });
  }
  const rawInputMode = body.rawInputMode === "kg" ? "kg" : "package";
  const rawQuantity = Number(body.rawQuantity ?? 0);
  const rawPackageCount = Number(body.rawPackageCount ?? 0);
  const rawKgInput = Number(body.rawKg ?? 0);
  const packageKg = rule?.packageKg ?? 30;
  const rawKg = rawKgInput > 0 ? rawKgInput : rawInputMode === "kg" ? rawQuantity : (rawQuantity || rawPackageCount) * packageKg;
  const finishedKgInput = Number(body.finishedKg ?? 0);
  const finishedKg = finishedKgInput > 0 ? finishedKgInput : rawKg + bagKg;
  if (rawKg <= 0 || bagKg <= 0 || finishedKg <= 0) {
    return NextResponse.json({ error: "Khối lượng hàng rời, túi bóng và thành phẩm phải lớn hơn 0" }, { status: 422 });
  }
  if (finishedKg < rawKg) {
    return NextResponse.json({ error: "Thành phẩm không được nhỏ hơn lượng hàng rời đã dùng" }, { status: 422 });
  }

  const [rawOnHand, bagOnHand] = await Promise.all([getOnHand(body.rawProductId), getOnHand(body.bagProductId)]);
  if (rawOnHand < rawKg) {
    return NextResponse.json({ error: `Hàng rời không đủ tồn. Hiện còn ${rawOnHand} kg` }, { status: 422 });
  }
  if (bagOnHand < bagKg) {
    return NextResponse.json({ error: `Túi bóng không đủ tồn. Hiện còn ${bagOnHand} kg` }, { status: 422 });
  }

  const count = await prisma.packagingBatch.count();
  const code = `DG${String(count + 1).padStart(5, "0")}`;
  await prisma.packagingBatch.create({
    data: {
      code,
      rawProductId: body.rawProductId,
      bagProductId: body.bagProductId,
      finishedProductId: body.finishedProductId,
      rawKg,
      bagKg,
      finishedKg,
      note: body.note || null,
      movements: {
        create: [
          { productId: body.rawProductId, type: "package_consume", quantity: rawKg, note: `Đóng gói ${code}: xuất hàng rời` },
          { productId: body.bagProductId, type: "package_consume", quantity: bagKg, note: `Đóng gói ${code}: xuất túi bóng` },
          { productId: body.finishedProductId, type: "package_produce", quantity: finishedKg, note: `Đóng gói ${code}: nhập thành phẩm` }
        ]
      }
    }
  });

  return GET();
}

async function getOnHand(productId: string): Promise<number> {
  const movements = await prisma.inventoryMovement.findMany({ where: { productId } });
  return movements.reduce((stock, movement) => {
    if (["purchase_in", "return_in", "manual_adjustment", "package_produce"].includes(movement.type)) return stock + movement.quantity;
    if (["ship", "damage_out", "package_consume"].includes(movement.type)) return stock - movement.quantity;
    return stock;
  }, 0);
}
