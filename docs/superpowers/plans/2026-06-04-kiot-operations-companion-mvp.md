# Kiot Operations Companion MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working web app for Kiot-linked operations orders, Kanban dispatch, stock reservation, rollback, and manual reconciliation.

**Architecture:** Use a Next.js fullstack app with domain modules under `src/features`. Kiot stays the boss-facing ledger; this app owns operations state, shipment, stock reservation, and reconciliation. Kanban sends transition commands; domain services decide whether the move is allowed.

**Tech Stack:** Next.js App Router, TypeScript, Ant Design, dnd-kit, Prisma, PostgreSQL, Vitest, Testing Library.

---

## Reference Inputs

- Spec: `docs/superpowers/specs/2026-06-04-kiot-operations-companion-design.md`
- GitHub research: `docs/research/2026-06-04-github-reference-scan.md`

## File Structure Map

- `package.json`: scripts and dependencies.
- `prisma/schema.prisma`: database schema.
- `prisma/seed.ts`: initial products and aliases.
- `src/app/*`: App Router pages.
- `src/components/AppShell.tsx`: navigation and page frame.
- `src/features/catalog/*`: products, aliases, product search, chat parsing.
- `src/features/customers/*`: customer search and recent price references.
- `src/features/orders/*`: order creation, Kiot invoice link, status rules, rollback.
- `src/features/inventory/*`: stock movement ledger and reservations.
- `src/features/shipments/*`: driver, carrier, COD, send date.
- `src/features/kanban/*`: board, columns, cards, drag/drop adapter.
- `src/features/reconciliation/*`: Kiot mismatch detection and resolution.
- `src/lib/*`: shared db, money, normalization utilities.

## Task 1: Project Foundation

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/styles/globals.css`

- [ ] **Step 1: Initialize git if needed**

Run:

```powershell
git rev-parse --is-inside-work-tree 2>$null; if ($LASTEXITCODE -ne 0) { git init }
```

Expected: `git status --short` works.

- [ ] **Step 2: Create package and config files**

Use these scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

Install dependencies:

```powershell
npm install next react react-dom antd @ant-design/icons @ant-design/cssinjs @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @prisma/client prisma zod
npm install -D typescript @types/node @types/react @types/react-dom vitest jsdom @testing-library/react @testing-library/jest-dom tsx eslint eslint-config-next
```

- [ ] **Step 3: Create minimal app shell**

`src/app/layout.tsx`:

```tsx
import "antd/dist/reset.css";
import "@/styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kiot Operations Companion",
  description: "Operations board for Kiot-linked orders"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
