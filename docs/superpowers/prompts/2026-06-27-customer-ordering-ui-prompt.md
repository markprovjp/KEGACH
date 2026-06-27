# Prompt: Customer Ordering UI For KEGACH

Use this prompt for an implementation AI working in `D:\CODE\KEGACH`.

## Role

You are a senior Next.js + Ant Design engineer. Build a production customer-facing ordering interface for KEGACH. Do not make a marketing landing page. Build the actual ordering screen customers can open and place product requests from.

## Context To Read First

Read these files before coding:

- `AGENTS.md`
- `prisma/schema.prisma`
- `src/app/api/products/route.ts`
- `src/app/api/orders/route.ts`
- `src/features/catalog/catalog-types.ts`
- `src/features/catalog/package-conversion.ts`
- `src/features/catalog/product-search-helpers.ts`
- `src/features/catalog/components/ProductSearch.tsx`
- `src/features/catalog/components/ProductManagement.tsx`
- `src/features/orders/freeform-order-parser.ts`
- `src/features/orders/stock-allocation.ts`
- `src/features/orders/order-workflow.ts`
- `src/features/orders/components/OrderEntryForm.tsx`
- `src/lib/number-format.ts`
- `src/styles/globals.css`

Then inspect any imported components/types you need.

## Product Goal

Create a customer ordering UI where a customer can:

- Open a public route.
- See active products with images.
- Filter products quickly.
- Search by name, alias, SKU, BONBOND `B01`-`B14`, CAT `CAT01`-`CAT14`.
- Choose product variants/color codes when relevant.
- Enter quantity by practical unit: kg, bao, thùng, tuýp, cái, bộ, can, túi depending on product `packageRule`.
- See automatic conversion, e.g. `2 thùng = 60 tuýp`, `3 bao = 90kg`.
- Add/remove/update cart lines.
- Enter customer info.
- Choose direct customer or intermediary receiver.
- Submit into the existing operations system as a real draft order, not mock/local-only data.

This screen is for Vietnamese customers/dealers. It must be fast, clean, and practical.

## Hard Requirements

- No mock data.
- Use data from the database through APIs.
- Only show `Product.isActive !== false`.
- Do not show internal raw/bag products such as `Nêm rời`, `Ke cân bằng ... rời`, `Túi bóng ...`.
- Use Vietnamese with accents.
- Use Ant Design components.
- Use Ant Design `Image` for product images, preferably `Image.PreviewGroup` when showing gallery/preview behavior.
- Use existing number formatting helpers where suitable.
- Preserve current internal app behavior.
- Do not wipe or seed `prisma/dev.db`.
- Do not break existing `npm test`, `npm run build`, `npm run smoke`.

## Suggested Route And Files

Preferred route:

- `src/app/dat-hang/page.tsx`

Suggested feature folder:

- `src/features/shop/CustomerOrderPage.tsx`
- `src/features/shop/ProductFilterPanel.tsx`
- `src/features/shop/ProductGrid.tsx`
- `src/features/shop/CartDrawer.tsx`
- `src/features/shop/shop-types.ts`
- `src/features/shop/shop-helpers.ts`
- `src/features/shop/shop-helpers.test.ts`

Suggested public APIs:

- `src/app/api/shop/products/route.ts`
- `src/app/api/shop/order-requests/route.ts`

Reason: keep customer-facing API sanitized. Do not expose hidden products, raw materials, all aliases if not needed, or admin-only mutation fields.

## Data Contract

`GET /api/shop/products` should return active customer-orderable products only:

```ts
type ShopProduct = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  defaultPrice: number;
  packageRule?: string | null;
  description?: string;
  imageUrl?: string | null;
  weightPerUnitKg: number;
  searchText: string;
  category: string;
  aliases: string[];
  variants: Array<{
    code: string;
    label: string;
    cartonCount: number;
    tubeCount: number;
    note?: string;
  }>;
};
```

Category can be derived from product name:

