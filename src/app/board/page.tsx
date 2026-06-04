import { KanbanBoard } from "@/features/kanban/KanbanBoard";

export default function BoardPage() {
  return (
    <main>
      <h1 className="page-title">Kanban điều phối</h1>
      <p className="page-subtitle">Card là dữ liệu có cấu trúc: hóa đơn, khách, hàng, COD, tỉnh, ngày gửi, tài xế và cảnh báo.</p>
      <KanbanBoard />
    </main>
  );
}
