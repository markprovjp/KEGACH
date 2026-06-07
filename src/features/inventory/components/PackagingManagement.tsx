"use client";

import { SaveOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Select, Space, Statistic, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { PageSizeControl, tablePagination, type PageSizeValue } from "@/components/PageSizeControl";
import type { CatalogProduct } from "@/features/catalog/catalog-types";

type PackagingBatchRow = {
  id: string;
  code: string;
  rawProductId: string;
  rawProduct: string;
  bagProductId: string;
  bagProduct: string;
  finishedProductId: string;
  finishedProduct: string;
  rawKg: number;
  bagKg: number;
  finishedKg: number;
  varianceKg: number;
  note: string;
  createdAt: string;
};

type PackagingResponse = {
  reconciliation: {
    rawUsedKg: number;
    bagUsedKg: number;
    finishedKg: number;
    expectedBagKg: number;
    varianceKg: number;
  };
  batches: PackagingBatchRow[];
};

type PackagingFormValues = {
  rawProductId: string;
  bagProductId: string;
  finishedProductId: string;
  rawKg: number;
  bagKg: number;
  finishedKg: number;
  note?: string;
};

const emptyResponse: PackagingResponse = {
  reconciliation: { rawUsedKg: 0, bagUsedKg: 0, finishedKg: 0, expectedBagKg: 0, varianceKg: 0 },
  batches: []
};

export function PackagingManagement() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [data, setData] = useState<PackagingResponse>(emptyResponse);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageSize, setPageSize] = useState<PageSizeValue>(10);
  const [form] = Form.useForm<PackagingFormValues>();

  const productOptions = useMemo(() => products.map((product) => ({ value: product.id, label: `${product.name} (${product.unit})` })), [products]);
  const columns: ColumnsType<PackagingBatchRow> = [
    { title: "Mã", dataIndex: "code", width: 100, fixed: "left" },
    { title: "Ngày", dataIndex: "createdAt", width: 120, render: (value: string) => new Date(value).toLocaleDateString("vi-VN") },
    { title: "Nêm rời dùng", dataIndex: "rawKg", align: "right", width: 130, render: (value) => `${value} kg` },
    { title: "Túi bóng dùng", dataIndex: "bagKg", align: "right", width: 130, render: (value) => `${value} kg` },
    { title: "Thành phẩm", dataIndex: "finishedKg", align: "right", width: 130, render: (value) => `${value} kg` },
    {
      title: "Lệch túi",
      dataIndex: "varianceKg",
      align: "right",
      width: 120,
      render: (value) => <Tag color={Math.abs(Number(value)) > 0.001 ? "red" : "green"}>{Number(value).toLocaleString("vi-VN")} kg</Tag>
    },
    { title: "Ghi chú", dataIndex: "note" }
  ];

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [productsResponse, packagingResponse] = await Promise.all([fetch("/api/products"), fetch("/api/packaging-batches")]);
    const loadedProducts = await productsResponse.json();
    const loadedPackaging = await packagingResponse.json();
    setProducts(loadedProducts);
    setData(loadedPackaging);
    setDefaults(loadedProducts);
    setLoading(false);
  }

  function setDefaults(nextProducts: CatalogProduct[]) {
    const raw = nextProducts.find((product) => product.name.toLowerCase().includes("nêm rời"));
    const bag = nextProducts.find((product) => product.name.toLowerCase().includes("túi bóng"));
    const finished = nextProducts.find((product) => product.name === "Nêm");
    form.setFieldsValue({
      rawProductId: raw?.id,
      bagProductId: bag?.id,
      finishedProductId: finished?.id,
      rawKg: 100,
      bagKg: 6,
      finishedKg: 106
    });
  }

  async function saveBatch() {
    const values = form.getFieldsValue();
    setSaving(true);
    const response = await fetch("/api/packaging-batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    setSaving(false);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Không lưu được lô đóng gói" }));
      message.error(error.error ?? "Không lưu được lô đóng gói");
      return;
    }
    setData(await response.json());
    form.setFieldsValue({ rawKg: 100, bagKg: 6, finishedKg: 106, note: "" });
    message.success("Đã lưu lô đóng gói và cập nhật tồn kho");
  }

  return (
    <div>
      <div className="packaging-summary">
        <Statistic title="Nêm rời đã dùng" value={data.reconciliation.rawUsedKg} suffix="kg" />
        <Statistic title="Túi bóng đã dùng" value={data.reconciliation.bagUsedKg} suffix="kg" />
        <Statistic title="Thành phẩm đã đóng" value={data.reconciliation.finishedKg} suffix="kg" />
        <Statistic title="Lệch cần kiểm" value={data.reconciliation.varianceKg} suffix="kg" valueStyle={{ color: Math.abs(data.reconciliation.varianceKg) > 0.001 ? "#cf1322" : "#3f8600" }} />
      </div>
      <Form form={form} layout="vertical" className="packaging-form">
        <div className="form-grid compact-form-grid">
          <Form.Item label="Hàng rời xuất dùng" name="rawProductId"><Select showSearch optionFilterProp="label" options={productOptions} /></Form.Item>
          <Form.Item label="Túi bóng xuất dùng" name="bagProductId"><Select showSearch optionFilterProp="label" options={productOptions} /></Form.Item>
          <Form.Item label="Thành phẩm nhập kho" name="finishedProductId"><Select showSearch optionFilterProp="label" options={productOptions} /></Form.Item>
          <Form.Item label="Kg hàng rời" name="rawKg"><InputNumber min={0.001} step={1} style={{ width: "100%" }} /></Form.Item>
          <Form.Item label="Kg túi bóng" name="bagKg"><InputNumber min={0.001} step={0.1} style={{ width: "100%" }} /></Form.Item>
          <Form.Item label="Kg thành phẩm" name="finishedKg"><InputNumber min={0.001} step={1} style={{ width: "100%" }} /></Form.Item>
        </div>
        <Form.Item label="Ghi chú" name="note"><Input placeholder="Ví dụ: đóng nêm ca sáng, người cân..." /></Form.Item>
        <Space>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveBatch}>Lưu lô đóng gói</Button>
          <Button onClick={loadAll}>Tải lại</Button>
        </Space>
      </Form>
      <div className="table-toolbar">
        <b>Lịch sử đóng gói</b>
        <PageSizeControl total={data.batches.length} value={pageSize} onChange={setPageSize} />
      </div>
      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={data.batches} pagination={tablePagination(pageSize, data.batches.length)} scroll={{ x: 900 }} />
    </div>
  );
}
