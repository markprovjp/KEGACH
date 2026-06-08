import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/features/orders/order-status";
import { canMoveToStatus, getWorkflowMissing, getWorkflowNextAction, normalizeWorkflowChecks } from "@/features/orders/order-workflow";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const existing = await prisma.order.findUnique({ where: { id }, include: { shipments: true, items: { include: { product: { include: { inventoryMovement: true } } } } } });
  if (!existing) return NextResponse.json({ error: "Không tìm thấy đơn" }, { status: 404 });

  const kiotInvoiceCode = body.kiotInvoiceCode?.trim() || null;
  if (kiotInvoiceCode && kiotInvoiceCode !== existing.kiotInvoiceCode) {
    const duplicate = await prisma.order.findUnique({ where: { kiotInvoiceCode } });
    if (duplicate) return NextResponse.json({ error: "Hóa đơn Kiot đã tồn tại" }, { status: 409 });
  }

  const nextStatus = (body.status || existing.status) as OrderStatus;
  const workflowChecks = normalizeWorkflowChecks(body.workflowChecks ?? existing.workflowChecks);
  const nextWorkflow = {
    status: nextStatus,
    orderType: body.orderType || existing.orderType,
    isOfficial: Boolean(body.isOfficial ?? existing.isOfficial),
    kiotInvoiceCode,
    customerName: body.customerName || body.customer || existing.customerName,
    customerPhone: body.customerPhone || body.phone || null,
    customerAddress: body.customerAddress || null,
    receiverName: body.receiverName || existing.receiverName,
    receiverPhone: body.receiverPhone || existing.receiverPhone,
    receiverAddress: body.receiverAddress || existing.receiverAddress,
    codAmount: Number(body.codAmount ?? 0),
    paymentStatus: body.paymentStatus || existing.paymentStatus,
    carrierName: body.carrierName ? String(body.carrierName) : null,
    deliveryMode: body.deliveryMode || existing.shipments[0]?.deliveryMode,
    packageCount: Number(body.packageCount ?? 0),
    estimatedWeightKg: Number(body.estimatedWeightKg ?? 0),
    workflowChecks
  };
  const move = canMoveToStatus(nextWorkflow, nextStatus);
  if (!move.ok) return NextResponse.json({ error: "Chưa đủ checklist để chuyển trạng thái", missing: move.missing }, { status: 422 });
  const fulfillment = fulfillmentFromOrderItems(existing.items);
  const shortages = fulfillment.filter((item) => item.waiting > 0);
  const hasFulfillable = fulfillment.some((item) => item.fulfillable > 0);
  if (["reserved", "packing", "packed", "waiting_vehicle", "scheduled", "shipped", "delivered"].includes(nextStatus) && !hasFulfillable) {
    return NextResponse.json({
      error: "Đơn này chưa có dòng hàng nào đủ tồn để gửi trước",
      missing: shortages.map((item) => `${item.productName} thiếu ${item.waiting.toLocaleString("vi-VN")} ${item.unit}`)
    }, { status: 422 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      kiotInvoiceCode,
      orderType: body.orderType || existing.orderType,
      isOfficial: Boolean(body.isOfficial ?? existing.isOfficial),
      customerName: body.customerName || body.customer || existing.customerName,
      customerPhone: body.customerPhone || body.phone || null,
      customerAddress: body.customerAddress || null,
      receiverName: body.receiverName === undefined ? existing.receiverName : body.receiverName || null,
      receiverPhone: body.receiverPhone === undefined ? existing.receiverPhone : body.receiverPhone || null,
      receiverAddress: body.receiverAddress === undefined ? existing.receiverAddress : body.receiverAddress || null,
      province: body.province || null,
      codAmount: Number(body.codAmount ?? 0),
      paymentKind: body.paymentKind || existing.paymentKind,
      paymentStatus: body.paymentStatus || existing.paymentStatus,
      status: nextStatus,
      note: body.note || null,
      workflowChecks,
      shipments: {
        upsert: {
          where: { id: existing.shipments[0]?.id ?? "__missing__" },
          update: shipmentPayload(body),
          create: shipmentPayload(body)
        }
      }
    },
    include: { items: { include: { product: { include: { inventoryMovement: true } } } }, shipments: true }
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
  customerAddress: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverAddress: string | null;
  codAmount: number;
  province: string | null;
  promisedSendAt: Date | null;
  orderType: string;
  isOfficial: boolean;
  paymentKind: string;
  paymentStatus: string;
  status: OrderStatus;
  note: string | null;
  workflowChecks: unknown;
  items: Array<{ productId: string; quantity: number; unitPrice: number; enteredQuantity?: number | null; enteredUnit?: string | null; conversionNote?: string | null; fulfillableQuantity?: number | null; shortageQuantity?: number | null; product: { name: string; unit: string; inventoryMovement: Array<{ type: string; quantity: number }> } }>;
  shipments: Array<{ carrierName: string | null; driverName: string | null; deliveryMode: string; freightPayer: string; packageCount: number; estimatedWeightKg: number }>;
};

function toOrderRow(order: OrderWithRelations) {
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

function fulfillmentFromOrderItems(items: OrderWithRelations["items"]): FulfillmentLine[] {
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

function formatOrderItemSummary(item: OrderWithRelations["items"][number]): string {
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

function shortagesFromOrderItems(items: OrderWithRelations["items"]): ShortageLine[] {
  return fulfillmentFromOrderItems(items)
    .map((item) => ({
      productId: item.productId,
      productName: item.productName,
      unit: item.unit,
      requested: item.requested,
      available: item.fulfillable,
      shortage: item.waiting
    }))
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
