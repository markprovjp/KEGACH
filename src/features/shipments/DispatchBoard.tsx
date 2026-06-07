"use client";

import { DeleteOutlined, EditOutlined, PhoneOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { tablePagination, type PageSizeValue } from "@/components/PageSizeControl";
import { TableOperationsBar } from "@/components/TableOperationsBar";
import { normalizeSearchText } from "@/lib/normalize";

type CarrierRow = { id: string; key: string; name: string; phone: string; route: string; note?: string | null };
type DispatchOrder = { id: string; kiotInvoiceCode: string; province: string; driver?: string; status: string };

export function DispatchBoard() {
  const { message } = App.useApp();
  const [carriers, setCarriers] = useState<CarrierRow[]>([]);
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CarrierRow | null>(null);
  const [pageSize, setPageSize] = useState<PageSizeValue>(10);
  const [form] = Form.useForm<CarrierRow>();

  useEffect(() => {
    void loadCarriers();
    fetch("/api/orders").then((response) => response.json()).then(setOrders);
  }, []);

  const filtered = useMemo(() => {
    const normalized = normalizeSearchText(query);
    if (!normalized) return carriers;
    return carriers.filter((carrier) => normalizeSearchText(`${carrier.name} ${carrier.phone} ${carrier.route} ${carrier.note ?? ""}`).includes(normalized));
  }, [carriers, query]);

  const columns: ColumnsType<CarrierRow> = [
    { title: "Nhà xe", dataIndex: "name", fixed: "left", width: 240, render: (value) => <b>{value}</b> },
    { title: "Số điện thoại", dataIndex: "phone", width: 260, render: (value) => <span style={{ whiteSpace: "pre-line" }}><PhoneOutlined /> {value}</span> },
    { title: "Tuyến", dataIndex: "route", render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Ghi chú", dataIndex: "note" },
    {
      title: "Thao tác",
      width: 170,
      render: (_, row) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>Sửa</Button>
          <Popconfirm title="Xóa nhà xe này?" okText="Xóa" cancelText="Đóng" onConfirm={() => deleteCarrier(row)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  async function loadCarriers() {
    setLoading(true);
    const response = await fetch("/api/carriers");
    const data = await response.json();
    setCarriers(data.map((carrier: CarrierRow) => ({ ...carrier, key: carrier.id })));
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

  async function deleteCarrier(row: CarrierRow) {
    const response = await fetch(`/api/carriers/${row.id}`, { method: "DELETE" });
    if (!response.ok) {
      message.error("Không xóa được nhà xe");
      return;
    }
    setCarriers((current) => current.filter((carrier) => carrier.id !== row.id));
    message.success("Đã xóa nhà xe khỏi database");
  }

  return (
    <div>
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
      <div style={{ marginTop: 12 }}>
        <TableOperationsBar
          total={filtered.length}
          noun="nhà xe"
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Tìm tuyến, nhà xe, số điện thoại"
          onClearFilters={() => setQuery("")}
          clearDisabled={!query.trim()}
          actions={(
            <>
              <Button icon={<ReloadOutlined />} onClick={loadCarriers}>Tải lại</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>
                Thêm nhà xe
              </Button>
            </>
          )}
        />
      </div>
      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={tablePagination(pageSize, filtered.length, setPageSize)} scroll={{ x: 1000 }} />
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
