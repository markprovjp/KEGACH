export type InventoryMovementType =
  | "purchase_in"
  | "manual_adjustment"
  | "reserve"
  | "release_reservation"
  | "ship"
  | "return_in"
  | "damage_out"
  | "package_consume"
  | "package_produce";

export type InventoryMovementInput = {
  type: InventoryMovementType;
  quantity: number;
};

export type StockSnapshot = {
  onHand: number;
  reserved: number;
  available: number;
};

export type PackagingBatchInput = {
  rawKg: number;
  bagKg: number;
  finishedKg: number;
};

export type PackagingReconciliation = {
  rawUsedKg: number;
  bagUsedKg: number;
  finishedKg: number;
  expectedBagKg: number;
  varianceKg: number;
};
