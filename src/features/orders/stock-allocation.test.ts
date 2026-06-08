import { describe, expect, it } from "vitest";
import { allocateOrderStock, hasAnyFulfillableLine, hasAnyShortageLine } from "./stock-allocation";

describe("stock allocation", () => {
  it("splits an order line into sendable and waiting quantities", () => {
    const [line] = allocateOrderStock([{ productId: "b07", quantity: 60 }], new Map([["b07", 30]]));

    expect(line.fulfillableQuantity).toBe(30);
    expect(line.shortageQuantity).toBe(30);
    expect(hasAnyFulfillableLine([line])).toBe(true);
    expect(hasAnyShortageLine([line])).toBe(true);
  });

  it("allocates repeated product lines without overusing available stock", () => {
    const lines = allocateOrderStock([
      { productId: "cat-08", quantity: 20 },
      { productId: "cat-08", quantity: 20 }
    ], new Map([["cat-08", 30]]));

    expect(lines.map((line) => line.fulfillableQuantity)).toEqual([20, 10]);
    expect(lines.map((line) => line.shortageQuantity)).toEqual([0, 10]);
  });

  it("detects an order that is fully waiting for stock", () => {
    const lines = allocateOrderStock([{ productId: "ke-1mm", quantity: 10 }], new Map([["ke-1mm", 0]]));

    expect(hasAnyFulfillableLine(lines)).toBe(false);
    expect(hasAnyShortageLine(lines)).toBe(true);
  });
});
