"use client";

import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { Alert, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { canTransitionOrder } from "@/features/orders/order-status";
import { sampleOrders } from "@/lib/sample-data";
import { KanbanColumn } from "./KanbanColumn";
import type { KanbanColumnDefinition, KanbanOrder } from "./kanban-types";

const columns: KanbanColumnDefinition[] = [
  { status: "awaiting_kiot", title: "Chờ HĐ Kiot" },
  { status: "kiot_linked", title: "Đã gắn Kiot" },
  { status: "reserved", title: "Đã giữ hàng" },
  { status: "packing", title: "Đang đóng" },
  { status: "packed", title: "Đóng xong" },
  { status: "waiting_vehicle", title: "Chờ xe" },
  { status: "scheduled", title: "Đã xếp lịch" },
  { status: "shipped", title: "Đã gửi" },
  { status: "problem", title: "Có vấn đề" }
];

export function KanbanBoard() {
  const [orders, setOrders] = useState<KanbanOrder[]>(sampleOrders);
  const [mounted, setMounted] = useState(false);
  const grouped = useMemo(() => new Map(columns.map((column) => [column.status, orders.filter((order) => order.status === column.status)])), [orders]);

  useEffect(() => {
    setMounted(true);
  }, []);

  function onDragEnd(event: DragEndEvent) {
    const orderId = String(event.active.id);
    const nextStatus = event.over?.id;
    if (!nextStatus) return;

    const order = orders.find((item) => item.id === orderId);
    if (!order) return;

    if (!canTransitionOrder(order.status, nextStatus as KanbanOrder["status"])) {
      message.warning(`Không thể chuyển ${order.kiotInvoiceCode} từ ${order.status} sang ${nextStatus}`);
      return;
    }

    setOrders((current) => current.map((item) => (item.id === orderId ? { ...item, status: nextStatus as KanbanOrder["status"] } : item)));
  }

  if (!mounted) {
    return (
      <div className="kanban-scroll">
        {columns.map((column) => (
          <section key={column.status} className="kanban-column">
            <div className="card-line kanban-column-title">
              <b>{column.title}</b>
              <span>{grouped.get(column.status)?.length ?? 0}</span>
            </div>
            {(grouped.get(column.status) ?? []).map((order) => (
              <div key={order.id} className="kanban-card static-card">
                <div className="card-line"><b>{order.kiotInvoiceCode}</b><span>{order.codAmount > 0 ? "COD" : "Công nợ"}</span></div>
                <div>{order.customer}</div>
                <div className="muted">{order.productSummary}</div>
              </div>
            ))}
          </section>
        ))}
      </div>
    );
  }

  const board = (
    <DndContext onDragEnd={onDragEnd}>
      <div className="kanban-scroll">
        {columns.map((column) => (
          <KanbanColumn key={column.status} column={column} orders={grouped.get(column.status) ?? []} />
        ))}
      </div>
    </DndContext>
  );

  return (
    <div>
      <Alert
        type="info"
        showIcon
        title="Kanban chỉ đổi trạng thái vận hành. Hóa đơn, doanh thu, khách và công nợ vẫn đối soát trên Kiot."
        style={{ marginBottom: 12 }}
      />
      {board}
    </div>
  );
}
