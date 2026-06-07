"use client";

import { SaveOutlined } from "@ant-design/icons";
import { Alert, App, Button, Form, Input, InputNumber, Select, Space, Statistic, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { PageSizeControl, tablePagination, type PageSizeValue } from "@/components/PageSizeControl";
import type { CatalogProduct } from "@/features/catalog/catalog-types";
import { getPackagingRuleByFinishedSku, packagingRules } from "@/features/inventory/packaging-rules";

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

type InventoryRow = {
  productId: string;
  onHand: number;
  reserved: number;
  available: number;
};

const emptyResponse: PackagingResponse = {
  reconciliation: { rawUsedKg: 0, bagUsedKg: 0, finishedKg: 0, expectedBagKg: 0, varianceKg: 0 },
  batches: []
};

export function PackagingManagement() {
  const { message } = App.useApp();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [data, setData] = useState<PackagingResponse>(emptyResponse);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageSize, setPageSize] = useState<PageSizeValue>(10);
  const [form] = Form.useForm<PackagingFormValues>();
  const selectedFinishedId = Form.useWatch("finishedProductId", form);
  const selectedRawId = Form.useWatch("rawProductId", form);
  const selectedBagId = Form.useWatch("bagProductId", form);
  const rawKg = Number(Form.useWatch("rawKg", form) ?? 0);
  const bagKg = Number(Form.useWatch("bagKg", form) ?? 0);

  const productBySku = useMemo(() => new Map(products.map((product) => [product.sku, product])), [products]);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const inventoryByProductId = useMemo(() => new Map(inventory.map((row) => [row.productId, row])), [inventory]);
  const rawStock = selectedRawId ? inventoryByProductId.get(selectedRawId) : undefined;
  const bagStock = selectedBagId ? inventoryByProductId.get(selectedBagId) : undefined;
  const finishedStock = selectedFinishedId ? inventoryByProductId.get(selectedFinishedId) : undefined;
  const hasEnoughRaw = Boolean(rawStock && rawStock.onHand >= rawKg);
  const hasEnoughBag = Boolean(bagStock && bagStock.onHand >= bagKg);
  const cannotSaveReason = !selectedRawId || !selectedBagId || !selectedFinishedId
    ? "Chọn thành phẩm cần đóng gói"
    : !hasEnoughRaw
      ? `Hàng rời không đủ tồn. Còn ${formatKg(rawStock?.onHand ?? 0)}`
      : !hasEnoughBag
        ? `Túi bóng không đủ tồn. Còn ${formatKg(bagStock?.onHand ?? 0)}`
        : "";
  const finishedOptions = useMemo(
    () => packagingRules
      .map((rule) => productBySku.get(rule.finishedSku))
      .filter((product): product is CatalogProduct => Boolean(product))
      .map((product) => ({ value: product.id, label: `${product.name} (${product.unit})` })),
    [productBySku]
  );
  const rawOptions = useMemo(() => packagingRules
    .map((rule) => productBySku.get(rule.rawSku))
    .filter((product): product is CatalogProduct => Boolean(product))
    .map((product) => ({ value: product.id, label: `${product.name} (${product.unit})` })), [productBySku]);
  const bagOptions = useMemo(() => packagingRules
    .map((rule) => productBySku.get(rule.bagSku))
    .filter((product): product is CatalogProduct => Boolean(product))
    .map((product) => ({ value: product.id, label: `${product.name} (${product.unit})` })), [productBySku]);
  const columns: ColumnsType<PackagingBatchRow> = [
    { title: "Mã", dataIndex: "code", width: 100, fixed: "left" },
    { title: "Ngày", dataIndex: "createdAt", width: 120, render: (value: string) => new Date(value).toLocaleDateString("vi-VN") },
    { title: "Hàng rời dùng", dataIndex: "rawKg", align: "right", width: 130, render: (value) => `${value} kg` },
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
    const [productsResponse, packagingResponse, inventoryResponse] = await Promise.all([fetch("/api/products"), fetch("/api/packaging-batches"), fetch("/api/inventory")]);
    const loadedProducts = await productsResponse.json();
    const loadedPackaging = await packagingResponse.json();
    const loadedInventory = await inventoryResponse.json();
    setProducts(loadedProducts);
    setData(loadedPackaging);
    setInventory(loadedInventory);
    setDefaults(loadedProducts);
    setLoading(false);
  }

  function setDefaults(nextProducts: CatalogProduct[]) {
    const firstRule = packagingRules[0];
    const raw = nextProducts.find((product) => product.sku === firstRule.rawSku);
    const bag = nextProducts.find((product) => product.sku === firstRule.bagSku);
    const finished = nextProducts.find((product) => product.sku === firstRule.finishedSku);
    form.setFieldsValue({
      rawProductId: raw?.id,
      bagProductId: bag?.id,
      finishedProductId: finished?.id,
      rawKg: 100,
      bagKg: 6,
      finishedKg: 106
    });
  }

  function selectFinishedProduct(finishedProductId: string) {
    const finished = productById.get(finishedProductId);
    const rule = getPackagingRuleByFinishedSku(finished?.sku);
    form.setFieldsValue({
      finishedProductId,
      rawProductId: rule ? productBySku.get(rule.rawSku)?.id : undefined,
      bagProductId: rule ? productBySku.get(rule.bagSku)?.id : undefined
    });
  }

  async function saveBatch() {
    const values = await form.validateFields();
    if (cannotSaveReason) {
      message.warning(cannotSaveReason);
      return;
    }
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
    const inventoryResponse = await fetch("/api/inventory");
    setInventory(await inventoryResponse.json());
    form.setFieldsValue({ rawKg: 100, bagKg: 6, finishedKg: 106, note: "" });
    message.success("Đã lưu lô đóng gói và cập nhật tồn kho");
  }

  return (
    <div>
      <div className="packaging-summary">
        <Statistic title="Hàng rời đã dùng" value={data.reconciliation.rawUsedKg} suffix="kg" />
        <Statistic title="Túi bóng đã dùng" value={data.reconciliation.bagUsedKg} suffix="kg" />
        <Statistic title="Thành phẩm đã đóng" value={data.reconciliation.finishedKg} suffix="kg" />
        <Statistic title="Lệch cần kiểm" value={data.reconciliation.varianceKg} suffix="kg" styles={{ content: { color: Math.abs(data.reconciliation.varianceKg) > 0.001 ? "#cf1322" : "#3f8600" } }} />
      </div>
      <Form form={form} layout="vertical" className="packaging-form">
        <div className="form-grid compact-form-grid">
          <Form.Item label="Thành phẩm nhập kho" name="finishedProductId"><Select showSearch optionFilterProp="label" options={finishedOptions} onChange={selectFinishedProduct} /></Form.Item>
          <Form.Item label="Hàng rời xuất dùng" name="rawProductId"><Select disabled showSearch optionFilterProp="label" options={rawOptions} /></Form.Item>
          <Form.Item label="Túi bóng xuất dùng" name="bagProductId"><Select disabled showSearch optionFilterProp="label" options={bagOptions} /></Form.Item>
          <Form.Item label="Kg hàng rời" name="rawKg" rules={[{ required: true, message: "Nhập kg hàng rời" }]}><InputNumber min={0.001} step={1} style={{ width: "100%" }} /></Form.Item>
          <Form.Item label="Kg túi bóng" name="bagKg" rules={[{ required: true, message: "Nhập kg túi bóng" }]}><InputNumber min={0.001} step={0.1} style={{ width: "100%" }} /></Form.Item>
          <Form.Item label="Kg thành phẩm" name="finishedKg" rules={[{ required: true, message: "Nhập kg thành phẩm" }]}><InputNumber min={0.001} step={1} style={{ width: "100%" }} /></Form.Item>
        </div>
        <div className="packaging-stock-strip">
          <Tag color={hasEnoughRaw ? "green" : "red"}>Hàng rời còn {formatKg(rawStock?.onHand ?? 0)}</Tag>
          <Tag color={hasEnoughBag ? "green" : "red"}>Túi bóng còn {formatKg(bagStock?.onHand ?? 0)}</Tag>
          <Tag color="blue">Thành phẩm hiện có {formatKg(finishedStock?.onHand ?? 0)}</Tag>
        </div>
        {cannotSaveReason ? <Alert type="warning" showIcon title={cannotSaveReason} style={{ marginBottom: 12 }} /> : null}
        <Form.Item label="Ghi chú" name="note"><Input placeholder={`Ví dụ: đóng ${productById.get(selectedFinishedId)?.name ?? "ke/nêm"} ca sáng, người cân...`} /></Form.Item>
        <Space>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} disabled={Boolean(cannotSaveReason)} onClick={saveBatch}>Lưu lô đóng gói</Button>
          <Button onClick={loadAll}>Tải lại</Button>
        </Space>
      </Form>
      <div className="table-toolbar">
        <b>Lịch sử đóng gói</b>
        <PageSizeControl total={data.batches.length} value={pageSize} onChange={setPageSize} />
      </div>
      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={data.batches} pagination={tablePagination(pageSize, data.batches.length, setPageSize)} scroll={{ x: 900 }} />
    </div>
  );
}

function formatKg(value: number): string {
  return `${Number(value).toLocaleString("vi-VN")} kg`;
}
