import { formatMoney } from "@/lib/number-format";

export type PrintOrderLine = {
  productName?: string;
  unit?: string;
  quantity: number;
  note?: string;
};

export type PrintOrderInput = {
  code?: string;
  kiotInvoiceCode?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  carrierName?: string;
  driverName?: string;
  packageCount?: number;
  estimatedWeightKg?: number;
  codAmount?: number;
  freightPayer?: string;
  note?: string;
  lines?: PrintOrderLine[];
  productSummary?: string;
};

export function printPackingSlip(order: PrintOrderInput) {
  const rows = (order.lines ?? []).map((line, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(line.productName ?? "")}</td>
      <td>${escapeHtml(line.unit ?? "")}</td>
      <td>${formatNumber(line.quantity)}</td>
      <td></td>
    </tr>
  `).join("");

  openPrintWindow("Phiếu soạn hàng", `
    ${companyHeader()}
    <div class="title">PHIẾU SOẠN HÀNG</div>
    ${metaGrid(order)}
    <table>
      <thead><tr><th>STT</th><th>Tên hàng</th><th>ĐVT</th><th>Số lượng</th><th>Đã soạn</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="note"><b>Ghi chú:</b> ${escapeHtml(order.note ?? "")}</div>
    <div class="footer"><div>Người soạn hàng</div><div>Người kiểm hàng</div></div>
  `);
}

export function printCodHandoff(order: PrintOrderInput) {
  openPrintWindow("Phiếu gửi COD", `
    ${companyHeader()}
    <div class="title">PHIẾU GỬI COD</div>
    <div class="cod-box">
      <div><span>Người nhận</span><b>${escapeHtml(order.receiverName || order.customerName || "")}</b></div>
      <div><span>SĐT</span><b>${escapeHtml(order.receiverPhone || order.customerPhone || "")}</b></div>
      <div><span>Địa chỉ</span><b>${escapeHtml(order.receiverAddress || order.customerAddress || "")}</b></div>
      <div><span>Tiền COD</span><b>${formatMoney(order.codAmount ?? 0)}</b></div>
      <div><span>Số kiện</span><b>${formatNumber(order.packageCount ?? 0)}</b></div>
      <div><span>Khối lượng</span><b>${formatNumber(order.estimatedWeightKg ?? 0)} kg</b></div>
      <div><span>Cước</span><b>${order.freightPayer === "company" ? "Cơ sở trả" : "Khách trả"}</b></div>
      <div><span>Nhà xe/ĐVVC</span><b>${escapeHtml(order.carrierName ?? "")}</b></div>
    </div>
    <div class="section-title">Hàng gửi</div>
    <div class="summary">${escapeHtml(order.productSummary || order.lines?.map((line) => `${line.productName} x ${formatNumber(line.quantity)} ${line.unit ?? ""}`).join(", ") || "")}</div>
    <div class="note"><b>Ghi chú:</b> ${escapeHtml(order.note ?? "")}</div>
    <div class="footer"><div>Người gửi</div><div>Bưu điện/nhà xe nhận</div></div>
  `);
}

function companyHeader() {
  return `
    <div class="header">
      PHỤ KIỆN ỐP LÁT THANH HÓA<br />
      CƠ SỞ SẢN XUẤT NHỰA: LONG HẢI PLASTIC<br />
      Đ/C: Đông Lĩnh - Đông Sơn - Thanh Hóa<br />
      Điện thoại: 0393.393.188 / Zalo: 0393.393.188
    </div>
  `;
}

function metaGrid(order: PrintOrderInput) {
  return `
    <div class="meta">
      <div><b>Khách hàng:</b> ${escapeHtml(order.customerName ?? "")}</div>
      <div><b>SĐT:</b> ${escapeHtml(order.customerPhone ?? "")}</div>
      <div><b>Người nhận:</b> ${escapeHtml(order.receiverName || order.customerName || "")}</div>
      <div><b>SĐT nhận:</b> ${escapeHtml(order.receiverPhone || order.customerPhone || "")}</div>
      <div><b>Địa chỉ:</b> ${escapeHtml(order.receiverAddress || order.customerAddress || "-")}</div>
      <div><b>Nhà xe:</b> ${escapeHtml(order.carrierName ?? "-")}</div>
      <div><b>Số kiện:</b> ${formatNumber(order.packageCount ?? 0)}</div>
      <div><b>Khối lượng:</b> ${formatNumber(order.estimatedWeightKg ?? 0)} kg</div>
    </div>
  `;
}

function openPrintWindow(title: string, body: string) {
  const printWindow = window.open("", "_blank", "width=900,height=1100");
  if (!printWindow) throw new Error("Trình duyệt đang chặn cửa sổ in");
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: "Times New Roman", serif; color: #111; margin: 28px; }
          .header { text-align: center; font-weight: 700; line-height: 1.25; font-size: 20px; }
          .title { text-align: center; font-size: 24px; font-weight: 700; margin: 22px 0 12px; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 48px; font-size: 18px; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 18px; }
          th, td { border: 1px solid #444; padding: 8px; }
          th { font-weight: 700; }
          td:nth-child(1), td:nth-child(3), td:nth-child(4), td:nth-child(5) { text-align: center; }
          .cod-box { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; border: 2px solid #111; padding: 14px; font-size: 20px; }
          .cod-box div { display: grid; gap: 4px; }
          .cod-box span { color: #555; font-size: 14px; text-transform: uppercase; }
          .cod-box b { font-size: 22px; }
          .section-title { font-weight: 700; font-size: 18px; margin: 18px 0 6px; }
          .summary { border: 1px solid #444; padding: 10px; font-size: 18px; min-height: 60px; }
          .footer { display: grid; grid-template-columns: 1fr 1fr; margin-top: 46px; text-align: center; font-size: 18px; }
          .note { margin-top: 18px; white-space: pre-wrap; font-size: 16px; }
          @media print { body { margin: 18mm; } }
        </style>
      </head>
      <body>
        ${body}
        <script>window.onload = () => { window.print(); };</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function escapeHtml(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 3 });
}
