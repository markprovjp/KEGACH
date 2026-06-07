export function formatMoney(value: number): string {
  return `${Math.round(Number(value || 0)).toLocaleString("vi-VN")}đ`;
}

export function formatMoneyInput(value?: string | number): string {
  if (value === undefined || value === null || value === "") return "";
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseMoneyInput(value?: string): number {
  return Number(String(value ?? "").replace(/[^\d.-]/g, "").replace(/\./g, "")) || 0;
}

export function formatQuantityInput(value?: string | number): string {
  if (value === undefined || value === null || value === "") return "";
  return String(value).replace(".", ",");
}

export function parseQuantityInput(value?: string): number {
  const normalized = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  return Number(normalized.replace(/[^\d.-]/g, "")) || 0;
}
