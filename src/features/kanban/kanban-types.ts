import type { OrderStatus } from "@/features/orders/order-status";

export type KanbanOrder = {
  id: string;
  kiotInvoiceCode: string;
  customer: string;
  phone: string;
  productSummary: string;
  total: number;
  codAmount: number;
  province: string;
  sendDate: string;
  driver?: string;
  warnings: string[];
  status: OrderStatus;
};

export type KanbanColumnDefinition = {
  status: OrderStatus;
  title: string;
};
