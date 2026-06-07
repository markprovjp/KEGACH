import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const products = await prisma.product.findMany({
    include: { inventoryMovement: { orderBy: { createdAt: "desc" } } },
    orderBy: { name: "asc" }
  });

  return NextResponse.json(products.map((product) => {
    const stock = product.inventoryMovement.reduce((snapshot, movement) => {
      if (["purchase_in", "return_in", "manual_adjustment"].includes(movement.type)) snapshot.onHand += movement.quantity;
      if (movement.type === "reserve") snapshot.reserved += movement.quantity;
      if (movement.type === "release_reservation") snapshot.reserved -= movement.quantity;
      if (movement.type === "ship") {
        snapshot.onHand -= movement.quantity;
        snapshot.reserved -= movement.quantity;
      }
      if (movement.type === "damage_out") snapshot.onHand -= movement.quantity;
      if (movement.type === "package_consume") snapshot.onHand -= movement.quantity;
      if (movement.type === "package_produce") snapshot.onHand += movement.quantity;
      return snapshot;
    }, { onHand: 0, reserved: 0 });
    return {
      key: product.id,
      productId: product.id,
      sku: product.sku,
      product: product.name,
      unit: product.unit,
      isActive: product.isActive,
      onHand: stock.onHand,
      reserved: stock.reserved,
      available: stock.onHand - stock.reserved,
      lowStockThreshold: Math.max(5, Math.round(stock.onHand * 0.25)),
      lastMovement: product.inventoryMovement[0]?.note ?? "Chưa có biến động"
    };
  }));
}

export async function POST(request: Request) {
  const body = await request.json();
  await prisma.inventoryMovement.create({
    data: {
      productId: body.productId,
      type: body.type,
      quantity: Number(body.quantity),
      note: body.note || "Điều chỉnh từ màn tồn kho"
    }
  });
  return GET();
}
