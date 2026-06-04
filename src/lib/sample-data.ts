import type { CatalogProduct } from "@/features/catalog/catalog-types";
import type { OrderStatus } from "@/features/orders/order-status";

export const sampleProducts: CatalogProduct[] = [
  { id: "ke-can-bang-1mm", name: "Ke can bang 1MM", unit: "bao", defaultPrice: 47000, packageRule: "30 kg / bao", aliases: [{ value: "kcb" }, { value: "1ly" }] },
  { id: "ke-can-bang-2mm", name: "Ke can bang 2MM", unit: "bao", defaultPrice: 47000, packageRule: "30 kg / bao", aliases: [{ value: "B04" }, { value: "2ly" }] },
  { id: "ke-can-bang-3mm", name: "Ke can bang 3MM", unit: "bao", defaultPrice: 47000, packageRule: "30 kg / bao", aliases: [{ value: "B03" }, { value: "3ly" }, { value: "ke 3 ly" }] },
  { id: "nem", name: "Nem", unit: "bao", defaultPrice: 35000, packageRule: "30 kg / bao", aliases: [{ value: "nem" }, { value: "nem 1 bao" }] },
  { id: "kim-siet-ke", name: "Kim siet ke", unit: "thung", defaultPrice: 25000, packageRule: "50 cai / thung", aliases: [{ value: "kim siet" }] },
  { id: "ke-chu-thap-5mm", name: "Ke chu thap 5MM", unit: "bao", defaultPrice: 85000, packageRule: "30 kg / bao", aliases: [{ value: "5ly" }] }
];

export type SampleCustomer = {
  id: string;
  name: string;
  phone: string;
  province: string;
  address: string;
  recentPriceNote: string;
};

export const sampleCustomers: SampleCustomer[] = [
  { id: "c01", name: "VLXD Minh Phat", phone: "0901 234 567", province: "Long An", address: "Ben Luc", recentPriceNote: "KCB 3MM gan nhat: 47K/bao" },
  { id: "c02", name: "Anh Hai Tho Lat", phone: "0918 888 122", province: "TP.HCM", address: "Binh Chanh", recentPriceNote: "Nem gan nhat: 35K/bao" },
  { id: "c03", name: "Kho Dai Loc", phone: "0933 456 789", province: "Tien Giang", address: "Cai Lay", recentPriceNote: "Ke chu thap 5MM: 85K/bao" }
];

export type SampleOrderCard = {
  id: string;
  kiotInvoiceCode: string;
  customer: string;
  phone: string;
  productSummary: string;
  total: number;
  codAmount: number;
  province: string;
  sendDate: string;
  driver?: string;
  warnings: string[];
  status: OrderStatus;
};

export const sampleOrders: SampleOrderCard[] = [
  {
    id: "ord-1",
    kiotInvoiceCode: "HD004066",
    customer: "VLXD Minh Phat",
    phone: "0901 234 567",
    productSummary: "B03 x 3 bao, Nem x 1 bao",
    total: 176000,
    codAmount: 176000,
    province: "Long An",
    sendDate: "2026-06-05",
    driver: "Tai xe Nam",
    warnings: [],
    status: "reserved"
  },
  {
    id: "ord-2",
    kiotInvoiceCode: "HD004071",
    customer: "Anh Hai Tho Lat",
    phone: "0918 888 122",
    productSummary: "B04 x 2 bao",
    total: 94000,
    codAmount: 0,
    province: "TP.HCM",
    sendDate: "2026-06-05",
    warnings: ["Cong no"],
    status: "packing"
  },
  {
    id: "ord-3",
    kiotInvoiceCode: "HD004082",
    customer: "Kho Dai Loc",
    phone: "0933 456 789",
    productSummary: "Ke chu thap 5MM x 4 bao",
    total: 340000,
    codAmount: 340000,
    province: "Tien Giang",
    sendDate: "2026-06-06",
    driver: "Nha xe Thanh Binh",
    warnings: ["Can doi soat gia"],
    status: "scheduled"
  }
];
