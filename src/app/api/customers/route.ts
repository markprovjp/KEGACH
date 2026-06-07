import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const customers = await prisma.customer.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(customers.map((customer) => ({
    id: customer.id,
    kiotCustomerId: customer.kiotCustomerId,
    kiotCustomerCode: customer.kiotCustomerCode,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    province: customer.province,
    note: customer.note,
    debt: customer.debt,
    totalRevenue: customer.totalRevenue,
    totalInvoiced: customer.totalInvoiced,
    invoiceCount: customer.invoiceCount,
    customerType: customer.customerType,
    groups: customer.groups,
    lastTradingAt: customer.lastTradingAt?.toISOString()
  })));
}

export async function POST(request: Request) {
  const body = await request.json();
  const id = body.id || crypto.randomUUID();
  const customer = await prisma.customer.upsert({
    where: { id },
    update: {
      name: body.name,
      phone: body.phone || null,
      address: body.address || null,
      province: body.province || null,
      note: body.note || null,
      customerType: body.customerType || null,
      groups: body.groups || null
    },
    create: {
      id,
      name: body.name,
      phone: body.phone || null,
      address: body.address || null,
      province: body.province || null,
      note: body.note || null,
      customerType: body.customerType || null,
      groups: body.groups || null
    }
  });
  return NextResponse.json(customer);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown): id is string => typeof id === "string" && id.trim().length > 0) : [];
  if (!ids.length) return NextResponse.json({ error: "Chưa chọn khách hàng" }, { status: 422 });

  const data: { customerType?: string | null; groups?: string | null; province?: string | null; note?: string | null } = {};
  if ("customerType" in body) data.customerType = body.customerType || null;
  if ("groups" in body) data.groups = Array.isArray(body.groups) ? body.groups.join(", ") : body.groups || null;
  if ("province" in body) data.province = body.province || null;
  if ("note" in body) data.note = body.note || null;

  if (!Object.keys(data).length) return NextResponse.json({ error: "Chưa chọn thao tác cập nhật" }, { status: 422 });

  const result = await prisma.customer.updateMany({
    where: { id: { in: ids } },
    data
  });
  return NextResponse.json({ updated: result.count });
}
