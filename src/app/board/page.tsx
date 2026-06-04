import { KanbanBoard } from "@/features/kanban/KanbanBoard";

export default function BoardPage() {
  return (
    <main>
      <h1 className="page-title">Kanban dieu phoi</h1>
      <p className="page-subtitle">Card la du lieu co cau truc: hoa don, khach, hang, COD, tinh, ngay gui, tai xe va canh bao.</p>
      <KanbanBoard />
    </main>
  );
}
