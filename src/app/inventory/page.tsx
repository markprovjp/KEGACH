"use client";

import { Card, Tabs } from "antd";
import { ProductManagement } from "@/features/catalog/components/ProductManagement";
import { InventoryTable } from "@/features/inventory/components/InventoryTable";

export default function InventoryPage() {
  return (
    <main>
      <h1 className="page-title">Tồn khả dụng</h1>
      <p className="page-subtitle">Khả dụng = tồn - đã giữ. Màn này chỉnh được tồn kho và quản lý được sản phẩm.</p>
      <Card>
        <Tabs
          items={[
            { key: "stock", label: "Tồn kho", children: <InventoryTable /> },
            { key: "products", label: "Sản phẩm", children: <ProductManagement /> }
          ]}
        />
      </Card>
    </main>
  );
}
