"use client";

import { Alert, Card, Col, Row, Statistic, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { tablePagination, type PageSizeValue } from "@/components/PageSizeControl";
import { TableOperationsBar } from "@/components/TableOperationsBar";
import { OperationsCharts } from "@/features/dashboard/OperationsCharts";
import type { OrderStatus } from "@/features/orders/order-status";
import { orderStatusLabels } from "@/features/orders/order-status";
import { normalizeSearchText } from "@/lib/normalize";

type OrderRow = {
  id: string;
  createdAt?: string;
  kiotInvoiceCode: string;
  customer: string;
  productSummary: string;
  status: OrderStatus;
  sendDate: string;
  codAmount: number;
  nextAction?: {
    title: string;
    phase: string;
    severity: "blocked" | "todo" | "done";
  };
};

const columns: ColumnsType<OrderRow> = [
  { title: "Hóa đơn Kiot", dataIndex: "kiotInvoiceCode", render: (value) => <b>{value}</b> },
  { title: "Khách", dataIndex: "customer" },
  { title: "Hàng", dataIndex: "productSummary" },
  { title: "Trạng thái", dataIndex: "status", render: (value: OrderStatus) => <Tag color="blue">{orderStatusLabels[value]}</Tag> },
  {
    title: "Việc cần làm",
    dataIndex: "nextAction",
    render: (value: OrderRow["nextAction"]) => value && value.severity !== "done" ? <Tag color={value.severity === "blocked" ? "red" : "gold"}>{value.title}</Tag> : <Tag color="green">Đủ</Tag>
  },
  { title: "Ngày gửi", dataIndex: "sendDate" },
  { title: "COD", dataIndex: "codAmount", align: "right", render: (value) => `${value.toLocaleString("vi-VN")}đ` }
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [openIssues, setOpenIssues] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState<PageSizeValue>(10);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    setMounted(true);
    fetch("/api/orders").then((response) => response.json()).then(setOrders).finally(() => setLoading(false));
    fetch("/api/reconciliation").then((response) => response.json()).then((rows) => setOpenIssues(rows.filter((row: { status: string }) => row.status === "open").length)).catch(() => setOpenIssues(0));
  }, []);

  const packingCount = orders.filter((order) => ["reserved", "packing", "packed"].includes(order.status)).length;
  const waitingVehicleCount = orders.filter((order) => ["waiting_vehicle", "scheduled"].includes(order.status)).length;
  const codTotal = orders.reduce((sum, order) => sum + order.codAmount, 0);
  const blockedCount = orders.filter((order) => order.nextAction?.severity === "blocked").length;
  const todoCount = orders.filter((order) => order.nextAction?.severity === "todo").length;
  const mustDoOrders = orders.filter((order) => order.nextAction && order.nextAction.severity !== "done").slice(0, 8);
  const statusOptions = useMemo(() => Array.from(new Set(orders.map((order) => order.status))).map((status) => ({ value: status, label: orderStatusLabels[status] })).sort((a, b) => String(a.label).localeCompare(String(b.label), "vi")), [orders]);
  const filteredOrders = useMemo(() => {
    const normalized = normalizeSearchText(query);
    return orders.filter((order) => {
      const matchesText = !normalized || normalizeSearchText(`${order.kiotInvoiceCode} ${order.customer} ${order.productSummary} ${orderStatusLabels[order.status]} ${order.nextAction?.title ?? ""}`).includes(normalized);
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [orders, query, statusFilter]);
  const hasActiveFilters = Boolean(query.trim()) || statusFilter !== "all";

  return (
    <main>
      <h1 className="page-title">Tổng quan vận hành</h1>
      <p className="page-subtitle">Kiot giữ hóa đơn, doanh thu, khách và công nợ. App này giữ tiến độ giao hàng, giữ tồn, COD và đối soát.</p>
      <Alert type="warning" showIcon title="Hệ thống sẽ nhắc việc cần làm ngay trên từng đơn và chặn chuyển trạng thái nếu thiếu bước bắt buộc." style={{ marginBottom: 14 }} />
      <Row gutter={[12, 12]}>
        <Col xs={12} lg={6}><Card><Statistic title="Đơn cần đóng" value={packingCount} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="Chờ xe" value={waitingVehicleCount} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="COD đang theo dõi" value={codTotal} suffix="đ" /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="Cần đối soát" value={openIssues} /></Card></Col>
      </Row>
      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col xs={12} lg={6}><Card><Statistic title="Bị chặn vì thiếu dữ liệu" value={blockedCount} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="Cần tick quy trình" value={todoCount} /></Card></Col>
        <Col xs={24} lg={12}>
          <Card title="Việc không được quên" size="small">
            <div className="must-do-list">
              {mustDoOrders.length ? mustDoOrders.map((order) => (
                <div key={order.id} className="must-do-item">
                  <b>{order.kiotInvoiceCode}</b>
                  <span>{order.customer}</span>
                  <Tag color={order.nextAction?.severity === "blocked" ? "red" : "gold"}>{order.nextAction?.title}</Tag>
                </div>
              )) : <div className="table-fallback">Không còn việc bắt buộc trước mắt.</div>}
            </div>
          </Card>
        </Col>
      </Row>
      <OperationsCharts orders={orders} />
      <Card title="Đơn đang chạy" style={{ marginTop: 14 }}>
        {mounted ? (
          <>
            <TableOperationsBar
              total={filteredOrders.length}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              searchValue={query}
              onSearchChange={setQuery}
              searchPlaceholder="Tìm hóa đơn, khách, hàng, việc cần làm"
              filters={[{ key: "status", label: "Trạng thái", value: statusFilter, defaultValue: "all", onChange: (value) => setStatusFilter(String(value)), showSearch: true, options: [{ value: "all", label: "Tất cả" }, ...statusOptions] }]}
              onClearFilters={() => { setQuery(""); setStatusFilter("all"); }}
              clearDisabled={!hasActiveFilters}
            />
            <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filteredOrders} pagination={tablePagination(pageSize, filteredOrders.length, setPageSize)} scroll={{ x: 900 }} />
          </>
        ) : <div className="table-fallback">Đang tải danh sách đơn...</div>}
      </Card>
    </main>
  );
}
