import { describe, expect, it } from "vitest";
import { convertProductQuantity, getProductQuantityUnits } from "./package-conversion";

describe("package conversion", () => {
  it("converts cartons to tubes for glue products", () => {
    const product = { unit: "tuýp", packageRule: "30 cái / thùng" };
    expect(getProductQuantityUnits(product)).toContainEqual({ value: "thùng", label: "thùng", factor: 30 });
    expect(convertProductQuantity({ product: { id: "p", name: "Keo", unit: "tuýp", defaultPrice: 0, aliases: [], packageRule: "30 cái / thùng" }, enteredQuantity: 2, enteredUnit: "thùng" })).toEqual({
      quantity: 60,
      enteredUnit: "thùng",
      conversionNote: "2 thùng = 60 tuýp"
    });
  });

  it("converts bags to kg for loose ke and nem products", () => {
    const result = convertProductQuantity({ product: { id: "p", name: "Nêm", unit: "kg", defaultPrice: 0, aliases: [], packageRule: "30 kg / bao" }, enteredQuantity: 2, enteredUnit: "bao" });
    expect(result.quantity).toBe(60);
    expect(result.conversionNote).toBe("2 bao = 60 kg");
  });

  it("keeps base quantity when staff enters base unit", () => {
    const result = convertProductQuantity({ product: { id: "p", name: "Bay", unit: "cái", defaultPrice: 0, aliases: [], packageRule: "" }, enteredQuantity: 3, enteredUnit: "cái" });
    expect(result).toEqual({ quantity: 3, enteredUnit: "cái", conversionNote: undefined });
  });
});
