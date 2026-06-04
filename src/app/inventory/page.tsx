import { Card } from "antd";
import { InventoryTable } from "@/features/inventory/components/InventoryTable";

export default function InventoryPage() {
  return (
    <main>
      <h1 className="page-title">Ton kha dung</h1>
      <p className="page-subtitle">available = onHand - reserved. Huy truoc shipment se release reservation; ship se tru ca ton va giu.</p>
      <Card>
        <InventoryTable />
      </Card>
    </main>
  );
}
