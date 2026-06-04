"use client";

import { PhoneOutlined, WarningOutlined } from "@ant-design/icons";
import { useDraggable } from "@dnd-kit/core";
import { Badge, Card, Tag, Typography } from "antd";
import type { KanbanOrder } from "./kanban-types";

export function KanbanOrderCard({ order }: { order: KanbanOrder }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: order.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1 } : undefined;

  return (
    <Card ref={setNodeRef} className="kanban-card" size="small" style={style} {...listeners} {...attributes}>
      <div className="card-line">
        <Typography.Text strong>{order.kiotInvoiceCode}</Typography.Text>
        <Badge color={order.codAmount > 0 ? "green" : "blue"} text={order.codAmount > 0 ? "COD" : "Cong no"} />
      </div>
      <Typography.Text>{order.customer}</Typography.Text>
      <div className="muted"><PhoneOutlined /> {order.phone}</div>
      <div>{order.productSummary}</div>
      <div className="card-line">
        <span>{order.province}</span>
        <b>{order.total.toLocaleString("vi-VN")}d</b>
      </div>
      <div className="card-line muted">
        <span>{order.sendDate}</span>
        <span>{order.driver ?? "Chua gan xe"}</span>
      </div>
      {order.warnings.map((warning) => (
        <Tag key={warning} color="gold" icon={<WarningOutlined />} style={{ marginTop: 6 }}>
          {warning}
        </Tag>
      ))}
    </Card>
  );
}
