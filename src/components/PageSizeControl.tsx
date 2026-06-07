"use client";

import { Select, Typography } from "antd";
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
      <Select size="small" value={value} options={[...pageSizeOptions]} onChange={(next) => onChange(next as PageSizeValue)} style={{ width: 104 }} />
    </div>
  );
}

export function tablePagination(pageSize: PageSizeValue, total: number, onPageSizeChange?: (value: PageSizeValue) => void): false | TablePaginationConfig {
  const effectivePageSize = pageSize === "all" ? Math.max(total, 1) : pageSize;
  const pageSizeOptions = Array.from(new Set([10, 30, 50, Math.max(total, 1)])).sort((a, b) => a - b).map(String);
  const toPageSizeValue = (size: number): PageSizeValue => (total > 0 && size >= total ? "all" : (size as 10 | 30 | 50));
  return {
    pageSize: effectivePageSize,
    showSizeChanger: true,
    pageSizeOptions,
    showTotal: () => `Tổng ${total.toLocaleString("vi-VN")} dòng`,
    size: "small",
    onShowSizeChange: (_current, size) => onPageSizeChange?.(toPageSizeValue(size)),
    onChange: (_page, size) => {
      if (size && size !== effectivePageSize) onPageSizeChange?.(toPageSizeValue(size));
    }
  };
}

export function limitRows<T>(rows: T[], pageSize: PageSizeValue): T[] {
  if (pageSize === "all") return rows;
  return rows.slice(0, pageSize);
}
