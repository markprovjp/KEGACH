import { describe, expect, it } from "vitest";
import { canMoveToStatus, getWorkflowMissing, getWorkflowRequiredKeys } from "./order-workflow";

describe("order workflow", () => {
  it("blocks COD shipment when required delivery fields are missing", () => {
    const result = canMoveToStatus({ orderType: "cod", status: "packed", customerName: "Anh A", customerPhone: "", codAmount: 0 }, "shipped");

    expect(result.ok).toBe(false);
    expect(result.missing).toContain("COD thiếu SĐT");
    expect(result.missing).toContain("COD thiếu tiền thu");
  });

  it("requires official online orders to have Kiot invoice", () => {
    expect(getWorkflowMissing({ orderType: "online", isOfficial: true })).toContain("Đơn online phải có hóa đơn Kiot");
  });

  it("requires the approved shop workflow before an official order can move forward", () => {
    const missing = getWorkflowMissing({ orderType: "truck_share", status: "kiot_linked", isOfficial: true, kiotInvoiceCode: "HD004066", carrierName: "Xe Hòa Phát" });

    expect(missing).toContain("Khách đã xác nhận đơn nháp");
    expect(missing).toContain("Đã gửi đơn chính thức cho khách");
    expect(missing).toContain("Đã chụp/gửi đơn chính thức vào nhóm chung");
  });

  it("tracks all six business phases as checklist requirements", () => {
    expect(getWorkflowRequiredKeys({ orderType: "cod", status: "shipped", isOfficial: true, kiotInvoiceCode: "HD004066" })).toEqual(expect.arrayContaining([
      "kiot_invoice_created",
      "sent_group_for_packing",
      "packing_photo_taken",
      "handoff_checked",
      "final_info_checked",
      "cod_label_complete",
      "print_slip_discarded"
    ]));
  });
});
