"use client";

import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { Alert, Button, Form, Input, InputNumber, Modal, Select, Space, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { canTransitionOrder, orderStatusLabels, orderStatuses } from "@/features/orders/order-status";
import { KanbanColumn } from "./KanbanColumn";
import type { KanbanColumnDefinition, KanbanOrder } from "./kanban-types";

type CarrierOption = { id: string; name: string; phone: string; route: string };

const columns: KanbanColumnDefinition[] = [
  { status: "awaiting_kiot", title: "Chờ HĐ Kiot" },
  { status: "kiot_linked", title: "Đã gắn Kiot" },
  { status: "reserved", title: "Đã giữ hàng" },
  { status: "packing", title: "Đang đóng" },
  { status: "packed", title: "Đóng xong" },
  { status: "waiting_vehicle", title: "Chờ xe" },
  { status: "scheduled", title: "Đã xếp lịch" },
  { status: "shipped", title: "Đã gửi" },
  { status: "problem", title: "Có vấn đề" }
];

export function KanbanBoard() {
  const [orders, setOrders] = useState<KanbanOrder[]>([]);
  const [carriers, setCarriers] = useState<CarrierOption[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<KanbanOrder | null>(null);
  const [mounted, setMounted] = useState(false);
  const [form] = Form.useForm<KanbanOrder>();
  const filteredOrders = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return orders;
    return orders.filter((order) => `${order.kiotInvoiceCode} ${order.customer} ${order.phone} ${order.productSummary} ${order.carrierName ?? ""}`.toLowerCase().includes(normalized));
  }, [orders, query]);
  const grouped = useMemo(() => new Map(columns.map((column) => [column.status, filteredOrders.filter((order) => order.status === column.status)])), [filteredOrders]);

  useEffect(() => {
    setMounted(true);
    void loadOrders();
    fetch("/api/carriers").then((response) => response.json()).then(setCarriers);
  }, []);

  async function loadOrders() {
    const response = await fetch("/api/orders");
    setOrders(await response.json());
  }

  async function onDragEnd(event: DragEndEvent) {
    const orderId = String(event.active.id);
    const nextStatus = event.over?.id;
    if (!nextStatus) return;

    const order = orders.find((item) => item.id === orderId);
    if (!order) return;

    if (!canTransitionOrder(order.status, nextStatus as KanbanOrder["status"])) {
      message.warning(`Không thể chuyển ${order.kiotInvoiceCode} từ ${orderStatusLabels[order.status]} sang ${orderStatusLabels[nextStatus as KanbanOrder["status"]]}`);
      return;
    }

    await saveOrder({ ...order, status: nextStatus as KanbanOrder["status"] }, false);
  }

  function openEdit(order: KanbanOrder) {
    setEditing(order);
    form.setFieldsValue({ ...order, kiotInvoiceCode: order.kiotInvoiceCode === "Chưa gắn Kiot" ? "" : order.kiotInvoiceCode, customerName: order.customer, customerPhone: order.phone } as KanbanOrder & { customerName: string; customerPhone: string });
  }

  async function saveEditing() {
    if (!editing) return;
    const values = form.getFieldsValue() as KanbanOrder & { customerName?: string; customerPhone?: string };
    const saved = await saveOrder({ ...editing, ...values, customer: values.customerName ?? editing.customer, phone: values.customerPhone ?? editing.phone }, true);
    if (saved) setEditing(null);
  }

  async function saveOrder(order: KanbanOrder, showSuccess: boolean) {
    const response = await fetch(`/api/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...order, kiotInvoiceCode: order.kiotInvoiceCode === "Chưa gắn Kiot" ? null : order.kiotInvoiceCode, customerName: order.customer, customerPhone: order.phone })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Không lưu được đơn" }));
      message.error(error.error ?? "Không lưu được đơn");
      return false;
    }
    const saved = await response.json();
    setOrders((current) => current.map((item) => (item.id === saved.id ? saved : item)));
    if (showSuccess) message.success("Đã cập nhật đơn hàng");
    return true;
  }

  async function deleteOrder(order: KanbanOrder) {
    const response = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Không xóa được đơn" }));
      message.error(error.error ?? "Không xóa được đơn");
      return;
    }
    setOrders((current) => current.filter((item) => item.id !== order.id));
    message.success("Đã xóa đơn hàng");
  }

  if (!mounted) {
    return (
      <div className="kanban-scroll">
        {columns.map((column) => (
          <section key={column.status} className="kanban-column">
            <div className="card-line kanban-column-title">
              <b>{column.title}</b>
              <span>{grouped.get(column.status)?.length ?? 0}</span>
            </div>
            {(grouped.get(column.status) ?? []).map((order) => (
              <div key={order.id} className="kanban-card static-card">
                <div className="card-line"><b>{order.kiotInvoiceCode}</b><span>{order.codAmount > 0 ? "COD" : "Công nợ"}</span></div>
                <div>{order.customer}</div>
                <div className="muted">{order.productSummary}</div>
              </div>
            ))}
          </section>
        ))}
      </div>
    );
  }

  const board = (
    <DndContext onDragEnd={onDragEnd}>
      <div className="kanban-scroll">
        {columns.map((column) => (
          <KanbanColumn key={column.status} column={column} orders={grouped.get(column.status) ?? []} onEdit={openEdit} onDelete={deleteOrder} />
        ))}
      </div>
    </DndContext>
  );

  return (
    <div>
      <Alert
        type="info"
        showIcon
        title="Kanban chỉ đổi trạng thái vận hành. Hóa đơn, doanh thu, khách và công nợ vẫn đối soát trên Kiot."
        style={{ marginBottom: 12 }}
      />
      <div className="section-toolbar">
        <Space.Compact style={{ width: 520 }}>
          <Input placeholder="Tìm hóa đơn, khách, SĐT, hàng, nhà xe" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button onClick={() => setQuery("")}>Xóa</Button>
        </Space.Compact>
        <Button onClick={loadOrders}>Tải lại</Button>
      </div>
      {board}
      <Modal title={`Sửa đơn ${editing?.kiotInvoiceCode ?? ""}`} open={!!editing} onCancel={() => setEditing(null)} onOk={saveEditing} okText="Lưu" cancelText="Đóng" width={720}>
        <Form form={form} layout="vertical">
          <div className="form-grid">
            <Form.Item label="Hóa đơn Kiot" name="kiotInvoiceCode"><Input /></Form.Item>
            <Form.Item label="Trạng thái" name="status"><Select options={orderStatuses.map((status) => ({ value: status, label: orderStatusLabels[status] }))} /></Form.Item>
            <Form.Item label="Tên khách" name="customerName"><Input /></Form.Item>
            <Form.Item label="SĐT" name="customerPhone"><Input /></Form.Item>
            <Form.Item label="Tỉnh/địa bàn" name="province"><Input /></Form.Item>
            <Form.Item label="Loại thanh toán" name="paymentKind"><Select options={[{ value: "debt", label: "Ghi nợ / chưa trả" }, { value: "cod", label: "Gửi COD" }]} /></Form.Item>
            <Form.Item label="Tiền COD" name="codAmount"><InputNumber min={0} step={10000} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Loại gửi" name="deliveryMode"><Select options={[{ value: "truck_share", label: "Xe tải ghép / nhà xe" }, { value: "direct_truck", label: "Xe tải riêng / giao thẳng" }]} /></Form.Item>
            <Form.Item label="Cước" name="freightPayer"><Select options={[{ value: "customer", label: "Khách trả" }, { value: "company", label: "Cơ sở trả" }]} /></Form.Item>
            <Form.Item label="Nhà xe" name="carrierName"><Select showSearch allowClear optionFilterProp="label" options={carriers.map((carrier) => ({ value: carrier.name, label: `${carrier.name} - ${carrier.route}` }))} /></Form.Item>
            <Form.Item label="Tài xế / ghi chú giao" name="driverName"><Input /></Form.Item>
            <Form.Item label="Số kiện" name="packageCount"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Khối lượng ước tính" name="estimatedWeightKg"><InputNumber min={0} step={0.1} style={{ width: "100%" }} /></Form.Item>
          </div>
          <Form.Item label="Ghi chú" name="note"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
