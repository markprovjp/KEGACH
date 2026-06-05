"use client";

import { DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Form, Image, Input, InputNumber, Modal, Popconfirm, Space, Table, Tag, Typography, Upload, message } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import type { CatalogProduct } from "@/features/catalog/catalog-types";

type ProductRow = CatalogProduct & { key: string };
type ProductFormValues = ProductRow & { aliasesText: string; variantsText: string };

export function ProductManagement() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [form] = Form.useForm<ProductFormValues>();

  useEffect(() => {
    void loadProducts();
  }, []);

  const columns: ColumnsType<ProductRow> = useMemo(
    () => [
      {
        title: "Ảnh",
        dataIndex: "imageUrl",
        width: 72,
        render: (value?: string) => value ? <Image src={value} alt="Ảnh sản phẩm" width={44} height={44} style={{ objectFit: "cover", borderRadius: 6 }} /> : <div className="image-placeholder">Ảnh</div>
      },
      { title: "Sản phẩm", dataIndex: "name", fixed: "left", width: 260 },
      { title: "Giá", dataIndex: "defaultPrice", align: "right", render: (value) => `${Number(value).toLocaleString("vi-VN")}đ` },
      { title: "Đơn vị", dataIndex: "unit", width: 90 },
      { title: "Kg/đơn vị", dataIndex: "weightPerUnitKg", align: "right", width: 110 },
      { title: "Quy cách", dataIndex: "packageRule", render: (value) => value ?? "-" },
      {
        title: "Phân loại keo",
        dataIndex: "variants",
        width: 260,
        render: (variants: ProductRow["variants"]) => variants?.length ? variants.slice(0, 4).map((variant) => <Tag key={variant.code}>{formatVariant(variant)}</Tag>) : "-"
      },
      {
        title: "Alias",
        dataIndex: "aliases",
        render: (aliases: ProductRow["aliases"]) => aliases.slice(0, 4).map((alias) => <Tag key={alias.value}>{alias.value}</Tag>)
      },
      {
        title: "Thao tác",
        width: 180,
        render: (_, row) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>
              Sửa
            </Button>
            <Popconfirm title="Xóa sản phẩm này?" okText="Xóa" cancelText="Đóng" onConfirm={() => deleteProduct(row)}>
              <Button size="small" danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
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
    const next = row ?? { key: crypto.randomUUID(), id: crypto.randomUUID(), sku: "", name: "", unit: "bao", defaultPrice: 0, packageRule: "", weightPerUnitKg: 0, aliases: [], variants: [] };
    setEditing(next);
    setImageUrl(next.imageUrl);
    form.setFieldsValue({
      ...next,
      aliasesText: next.aliases.map((alias) => alias.value).join(", "),
      variantsText: (next.variants ?? []).map(formatVariant).join("\n")
    });
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
      imageUrl,
      weightPerUnitKg: Number(values.weightPerUnitKg ?? 0),
      aliases: String(values.aliasesText ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => ({ value })),
      variants: parseVariantsText(values.variantsText)
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

  async function deleteProduct(row: ProductRow) {
    const response = await fetch(`/api/products/${row.id}`, { method: "DELETE" });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Không xóa được sản phẩm" }));
      message.error(error.error ?? "Không xóa được sản phẩm");
      return;
    }
    await loadProducts();
    message.success("Đã xóa sản phẩm khỏi database");
  }

  async function beforeUpload(file: UploadFile | File) {
    const dataUrl = await fileToDataUrl(file as File);
    setImageUrl(dataUrl);
    return false;
  }

  return (
    <div>
      <div className="section-toolbar">
        <Typography.Text type="secondary">Quản lý giá, đơn vị, quy cách và alias dùng khi tách đơn chat.</Typography.Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>
          Thêm sản phẩm
        </Button>
      </div>
      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={products} pagination={false} scroll={{ x: 1380, y: 620 }} />
      <Modal title={editing?.name ? `Sửa ${editing.name}` : "Thêm sản phẩm"} open={!!editing} onCancel={() => setEditing(null)} onOk={saveProduct} okText="Lưu" cancelText="Đóng" okButtonProps={{ icon: <SaveOutlined /> }}>
        <Form form={form} layout="vertical">
          <Form.Item label="Ảnh sản phẩm">
            <Space align="start">
              {imageUrl ? <Image src={imageUrl} alt="Ảnh sản phẩm" width={86} height={86} style={{ objectFit: "cover", borderRadius: 8 }} /> : <div className="upload-preview-empty">Chưa có ảnh</div>}
              <Upload accept="image/*" showUploadList={false} beforeUpload={beforeUpload}>
                <Button icon={<UploadOutlined />}>Upload ảnh</Button>
              </Upload>
            </Space>
          </Form.Item>
          <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Mã/SKU" name="sku"><Input /></Form.Item>
          <Space.Compact style={{ width: "100%" }}>
            <Form.Item label="Giá" name="defaultPrice" style={{ width: "50%" }}><InputNumber min={0} step={1000} style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="Đơn vị" name="unit" style={{ width: "50%" }}><Input /></Form.Item>
          </Space.Compact>
          <Form.Item label="Khối lượng ước tính / đơn vị" name="weightPerUnitKg"><InputNumber min={0} step={0.1} style={{ width: "100%" }} /></Form.Item>
          <Form.Item label="Quy cách" name="packageRule"><Input /></Form.Item>
          <Form.Item label="Alias, cách nhau bằng dấu phẩy" name="aliasesText"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item label="Phân loại keo, mỗi dòng: mã số thùng + số tuýp" name="variantsText">
            <Input.TextArea rows={8} placeholder={"02 8tuyp\n04 26thung+9tuyp\nB14 50thung+29tuyp"} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function formatVariant(variant: NonNullable<ProductRow["variants"]>[number]): string {
  const chunks = [];
  if (variant.cartonCount) chunks.push(`${variant.cartonCount}thùng`);
  if (variant.tubeCount) chunks.push(`${variant.tubeCount}tuýp`);
  return `${variant.code} ${chunks.join("+") || "0"}`;
}

function parseVariantsText(value?: string): NonNullable<ProductRow["variants"]> {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const code = line.match(/^([A-Za-z]?\d+)/)?.[1] ?? line.split(/\s+/)[0];
      const cartonCount = Number(/(\d+)\s*th[uù]n?g/i.exec(line)?.[1] ?? 0);
      const tubeCount = Number(/(\d+)\s*t(?:uyp|uýp|uip|úyp|uíp)/i.exec(line)?.[1] ?? 0);
      return { code, cartonCount, tubeCount };
    });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
