"use client";

import { Select } from "antd";
import type { CatalogProduct } from "@/features/catalog/catalog-types";
import { buildProductSearchText, buildVariantLabel } from "@/features/catalog/product-search-helpers";
import { compactAlias } from "@/lib/normalize";

export function ProductSearch({ products = [], value, onChange }: { products?: CatalogProduct[]; value?: string; onChange?: (value: string) => void }) {
  return (
    <Select
      showSearch
      value={value}
      onChange={onChange}
      filterOption={(input, option) => compactAlias(String(option?.searchText ?? "")).includes(compactAlias(input))}
      placeholder="Chọn sản phẩm"
      options={products.map((product) => ({
        value: product.id,
        label: `${product.name} - ${product.defaultPrice.toLocaleString("vi-VN")}đ/${product.unit}${buildVariantLabel(product) ? ` - mã ${buildVariantLabel(product)}` : ""}`,
        searchText: buildProductSearchText(product)
      }))}
    />
  );
}
