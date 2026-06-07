import type { InventoryMovementInput, InventoryMovementType, PackagingBatchInput, PackagingReconciliation, StockSnapshot } from "./inventory-types";

export function createMovement(type: InventoryMovementType, quantity: number): InventoryMovementInput {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Inventory movement quantity must be greater than zero");
  }
  return { type, quantity };
}

export function calculateStock(movements: InventoryMovementInput[]): StockSnapshot {
  const snapshot = movements.reduce(
    (stock, movement) => {
      switch (movement.type) {
        case "purchase_in":
        case "return_in":
          stock.onHand += movement.quantity;
          break;
        case "manual_adjustment":
          stock.onHand += movement.quantity;
          break;
        case "reserve":
          stock.reserved += movement.quantity;
          break;
        case "release_reservation":
          stock.reserved -= movement.quantity;
          break;
        case "ship":
          stock.onHand -= movement.quantity;
          stock.reserved -= movement.quantity;
          break;
        case "damage_out":
          stock.onHand -= movement.quantity;
          break;
        case "package_consume":
          stock.onHand -= movement.quantity;
          break;
        case "package_produce":
          stock.onHand += movement.quantity;
          break;
      }
      return stock;
    },
    { onHand: 0, reserved: 0 }
  );

  return { ...snapshot, available: snapshot.onHand - snapshot.reserved };
}

export function calculatePackagingReconciliation(batches: PackagingBatchInput[]): PackagingReconciliation {
  const totals = batches.reduce(
    (sum, batch) => ({
      rawUsedKg: sum.rawUsedKg + batch.rawKg,
      bagUsedKg: sum.bagUsedKg + batch.bagKg,
      finishedKg: sum.finishedKg + batch.finishedKg
    }),
    { rawUsedKg: 0, bagUsedKg: 0, finishedKg: 0 }
  );
  const expectedBagKg = totals.finishedKg - totals.rawUsedKg;
  return {
    ...totals,
    expectedBagKg,
    varianceKg: roundKg(totals.bagUsedKg - expectedBagKg)
  };
}

function roundKg(value: number): number {
  return Math.round(value * 1000) / 1000;
}