- `Ke cân bằng`
- `Nêm`
- `Ke chữ thập`
- `Ke vít xoáy`
- `Keo chà ron`
- `Dụng cụ`
- `Hóa chất`
- `Khác`

Exclude internal records by name/sku patterns:

- contains `rời`
- starts with or contains `túi bóng`
- `defaultPrice <= 0` unless explicitly active special sale item

`POST /api/shop/order-requests` should:

- Validate customer name/phone or at least one contact field.
- Validate at least one cart line.
- Convert entered quantities into base product quantity with existing `convertProductQuantity`.
- Create a real order via Prisma or call existing order creation logic.
- Use `status: "draft"`.
- Use `sourceChannel: "customer_order_page"`.
- Use `isOfficial: false`.
- Use `orderType` from selected customer intent: `online`, `truck_share`, `cod`, or `warehouse_pickup`.
- Preserve partial stock behavior through existing order creation path or duplicate the same allocation logic.
- Return created order code and line fulfillment summary.

Do not require Kiot invoice for this route because this is a customer request/draft, not official Kiot invoice.

## UI Design Direction

Tone: refined utilitarian product ordering. Not AI glossy. Not SaaS landing page. Not purple gradient. Think clean trade counter catalog: product photos, fast filters, compact product cards, sticky cart.

First viewport:

- Product search and filters visible immediately.
- Product grid/list visible immediately.
- Cart summary visible on desktop right side or floating/sticky button on mobile.
- No hero section.
- No explanatory marketing text.

Layout:

- Desktop: two-column layout.
  - Left: filter panel, category chips, product grid/list.
  - Right: sticky cart/order panel.
- Mobile:
  - Search on top.
  - Filter drawer.
  - Products in 1-column compact cards.
  - Cart as bottom floating button opening drawer.

Ant Design components to use:

- `Image` / `Image.PreviewGroup`
- `Card`
- `List` or CSS grid with `Card`
- `Input.Search`
- `Select`
- `Segmented`
- `Slider` or `InputNumber` for price/stock range only if useful
- `Checkbox.Group` for categories/units
- `Tag`
- `Badge`
- `Drawer`
- `Affix` or sticky CSS for cart
- `Empty`
- `Skeleton`
- `Form`
- `InputNumber`
- `App.useApp()` for messages

Avoid:

- Generic cards with giant whitespace.
- Gradient blob backgrounds.
- Decorative hero.
- English labels.
- Text that explains obvious UI behavior.
- Showing internal stock/raw material products to customers.

## Product Card Requirements

Each product card should show:

- Image using Ant Design `Image`.
- Product name.
- Category tag.
- Price in Vietnamese format.
- Unit and package rule.
- Variant/code badges for BONBOND/CAT when available.
- Quantity input with unit select.
- Conversion note, e.g. `2 thùng = 60 tuýp`.
- Add/update cart button.

If no image exists:

- Use a restrained placeholder block with product initial/category, not broken image.
- Keep dimensions stable to avoid layout shift.

Card density:

- Fixed image aspect ratio.
- Card border radius max 8px.
- Text must not overflow. Use clamp/ellipsis with tooltip if needed.

## Filters

Implement practical filters:

- Search: name, aliases, SKU, variants, B/CAT codes.
- Category.
- Unit.
- Has image / missing image.
- Price range.
- Package type: `bao`, `thùng`, `túi`, `can`, `bộ`, `kg`, `tuýp`.
- Stock status if available from `/api/inventory`: available, low, out.
- Sort:
  - A-Z
  - Giá thấp-cao
  - Giá cao-thấp
  - Có ảnh trước
  - Nhóm sản phẩm

Search must handle Vietnamese accent-insensitive text. Reuse `normalizeSearchText` and `buildProductSearchText` patterns.

## Cart Requirements

Cart line:

- Product image thumbnail.
- Product name.
- Selected variant/code if applicable.
- Entered quantity + entered unit.
- Converted base quantity.
- Unit price and line total.
- Remove button.

Cart totals:

- Number of product lines.
- Total converted quantity display where sensible.
- Estimated weight if `weightPerUnitKg` exists.
- Total amount.

