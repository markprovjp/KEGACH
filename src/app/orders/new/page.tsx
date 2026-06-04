import { Card } from "antd";
import { OrderEntryForm } from "@/features/orders/components/OrderEntryForm";

export default function NewOrderPage() {
  return (
    <main>
      <h1 className="page-title">Tao don van hanh</h1>
      <p className="page-subtitle">Nhap ma hoa don Kiot, khach, hang, COD va lich gui. Anh/PDF hoa don chi la chung tu trong chi tiet don.</p>
      <Card>
        <OrderEntryForm />
      </Card>
    </main>
  );
}
