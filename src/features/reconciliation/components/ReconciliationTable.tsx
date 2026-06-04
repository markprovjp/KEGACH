"use client";

import { CheckOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";

type ReconciliationRow = {
  key: string;
  date: string;
  kiotInvoiceCode: string;
  customer: string;
  appOrderCode?: string;
  mismatchType: string;
  requiredAction: string;
  resolutionNote?: string;
  status: "open" | "resolved";
};

const seedRows: ReconciliationRow[] = [
  { key: "1", date: "2026-06-04", kiotInvoiceCode: "HD004088", customer: "Khách lẻ", mismatchType: "Thiếu order app", requiredAction: "Tạo order vận hành hoặc đánh dấu không cần giao", status: "open" },
  { key: "2", date: "2026-06-04", kiotInvoiceCode: "HD004066", customer: "VLXD Minh Phát", appOrderCode: "KG00001", mismatchType: "Lệch COD", requiredAction: "Kiểm tra tiền thu tài xế", status: "open" },
  { key: "3", date: "2026-06-03", kiotInvoiceCode: "HD004071", customer: "Anh Hải thợ lát", appOrderCode: "KG00002", mismatchType: "Lệch sản phẩm", requiredAction: "Xác nhận đổi hàng trước gửi", resolutionNote: "Đang chờ kho xác nhận", status: "open" }
];

export function ReconciliationTable() {
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState(seedRows);
  const [editing, setEditing] = useState<ReconciliationRow | null>(null);
  const [form] = Form.useForm<{ resolutionNote: string }>();

  useEffect(() => {
    setMounted(true);
  }, []);

  const columns: ColumnsType<ReconciliationRow> = useMemo(
    () => [
      { title: "Ngày", dataIndex: "date" },
      { title: "Hóa đơn Kiot", dataIndex: "kiotInvoiceCode", render: (value) => <b>{value}</b> },
      { title: "Khách", dataIndex: "customer" },
      { title: "Mã app", dataIndex: "appOrderCode", render: (value) => value ?? <Tag color="red">Chưa có</Tag> },
      { title: "Loại lệch", dataIndex: "mismatchType", render: (value) => <Tag color="gold">{value}</Tag> },
      { title: "Việc cần làm", dataIndex: "requiredAction" },
      { title: "Ghi chú xử lý", dataIndex: "resolutionNote" },
      { title: "Trạng thái", dataIndex: "status", render: (value) => <Tag color={value === "resolved" ? "green" : "red"}>{value === "resolved" ? "Đã xử lý" : "Đang mở"}</Tag> },
      {
        title: "Thao tác",
        render: (_, row) => (
          <Button size="small" icon={<CheckOutlined />} onClick={() => openResolve(row)}>
            Xử lý
          </Button>
        )
      }
    ],
    []
  );

  function openResolve(row: ReconciliationRow) {
    setEditing(row);
    form.setFieldsValue({ resolutionNote: row.resolutionNote ?? "" });
  }

  function saveResolve() {
    const note = form.getFieldValue("resolutionNote")?.trim();
    if (!note) {
      message.error("Phải nhập ghi chú xử lý");
      return;
    }
    setRows((current) => current.map((row) => (row.key === editing?.key ? { ...row, resolutionNote: note, status: "resolved" } : row)));
    setEditing(null);
    message.success("Đã xử lý dòng đối soát");
  }

  if (!mounted) {
    return <div className="table-fallback">Đang tải bảng đối soát...</div>;
  }

  return (
    <>
      <Table rowKey="key" size="small" columns={columns} dataSource={rows} pagination={false} scroll={{ x: 1120 }} />
      <Modal title={`Xử lý ${editing?.kiotInvoiceCode ?? ""}`} open={!!editing} onCancel={() => setEditing(null)} onOk={saveResolve} okText="Lưu xử lý" cancelText="Đóng" okButtonProps={{ icon: <SaveOutlined /> }}>
        <Form form={form} layout="vertical">
          <Form.Item label="Ghi chú xử lý" name="resolutionNote" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="Ví dụ: đã tạo order app / đã sửa COD / Kiot cần hủy hóa đơn..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
