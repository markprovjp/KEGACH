"use client";

import { Select } from "antd";
import type { CatalogProduct } from "@/features/catalog/catalog-types";
import { buildProductSearchText } from "@/features/catalog/product-search-helpers";
import { compactAlias } from "@/lib/normalize";

export function ProductSearch({ products = [], value, onChange }: { products?: CatalogProduct[]; value?: string; onChange?: (value: string) => void }) {
  return (
    <Select
      className="product-search-select"
      showSearch
      value={value}
      onChange={onChange}
      filterOption={(input, option) => compactAlias(String(option?.searchText ?? "")).includes(compactAlias(input))}
      placeholder="Chọn sản phẩm"
      popupMatchSelectWidth={520}
      optionLabelProp="displayLabel"
      options={products.map((product) => ({
        value: product.id,
        displayLabel: product.name,
        label: (
          <div className="product-search-option">
            <b>{product.name}</b>
            <span>{product.defaultPrice.toLocaleString("vi-VN")}đ/{product.unit}{product.packageRule ? ` - ${product.packageRule}` : ""}</span>
          </div>
        ),
        searchText: buildProductSearchText(product)
      }))}
    />
  );
}
