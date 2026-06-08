# KEGACH Agent Notes

## Project Purpose

KEGACH is a KiotViet operations companion app for a tile accessory business. KiotViet remains the official ledger for invoices, revenue, customers, debt, and boss-facing reports. This app manages day-to-day operations: order intake, draft orders, packing, vehicle/COD handoff, available stock, packaging ke/nem from raw materials, dispatch schedule, and manual reconciliation back to Kiot.

Do not treat this as a generic ERP or mock demo. The user expects real database-backed CRUD and practical Vietnamese operations UI.

## Current Stack

- Next.js App Router, React, TypeScript
- Ant Design UI, dense internal-business style
- Prisma with SQLite local database at `prisma/dev.db`
- Vitest tests
- Main branch in use: `feature/kiot-operations-mvp`

Useful commands:

```powershell
npm run dev
npm test
npm run build
npm run smoke
npx eslint .
npx prisma db push --skip-generate
npx prisma generate
```

If Prisma generate fails with `EPERM` on `query_engine-windows.dll.node`, a running Next dev server is probably locking Prisma Client. Stop only the KEGACH dev process, then run generate again.

## Working Rules

- Use `apply_patch` for code edits.
- Do not reset or wipe the SQLite database.
- Do not run seed/import scripts unless the user explicitly asks. They can overwrite or pollute real working data.
- Preserve Vietnamese with accents in UI.
- Avoid English status labels in UI. Use labels from `src/features/orders/order-status.ts`.
- Prefer Ant Design built-in patterns and current APIs. Watch for deprecation warnings such as `popupRender` replacing `dropdownRender`.
- After meaningful changes run at least `npm test`, `npm run build`, and smoke when the dev server is available.

## Domain Decisions

### KiotViet Integration

- KiotViet has no usable API/webhook in the user's plan.
- The app uses manual reconciliation.
- Every official order should link to a Kiot invoice code like `HD004066`.
- Invoice images/PDFs are evidence only, not Kanban card data.
- Kanban cards must be structured data cards.

### Order Statuses

Valid statuses:

```text
draft
awaiting_stock
awaiting_kiot
kiot_linked
reserved
packing
packed
waiting_vehicle
scheduled
shipped
delivered
problem
cancelled
returned
```

Important behavior:

- Draft orders are real business records, used when customers have not finalized or stock is missing.
- Cancel before shipment releases reservation.
- Do not cancel after shipment; use return flow.
- If an order has some available lines and some shortage lines, available items can still proceed. Shortage is kept per order item for that customer.
- If all lines are short, the order goes to `awaiting_stock`.

### Standard Order Workflow

The app should prevent forgetting required operations:

- Ask whether the customer wants more products.
- Draft order is sent to Tan for preparation when needed.
- Official orders must be created in Kiot.
- Official order is sent to customer and group.
- Truck-share orders require carrier contact.
- Packing requires photo, package count, labels.
- Handoff requires checking the correct shipper/order.
- COD requires name, phone, address, COD amount, package count, weight, freight payer, and COD print/handoff info.
- Delivered orders require Zalo confirmation and vehicle phone sent to customer.

Workflow logic lives mainly in:

- `src/features/orders/order-workflow.ts`
- `src/features/orders/components/WorkflowChecklist.tsx`
- `src/features/kanban/KanbanBoard.tsx`

## Products And Stock

Products are dynamic database records, not fixed mocks. Product management must support CRUD, active/hidden products, image upload/album behavior where implemented, import/export, and column visibility.

Sales products currently include the user's real list:

- Ke cân bằng 1MM, 1.5MM, 2MM, 3MM
- Nêm
- Kìm siết ke
- Ke chữ thập 1MM, 1.5MM, 2MM, 3MM, 5MM
- Ke vít xoáy 1MM, 1.5MM
- Nước tẩy xi măng
- Keo 2 thành phần BONBOND
- Keo 2 thành phần EPOXY CAT
- Súng bắn keo EPOXY
- Bộ biron rẻ, Bộ biron đắt
- Rạch mạch, Sủi, Kích gạch
- Bàn kéo răng cưa, Bay răng cưa, Mủ chiết mạch
- Súng điện full bộ

Keo colors/variants are search aliases/variants for the same product families:

- BONBOND: `B01` to `B14`
- EPOXY CAT: `CAT 01` to `CAT 14`

