# Kiot Operations Companion Design

Date: 2026-06-04
Workspace: `D:\CODE\KEGACH`

## 1. Goal

Build a web app that works beside Kiot Viet.

Kiot remains the system that the boss trusts for invoices, revenue, customers, and debt. This app handles the daily operating work that Kiot does not cover well: receiving orders from chat, packing, queueing, assigning drivers, COD tracking, delivery scheduling, available-stock planning, and reconciliation.

The app must not depend on Kiot API or webhooks because the current Kiot package does not include them.

## 2. Core Positioning

Kiot is the business ledger.


This app is the operations board.

Every operational order must be linked to a Kiot invoice code such as `HD004066` when that code exists.

The app does not try to silently change Kiot. It records what staff need to do, warns about mismatches, and gives a daily reconciliation lane.

## 3. Users

### Boss

Needs to keep seeing Kiot as the trusted place for invoices, revenue, customer records, and receivables.

### Order Staff

Receives messages from Zalo, Facebook, phone, and other channels. Needs fast product search, customer search, recent sale price lookup, and a clear way to create an operations order after the Kiot invoice is created.

### Warehouse Staff

Needs a queue of orders to pack, product quantities to prepare, shortage warnings, and simple status changes.

### Dispatch Staff

Needs to assign orders to drivers or bus/coach routes, track COD, mark waiting-for-car, scheduled-date, shipped, delivered, delayed, and problem orders.

## 4. MVP Scope

### In Scope

- Product catalog with aliases, prices, units, and package rules.
- Customer records with phone, address, province, notes, and recent sale price history.
- Kiot-linked operations orders.
- Manual product search and add-to-order flow similar to Kiot.
- Paste-message assistant that suggests product lines from chat text.
- Kanban operations board.
- Shipment/COD management.
- Available stock tracking with reservations.
- Daily reconciliation screen between Kiot invoices and app operations orders.
- Full audit log for order changes, stock movements, cancellation, and rollback.

### Out of Scope for MVP

- Direct Kiot API sync.
- Kiot webhook listener.
- Automatic browser bot that controls Kiot.
- Accounting replacement for Kiot.
- Payment gateway integration.
- Multi-branch inventory unless manually configured later.

## 5. Recommended Workflow

### Normal Order Flow

1. Customer sends order via Zalo, Facebook, phone, or another channel.
2. Staff creates invoice in Kiot as usual.
3. Staff copies the Kiot invoice code into this app.
4. Staff creates or confirms the operations order in this app.
5. App reserves stock internally.
6. Warehouse packs the order.
7. Dispatch assigns driver/vehicle/COD/scheduled date.
8. Order moves through Kanban statuses until delivered.
9. End of day, staff reconciles Kiot invoices against app operations orders.

### Chat-to-Order Assisted Flow

1. Staff pastes raw chat text.
2. App detects likely products and quantities using product aliases.
3. Staff confirms each suggested product line.
4. Staff still creates the real Kiot invoice manually.
5. Staff links the Kiot invoice code to the app order.

This reduces repeated typing but keeps Kiot as the official invoice source.

## 6. Order Status Model

Statuses are designed for operations, not accounting.

- `draft`: created in app but not confirmed.
- `awaiting_kiot`: app order exists, Kiot invoice code missing.
- `kiot_linked`: Kiot invoice code attached.
- `reserved`: stock reserved internally.
- `packing`: warehouse is preparing goods.
- `packed`: goods are ready.
- `waiting_vehicle`: waiting for driver, bus, coach, or pickup.
- `scheduled`: delivery/send date is planned in the future.
- `shipped`: goods left warehouse.
- `delivered`: confirmed delivered.
- `problem`: blocked, missing goods, wrong goods, unreachable customer, driver issue, or other exception.
- `cancelled`: order cancelled before shipment.
- `returned`: goods returned after shipment.

Allowed moves should be strict enough to prevent accidental damage, but flexible enough for real work. Every backward move requires a reason.

## 7. Rollback Rules

The app must never hide mistakes by deleting history.

### Cancel Before Shipment

- Mark order `cancelled`.
- Release reserved stock.
- Require cancellation reason.
- Show warning: staff must cancel or adjust the Kiot invoice separately.

### Customer Changes Quantity Before Shipment

- Create an order revision.
- Recalculate reservation delta.
- Add or release stock based on the delta.
- Require note if Kiot invoice already exists.

### Wrong Product Before Shipment

- Replace order item through a revision.
- Release old product reservation.
- Reserve new product quantity.
- Require reason.

### Already Shipped, Then Customer Returns

- Do not cancel the original shipment.
- Create return event.
- Add returned quantity back to stock after warehouse confirms physical return.
- Keep COD/debt status visible.

### Kiot Invoice Deleted or Edited Outside App

- Mark reconciliation mismatch.
- Require staff to resolve by linking new Kiot invoice code, adjusting app order, or cancelling app order.

## 8. Stock Logic

