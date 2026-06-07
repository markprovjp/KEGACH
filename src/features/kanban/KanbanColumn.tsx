"use client";

import { useDroppable } from "@dnd-kit/core";
import { Typography } from "antd";
import { KanbanOrderCard } from "./KanbanOrderCard";
import type { KanbanColumnDefinition, KanbanOrder } from "./kanban-types";

export function KanbanColumn({ column, orders, totalCount, onEdit, onDelete, onPrintCod, compact }: { column: KanbanColumnDefinition; orders: KanbanOrder[]; totalCount: number; onEdit: (order: KanbanOrder) => void; onDelete: (order: KanbanOrder) => void; onPrintCod?: (order: KanbanOrder) => void; compact?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });
  const hiddenCount = Math.max(0, totalCount - orders.length);

  return (
    <section ref={setNodeRef} className="kanban-column" style={{ outline: isOver ? "2px solid #1677ff" : undefined }}>
      <div className="card-line kanban-column-title">
        <Typography.Text strong>{column.title}</Typography.Text>
        <Typography.Text type="secondary">{totalCount}</Typography.Text>
      </div>
      {orders.map((order) => (
        <KanbanOrderCard key={order.id} order={order} onEdit={onEdit} onDelete={onDelete} onPrintCod={onPrintCod} compact={compact} />
      ))}
      {hiddenCount > 0 ? <div className="kanban-column-more">Còn {hiddenCount} đơn, tăng mức hiển thị để xem thêm</div> : null}
    </section>
  );
}
