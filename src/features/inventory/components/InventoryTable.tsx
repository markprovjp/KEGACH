"use client";

import { EditOutlined, ReloadOutlined, SaveOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Modal, Progress, Select, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { PageSizeControl, tablePagination, type PageSizeValue } from "@/components/PageSizeControl";
import { normalizeSearchText } from "@/lib/normalize";

type InventoryRow = {
  key: string;
  productId: string;
  product: string;
  unit: string;
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
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<InventoryRow | null>(null);
  const [pageSize, setPageSize] = useState<PageSizeValue>(10);
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "reserved" | "out">("all");
  const [form] = Form.useForm<{ type: string; quantity: number; note: string }>();

  useEffect(() => {
    setMounted(true);
    void loadInventory();
  }, []);

  const filteredRows = useMemo(() => {
    const normalized = normalizeSearchText(query);
    return rows.filter((row) => {
      const matchesText = !normalized || normalizeSearchText(`${row.product} ${row.unit} ${row.lastMovement}`).includes(normalized);
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && row.available <= row.lowStockThreshold) ||
        (stockFilter === "reserved" && row.reserved > 0) ||
        (stockFilter === "out" && row.available <= 0);
      return matchesText && matchesStock;
    });
  }, [rows, query, stockFilter]);

  const columns: ColumnsType<InventoryRow> = useMemo(
    () => [
      { title: "Sản phẩm", dataIndex: "product", fixed: "left", width: 260 },
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
    if (quantity <= 0) {
      message.error("Số lượng phải lớn hơn 0");
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

  if (!mounted) {
    return <div className="table-fallback">Đang tải bảng tồn kho...</div>;
  }

  return (
    <>
      <div className="table-toolbar">
        <Space wrap>
          <Input prefix={<SearchOutlined />} placeholder="Tìm sản phẩm, biến động..." value={query} onChange={(event) => setQuery(event.target.value)} style={{ width: 300 }} />
          <Select
            value={stockFilter}
            onChange={setStockFilter}
            style={{ width: 160 }}
            options={[
              { value: "all", label: "Tất cả tồn" },
              { value: "low", label: "Tồn thấp" },
              { value: "reserved", label: "Đang giữ" },
              { value: "out", label: "Hết khả dụng" }
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={loadInventory}>Tải lại</Button>
        </Space>
        <PageSizeControl total={filteredRows.length} value={pageSize} onChange={setPageSize} />
      </div>
      <Table rowKey="key" size="small" loading={loading} columns={columns} dataSource={filteredRows} pagination={tablePagination(pageSize, filteredRows.length)} scroll={{ x: 1050 }} />
      <Modal title={`Điều chỉnh tồn: ${editing?.product ?? ""}`} open={!!editing} onCancel={() => setEditing(null)} onOk={saveAdjustment} okText="Lưu" cancelText="Đóng" okButtonProps={{ icon: <SaveOutlined /> }}>
        <Form form={form} layout="vertical">
          <Form.Item label="Loại biến động" name="type"><Select options={movementOptions} /></Form.Item>
          <Space.Compact style={{ width: "100%" }}>
            <Form.Item label="Số lượng" name="quantity" style={{ width: "50%" }}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Đơn vị" style={{ width: "50%" }}><Input value={editing?.unit} disabled /></Form.Item>
          </Space.Compact>
          <Form.Item label="Ghi chú" name="note"><Input placeholder="Ví dụ: nhập mua, xả giữ hàng HD..." /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
