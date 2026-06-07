"use client";

import { Button, Divider, Select } from "antd";
import { useState } from "react";
import type { CatalogProduct } from "@/features/catalog/catalog-types";
import { buildProductSearchText } from "@/features/catalog/product-search-helpers";
import { compactAlias } from "@/lib/normalize";

export function ProductSearch({ products = [], value, onChange, onCreateRequest }: { products?: CatalogProduct[]; value?: string; onChange?: (value: string) => void; onCreateRequest?: (name: string) => void }) {
  const [searchText, setSearchText] = useState("");
  const canCreate = Boolean(onCreateRequest && searchText.trim());

  return (
    <Select
      className="product-search-select"
      showSearch
      value={value}
      onChange={onChange}
      onSearch={setSearchText}
      filterOption={(input, option) => compactAlias(String(option?.searchText ?? "")).includes(compactAlias(input))}
      placeholder="Chọn sản phẩm"
      popupMatchSelectWidth={520}
      optionLabelProp="displayLabel"
      popupRender={(originNode) => (
        <>
          {originNode}
          {canCreate ? (
            <>
              <Divider style={{ margin: "6px 0" }} />
              <Button
                type="text"
                block
                className="product-create-button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onCreateRequest?.(searchText.trim())}
              >
                Thêm sản phẩm mới: {searchText.trim()}
              </Button>
            </>
          ) : null}
        </>
      )}
      options={products.filter((product) => product.isActive !== false || product.id === value).map((product) => ({
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
