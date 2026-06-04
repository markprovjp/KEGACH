import { calculateStock, createMovement } from "@/features/inventory/inventory-ledger";
import type { InventoryMovementInput } from "@/features/inventory/inventory-types";
import { assertTransitionAllowed, type OrderStatus } from "./order-status";

export type OrderLineInput = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type OperationsOrder = {
  id: string;
  code: string;
  kiotInvoiceCode?: string;
  customerName: string;
  sourceChannel: string;
  status: OrderStatus;
  lines: OrderLineInput[];
  codAmount: number;
  note?: string;
};

export type OperationsState = {
  orders: OperationsOrder[];
  inventory: Record<string, InventoryMovementInput[]>;
};

export type CreateOrderInput = Omit<OperationsOrder, "id" | "code" | "status"> & {
  kiotInvoiceCode?: string;
};

export function createOperationsState(seed?: Partial<OperationsState>): OperationsState {
  return {
    orders: seed?.orders ?? [],
    inventory: seed?.inventory ?? {}
  };
}

export function createOperationsOrder(state: OperationsState, input: CreateOrderInput): OperationsOrder {
  if (input.kiotInvoiceCode) assertUniqueKiotCode(state, input.kiotInvoiceCode);

  const order: OperationsOrder = {
    ...input,
    id: `ord_${state.orders.length + 1}`,
    code: `KG${String(state.orders.length + 1).padStart(5, "0")}`,
    status: input.kiotInvoiceCode ? "kiot_linked" : "awaiting_kiot"
  };
  state.orders.push(order);
  return order;
}

export function linkKiotInvoice(state: OperationsState, orderId: string, kiotInvoiceCode: string): OperationsOrder {
  assertUniqueKiotCode(state, kiotInvoiceCode);
  const order = findOrder(state, orderId);
  moveOrder(order, "kiot_linked");
  order.kiotInvoiceCode = kiotInvoiceCode;
  return order;
}

export function confirmAndReserveOrder(state: OperationsState, orderId: string): OperationsOrder {
  const order = findOrder(state, orderId);
  moveOrder(order, "reserved");

  for (const line of order.lines) {
    const stock = calculateStock(state.inventory[line.productId] ?? []);
    if (stock.available < line.quantity) {
      throw new Error(`Not enough available stock for ${line.productId}`);
    }
  }

  for (const line of order.lines) {
    appendMovement(state, line.productId, createMovement("reserve", line.quantity));
  }
  return order;
}

export function cancelOrderBeforeShipment(state: OperationsState, orderId: string, reason: string): OperationsOrder {
  const order = findOrder(state, orderId);
  const previousStatus = order.status;
  moveOrder(order, "cancelled", reason);

  if (["reserved", "packing", "packed", "waiting_vehicle"].includes(previousStatus)) {
    for (const line of order.lines) {
      appendMovement(state, line.productId, createMovement("release_reservation", line.quantity));
    }
  }
  return order;
}

export function shipOrder(state: OperationsState, orderId: string): OperationsOrder {
  const order = findOrder(state, orderId);
  if (order.status !== "scheduled") {
    moveOrder(order, "packing");
    moveOrder(order, "packed");
    moveOrder(order, "waiting_vehicle");
    moveOrder(order, "scheduled");
  }
  moveOrder(order, "shipped");

  for (const line of order.lines) {
    appendMovement(state, line.productId, createMovement("ship", line.quantity));
  }
  return order;
}

export function returnShippedOrder(state: OperationsState, orderId: string, reason: string): OperationsOrder {
  const order = findOrder(state, orderId);
  moveOrder(order, "returned", reason);

  for (const line of order.lines) {
    appendMovement(state, line.productId, createMovement("return_in", line.quantity));
  }
  return order;
}

function findOrder(state: OperationsState, orderId: string): OperationsOrder {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) throw new Error(`Order not found: ${orderId}`);
  return order;
}

function moveOrder(order: OperationsOrder, to: OrderStatus, reason?: string): void {
  assertTransitionAllowed(order.status, to, reason);
  order.status = to;
}

function appendMovement(state: OperationsState, productId: string, movement: InventoryMovementInput): void {
  state.inventory[productId] = [...(state.inventory[productId] ?? []), movement];
}

function assertUniqueKiotCode(state: OperationsState, kiotInvoiceCode: string): void {
  if (state.orders.some((order) => order.kiotInvoiceCode === kiotInvoiceCode)) {
    throw new Error(`Kiot invoice already linked: ${kiotInvoiceCode}`);
  }
}
