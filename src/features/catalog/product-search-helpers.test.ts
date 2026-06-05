import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "./catalog-types";
import { buildProductSearchText, buildVariantLabel } from "./product-search-helpers";

const bonbond: CatalogProduct = {
  id: "keo-bonbond",
  name: "Keo 2 thành phần BONBOND",
  unit: "cái",
  defaultPrice: 60000,
  aliases: [{ value: "bonbond" }],
  variants: [{ code: "02", cartonCount: 0, tubeCount: 8 }]
};

const cat: CatalogProduct = {
  id: "keo-epoxy-cat",
  name: "Keo 2 thành phần EPOXY CAT",
  unit: "cái",
  defaultPrice: 70000,
  aliases: [{ value: "epoxy cat" }],
  variants: [{ code: "01", cartonCount: 46, tubeCount: 25 }]
};

describe("product search helpers", () => {
  it("adds keo variant codes to searchable text", () => {
    expect(buildProductSearchText(bonbond)).toContain("b02");
    expect(buildProductSearchText(cat)).toContain("cat01");
    expect(buildProductSearchText(cat)).toContain("b01");
  });

  it("renders readable variant stock labels", () => {
    expect(buildVariantLabel(bonbond)).toContain("B02 (8 tuýp)");
    expect(buildVariantLabel(cat)).toContain("CAT01 (46 thùng + 25 tuýp)");
  });
});
