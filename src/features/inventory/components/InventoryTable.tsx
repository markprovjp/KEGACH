"use client";

import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Modal, Progress, Select, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { inventorySeeds } from "@/lib/sample-data";

type InventoryRow = (typeof inventorySeeds)[number] & {
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
  const [rows, setRows] = useState(() => inventorySeeds.map(toRow));
  const [editing, setEditing] = useState<InventoryRow | null>(null);
  const [form] = Form.useForm<{ type: string; quantity: number; note: string }>();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  function openAdjustment(row: InventoryRow) {
    setEditing(row);
    form.setFieldsValue({ type: "manual_adjustment", quantity: 1, note: "" });
  }

  function saveAdjustment() {
    if (!editing) return;
    const values = form.getFieldsValue();
    const quantity = Number(values.quantity ?? 0);
    if (quantity <= 0) {
      message.error("Số lượng phải lớn hơn 0");
      return;
    }

    setRows((current) => current.map((row) => (row.key === editing.key ? applyMovement(row, values.type, quantity, values.note) : row)));
    setEditing(null);
    message.success("Đã cập nhật tồn khả dụng");
  }

  if (!mounted) {
    return <div className="table-fallback">Đang tải bảng tồn kho...</div>;
  }

  return (
    <>
      <Table rowKey="key" size="small" columns={columns} dataSource={rows} pagination={{ pageSize: 10 }} scroll={{ x: 1050 }} />
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

function toRow(seed: (typeof inventorySeeds)[number]): InventoryRow {
  return { ...seed, available: seed.onHand - seed.reserved };
}

function applyMovement(row: InventoryRow, type: string, quantity: number, note?: string): InventoryRow {
  const next = { ...row };
  if (["purchase_in", "return_in", "manual_adjustment"].includes(type)) next.onHand += quantity;
  if (type === "reserve") next.reserved += quantity;
  if (type === "release_reservation") next.reserved = Math.max(0, next.reserved - quantity);
  if (type === "ship") {
    next.onHand = Math.max(0, next.onHand - quantity);
    next.reserved = Math.max(0, next.reserved - quantity);
  }
  if (type === "damage_out") next.onHand = Math.max(0, next.onHand - quantity);
  next.available = next.onHand - next.reserved;
  next.lastMovement = `${movementOptions.find((item) => item.value === type)?.label ?? type} ${quantity} ${row.unit}${note ? ` - ${note}` : ""}`;
  return next;
}
