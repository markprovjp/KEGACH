import { describe, expect, it } from "vitest";
import { canonicalSkuForKiotProduct, parseKiotProductPages } from "./import-products";

describe("Kiot product import", () => {
  it("maps Kiot loose ke/nem rows to canonical operational products", () => {
    expect(canonicalSkuForKiotProduct({ Code: "SP000002", Name: "Nêm" })).toBe("nem");
    expect(canonicalSkuForKiotProduct({ Code: "SP000001", Name: "ke cân bằng 1mm (kg)" })).toBe("ke-can-bang-1mm");
    expect(canonicalSkuForKiotProduct({ Code: "SP000008", Name: "ke cân bằng 1.5mm" })).toBe("ke-can-bang-1-5mm");
    expect(canonicalSkuForKiotProduct({ Code: "SP000044", Name: "ke cân bằng 2mm" })).toBe("ke-can-bang-2mm");
    expect(canonicalSkuForKiotProduct({ Code: "SP000081", Name: "ke cân bằng 3mm" })).toBe("ke-can-bang-3mm");
    expect(canonicalSkuForKiotProduct({ Code: "SP000005", Name: "Ke chữ thập 1mm" })).toBe("ke-chu-thap-1mm");
  });

  it("keeps real color-code products as their Kiot SKU rows", () => {
    expect(canonicalSkuForKiotProduct({ Code: "SP000019", Name: "b01" })).toBe("SP000019");
    expect(canonicalSkuForKiotProduct({ Code: "SP000112", Name: "cat 01" })).toBe("SP000112");
  });

  it("parses concatenated Kiot product pages", () => {
    const pages = parseKiotProductPages('{"TotalOnHand":1,"Data":[{"Code":"SP1"}]}\n\n{"TotalOnHand":2,"Data":[{"Code":"SP2"}]}');
    expect(pages).toHaveLength(2);
    expect(pages[1].Data?.[0].Code).toBe("SP2");
  });
});
