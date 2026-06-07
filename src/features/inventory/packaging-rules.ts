export type PackagingRule = {
  finishedSku: string;
  rawSku: string;
  bagSku: string;
  label: string;
};

export const packagingRules: PackagingRule[] = [
  { finishedSku: "ke-can-bang-1mm", rawSku: "ke-can-bang-1mm-roi", bagSku: "tui-bong-ke-can-bang-1mm", label: "Ke cân bằng 1MM" },
  { finishedSku: "ke-can-bang-1-5mm", rawSku: "ke-can-bang-1-5mm-roi", bagSku: "tui-bong-ke-can-bang-1-5mm", label: "Ke cân bằng 1.5MM" },
  { finishedSku: "ke-can-bang-2mm", rawSku: "ke-can-bang-2mm-roi", bagSku: "tui-bong-ke-can-bang-2mm", label: "Ke cân bằng 2MM" },
  { finishedSku: "ke-can-bang-3mm", rawSku: "ke-can-bang-3mm-roi", bagSku: "tui-bong-ke-can-bang-3mm", label: "Ke cân bằng 3MM" },
  { finishedSku: "nem", rawSku: "nem-roi", bagSku: "tui-bong-dong-nem", label: "Nêm" }
];

export function getPackagingRuleByFinishedSku(sku?: string): PackagingRule | undefined {
  return packagingRules.find((rule) => rule.finishedSku === sku);
}

export function isPackagingTripletAllowed(input: { finishedSku?: string; rawSku?: string; bagSku?: string }): boolean {
  const rule = getPackagingRuleByFinishedSku(input.finishedSku);
  return Boolean(rule && rule.rawSku === input.rawSku && rule.bagSku === input.bagSku);
}