The app tracks operational stock, not necessarily Kiot's official stock.

### Stock Numbers

- `on_hand`: physical stock known to the app.
- `reserved`: quantity held for confirmed orders that have not shipped.
- `available`: `on_hand - reserved`.
- `shipped_not_reconciled`: quantity shipped in app but not checked against Kiot/report.

### Stock Movement Types

- `purchase_in`: new goods entered warehouse.
- `manual_adjustment`: correction after stock count.
- `reserve`: stock held for an order.
- `release_reservation`: reservation removed because of cancel or edit.
- `ship`: physical stock leaves warehouse.
- `return_in`: returned goods entered warehouse.
- `damage_out`: damaged/lost goods removed from stock.

Every movement must include product, quantity, actor, timestamp, reason, and optional related order.

## 9. Reconciliation Logic

Because there is no Kiot API, reconciliation is a product feature, not an afterthought.

### Daily Reconciliation Inputs

MVP supports manual inputs:

- Staff manually enters Kiot invoice code.
- Staff uploads or pastes a Kiot invoice screenshot/PDF later if OCR is added.
- Staff imports a Kiot exported report if the current package allows export.

### Reconciliation Cases

- Kiot invoice exists and app order exists: normal.
- Kiot invoice exists but app order missing: create operations order or mark ignored with reason.
- App order exists but Kiot code missing: link invoice or mark awaiting Kiot.
- Product/quantity mismatch: show mismatch and require resolution.
- Cancelled in app but not cancelled in Kiot: warn.
- Cancelled in Kiot but active in app: warn.

### Reconciliation Screen

The screen should show:

- Date range.
- Kiot invoice code.
- Customer.
- Total value.
- App order status.
- Mismatch type.
- Required action.

## 10. Product Catalog

Initial product list:

| Product | Price | Package rule |
| --- | ---: | --- |
| Ke can bang 1MM | 47K | 30 kg / bao |
| Ke can bang 1.5MM | 47K | 30 kg / bao |
| Ke can bang 2MM | 47K | 30 kg / bao |
| Ke can bang 3MM | 47K | 30 kg / bao |
| Nem | 35K | 30 kg / bao |
| Kim siet ke | 25K | 50 cai / thung |
| Ke chu thap 1MM | 85K | 30 kg / bao |
| Ke chu thap 1.5MM | 85K | 30 kg / bao |
| Ke chu thap 2MM | 85K | 30 kg / bao |
| Ke chu thap 3MM | 85K | 30 kg / bao |
| Ke chu thap 5MM | 85K | 30 kg / bao |
| Ke vit xoay 1MM | 35K | 60 tui / thung, 1 tui 50 cai |
| Ke vit xoay 1.5MM | 35K | 60 tui / thung, 1 tui 50 cai |
| Nuoc tay xi mang | 40K | 12 can / thung, 1.7 lit |
| Keo 2 thanh phan BONBOND | 60K | 30 cai / thung |
| Keo 2 thanh phan EPOXY CAT | 70K | 30 cai / thung |
| Sung ban keo EPOXY | 70K | 30 cai / thung |
| Bo biron re | 20K | |
| Bo biron dat | 35K | |
| Rach mach | 10K | |
| Sui | 20K | |
| Kich gach | 30K | 40 cai / thung |
| Ban keo rang cua | 90K | |
| Bay rang cua | 45K | |
| Mu chiet mach | 12K | |

The app should support aliases such as `B03`, `b03`, `3ly`, `ke 3 ly`, `1ly`, `kcb`, `nem`, `nem 1 bao`, and staff-defined aliases.

## 11. Data Model

### Product

- id
- sku
- name
- normalized_name
- aliases
- default_price
- unit
- package_rule
- active

### Customer

- id
- name
- phone
- address
- province
- customer_type
- notes
- kiot_customer_code
- created_at
- updated_at

### Order

- id
- order_code
- kiot_invoice_code
- source_channel
- customer_id
- customer_snapshot
- status
- priority
- promised_send_date
- total_amount
- discount_amount
- cod_amount
- payment_note
- internal_note
- created_by
- created_at
- updated_at

### OrderItem

- id
- order_id
- product_id
- product_snapshot
- quantity
- unit_price
- last_price_reference
- line_total
- note

### Shipment

- id
- order_id
- carrier_type
- driver_name
- driver_phone
- vehicle_info
- province
- send_date
- pickup_location
- cod_required
- cod_amount
- cod_collected_status
- shipment_status
- note

### InventoryMovement

- id
- product_id
- movement_type
- quantity
- order_id
- reason
- actor_id
- created_at

### AuditLog

- id
- entity_type
- entity_id
- action
- before_json
- after_json
- reason
- actor_id
- created_at

## 12. Web App Screens

### Dashboard

Shows today summary: new orders, packing, waiting vehicle, scheduled sends, shipped, problem orders, COD pending, low stock alerts, reconciliation mismatches.

### Create Operations Order

Kiot-like order entry:

