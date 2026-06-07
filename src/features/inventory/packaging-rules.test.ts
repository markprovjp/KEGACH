import { describe, expect, it } from "vitest";
import { calculatePackagingWeights, getPackagingRuleByFinishedSku, packagingRules } from "./packaging-rules";

describe("packaging rules", () => {
  it("only allows loose stock and matching bags for balance ke and nem", () => {
    expect(packagingRules).toHaveLength(5);
    expect(packagingRules.map((rule) => rule.finishedSku)).toEqual([
      "ke-can-bang-1mm",
      "ke-can-bang-1-5mm",
      "ke-can-bang-2mm",
      "ke-can-bang-3mm",
      "nem"
    ]);
  });

  it("finds the exact loose and bag products for a finished item", () => {
    expect(getPackagingRuleByFinishedSku("ke-can-bang-2mm")).toEqual({
      finishedSku: "ke-can-bang-2mm",
      rawSku: "ke-can-bang-2mm-roi",
      bagSku: "tui-bong-ke-can-bang-2mm",
      label: "Ke cân bằng 2MM",
      packageKg: 30
    });
  });

  it("calculates finished kg and finished bag count from raw bags plus plastic bag kg", () => {
    expect(calculatePackagingWeights({ rawPackageCount: 10, bagKg: 5, packageKg: 30 })).toEqual({
      rawKg: 300,
      finishedKg: 305,
      finishedPackageCount: 10.167
    });
  });
});
