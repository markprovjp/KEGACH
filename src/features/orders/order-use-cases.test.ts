import { describe, expect, it } from "vitest";
import { calculateStock, createMovement } from "@/features/inventory/inventory-ledger";
import {
  cancelOrderBeforeShipment,
  confirmAndReserveOrder,
  createOperationsOrder,
  createOperationsState,
  linkKiotInvoice,
  returnShippedOrder,
  shipOrder
} from "./order-use-cases";

function makeState() {
  return createOperationsState({
    inventory: {
      "ke-can-bang-3mm": [createMovement("purchase_in", 10)]
    }
  });
}

const baseOrder = {
  customerName: "Anh Minh",
  sourceChannel: "zalo",
  lines: [{ productId: "ke-can-bang-3mm", productName: "Ke can bang 3MM", quantity: 3, unitPrice: 47000 }],
  codAmount: 141000
};

describe("order use cases", () => {
  it("creates and links Kiot invoice codes", () => {
    const state = makeState();
    const order = createOperationsOrder(state, baseOrder);

    expect(order.status).toBe("awaiting_kiot");
    expect(linkKiotInvoice(state, order.id, "HD004066").status).toBe("kiot_linked");
    expect(() => createOperationsOrder(state, { ...baseOrder, kiotInvoiceCode: "HD004066" })).toThrow("already linked");
  });

  it("reserves stock and releases it when cancelled before shipment", () => {
    const state = makeState();
    const order = createOperationsOrder(state, { ...baseOrder, kiotInvoiceCode: "HD004066" });

    confirmAndReserveOrder(state, order.id);
    expect(calculateStock(state.inventory["ke-can-bang-3mm"])).toEqual({ onHand: 10, reserved: 3, available: 7 });

    cancelOrderBeforeShipment(state, order.id, "Khach huy truoc khi xuat xe");
    expect(order.status).toBe("cancelled");
    expect(calculateStock(state.inventory["ke-can-bang-3mm"])).toEqual({ onHand: 10, reserved: 0, available: 10 });
  });

  it("ships and requires return flow after shipment", () => {
    const state = makeState();
    const order = createOperationsOrder(state, { ...baseOrder, kiotInvoiceCode: "HD004066" });

    confirmAndReserveOrder(state, order.id);
    shipOrder(state, order.id);
    expect(order.status).toBe("shipped");
    expect(calculateStock(state.inventory["ke-can-bang-3mm"])).toEqual({ onHand: 7, reserved: 0, available: 7 });

    expect(() => cancelOrderBeforeShipment(state, order.id, "Sai don")).toThrow("Cannot move order");
    returnShippedOrder(state, order.id, "Khach tra hang");
    expect(order.status).toBe("returned");
    expect(calculateStock(state.inventory["ke-can-bang-3mm"])).toEqual({ onHand: 10, reserved: 0, available: 10 });
  });
});
