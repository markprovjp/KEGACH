"use client";

import { Alert, Card, Col, Row, Statistic, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { OperationsCharts } from "@/features/dashboard/OperationsCharts";
import type { OrderStatus } from "@/features/orders/order-status";
import { orderStatusLabels } from "@/features/orders/order-status";
import { sampleOrders } from "@/lib/sample-data";

const columns: ColumnsType<(typeof sampleOrders)[number]> = [
  { title: "Hóa đơn Kiot", dataIndex: "kiotInvoiceCode", render: (value) => <b>{value}</b> },
  { title: "Khách", dataIndex: "customer" },
  { title: "Hàng", dataIndex: "productSummary" },
  { title: "Trạng thái", dataIndex: "status", render: (value: OrderStatus) => <Tag color="blue">{orderStatusLabels[value]}</Tag> },
  { title: "Ngày gửi", dataIndex: "sendDate" },
  { title: "COD", dataIndex: "codAmount", align: "right", render: (value) => `${value.toLocaleString("vi-VN")}đ` }
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main>
      <h1 className="page-title">Tổng quan vận hành</h1>
      <p className="page-subtitle">Kiot giữ hóa đơn, doanh thu, khách và công nợ. App này giữ tiến độ giao hàng, giữ tồn, COD và đối soát.</p>
      <Alert type="warning" showIcon title="Mỗi card phải có mã hóa đơn Kiot như HD004066 trước khi đối soát ngày." style={{ marginBottom: 14 }} />
      <Row gutter={[12, 12]}>
        <Col xs={12} lg={6}><Card><Statistic title="Đơn cần đóng" value={5} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="Chờ xe" value={3} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="COD hôm nay" value={516000} suffix="đ" /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="Cần đối soát" value={3} /></Card></Col>
      </Row>
      <OperationsCharts />
      <Card title="Đơn đang chạy" style={{ marginTop: 14 }}>
        {mounted ? <Table rowKey="id" size="small" columns={columns} dataSource={sampleOrders} pagination={false} scroll={{ x: 900 }} /> : <div className="table-fallback">Đang tải danh sách đơn...</div>}
      </Card>
    </main>
  );
}
