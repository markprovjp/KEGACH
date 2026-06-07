import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getWorkflowMissing, normalizeWorkflowChecks } from "@/features/orders/order-workflow";

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
    customerAddress: order.customerAddress ?? undefined,
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
    orderType: order.orderType,
    isOfficial: order.isOfficial,
    paymentKind: order.paymentKind,
    paymentStatus: order.paymentStatus,
    deliveryMode: order.shipments[0]?.deliveryMode,
    freightPayer: order.shipments[0]?.freightPayer,
    packageCount: order.shipments[0]?.packageCount ?? 0,
    estimatedWeightKg: order.shipments[0]?.estimatedWeightKg ?? 0,
    note: order.note ?? undefined,
    workflowChecks: normalizeWorkflowChecks(order.workflowChecks),
    workflowMissing: getWorkflowMissing({
      status: order.status,
      orderType: order.orderType,
      isOfficial: order.isOfficial,
      kiotInvoiceCode: order.kiotInvoiceCode,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      codAmount: order.codAmount,
      paymentStatus: order.paymentStatus,
      carrierName: order.shipments[0]?.carrierName,
      deliveryMode: order.shipments[0]?.deliveryMode,
      packageCount: order.shipments[0]?.packageCount,
      estimatedWeightKg: order.shipments[0]?.estimatedWeightKg,
      workflowChecks: order.workflowChecks
    })
  })));
}

export async function POST(request: Request) {
  const body = await request.json();
  const existing = body.kiotInvoiceCode ? await prisma.order.findUnique({ where: { kiotInvoiceCode: body.kiotInvoiceCode } }) : null;
  if (existing) return NextResponse.json({ error: "Hóa đơn Kiot đã tồn tại" }, { status: 409 });

  const customer = await resolveCustomer(body);
  const isOfficial = Boolean(body.isOfficial || body.kiotInvoiceCode);
  const workflowChecks = normalizeWorkflowChecks(body.workflowChecks);
  const shipmentInput = {
    deliveryMode: body.deliveryMode || "truck_share",
    freightPayer: body.freightPayer || "customer",
    packageCount: Number(body.packageCount ?? 0),
    estimatedWeightKg: Number(body.estimatedWeightKg ?? 0),
    carrierName: body.carrierName || null
  };
  const missing = getWorkflowMissing({
    status: isOfficial && body.kiotInvoiceCode ? "kiot_linked" : "draft",
    orderType: body.orderType,
    isOfficial,
    kiotInvoiceCode: body.kiotInvoiceCode,
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    customerAddress: body.customerAddress,
    codAmount: Number(body.codAmount ?? 0),
    paymentStatus: body.paymentStatus,
    ...shipmentInput,
    workflowChecks
  });
  if (isOfficial && missing.some((item) => item.includes("thiếu") || item.includes("phải có") || item.includes("chưa chọn"))) {
    return NextResponse.json({ error: "Đơn chính thức chưa đủ quy trình", missing }, { status: 422 });
  }
  const count = await prisma.order.count();
  const order = await prisma.order.create({
    data: {
      code: `KG${String(count + 1).padStart(5, "0")}`,
      kiotInvoiceCode: body.kiotInvoiceCode || null,
      sourceChannel: body.sourceChannel || "kiot_print",
      orderType: body.orderType || "online",
      status: isOfficial && body.kiotInvoiceCode ? "kiot_linked" : "draft",
      isOfficial,
      customerId: customer?.id,
      customerName: body.customerName || "Khách lẻ",
      customerPhone: body.customerPhone || null,
      customerAddress: body.customerAddress || null,
      province: body.province || null,
      codAmount: Number(body.codAmount ?? 0),
      paymentKind: body.paymentKind || "debt",
      paymentStatus: body.paymentStatus || "unpaid",
      note: body.note || null,
      rawChat: body.rawText || null,
      workflowChecks,
      items: {
        create: (body.lines ?? []).filter((line: { productId?: string }) => line.productId).map((line: { productId: string; quantity: number; unitPrice: number }) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice)
        }))
      },
      shipments: {
        create: {
          ...shipmentInput
        }
      }
    },
    include: { items: true, shipments: true }
  });

  return NextResponse.json(order);
}

async function resolveCustomer(body: { customerId?: string; customerName?: string; customerPhone?: string; customerAddress?: string; province?: string; note?: string }) {
  if (body.customerId) return prisma.customer.findUnique({ where: { id: body.customerId } });
  const name = body.customerName?.trim();
  if (!name) return null;
  return prisma.customer.create({
    data: {
      name,
      phone: body.customerPhone || null,
      address: body.customerAddress || null,
      province: body.province || null,
      note: body.note || null
    }
  });
}
