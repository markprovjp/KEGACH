import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/features/catalog/catalog-types";
import { parseFreeformOrderText } from "./freeform-order-parser";

const products: CatalogProduct[] = [
  { id: "b07", sku: "SP000017", name: "b07", unit: "tuýp", defaultPrice: 60000, packageRule: "30 cái / thùng", aliases: [{ value: "b07" }] },
  { id: "b08", sku: "SP000018", name: "b08", unit: "tuýp", defaultPrice: 60000, packageRule: "30 cái / thùng", aliases: [{ value: "b08" }] },
  { id: "cat08", sku: "SP000116", name: "cat 08", unit: "tuýp", defaultPrice: 70000, packageRule: "30 cái / thùng", aliases: [{ value: "cat08" }] },
  { id: "ke-15", name: "Ke cân bằng 1.5MM", unit: "kg", defaultPrice: 47000, packageRule: "30 kg / bao", aliases: [{ value: "ke 1.5 ly" }] },
  { id: "biron", name: "Bộ biron rẻ", unit: "bộ", defaultPrice: 20000, aliases: [{ value: "bộ dụng cụ vệ sinh mạch" }] }
];

describe("freeform order parser", () => {
  it("converts cartons of color-coded Bonbond to tube quantity", () => {
    const result = parseFreeformOrderText("B07 ship e 1 thùng", products);

    expect(result.unmatched).toEqual([]);
    expect(result.matched[0]).toEqual(expect.objectContaining({
      productId: "b07",
      quantity: 30,
      enteredQuantity: 1,
      enteredUnit: "thùng",
      conversionNote: "1 thùng = 30 tuýp"
    }));
  });

  it("defaults keo 2 thành phần màu 08 to Bonbond when CAT is not mentioned", () => {
    const result = parseFreeformOrderText("2 thùng keo 2 thành phần màu 08", products);

    expect(result.matched[0]).toEqual(expect.objectContaining({
      productId: "b08",
      quantity: 60,
      conversionNote: "2 thùng = 60 tuýp"
    }));
  });

  it("keeps CAT color codes separate from Bonbond color codes", () => {
    const result = parseFreeformOrderText("cat 08 1 thùng", products);

    expect(result.matched[0]).toEqual(expect.objectContaining({
      productId: "cat08",
      quantity: 30
    }));
  });

  it("matches Vietnamese customer language for kg ke/nêm and tool kits", () => {
    const result = parseFreeformOrderText("20kg ke nêm 1.5mm\n20 bộ dụng cụ vệ sinh mạch", products);

    expect(result.matched).toEqual([
      expect.objectContaining({ productId: "ke-15", quantity: 20, enteredUnit: "kg" }),
      expect.objectContaining({ productId: "biron", quantity: 20, enteredUnit: "bộ" })
    ]);
  });
});
