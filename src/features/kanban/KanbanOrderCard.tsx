"use client";

import { DeleteOutlined, EditOutlined, PhoneOutlined, PrinterOutlined, WarningOutlined } from "@ant-design/icons";
import { useDraggable } from "@dnd-kit/core";
import { Badge, Button, Card, Popconfirm, Space, Tag, Typography } from "antd";
import { orderStatusLabels } from "@/features/orders/order-status";
import type { KanbanOrder } from "./kanban-types";

type KanbanOrderCardProps = {
  order: KanbanOrder;
  onEdit: (order: KanbanOrder) => void;
  onDelete: (order: KanbanOrder) => void;
  onPrintCod?: (order: KanbanOrder) => void;
  compact?: boolean;
};

export function KanbanOrderCard({ order, onEdit, onDelete, onPrintCod, compact }: KanbanOrderCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: order.id });
  const style = isDragging ? { opacity: 0.25 } : transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <Card ref={setNodeRef} className={`kanban-card${compact ? " compact-card" : ""}`} size="small" style={style} {...listeners} {...attributes}>
      <KanbanOrderCardContent order={order} />
      <div className="card-line" style={{ marginTop: 6 }}>
        <Tag color="blue">{orderStatusLabels[order.status]}</Tag>
        <Space onPointerDown={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
          {order.codAmount > 0 ? <Button size="small" icon={<PrinterOutlined />} onClick={() => onPrintCod?.(order)}>COD</Button> : null}
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(order)}>Sửa</Button>
          <Popconfirm title="Xóa đơn này?" okText="Xóa" cancelText="Đóng" onConfirm={() => onDelete(order)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      </div>
    </Card>
  );
}

export function KanbanOrderCardPreview({ order, compact }: { order: KanbanOrder; compact?: boolean }) {
  return (
    <Card className={`kanban-card kanban-card-overlay${compact ? " compact-card" : ""}`} size="small">
      <KanbanOrderCardContent order={order} />
      <Tag color="blue" style={{ marginTop: 6 }}>{orderStatusLabels[order.status]}</Tag>
    </Card>
  );
}

function KanbanOrderCardContent({ order }: { order: KanbanOrder }) {
  return (
    <>
      <div className="card-line">
        <Typography.Text strong>{order.kiotInvoiceCode}</Typography.Text>
        <Badge color={order.codAmount > 0 ? "green" : "blue"} text={order.codAmount > 0 ? "COD" : "Công nợ"} />
      </div>
      <Typography.Text>{order.customer}</Typography.Text>
      <div className="muted"><PhoneOutlined /> {order.phone}</div>
      <div className="kanban-product-summary">{order.productSummary}</div>
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
      {order.nextAction && order.nextAction.severity !== "done" ? (
        <div className={`kanban-next-action ${order.nextAction.severity}`}>
          <span>{order.nextAction.severity === "blocked" ? "Bắt buộc" : order.nextAction.phase}</span>
          <b>{order.nextAction.title}</b>
        </div>
      ) : order.workflowMissing?.length ? (
        <Tag color="red" icon={<WarningOutlined />} style={{ marginTop: 6 }}>Thiếu {order.workflowMissing.length} bước quy trình</Tag>
      ) : (
        <Tag color="green" style={{ marginTop: 6 }}>Đủ checklist</Tag>
      )}
    </>
  );
}
