"use client";

import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { Alert, Button, Drawer, Form, Input, InputNumber, Segmented, Select, Space, Switch, Tabs, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { PageSizeControl, limitRows, type PageSizeValue } from "@/components/PageSizeControl";
import { canTransitionOrder, orderStatusLabels, orderStatuses } from "@/features/orders/order-status";
import { orderTypeLabels, paymentStatusLabels } from "@/features/orders/order-workflow";
import { WorkflowChecklist } from "@/features/orders/components/WorkflowChecklist";
import { KanbanColumn } from "./KanbanColumn";
import type { KanbanColumnDefinition, KanbanOrder } from "./kanban-types";

type CarrierOption = { id: string; name: string; phone: string; route: string };
type QuickFilter = "all" | "draft" | "stockShortage" | "needsPacking" | "waitingCarrier" | "cod" | "debt" | "problem";
type KanbanFormValues = KanbanOrder & { customerName?: string; customerPhone?: string };

const columns: KanbanColumnDefinition[] = [
  { status: "draft", title: "Đơn nháp" },
  { status: "awaiting_stock", title: "Chờ nhập hàng" },
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
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [statusFocus, setStatusFocus] = useState<string>("all");
  const [carrierFilter, setCarrierFilter] = useState<string>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [columnSize, setColumnSize] = useState<PageSizeValue>(30);
  const [compactCards, setCompactCards] = useState(true);
  const [editing, setEditing] = useState<KanbanOrder | null>(null);
  const [mounted, setMounted] = useState(false);
  const [form] = Form.useForm<KanbanFormValues>();
  const watchedEdit = Form.useWatch([], form) ?? {};

  const carrierOptions = useMemo(() => uniqueOptions([...carriers.map((carrier) => carrier.name), ...(orders.map((order) => order.carrierName).filter(Boolean) as string[])]), [carriers, orders]);
  const provinceOptions = useMemo(() => uniqueOptions(orders.map((order) => order.province).filter((province) => province && province !== "-") as string[]), [orders]);
  const visibleColumns = useMemo(() => statusFocus === "all" ? columns : columns.filter((column) => column.status === statusFocus), [statusFocus]);
  const filteredOrders = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return orders.filter((order) => {
      const matchesText = !normalized || `${order.kiotInvoiceCode} ${order.customer} ${order.phone} ${order.productSummary} ${order.carrierName ?? ""} ${order.province}`.toLowerCase().includes(normalized);
      const matchesCarrier = carrierFilter === "all" || order.carrierName === carrierFilter;
      const matchesProvince = provinceFilter === "all" || order.province === provinceFilter;
      return matchesText && matchesCarrier && matchesProvince && matchesQuickFilter(order, quickFilter);
    });
  }, [orders, query, carrierFilter, provinceFilter, quickFilter]);
  const grouped = useMemo(() => new Map(columns.map((column) => [column.status, filteredOrders.filter((order) => order.status === column.status)])), [filteredOrders]);
  const boardStats = useMemo(() => ({
    total: filteredOrders.length,
    drafts: filteredOrders.filter((order) => order.status === "draft").length,
    stockShortage: filteredOrders.filter((order) => order.status === "awaiting_stock" || order.warnings.some((warning) => warning.includes("Thiếu hàng"))).length,
    needsPacking: filteredOrders.filter((order) => ["reserved", "packing", "packed"].includes(order.status)).length,
    waitingCarrier: filteredOrders.filter((order) => !order.carrierName || order.status === "waiting_vehicle").length,
    cod: filteredOrders.filter((order) => order.codAmount > 0).length,
    problem: filteredOrders.filter((order) => order.status === "problem").length
  }), [filteredOrders]);

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
    form.setFieldsValue({ ...order, kiotInvoiceCode: order.kiotInvoiceCode === "Chưa gắn Kiot" ? "" : order.kiotInvoiceCode, customerName: order.customer, customerPhone: order.phone });
  }

  async function saveEditing() {
    if (!editing) return;
    const values = form.getFieldsValue();
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

  function clearFilters() {
    setQuery("");
    setQuickFilter("all");
    setStatusFocus("all");
    setCarrierFilter("all");
    setProvinceFilter("all");
  }

  if (!mounted) {
    return (
      <div className="kanban-scroll">
        {visibleColumns.map((column) => (
          <section key={column.status} className="kanban-column">
            <div className="card-line kanban-column-title">
              <b>{column.title}</b>
              <span>{grouped.get(column.status)?.length ?? 0}</span>
            </div>
          </section>
        ))}
      </div>
    );
  }

  const board = (
    <DndContext onDragEnd={onDragEnd}>
      <div className="kanban-scroll">
        {visibleColumns.map((column) => {
          const columnOrders = grouped.get(column.status) ?? [];
          return <KanbanColumn key={column.status} column={column} orders={limitRows(columnOrders, columnSize)} totalCount={columnOrders.length} onEdit={openEdit} onDelete={deleteOrder} compact={compactCards} />;
        })}
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
      <div className="kanban-summary-strip">
        <div className="kanban-summary-card"><span>Tổng đang xem</span><b>{boardStats.total}</b></div>
        <div className="kanban-summary-card"><span>Đơn nháp</span><b>{boardStats.drafts}</b></div>
        <div className="kanban-summary-card"><span>Thiếu hàng</span><b>{boardStats.stockShortage}</b></div>
        <div className="kanban-summary-card"><span>Cần đóng</span><b>{boardStats.needsPacking}</b></div>
        <div className="kanban-summary-card"><span>Chưa/chờ xe</span><b>{boardStats.waitingCarrier}</b></div>
        <div className="kanban-summary-card"><span>COD</span><b>{boardStats.cod}</b></div>
        <div className="kanban-summary-card"><span>Có vấn đề</span><b>{boardStats.problem}</b></div>
      </div>
      <div className="kanban-ops-panel">
        <div>
          <div className="kanban-filter-grid">
            <Input placeholder="Tìm hóa đơn, khách, SĐT, hàng, nhà xe, tỉnh" value={query} onChange={(event) => setQuery(event.target.value)} />
            <Select value={statusFocus} onChange={setStatusFocus} options={[{ value: "all", label: "Tất cả trạng thái" }, ...orderStatuses.map((status) => ({ value: status, label: orderStatusLabels[status] }))]} />
            <Select showSearch value={carrierFilter} onChange={setCarrierFilter} optionFilterProp="label" options={[{ value: "all", label: "Tất cả nhà xe" }, ...carrierOptions]} />
            <Select showSearch value={provinceFilter} onChange={setProvinceFilter} optionFilterProp="label" options={[{ value: "all", label: "Tất cả tỉnh" }, ...provinceOptions]} />
          </div>
          <div className="kanban-quick-row">
            <Segmented
              size="small"
              value={quickFilter}
              onChange={(value) => setQuickFilter(value as QuickFilter)}
              options={[
                { value: "all", label: "Tất cả" },
                { value: "draft", label: "Đơn nháp" },
                { value: "stockShortage", label: "Thiếu hàng" },
                { value: "needsPacking", label: "Cần đóng" },
                { value: "waitingCarrier", label: "Chưa/chờ xe" },
                { value: "cod", label: "COD" },
                { value: "debt", label: "Công nợ" },
                { value: "problem", label: "Có vấn đề" }
              ]}
            />
            <Button onClick={clearFilters}>Xóa lọc</Button>
            <Switch checked={compactCards} onChange={setCompactCards} checkedChildren="Gọn" unCheckedChildren="Đầy đủ" />
          </div>
        </div>
        <div>
          <PageSizeControl total={filteredOrders.length} value={columnSize} onChange={setColumnSize} noun="đơn/cột" />
          <Button onClick={loadOrders}>Tải lại</Button>
        </div>
      </div>
      {board}
      <Drawer
        title={`Sửa đơn ${editing?.kiotInvoiceCode ?? ""}`}
        open={!!editing}
        onClose={() => setEditing(null)}
        size={780}
        extra={(
          <Space>
            <Button onClick={() => setEditing(null)}>Đóng</Button>
            <Button type="primary" onClick={saveEditing}>Lưu</Button>
          </Space>
        )}
      >
        <Form form={form} layout="vertical">
          <Tabs
            className="order-edit-tabs"
            items={[
              {
                key: "main",
                label: "Chính",
                children: (
                  <div className="form-grid compact-form-grid">
                    <Form.Item label="Hóa đơn Kiot" name="kiotInvoiceCode"><Input /></Form.Item>
                    <Form.Item label="Trạng thái" name="status"><Select options={orderStatuses.map((status) => ({ value: status, label: orderStatusLabels[status] }))} /></Form.Item>
                    <Form.Item label="Loại đơn" name="orderType"><Select options={Object.entries(orderTypeLabels).map(([value, label]) => ({ value, label }))} /></Form.Item>
                    <Form.Item label="Loại phiếu" name="isOfficial"><Select options={[{ value: false, label: "Đơn nháp" }, { value: true, label: "Đơn chính thức" }]} /></Form.Item>
                    <Form.Item label="Tên khách" name="customerName"><Input /></Form.Item>
                    <Form.Item label="SĐT" name="customerPhone"><Input /></Form.Item>
                    <Form.Item label="Tỉnh/địa bàn" name="province"><Input /></Form.Item>
                    <Form.Item label="Trạng thái thanh toán" name="paymentStatus"><Select options={Object.entries(paymentStatusLabels).map(([value, label]) => ({ value, label }))} /></Form.Item>
                    <Form.Item label="Người nhận cuối" name="receiverName"><Input placeholder="Để trống nếu trùng người đặt" /></Form.Item>
                    <Form.Item label="SĐT người nhận" name="receiverPhone"><Input /></Form.Item>
                    <Form.Item label="Địa chỉ người nhận" name="receiverAddress"><Input /></Form.Item>
                  </div>
                )
              },
              {
                key: "delivery",
                label: "Giao/COD",
                children: (
                  <div className="form-grid compact-form-grid">
                    <Form.Item label="Địa chỉ giao/COD" name="customerAddress"><Input /></Form.Item>
                    <Form.Item label="Loại thanh toán" name="paymentKind"><Select options={[{ value: "debt", label: "Ghi nợ / chưa trả" }, { value: "cod", label: "Gửi COD" }]} /></Form.Item>
                    <Form.Item label="Tiền COD" name="codAmount"><InputNumber min={0} step={10000} style={{ width: "100%" }} /></Form.Item>
                    <Form.Item label="Loại gửi" name="deliveryMode"><Select options={[{ value: "truck_share", label: "Xe tải ghép / nhà xe" }, { value: "direct_truck", label: "Xe tải riêng / giao thẳng" }]} /></Form.Item>
                    <Form.Item label="Cước" name="freightPayer"><Select options={[{ value: "customer", label: "Khách trả" }, { value: "company", label: "Cơ sở trả" }]} /></Form.Item>
                    <Form.Item label="Nhà xe" name="carrierName"><Select showSearch allowClear optionFilterProp="label" options={carriers.map((carrier) => ({ value: carrier.name, label: `${carrier.name} - ${carrier.route}` }))} /></Form.Item>
                    <Form.Item label="Tài xế / ghi chú giao" name="driverName"><Input /></Form.Item>
                    <Form.Item label="Số kiện" name="packageCount"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
                    <Form.Item label="Khối lượng ước tính" name="estimatedWeightKg"><InputNumber min={0} step={0.1} style={{ width: "100%" }} /></Form.Item>
                  </div>
                )
              },
              {
                key: "workflow",
                label: "Checklist",
                children: (
                  <Form.Item name="workflowChecks" noStyle>
                    <WorkflowChecklist
                      order={{
                        status: watchedEdit.status,
                        orderType: watchedEdit.orderType,
                        isOfficial: watchedEdit.isOfficial,
                        kiotInvoiceCode: watchedEdit.kiotInvoiceCode,
                        customerName: watchedEdit.customerName,
                        customerPhone: watchedEdit.customerPhone,
                        customerAddress: watchedEdit.customerAddress,
                        receiverName: watchedEdit.receiverName,
                        receiverPhone: watchedEdit.receiverPhone,
                        receiverAddress: watchedEdit.receiverAddress,
                        codAmount: watchedEdit.codAmount,
                        paymentStatus: watchedEdit.paymentStatus,
                        carrierName: watchedEdit.carrierName,
                        deliveryMode: watchedEdit.deliveryMode,
                        packageCount: watchedEdit.packageCount,
                        estimatedWeightKg: watchedEdit.estimatedWeightKg
                      }}
                    />
                  </Form.Item>
                )
              },
              {
                key: "note",
                label: "Ghi chú",
                children: <Form.Item label="Ghi chú" name="note"><Input.TextArea rows={6} /></Form.Item>
              }
            ]}
          />
        </Form>
      </Drawer>
    </div>
  );
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "vi")).map((value) => ({ value, label: value }));
}

function matchesQuickFilter(order: KanbanOrder, filter: QuickFilter) {
  if (filter === "draft") return order.status === "draft";
  if (filter === "stockShortage") return order.status === "awaiting_stock" || order.warnings.some((warning) => warning.includes("Thiếu hàng"));
  if (filter === "needsPacking") return ["reserved", "packing", "packed"].includes(order.status);
  if (filter === "waitingCarrier") return !order.carrierName || order.status === "waiting_vehicle";
  if (filter === "cod") return order.codAmount > 0;
  if (filter === "debt") return order.paymentKind === "debt" || order.codAmount <= 0;
  if (filter === "problem") return order.status === "problem";
  return true;
}