Customers often say things like:

- `B07 ship e 1 thùng`
- `2 thùng keo 2 thành phần màu 08`
- `20kg ke nêm 1.5mm`

The parser should map these to the right product/variant and convert package quantities. For keo, 1 thung = 30 tubes.

### Ke/Nem Stock Principle

Ke cân bằng and Nêm are sold as finished product but measured in kg. Do not show confusing "bao" as the base inventory unit in tables. The base stock unit is kg.

Package conversion:

- 1 bao ke/nem = 30kg
- Inventory entry UI may allow entering by bao or kg, but database stock should stay in kg.

Raw/internal packaging materials:

- `Nêm rời`
- `Ke cân bằng ... rời`
- matching `Túi bóng ...`

These internal products should stay hidden from normal sales/order product search, but must remain usable in packaging management.

Packaging logic:

- Consumes raw ke/nem kg.
- Consumes matching bag kg.
- Produces finished sale product kg.
- Finished kg = raw kg + bag kg.
- End-year reconciliation must show raw used, bag used, finished produced, remaining raw, remaining bag, and variance per product type.

Recent real stock entry:

- New ke shipment: 126 bao total.
- 29 bao Ke cân bằng 1MM = 870kg.
- Remaining 97 bao Ke cân bằng 1.5MM = 2910kg.
- This was entered as inventory movements in local `prisma/dev.db`.

## Inventory Rules

Stock formula:

```text
available = onHand - reserved
```

Movement types:

```text
purchase_in
manual_adjustment
reserve
release_reservation
ship
return_in
damage_out
package_consume
package_produce
```

Keep inventory tables usable at large data sizes:

- search
- filters
- page-size choices such as 10/30/50/all
- column visibility
- active/hidden product toggle
- import/export where implemented

## Customers

Customer records are dynamic database records. Order entry should support:

- selecting an existing customer
- creating or typing a new customer
- direct customer vs intermediary customer

If `Lấy thẳng`, receiver fields are unnecessary. If `Trung gian`, show final receiver name/phone/address.

## Carriers And Dispatch

Carriers are dynamic database records. The user supplied real carriers such as GHN/buu dien, Tan Tai, Tien Phuong, Anh Thong, Tuan Nga Hai, Tri Hai Phong, Khanh Mai, Quang Ninh, Tan Hoa, Cau Me, Hoang Ha, Manh Tan, Tuy Dinh, Chi Mai, Hoa Phat, Hiep Ga, Van Nam, Ngoc Tien, Viet Anh, Thien Hoa, Sam Huong, Anh Ngoc.

Orders may need carrier changes after creation. Kanban edit drawer should support practical updates to carrier, driver note, COD info, package count, weight, and status.

## UI Expectations

- Internal operations UI, not landing page.
- Ant Design, dense, scan-friendly, professional.
- Dark mode exists and must not break Ant Design context.
- Tables should use reusable filter/operation bars where possible.
- Kanban must stay usable with many orders: filters, quick filters, per-column count/page size, compact cards.
- COD cards should be visually distinct and have print action for the post/COD handoff.
- Avoid redundant text like repeating "Đơn thường" everywhere.

## Important Files

- `prisma/schema.prisma`
- `src/app/api/orders/route.ts`
- `src/app/api/orders/[id]/route.ts`
- `src/features/orders/order-status.ts`
- `src/features/orders/order-workflow.ts`
- `src/features/orders/stock-allocation.ts`
- `src/features/orders/components/OrderEntryForm.tsx`
- `src/features/kanban/KanbanBoard.tsx`
- `src/features/kanban/KanbanOrderCard.tsx`
- `src/features/inventory/components/InventoryTable.tsx`
- `src/features/inventory/components/PackagingManagement.tsx`
- `src/features/inventory/packaging-rules.ts`
- `src/features/catalog/components/ProductManagement.tsx`
- `src/components/ColumnVisibilityDropdown.tsx`
- `src/components/TableOperationsBar.tsx`
- `src/styles/globals.css`

## Testing Notes

Current expected checks before saying done:

```powershell
npx eslint .
npm test
npm run build
$env:SMOKE_BASE_URL='http://127.0.0.1:3000'; npm run smoke
```

Smoke covers core pages and CRUD/API paths. If the app is running on another port, set `SMOKE_BASE_URL` accordingly.
