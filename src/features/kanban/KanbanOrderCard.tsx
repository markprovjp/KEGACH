"use client";

import { DeleteOutlined, EditOutlined, PhoneOutlined, PrinterOutlined, WarningOutlined } from "@ant-design/icons";
import { useDraggable } from "@dnd-kit/core";
import { Button, Card, Popconfirm, Space, Tag, Typography } from "antd";
import { orderStatusLabels } from "@/features/orders/order-status";
import { formatMoney } from "@/lib/number-format";
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
  const isCod = isCodOrder(order);
  const style = isDragging ? { opacity: 0.25 } : transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <Card ref={setNodeRef} className={`kanban-card ${isCod ? "kanban-card-cod" : "kanban-card-regular"}${compact ? " compact-card" : ""}`} size="small" style={style} {...listeners} {...attributes}>
      <KanbanOrderCardContent order={order} />
      <div className="card-line kanban-card-actions">
        <Tag color="blue">{orderStatusLabels[order.status]}</Tag>
        <Space onPointerDown={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
          {isCod ? <Button size="small" type="primary" ghost icon={<PrinterOutlined />} onClick={() => onPrintCod?.(order)}>In gửi COD</Button> : null}
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
    <Card className={`kanban-card ${isCodOrder(order) ? "kanban-card-cod" : "kanban-card-regular"} kanban-card-overlay${compact ? " compact-card" : ""}`} size="small">
      <KanbanOrderCardContent order={order} />
      <Tag color="blue" style={{ marginTop: 6 }}>{orderStatusLabels[order.status]}</Tag>
    </Card>
  );
}

function KanbanOrderCardContent({ order }: { order: KanbanOrder }) {
  const isCod = isCodOrder(order);
  const isDraft = order.status === "draft" || order.isOfficial === false;
  const codSent = order.workflowChecks?.includes("cod_info_sent_to_post");
  const waitingLines = order.fulfillment?.filter((line) => line.waiting > 0) ?? [];
  const readyCount = order.fulfillment?.filter((line) => line.fulfillable > 0).length ?? 0;
  return (
    <>
      <div className="card-line kanban-card-head">
        <Typography.Text strong>{order.kiotInvoiceCode}</Typography.Text>
        <Space size={4} wrap>
          {isDraft ? <Tag color="default">Nháp</Tag> : null}
          {isCod ? <Tag color="volcano">COD</Tag> : null}
        </Space>
      </div>
      <Typography.Text>{order.customer}</Typography.Text>
      <div className="muted"><PhoneOutlined /> {order.phone}</div>
      <div className="kanban-product-summary">{order.productSummary}</div>
      {waitingLines.length ? (
        <div className="kanban-stock-split">
          <Tag color="green">Gửi trước {readyCount} dòng</Tag>
          <Tag color="red">Chờ nhập {waitingLines.length} dòng</Tag>
          {waitingLines.slice(0, 2).map((line) => (
            <Typography.Text key={`${line.productId}-${line.waiting}`} type="secondary">
              {line.productName}: chờ {line.waiting.toLocaleString("vi-VN")} {line.unit}
            </Typography.Text>
          ))}
        </div>
      ) : null}
      {isCod ? (
        <div className="kanban-cod-panel">
          <div><span>Thu COD</span><b>{formatMoney(order.codAmount)}</b></div>
          <div><span>SL/KL</span><b>{order.packageCount ?? 0} kiện - {formatNumber(order.estimatedWeightKg ?? 0)} kg</b></div>
          <div><span>Cước</span><b>{order.freightPayer === "company" ? "Cơ sở trả" : "Khách trả"}</b></div>
          <Tag color={codSent ? "green" : "red"}>{codSent ? "Đã in/gửi COD" : "Chưa in/gửi COD"}</Tag>
        </div>
      ) : null}
      <div className="card-line">
        <span>{order.province}</span>
        <b>{order.total.toLocaleString("vi-VN")}đ</b>
      </div>
      <div className="card-line muted">
        <span>{order.sendDate}</span>
        <span>{order.driver ?? "Chưa gán xe"}</span>
      </div>
      {!isCod ? <Tag color={order.paymentStatus === "paid" ? "green" : "gold"}>{order.paymentStatus === "paid" ? "Đã thanh toán" : "Công nợ"}</Tag> : null}
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

function isCodOrder(order: KanbanOrder): boolean {
  return order.orderType === "cod" || order.paymentKind === "cod" || order.codAmount > 0;
}

function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 3 });
}
