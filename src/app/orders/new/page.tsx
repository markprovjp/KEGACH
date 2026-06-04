import { Card } from "antd";
import { OrderEntryForm } from "@/features/orders/components/OrderEntryForm";

export default function NewOrderPage() {
  return (
    <main>
      <h1 className="page-title">Tạo đơn vận hành</h1>
      <p className="page-subtitle">Nhập mã hóa đơn Kiot, khách, hàng, COD và lịch gửi. Ảnh/PDF hóa đơn chỉ là chứng từ trong chi tiết đơn.</p>
      <Card>
        <OrderEntryForm />
      </Card>
    </main>
  );
}
