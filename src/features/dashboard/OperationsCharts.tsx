"use client";

import { Card, Empty, Progress, Typography } from "antd";
import type { OrderStatus } from "@/features/orders/order-status";
import { orderStatusLabels } from "@/features/orders/order-status";

type ChartOrder = {
  id: string;
  createdAt?: string;
  status: OrderStatus;
  codAmount: number;
};

const statusColors: Record<OrderStatus, string> = {
  draft: "#8c8c8c",
  awaiting_kiot: "#faad14",
  kiot_linked: "#1677ff",
  reserved: "#52c41a",
  packing: "#13c2c2",
  packed: "#722ed1",
  waiting_vehicle: "#fa8c16",
  scheduled: "#2f54eb",
  shipped: "#389e0d",
  delivered: "#237804",
  problem: "#f5222d",
  cancelled: "#595959",
  returned: "#ad6800"
};

export function OperationsCharts({ orders }: { orders: ChartOrder[] }) {
  const revenueByDay = buildCodByDay(orders);
  const maxRevenue = Math.max(1, ...revenueByDay.map((item) => item.value));
  const statusStats = buildStatusStats(orders);

  return (
    <div className="chart-grid">
      <Card title="COD theo ngày">
        {revenueByDay.length > 0 ? (
          <div className="bar-chart" aria-label="Biểu đồ COD theo ngày">
            {revenueByDay.map((item) => (
              <div key={item.label} className="bar-item">
                <div className="bar-value">{Math.round(item.value / 1000)}K</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${Math.max(12, (item.value / maxRevenue) * 100)}%` }} />
                </div>
                <div className="bar-label">{item.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đơn COD" />
        )}
      </Card>
      <Card title="Trạng thái vận hành">
        {statusStats.length > 0 ? (
          <div className="status-chart-list">
            {statusStats.map((item) => (
              <div key={item.status}>
                <div className="card-line">
                  <Typography.Text>{orderStatusLabels[item.status]}</Typography.Text>
                  <Typography.Text strong>{item.value}</Typography.Text>
                </div>
                <Progress percent={Math.round((item.value / orders.length) * 100)} strokeColor={statusColors[item.status]} showInfo={false} />
              </div>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đơn vận hành" />
        )}
      </Card>
    </div>
  );
}

function buildCodByDay(orders: ChartOrder[]) {
  const byDay = new Map<string, number>();
  for (const order of orders) {
    if (!order.createdAt || order.codAmount <= 0) continue;
    const label = new Date(order.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    byDay.set(label, (byDay.get(label) ?? 0) + order.codAmount);
  }
  return Array.from(byDay.entries()).map(([label, value]) => ({ label, value })).slice(-7);
}

function buildStatusStats(orders: ChartOrder[]) {
  const byStatus = new Map<OrderStatus, number>();
  for (const order of orders) byStatus.set(order.status, (byStatus.get(order.status) ?? 0) + 1);
  return Array.from(byStatus.entries()).map(([status, value]) => ({ status, value }));
}
