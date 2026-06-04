"use client";

import { Button, Progress, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

type InventoryRow = {
  key: string;
  product: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  lastMovement: string;
};

const rows: InventoryRow[] = [
  { key: "1", product: "Ke can bang 3MM", onHand: 120, reserved: 18, available: 102, lowStockThreshold: 40, lastMovement: "reserve HD004066" },
  { key: "2", product: "Nem", onHand: 24, reserved: 12, available: 12, lowStockThreshold: 20, lastMovement: "purchase_in 30 bao" },
  { key: "3", product: "Ke chu thap 5MM", onHand: 44, reserved: 8, available: 36, lowStockThreshold: 30, lastMovement: "ship HD004082" }
];

const columns: ColumnsType<InventoryRow> = [
  { title: "San pham", dataIndex: "product", fixed: "left" },
  { title: "Ton", dataIndex: "onHand", align: "right" },
  { title: "Da giu", dataIndex: "reserved", align: "right" },
  {
    title: "Kha dung",
    dataIndex: "available",
    align: "right",
    render: (value, row) => <Tag color={value <= row.lowStockThreshold ? "red" : "green"}>{value}</Tag>
  },
  {
    title: "Canh bao ton thap",
    dataIndex: "lowStockThreshold",
    render: (value, row) => <Progress percent={Math.min(100, Math.round((row.available / value) * 100))} size="small" status={row.available <= value ? "exception" : "normal"} />
  },
  { title: "Bien dong gan nhat", dataIndex: "lastMovement" },
  { title: "Thao tac", render: () => <Button size="small">Dieu chinh</Button> }
];

export function InventoryTable() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="table-fallback">Dang tai bang ton kho...</div>;
  }

  return <Table rowKey="key" size="small" columns={columns} dataSource={rows} pagination={false} scroll={{ x: 850 }} />;
}