- Product search.
- Customer search.
- Recent customer sale prices for selected product.
- Quantity and price editing.
- Kiot invoice code field.
- Raw chat paste assistant.
- Save draft and confirm.

### Kanban Board

Columns based on operational statuses. Cards show customer, Kiot invoice code, products summary, province, send date, COD, carrier/driver, and warning badges.

### Order Detail Drawer

Shows order lines, customer, shipment, timeline, audit log, rollback actions, and Kiot linkage.

### Warehouse Queue

Table/list optimized for packing: product aggregation, order queue, shortage warnings, packed confirmation.

### Dispatch Board

Orders grouped by province, driver, send date, and COD status.

### Inventory

Product stock table with on-hand, reserved, available, low-stock threshold, movement history, stock adjustment form.

### Reconciliation

Daily mismatch screen between Kiot invoice list and app operations orders.

### Settings

Products, aliases, users, roles, drivers/carriers, provinces, low-stock thresholds, status rules.

## 13. UI Design Direction

Use Ant Design for the internal tool surface.

The interface should be dense, practical, and scan-friendly. Avoid landing-page style. This is a daily operations system.

Recommended libraries:

- React with TypeScript.
- Ant Design for forms, tables, drawers, tags, modals, date pickers, and notifications.
- Ant Design ProComponents for data-heavy CRUD tables where useful.
- dnd-kit for Kanban drag-and-drop.
- Zustand or TanStack Query for client state/data fetching depending on backend choice.

## 14. Architecture Recommendation

### MVP Architecture

- Frontend: React + TypeScript + Ant Design.
- Backend: Node.js API or Next.js app routes.
- Database: PostgreSQL for production readiness, SQLite acceptable only for a local prototype.
- Auth: simple role-based login for owner/admin/staff/warehouse/dispatch.
- Audit: append-only audit logs.

### Module Boundaries

- `catalog`: products, aliases, pricing defaults.
- `customers`: customer profile and price history.
- `orders`: order creation, revisions, status transitions.
- `inventory`: reservations and stock movements.
- `shipments`: driver, COD, send date, delivery status.
- `reconciliation`: Kiot invoice mapping and mismatch resolution.
- `reports`: operational summaries.

## 15. Error Handling and Safety

- Duplicate Kiot invoice code should be blocked unless merging/resolving mismatch.
- Moving to `shipped` requires reserved stock to exist or an override reason.
- Cancelling after shipment is blocked; user must create return flow.
- Editing confirmed order items requires revision and reason.
- Stock adjustment requires reason.
- Reconciliation mismatch cannot be silently dismissed without reason.
- All destructive-looking actions are soft actions with audit log, not hard deletion.

## 16. Testing Strategy

### Unit Tests

- Alias matching and chat parsing.
- Order status transition rules.
- Reservation and stock movement calculations.
- Rollback rules.

### Integration Tests

- Create order, link Kiot invoice, reserve stock.
- Cancel before shipment and release stock.
- Ship order and reduce stock.
- Return order and add stock back.
- Reconciliation mismatch detection.

### UI Tests

- Product search and add item.
- Customer search and recent price display.
- Kanban status move.
- Shipment/COD form.
- Inventory adjustment.

## 17. Implementation Defaults

These defaults keep the first build focused and reversible.

1. Backend shape: Next.js fullstack with server-side modules, because the app is an internal operations web system and benefits from one deployable codebase.
2. Database: PostgreSQL for real use. SQLite is allowed only for a throwaway local prototype.
3. Reconciliation input for MVP: manual Kiot invoice code entry first, then CSV/report import as the next enhancement. Screenshot/PDF OCR is future work.
4. Operational sequence: Kiot invoice is usually created first, then staff creates or confirms the app operations order and links `kiot_invoice_code`. The app still supports `awaiting_kiot` for orders captured before Kiot entry.
5. Stock ownership: this app owns operational available stock. Kiot remains the boss-facing business ledger for invoices, revenue, customers, and debt.

## 18. Acceptance Criteria for MVP

- Staff can create an operations order linked to a Kiot invoice code.
- Staff can search products, add quantities, and see customer recent price history.
- App reserves stock after confirmation.
- Staff can move order cards through Kanban statuses.
- Warehouse can see packing queue and mark packed.
- Dispatch can assign driver/carrier, COD amount, and send date.
- Cancel before shipment releases stock.
- Ship action reduces stock.
- Return action adds stock after confirmation.
- Reconciliation screen shows missing Kiot code, duplicate Kiot code, and mismatch cases.
- Every important change is visible in an order timeline/audit log.

## 19. Future Enhancements

- OCR from Kiot invoice screenshots/PDF.
- CSV import from Kiot reports.
- Browser automation to prefill Kiot if the risk is acceptable.
- API integration if Kiot package is upgraded.
- Mobile-friendly warehouse scanner/checklist.
- Route planning by province and carrier.
- Debt/COD aging report.
- Customer-specific pricing rules.
