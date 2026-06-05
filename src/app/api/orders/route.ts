import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const existing = body.kiotInvoiceCode ? await prisma.order.findUnique({ where: { kiotInvoiceCode: body.kiotInvoiceCode } }) : null;
  if (existing) return NextResponse.json({ error: "Hóa đơn Kiot đã tồn tại" }, { status: 409 });

  const count = await prisma.order.count();
  const order = await prisma.order.create({
    data: {
      code: `KG${String(count + 1).padStart(5, "0")}`,
      kiotInvoiceCode: body.kiotInvoiceCode || null,
      sourceChannel: body.sourceChannel || "kiot_print",
      status: body.kiotInvoiceCode ? "kiot_linked" : "awaiting_kiot",
      customerName: body.customerName || "Khách lẻ",
      customerPhone: body.customerPhone || null,
      codAmount: Number(body.codAmount ?? 0),
      paymentKind: body.paymentKind || "debt",
      note: body.note || null,
      rawChat: body.rawText || null,
      items: {
        create: (body.lines ?? []).filter((line: { productId?: string }) => line.productId).map((line: { productId: string; quantity: number; unitPrice: number }) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice)
        }))
      },
      shipments: {
        create: {
          deliveryMode: body.deliveryMode || "truck_share",
          freightPayer: body.freightPayer || "customer",
          packageCount: Number(body.packageCount ?? 0),
          estimatedWeightKg: Number(body.estimatedWeightKg ?? 0)
        }
      }
    },
    include: { items: true, shipments: true }
  });

  return NextResponse.json(order);
}
