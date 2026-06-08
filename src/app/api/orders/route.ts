import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/features/orders/order-status";
import { getWorkflowDataMissing, getWorkflowMissing, getWorkflowNextAction, normalizeWorkflowChecks } from "@/features/orders/order-workflow";
import { allocateOrderStock, hasAnyFulfillableLine, hasAnyShortageLine } from "@/features/orders/stock-allocation";

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
    const fulfillment = fulfillmentFromOrderItems(order.items);
    const warnings = [
      ...(order.paymentKind === "debt" ? ["Công nợ"] : []),
      ...shortages.map((shortage) => `Chờ hàng: ${shortage.productName} thiếu ${shortage.shortage.toLocaleString("vi-VN")} ${shortage.unit}`)
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
      productSummary: order.items.map(formatOrderItemSummary).join(", ") || "Chưa có hàng",
      fulfillment,
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
  const lines: OrderLinePayload[] = (body.lines ?? []).filter((line: { productId?: string }) => line.productId).map((line: { productId: string; quantity: number; unitPrice: number; enteredQuantity?: number; enteredUnit?: string; conversionNote?: string }) => ({
    productId: line.productId,
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    enteredQuantity: line.enteredQuantity == null ? null : Number(line.enteredQuantity),
    enteredUnit: line.enteredUnit || null,
    conversionNote: line.conversionNote || null
  }));
  const allocations = await getStockAllocationsForLines(lines);
  const hasShortage = hasAnyShortageLine(allocations);
  const hasFulfillable = hasAnyFulfillableLine(allocations);
  const linesWithStock = lines.map((line, index) => ({
    ...line,
    fulfillableQuantity: allocations[index]?.fulfillableQuantity ?? 0,
    shortageQuantity: allocations[index]?.shortageQuantity ?? 0
  }));
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
  const status: OrderStatus = hasShortage && !hasFulfillable ? "awaiting_stock" : isOfficial && body.kiotInvoiceCode ? "kiot_linked" : "draft";
  const shortageNote = hasShortage
    ? `Hàng chờ nhập cho khách: ${allocations.filter((item) => item.shortageQuantity > 0).map((item) => `${item.productName ?? item.productId} thiếu ${item.shortageQuantity.toLocaleString("vi-VN")} ${item.unit ?? ""}`).join("; ")}`
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
        create: linesWithStock
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

type FulfillmentLine = {
  productId: string;
  productName: string;
  unit: string;
  requested: number;
  fulfillable: number;
  waiting: number;
};

type OrderLinePayload = {
  productId: string;
  quantity: number;
  unitPrice: number;
  enteredQuantity: number | null;
  enteredUnit: string | null;
  conversionNote: string | null;
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
  fulfillableQuantity?: number | null;
  shortageQuantity?: number | null;
  product: ProductWithMovements;
};

async function getStockAllocationsForLines(lines: Array<{ productId: string; quantity: number }>) {
  const requested = new Map<string, number>();
  for (const line of lines) requested.set(line.productId, (requested.get(line.productId) ?? 0) + Number(line.quantity ?? 0));
  if (!requested.size) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: Array.from(requested.keys()) } },
    include: { inventoryMovement: true }
  });
  const productById = new Map(products.map((product) => [product.id, product]));
  const availableByProductId = new Map(products.map((product) => [product.id, getAvailable(product.inventoryMovement)]));
  return allocateOrderStock(lines.map((line) => {
    const product = productById.get(line.productId);
    return {
      productId: line.productId,
      productName: product?.name ?? line.productId,
      unit: product?.unit ?? "",
      quantity: Number(line.quantity ?? 0)
    };
  }), availableByProductId);
}

function fulfillmentFromOrderItems(items: OrderItemWithStock[]): FulfillmentLine[] {
  return items.map((item) => {
    const fallbackAvailable = getAvailable(item.product.inventoryMovement);
    const storedFulfillable = item.fulfillableQuantity ?? 0;
    const storedWaiting = item.shortageQuantity ?? 0;
    const useFallback = item.quantity > 0 && storedFulfillable === 0 && storedWaiting === 0;
    const fulfillable = useFallback ? Math.min(item.quantity, fallbackAvailable) : storedFulfillable;
    const waiting = useFallback ? Math.max(0, item.quantity - fulfillable) : storedWaiting;
    return {
      productId: item.productId,
      productName: item.product.name,
      unit: item.product.unit,
      requested: item.quantity,
      fulfillable,
      waiting
    };
  });
}

function formatOrderItemSummary(item: OrderItemWithStock): string {
  const fallbackAvailable = getAvailable(item.product.inventoryMovement);
  const storedFulfillable = item.fulfillableQuantity ?? 0;
  const storedWaiting = item.shortageQuantity ?? 0;
  const useFallback = item.quantity > 0 && storedFulfillable === 0 && storedWaiting === 0;
  const fulfillable = useFallback ? Math.min(item.quantity, fallbackAvailable) : storedFulfillable;
  const waiting = useFallback ? Math.max(0, item.quantity - fulfillable) : storedWaiting;
  const splitNote = waiting > 0
    ? ` - gửi trước ${fulfillable.toLocaleString("vi-VN")} ${item.product.unit}, chờ ${waiting.toLocaleString("vi-VN")} ${item.product.unit}`
    : "";
  return `${item.product.name} x ${item.quantity.toLocaleString("vi-VN")} ${item.product.unit}${splitNote}${item.conversionNote ? ` (${item.conversionNote})` : ""}`;
}

function shortagesFromOrderItems(items: OrderItemWithStock[]): ShortageLine[] {
  return fulfillmentFromOrderItems(items)
    .map((item) => {
      return {
        productId: item.productId,
        productName: item.productName,
        unit: item.unit,
        requested: item.requested,
        available: item.fulfillable,
        shortage: item.waiting
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
