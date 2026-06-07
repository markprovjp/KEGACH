import { describe, expect, it } from "vitest";
import { canMoveToStatus, getWorkflowMissing } from "./order-workflow";

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
});
