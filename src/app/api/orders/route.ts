import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const orders = await prisma.order.findMany({
    include: {
      items: { include: { product: true } },
      shipments: true
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(orders.map((order) => ({
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
  })));
}

export async function POST(request: Request) {
  const body = await request.json();
  const existing = body.kiotInvoiceCode ? await prisma.order.findUnique({ where: { kiotInvoiceCode: body.kiotInvoiceCode } }) : null;
  if (existing) return NextResponse.json({ error: "Hóa đơn Kiot đã tồn tại" }, { status: 409 });

  const customer = await resolveCustomer(body);
  const count = await prisma.order.count();
  const order = await prisma.order.create({
    data: {
      code: `KG${String(count + 1).padStart(5, "0")}`,
      kiotInvoiceCode: body.kiotInvoiceCode || null,
      sourceChannel: body.sourceChannel || "kiot_print",
      status: body.kiotInvoiceCode ? "kiot_linked" : "awaiting_kiot",
      customerId: customer?.id,
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

async function resolveCustomer(body: { customerId?: string; customerName?: string; customerPhone?: string; province?: string; note?: string }) {
  if (body.customerId) return prisma.customer.findUnique({ where: { id: body.customerId } });
  const name = body.customerName?.trim();
  if (!name) return null;
  return prisma.customer.create({
    data: {
      name,
      phone: body.customerPhone || null,
      province: body.province || null,
      note: body.note || null
    }
  });
}
