"use client";

import { Select, Typography } from "antd";
import { useEffect, useState } from "react";

type CustomerOption = {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  province?: string | null;
  note?: string | null;
};

export function CustomerSearch({ value, onChange, onSelectCustomer }: { value?: string; onChange?: (value?: string) => void; onSelectCustomer?: (customer?: CustomerOption) => void }) {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  useEffect(() => {
    fetch("/api/customers").then((response) => response.json()).then(setCustomers).catch(() => setCustomers([]));
  }, []);

  const customer = customers.find((item) => item.id === value);

  return (
    <div>
      <Select
        showSearch
        allowClear
        value={value}
        onChange={(nextValue) => {
          onChange?.(nextValue);
          onSelectCustomer?.(customers.find((item) => item.id === nextValue));
        }}
        style={{ width: "100%" }}
        optionFilterProp="label"
        placeholder="Chọn khách hàng"
        options={customers.map((item) => ({ value: item.id, label: `${item.name}${item.phone ? ` - ${item.phone}` : ""}` }))}
      />
      {customer?.note ? <Typography.Text type="secondary">{customer.note}</Typography.Text> : null}
    </div>
  );
}
