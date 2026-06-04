"use client";

import { Button, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

type ReconciliationRow = {
  key: string;
  date: string;
  kiotInvoiceCode: string;
  customer: string;
  appOrderCode?: string;
  mismatchType: string;
  requiredAction: string;
  resolutionNote?: string;
};

const rows: ReconciliationRow[] = [
  { key: "1", date: "2026-06-04", kiotInvoiceCode: "HD004088", customer: "Khach le", mismatchType: "Thieu order app", requiredAction: "Tao order van hanh hoac danh dau khong can giao" },
  { key: "2", date: "2026-06-04", kiotInvoiceCode: "HD004066", customer: "VLXD Minh Phat", appOrderCode: "KG00001", mismatchType: "Lech COD", requiredAction: "Kiem tra tien thu tai xe" },
  { key: "3", date: "2026-06-03", kiotInvoiceCode: "HD004071", customer: "Anh Hai Tho Lat", appOrderCode: "KG00002", mismatchType: "Lech san pham", requiredAction: "Xac nhan doi hang truoc gui", resolutionNote: "Dang cho kho xac nhan" }
];

const columns: ColumnsType<ReconciliationRow> = [
  { title: "Ngay", dataIndex: "date" },
  { title: "Hoa don Kiot", dataIndex: "kiotInvoiceCode", render: (value) => <b>{value}</b> },
  { title: "Khach", dataIndex: "customer" },
  { title: "Ma app", dataIndex: "appOrderCode", render: (value) => value ?? <Tag color="red">Chua co</Tag> },
  { title: "Loai lech", dataIndex: "mismatchType", render: (value) => <Tag color="gold">{value}</Tag> },
  { title: "Viec can lam", dataIndex: "requiredAction" },
  { title: "Ghi chu xu ly", dataIndex: "resolutionNote" },
  { title: "Thao tac", render: () => <Button size="small">Xu ly</Button> }
];

export function ReconciliationTable() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="table-fallback">Dang tai bang doi soat...</div>;
  }

  return <Table rowKey="key" size="small" columns={columns} dataSource={rows} pagination={false} scroll={{ x: 980 }} />;
}
