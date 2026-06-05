import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const carriers = await prisma.carrier.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(carriers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const id = body.id || crypto.randomUUID();
  const carrier = await prisma.carrier.upsert({
    where: { id },
    update: {
      name: body.name,
      phone: body.phone,
      route: body.route,
      note: body.note || null
    },
    create: {
      id,
      name: body.name,
      phone: body.phone,
      route: body.route,
      note: body.note || null
    }
  });
  return NextResponse.json(carrier);
}