Customer section:

- Customer name.
- Phone.
- Address/province.
- Delivery intent:
  - `Gửi xe/chành xe`
  - `COD`
  - `Lấy tại kho`
  - `Online/Kiot xử lý sau`
- Payment intent:
  - `Chưa thanh toán/ghi nợ`
  - `COD`
  - `Đã chuyển khoản`
- Direct vs intermediary:
  - `Lấy thẳng`: hide final receiver fields.
  - `Trung gian`: show final receiver name/phone/address.
- Note.

Submit response:

- Show order code.
- Show lines that can send now vs waiting for stock if API returns fulfillment.
- Keep submitted data visible; do not clear cart blindly.

## Business Logic

Use existing conversion logic:

- `src/features/catalog/package-conversion.ts`

Expected examples:

- BONBOND/CAT: 1 thùng = 30 tuýp.
- Ke/Nêm: 1 bao = 30kg.
- Ke vít xoáy: package rule `60 túi / thùng - 1 túi 50 cái`; if current converter only supports túi/thùng for base `túi`, do not invent wrong conversion to cái unless product unit supports it.

Use existing stock allocation behavior:

- `src/features/orders/stock-allocation.ts`

If stock is partial:

- Let customer submit.
- Draft order stores fulfillable/waiting quantities.
- UI should tell customer/admin: `Có hàng gửi trước` and `Có hàng chờ nhập`, not block the whole order.

## Styling

Add styles to `src/styles/globals.css` or co-locate only if project already uses module CSS. Current project uses global CSS.

Use a balanced palette:

- Neutral background.
- Product/category accents by restrained tags/borders.
- Avoid one-note purple/blue, beige, dark slate dominance.

Desktop must support many products:

- Filter panel compact.
- Product grid card stable.
- Right cart sticky.
- No content overlap.

Mobile must be usable:

- No table layout.
- Controls fit.
- Cart drawer/bottom action reachable.

## Tests

Add focused tests:

- Filter/search helper finds:
  - `b07`
  - `cat 08`
  - Vietnamese product name with/without accents
  - package type filters
- Cart conversion:
  - `2 thùng BONBOND = 60 tuýp`
  - `3 bao Ke cân bằng 1MM = 90kg`
- API route excludes hidden/internal products.
- API order request creates draft and rejects empty cart.

Run:

```powershell
npx eslint .
npm test
npm run build
```

If dev server is available:

```powershell
$env:SMOKE_BASE_URL='http://127.0.0.1:3000'; npm run smoke
```

Also manually verify:

- `http://127.0.0.1:3000/dat-hang`
- desktop 1440px
- mobile 390px
- dark mode if app shell/theme applies
- no React hydration mismatch
- no Ant Design deprecation warnings in console

## Implementation Sequence

1. Read context files.
2. Add shop helper tests first.
3. Add `GET /api/shop/products`.
4. Add `POST /api/shop/order-requests`.
5. Build customer page/components.
6. Add CSS.
7. Run tests/build.
8. Start dev server and smoke/manual check.
9. Commit with message:

```text
feat: add customer ordering interface
```

## Reference Patterns Checked

Use these as design/API references, not as copy-paste sources:

- Ant Design `Image` docs: product photos should use built-in preview/loading/error handling.
- Ant Design data display/filter components: use `Card`, `List`, `Select`, `Segmented`, `Drawer`, `Affix`, `InputNumber`, `Tag`, `Empty`, `Skeleton`.
- Ant Design Pro list/card patterns: separate query/filter state from rendering, keep actions close to item cards, use compact operation bars.

## Done Criteria

Done only when:

- Customer can browse active products with images.
- Filters/search work across product names, aliases, and variant codes.
- Cart conversion works.
- Customer can submit a real draft order.
- Partial stock is represented correctly.
- Internal products stay hidden.
- UI looks like a practical ordering catalog, not a generic AI page.
- `npx eslint .`, `npm test`, and `npm run build` pass.
