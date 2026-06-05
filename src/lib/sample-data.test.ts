import { describe, expect, it } from "vitest";
import { carrierSeeds, sampleProducts } from "./sample-data";

describe("business sample data", () => {
  it("contains the full approved product list with Vietnamese names", () => {
    expect(sampleProducts).toHaveLength(26);
    expect(sampleProducts.map((product) => product.name)).toContain("Ke cân bằng 1MM");
    expect(sampleProducts.map((product) => product.name)).toContain("Nêm");
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
});
