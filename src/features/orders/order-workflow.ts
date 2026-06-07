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
  | "warehouse_customer_finalized"
  | "kiot_invoice_created"
  | "official_order_sent_customer"
  | "official_order_photo_sent_group"
  | "carrier_contacted"
  | "sent_group_for_packing"
  | "packing_photo_taken"
  | "package_count_recorded"
  | "labels_attached"
  | "shipper_order_confirmed"
  | "handoff_checked"
  | "final_info_checked"
  | "cod_label_complete"
  | "cod_info_sent_to_post"
  | "print_slip_discarded"
  | "customer_zalo_done"
  | "vehicle_phone_sent_customer";

export const workflowCheckLabels: Record<WorkflowCheckKey, string> = {
  asked_extra_items: "Đã hỏi khách có lấy thêm hàng không",
  draft_sent_to_tan: "Đã gửi đơn nháp cho Tân chuẩn bị hàng",
  draft_sent_customer_confirmed: "Khách đã xác nhận đơn nháp",
  warehouse_customer_finalized: "Khách lấy kho đã thanh toán hoặc đã nhận hàng rời kho",
  kiot_invoice_created: "Đã lên đơn chính thức trên Kiot",
  official_order_sent_customer: "Đã gửi đơn chính thức cho khách",
  official_order_photo_sent_group: "Đã chụp/gửi đơn chính thức vào nhóm chung",
  carrier_contacted: "Đã liên hệ nhà xe đúng tuyến",
  sent_group_for_packing: "Đã gửi nhóm chung để soạn hàng",
  packing_photo_taken: "Tân đã chụp ảnh hàng hóa",
  package_count_recorded: "Đã ghi số lượng kiện hàng",
  labels_attached: "Đã dán giấy thông tin đơn hàng",
  shipper_order_confirmed: "Đã xác nhận shipper lấy đúng đơn",
  handoff_checked: "Đã kiểm hàng trước khi bàn giao",
  final_info_checked: "Đã kiểm tra lại thông tin lần cuối",
  cod_label_complete: "Tem COD đủ tên, SĐT, địa chỉ, tiền, SL, KL, cước",
  cod_info_sent_to_post: "Đã in/gửi thông tin COD cho bưu điện/đơn vị giao",
  print_slip_discarded: "Đã hủy/bỏ phiếu in đã dùng",
  customer_zalo_done: "Đã báo khách qua Zalo khi giao xong",
  vehicle_phone_sent_customer: "Đã gửi SĐT xe nhận hàng cho khách"
};

export type WorkflowPhaseKey = "intake" | "vehicle" | "packing" | "handoff" | "finish" | "report";

export const workflowPhaseLabels: Record<WorkflowPhaseKey, string> = {
  intake: "Tiếp nhận",
  vehicle: "Ghép xe",
  packing: "Soạn hàng",
  handoff: "Bàn giao",
  finish: "Hoàn tất",
  report: "Báo nhóm"
};

export const workflowPhaseChecks: Record<WorkflowPhaseKey, WorkflowCheckKey[]> = {
  intake: ["asked_extra_items", "draft_sent_to_tan", "draft_sent_customer_confirmed", "warehouse_customer_finalized", "kiot_invoice_created", "official_order_sent_customer"],
  vehicle: ["carrier_contacted"],
  packing: ["sent_group_for_packing", "packing_photo_taken", "package_count_recorded", "labels_attached"],
  handoff: ["shipper_order_confirmed", "handoff_checked", "final_info_checked", "cod_label_complete", "cod_info_sent_to_post", "print_slip_discarded"],
  finish: ["customer_zalo_done", "vehicle_phone_sent_customer"],
  report: ["official_order_photo_sent_group"]
};

export type WorkflowOrderInput = {
  status?: OrderStatus;
  orderType?: string | null;
  isOfficial?: boolean | null;
  kiotInvoiceCode?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  receiverAddress?: string | null;
  codAmount?: number | null;
  paymentStatus?: string | null;
  carrierName?: string | null;
  deliveryMode?: string | null;
  packageCount?: number | null;
  estimatedWeightKg?: number | null;
  workflowChecks?: unknown;
};

export type WorkflowNextAction = {
  title: string;
  phase: string;
  severity: "blocked" | "todo" | "done";
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
    if (order.isOfficial || order.kiotInvoiceCode) required.add("warehouse_customer_finalized");
  }
  if (type === "truck_share") {
    required.add("carrier_contacted");
    required.add("draft_sent_customer_confirmed");
  }
  if (order.isOfficial || order.kiotInvoiceCode) {
    required.add("kiot_invoice_created");
    required.add("official_order_sent_customer");
    required.add("official_order_photo_sent_group");
    required.add("sent_group_for_packing");
  }
  if (isPreparing) {
    required.add("packing_photo_taken");
    required.add("package_count_recorded");
    required.add("labels_attached");
  }
  if (isHandoff) {
    required.add("shipper_order_confirmed");
    required.add("handoff_checked");
    required.add("final_info_checked");
    required.add("print_slip_discarded");
    if (type === "cod") {
      required.add("cod_label_complete");
      required.add("cod_info_sent_to_post");
    }
  }
  if (status === "delivered") {
    required.add("customer_zalo_done");
    required.add("vehicle_phone_sent_customer");
  }
  return Array.from(required);
}

