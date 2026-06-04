import { describe, expect, it } from "vitest";
import { calculateStock, createMovement } from "./inventory-ledger";

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
});
