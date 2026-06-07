"use client";

import { ClearOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Select, Space, Typography } from "antd";
import type { ReactNode } from "react";
import { PageSizeControl, type PageSizeValue } from "@/components/PageSizeControl";

export type TableFilterOption = {
  value: string | number;
  label: ReactNode;
};

export type TableFilterConfig = {
  key: string;
  label: string;
  value: string | number;
  defaultValue?: string | number;
  options: TableFilterOption[];
  onChange: (value: string | number) => void;
  placeholder?: string;
  showSearch?: boolean;
  width?: number;
};

type TableOperationsBarProps = {
  total: number;
  noun?: string;
  pageSize: PageSizeValue;
  onPageSizeChange: (value: PageSizeValue) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: TableFilterConfig[];
  actions?: ReactNode;
  selectedCount?: number;
  bulkActions?: ReactNode;
  onClearFilters?: () => void;
  clearDisabled?: boolean;
};

export function TableOperationsBar({
  total,
  noun = "dòng",
  pageSize,
  onPageSizeChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm",
  filters = [],
  actions,
  selectedCount = 0,
  bulkActions,
  onClearFilters,
  clearDisabled
}: TableOperationsBarProps) {
  const hasSearch = typeof searchValue === "string" && Boolean(onSearchChange);
  const activeFilterCount = filters.filter((filter) => filter.value !== (filter.defaultValue ?? "all")).length + (searchValue?.trim() ? 1 : 0);
  const disableClear = clearDisabled ?? activeFilterCount === 0;

  return (
    <div className="table-ops-bar">
      <div className={`table-ops-main${filters.length ? "" : " table-ops-main-no-filters"}`}>
        {hasSearch ? (
          <Input
            className="table-ops-search"
            allowClear
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={searchPlaceholder}
          />
        ) : null}
        {filters.length ? (
          <div className="table-ops-filters">
            {filters.map((filter) => (
              <label className="table-ops-filter" key={filter.key}>
                <span>{filter.label}</span>
                <Select
                  value={filter.value}
                  onChange={filter.onChange}
                  options={filter.options}
                  placeholder={filter.placeholder}
                  showSearch={filter.showSearch}
                  optionFilterProp="label"
                  style={{ width: filter.width ?? 168 }}
                />
              </label>
            ))}
          </div>
        ) : null}
        <div className="table-ops-actions">
          <PageSizeControl total={total} value={pageSize} onChange={onPageSizeChange} noun={noun} />
          {onClearFilters ? (
            <Button icon={<ClearOutlined />} disabled={disableClear} onClick={onClearFilters}>
              Xóa lọc
            </Button>
          ) : null}
          {actions ? <Space wrap>{actions}</Space> : null}
        </div>
      </div>
      {bulkActions && selectedCount > 0 ? (
        <div className="table-ops-bulk">
          <Typography.Text strong>Đã chọn {selectedCount.toLocaleString("vi-VN")} {noun}</Typography.Text>
          <Space wrap>{bulkActions}</Space>
        </div>
      ) : null}
    </div>
  );
}