export function getWorkflowMissingKeys(order: WorkflowOrderInput): WorkflowCheckKey[] {
  const checks = normalizeWorkflowChecks(order.workflowChecks);
  return getWorkflowRequiredKeys(order).filter((key) => !checks.includes(key));
}

export function getWorkflowDataMissing(order: WorkflowOrderInput): string[] {
  const missing: string[] = [];
  const type = normalizeOrderType(order.orderType);

  if (type === "online" && !order.kiotInvoiceCode && order.isOfficial) missing.push("Đơn online phải có hóa đơn Kiot");
  if (type === "cod" && (order.isOfficial || order.status !== "draft")) {
    const nameForLabel = order.receiverName || order.customerName;
    const phoneForLabel = order.receiverPhone || order.customerPhone;
    const addressForLabel = order.receiverAddress || order.customerAddress;
    if (!nameForLabel?.trim()) missing.push("COD thiếu tên người nhận");
    if (!phoneForLabel?.trim() || phoneForLabel === "-") missing.push("COD thiếu SĐT người nhận");
    if (!addressForLabel?.trim()) missing.push("COD thiếu địa chỉ người nhận");
    if (!order.codAmount || order.codAmount <= 0) missing.push("COD thiếu tiền thu");
    if (!order.packageCount || order.packageCount <= 0) missing.push("COD thiếu số kiện");
    if (!order.estimatedWeightKg || order.estimatedWeightKg <= 0) missing.push("COD thiếu khối lượng");
  }
  if (type === "truck_share" && !order.carrierName?.trim()) missing.push("Đơn ghép xe chưa chọn nhà xe");
  if (order.isOfficial && !order.kiotInvoiceCode) missing.push("Đơn chính thức phải có hóa đơn Kiot");
  if (order.paymentStatus === "paid" && !order.isOfficial) missing.push("Đã thanh toán thì phải lên đơn chính thức");

  return missing;
}

export function getWorkflowMissing(order: WorkflowOrderInput): string[] {
  return [
    ...getWorkflowDataMissing(order),
    ...getWorkflowMissingKeys(order).map((key) => workflowCheckLabels[key])
  ];
}

export function getWorkflowNextAction(order: WorkflowOrderInput): WorkflowNextAction {
  const dataMissing = getWorkflowDataMissing(order);
  if (dataMissing.length > 0) {
    return { title: dataMissing[0], phase: "Thông tin bắt buộc", severity: "blocked" };
  }

  const missingKey = getWorkflowMissingKeys(order)[0];
  if (!missingKey) return { title: "Đủ quy trình hiện tại", phase: "Hoàn tất", severity: "done" };

  const phase = (Object.keys(workflowPhaseChecks) as WorkflowPhaseKey[]).find((key) => workflowPhaseChecks[key].includes(missingKey));
  return {
    title: workflowCheckLabels[missingKey],
    phase: phase ? workflowPhaseLabels[phase] : "Quy trình",
    severity: "todo"
  };
}

export function getWorkflowPhaseState(order: WorkflowOrderInput): Array<{ key: WorkflowPhaseKey; title: string; required: number; completed: number; missing: number }> {
  const required = new Set(getWorkflowRequiredKeys(order));
  const checked = new Set(normalizeWorkflowChecks(order.workflowChecks));
  return (Object.keys(workflowPhaseLabels) as WorkflowPhaseKey[]).map((key) => {
    const phaseRequired = workflowPhaseChecks[key].filter((check) => required.has(check));
    const completed = phaseRequired.filter((check) => checked.has(check)).length;
    return {
      key,
      title: workflowPhaseLabels[key],
      required: phaseRequired.length,
      completed,
      missing: phaseRequired.length - completed
    };
  });
}

export function canMoveToStatus(order: WorkflowOrderInput, nextStatus: OrderStatus): { ok: boolean; missing: string[] } {
  const nextOrder = { ...order, status: nextStatus };
  const missing = getWorkflowMissing(nextOrder);
  const blocked = ["kiot_linked", "reserved", "packing", "packed", "waiting_vehicle", "scheduled", "shipped", "delivered"].includes(nextStatus) && missing.length > 0;
  return { ok: !blocked, missing };
}

export function normalizeOrderType(value?: string | null): OrderType {
  if (value === "warehouse_pickup" || value === "cod" || value === "truck_share" || value === "online") return value;
  return "online";
}
