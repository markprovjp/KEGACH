"use client";

import { EditOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Modal, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import type { CatalogProduct } from "@/features/catalog/catalog-types";

type ProductRow = CatalogProduct & { key: string };

export function ProductManagement() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [form] = Form.useForm<ProductRow & { aliasesText: string }>();

  useEffect(() => {
    void loadProducts();
  }, []);

  const columns: ColumnsType<ProductRow> = useMemo(
    () => [
      { title: "Sản phẩm", dataIndex: "name", fixed: "left", width: 260 },
      { title: "Giá", dataIndex: "defaultPrice", align: "right", render: (value) => `${Number(value).toLocaleString("vi-VN")}đ` },
      { title: "Đơn vị", dataIndex: "unit", width: 90 },
      { title: "Kg/đơn vị", dataIndex: "weightPerUnitKg", align: "right", width: 110 },
      { title: "Quy cách", dataIndex: "packageRule", render: (value) => value ?? "-" },
      {
        title: "Alias",
        dataIndex: "aliases",
        render: (aliases: ProductRow["aliases"]) => aliases.slice(0, 4).map((alias) => <Tag key={alias.value}>{alias.value}</Tag>)
      },
      {
        title: "Thao tác",
        width: 120,
        render: (_, row) => (
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>
            Sửa
          </Button>
        )
      }
    ],
    []
  );

  async function loadProducts() {
    setLoading(true);
    const response = await fetch("/api/products");
    const data = await response.json();
    setProducts(data.map((product: CatalogProduct) => ({ ...product, key: product.id })));
    setLoading(false);
  }

  function openEdit(row?: ProductRow) {
    const next = row ?? { key: crypto.randomUUID(), id: crypto.randomUUID(), sku: "", name: "", unit: "bao", defaultPrice: 0, packageRule: "", weightPerUnitKg: 0, aliases: [] };
    setEditing(next);
    form.setFieldsValue({ ...next, aliasesText: next.aliases.map((alias) => alias.value).join(", ") });
  }

  async function saveProduct() {
    const values = form.getFieldsValue();
    const saved: ProductRow = {
      ...editing!,
      sku: values.sku,
      name: values.name,
      unit: values.unit,
      defaultPrice: Number(values.defaultPrice ?? 0),
      packageRule: values.packageRule,
      weightPerUnitKg: Number(values.weightPerUnitKg ?? 0),
      aliases: String(values.aliasesText ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => ({ value }))
    };
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saved)
    });
    if (!response.ok) {
      message.error("Không lưu được sản phẩm");
      return;
    }
    await loadProducts();
    setEditing(null);
    message.success("Đã lưu sản phẩm vào database");
  }

  return (
    <div>
      <div className="section-toolbar">
        <Typography.Text type="secondary">Quản lý giá, đơn vị, quy cách và alias dùng khi tách đơn chat.</Typography.Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>
          Thêm sản phẩm
        </Button>
      </div>
      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={products} pagination={{ pageSize: 10 }} scroll={{ x: 1100 }} />
      <Modal title={editing?.name ? `Sửa ${editing.name}` : "Thêm sản phẩm"} open={!!editing} onCancel={() => setEditing(null)} onOk={saveProduct} okText="Lưu" cancelText="Đóng" okButtonProps={{ icon: <SaveOutlined /> }}>
        <Form form={form} layout="vertical">
          <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Mã/SKU" name="sku"><Input /></Form.Item>
          <Space.Compact style={{ width: "100%" }}>
            <Form.Item label="Giá" name="defaultPrice" style={{ width: "50%" }}><InputNumber min={0} step={1000} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Đơn vị" name="unit" style={{ width: "50%" }}><Input /></Form.Item>
          </Space.Compact>
          <Form.Item label="Khối lượng ước tính / đơn vị" name="weightPerUnitKg"><InputNumber min={0} step={0.1} style={{ width: "100%" }} /></Form.Item>
          <Form.Item label="Quy cách" name="packageRule"><Input /></Form.Item>
          <Form.Item label="Alias, cách nhau bằng dấu phẩy" name="aliasesText"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
