import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const orders = await prisma.order.count({ where: { customerId: id } });
  if (orders > 0) {
    return NextResponse.json({ error: "Khách đã có đơn hàng, không thể xóa. Hãy đổi loại khách hoặc ghi chú ngưng dùng." }, { status: 409 });
  }

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
