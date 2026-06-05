"use client";

import { Segmented, Typography } from "antd";
import type { TablePaginationConfig } from "antd/es/table";

export type PageSizeValue = 10 | 30 | 50 | "all";

const pageSizeOptions = [
  { label: "10", value: 10 },
  { label: "30", value: 30 },
  { label: "50", value: 50 },
  { label: "Tất cả", value: "all" }
] as const;

export function PageSizeControl({ total, value, onChange, noun = "dòng" }: { total: number; value: PageSizeValue; onChange: (value: PageSizeValue) => void; noun?: string }) {
  return (
    <div className="page-size-control">
      <Typography.Text type="secondary">Tổng {total.toLocaleString("vi-VN")} {noun}</Typography.Text>
      <Segmented size="small" value={value} options={[...pageSizeOptions]} onChange={(next) => onChange(next as PageSizeValue)} />
    </div>
  );
}

export function tablePagination(pageSize: PageSizeValue, total: number): false | TablePaginationConfig {
  if (pageSize === "all") return false;
  return {
    pageSize,
    showSizeChanger: false,
    showTotal: () => `Tổng ${total.toLocaleString("vi-VN")} dòng`,
    size: "small"
  };
}

export function limitRows<T>(rows: T[], pageSize: PageSizeValue): T[] {
  if (pageSize === "all") return rows;
  return rows.slice(0, pageSize);
}