```

`src/app/page.tsx`:

```tsx
export default function DashboardPage() {
  return <main className="page-shell">Kiot Operations Companion</main>;
}
```

`src/styles/globals.css`:

```css
* { box-sizing: border-box; }
body { margin: 0; background: #f5f7fa; color: #172033; font-family: Arial, sans-serif; }
.page-shell { min-height: 100vh; padding: 24px; }
```

- [ ] **Step 4: Verify and commit**

Run:

```powershell
npm test
git add .
git commit -m "chore: initialize Kiot operations app"
```

Expected: dependencies install, tests run, commit succeeds.

## Task 2: Domain Status Machine

**Files:**
- Create: `src/features/orders/order-status.ts`
- Create: `src/features/orders/order-status.test.ts`

- [ ] **Step 1: Write failing test**

Create tests for: operational statuses exist, normal flow is allowed, cancelling after shipment is blocked, risky moves require reason.

- [ ] **Step 2: Implement status machine**

Create `OrderStatus`, `orderStatuses`, `canTransitionOrder`, and `requireReasonForTransition` using statuses from the spec: `draft`, `awaiting_kiot`, `kiot_linked`, `reserved`, `packing`, `packed`, `waiting_vehicle`, `scheduled`, `shipped`, `delivered`, `problem`, `cancelled`, `returned`.

- [ ] **Step 3: Verify and commit**

Run:

```powershell
npm test -- src/features/orders/order-status.test.ts
git add src/features/orders
git commit -m "feat: add order status machine"
```

Expected: test passes, commit succeeds.

## Task 3: Product Alias and Chat Parsing

**Files:**
- Create: `src/lib/normalize.ts`
- Create: `src/features/catalog/catalog-types.ts`
- Create: `src/features/catalog/product-matcher.ts`
- Create: `src/features/catalog/product-matcher.test.ts`

- [ ] **Step 1: Write matcher tests**

Test inputs: `B03 = 3t`, `B04 = 2t`, `* nem: 1 bao`, and one unmatched line. Expected result returns matched product id, quantity, raw line, and unmatched lines for staff review.

- [ ] **Step 2: Implement matcher**

Create lowercase search normalization, alias matching, line splitting, and quantity extraction from patterns like `3t`, `1 bao`, `2 kg`.

- [ ] **Step 3: Verify and commit**

Run:

```powershell
npm test -- src/features/catalog/product-matcher.test.ts
git add src/lib src/features/catalog
git commit -m "feat: parse product aliases from chat orders"
```

## Task 4: Inventory Ledger Rules

**Files:**
- Create: `src/features/inventory/inventory-types.ts`
- Create: `src/features/inventory/inventory-ledger.ts`
- Create: `src/features/inventory/inventory-ledger.test.ts`

- [ ] **Step 1: Write tests and implementation**

Test cases: purchase increases `onHand`, reserve increases `reserved`, ship decreases both `onHand` and `reserved`, release reservation decreases `reserved`, return increases `onHand`.

Implementation API:

```ts
export type InventoryMovementType = "purchase_in" | "manual_adjustment" | "reserve" | "release_reservation" | "ship" | "return_in" | "damage_out";
export type InventoryMovementInput = { type: InventoryMovementType; quantity: number };
export type StockSnapshot = { onHand: number; reserved: number; available: number };
export function createMovement(type: InventoryMovementType, quantity: number): InventoryMovementInput;
export function calculateStock(movements: InventoryMovementInput[]): StockSnapshot;
```

- [ ] **Step 2: Verify and commit**

Run:

```powershell
npm test -- src/features/inventory/inventory-ledger.test.ts
git add src/features/inventory
git commit -m "feat: add inventory reservation ledger"
```

## Task 5: Database Schema and Product Seed

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `.env.example`
- Create: `src/lib/db.ts`

- [ ] **Step 1: Model tables**

Create Prisma models: `Product`, `ProductAlias`, `Customer`, `Order`, `OrderItem`, `Shipment`, `InventoryMovement`, `AuditLog`, `ReconciliationIssue`.

- [ ] **Step 2: Seed products**

Seed all products from the spec with prices and aliases. Include aliases `B03`, `B04`, `kcb`, `nem`, `1ly`, `1.5ly`, `2ly`, `3ly`, `5ly`.

- [ ] **Step 3: Generate and commit**

Run:

```powershell
npm run db:generate
git add prisma src/lib/db.ts .env.example package.json package-lock.json
git commit -m "feat: add database schema and product seed"
```

## Task 6: Order Lifecycle Use Cases

**Files:**
- Create: `src/features/orders/order-use-cases.ts`
- Create: `src/features/orders/order-use-cases.test.ts`

- [ ] **Step 1: Test lifecycle rules**

Cover: create Kiot-linked order, block duplicate Kiot invoice code, reserve stock, cancel before shipment, reject cancel after shipment, ship order, return shipped order.

- [ ] **Step 2: Implement use cases**

Functions: `createOperationsOrder`, `linkKiotInvoice`, `confirmAndReserveOrder`, `cancelOrderBeforeShipment`, `shipOrder`, `returnShippedOrder`.

- [ ] **Step 3: Verify and commit**

Run:

```powershell
npm test -- src/features/orders/order-use-cases.test.ts
git add src/features/orders
git commit -m "feat: add order lifecycle use cases"
```

## Task 7: Web App Shell

**Files:**
- Create: `src/components/AppShell.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/orders/new/page.tsx`
- Create: `src/app/board/page.tsx`
- Create: `src/app/inventory/page.tsx`
- Create: `src/app/reconciliation/page.tsx`

- [ ] **Step 1: Build Ant Design navigation**

Routes: Dashboard, Create Order, Kanban, Inventory, Reconciliation.

- [ ] **Step 2: Verify and commit**

Run:

```powershell
npm run build
git add src/app src/components
git commit -m "feat: add operations app shell"
```

## Task 8: Order Entry UI

**Files:**
- Create: `src/features/orders/components/OrderEntryForm.tsx`
- Create: `src/features/catalog/components/ProductSearch.tsx`
- Create: `src/features/customers/components/CustomerSearch.tsx`
- Modify: `src/app/orders/new/page.tsx`

- [ ] **Step 1: Build Kiot-like order form**

Fields: Kiot invoice code, source channel, customer, product lines, quantity, unit price, COD amount, promised send date, note, raw chat paste.

- [ ] **Step 2: Verify and commit**

Run:

```powershell
npm run build
git add src/features/orders src/features/catalog src/features/customers src/app/orders/new/page.tsx
git commit -m "feat: add Kiot-linked order entry UI"
```

## Task 9: Kanban Board UI

**Files:**
- Create: `src/features/kanban/KanbanBoard.tsx`
- Create: `src/features/kanban/KanbanColumn.tsx`
- Create: `src/features/kanban/KanbanOrderCard.tsx`
- Create: `src/features/kanban/kanban-types.ts`
- Modify: `src/app/board/page.tsx`

- [ ] **Step 1: Build structured card board**

Cards show Kiot invoice code, customer, phone, product summary, total, COD badge, province, send date, driver, warning badges. Do not use invoice image as card content.

- [ ] **Step 2: Wire drag/drop to status checks**

Use dnd-kit. Call `canTransitionOrder` before applying a status move.

- [ ] **Step 3: Verify and commit**

Run:

```powershell
npm run build
git add src/features/kanban src/app/board/page.tsx
git commit -m "feat: add operations Kanban board"
```

## Task 10: Inventory and Reconciliation Screens

**Files:**
- Create: `src/features/inventory/components/InventoryTable.tsx`
- Create: `src/features/reconciliation/components/ReconciliationTable.tsx`
- Modify: `src/app/inventory/page.tsx`
- Modify: `src/app/reconciliation/page.tsx`

- [ ] **Step 1: Build tables**

Inventory columns: product, on hand, reserved, available, low-stock threshold, last movement, actions.

Reconciliation columns: date, Kiot invoice code, customer, app order code, mismatch type, required action, resolution note.

- [ ] **Step 2: Verify and commit**

Run:

```powershell
npm run build
git add src/features/inventory src/features/reconciliation src/app/inventory/page.tsx src/app/reconciliation/page.tsx
git commit -m "feat: add inventory and reconciliation screens"
```

## Task 11: Final Verification

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write runbook**

Document setup, database, seed, dev, test, and the operating model: Kiot is ledger, app is operations board.

- [ ] **Step 2: Run checks**

Run:

```powershell
npm test
npm run build
```

Expected: tests pass and build succeeds.

- [ ] **Step 3: Browser smoke test**

Open local dev URL. Verify Dashboard, Create Order, Kanban, Inventory, and Reconciliation render.

- [ ] **Step 4: Commit**

Run:

```powershell
git add README.md src prisma package.json package-lock.json
git commit -m "docs: add MVP runbook"
```

## Self-Review

- Spec coverage: Kiot linkage, order statuses, rollback, inventory, Kanban, reconciliation, product aliases, customer search, and recent price surface all map to tasks.
- Vague-language scan: plan language is concrete and ready for execution.
- Type consistency: status names and inventory movement names match the design spec.