import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3001";
const stamp = `codex-smoke-${Date.now()}`;
const cleanup: Array<() => Promise<void>> = [];

async function main() {
  const results: string[] = [];

  for (const path of ["/", "/orders/new", "/board", "/inventory", "/customers", "/dispatch", "/reconciliation"]) {
    const response = await fetch(`${baseUrl}${path}`);
    if (!response.ok) throw new Error(`Page ${path} returned ${response.status}`);
    results.push(`page ${path} ${response.status}`);
  }

  for (const path of ["/api/products", "/api/customers", "/api/carriers", "/api/orders", "/api/inventory", "/api/packaging-batches", "/api/reconciliation"]) {
    await request(path);
    results.push(`GET ${path}`);
  }

  const product = await request("/api/products", {
    method: "POST",
    body: JSON.stringify({
      sku: stamp,
      name: `Sản phẩm smoke ${stamp}`,
      unit: "cái",
      defaultPrice: 123000,
      distributorPrice: 111000,
      packageRule: "1 thùng / smoke",
      weightPerUnitKg: 1.5,
      aliases: [{ value: `alias-${stamp}` }],
      variants: [{ code: "SM01", cartonCount: 1, tubeCount: 2 }]
    })
  });
  cleanup.push(() => request(`/api/products/${product.id}`, { method: "DELETE" }));
  results.push("product create/delete");

  await request("/api/inventory", {
    method: "POST",
    body: JSON.stringify({ productId: product.id, type: "purchase_in", quantity: 12, note: stamp })
  });
  results.push("inventory movement create");

  const customer = await request("/api/customers", {
    method: "POST",
    body: JSON.stringify({
      id: stamp,
      name: `Khách smoke ${stamp}`,
      phone: "0900000000",
      address: "Smoke address",
      province: "Thanh Hóa",
      customerType: "direct",
      groups: "smoke"
    })
  });
  cleanup.push(() => request(`/api/customers/${customer.id}`, { method: "DELETE" }));
  results.push("customer create/delete");

  await request("/api/customers", {
    method: "PATCH",
    body: JSON.stringify({ ids: [customer.id], customerType: "intermediary", groups: ["smoke", "bulk"], province: "Hà Nội" })
  });
  results.push("customer bulk patch");

  const carrier = await request("/api/carriers", {
    method: "POST",
    body: JSON.stringify({ id: stamp, name: `Nhà xe smoke ${stamp}`, phone: "0911111111", route: "Hà Nội - Thanh Hóa", note: stamp })
  });
  cleanup.push(() => request(`/api/carriers/${carrier.id}`, { method: "DELETE" }));
  results.push("carrier create/delete");

  const issue = await request("/api/reconciliation", {
    method: "POST",
    body: JSON.stringify({ kiotInvoiceCode: `HD-${stamp}`, customer: "Khách smoke", mismatchType: "Smoke lệch", requiredAction: "Kiểm tra smoke" })
  });
  cleanup.push(() => request(`/api/reconciliation/${issue.id}`, { method: "DELETE" }));
  await request(`/api/reconciliation/${issue.id}`, {
    method: "PUT",
    body: JSON.stringify({ ...issue, status: "resolved", resolutionNote: "Đã xử lý smoke" })
  });
  results.push("reconciliation create/update/delete");

  await request("/api/orders", {
    method: "POST",
    body: JSON.stringify({ isOfficial: true, orderType: "online", customerName: "Thiếu Kiot smoke", lines: [] })
  }, 422);
  results.push("order official validation");

  const order = await request("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      isOfficial: false,
      sourceChannel: "zalo",
      orderType: "cod",
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      paymentKind: "cod",
      paymentStatus: "unpaid",
      codAmount: 123000,
      packageCount: 1,
      estimatedWeightKg: 1.5,
      deliveryMode: "truck_share",
      carrierName: carrier.name,
      lines: [{ productId: product.id, quantity: 2, unitPrice: 123000, enteredQuantity: 2, enteredUnit: "cái", conversionNote: "Smoke test" }],
      note: stamp
    })
  });
  cleanup.push(() => request(`/api/orders/${order.id}`, { method: "DELETE" }));
  await request(`/api/orders/${order.id}`, {
    method: "PUT",
    body: JSON.stringify({ ...order, customerName: customer.name, customerPhone: customer.phone, status: "draft", note: `${stamp} updated` })
  });
  results.push("order draft create/update/delete");

  await smokePackaging(results);
  await runCleanup();
  await assertNoLeftovers();

  console.log(JSON.stringify({ ok: true, baseUrl, results }, null, 2));
}

