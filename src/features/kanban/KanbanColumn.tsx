"use client";

import { useDroppable } from "@dnd-kit/core";
import { Typography } from "antd";
import { KanbanOrderCard } from "./KanbanOrderCard";
import type { KanbanColumnDefinition, KanbanOrder } from "./kanban-types";

export function KanbanColumn({ column, orders }: { column: KanbanColumnDefinition; orders: KanbanOrder[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  return (
    <section ref={setNodeRef} className="kanban-column" style={{ outline: isOver ? "2px solid #1677ff" : undefined }}>
      <div className="card-line kanban-column-title">
        <Typography.Text strong>{column.title}</Typography.Text>
        <Typography.Text type="secondary">{orders.length}</Typography.Text>
      </div>
      {orders.map((order) => (
        <KanbanOrderCard key={order.id} order={order} />
      ))}
    </section>
  );
}
