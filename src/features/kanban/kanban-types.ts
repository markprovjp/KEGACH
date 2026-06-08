import type { OrderStatus } from "@/features/orders/order-status";

export type KanbanOrder = {
  id: string;
  code: string;
  kiotInvoiceCode: string;
  customer: string;
  phone: string;
  customerAddress?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  productSummary: string;
  fulfillment?: Array<{
    productId: string;
    productName: string;
    unit: string;
    requested: number;
    fulfillable: number;
    waiting: number;
  }>;
  total: number;
  codAmount: number;
  province: string;
  sendDate: string;
  driver?: string;
  carrierName?: string;
  driverName?: string;
  warnings: string[];
  status: OrderStatus;
  orderType?: string;
  isOfficial?: boolean;
  paymentKind?: string;
  paymentStatus?: string;
  deliveryMode?: string;
  freightPayer?: string;
  packageCount?: number;
  estimatedWeightKg?: number;
  note?: string;
  workflowChecks?: string[];
  workflowMissing?: string[];
  nextAction?: {
    title: string;
    phase: string;
    severity: "blocked" | "todo" | "done";
  };
};

export type KanbanColumnDefinition = {
  status: OrderStatus;
  title: string;
};
