export type InventoryMovementType =
  | "purchase_in"
  | "manual_adjustment"
  | "reserve"
  | "release_reservation"
  | "ship"
  | "return_in"
  | "damage_out";

export type InventoryMovementInput = {
  type: InventoryMovementType;
  quantity: number;
};

export type StockSnapshot = {
  onHand: number;
  reserved: number;
  available: number;
};
