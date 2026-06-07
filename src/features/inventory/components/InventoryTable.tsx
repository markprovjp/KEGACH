"use client";

import { EditOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, InputNumber, Modal, Progress, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { ImportExportButtons } from "@/components/ImportExportButtons";
import { tablePagination, type PageSizeValue } from "@/components/PageSizeControl";
import { TableOperationsBar } from "@/components/TableOperationsBar";
import type { CsvRow } from "@/lib/csv";
import { normalizeSearchText } from "@/lib/normalize";

type InventoryRow = {
  key: string;
  productId: string;
  sku: string;
  product: string;
  unit: string;
  isActive: boolean;
  onHand: number;
  reserved: number;
  lowStockThreshold: number;
  lastMovement: string;
  available: number;
};

const movementOptions = [
  { value: "purchase_in", label: "Nhập mua" },
  { value: "manual_adjustment", label: "Điều chỉnh tay" },
  { value: "reserve", label: "Giữ hàng" },
  { value: "release_reservation", label: "Xả giữ hàng" },
  { value: "ship", label: "Xuất giao" },
  { value: "return_in", label: "Nhập trả" },
  { value: "damage_out", label: "Hư hỏng/xuất bỏ" }
];

export function InventoryTable() {
  const { message } = App.useApp();
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<InventoryRow | null>(null);
  const [pageSize, setPageSize] = useState<PageSizeValue>(10);
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "reserved" | "out">("all");
  const [activeFilter, setActiveFilter] = useState<"active" | "hidden" | "all">("active");
  const [form] = Form.useForm<{ type: string; quantity: number; note: string }>();
  const movementType = Form.useWatch("type", form);

  useEffect(() => {
    setMounted(true);
    void loadInventory();
  }, []);

  const filteredRows = useMemo(() => {
    const normalized = normalizeSearchText(query);
    return rows.filter((row) => {
      const matchesText = !normalized || normalizeSearchText(`${row.product} ${row.unit} ${row.lastMovement}`).includes(normalized);
      const matchesActive = activeFilter === "all" || (activeFilter === "active" ? row.isActive !== false : row.isActive === false);
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && row.available <= row.lowStockThreshold) ||
        (stockFilter === "reserved" && row.reserved > 0) ||
        (stockFilter === "out" && row.available <= 0);
      return matchesText && matchesStock && matchesActive;
    });
  }, [activeFilter, rows, query, stockFilter]);
  const hasActiveFilters = Boolean(query.trim()) || stockFilter !== "all" || activeFilter !== "active";
  const exportRows = useMemo(() => filteredRows.map((row) => ({
    sku: row.sku,
    product: row.product,
    unit: row.unit,
    isActive: row.isActive === false ? "hidden" : "active",
    onHand: String(row.onHand),
    reserved: String(row.reserved),
    available: String(row.available),
    targetOnHand: String(row.onHand)
  })), [filteredRows]);

  const columns: ColumnsType<InventoryRow> = useMemo(
    () => [
      { title: "Sản phẩm", dataIndex: "product", fixed: "left", width: 260 },
      { title: "Bán hàng", dataIndex: "isActive", width: 110, render: (value) => value === false ? <Tag color="default">Đã ẩn</Tag> : <Tag color="green">Đang bán</Tag> },
      { title: "Tồn", dataIndex: "onHand", align: "right", width: 90 },
      { title: "Đã giữ", dataIndex: "reserved", align: "right", width: 90 },
      {
        title: "Khả dụng",
        dataIndex: "available",
        align: "right",
        width: 110,
        render: (value, row) => <Tag color={value <= row.lowStockThreshold ? "red" : "green"}>{value} {row.unit}</Tag>
      },
      {
        title: "Cảnh báo tồn thấp",
        dataIndex: "lowStockThreshold",
        width: 250,
        render: (value, row) => <Progress percent={Math.min(100, Math.round((row.available / Math.max(1, value)) * 100))} size="small" status={row.available <= value ? "exception" : "normal"} />
      },
      { title: "Biến động gần nhất", dataIndex: "lastMovement" },
      {
        title: "Thao tác",
        width: 130,
        render: (_, row) => (
          <Button size="small" icon={<EditOutlined />} onClick={() => openAdjustment(row)}>
            Điều chỉnh
          </Button>
        )
      }
    ],
    []
  );

  async function loadInventory() {
    setLoading(true);
    const response = await fetch("/api/inventory");
    setRows(await response.json());
    setLoading(false);
  }

  function openAdjustment(row: InventoryRow) {
    setEditing(row);
    form.setFieldsValue({ type: "manual_adjustment", quantity: 1, note: "" });
  }

  async function saveAdjustment() {
    if (!editing) return;
    const values = form.getFieldsValue();
    const quantity = Number(values.quantity ?? 0);
    if (quantity === 0 || (values.type !== "manual_adjustment" && quantity <= 0)) {
      message.error(values.type === "manual_adjustment" ? "Số lượng điều chỉnh không được bằng 0" : "Số lượng phải lớn hơn 0");
      return;
    }

    const response = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: editing.productId, type: values.type, quantity, note: values.note })
    });
    if (!response.ok) {
      message.error("Không cập nhật được tồn kho");
      return;
    }
    setRows(await response.json());
    setEditing(null);
    message.success("Đã lưu biến động tồn vào database");
  }

  async function importInventory(rowsToImport: CsvRow[]) {
    if (!rowsToImport.length) {
      message.warning("File Excel/CSV không có dữ liệu");
      return;
    }
    let updated = 0;
    for (const row of rowsToImport) {
      const sku = row.sku || row["Mã/SKU"];
      const name = row.product || row["Sản phẩm"];
      const targetText = row.targetOnHand || row.onHand || row["Tồn chuẩn"] || row["Tồn"];
      const targetOnHand = Number(String(targetText ?? "").replace(",", "."));
      if (!Number.isFinite(targetOnHand)) continue;
      const current = rows.find((item) => (sku && item.sku === sku) || (name && normalizeSearchText(item.product) === normalizeSearchText(name)));
      if (!current) continue;
      const delta = Math.round((targetOnHand - current.onHand) * 1000) / 1000;
      if (delta === 0) continue;
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: current.productId, type: "manual_adjustment", quantity: delta, note: "Import kiểm kho: đặt tồn chuẩn" })
      });
      if (response.ok) updated += 1;
    }
    await loadInventory();
    message.success(`Đã cập nhật tồn chuẩn cho ${updated} sản phẩm`);
  }

  if (!mounted) {
    return <div className="table-fallback">Đang tải bảng tồn kho...</div>;
  }

  return (
    <>
      <TableOperationsBar
        total={filteredRows.length}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Tìm sản phẩm, biến động..."
        filters={[{
          key: "active",
          label: "Bán hàng",
          value: activeFilter,
          defaultValue: "active",
          onChange: (value) => setActiveFilter(value as typeof activeFilter),
          options: [
            { value: "active", label: "Đang bán" },
            { value: "hidden", label: "Đã ẩn" },
            { value: "all", label: "Tất cả" }
          ]
        }, {
          key: "stock",
          label: "Tình trạng tồn",
          value: stockFilter,
          defaultValue: "all",
          onChange: (value) => setStockFilter(value as typeof stockFilter),
          options: [
            { value: "all", label: "Tất cả" },
            { value: "low", label: "Tồn thấp" },
            { value: "reserved", label: "Đang giữ" },
            { value: "out", label: "Hết khả dụng" }
          ]
        }]}
        onClearFilters={() => { setQuery(""); setStockFilter("all"); setActiveFilter("active"); }}
        clearDisabled={!hasActiveFilters}
        actions={(
          <>
            <Button icon={<ReloadOutlined />} onClick={loadInventory}>Tải lại</Button>
            <ImportExportButtons filename="ton-kho-kegach.csv" rows={exportRows} onImport={importInventory} />
          </>
        )}
      />
      <Table rowKey="key" size="small" loading={loading} columns={columns} dataSource={filteredRows} pagination={tablePagination(pageSize, filteredRows.length, setPageSize)} scroll={{ x: 1060 }} />
      <Modal title={`Điều chỉnh tồn: ${editing?.product ?? ""}`} open={!!editing} onCancel={() => setEditing(null)} onOk={saveAdjustment} okText="Lưu" cancelText="Đóng" okButtonProps={{ icon: <SaveOutlined /> }}>
        <Form form={form} layout="vertical">
          <Form.Item label="Loại biến động" name="type"><Select options={movementOptions} /></Form.Item>
          <Space.Compact style={{ width: "100%" }}>
            <Form.Item label={movementType === "manual_adjustment" ? "Số lượng cộng/trừ" : "Số lượng"} name="quantity" style={{ width: "50%" }}><InputNumber min={movementType === "manual_adjustment" ? undefined : 1} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Đơn vị" style={{ width: "50%" }}><Input value={editing?.unit} disabled /></Form.Item>
          </Space.Compact>
          <Form.Item label="Ghi chú" name="note"><Input placeholder="Ví dụ: nhập mua, xả giữ hàng HD..." /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
