"use client";

import { Select, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { compactAlias } from "@/lib/normalize";

type CustomerOption = {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  province?: string | null;
  note?: string | null;
  customerType?: string | null;
};

export function CustomerSearch({ value, onChange, onSelectCustomer }: { value?: string; onChange?: (value?: string) => void; onSelectCustomer?: (customer?: CustomerOption) => void }) {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetch("/api/customers").then((response) => response.json()).then(setCustomers).catch(() => setCustomers([]));
  }, []);

  const customer = customers.find((item) => item.id === value);
  const visibleCustomers = useMemo(() => {
    const normalized = compactAlias(searchText);
    const matched = normalized
      ? customers.filter((item) => compactAlias(`${item.name} ${item.phone ?? ""} ${item.address ?? ""} ${item.province ?? ""}`).includes(normalized))
      : customers.slice(0, 80);
    const limited = matched.slice(0, 80);
    if (customer && !limited.some((item) => item.id === customer.id)) return [customer, ...limited];
    return limited;
  }, [customer, customers, searchText]);

  return (
    <div>
      <Select
        showSearch
        allowClear
        virtual={false}
        value={value}
        onSearch={setSearchText}
        onChange={(nextValue) => {
          onChange?.(nextValue);
          onSelectCustomer?.(customers.find((item) => item.id === nextValue));
        }}
        style={{ width: "100%" }}
        optionFilterProp="label"
        placeholder="Chọn khách hàng"
        notFoundContent={searchText ? "Không thấy khách phù hợp" : "Gõ tên hoặc SĐT để tìm khách"}
        options={visibleCustomers.map((item) => ({ value: item.id, label: `${item.name}${item.phone ? ` - ${item.phone}` : ""}${item.customerType === "intermediary" ? " - Trung gian" : ""}` }))}
      />
      {customer?.note ? <Typography.Text type="secondary">{customer.note}</Typography.Text> : null}
    </div>
  );
}
