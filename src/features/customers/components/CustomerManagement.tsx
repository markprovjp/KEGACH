"use client";

import { DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Key } from "react";
import { useEffect, useMemo, useState } from "react";
import { tablePagination, type PageSizeValue } from "@/components/PageSizeControl";
import { ImportExportButtons } from "@/components/ImportExportButtons";
import { TableOperationsBar } from "@/components/TableOperationsBar";
import type { CsvRow } from "@/lib/csv";
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

type CustomerFormValues = Omit<CustomerRow, "groups"> & {
  groups?: string[];
};

const customerTypeOptions = [
  { value: "direct", label: "Lấy thẳng" },
  { value: "intermediary", label: "Trung gian / bán hộ" }
];

const debtFilterOptions = [
  { value: "all", label: "Tất cả công nợ" },
  { value: "debt", label: "Đang nợ" },
  { value: "clear", label: "Không nợ" }
];

type BulkAction = "customerType" | "groups" | "province" | "note";

export function CustomerManagement() {
  const { message } = App.useApp();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [debtFilter, setDebtFilter] = useState<string>("all");
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>("customerType");
  const [bulkValue, setBulkValue] = useState<string | string[]>("direct");
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [pageSize, setPageSize] = useState<PageSizeValue>(30);
  const [form] = Form.useForm<CustomerFormValues>();

  useEffect(() => {
    void loadCustomers();
  }, []);

  const filtered = useMemo(() => {
    const normalized = normalizeSearchText(query);
    return customers.filter((customer) => {
      const matchesText = !normalized || normalizeSearchText(`${customer.name} ${customer.phone ?? ""} ${customer.address ?? ""} ${customer.province ?? ""} ${customer.groups ?? ""} ${customer.note ?? ""}`).includes(normalized);
      const matchesType = typeFilter === "all" || normalizeCustomerType(customer.customerType) === typeFilter;
      const matchesGroup = groupFilter === "all" || splitGroups(customer.groups).includes(groupFilter);
      const matchesProvince = provinceFilter === "all" || (customer.province || "Chưa có tỉnh") === provinceFilter;
      const debt = Number(customer.debt ?? 0);
      const matchesDebt = debtFilter === "all" || (debtFilter === "debt" ? debt > 0 : debt <= 0);
      return matchesText && matchesType && matchesGroup && matchesProvince && matchesDebt;
    });
  }, [customers, debtFilter, groupFilter, provinceFilter, query, typeFilter]);
  const hasActiveFilters = Boolean(query.trim()) || typeFilter !== "all" || groupFilter !== "all" || provinceFilter !== "all" || debtFilter !== "all";

  const groupOptions = useMemo(() => uniqueOptions(customers.flatMap((customer) => splitGroups(customer.groups))), [customers]);
  const provinceOptions = useMemo(() => uniqueOptions(customers.map((customer) => customer.province || "Chưa có tỉnh")), [customers]);
  const exportRows = useMemo(() => filtered.map((customer) => ({
    name: customer.name,
    phone: customer.phone ?? "",
    address: customer.address ?? "",
    province: customer.province ?? "",
    customerType: normalizeCustomerType(customer.customerType),
    groups: customer.groups ?? "",
    debt: String(customer.debt ?? 0),
    note: customer.note ?? ""
  })), [filtered]);

  const columns: ColumnsType<CustomerRow> = [
    { title: "Khách hàng", dataIndex: "name", fixed: "left", width: 240, render: (value) => <b>{value}</b> },
    {
      title: "Loại",
      dataIndex: "customerType",
      width: 150,
      filters: customerTypeOptions.map((option) => ({ text: option.label, value: option.value })),
      onFilter: (value, row) => normalizeCustomerType(row.customerType) === value,
      render: (value) => value === "intermediary" ? <Tag color="gold">Trung gian</Tag> : <Tag color="green">Lấy thẳng</Tag>
    },
    { title: "SĐT", dataIndex: "phone", width: 150 },
    { title: "Địa chỉ", dataIndex: "address", width: 300 },
    {
      title: "Tỉnh",
      dataIndex: "province",
      width: 140,
      filters: provinceOptions.map((value) => ({ text: value, value })),
      filterSearch: true,
      onFilter: (value, row) => (row.province || "Chưa có tỉnh") === value
    },
    {
      title: "Nhóm",
      dataIndex: "groups",
      width: 180,
      filters: groupOptions.map((value) => ({ text: value, value })),
      filterSearch: true,
      onFilter: (value, row) => splitGroups(row.groups).includes(String(value)),
      render: (value) => splitGroups(value).map((group) => <Tag key={group}>{group}</Tag>)
    },
    { title: "Công nợ", dataIndex: "debt", width: 120, align: "right", sorter: (a, b) => Number(a.debt ?? 0) - Number(b.debt ?? 0), render: (value) => Number(value ?? 0).toLocaleString("vi-VN") },
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
    form.setFieldsValue({ ...next, customerType: next.customerType || "direct", groups: splitGroups(next.groups) });
  }

  async function saveCustomer() {
    const values = await form.validateFields();
    const response = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, ...values, groups: splitGroups(values.groups).join(", ") })
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

  async function applyBulkAction() {
    if (!selectedRowKeys.length) {
      message.warning("Chưa chọn khách hàng");
      return;
    }
    const patch = buildBulkPatch(bulkAction, bulkValue);
    if (!patch) {
      message.warning("Chưa nhập giá trị cập nhật");
      return;
    }
    const response = await fetch("/api/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedRowKeys, ...patch })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Không cập nhật hàng loạt được" }));
      message.error(error.error ?? "Không cập nhật hàng loạt được");
      return;
    }
    const result = await response.json();
    message.success(`Đã cập nhật ${result.updated} khách`);
    setSelectedRowKeys([]);
    await loadCustomers();
  }

  async function importCustomers(rows: CsvRow[]) {
    if (!rows.length) {
      message.warning("File Excel/CSV không có dữ liệu");
      return;
    }
    let imported = 0;
    for (const row of rows) {
      const name = row.name || row["Tên khách"] || row["Khách hàng"];
      if (!name?.trim()) continue;
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: row.phone || row["SĐT"] || "",
          address: row.address || row["Địa chỉ"] || "",
          province: row.province || row["Tỉnh"] || "",
          customerType: row.customerType || row["Loại khách"] || "direct",
          groups: row.groups || row["Nhóm"] || "",
          note: row.note || row["Ghi chú"] || ""
        })
      });
      if (response.ok) imported += 1;
    }
    await loadCustomers();
    message.success(`Đã nhập ${imported} khách hàng`);
  }

  function clearFilters() {
    setQuery("");
    setTypeFilter("all");
    setGroupFilter("all");
    setProvinceFilter("all");
    setDebtFilter("all");
  }

  return (
    <>
      <TableOperationsBar
        total={filtered.length}
        noun="khách"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Tìm tên, SĐT, địa chỉ, ghi chú"
        filters={[
          { key: "type", label: "Loại khách", value: typeFilter, defaultValue: "all", onChange: (value) => setTypeFilter(String(value)), options: [{ value: "all", label: "Tất cả" }, ...customerTypeOptions] },
          { key: "group", label: "Nhóm", value: groupFilter, defaultValue: "all", onChange: (value) => setGroupFilter(String(value)), showSearch: true, options: [{ value: "all", label: "Tất cả" }, ...groupOptions.map((value) => ({ value, label: value }))] },
          { key: "province", label: "Tỉnh", value: provinceFilter, defaultValue: "all", onChange: (value) => setProvinceFilter(String(value)), showSearch: true, options: [{ value: "all", label: "Tất cả" }, ...provinceOptions.map((value) => ({ value, label: value }))] },
          { key: "debt", label: "Công nợ", value: debtFilter, defaultValue: "all", onChange: (value) => setDebtFilter(String(value)), options: debtFilterOptions }
        ]}
        onClearFilters={clearFilters}
        clearDisabled={!hasActiveFilters}
        selectedCount={selectedRowKeys.length}
        actions={(
          <>
            <ImportExportButtons filename="khach-hang-kegach.csv" rows={exportRows} onImport={importCustomers} />
            <Button icon={<PlusOutlined />} onClick={() => openEdit()}>Thêm khách</Button>
          </>
        )}
        bulkActions={(
          <>
            <Select value={bulkAction} onChange={(value) => { setBulkAction(value); setBulkValue(value === "customerType" ? "direct" : ""); }} options={[
              { value: "customerType", label: "Đổi loại khách" },
              { value: "groups", label: "Gán nhóm" },
              { value: "province", label: "Gán tỉnh" },
              { value: "note", label: "Ghi chú" }
            ]} style={{ width: 150 }} />
            {bulkAction === "customerType" ? (
              <Select value={String(bulkValue)} onChange={setBulkValue} options={customerTypeOptions} style={{ width: 170 }} />
            ) : bulkAction === "groups" ? (
              <Select mode="tags" value={Array.isArray(bulkValue) ? bulkValue : splitGroups(String(bulkValue))} onChange={setBulkValue} options={groupOptions.map((value) => ({ value, label: value }))} placeholder="Nhập nhóm" style={{ minWidth: 220 }} />
            ) : bulkAction === "province" ? (
              <Select showSearch value={String(bulkValue)} onChange={setBulkValue} options={provinceOptions.map((value) => ({ value, label: value }))} placeholder="Chọn/nhập tỉnh" style={{ width: 190 }} />
            ) : (
              <Input value={String(bulkValue)} onChange={(event) => setBulkValue(event.target.value)} placeholder="Ghi chú mới" style={{ width: 260 }} />
            )}
            <Button type="primary" onClick={applyBulkAction}>Áp dụng hàng loạt</Button>
            <Button onClick={() => setSelectedRowKeys([])}>Bỏ chọn</Button>
          </>
        )}
      />
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys, preserveSelectedRowKeys: true, selections: true }}
        columns={columns}
        dataSource={filtered}
        pagination={tablePagination(pageSize, filtered.length, setPageSize)}
        scroll={{ x: 1460 }}
      />
      <Modal title="Thông tin khách hàng" open={!!editing} onCancel={() => setEditing(null)} onOk={saveCustomer} okText="Lưu" cancelText="Đóng" okButtonProps={{ icon: <SaveOutlined /> }}>
        <Form form={form} layout="vertical">
          <Form.Item label="Tên khách" name="name" rules={[{ required: true, message: "Nhập tên khách" }]}><Input /></Form.Item>
          <div className="form-grid compact-form-grid">
            <Form.Item label="Loại khách" name="customerType"><Select options={customerTypeOptions} /></Form.Item>
            <Form.Item label="SĐT" name="phone"><Input /></Form.Item>
            <Form.Item label="Tỉnh" name="province"><Input /></Form.Item>
            <Form.Item label="Nhóm" name="groups"><Select mode="tags" options={groupOptions.map((value) => ({ value, label: value }))} placeholder="Đại lý, thợ, khách lẻ..." /></Form.Item>
          </div>
          <Form.Item label="Địa chỉ" name="address"><Input /></Form.Item>
          <Form.Item label="Ghi chú" name="note"><Input.TextArea rows={3} placeholder="Ví dụ: khách trung gian hay đặt hộ công trình..." /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function normalizeCustomerType(value?: string | null): string {
  return value === "intermediary" ? "intermediary" : "direct";
}

function splitGroups(value?: string | string[] | null): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function uniqueOptions(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "vi"));
}

function buildBulkPatch(action: BulkAction, value: string | string[]) {
  if (action === "customerType") return { customerType: String(value) };
  if (action === "groups") {
    const groups = splitGroups(value);
    return groups.length ? { groups } : null;
  }
  const text = String(value).trim();
  if (!text) return null;
  if (action === "province") return { province: text };
  return { note: text };
}
