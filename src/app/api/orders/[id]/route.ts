import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/features/orders/order-status";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const existing = await prisma.order.findUnique({ where: { id }, include: { shipments: true } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy đơn" }, { status: 404 });

  const kiotInvoiceCode = body.kiotInvoiceCode?.trim() || null;
  if (kiotInvoiceCode && kiotInvoiceCode !== existing.kiotInvoiceCode) {
    const duplicate = await prisma.order.findUnique({ where: { kiotInvoiceCode } });
    if (duplicate) return NextResponse.json({ error: "Hóa đơn Kiot đã tồn tại" }, { status: 409 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      kiotInvoiceCode,
      customerName: body.customerName || body.customer || existing.customerName,
      customerPhone: body.customerPhone || body.phone || null,
      province: body.province || null,
      codAmount: Number(body.codAmount ?? 0),
      paymentKind: body.paymentKind || existing.paymentKind,
      status: (body.status || existing.status) as OrderStatus,
      note: body.note || null,
      shipments: {
        upsert: {
          where: { id: existing.shipments[0]?.id ?? "__missing__" },
          update: shipmentPayload(body),
          create: shipmentPayload(body)
        }
      }
    },
    include: { items: { include: { product: true } }, shipments: true }
  });

  return NextResponse.json(toOrderRow(order));
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn" }, { status: 404 });
  if (["shipped", "delivered"].includes(order.status)) {
    return NextResponse.json({ error: "Đơn đã gửi/giao không được xóa. Hãy chuyển luồng trả hàng hoặc đánh dấu vấn đề." }, { status: 409 });
  }

  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

function shipmentPayload(body: Record<string, unknown>) {
  return {
    deliveryMode: String(body.deliveryMode || "truck_share"),
    freightPayer: String(body.freightPayer || "customer"),
    packageCount: Number(body.packageCount ?? 0),
    estimatedWeightKg: Number(body.estimatedWeightKg ?? 0),
    carrierName: body.carrierName ? String(body.carrierName) : null,
    driverName: body.driverName ? String(body.driverName) : null,
    note: body.shipmentNote ? String(body.shipmentNote) : null
  };
}

type OrderWithRelations = {
  id: string;
  code: string;
  createdAt: Date;
  kiotInvoiceCode: string | null;
  customerName: string;
  customerPhone: string | null;
  codAmount: number;
  province: string | null;
  promisedSendAt: Date | null;
  paymentKind: string;
  status: OrderStatus;
  note: string | null;
  items: Array<{ quantity: number; unitPrice: number; product: { name: string; unit: string } }>;
  shipments: Array<{ carrierName: string | null; driverName: string | null; deliveryMode: string; freightPayer: string; packageCount: number; estimatedWeightKg: number }>;
};

function toOrderRow(order: OrderWithRelations) {
  return {
    id: order.id,
    code: order.code,
    createdAt: order.createdAt.toISOString(),
    kiotInvoiceCode: order.kiotInvoiceCode ?? "Chưa gắn Kiot",
    customer: order.customerName,
    phone: order.customerPhone ?? "-",
    productSummary: order.items.map((item) => `${item.product.name} x ${item.quantity} ${item.product.unit}`).join(", ") || "Chưa có hàng",
    total: order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    codAmount: order.codAmount,
    province: order.province ?? "-",
    sendDate: order.promisedSendAt?.toISOString().slice(0, 10) ?? "Chưa hẹn",
    driver: order.shipments[0]?.carrierName ?? order.shipments[0]?.driverName ?? undefined,
    carrierName: order.shipments[0]?.carrierName ?? undefined,
    driverName: order.shipments[0]?.driverName ?? undefined,
    warnings: order.paymentKind === "debt" ? ["Công nợ"] : [],
    status: order.status,
    paymentKind: order.paymentKind,
    deliveryMode: order.shipments[0]?.deliveryMode,
    freightPayer: order.shipments[0]?.freightPayer,
    packageCount: order.shipments[0]?.packageCount ?? 0,
    estimatedWeightKg: order.shipments[0]?.estimatedWeightKg ?? 0,
    note: order.note ?? undefined
  };
}
