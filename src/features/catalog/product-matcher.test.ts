import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "./catalog-types";
import { parseProductLines } from "./product-matcher";

const products: CatalogProduct[] = [
  { id: "ke-can-bang-3mm", name: "Ke can bang 3MM", unit: "bao", defaultPrice: 47000, aliases: [{ value: "B03" }, { value: "3ly" }] },
  { id: "ke-can-bang-2mm", name: "Ke can bang 2MM", unit: "bao", defaultPrice: 47000, aliases: [{ value: "B04" }, { value: "2ly" }] },
  { id: "nem", name: "Nem", unit: "bao", defaultPrice: 35000, aliases: [{ value: "nem" }, { value: "nem 1 bao" }] },
  { id: "keo-epoxy-cat", name: "Keo 2 thanh phan EPOXY CAT", unit: "cai", defaultPrice: 70000, aliases: [{ value: "epoxy cat" }], variants: [{ code: "01", cartonCount: 46, tubeCount: 25 }] }
];

describe("product matcher", () => {
  it("matches aliases and quantities from chat lines", () => {
    const result = parseProductLines("B03 = 3t\nB04 = 2t\n* nem: 1 bao\nkhach hoi giao gap", products);

    expect(result.matched).toEqual([
      expect.objectContaining({ productId: "ke-can-bang-3mm", quantity: 3, rawLine: "B03 = 3t", unit: "t" }),
      expect.objectContaining({ productId: "ke-can-bang-2mm", quantity: 2, rawLine: "B04 = 2t", unit: "t" }),
      expect.objectContaining({ productId: "nem", quantity: 1, rawLine: "* nem: 1 bao", unit: "bao" })
    ]);
    expect(result.unmatched).toEqual(["khach hoi giao gap"]);
  });

  it("matches keo variant codes without breaking existing B aliases", () => {
    const result = parseProductLines("B01 = 1 thung\nB03 = 3t", products);

    expect(result.matched).toEqual([
      expect.objectContaining({ productId: "keo-epoxy-cat", quantity: 1, rawLine: "B01 = 1 thung" }),
      expect.objectContaining({ productId: "ke-can-bang-3mm", quantity: 3, rawLine: "B03 = 3t" })
    ]);
  });
});
