import type { OrderStatus } from "./order-status";

export type OrderType = "warehouse_pickup" | "cod" | "online" | "truck_share";
export type PaymentStatus = "unpaid" | "paid";

export const orderTypeLabels: Record<OrderType, string> = {
  warehouse_pickup: "Khách lấy tại kho",
  cod: "Đơn COD",
  online: "Đơn online",
  truck_share: "Ghép xe / chành xe"
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán"
};

export type WorkflowCheckKey =
  | "asked_extra_items"
  | "draft_sent_to_tan"
  | "draft_sent_customer_confirmed"
  | "kiot_invoice_created"
  | "official_order_photo_sent_group"
  | "carrier_contacted"
  | "sent_group_for_packing"
  | "packing_photo_taken"
  | "package_count_recorded"
  | "labels_attached"
  | "shipper_order_confirmed"
  | "handoff_checked"
  | "cod_label_complete"
  | "print_slip_discarded"
  | "customer_zalo_done"
  | "vehicle_phone_sent_customer";

export const workflowCheckLabels: Record<WorkflowCheckKey, string> = {
  asked_extra_items: "Đã hỏi khách có lấy thêm hàng không",
  draft_sent_to_tan: "Đã gửi đơn nháp cho Tân chuẩn bị hàng",
  draft_sent_customer_confirmed: "Khách đã xác nhận đơn nháp",
  kiot_invoice_created: "Đã lên đơn chính thức trên Kiot",
  official_order_photo_sent_group: "Đã chụp/gửi đơn chính thức vào nhóm chung",
  carrier_contacted: "Đã liên hệ nhà xe đúng tuyến",
  sent_group_for_packing: "Đã gửi nhóm chung để soạn hàng",
  packing_photo_taken: "Tân đã chụp ảnh hàng hóa",
  package_count_recorded: "Đã ghi số lượng kiện hàng",
  labels_attached: "Đã dán giấy thông tin đơn hàng",
  shipper_order_confirmed: "Đã xác nhận shipper lấy đúng đơn",
  handoff_checked: "Đã kiểm hàng trước khi bàn giao",
  cod_label_complete: "Tem COD đủ tên, SĐT, địa chỉ, tiền, SL, KL, cước",
  print_slip_discarded: "Đã hủy/bỏ phiếu in đã dùng",
  customer_zalo_done: "Đã báo khách qua Zalo khi giao xong",
  vehicle_phone_sent_customer: "Đã gửi SĐT xe nhận hàng cho khách"
};

export type WorkflowOrderInput = {
  status?: OrderStatus;
  orderType?: string | null;
  isOfficial?: boolean | null;
  kiotInvoiceCode?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  codAmount?: number | null;
  paymentStatus?: string | null;
  carrierName?: string | null;
  deliveryMode?: string | null;
  packageCount?: number | null;
  estimatedWeightKg?: number | null;
  workflowChecks?: unknown;
};

export function normalizeWorkflowChecks(value: unknown): WorkflowCheckKey[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is WorkflowCheckKey => typeof item === "string" && item in workflowCheckLabels)));
}

export function getWorkflowRequiredKeys(order: WorkflowOrderInput): WorkflowCheckKey[] {
  const required = new Set<WorkflowCheckKey>();
  const status = order.status;
  const type = normalizeOrderType(order.orderType);
  const isPreparing = status && ["reserved", "packing", "packed", "waiting_vehicle", "scheduled", "shipped", "delivered"].includes(status);
  const isHandoff = status && ["scheduled", "shipped", "delivered"].includes(status);

  if (type === "warehouse_pickup") {
    required.add("asked_extra_items");
    required.add("draft_sent_to_tan");
  }
  if (type === "truck_share") {
    required.add("carrier_contacted");
    required.add("draft_sent_customer_confirmed");
  }
  if (order.isOfficial || order.kiotInvoiceCode) {
    required.add("kiot_invoice_created");
    required.add("official_order_photo_sent_group");
    required.add("sent_group_for_packing");
  }
  if (type === "cod") required.add("cod_label_complete");
  if (isPreparing) {
    required.add("packing_photo_taken");
    required.add("package_count_recorded");
    required.add("labels_attached");
  }
  if (isHandoff) {
    required.add("shipper_order_confirmed");
    required.add("handoff_checked");
    required.add("print_slip_discarded");
  }
  if (status === "delivered") {
    required.add("customer_zalo_done");
    required.add("vehicle_phone_sent_customer");
  }
  return Array.from(required);
}

export function getWorkflowMissing(order: WorkflowOrderInput): string[] {
  const checks = normalizeWorkflowChecks(order.workflowChecks);
  const missing = getWorkflowRequiredKeys(order)
    .filter((key) => !checks.includes(key))
    .map((key) => workflowCheckLabels[key]);
  const type = normalizeOrderType(order.orderType);

  if (type === "online" && !order.kiotInvoiceCode && order.isOfficial) missing.unshift("Đơn online phải có hóa đơn Kiot");
  if (type === "cod") {
    if (!order.customerName?.trim()) missing.unshift("COD thiếu tên khách");
    if (!order.customerPhone?.trim() || order.customerPhone === "-") missing.unshift("COD thiếu SĐT");
    if (!order.customerAddress?.trim()) missing.unshift("COD thiếu địa chỉ");
    if (!order.codAmount || order.codAmount <= 0) missing.unshift("COD thiếu tiền thu");
    if (!order.packageCount || order.packageCount <= 0) missing.unshift("COD thiếu số kiện");
    if (!order.estimatedWeightKg || order.estimatedWeightKg <= 0) missing.unshift("COD thiếu khối lượng");
  }
  if (type === "truck_share" && !order.carrierName?.trim()) missing.unshift("Đơn ghép xe chưa chọn nhà xe");
  if (order.isOfficial && !order.kiotInvoiceCode) missing.unshift("Đơn chính thức phải có hóa đơn Kiot");
  if (order.paymentStatus === "paid" && !order.isOfficial) missing.unshift("Đã thanh toán thì phải lên đơn chính thức");

  return missing;
}

export function canMoveToStatus(order: WorkflowOrderInput, nextStatus: OrderStatus): { ok: boolean; missing: string[] } {
  const nextOrder = { ...order, status: nextStatus };
  const missing = getWorkflowMissing(nextOrder);
  const blocked = ["packing", "packed", "waiting_vehicle", "scheduled", "shipped", "delivered"].includes(nextStatus) && missing.length > 0;
  return { ok: !blocked, missing };
}

export function normalizeOrderType(value?: string | null): OrderType {
  if (value === "warehouse_pickup" || value === "cod" || value === "truck_share" || value === "online") return value;
  return "online";
}
