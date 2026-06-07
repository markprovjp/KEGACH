import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/features/orders/order-status";
import { getWorkflowDataMissing, getWorkflowMissing, getWorkflowNextAction, normalizeWorkflowChecks } from "@/features/orders/order-workflow";

export async function GET() {
  const orders = await prisma.order.findMany({
    include: {
      items: { include: { product: { include: { inventoryMovement: true } } } },
      shipments: true
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(orders.map((order) => {
    const shortages = shortagesFromOrderItems(order.items);
    const warnings = [
      ...(order.paymentKind === "debt" ? ["Công nợ"] : []),
      ...shortages.map((shortage) => `Thiếu hàng: ${shortage.productName} thiếu ${shortage.shortage.toLocaleString("vi-VN")} ${shortage.unit}`)
    ];
    return {
      id: order.id,
      code: order.code,
      createdAt: order.createdAt.toISOString(),
      kiotInvoiceCode: order.kiotInvoiceCode ?? "Chưa gắn Kiot",
      customer: order.customerName,
      phone: order.customerPhone ?? "-",
      customerAddress: order.customerAddress ?? undefined,
      receiverName: order.receiverName ?? undefined,
      receiverPhone: order.receiverPhone ?? undefined,
      receiverAddress: order.receiverAddress ?? undefined,
      productSummary: order.items.map((item) => `${item.product.name} x ${item.quantity.toLocaleString("vi-VN")} ${item.product.unit}${item.conversionNote ? ` (${item.conversionNote})` : ""}`).join(", ") || "Chưa có hàng",
      total: order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
      codAmount: order.codAmount,
      province: order.province ?? "-",
      sendDate: order.promisedSendAt?.toISOString().slice(0, 10) ?? "Chưa hẹn",
      driver: order.shipments[0]?.carrierName ?? order.shipments[0]?.driverName ?? undefined,
      carrierName: order.shipments[0]?.carrierName ?? undefined,
      driverName: order.shipments[0]?.driverName ?? undefined,
      warnings,
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
        receiverName: order.receiverName,
        receiverPhone: order.receiverPhone,
        receiverAddress: order.receiverAddress,
        codAmount: order.codAmount,
        paymentStatus: order.paymentStatus,
        carrierName: order.shipments[0]?.carrierName,
        deliveryMode: order.shipments[0]?.deliveryMode,
        packageCount: order.shipments[0]?.packageCount,
        estimatedWeightKg: order.shipments[0]?.estimatedWeightKg,
        workflowChecks: order.workflowChecks
      }),
      nextAction: getWorkflowNextAction({
        status: order.status,
        orderType: order.orderType,
        isOfficial: order.isOfficial,
        kiotInvoiceCode: order.kiotInvoiceCode,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        receiverName: order.receiverName,
        receiverPhone: order.receiverPhone,
        receiverAddress: order.receiverAddress,
        codAmount: order.codAmount,
        paymentStatus: order.paymentStatus,
        carrierName: order.shipments[0]?.carrierName,
        deliveryMode: order.shipments[0]?.deliveryMode,
        packageCount: order.shipments[0]?.packageCount,
        estimatedWeightKg: order.shipments[0]?.estimatedWeightKg,
        workflowChecks: order.workflowChecks
      })
    };
  }));
}

export async function POST(request: Request) {
  const body = await request.json();
  const existing = body.kiotInvoiceCode ? await prisma.order.findUnique({ where: { kiotInvoiceCode: body.kiotInvoiceCode } }) : null;
  if (existing) return NextResponse.json({ error: "Hóa đơn Kiot đã tồn tại" }, { status: 409 });

  const customer = await resolveCustomer(body);
  const isOfficial = Boolean(body.isOfficial);
  const workflowChecks = normalizeWorkflowChecks(body.workflowChecks);
  const lines = (body.lines ?? []).filter((line: { productId?: string }) => line.productId).map((line: { productId: string; quantity: number; unitPrice: number; enteredQuantity?: number; enteredUnit?: string; conversionNote?: string }) => ({
    productId: line.productId,
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    enteredQuantity: line.enteredQuantity == null ? null : Number(line.enteredQuantity),
    enteredUnit: line.enteredUnit || null,
    conversionNote: line.conversionNote || null
  }));
  const shortages = await getShortagesForLines(lines);
  const shipmentInput = {
    deliveryMode: body.deliveryMode || "truck_share",
    freightPayer: body.freightPayer || "customer",
    packageCount: Number(body.packageCount ?? 0),
    estimatedWeightKg: Number(body.estimatedWeightKg ?? 0),
    carrierName: body.carrierName || null,
    driverName: body.driverName || null
  };
  const hardMissing = getWorkflowDataMissing({
    status: isOfficial && body.kiotInvoiceCode ? "kiot_linked" : "draft",
    orderType: body.orderType,
    isOfficial,
    kiotInvoiceCode: body.kiotInvoiceCode,
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    customerAddress: body.customerAddress,
    receiverName: body.receiverName,
    receiverPhone: body.receiverPhone,
    receiverAddress: body.receiverAddress,
    codAmount: Number(body.codAmount ?? 0),
    paymentStatus: body.paymentStatus,
    ...shipmentInput,
    workflowChecks
  });
  if (isOfficial && hardMissing.length > 0) {
    return NextResponse.json({ error: "Đơn chính thức thiếu thông tin bắt buộc", missing: hardMissing }, { status: 422 });
  }
  const code = await nextOrderCode();
  const status: OrderStatus = shortages.length ? "awaiting_stock" : isOfficial && body.kiotInvoiceCode ? "kiot_linked" : "draft";
  const shortageNote = shortages.length
    ? `Thiếu hàng: ${shortages.map((item) => `${item.productName} thiếu ${item.shortage.toLocaleString("vi-VN")} ${item.unit}`).join("; ")}`
    : "";
  const order = await prisma.order.create({
    data: {
      code,
      kiotInvoiceCode: body.kiotInvoiceCode || null,
      sourceChannel: body.sourceChannel || "kiot_print",
      orderType: body.orderType || "online",
      status,
      isOfficial,
      customerId: customer?.id,
      customerName: body.customerName || "Khách lẻ",
      customerPhone: body.customerPhone || null,
      customerAddress: body.customerAddress || null,
      receiverName: body.receiverName || null,
      receiverPhone: body.receiverPhone || null,
      receiverAddress: body.receiverAddress || null,
      province: body.province || null,
      codAmount: Number(body.codAmount ?? 0),
      paymentKind: body.paymentKind || "debt",
      paymentStatus: body.paymentStatus || "unpaid",
      note: [body.note, shortageNote].filter(Boolean).join("\n") || null,
      rawChat: body.rawText || null,
      workflowChecks,
      items: {
        create: lines
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

type ShortageLine = {
  productId: string;
  productName: string;
  unit: string;
  requested: number;
  available: number;
  shortage: number;
};

type ProductWithMovements = {
  id: string;
  name: string;
  unit: string;
  inventoryMovement: Array<{ type: string; quantity: number }>;
};

type OrderItemWithStock = {
  productId: string;
  quantity: number;
  enteredQuantity?: number | null;
  enteredUnit?: string | null;
  conversionNote?: string | null;
  product: ProductWithMovements;
};

async function getShortagesForLines(lines: Array<{ productId: string; quantity: number }>): Promise<ShortageLine[]> {
  const requested = new Map<string, number>();
  for (const line of lines) requested.set(line.productId, (requested.get(line.productId) ?? 0) + Number(line.quantity ?? 0));
  if (!requested.size) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: Array.from(requested.keys()) } },
    include: { inventoryMovement: true }
  });
  return products
    .map((product) => {
      const quantity = requested.get(product.id) ?? 0;
      const available = getAvailable(product.inventoryMovement);
      return {
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        requested: quantity,
        available,
        shortage: Math.max(0, quantity - available)
      };
    })
    .filter((item) => item.shortage > 0);
}

function shortagesFromOrderItems(items: OrderItemWithStock[]): ShortageLine[] {
  return items
    .map((item) => {
      const available = getAvailable(item.product.inventoryMovement);
      return {
        productId: item.productId,
        productName: item.product.name,
        unit: item.product.unit,
        requested: item.quantity,
        available,
        shortage: Math.max(0, item.quantity - available)
      };
    })
    .filter((item) => item.shortage > 0);
}

function getAvailable(movements: Array<{ type: string; quantity: number }>): number {
  const stock = movements.reduce((snapshot, movement) => {
    if (["purchase_in", "return_in", "manual_adjustment", "package_produce"].includes(movement.type)) snapshot.onHand += movement.quantity;
    if (movement.type === "reserve") snapshot.reserved += movement.quantity;
    if (movement.type === "release_reservation") snapshot.reserved -= movement.quantity;
    if (movement.type === "ship") {
      snapshot.onHand -= movement.quantity;
      snapshot.reserved -= movement.quantity;
    }
    if (["damage_out", "package_consume"].includes(movement.type)) snapshot.onHand -= movement.quantity;
    return snapshot;
  }, { onHand: 0, reserved: 0 });
  return stock.onHand - stock.reserved;
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

async function nextOrderCode(): Promise<string> {
  const latest = await prisma.order.findFirst({
    where: { code: { startsWith: "KG" } },
    orderBy: { code: "desc" },
    select: { code: true }
  });
  const lastNumber = Number(latest?.code.replace(/^KG/, "") ?? "0");
  return `KG${String((Number.isFinite(lastNumber) ? lastNumber : 0) + 1).padStart(5, "0")}`;
}
