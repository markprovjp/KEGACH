export const orderStatuses = [
  "draft",
  "awaiting_kiot",
  "kiot_linked",
  "reserved",
  "packing",
  "packed",
  "waiting_vehicle",
  "scheduled",
  "shipped",
  "delivered",
  "problem",
  "cancelled",
  "returned"
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

const normalFlow: Record<OrderStatus, OrderStatus[]> = {
  draft: ["awaiting_kiot", "kiot_linked", "cancelled"],
  awaiting_kiot: ["kiot_linked", "cancelled", "problem"],
  kiot_linked: ["reserved", "cancelled", "problem"],
  reserved: ["packing", "cancelled", "problem"],
  packing: ["packed", "reserved", "problem"],
  packed: ["waiting_vehicle", "packing", "problem"],
  waiting_vehicle: ["scheduled", "packed", "problem"],
  scheduled: ["shipped", "waiting_vehicle", "problem"],
  shipped: ["delivered", "returned", "problem"],
  delivered: ["returned", "problem"],
  problem: ["awaiting_kiot", "kiot_linked", "reserved", "packing", "packed", "waiting_vehicle", "scheduled", "cancelled"],
  cancelled: [],
  returned: []
};

const reasonRequiredTargets = new Set<OrderStatus>(["cancelled", "problem", "returned"]);
const shippedOrLater = new Set<OrderStatus>(["shipped", "delivered", "returned"]);

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  if (to === "cancelled" && shippedOrLater.has(from)) return false;
  return normalFlow[from]?.includes(to) ?? false;
}

export function requireReasonForTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  if (reasonRequiredTargets.has(to)) return true;
  return canTransitionOrder(from, to) && orderStatuses.indexOf(to) < orderStatuses.indexOf(from);
}

export function assertTransitionAllowed(from: OrderStatus, to: OrderStatus, reason?: string): void {
  if (!canTransitionOrder(from, to)) {
    throw new Error(`Cannot move order from ${from} to ${to}`);
  }

  if (requireReasonForTransition(from, to) && !reason?.trim()) {
    throw new Error(`Moving order from ${from} to ${to} requires a reason`);
  }
}
