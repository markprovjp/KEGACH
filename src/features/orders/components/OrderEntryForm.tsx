"use client";

import { FileTextOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Input, InputNumber, Select, Space, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { PageSizeControl, tablePagination, type PageSizeValue } from "@/components/PageSizeControl";
import type { CatalogProduct } from "@/features/catalog/catalog-types";
import { ProductSearch } from "@/features/catalog/components/ProductSearch";
import { CustomerSearch } from "@/features/customers/components/CustomerSearch";
import { estimateOrderWeightKg, parseKiotInvoiceText } from "@/features/orders/kiot-invoice-parser";
import { orderTypeLabels, paymentStatusLabels, type OrderType, type PaymentStatus } from "@/features/orders/order-workflow";
import { WorkflowChecklist } from "@/features/orders/components/WorkflowChecklist";

type Line = {
  key: string;
  productId?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
};

type OrderFormValues = {
  kiotInvoiceCode?: string;
  sourceChannel?: string;
  orderType?: OrderType;
  isOfficial?: boolean;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerId?: string;
  codAmount?: number;
  paymentKind?: "cod" | "debt";
  paymentStatus?: PaymentStatus;
  deliveryMode?: "truck_share" | "direct_truck";
  freightPayer?: "customer" | "company";
  packageCount?: number;
  estimatedWeightKg?: number;
  workflowChecks?: string[];
  note?: string;
};

const defaultInvoiceText = `HÓA ĐƠN BÁN HÀNG
Số hóa đơn: HD004066
Ngày 04 tháng 06 năm 2026
Khách hàng: anh hào hà nội
SĐT: 0964111081
STT
Mã hàng
Tên hàng
ĐVT
Số lượng
Đơn giá
Thành tiền
1
SP000022
b04
60
40,000
2,400,000
2
SP000021
b03
90
40,000
3,600,000
Tổng thanh toán:
6,000,000
Khách hàng thanh toán:
0
Còn lại:
6,000,000`;

export function OrderEntryForm() {
  const [form] = Form.useForm<OrderFormValues>();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [rawText, setRawText] = useState(defaultInvoiceText);
  const [saving, setSaving] = useState(false);
  const [linePageSize, setLinePageSize] = useState<PageSizeValue>(10);
  const parsed = useMemo(() => parseKiotInvoiceText(rawText, products), [rawText, products]);
  const watchedValues = Form.useWatch([], form) ?? {};

  useEffect(() => {
    void loadProducts();
  }, []);

  const columns: ColumnsType<Line> = [
    {
      title: "Sản phẩm",
      dataIndex: "productId",
      render: (_, record) => <ProductSearch products={products} value={record.productId} onChange={(value) => updateLine(record.key, { productId: value })} />
    },
    {
      title: "SL",
      dataIndex: "quantity",
      width: 120,
      render: (_, record) => <InputNumber min={1} value={record.quantity} onChange={(value) => updateLine(record.key, { quantity: Number(value ?? 1) })} />
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      width: 160,
      render: (_, record) => <InputNumber min={0} step={1000} value={record.unitPrice} onChange={(value) => updateLine(record.key, { unitPrice: Number(value ?? 0) })} />
    }
  ];

  async function loadProducts() {
    const response = await fetch("/api/products");
    setProducts(await response.json());
  }

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((current) => [...current, { key: crypto.randomUUID(), quantity: 1, unitPrice: 0 }]);
  }

  function applyKiotInvoice() {
    if (!parsed.kiotInvoiceCode) {
      message.warning("Chưa thấy số hóa đơn Kiot trong nội dung paste");
      return;
    }
    const nextLines = parsed.lines.map((line) => ({
      key: crypto.randomUUID(),
      productId: line.productId,
      productName: line.productName,
      quantity: line.quantity,
      unitPrice: line.unitPrice
    }));
    setLines(nextLines);
    form.setFieldsValue({
      kiotInvoiceCode: parsed.kiotInvoiceCode,
      sourceChannel: "kiot_print",
      orderType: "online",
      isOfficial: true,
      customerName: parsed.customerName,
      customerPhone: parsed.customerPhone,
      paymentStatus: parsed.remainingDebt && parsed.remainingDebt > 0 ? "unpaid" : "paid",
      paymentKind: parsed.remainingDebt && parsed.remainingDebt > 0 ? "debt" : "cod",
      codAmount: parsed.totalPayment ?? 0,
      deliveryMode: "truck_share",
      freightPayer: "customer",
      packageCount: nextLines.length,
      estimatedWeightKg: estimateOrderWeightKg(parsed.lines, products)
    });
    message.success("Đã trích xuất hóa đơn Kiot vào đơn vận hành");
  }

  async function saveOrder() {
    const values = form.getFieldsValue();
    setSaving(true);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, rawText, lines })
    });
    setSaving(false);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Không lưu được đơn" }));
      message.error(error.error ?? "Không lưu được đơn");
      return;
    }
    const order = await response.json();
    message.success(`Đã lưu đơn ${order.code} vào database`);
  }

  return (
    <Form form={form} layout="vertical" className="order-form" initialValues={{ sourceChannel: "kiot_print", orderType: "online", isOfficial: false, paymentKind: "debt", paymentStatus: "unpaid", deliveryMode: "truck_share", freightPayer: "customer", workflowChecks: [] }}>
      <div className="split-grid">
        <Form.Item label="Paste hóa đơn Kiot / text OCR">
          <Input.TextArea value={rawText} onChange={(event) => setRawText(event.target.value)} rows={12} />
        </Form.Item>
        <div className="parse-panel">
          <div className="card-line">
            <Typography.Text strong>Trích xuất hóa đơn Kiot</Typography.Text>
            <Button icon={<FileTextOutlined />} onClick={applyKiotInvoice}>Đưa vào đơn</Button>
          </div>
          <p><b>Hóa đơn:</b> {parsed.kiotInvoiceCode ?? "-"}</p>
          <p><b>Khách:</b> {parsed.customerName ?? "-"} {parsed.customerPhone ? `- ${parsed.customerPhone}` : ""}</p>
          <p><b>Tổng thanh toán:</b> {(parsed.totalPayment ?? 0).toLocaleString("vi-VN")}đ</p>
          <p><b>Còn nợ:</b> {(parsed.remainingDebt ?? 0).toLocaleString("vi-VN")}đ</p>
          {parsed.lines.map((line) => (
            <div key={`${line.sku}-${line.rawName}`} className="card-line">
              <span>{line.productName}</span>
              <b>{line.quantity} x {line.unitPrice.toLocaleString("vi-VN")}đ</b>
            </div>
          ))}
        </div>
      </div>

      <div className="form-grid">
        <Form.Item label="Mã hóa đơn Kiot" name="kiotInvoiceCode"><Input placeholder="HD004066" /></Form.Item>
        <Form.Item label="Kênh nhận đơn" name="sourceChannel">
          <Select options={[{ value: "kiot_print", label: "In từ Kiot Việt" }, { value: "zalo", label: "Zalo" }, { value: "facebook", label: "Facebook" }, { value: "phone", label: "Điện thoại" }, { value: "counter", label: "Tại quầy" }]} />
        </Form.Item>
        <Form.Item label="Loại đơn vận hành" name="orderType">
          <Select options={Object.entries(orderTypeLabels).map(([value, label]) => ({ value, label }))} />
        </Form.Item>
        <Form.Item label="Loại phiếu" name="isOfficial">
          <Select options={[{ value: false, label: "Đơn nháp" }, { value: true, label: "Đơn chính thức" }]} />
        </Form.Item>
        <Form.Item label="Khách hàng có sẵn" name="customerId"><CustomerSearch /></Form.Item>
        <Form.Item label="Tên khách" name="customerName"><Input /></Form.Item>
        <Form.Item label="SĐT" name="customerPhone"><Input /></Form.Item>
        <Form.Item label="Địa chỉ giao/COD" name="customerAddress"><Input /></Form.Item>
        <Form.Item label="Ngày hẹn gửi" name="promisedSendDate"><DatePicker style={{ width: "100%" }} /></Form.Item>
      </div>

      <div className="form-grid">
        <Form.Item label="Loại thanh toán" name="paymentKind"><Select options={[{ value: "debt", label: "Ghi nợ / chưa trả" }, { value: "cod", label: "Gửi COD" }]} /></Form.Item>
        <Form.Item label="Trạng thái thanh toán" name="paymentStatus"><Select options={Object.entries(paymentStatusLabels).map(([value, label]) => ({ value, label }))} /></Form.Item>
        <Form.Item label="Tiền thu COD" name="codAmount"><InputNumber min={0} step={10000} style={{ width: "100%" }} /></Form.Item>
        <Form.Item label="Loại gửi" name="deliveryMode"><Select options={[{ value: "truck_share", label: "Gửi xe tải ghép / nhà xe" }, { value: "direct_truck", label: "Xe tải riêng / giao thẳng" }]} /></Form.Item>
        <Form.Item label="Cước" name="freightPayer"><Select options={[{ value: "customer", label: "Khách trả" }, { value: "company", label: "Cơ sở trả" }]} /></Form.Item>
        <Form.Item label="Số kiện" name="packageCount"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
        <Form.Item label="Khối lượng ước tính (kg)" name="estimatedWeightKg"><InputNumber min={0} step={0.1} style={{ width: "100%" }} /></Form.Item>
      </div>

      <Form.Item name="workflowChecks" noStyle>
        <WorkflowChecklist
          order={{
            status: watchedValues.isOfficial && watchedValues.kiotInvoiceCode ? "kiot_linked" : "draft",
            orderType: watchedValues.orderType,
            isOfficial: watchedValues.isOfficial,
            kiotInvoiceCode: watchedValues.kiotInvoiceCode,
            customerName: watchedValues.customerName,
            customerPhone: watchedValues.customerPhone,
            customerAddress: watchedValues.customerAddress,
            codAmount: watchedValues.codAmount,
            paymentStatus: watchedValues.paymentStatus,
            deliveryMode: watchedValues.deliveryMode,
            packageCount: watchedValues.packageCount,
            estimatedWeightKg: watchedValues.estimatedWeightKg
          }}
        />
      </Form.Item>

      <PageSizeControl total={lines.length} value={linePageSize} onChange={setLinePageSize} />
      <Table rowKey="key" size="small" pagination={tablePagination(linePageSize, lines.length)} columns={columns} dataSource={lines} />
      <Button icon={<PlusOutlined />} onClick={addLine} style={{ marginTop: 10 }}>Thêm dòng</Button>

      <Form.Item label="Ghi chú nội bộ" name="note" style={{ marginTop: 12 }}><Input.TextArea rows={3} /></Form.Item>
      <Space>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveOrder}>Lưu đơn vào database</Button>
        <Button onClick={() => message.info("Đã tạo phiếu đóng hàng mẫu")}>In phiếu đóng hàng</Button>
      </Space>
    </Form>
  );
}
