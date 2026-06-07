"use client";

import { CheckOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, Modal, Popconfirm, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { tablePagination, type PageSizeValue } from "@/components/PageSizeControl";
import { TableOperationsBar } from "@/components/TableOperationsBar";
import { normalizeSearchText } from "@/lib/normalize";

type ReconciliationRow = {
  key: string;
  id: string;
  date: string;
  kiotInvoiceCode: string;
  customer: string;
  appOrderCode?: string;
  mismatchType: string;
  requiredAction: string;
  resolutionNote?: string;
  status: "open" | "resolved";
};

export function ReconciliationTable() {
  const { message } = App.useApp();
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState<ReconciliationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ReconciliationRow | null>(null);
  const [mode, setMode] = useState<"edit" | "resolve">("edit");
  const [pageSize, setPageSize] = useState<PageSizeValue>(10);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">("all");
  const [form] = Form.useForm<ReconciliationRow>();

  useEffect(() => {
    setMounted(true);
    void loadRows();
  }, []);

  const columns: ColumnsType<ReconciliationRow> = useMemo(
    () => [
      { title: "Ngày", dataIndex: "date", width: 110 },
      { title: "Hóa đơn Kiot", dataIndex: "kiotInvoiceCode", width: 150, render: (value) => <b>{value}</b> },
      { title: "Khách", dataIndex: "customer", width: 180 },
      { title: "Mã app", dataIndex: "appOrderCode", width: 120, render: (value) => value ?? <Tag color="red">Chưa có</Tag> },
      { title: "Loại lệch", dataIndex: "mismatchType", width: 170, render: (value) => <Tag color="gold">{value}</Tag> },
      { title: "Việc cần làm", dataIndex: "requiredAction" },
      { title: "Ghi chú xử lý", dataIndex: "resolutionNote" },
      { title: "Trạng thái", dataIndex: "status", width: 120, render: (value) => <Tag color={value === "resolved" ? "green" : "red"}>{value === "resolved" ? "Đã xử lý" : "Đang mở"}</Tag> },
      {
        title: "Thao tác",
        fixed: "right",
        width: 210,
        render: (_, row) => (
          <Space>
            <Button size="small" icon={<CheckOutlined />} onClick={() => openResolve(row)}>Xử lý</Button>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>Sửa</Button>
            <Popconfirm title="Xóa dòng đối soát?" okText="Xóa" cancelText="Đóng" onConfirm={() => deleteRow(row)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      }
    ],
    []
  );

  const filteredRows = useMemo(() => {
    const normalized = normalizeSearchText(query);
    return rows.filter((row) => {
      const matchesText = !normalized || normalizeSearchText(`${row.kiotInvoiceCode} ${row.customer} ${row.appOrderCode ?? ""} ${row.mismatchType} ${row.requiredAction} ${row.resolutionNote ?? ""}`).includes(normalized);
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [query, rows, statusFilter]);
  const hasActiveFilters = Boolean(query.trim()) || statusFilter !== "all";

  async function loadRows() {
    setLoading(true);
    const response = await fetch("/api/reconciliation");
    setRows(await response.json());
    setLoading(false);
  }

  function openCreate() {
    const empty = { key: "", id: "", date: "", kiotInvoiceCode: "", customer: "", mismatchType: "", requiredAction: "", status: "open" as const };
    setMode("edit");
    setEditing(empty);
    form.setFieldsValue(empty);
  }

  function openEdit(row: ReconciliationRow) {
    setMode("edit");
    setEditing(row);
    form.setFieldsValue(row);
  }

  function openResolve(row: ReconciliationRow) {
    setMode("resolve");
    setEditing(row);
    form.setFieldsValue({ ...row, status: "resolved" });
  }

  async function saveRow() {
    if (!editing) return;
    const values = form.getFieldsValue();
    if (!values.kiotInvoiceCode?.trim() || !values.mismatchType?.trim() || !values.requiredAction?.trim()) {
      message.error("Phải nhập hóa đơn, loại lệch và việc cần làm");
      return;
    }
    if (mode === "resolve" && !values.resolutionNote?.trim()) {
      message.error("Phải nhập ghi chú xử lý");
      return;
    }

    const isCreate = !editing.id;
    const response = await fetch(isCreate ? "/api/reconciliation" : `/api/reconciliation/${editing.id}`, {
      method: isCreate ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, ...values, status: mode === "resolve" ? "resolved" : values.status ?? "open" })
    });
    if (!response.ok) {
      message.error("Không lưu được dòng đối soát");
      return;
    }
    await loadRows();
    setEditing(null);
    message.success("Đã lưu dòng đối soát vào database");
  }

  async function deleteRow(row: ReconciliationRow) {
    const response = await fetch(`/api/reconciliation/${row.id}`, { method: "DELETE" });
    if (!response.ok) {
      message.error("Không xóa được dòng đối soát");
      return;
    }
    setRows((current) => current.filter((item) => item.id !== row.id));
    message.success("Đã xóa dòng đối soát");
  }

  if (!mounted) return <div className="table-fallback">Đang tải bảng đối soát...</div>;

  return (
    <>
      <TableOperationsBar
        total={filteredRows.length}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Tìm hóa đơn, khách, loại lệch, việc cần làm"
        filters={[{
          key: "status",
          label: "Trạng thái",
          value: statusFilter,
          defaultValue: "all",
          onChange: (value) => setStatusFilter(value as typeof statusFilter),
          options: [
            { value: "all", label: "Tất cả" },
            { value: "open", label: "Đang mở" },
            { value: "resolved", label: "Đã xử lý" }
          ]
        }]}
        onClearFilters={() => { setQuery(""); setStatusFilter("all"); }}
        clearDisabled={!hasActiveFilters}
        actions={(
          <>
            <Button icon={<ReloadOutlined />} onClick={loadRows}>Tải lại</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm dòng đối soát</Button>
          </>
        )}
      />
      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filteredRows} pagination={tablePagination(pageSize, filteredRows.length, setPageSize)} scroll={{ x: 1280 }} />
      <Modal title={mode === "resolve" ? `Xử lý ${editing?.kiotInvoiceCode ?? ""}` : editing?.id ? `Sửa ${editing.kiotInvoiceCode}` : "Thêm dòng đối soát"} open={!!editing} onCancel={() => setEditing(null)} onOk={saveRow} okText="Lưu" cancelText="Đóng" okButtonProps={{ icon: <SaveOutlined /> }} width={680}>
        <Form form={form} layout="vertical">
          <div className="form-grid">
            <Form.Item label="Hóa đơn Kiot" name="kiotInvoiceCode"><Input /></Form.Item>
            <Form.Item label="Mã đơn app" name="appOrderCode"><Input placeholder="KG00001 nếu có" /></Form.Item>
            <Form.Item label="Khách" name="customer"><Input /></Form.Item>
            <Form.Item label="Loại lệch" name="mismatchType"><Input placeholder="Thiếu order / lệch COD / lệch sản phẩm" /></Form.Item>
          </div>
          <Form.Item label="Việc cần làm" name="requiredAction"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item label="Ghi chú xử lý" name="resolutionNote"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
