# KEGACH Kiot Operations Companion

Internal MVP for running the work around Kiot Viet orders. Kiot remains the ledger for invoices, revenue, customers, debt, and boss-facing reports. This app owns receiving orders, packing, vehicle queueing, COD tracking, available stock, send schedules, and manual reconciliation.

## Setup

```powershell
npm install
copy .env.example .env
npm run db:generate
```

Set `DATABASE_URL` in `.env` to a PostgreSQL database before running migrations.

## Database

```powershell
npm run db:migrate
npm run db:seed
```

The seed loads the initial product list from the approved design, including aliases such as `B03`, `B04`, `kcb`, `nem`, `1ly`, `1.5ly`, `2ly`, `3ly`, and `5ly`.

## Run

```powershell
npm run dev
```

Main routes:
- `/` dashboard
- `/orders/new` Kiot-linked order entry
- `/board` structured Kanban operations board
- `/inventory` available stock table
- `/reconciliation` manual Kiot reconciliation queue

## Checks

```powershell
npm test
npm run build
```

## Operating Rules

Every operations order should carry a `kiot_invoice_code` such as `HD004066` once the real Kiot invoice exists. Kanban cards use structured order data, not invoice screenshots. Invoice images or PDFs belong in order detail evidence later.

Stock uses `available = onHand - reserved`. Cancelling before shipment releases reservation. Cancelling after shipment is blocked; staff must use the return flow and reconcile Kiot manually.
