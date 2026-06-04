"use client";

import { Select } from "antd";
import { sampleProducts } from "@/lib/sample-data";

export function ProductSearch({ value, onChange }: { value?: string; onChange?: (value: string) => void }) {
  return (
    <Select
      showSearch
      value={value}
      onChange={onChange}
      optionFilterProp="label"
      placeholder="Chọn sản phẩm"
      options={sampleProducts.map((product) => ({
        value: product.id,
        label: `${product.name} - ${product.defaultPrice.toLocaleString("vi-VN")}đ/${product.unit}`
      }))}
    />
  );
}
