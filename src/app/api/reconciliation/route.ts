import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const issues = await prisma.reconciliationIssue.findMany({
    include: { order: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(issues.map((issue) => ({
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
  })));
}

export async function POST(request: Request) {
  const body = await request.json();
  const order = body.appOrderCode ? await prisma.order.findUnique({ where: { code: String(body.appOrderCode).trim() } }) : null;
  const issue = await prisma.reconciliationIssue.create({
    data: {
      orderId: order?.id,
      kiotInvoiceCode: String(body.kiotInvoiceCode || "").trim(),
      customerName: body.customer ? String(body.customer).trim() : null,
      mismatchType: String(body.mismatchType || "Thiếu thông tin"),
      requiredAction: String(body.requiredAction || "Kiểm tra lại"),
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
