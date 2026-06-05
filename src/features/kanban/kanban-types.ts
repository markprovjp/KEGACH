import type { OrderStatus } from "@/features/orders/order-status";

export type KanbanOrder = {
  id: string;
  code: string;
  kiotInvoiceCode: string;
  customer: string;
  phone: string;
  productSummary: string;
  total: number;
  codAmount: number;
  province: string;
  sendDate: string;
  driver?: string;
  carrierName?: string;
  driverName?: string;
  warnings: string[];
  status: OrderStatus;
  paymentKind?: string;
  deliveryMode?: string;
  freightPayer?: string;
  packageCount?: number;
  estimatedWeightKg?: number;
  note?: string;
};

export type KanbanColumnDefinition = {
  status: OrderStatus;
  title: string;
};
