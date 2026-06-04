"use client";

import { Alert, Card, Col, Row, Statistic, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { sampleOrders } from "@/lib/sample-data";

const columns: ColumnsType<(typeof sampleOrders)[number]> = [
  { title: "Hoa don Kiot", dataIndex: "kiotInvoiceCode", render: (value) => <b>{value}</b> },
  { title: "Khach", dataIndex: "customer" },
  { title: "Hang", dataIndex: "productSummary" },
  { title: "Trang thai", dataIndex: "status", render: (value) => <Tag color="blue">{value}</Tag> },
  { title: "Ngay gui", dataIndex: "sendDate" },
  { title: "COD", dataIndex: "codAmount", align: "right", render: (value) => `${value.toLocaleString("vi-VN")}d` }
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main>
      <h1 className="page-title">Tong quan van hanh</h1>
      <p className="page-subtitle">Kiot giu hoa don, doanh thu, khach va cong no. App nay giu tien do giao hang, giu ton, COD va doi soat.</p>
      <Alert type="warning" showIcon message="Moi card phai co ma hoa don Kiot nhu HD004066 truoc khi doi soat ngay." style={{ marginBottom: 14 }} />
      <Row gutter={[12, 12]}>
        <Col xs={12} lg={6}><Card><Statistic title="Don can dong" value={5} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="Cho xe" value={3} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="COD hom nay" value={516000} suffix="d" /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="Can doi soat" value={3} /></Card></Col>
      </Row>
      <Card title="Don dang chay" style={{ marginTop: 14 }}>
        {mounted ? <Table rowKey="id" size="small" columns={columns} dataSource={sampleOrders} pagination={false} scroll={{ x: 900 }} /> : <div className="table-fallback">Dang tai danh sach don...</div>}
      </Card>
    </main>
  );
}
