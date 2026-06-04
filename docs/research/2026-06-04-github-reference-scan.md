# GitHub Reference Scan: Kiot Operations Companion

Date: 2026-06-04

Purpose: learn structure and workflow ideas from public repositories before implementing the Kiot operations companion. These repos are references only. Do not copy code blindly.

## Reference Repositories

### ERPNext

Repository: https://github.com/frappe/erpnext

Useful structure observed:

- `erpnext/stock`: stock ledger, stock balance, valuation, reorder logic, stock reports, tests.
- `erpnext/selling`: selling documents, reports, dashboards, print formats.
- `erpnext/accounts`: ledger, party/customer logic, payment/accounting services.
- `erpnext/crm`: customer-facing relationship modules.

Lessons for this project:

- Keep stock logic as a separate domain, not hidden inside order screens.
- Use append-only stock movements rather than editing stock numbers directly.
- Separate operational documents from reports.
- Put reconciliation and reports in their own modules.

### Odoo

Repository: https://github.com/odoo/odoo

Useful structure observed:

- `addons/stock`: models, controllers, reports, views, security, wizards, tests.
- `addons/sale`: sale workflows and related documents.
- `addons/account`: accounting, reports, tools, tests.
- `addons/crm`: CRM models and views.

Lessons for this project:

- Treat each business area as a module with its own models, views, tests, and permissions.
- Keep stock, sales, accounting, CRM, and operations separate even when screens connect them.
- Use explicit workflow transitions rather than free-form status edits.

### IDURAR ERP/CRM

Repository: https://github.com/idurar/idurar-erp-crm

Useful structure observed:

- Backend: `controllers`, `models`, `routes`, `middlewares`, `pdf`, `settings`, `utils`.
- Frontend: `modules/InvoiceModule`, `PaymentModule`, `DashboardModule`, `CrudModule`, `ErpPanelModule`.

Lessons for this project:

- Invoice/customer/payment features benefit from module folders.
- A reusable CRUD shell is useful for products, customers, drivers, and settings.
- PDF/print handling should be separated from core order logic.

### infiniteoo/wms

Repository: https://github.com/infiniteoo/wms

Useful structure observed:

- `components/inventory`: inventory dashboard, incidents, inventory, labels, timeline.
- `components/shipping`: orders, toolbar, timeline, dashboard, driver check-in, confirmation modal.
- `components/receiving`: receiving dashboard, toolbar, order modal, recent activity.

Lessons for this project:

- Warehouse apps need separate receiving, inventory, and shipping surfaces.
- Shipping/dispatch deserves its own module, not just a field on an order.
- Timelines and recent activity are important for operations accountability.

### react-kanban-board

Repository: https://github.com/barishazar3431/react-kanban-board

Useful structure observed:

- `KanbanBoard.tsx`
- `KanbanColumn.tsx`
- `KanbanTaskItem.tsx`
- `store/kanbanSlice.ts`
- `util/kanbanUtils.ts`

Lessons for this project:

- Split Kanban into board, column, card, store/actions, and utility functions.
- Keep drag/drop operations separate from business status-transition rules.
- Cards should show structured operational data, not invoice images.

## Chosen Project Structure Lessons

The Kiot companion should use module folders:

- `catalog`: products and aliases.
- `customers`: customer records and recent price history.
- `orders`: order creation, revisions, Kiot invoice linking, audit timeline.
- `inventory`: stock movements, reservations, available stock.
- `shipments`: driver/carrier/COD/send-date operations.
- `kanban`: visual board only, backed by order status rules.
- `reconciliation`: Kiot invoice matching and mismatch resolution.
- `reports`: dashboards and operational summaries.

The app should not make the Kanban board own stock or shipment rules. Kanban sends transition commands. Domain services decide whether the transition is allowed.

