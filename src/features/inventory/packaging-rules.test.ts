import { describe, expect, it } from "vitest";
import { getPackagingRuleByFinishedSku, packagingRules } from "./packaging-rules";

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
      label: "Ke cân bằng 2MM"
    });
  });
});
