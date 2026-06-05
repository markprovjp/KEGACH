import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const customers = await prisma.customer.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    province: customer.province,
    note: customer.note
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
