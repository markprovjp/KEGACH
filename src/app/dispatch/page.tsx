import { Card } from "antd";
import { DispatchBoard } from "@/features/shipments/DispatchBoard";

export default function DispatchPage() {
  return (
    <main>
      <h1 className="page-title">Điều xe</h1>
      <p className="page-subtitle">Quản lý danh bạ nhà xe, tuyến chạy, số điện thoại, giờ chạy và các đơn đang cần gửi.</p>
      <Card>
        <DispatchBoard />
      </Card>
    </main>
  );
}
