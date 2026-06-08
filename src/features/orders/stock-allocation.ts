export type StockAllocationLine = {
  productId: string;
  quantity: number;
  productName?: string;
  unit?: string;
};

export type StockAllocation = StockAllocationLine & {
  availableBeforeLine: number;
  fulfillableQuantity: number;
  shortageQuantity: number;
};

export function allocateOrderStock(lines: StockAllocationLine[], availableByProductId: Map<string, number>): StockAllocation[] {
  const remaining = new Map(availableByProductId);

  return lines.map((line) => {
    const quantity = Number(line.quantity ?? 0);
    const availableBeforeLine = Math.max(0, remaining.get(line.productId) ?? 0);
    const fulfillableQuantity = Math.min(quantity, availableBeforeLine);
    const shortageQuantity = Math.max(0, quantity - fulfillableQuantity);
    remaining.set(line.productId, Math.max(0, availableBeforeLine - fulfillableQuantity));

    return {
      ...line,
      quantity,
      availableBeforeLine,
      fulfillableQuantity,
      shortageQuantity
    };
  });
}

export function hasAnyFulfillableLine(allocations: StockAllocation[]): boolean {
  return allocations.some((line) => line.fulfillableQuantity > 0);
}

export function hasAnyShortageLine(allocations: StockAllocation[]): boolean {
  return allocations.some((line) => line.shortageQuantity > 0);
}
