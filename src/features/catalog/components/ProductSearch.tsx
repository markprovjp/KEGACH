"use client";

import { Select } from "antd";
import type { CatalogProduct } from "@/features/catalog/catalog-types";

export function ProductSearch({ products = [], value, onChange }: { products?: CatalogProduct[]; value?: string; onChange?: (value: string) => void }) {
  return (
    <Select
      showSearch
      value={value}
      onChange={onChange}
      optionFilterProp="label"
      placeholder="Chọn sản phẩm"
      options={products.map((product) => ({
        value: product.id,
        label: `${product.name} - ${product.defaultPrice.toLocaleString("vi-VN")}đ/${product.unit}`
      }))}
    />
  );
}
