"use client";

import { EditOutlined, PhoneOutlined, PlusOutlined, SaveOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import type { CarrierSeed } from "@/lib/sample-data";

type CarrierRow = CarrierSeed & { key: string };
type DispatchOrder = { id: string; kiotInvoiceCode: string; province: string; driver?: string; status: string };

export function DispatchBoard() {
  const [carriers, setCarriers] = useState<CarrierRow[]>([]);
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CarrierRow | null>(null);
  const [form] = Form.useForm<CarrierRow>();

  useEffect(() => {
    void loadCarriers();
    fetch("/api/orders").then((response) => response.json()).then(setOrders);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return carriers;
    return carriers.filter((carrier) => `${carrier.name} ${carrier.phone} ${carrier.route}`.toLowerCase().includes(normalized));
  }, [carriers, query]);

  const columns: ColumnsType<CarrierRow> = [
    { title: "Nhà xe", dataIndex: "name", fixed: "left", width: 240, render: (value) => <b>{value}</b> },
    { title: "Số điện thoại", dataIndex: "phone", width: 260, render: (value) => <span style={{ whiteSpace: "pre-line" }}><PhoneOutlined /> {value}</span> },
    { title: "Tuyến", dataIndex: "route", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Ghi chú", dataIndex: "note" },
    {
      title: "Thao tác",
      width: 120,
      render: (_, row) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>
          Sửa
        </Button>
      )
    }
  ];

  async function loadCarriers() {
    setLoading(true);
    const response = await fetch("/api/carriers");
    const data = await response.json();
    setCarriers(data.map((carrier: CarrierSeed) => ({ ...carrier, key: carrier.id })));
    setLoading(false);
  }

  function openEdit(row?: CarrierRow) {
    const next = row ?? { id: crypto.randomUUID(), key: crypto.randomUUID(), name: "", phone: "", route: "", note: "" };
    setEditing(next);
    form.setFieldsValue(next);
  }

  async function saveCarrier() {
    const values = form.getFieldsValue();
    const saved = { ...editing!, ...values, id: editing!.id, key: editing!.key };
    const response = await fetch("/api/carriers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saved)
    });
    if (!response.ok) {
      message.error("Không lưu được nhà xe");
      return;
    }
    await loadCarriers();
    setEditing(null);
    message.success("Đã lưu nhà xe vào database");
  }

  return (
    <div>
      <div className="section-toolbar">
        <Space.Compact style={{ width: 420 }}>
          <Input prefix={<SearchOutlined />} placeholder="Tìm tuyến, nhà xe, số điện thoại" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button onClick={() => setQuery("")}>Xóa</Button>
        </Space.Compact>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>
          Thêm nhà xe
        </Button>
      </div>
      <div className="dispatch-summary">
        {orders.filter((order) => ["waiting_vehicle", "scheduled", "shipped"].includes(order.status)).map((order) => (
          <div key={order.id} className="dispatch-card">
            <b>{order.kiotInvoiceCode}</b>
            <span>{order.province}</span>
            <span>{order.driver ?? "Chưa gán xe"}</span>
          </div>
        ))}
      </div>
      <Typography.Text type="secondary">Danh bạ nhà xe đang đọc/ghi trực tiếp trong database.</Typography.Text>
      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} scroll={{ x: 1000 }} style={{ marginTop: 12 }} />
      <Modal title={editing?.name ? `Sửa ${editing.name}` : "Thêm nhà xe"} open={!!editing} onCancel={() => setEditing(null)} onOk={saveCarrier} okText="Lưu" cancelText="Đóng" okButtonProps={{ icon: <SaveOutlined /> }}>
        <Form form={form} layout="vertical">
          <Form.Item label="Tên nhà xe" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Số điện thoại / giờ chạy" name="phone" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item label="Tuyến" name="route"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item label="Ghi chú" name="note"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
