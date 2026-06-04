import type { InventoryMovementInput, InventoryMovementType, StockSnapshot } from "./inventory-types";

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
      }
      return stock;
    },
    { onHand: 0, reserved: 0 }
  );

  return { ...snapshot, available: snapshot.onHand - snapshot.reserved };
}
