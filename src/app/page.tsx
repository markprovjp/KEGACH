"use client";

import { Alert, Card, Col, Row, Statistic, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { OperationsCharts } from "@/features/dashboard/OperationsCharts";
import type { OrderStatus } from "@/features/orders/order-status";
import { orderStatusLabels } from "@/features/orders/order-status";

type OrderRow = {
  id: string;
  createdAt?: string;
  kiotInvoiceCode: string;
  customer: string;
  productSummary: string;
  status: OrderStatus;
  sendDate: string;
  codAmount: number;
};

const columns: ColumnsType<OrderRow> = [
  { title: "Hóa đơn Kiot", dataIndex: "kiotInvoiceCode", render: (value) => <b>{value}</b> },
  { title: "Khách", dataIndex: "customer" },
  { title: "Hàng", dataIndex: "productSummary" },
  { title: "Trạng thái", dataIndex: "status", render: (value: OrderStatus) => <Tag color="blue">{orderStatusLabels[value]}</Tag> },
  { title: "Ngày gửi", dataIndex: "sendDate" },
  { title: "COD", dataIndex: "codAmount", align: "right", render: (value) => `${value.toLocaleString("vi-VN")}đ` }
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [openIssues, setOpenIssues] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetch("/api/orders").then((response) => response.json()).then(setOrders).finally(() => setLoading(false));
    fetch("/api/reconciliation").then((response) => response.json()).then((rows) => setOpenIssues(rows.filter((row: { status: string }) => row.status === "open").length)).catch(() => setOpenIssues(0));
  }, []);

  const packingCount = orders.filter((order) => ["reserved", "packing", "packed"].includes(order.status)).length;
  const waitingVehicleCount = orders.filter((order) => ["waiting_vehicle", "scheduled"].includes(order.status)).length;
  const codTotal = orders.reduce((sum, order) => sum + order.codAmount, 0);

  return (
    <main>
      <h1 className="page-title">Tổng quan vận hành</h1>
      <p className="page-subtitle">Kiot giữ hóa đơn, doanh thu, khách và công nợ. App này giữ tiến độ giao hàng, giữ tồn, COD và đối soát.</p>
      <Alert type="warning" showIcon title="Mỗi card phải có mã hóa đơn Kiot như HD004066 trước khi đối soát ngày." style={{ marginBottom: 14 }} />
      <Row gutter={[12, 12]}>
        <Col xs={12} lg={6}><Card><Statistic title="Đơn cần đóng" value={packingCount} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="Chờ xe" value={waitingVehicleCount} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="COD đang theo dõi" value={codTotal} suffix="đ" /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="Cần đối soát" value={openIssues} /></Card></Col>
      </Row>
      <OperationsCharts orders={orders} />
      <Card title="Đơn đang chạy" style={{ marginTop: 14 }}>
        {mounted ? <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={orders} pagination={false} scroll={{ x: 900 }} /> : <div className="table-fallback">Đang tải danh sách đơn...</div>}
      </Card>
    </main>
  );
}
