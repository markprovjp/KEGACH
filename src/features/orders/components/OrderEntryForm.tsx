"use client";

import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Input, InputNumber, Select, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";
import { ProductSearch } from "@/features/catalog/components/ProductSearch";
import { CustomerSearch } from "@/features/customers/components/CustomerSearch";
import { parseProductLines } from "@/features/catalog/product-matcher";
import { sampleProducts } from "@/lib/sample-data";

type Line = {
  key: string;
  productId?: string;
  quantity: number;
  unitPrice: number;
};

export function OrderEntryForm() {
  const [lines, setLines] = useState<Line[]>([{ key: "1", productId: "ke-can-bang-3mm", quantity: 3, unitPrice: 47000 }]);
  const [rawChat, setRawChat] = useState("B03 = 3t\n* nem: 1 bao");
  const parsed = useMemo(() => parseProductLines(rawChat, sampleProducts), [rawChat]);

  const columns: ColumnsType<Line> = [
    {
      title: "San pham",
      dataIndex: "productId",
      render: (_, record) => <ProductSearch value={record.productId} onChange={(value) => updateLine(record.key, { productId: value })} />
    },
    {
      title: "SL",
      dataIndex: "quantity",
      width: 120,
      render: (_, record) => <InputNumber min={1} value={record.quantity} onChange={(value) => updateLine(record.key, { quantity: Number(value ?? 1) })} />
    },
    {
      title: "Don gia",
      dataIndex: "unitPrice",
      width: 160,
      render: (_, record) => <InputNumber min={0} step={1000} value={record.unitPrice} onChange={(value) => updateLine(record.key, { unitPrice: Number(value ?? 0) })} />
    }
  ];

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((current) => [...current, { key: crypto.randomUUID(), quantity: 1, unitPrice: 0 }]);
  }

  return (
    <Form layout="vertical" className="order-form" initialValues={{ sourceChannel: "zalo", kiotInvoiceCode: "HD004066", codAmount: 176000 }}>
      <div className="form-grid">
        <Form.Item label="Ma hoa don Kiot" name="kiotInvoiceCode">
          <Input placeholder="HD004066" />
        </Form.Item>
        <Form.Item label="Kenh nhan don" name="sourceChannel">
          <Select
            options={[
              { value: "zalo", label: "Zalo" },
              { value: "facebook", label: "Facebook" },
              { value: "phone", label: "Dien thoai" },
              { value: "counter", label: "Tai quay" }
            ]}
          />
        </Form.Item>
        <Form.Item label="Khach hang" name="customerId">
          <CustomerSearch />
        </Form.Item>
        <Form.Item label="Ngay hen gui" name="promisedSendDate">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="COD" name="codAmount">
          <InputNumber min={0} step={10000} style={{ width: "100%" }} />
        </Form.Item>
      </div>

      <Table rowKey="key" size="small" pagination={false} columns={columns} dataSource={lines} />
      <Button icon={<PlusOutlined />} onClick={addLine} style={{ marginTop: 10 }}>
        Them dong
      </Button>

      <div className="split-grid">
        <Form.Item label="Tin nhan goc">
          <Input.TextArea value={rawChat} onChange={(event) => setRawChat(event.target.value)} rows={6} />
        </Form.Item>
        <div className="parse-panel">
          <Typography.Text strong>Ket qua tach nhanh</Typography.Text>
          {parsed.matched.map((line) => (
            <div key={line.rawLine} className="card-line">
              <span>{line.productName}</span>
              <b>{line.quantity} {line.unit}</b>
            </div>
          ))}
          {parsed.unmatched.map((line) => (
            <Typography.Text key={line} type="warning" style={{ display: "block" }}>
              Can xem lai: {line}
            </Typography.Text>
          ))}
        </div>
      </div>

      <Form.Item label="Ghi chu noi bo" name="note">
        <Input.TextArea rows={3} />
      </Form.Item>
      <Space>
        <Button type="primary" icon={<SaveOutlined />}>Luu don van hanh</Button>
        <Button>In phieu dong hang</Button>
      </Space>
    </Form>
  );
}