async function smokePackaging(results: string[]) {
  const skus = ["nem", "nem-roi", "tui-bong-dong-nem"];
  const products = await prisma.product.findMany({ where: { sku: { in: skus } }, select: { id: true, sku: true } });
  const bySku = new Map(products.map((product) => [product.sku, product.id]));
  const finishedProductId = bySku.get("nem");
  const rawProductId = bySku.get("nem-roi");
  const bagProductId = bySku.get("tui-bong-dong-nem");

  if (!finishedProductId || !rawProductId || !bagProductId) {
    await request("/api/packaging-batches", { method: "POST", body: JSON.stringify({}) }, 422);
    results.push("packaging validation");
    return;
  }

  await prisma.inventoryMovement.createMany({
    data: [
      { productId: rawProductId, type: "purchase_in", quantity: 10, note: stamp },
      { productId: bagProductId, type: "purchase_in", quantity: 1, note: stamp }
    ]
  });

  const packaging = await request("/api/packaging-batches", {
    method: "POST",
    body: JSON.stringify({ rawProductId, bagProductId, finishedProductId, rawKg: 10, bagKg: 1, finishedKg: 11, note: stamp })
  });
  const batch = packaging.batches.find((item: { note?: string }) => item.note === stamp);
  if (!batch) throw new Error("Packaging batch smoke was not returned");
  cleanup.push(async () => {
    await prisma.inventoryMovement.deleteMany({ where: { OR: [{ note: { contains: stamp } }, { packagingBatchId: batch.id }] } });
    await prisma.packagingBatch.deleteMany({ where: { id: batch.id } });
  });
  results.push("packaging create/delete");
}

async function request(path: string, options: RequestInit = {}, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (response.status !== expectedStatus) {
    throw new Error(`${options.method ?? "GET"} ${path} expected ${expectedStatus}, got ${response.status}: ${text.slice(0, 500)}`);
  }
  return body;
}

async function runCleanup() {
  for (const task of cleanup.reverse()) await task();
}

async function assertNoLeftovers() {
  const leftovers = {
    products: await prisma.product.count({ where: { OR: [{ sku: stamp }, { name: { contains: stamp } }] } }),
    customers: await prisma.customer.count({ where: { OR: [{ id: stamp }, { name: { contains: stamp } }] } }),
    orders: await prisma.order.count({ where: { note: { contains: stamp } } }),
    carriers: await prisma.carrier.count({ where: { OR: [{ id: stamp }, { name: { contains: stamp } }] } }),
    issues: await prisma.reconciliationIssue.count({ where: { kiotInvoiceCode: { contains: stamp } } }),
    packaging: await prisma.packagingBatch.count({ where: { note: { contains: stamp } } }),
    movements: await prisma.inventoryMovement.count({ where: { note: { contains: stamp } } })
  };
  const dirty = Object.entries(leftovers).filter(([, count]) => count > 0);
  if (dirty.length) throw new Error(`Smoke cleanup left data behind: ${JSON.stringify(leftovers)}`);
}

main()
  .catch(async (error) => {
    console.error(error);
    try {
      await runCleanup();
    } catch (cleanupError) {
      console.error("Smoke cleanup failed", cleanupError);
    }
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
