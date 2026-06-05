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
      note: body.note || null
    },
    create: {
      id,
      name: body.name,
      phone: body.phone || null,
      address: body.address || null,
      province: body.province || null,
      note: body.note || null
    }
  });
  return NextResponse.json(customer);
}
