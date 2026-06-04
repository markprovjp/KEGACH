"use client";

import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { Alert, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { canTransitionOrder } from "@/features/orders/order-status";
import { sampleOrders } from "@/lib/sample-data";
import { KanbanColumn } from "./KanbanColumn";
import type { KanbanColumnDefinition, KanbanOrder } from "./kanban-types";

const columns: KanbanColumnDefinition[] = [
  { status: "awaiting_kiot", title: "Cho HD Kiot" },
  { status: "kiot_linked", title: "Da gan Kiot" },
  { status: "reserved", title: "Da giu hang" },
  { status: "packing", title: "Dang dong" },
  { status: "packed", title: "Dong xong" },
  { status: "waiting_vehicle", title: "Cho xe" },
  { status: "scheduled", title: "Da xep lich" },
  { status: "shipped", title: "Da gui" },
  { status: "problem", title: "Co van de" }
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
      message.warning(`Khong the chuyen ${order.kiotInvoiceCode} tu ${order.status} sang ${nextStatus}`);
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
                <div className="card-line"><b>{order.kiotInvoiceCode}</b><span>{order.codAmount > 0 ? "COD" : "Cong no"}</span></div>
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
        title="Kanban chi doi trang thai van hanh. Hoa don, doanh thu, khach va cong no van doi soat tren Kiot."
        style={{ marginBottom: 12 }}
      />
      {board}
    </div>
  );
}
