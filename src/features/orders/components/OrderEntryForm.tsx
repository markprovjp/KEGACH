"use client";

import { DeleteOutlined, FileTextOutlined, MessageOutlined, PlusOutlined, PrinterOutlined, SaveOutlined } from "@ant-design/icons";
import { Alert, App, Button, DatePicker, Form, Input, InputNumber, Modal, Segmented, Select, Space, Table, Tabs, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { PageSizeControl, tablePagination, type PageSizeValue } from "@/components/PageSizeControl";
import type { CatalogProduct } from "@/features/catalog/catalog-types";
import { ProductSearch } from "@/features/catalog/components/ProductSearch";
import { CustomerSearch } from "@/features/customers/components/CustomerSearch";
import { parseFreeformOrderText } from "@/features/orders/freeform-order-parser";
import { estimateOrderWeightKg, parseKiotInvoiceText } from "@/features/orders/kiot-invoice-parser";
import { orderTypeLabels, paymentStatusLabels, type OrderType, type PaymentStatus } from "@/features/orders/order-workflow";
import { WorkflowChecklist } from "@/features/orders/components/WorkflowChecklist";
import { formatMoney, formatMoneyInput, formatQuantityInput, parseMoneyInput, parseQuantityInput } from "@/lib/number-format";

type Line = {
  key: string;
  productId?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  enteredQuantity?: number;
  enteredUnit?: string;
  conversionNote?: string;
};

type InventoryRow = {
  productId: string;
  available: number;
  unit: string;
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
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  codAmount?: number;
  paymentKind?: "cod" | "debt";
  paymentStatus?: PaymentStatus;
  deliveryMode?: "truck_share" | "direct_truck";
  freightPayer?: "customer" | "company";
  carrierName?: string;
  driverName?: string;
  packageCount?: number;
  estimatedWeightKg?: number;
  workflowChecks?: string[];
  note?: string;
};

type CarrierOption = {
  id: string;
  name: string;
  phone: string;
  route: string;
};

type CustomerOption = {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  province?: string | null;
  note?: string | null;
};

type EntryMode = "invoice" | "message" | "ocr";
type OrderMode = "draft" | "official";
type QuickProductFormValues = {
  name: string;
  unit: string;
  defaultPrice: number;
  packageRule?: string;
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

const defaultMessageText = `B07 ship e 1 thùng
2 thùng keo 2 thành phần màu 08
20kg ke nêm 1.5mm`;

export function OrderEntryForm() {
  const { message } = App.useApp();
  const [form] = Form.useForm<OrderFormValues>();
  const [quickProductForm] = Form.useForm<QuickProductFormValues>();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [carriers, setCarriers] = useState<CarrierOption[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [rawText, setRawText] = useState(defaultInvoiceText);
  const [messageText, setMessageText] = useState(defaultMessageText);
  const [entryMode, setEntryMode] = useState<EntryMode>("invoice");
  const [orderMode, setOrderMode] = useState<OrderMode>("draft");
  const [quickProductLineKey, setQuickProductLineKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [linePageSize, setLinePageSize] = useState<PageSizeValue>(10);
  const parsed = useMemo(() => parseKiotInvoiceText(rawText, products), [rawText, products]);
  const parsedMessage = useMemo(() => parseFreeformOrderText(messageText, products), [messageText, products]);
  const watchedValues = Form.useWatch([], form) ?? {};
  const isOfficial = orderMode === "official";
  const stockByProductId = useMemo(() => new Map(inventory.map((row) => [row.productId, row])), [inventory]);
  const stockWarnings = useMemo(() => lines
    .map((line) => {
      if (!line.productId) return null;
      const stock = stockByProductId.get(line.productId);
      const productName = products.find((product) => product.id === line.productId)?.name ?? line.productName ?? "Sản phẩm";
      const shortage = Math.max(0, line.quantity - (stock?.available ?? 0));
      return shortage > 0 ? `${productName} thiếu ${shortage.toLocaleString("vi-VN")} ${stock?.unit ?? ""}` : null;
    })
    .filter((item): item is string => Boolean(item)), [lines, products, stockByProductId]);

  useEffect(() => {
    void loadProducts();
    void loadInventory();
    fetch("/api/carriers").then((response) => response.json()).then(setCarriers).catch(() => setCarriers([]));
    setLines([{ key: crypto.randomUUID(), quantity: 1, unitPrice: 0 }]);
  }, []);

  useEffect(() => {
    form.setFieldsValue({ isOfficial });
  }, [form, isOfficial]);

  const totalQuantity = lines.reduce((sum, line) => sum + Number(line.quantity ?? 0), 0);
  const totalAmount = lines.reduce((sum, line) => sum + Number(line.quantity ?? 0) * Number(line.unitPrice ?? 0), 0);

  const invoiceColumns: ColumnsType<Line> = [
    {
      title: "STT",
      width: 64,
      align: "center",
      render: (_value, _record, index) => index + 1
    },
    {
      title: "Tên hàng",
      dataIndex: "productId",
      width: 420,
      render: (_, record) => <ProductSearch products={products} value={record.productId} onChange={(value) => selectProductForLine(record, value)} onCreateRequest={(name) => openQuickProduct(record.key, name)} />
    },
    {
      title: "ĐVT",
      width: 90,
      render: (_, record) => products.find((product) => product.id === record.productId)?.unit ?? "-"
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      width: 130,
      align: "right",
      render: (_, record) => (
        <div>
          <InputNumber min={0.001} step={0.5} value={record.quantity} formatter={formatQuantityInput} parser={parseQuantityInput} onChange={(value) => updateLine(record.key, { quantity: Number(value ?? 1), conversionNote: undefined })} style={{ width: "100%" }} />
          {record.conversionNote ? <Typography.Text type="secondary" className="line-conversion-note">{record.conversionNote}</Typography.Text> : null}
        </div>
      )
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      width: 150,
      align: "right",
      render: (_, record) => <InputNumber min={0} step={1000} value={record.unitPrice} formatter={formatMoneyInput} parser={parseMoneyInput} suffix="đ" onChange={(value) => updateLine(record.key, { unitPrice: Number(value ?? 0) })} style={{ width: "100%" }} />
    },
    {
      title: "Thành tiền",
      width: 150,
      align: "right",
      render: (_, record) => formatMoney(record.quantity * record.unitPrice)
    },
    {
      title: "Tồn/thiếu",
      width: 150,
      render: (_, record) => {
        const stock = record.productId ? stockByProductId.get(record.productId) : undefined;
        const shortage = Math.max(0, record.quantity - (stock?.available ?? 0));
        return shortage > 0 ? <Tag color="red">Thiếu {shortage.toLocaleString("vi-VN")} {stock?.unit}</Tag> : <Tag color="green">{stock ? `${stock.available.toLocaleString("vi-VN")} ${stock.unit}` : "Đủ"}</Tag>;
      }
    },
    {
      title: "",
      width: 54,
      align: "center",
      render: (_, record) => <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeLine(record.key)} />
    }
  ];

  const compactColumns: ColumnsType<Line> = [
    {
      title: "Sản phẩm",
      dataIndex: "productId",
      width: 420,
      render: (_, record) => <ProductSearch products={products} value={record.productId} onChange={(value) => selectProductForLine(record, value)} onCreateRequest={(name) => openQuickProduct(record.key, name)} />
    },
    {
      title: "SL",
      dataIndex: "quantity",
      width: 120,
      render: (_, record) => (
        <div>
          <InputNumber min={0.001} step={0.5} value={record.quantity} formatter={formatQuantityInput} parser={parseQuantityInput} onChange={(value) => updateLine(record.key, { quantity: Number(value ?? 1), conversionNote: undefined })} />
          {record.conversionNote ? <Typography.Text type="secondary" className="line-conversion-note">{record.conversionNote}</Typography.Text> : null}
        </div>
      )
    },
    {
      title: "Tồn khả dụng",
      dataIndex: "productId",
      width: 140,
      render: (_, record) => {
        const stock = record.productId ? stockByProductId.get(record.productId) : undefined;
        return stock ? `${stock.available.toLocaleString("vi-VN")} ${stock.unit}` : "-";
      }
    },
    {
      title: "Thiếu",
      dataIndex: "productId",
      width: 120,
      render: (_, record) => {
        const stock = record.productId ? stockByProductId.get(record.productId) : undefined;
        const shortage = Math.max(0, record.quantity - (stock?.available ?? 0));
        return shortage > 0 ? <Tag color="red">{shortage.toLocaleString("vi-VN")} {stock?.unit}</Tag> : <Tag color="green">Đủ</Tag>;
      }
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      width: 160,
      render: (_, record) => <InputNumber min={0} step={1000} value={record.unitPrice} formatter={formatMoneyInput} parser={parseMoneyInput} suffix="đ" onChange={(value) => updateLine(record.key, { unitPrice: Number(value ?? 0) })} />
    }
  ];

  async function loadProducts() {
    const response = await fetch("/api/products");
    setProducts(await response.json());
  }

  async function loadInventory() {
    const response = await fetch("/api/inventory");
    setInventory(await response.json());
  }

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function selectProductForLine(line: Line, productId: string) {
    const product = products.find((item) => item.id === productId);
    updateLine(line.key, {
      productId,
      productName: product?.name,
      unitPrice: product?.defaultPrice ?? line.unitPrice,
      enteredQuantity: undefined,
      enteredUnit: undefined,
      conversionNote: undefined
    });
  }

  function applyCustomer(customer?: CustomerOption) {
    if (!customer) {
      form.setFieldValue("customerId", undefined);
      return;
    }
    form.setFieldsValue({
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone ?? undefined,
      customerAddress: customer.address ?? undefined
    });
  }

  function addLine() {
    setLines((current) => [...current, { key: crypto.randomUUID(), quantity: 1, unitPrice: 0 }]);
  }

  function openQuickProduct(lineKey: string, name: string) {
    setQuickProductLineKey(lineKey);
    quickProductForm.setFieldsValue({ name, unit: "cái", defaultPrice: 0, packageRule: "" });
  }

  function removeLine(key: string) {
    setLines((current) => current.filter((line) => line.key !== key));
  }

  async function saveQuickProduct() {
    const values = await quickProductForm.validateFields();
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name.trim(),
        unit: values.unit.trim(),
        defaultPrice: Number(values.defaultPrice ?? 0),
        packageRule: values.packageRule?.trim() || null,
        aliases: [{ value: values.name.trim() }],
        weightPerUnitKg: values.unit === "kg" ? 1 : 0
      })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Không thêm được sản phẩm" }));
      message.error(error.error ?? "Không thêm được sản phẩm");
      return;
    }
    const product = await response.json();
    setProducts((current) => {
      const filtered = current.filter((item) => item.id !== product.id);
      return [...filtered, product].sort((a, b) => a.name.localeCompare(b.name, "vi"));
    });
    await loadInventory();
    if (quickProductLineKey) selectProductForLine({ key: quickProductLineKey, quantity: 1, unitPrice: 0 }, product.id);
    setQuickProductLineKey(null);
    quickProductForm.resetFields();
    message.success(`Đã thêm sản phẩm ${product.name}`);
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
    setOrderMode("official");
    message.success("Đã trích xuất hóa đơn Kiot vào đơn vận hành");
  }

  function applyFreeformMessage() {
    if (!parsedMessage.matched.length) {
      message.warning("Chưa nhận diện được dòng hàng nào. Hãy thêm sản phẩm mới hoặc kiểm tra alias.");
      return;
    }
    setLines(parsedMessage.matched.map((line) => ({
      key: crypto.randomUUID(),
      productId: line.productId,
      productName: line.productName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      enteredQuantity: line.enteredQuantity,
      enteredUnit: line.enteredUnit,
      conversionNote: line.conversionNote
    })));
    const totalWeight = parsedMessage.matched.reduce((sum, line) => {
      const product = products.find((item) => item.id === line.productId);
      return sum + line.quantity * (product?.weightPerUnitKg ?? (product?.unit === "kg" ? 1 : 0));
    }, 0);
    form.setFieldsValue({
      orderType: "truck_share",
      deliveryMode: "truck_share",
      freightPayer: "customer",
      packageCount: parsedMessage.matched.length,
      estimatedWeightKg: Number(totalWeight.toFixed(1))
    });
    message.success(`Đã tách ${parsedMessage.matched.length} dòng hàng từ lời khách`);
  }

  function printPackingSlip() {
    if (!lines.length) {
      message.warning("Chưa có dòng hàng để in phiếu soạn");
      return;
    }
    const values = form.getFieldsValue();
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) {
      message.error("Trình duyệt đang chặn cửa sổ in");
      return;
    }
    const rows = lines.map((line, index) => {
      const product = products.find((item) => item.id === line.productId);
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(product?.name ?? line.productName ?? "")}</td>
          <td>${escapeHtml(product?.unit ?? "")}</td>
          <td>${line.quantity.toLocaleString("vi-VN")}</td>
          <td></td>
        </tr>
      `;
    }).join("");
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Phiếu soạn hàng</title>
          <style>
            body { font-family: "Times New Roman", serif; color: #111; margin: 28px; }
            .header { text-align: center; font-weight: 700; line-height: 1.25; font-size: 20px; }
            .title { text-align: center; font-size: 24px; font-weight: 700; margin: 22px 0 6px; }
            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 48px; font-size: 18px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 18px; }
            th, td { border: 1px solid #444; padding: 8px; }
            th { font-weight: 700; }
            td:nth-child(1), td:nth-child(3), td:nth-child(4), td:nth-child(5) { text-align: center; }
            .footer { display: grid; grid-template-columns: 1fr 1fr; margin-top: 46px; text-align: center; font-size: 18px; }
            .note { margin-top: 18px; white-space: pre-wrap; font-size: 16px; }
            @media print { body { margin: 18mm; } }
          </style>
        </head>
        <body>
          <div class="header">
            PHỤ KIỆN ỐP LÁT THANH HÓA<br />
            CƠ SỞ SẢN XUẤT NHỰA: LONG HẢI PLASTIC<br />
            Đ/C: Đông Lĩnh - Đông Sơn - Thanh Hóa<br />
            Điện thoại: 0393.393.188 / Zalo: 0393.393.188
          </div>
          <div class="title">PHIẾU SOẠN HÀNG</div>
          <div class="meta">
            <div><b>Khách hàng:</b> ${escapeHtml(values.customerName ?? "")}</div>
            <div><b>SĐT:</b> ${escapeHtml(values.customerPhone ?? "")}</div>
            <div><b>Người nhận:</b> ${escapeHtml(values.receiverName || values.customerName || "")}</div>
            <div><b>SĐT nhận:</b> ${escapeHtml(values.receiverPhone || values.customerPhone || "")}</div>
            <div><b>Địa chỉ:</b> ${escapeHtml(values.receiverAddress || values.customerAddress || "-")}</div>
            <div><b>Nhà xe:</b> ${escapeHtml(values.carrierName ?? "-")}</div>
            <div><b>Số kiện:</b> ${values.packageCount ?? ""}</div>
            <div><b>Khối lượng:</b> ${values.estimatedWeightKg ?? ""} kg</div>
          </div>
          <table>
            <thead><tr><th>STT</th><th>Tên hàng</th><th>ĐVT</th><th>Số lượng</th><th>Đã soạn</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="note"><b>Ghi chú:</b> ${escapeHtml(values.note ?? "")}</div>
          <div class="footer"><div>Người soạn hàng</div><div>Người kiểm hàng</div></div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  async function saveOrder(nextOfficial = isOfficial) {
    const values = { ...form.getFieldsValue(), isOfficial: nextOfficial };
    form.setFieldValue("isOfficial", nextOfficial);
    setOrderMode(nextOfficial ? "official" : "draft");
    setSaving(true);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, rawText: entryMode === "message" ? messageText : rawText, lines })
    });
    setSaving(false);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Không lưu được đơn" }));
      message.error(error.error ?? "Không lưu được đơn");
      return;
    }
    const order = await response.json();
    const statusText = order.status === "awaiting_stock" ? " - đang chờ nhập hàng" : nextOfficial ? " - đơn chính thức" : " - đơn nháp";
    message.success(`Đã lưu đơn ${order.code}${statusText}`);
  }

  return (
    <>
    <Form form={form} layout="vertical" className="order-form" initialValues={{ sourceChannel: "kiot_print", orderType: "online", isOfficial: false, paymentKind: "debt", paymentStatus: "unpaid", deliveryMode: "truck_share", freightPayer: "customer", workflowChecks: [] }}>
      <div className="order-mode-panel">
        <div>
          <Typography.Text strong>Chế độ lên đơn</Typography.Text>
          <div className="muted">Đơn nháp dùng để gửi Tân chuẩn bị hàng hoặc giữ nhu cầu khi đang thiếu hàng. Đơn chính thức là đơn đã chốt, có hóa đơn Kiot.</div>
        </div>
        <Segmented
          value={orderMode}
          onChange={(value) => setOrderMode(value as OrderMode)}
          options={[
            { value: "draft", label: "Đơn nháp" },
            { value: "official", label: "Đơn chính thức" }
          ]}
        />
      </div>
      {stockWarnings.length ? <Alert type="warning" showIcon title="Có hàng thiếu, đơn sẽ vào cột Chờ nhập hàng" description={stockWarnings.slice(0, 5).join(" • ")} style={{ marginBottom: 12 }} /> : null}
      <div className="order-workbench">
        <Tabs
          type="card"
          items={[
            {
              key: "entry",
              label: "1. Nhập đơn",
              children: (
                <>
                  <Segmented
                    className="entry-mode-switch"
                    value={entryMode}
                    onChange={(value) => setEntryMode(value as EntryMode)}
                    options={[
                      { value: "invoice", label: "Nhập như hóa đơn" },
                      { value: "message", label: "Từ lời khách" },
                      { value: "ocr", label: "Paste OCR Kiot" }
                    ]}
                  />
                  {entryMode === "ocr" ? (
                    <div className="order-intake-grid">
                      <Form.Item label="Paste hóa đơn Kiot / text OCR">
                        <Input.TextArea value={rawText} onChange={(event) => setRawText(event.target.value)} rows={14} />
                      </Form.Item>
                      <div className="parse-panel parse-panel-sticky">
                        <div className="card-line">
                          <Typography.Text strong>Trích xuất hóa đơn Kiot</Typography.Text>
                          <Button icon={<FileTextOutlined />} onClick={applyKiotInvoice}>Đưa vào đơn</Button>
                        </div>
                        <div className="order-facts">
                          <span>Hóa đơn</span><b>{parsed.kiotInvoiceCode ?? "-"}</b>
                          <span>Khách</span><b>{parsed.customerName ?? "-"} {parsed.customerPhone ? `- ${parsed.customerPhone}` : ""}</b>
                          <span>Tổng</span><b>{(parsed.totalPayment ?? 0).toLocaleString("vi-VN")}đ</b>
                          <span>Còn nợ</span><b>{(parsed.remainingDebt ?? 0).toLocaleString("vi-VN")}đ</b>
                        </div>
                        <div className="parse-lines">
                          {parsed.lines.map((line) => (
                            <div key={`${line.sku}-${line.rawName}`} className="card-line">
                              <span>{line.productName}</span>
                          <b>{line.quantity.toLocaleString("vi-VN")} x {formatMoney(line.unitPrice)}</b>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : entryMode === "message" ? (
                    <div className="order-intake-grid">
                      <Form.Item label="Paste lời khách / tin Zalo">
                        <Input.TextArea value={messageText} onChange={(event) => setMessageText(event.target.value)} rows={14} placeholder="Ví dụ: B07 ship e 1 thùng" />
                      </Form.Item>
                      <div className="parse-panel parse-panel-sticky">
                        <div className="card-line">
                          <Typography.Text strong>Tách hàng và quy đổi</Typography.Text>
                          <Button icon={<MessageOutlined />} onClick={applyFreeformMessage}>Đưa vào đơn</Button>
                        </div>
                        <div className="parse-lines">
                          {parsedMessage.matched.map((line) => (
                            <div key={`${line.rawLine}-${line.productId}`} className="parse-line-match">
                              <div className="card-line">
                                <span>{line.productName}</span>
                                <b>{line.quantity.toLocaleString("vi-VN")} {line.unit}</b>
                              </div>
                              <Typography.Text type="secondary">{line.conversionNote ?? `${line.enteredQuantity.toLocaleString("vi-VN")} ${line.enteredUnit}`}</Typography.Text>
                            </div>
                          ))}
                          {parsedMessage.unmatched.map((line) => (
                            <Alert key={line} type="warning" showIcon title="Chưa nhận diện" description={line} style={{ marginTop: 8 }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="manual-invoice">
                      <div className="manual-invoice-header">
                        <b>PHỤ KIỆN ỐP LÁT THANH HÓA</b>
                        <span>CƠ SỞ SẢN XUẤT NHỰA: LONG HẢI PLASTIC</span>
                        <span>Đ/C: Đông Lĩnh - Đông Sơn - Thanh Hóa</span>
                        <span>Điện thoại: 0393.393.188 / Zalo: 0393.393.188</span>
                      </div>
                      <div className="manual-invoice-title">{isOfficial ? "HÓA ĐƠN BÁN HÀNG" : "ĐƠN NHÁP BÁN HÀNG"}</div>
                      {isOfficial ? (
                        <div className="manual-invoice-meta">
                          <Form.Item label="Số hóa đơn" name="kiotInvoiceCode"><Input placeholder="HD004102" /></Form.Item>
                          <Form.Item label="Kênh nhận đơn" name="sourceChannel">
                            <Select options={[{ value: "kiot_print", label: "In từ Kiot Việt" }, { value: "zalo", label: "Zalo" }, { value: "facebook", label: "Facebook" }, { value: "phone", label: "Điện thoại" }, { value: "counter", label: "Tại quầy" }]} />
                          </Form.Item>
                          <Form.Item label="Khách cũ trong hệ thống" name="customerId"><CustomerSearch onSelectCustomer={applyCustomer} /></Form.Item>
                          <Form.Item label="Khách hàng" name="customerName"><Input /></Form.Item>
                          <Form.Item label="SĐT" name="customerPhone"><Input /></Form.Item>
                          <Form.Item label="Địa chỉ" name="customerAddress"><Input /></Form.Item>
                          <Form.Item label="Người nhận cuối" name="receiverName"><Input placeholder="Nếu khách trung gian đặt hộ" /></Form.Item>
                          <Form.Item label="SĐT người nhận" name="receiverPhone"><Input /></Form.Item>
                          <Form.Item label="Địa chỉ người nhận" name="receiverAddress"><Input /></Form.Item>
                          <Form.Item label="Loại đơn" name="orderType">
                            <Select options={Object.entries(orderTypeLabels).map(([value, label]) => ({ value, label }))} />
                          </Form.Item>
                        </div>
                      ) : (
                        <div className="manual-draft-meta">
                          <Form.Item label="Khách cũ" name="customerId"><CustomerSearch onSelectCustomer={applyCustomer} /></Form.Item>
                          <Form.Item label="Khách mới / tên khách" name="customerName"><Input placeholder="Tên khách / đại lý / thợ" /></Form.Item>
                          <Form.Item label="SĐT" name="customerPhone"><Input placeholder="Số điện thoại nếu có" /></Form.Item>
                          <Form.Item label="Địa chỉ / tuyến gửi" name="customerAddress"><Input placeholder="Địa chỉ, tỉnh, nhà xe khách muốn gửi..." /></Form.Item>
                          <Form.Item label="Người nhận cuối" name="receiverName"><Input placeholder="Nếu người đặt là trung gian" /></Form.Item>
                          <Form.Item label="SĐT người nhận" name="receiverPhone"><Input /></Form.Item>
                          <Form.Item label="Địa chỉ người nhận" name="receiverAddress"><Input /></Form.Item>
                          <Form.Item label="Ghi chú nháp" name="note"><Input placeholder="Ví dụ: khách chưa chốt, hỏi thêm hàng, thiếu hàng cần nhập..." /></Form.Item>
                        </div>
                      )}
                      <div className="table-toolbar">
                        <Button icon={<PlusOutlined />} onClick={addLine}>Thêm sản phẩm</Button>
                        <Tag color={stockWarnings.length ? "red" : "green"}>{stockWarnings.length ? `Thiếu ${stockWarnings.length} dòng` : "Đủ tồn"}</Tag>
                      </div>
                      <Table rowKey="key" size="small" pagination={false} columns={invoiceColumns} dataSource={lines} scroll={{ x: 1280 }} />
                      <div className="manual-invoice-total">
                        <span>Tổng số lượng</span><b>{totalQuantity.toLocaleString("vi-VN")}</b>
                        <span>Tổng thanh toán</span><b>{formatMoney(totalAmount)}</b>
                      </div>
                    </div>
                  )}
                </>
              )
            },
            {
              key: "customer",
              label: "2. Khách",
              children: (
                <div className="form-grid compact-form-grid">
                  <Form.Item label="Mã hóa đơn Kiot" name="kiotInvoiceCode"><Input placeholder="HD004066" /></Form.Item>
                  <Form.Item label="Kênh nhận đơn" name="sourceChannel">
                    <Select options={[{ value: "kiot_print", label: "In từ Kiot Việt" }, { value: "zalo", label: "Zalo" }, { value: "facebook", label: "Facebook" }, { value: "phone", label: "Điện thoại" }, { value: "counter", label: "Tại quầy" }]} />
                  </Form.Item>
                  <Form.Item label="Loại đơn vận hành" name="orderType">
                    <Select options={Object.entries(orderTypeLabels).map(([value, label]) => ({ value, label }))} />
                  </Form.Item>
                  <Form.Item label="Loại phiếu" name="isOfficial">
                    <Select
                      options={[{ value: false, label: "Đơn nháp" }, { value: true, label: "Đơn chính thức" }]}
                      onChange={(value) => setOrderMode(value ? "official" : "draft")}
                    />
                  </Form.Item>
                  <Form.Item label="Khách hàng có sẵn" name="customerId"><CustomerSearch onSelectCustomer={applyCustomer} /></Form.Item>
                  <Form.Item label="Tên khách" name="customerName"><Input /></Form.Item>
                  <Form.Item label="SĐT" name="customerPhone"><Input /></Form.Item>
                  <Form.Item label="Địa chỉ giao/COD" name="customerAddress"><Input /></Form.Item>
                  <Form.Item label="Người nhận cuối" name="receiverName"><Input placeholder="Nếu khách đặt hộ người khác" /></Form.Item>
                  <Form.Item label="SĐT người nhận" name="receiverPhone"><Input /></Form.Item>
                  <Form.Item label="Địa chỉ người nhận" name="receiverAddress"><Input /></Form.Item>
                  <Form.Item label="Ngày hẹn gửi" name="promisedSendDate"><DatePicker style={{ width: "100%" }} /></Form.Item>
                </div>
              )
            },
            {
              key: "items",
              label: `3. Hàng (${lines.length})`,
              children: (
                <>
                  <div className="table-toolbar">
                    <Button icon={<PlusOutlined />} onClick={addLine}>Thêm dòng</Button>
                    <PageSizeControl total={lines.length} value={linePageSize} onChange={setLinePageSize} />
                  </div>
                  <Table rowKey="key" size="small" pagination={tablePagination(linePageSize, lines.length, setLinePageSize)} columns={compactColumns} dataSource={lines} scroll={{ x: 980 }} />
                </>
              )
            },
            {
              key: "delivery",
              label: "4. Giao/COD",
              children: (
                <div className="form-grid compact-form-grid">
                  <Form.Item label="Loại thanh toán" name="paymentKind"><Select options={[{ value: "debt", label: "Ghi nợ / chưa trả" }, { value: "cod", label: "Gửi COD" }]} /></Form.Item>
                  <Form.Item label="Trạng thái thanh toán" name="paymentStatus"><Select options={Object.entries(paymentStatusLabels).map(([value, label]) => ({ value, label }))} /></Form.Item>
                  <Form.Item label="Tiền thu COD" name="codAmount"><InputNumber min={0} step={10000} formatter={formatMoneyInput} parser={parseMoneyInput} suffix="đ" style={{ width: "100%" }} /></Form.Item>
                  <Form.Item label="Loại gửi" name="deliveryMode"><Select options={[{ value: "truck_share", label: "Gửi xe tải ghép / nhà xe" }, { value: "direct_truck", label: "Xe tải riêng / giao thẳng" }]} /></Form.Item>
                  <Form.Item label="Cước" name="freightPayer"><Select options={[{ value: "customer", label: "Khách trả" }, { value: "company", label: "Cơ sở trả" }]} /></Form.Item>
                  <Form.Item label="Nhà xe / đơn vị giao" name="carrierName"><Select showSearch allowClear optionFilterProp="label" options={carriers.map((carrier) => ({ value: carrier.name, label: `${carrier.name} - ${carrier.route}` }))} /></Form.Item>
                  <Form.Item label="Tài xế / ghi chú lấy hàng" name="driverName"><Input /></Form.Item>
                  <Form.Item label="Số kiện" name="packageCount"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
                  <Form.Item label="Khối lượng ước tính (kg)" name="estimatedWeightKg"><InputNumber min={0} step={0.1} style={{ width: "100%" }} /></Form.Item>
                </div>
              )
            },
            {
              key: "workflow",
              label: "5. Checklist",
              children: (
                <>
                  <Form.Item name="workflowChecks" noStyle>
                    <WorkflowChecklist
                      order={{
                        status: isOfficial && watchedValues.kiotInvoiceCode ? "kiot_linked" : "draft",
                        orderType: watchedValues.orderType,
                        isOfficial,
                        kiotInvoiceCode: watchedValues.kiotInvoiceCode,
                        customerName: watchedValues.customerName,
                        customerPhone: watchedValues.customerPhone,
                        customerAddress: watchedValues.customerAddress,
                        receiverName: watchedValues.receiverName,
                        receiverPhone: watchedValues.receiverPhone,
                        receiverAddress: watchedValues.receiverAddress,
                        codAmount: watchedValues.codAmount,
                        paymentStatus: watchedValues.paymentStatus,
                        deliveryMode: watchedValues.deliveryMode,
                        carrierName: watchedValues.carrierName,
                        packageCount: watchedValues.packageCount,
                        estimatedWeightKg: watchedValues.estimatedWeightKg
                      }}
                    />
                  </Form.Item>
                  <Form.Item label="Ghi chú nội bộ" name="note"><Input.TextArea rows={3} /></Form.Item>
                </>
              )
            }
          ]}
        />
      </div>
      <div className="order-action-bar">
        <Space>
          <Button icon={<SaveOutlined />} loading={saving} onClick={() => saveOrder(false)}>Lưu đơn nháp</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => saveOrder(true)}>Lưu đơn chính thức</Button>
          <Button icon={<PrinterOutlined />} onClick={printPackingSlip}>In phiếu soạn hàng</Button>
        </Space>
      </div>
    </Form>
    <Modal
      title="Thêm sản phẩm mới"
      open={Boolean(quickProductLineKey)}
      onCancel={() => setQuickProductLineKey(null)}
      onOk={saveQuickProduct}
      okText="Lưu sản phẩm"
      cancelText="Đóng"
    >
      <Form form={quickProductForm} layout="vertical">
        <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true, message: "Nhập tên sản phẩm" }]}>
          <Input />
        </Form.Item>
        <div className="form-grid compact-form-grid">
          <Form.Item label="Đơn vị tính" name="unit" rules={[{ required: true, message: "Nhập đơn vị tính" }]}>
            <Select options={[{ value: "kg", label: "kg" }, { value: "tuýp", label: "tuýp" }, { value: "cái", label: "cái" }, { value: "bộ", label: "bộ" }, { value: "thùng", label: "thùng" }, { value: "can", label: "can" }, { value: "túi", label: "túi" }]} />
          </Form.Item>
          <Form.Item label="Giá bán" name="defaultPrice" rules={[{ required: true, message: "Nhập giá bán" }]}>
            <InputNumber min={0} step={1000} formatter={formatMoneyInput} parser={parseMoneyInput} suffix="đ" style={{ width: "100%" }} />
          </Form.Item>
        </div>
        <Form.Item label="Quy cách / ghi chú" name="packageRule">
          <Input placeholder="Ví dụ: 30 cái / thùng, hàng khách hỏi mới..." />
        </Form.Item>
      </Form>
    </Modal>
    </>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
