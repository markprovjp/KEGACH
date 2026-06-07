import { describe, expect, it } from "vitest";
import { carrierSeeds, productVariantSeeds, sampleProducts } from "./sample-data";

describe("business sample data", () => {
  it("contains the full approved product list with Vietnamese names", () => {
    expect(sampleProducts).toHaveLength(28);
    expect(sampleProducts.map((product) => product.name)).toContain("Ke cân bằng 1MM");
    expect(sampleProducts.map((product) => product.name)).toContain("Nêm");
    expect(sampleProducts.map((product) => product.name)).toContain("Nêm rời");
    expect(sampleProducts.map((product) => product.name)).toContain("Túi bóng đóng nêm");
    expect(sampleProducts.map((product) => product.name)).toContain("Mủ chiết mạch");
    expect(sampleProducts.map((product) => product.name)).toContain("Súng điện full bộ");
    expect(sampleProducts.find((product) => product.id === "ke-vit-xoay-1-5mm")?.packageRule).toBe("60 túi / thùng - 1 túi 50 cái");
  });

  it("contains the supplied dispatch carrier directory", () => {
    expect(carrierSeeds.length).toBeGreaterThanOrEqual(28);
    expect(carrierSeeds.map((carrier) => carrier.name)).toContain("Huy bưu điện (GHN)");
    expect(carrierSeeds.map((carrier) => carrier.name)).toContain("Xe Hòa Phát");
    expect(carrierSeeds.map((carrier) => carrier.name)).toContain("Anh Ngọc");
  });

  it("contains BONBOND and EPOXY CAT variants", () => {
    expect(productVariantSeeds.filter((variant) => variant.productId === "keo-bonbond")).toHaveLength(12);
    expect(productVariantSeeds.filter((variant) => variant.productId === "keo-epoxy-cat")).toHaveLength(12);
    expect(productVariantSeeds).toContainEqual({ productId: "keo-bonbond", code: "01", cartonCount: 0, tubeCount: 0 });
    expect(productVariantSeeds).toContainEqual({ productId: "keo-bonbond", code: "12", cartonCount: 17, tubeCount: 29 });
    expect(productVariantSeeds).toContainEqual({ productId: "keo-epoxy-cat", code: "11", cartonCount: 19, tubeCount: 20 });
    expect(productVariantSeeds).toContainEqual({ productId: "keo-epoxy-cat", code: "12", cartonCount: 9, tubeCount: 12 });
    expect(productVariantSeeds).not.toContainEqual(expect.objectContaining({ productId: "keo-bonbond", code: "B13" }));
    expect(productVariantSeeds).not.toContainEqual(expect.objectContaining({ productId: "keo-bonbond", code: "B14" }));
    expect(productVariantSeeds).not.toContainEqual(expect.objectContaining({ productId: "keo-epoxy-cat", code: "13" }));
  });
});
