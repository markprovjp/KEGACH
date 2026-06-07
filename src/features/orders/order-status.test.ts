import { describe, expect, it } from "vitest";
import { canTransitionOrder, orderStatuses, requireReasonForTransition } from "./order-status";

describe("order status machine", () => {
  it("contains every operational status", () => {
    expect(orderStatuses).toEqual([
      "draft",
      "awaiting_stock",
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
    ]);
  });

  it("allows normal fulfilment flow", () => {
    expect(canTransitionOrder("draft", "awaiting_stock")).toBe(true);
    expect(canTransitionOrder("awaiting_stock", "awaiting_kiot")).toBe(true);
    expect(canTransitionOrder("draft", "awaiting_kiot")).toBe(true);
    expect(canTransitionOrder("awaiting_kiot", "kiot_linked")).toBe(true);
    expect(canTransitionOrder("kiot_linked", "reserved")).toBe(true);
    expect(canTransitionOrder("reserved", "packing")).toBe(true);
    expect(canTransitionOrder("packing", "packed")).toBe(true);
    expect(canTransitionOrder("packed", "waiting_vehicle")).toBe(true);
    expect(canTransitionOrder("waiting_vehicle", "scheduled")).toBe(true);
    expect(canTransitionOrder("scheduled", "shipped")).toBe(true);
    expect(canTransitionOrder("shipped", "delivered")).toBe(true);
  });

  it("blocks cancellation after shipment", () => {
    expect(canTransitionOrder("scheduled", "cancelled")).toBe(false);
    expect(canTransitionOrder("shipped", "cancelled")).toBe(false);
    expect(canTransitionOrder("delivered", "cancelled")).toBe(false);
  });

  it("requires reasons for risky moves", () => {
    expect(requireReasonForTransition("reserved", "cancelled")).toBe(true);
    expect(requireReasonForTransition("shipped", "returned")).toBe(true);
    expect(requireReasonForTransition("packed", "problem")).toBe(true);
    expect(requireReasonForTransition("packing", "reserved")).toBe(true);
    expect(requireReasonForTransition("reserved", "packing")).toBe(false);
  });

  it("allows rollback from reserved to Kiot linked with reason", () => {
    expect(canTransitionOrder("reserved", "kiot_linked")).toBe(true);
    expect(requireReasonForTransition("reserved", "kiot_linked")).toBe(true);
  });
});
