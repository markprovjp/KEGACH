import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const issue = await prisma.reconciliationIssue.update({
    where: { id },
    data: {
      kiotInvoiceCode: body.kiotInvoiceCode ? String(body.kiotInvoiceCode).trim() : undefined,
      customerName: body.customer ? String(body.customer).trim() : undefined,
      mismatchType: body.mismatchType ? String(body.mismatchType).trim() : undefined,
      requiredAction: body.requiredAction ? String(body.requiredAction).trim() : undefined,
      resolutionNote: body.resolutionNote ? String(body.resolutionNote).trim() : null,
      status: body.status === "resolved" ? "resolved" : "open"
    },
    include: { order: true }
  });

  return NextResponse.json({
    key: issue.id,
    id: issue.id,
    date: issue.createdAt.toISOString().slice(0, 10),
    kiotInvoiceCode: issue.kiotInvoiceCode,
    customer: issue.customerName ?? issue.order?.customerName ?? "-",
    appOrderCode: issue.order?.code,
    mismatchType: issue.mismatchType,
    requiredAction: issue.requiredAction,
    resolutionNote: issue.resolutionNote ?? undefined,
    status: issue.status
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  await prisma.reconciliationIssue.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
