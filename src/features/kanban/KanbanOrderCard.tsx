"use client";

import { DeleteOutlined, EditOutlined, PhoneOutlined, WarningOutlined } from "@ant-design/icons";
import { useDraggable } from "@dnd-kit/core";
import { Badge, Button, Card, Popconfirm, Space, Tag, Typography } from "antd";
import { orderStatusLabels } from "@/features/orders/order-status";
import type { KanbanOrder } from "./kanban-types";

export function KanbanOrderCard({ order, onEdit, onDelete }: { order: KanbanOrder; onEdit: (order: KanbanOrder) => void; onDelete: (order: KanbanOrder) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: order.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1 } : undefined;

  return (
    <Card ref={setNodeRef} className="kanban-card" size="small" style={style} {...listeners} {...attributes}>
      <div className="card-line">
        <Typography.Text strong>{order.kiotInvoiceCode}</Typography.Text>
        <Badge color={order.codAmount > 0 ? "green" : "blue"} text={order.codAmount > 0 ? "COD" : "Công nợ"} />
      </div>
      <Typography.Text>{order.customer}</Typography.Text>
      <div className="muted"><PhoneOutlined /> {order.phone}</div>
      <div>{order.productSummary}</div>
      <div className="card-line">
        <span>{order.province}</span>
        <b>{order.total.toLocaleString("vi-VN")}đ</b>
      </div>
      <div className="card-line muted">
        <span>{order.sendDate}</span>
        <span>{order.driver ?? "Chưa gán xe"}</span>
      </div>
      {order.warnings.map((warning) => (
        <Tag key={warning} color="gold" icon={<WarningOutlined />} style={{ marginTop: 6 }}>
          {warning}
        </Tag>
      ))}
      <div className="card-line" style={{ marginTop: 6 }}>
        <Tag color="blue">{orderStatusLabels[order.status]}</Tag>
        <Space onPointerDown={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(order)}>Sửa</Button>
          <Popconfirm title="Xóa đơn này?" okText="Xóa" cancelText="Đóng" onConfirm={() => onDelete(order)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      </div>
    </Card>
  );
}
