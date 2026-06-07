import { describe, expect, it } from "vitest";
import { calculatePackagingReconciliation, calculateStock, createMovement } from "./inventory-ledger";

describe("inventory ledger", () => {
  it("calculates on hand, reserved, and available stock", () => {
    const stock = calculateStock([
      createMovement("purchase_in", 20),
      createMovement("reserve", 8),
      createMovement("ship", 3),
      createMovement("release_reservation", 2),
      createMovement("return_in", 1)
    ]);

    expect(stock).toEqual({ onHand: 18, reserved: 3, available: 15 });
  });

  it("rejects non-positive quantities", () => {
    expect(() => createMovement("reserve", 0)).toThrow("greater than zero");
  });

  it("reconciles loose nem, plastic bags, and finished packed nem", () => {
    const result = calculatePackagingReconciliation([
      { rawKg: 100, bagKg: 6, finishedKg: 106 },
      { rawKg: 50, bagKg: 3, finishedKg: 52.5 }
    ]);

    expect(result).toEqual({
      rawUsedKg: 150,
      bagUsedKg: 9,
      finishedKg: 158.5,
      expectedBagKg: 8.5,
      varianceKg: 0.5
    });
  });
});
