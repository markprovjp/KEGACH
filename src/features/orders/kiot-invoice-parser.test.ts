import { describe, expect, it } from "vitest";
import { sampleProducts } from "@/lib/sample-data";
import { estimateOrderWeightKg, parseKiotInvoiceText } from "./kiot-invoice-parser";

const invoiceText = `HÓA ĐƠN BÁN HÀNG
Số hóa đơn: HD004066
Ngày 04 tháng 06 năm 2026
Khách hàng: anh hào hà nội
SĐT: 0964111081
Địa chỉ: -
Thanh toán:
STT
Mã hàng
Tên hàng
ĐVT
Số lượng
Đơn giá
Thành tiền
1
SP000022
b04
60
40,000
2,400,000
2
SP000021
b03
90
40,000
3,600,000
Tổng cộng:
150
6,000,000
Chiết khấu hóa đơn:
0
Tổng thanh toán:
6,000,000
Khách hàng thanh toán:
0
Còn lại:
6,000,000
Dư nợ trước:
6,500,000
Dư nợ sau hóa đơn:
12,500,000`;

describe("Kiot invoice parser", () => {
  it("extracts invoice header, money, and item lines", () => {
    const parsed = parseKiotInvoiceText(invoiceText, sampleProducts);

    expect(parsed.kiotInvoiceCode).toBe("HD004066");
    expect(parsed.invoiceDate).toBe("2026-06-04");
    expect(parsed.customerName).toBe("anh hào hà nội");
    expect(parsed.customerPhone).toBe("0964111081");
    expect(parsed.totalPayment).toBe(6000000);
    expect(parsed.previousDebt).toBe(6500000);
    expect(parsed.nextDebt).toBe(12500000);
    expect(parsed.lines).toEqual([
      expect.objectContaining({ rawName: "b04", quantity: 60, unitPrice: 40000, lineTotal: 2400000, productName: "Ke cân bằng 2MM" }),
      expect.objectContaining({ rawName: "b03", quantity: 90, unitPrice: 40000, lineTotal: 3600000, productName: "Ke cân bằng 3MM" })
    ]);
  });

  it("estimates shipment weight from package rules", () => {
    const parsed = parseKiotInvoiceText(invoiceText, sampleProducts);

    expect(estimateOrderWeightKg(parsed.lines, sampleProducts)).toBe(4500);
  });
});
