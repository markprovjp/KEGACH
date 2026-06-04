"use client";

import { Select, Typography } from "antd";
import { sampleCustomers } from "@/lib/sample-data";

export function CustomerSearch({ value, onChange }: { value?: string; onChange?: (value: string) => void }) {
  const customer = sampleCustomers.find((item) => item.id === value);

  return (
    <div>
      <Select
        showSearch
        value={value}
        onChange={onChange}
        optionFilterProp="label"
        placeholder="Chọn khách hàng"
        options={sampleCustomers.map((item) => ({ value: item.id, label: `${item.name} - ${item.phone}` }))}
      />
      {customer ? <Typography.Text type="secondary">{customer.recentPriceNote}</Typography.Text> : null}
    </div>
  );
}
