"use client";

import { DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined, SearchOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { PageSizeControl, tablePagination, type PageSizeValue } from "@/components/PageSizeControl";
import { normalizeSearchText } from "@/lib/normalize";

type CustomerRow = {
  id: string;
  key: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  province?: string | null;
  note?: string | null;
  customerType?: string | null;
  groups?: string | null;
  debt?: number;
  invoiceCount?: number;
};

const customerTypeOptions = [
  { value: "direct", label: "Lấy thẳng" },
  { value: "intermediary", label: "Trung gian / bán hộ" }
];

export function CustomerManagement() {
  const { message } = App.useApp();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [pageSize, setPageSize] = useState<PageSizeValue>(30);
  const [form] = Form.useForm<CustomerRow>();

  useEffect(() => {
    void loadCustomers();
  }, []);

  const filtered = useMemo(() => {
    const normalized = normalizeSearchText(query);
    if (!normalized) return customers;
    return customers.filter((customer) => normalizeSearchText(`${customer.name} ${customer.phone ?? ""} ${customer.address ?? ""} ${customer.province ?? ""} ${customer.note ?? ""}`).includes(normalized));
  }, [customers, query]);

  const columns: ColumnsType<CustomerRow> = [
    { title: "Khách hàng", dataIndex: "name", fixed: "left", width: 240, render: (value) => <b>{value}</b> },
    { title: "Loại", dataIndex: "customerType", width: 150, render: (value) => value === "intermediary" ? <Tag color="gold">Trung gian</Tag> : <Tag color="green">Lấy thẳng</Tag> },
    { title: "SĐT", dataIndex: "phone", width: 150 },
    { title: "Địa chỉ", dataIndex: "address", width: 300 },
    { title: "Tỉnh", dataIndex: "province", width: 140 },
    { title: "Nhóm", dataIndex: "groups", width: 180 },
    { title: "Công nợ", dataIndex: "debt", width: 120, align: "right", render: (value) => Number(value ?? 0).toLocaleString("vi-VN") },
    { title: "Ghi chú", dataIndex: "note", width: 300 },
    {
      title: "",
      width: 110,
      fixed: "right",
      render: (_, row) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm title="Xóa khách này?" okText="Xóa" cancelText="Đóng" onConfirm={() => deleteCustomer(row)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  async function loadCustomers() {
    setLoading(true);
    const response = await fetch("/api/customers");
    const data = await response.json();
    setCustomers(data.map((customer: Omit<CustomerRow, "key">) => ({ ...customer, key: customer.id })));
    setLoading(false);
  }

  function openEdit(row?: CustomerRow) {
    const next = row ?? { id: crypto.randomUUID(), key: crypto.randomUUID(), name: "", phone: "", address: "", province: "", customerType: "direct", groups: "", note: "" };
    setEditing(next);
    form.setFieldsValue({ ...next, customerType: next.customerType || "direct" });
  }

  async function saveCustomer() {
    const values = await form.validateFields();
    const response = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, ...values })
    });
    if (!response.ok) {
      message.error("Không lưu được khách hàng");
      return;
    }
    setEditing(null);
    message.success("Đã lưu khách hàng vào database");
    await loadCustomers();
  }

  async function deleteCustomer(row: CustomerRow) {
    const response = await fetch(`/api/customers/${row.id}`, { method: "DELETE" });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Không xóa được khách hàng" }));
      message.error(error.error ?? "Không xóa được khách hàng");
      return;
    }
    message.success("Đã xóa khách hàng");
    await loadCustomers();
  }

  return (
    <>
      <div className="section-toolbar">
        <Input prefix={<SearchOutlined />} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên, SĐT, địa chỉ, ghi chú" style={{ maxWidth: 420 }} />
        <Space>
          <PageSizeControl total={filtered.length} value={pageSize} onChange={setPageSize} noun="khách" />
          <Button icon={<PlusOutlined />} onClick={() => openEdit()}>Thêm khách</Button>
        </Space>
      </div>
      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={tablePagination(pageSize, filtered.length, setPageSize)} scroll={{ x: 1460 }} />
      <Modal title="Thông tin khách hàng" open={!!editing} onCancel={() => setEditing(null)} onOk={saveCustomer} okText="Lưu" cancelText="Đóng" okButtonProps={{ icon: <SaveOutlined /> }}>
        <Form form={form} layout="vertical">
          <Form.Item label="Tên khách" name="name" rules={[{ required: true, message: "Nhập tên khách" }]}><Input /></Form.Item>
          <div className="form-grid compact-form-grid">
            <Form.Item label="Loại khách" name="customerType"><Select options={customerTypeOptions} /></Form.Item>
            <Form.Item label="SĐT" name="phone"><Input /></Form.Item>
            <Form.Item label="Tỉnh" name="province"><Input /></Form.Item>
            <Form.Item label="Nhóm" name="groups"><Input placeholder="Đại lý, thợ, khách lẻ..." /></Form.Item>
          </div>
          <Form.Item label="Địa chỉ" name="address"><Input /></Form.Item>
          <Form.Item label="Ghi chú" name="note"><Input.TextArea rows={3} placeholder="Ví dụ: khách trung gian hay đặt hộ công trình..." /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
