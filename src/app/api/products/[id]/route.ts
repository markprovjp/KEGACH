import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
  if (orderItemCount > 0) {
    return NextResponse.json({ error: "Sản phẩm đã nằm trong đơn hàng, không thể xóa. Hãy ngưng dùng hoặc đổi tên." }, { status: 409 });
  }

  await prisma.productAlias.deleteMany({ where: { productId: id } });
  await prisma.inventoryMovement.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
