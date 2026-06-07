import type { CatalogProduct } from "@/features/catalog/catalog-types";
import type { OrderStatus } from "@/features/orders/order-status";

export const sampleProducts: CatalogProduct[] = [
  { id: "ke-can-bang-1mm", name: "Ke cân bằng 1MM", unit: "bao", defaultPrice: 47000, packageRule: "30 kg / bao", aliases: [{ value: "kcb" }, { value: "1ly" }, { value: "ke 1 ly" }] },
  { id: "ke-can-bang-1-5mm", name: "Ke cân bằng 1.5MM", unit: "bao", defaultPrice: 47000, packageRule: "30 kg / bao", aliases: [{ value: "1.5ly" }, { value: "ke 1.5 ly" }] },
  { id: "ke-can-bang-2mm", name: "Ke cân bằng 2MM", unit: "bao", defaultPrice: 47000, packageRule: "30 kg / bao", aliases: [{ value: "B04" }, { value: "2ly" }, { value: "ke 2 ly" }] },
  { id: "ke-can-bang-3mm", name: "Ke cân bằng 3MM", unit: "bao", defaultPrice: 47000, packageRule: "30 kg / bao", aliases: [{ value: "B03" }, { value: "3ly" }, { value: "ke 3 ly" }] },
  { id: "nem", name: "Nêm", unit: "bao", defaultPrice: 35000, packageRule: "30 kg / bao", aliases: [{ value: "nem" }, { value: "nêm" }, { value: "nem 1 bao" }] },
  { id: "nem-roi", name: "Nêm rời", unit: "kg", defaultPrice: 0, packageRule: "Nguyên liệu rời để đóng bao", weightPerUnitKg: 1, aliases: [{ value: "nêm rời" }, { value: "nem roi" }] },
  { id: "tui-bong-dong-nem", name: "Túi bóng đóng nêm", unit: "kg", defaultPrice: 0, packageRule: "Túi bóng xuất dùng theo kg", weightPerUnitKg: 1, aliases: [{ value: "túi bóng" }, { value: "tui bong" }] },
  { id: "kim-siet-ke", name: "Kìm siết ke", unit: "thùng", defaultPrice: 25000, packageRule: "50 cái / thùng", aliases: [{ value: "kìm siết" }, { value: "kim siet" }] },
  { id: "ke-chu-thap-1mm", name: "Ke chữ thập 1MM", unit: "bao", defaultPrice: 85000, packageRule: "30 kg / bao", aliases: [{ value: "chữ thập 1ly" }] },
  { id: "ke-chu-thap-1-5mm", name: "Ke chữ thập 1.5MM", unit: "bao", defaultPrice: 85000, packageRule: "30 kg / bao", aliases: [{ value: "chữ thập 1.5ly" }] },
  { id: "ke-chu-thap-2mm", name: "Ke chữ thập 2MM", unit: "bao", defaultPrice: 85000, packageRule: "30 kg / bao", aliases: [{ value: "chữ thập 2ly" }] },
  { id: "ke-chu-thap-3mm", name: "Ke chữ thập 3MM", unit: "bao", defaultPrice: 85000, packageRule: "30 kg / bao", aliases: [{ value: "chữ thập 3ly" }] },
  { id: "ke-chu-thap-5mm", name: "Ke chữ thập 5MM", unit: "bao", defaultPrice: 85000, packageRule: "30 kg / bao", aliases: [{ value: "5ly" }, { value: "chữ thập 5ly" }] },
  { id: "ke-vit-xoay-1mm", name: "Ke vít xoáy 1MM", unit: "thùng", defaultPrice: 35000, packageRule: "60 túi / thùng - 1 túi 50 cái", aliases: [{ value: "vít xoáy 1ly" }, { value: "vit xoay 1ly" }] },
  { id: "ke-vit-xoay-1-5mm", name: "Ke vít xoáy 1.5MM", unit: "thùng", defaultPrice: 35000, packageRule: "60 túi / thùng - 1 túi 50 cái", aliases: [{ value: "vít xoáy 1.5ly" }, { value: "vit xoay 1.5ly" }] },
  { id: "nuoc-tay-xi-mang", name: "Nước tẩy xi măng", unit: "can", defaultPrice: 40000, packageRule: "12 can / 1 thùng 1.7 lít", aliases: [{ value: "nước tẩy" }, { value: "tay xi mang" }] },
  { id: "keo-bonbond", name: "Keo 2 thành phần BONBOND (hàng công nghệ Thái)", unit: "cái", defaultPrice: 60000, packageRule: "30 cái / thùng", aliases: [{ value: "bonbond" }] },
  { id: "keo-epoxy-cat", name: "Keo 2 thành phần EPOXY CAT", unit: "cái", defaultPrice: 70000, packageRule: "30 cái / thùng", aliases: [{ value: "epoxy cat" }] },
  { id: "sung-ban-keo-epoxy", name: "Súng bắn keo EPOXY", unit: "cái", defaultPrice: 70000, packageRule: "30 cái / thùng", aliases: [{ value: "súng epoxy" }, { value: "sung epoxy" }] },
  { id: "bo-biron-re", name: "Bộ biron rẻ", unit: "bộ", defaultPrice: 20000, packageRule: undefined, aliases: [{ value: "biron rẻ" }] },
  { id: "bo-biron-dat", name: "Bộ biron đắt", unit: "bộ", defaultPrice: 35000, packageRule: undefined, aliases: [{ value: "biron đắt" }] },
  { id: "rach-mach", name: "Rạch mạch", unit: "cái", defaultPrice: 10000, packageRule: undefined, aliases: [{ value: "rạch mạch" }] },
  { id: "sui", name: "Sủi", unit: "cái", defaultPrice: 20000, packageRule: undefined, aliases: [{ value: "sủi" }, { value: "sui" }] },
  { id: "kich-gach", name: "Kích gạch", unit: "cái", defaultPrice: 30000, packageRule: "40 cái / thùng", aliases: [{ value: "kích gạch" }] },
  { id: "ban-keo-rang-cua", name: "Bàn kéo răng cưa", unit: "cái", defaultPrice: 90000, packageRule: undefined, aliases: [{ value: "bàn kéo" }] },
  { id: "bay-rang-cua", name: "Bay răng cưa", unit: "cái", defaultPrice: 45000, packageRule: undefined, aliases: [{ value: "bay" }] },
  { id: "mu-chiet-mach", name: "Mủ chiết mạch", unit: "cái", defaultPrice: 12000, packageRule: undefined, weightPerUnitKg: 1, aliases: [{ value: "mủ chiết mạch" }] },
  { id: "sung-dien-full-bo", name: "Súng điện full bộ", unit: "bộ", defaultPrice: 1300000, packageRule: "1 bộ", weightPerUnitKg: 5, aliases: [{ value: "súng điện" }, { value: "sung dien" }, { value: "súng điện full bộ" }] },
  { id: "ke-can-bang-1mm-roi", name: "Ke cân bằng 1MM rời", unit: "kg", defaultPrice: 0, packageRule: "Nguyên liệu rời để đóng bao", weightPerUnitKg: 1, aliases: [{ value: "ke 1mm rời" }, { value: "ke 1 ly roi" }] },
  { id: "tui-bong-ke-can-bang-1mm", name: "Túi bóng Ke cân bằng 1MM", unit: "kg", defaultPrice: 0, packageRule: "Túi bóng xuất dùng theo kg", weightPerUnitKg: 1, aliases: [{ value: "túi bóng ke 1mm" }, { value: "tui bong ke 1 ly" }] },
  { id: "ke-can-bang-1-5mm-roi", name: "Ke cân bằng 1.5MM rời", unit: "kg", defaultPrice: 0, packageRule: "Nguyên liệu rời để đóng bao", weightPerUnitKg: 1, aliases: [{ value: "ke 1.5mm rời" }, { value: "ke 1.5 ly roi" }] },
  { id: "tui-bong-ke-can-bang-1-5mm", name: "Túi bóng Ke cân bằng 1.5MM", unit: "kg", defaultPrice: 0, packageRule: "Túi bóng xuất dùng theo kg", weightPerUnitKg: 1, aliases: [{ value: "túi bóng ke 1.5mm" }, { value: "tui bong ke 1.5 ly" }] },
  { id: "ke-can-bang-2mm-roi", name: "Ke cân bằng 2MM rời", unit: "kg", defaultPrice: 0, packageRule: "Nguyên liệu rời để đóng bao", weightPerUnitKg: 1, aliases: [{ value: "ke 2mm rời" }, { value: "ke 2 ly roi" }] },
  { id: "tui-bong-ke-can-bang-2mm", name: "Túi bóng Ke cân bằng 2MM", unit: "kg", defaultPrice: 0, packageRule: "Túi bóng xuất dùng theo kg", weightPerUnitKg: 1, aliases: [{ value: "túi bóng ke 2mm" }, { value: "tui bong ke 2 ly" }] },
  { id: "ke-can-bang-3mm-roi", name: "Ke cân bằng 3MM rời", unit: "kg", defaultPrice: 0, packageRule: "Nguyên liệu rời để đóng bao", weightPerUnitKg: 1, aliases: [{ value: "ke 3mm rời" }, { value: "ke 3 ly roi" }] },
  { id: "tui-bong-ke-can-bang-3mm", name: "Túi bóng Ke cân bằng 3MM", unit: "kg", defaultPrice: 0, packageRule: "Túi bóng xuất dùng theo kg", weightPerUnitKg: 1, aliases: [{ value: "túi bóng ke 3mm" }, { value: "tui bong ke 3 ly" }] }
];

export type ProductVariantSeed = {
  productId: string;
  code: string;
  cartonCount: number;
  tubeCount: number;
};

export const productVariantSeeds: ProductVariantSeed[] = [
  { productId: "keo-bonbond", code: "01", cartonCount: 0, tubeCount: 0 },
  { productId: "keo-bonbond", code: "02", cartonCount: 0, tubeCount: 8 },
  { productId: "keo-bonbond", code: "03", cartonCount: 35, tubeCount: 0 },
  { productId: "keo-bonbond", code: "04", cartonCount: 26, tubeCount: 9 },
  { productId: "keo-bonbond", code: "05", cartonCount: 36, tubeCount: 1 },
  { productId: "keo-bonbond", code: "06", cartonCount: 10, tubeCount: 16 },
  { productId: "keo-bonbond", code: "07", cartonCount: 0, tubeCount: 0 },
  { productId: "keo-bonbond", code: "08", cartonCount: 3, tubeCount: 1 },
  { productId: "keo-bonbond", code: "09", cartonCount: 0, tubeCount: 18 },
  { productId: "keo-bonbond", code: "10", cartonCount: 10, tubeCount: 0 },
  { productId: "keo-bonbond", code: "11", cartonCount: 5, tubeCount: 3 },
  { productId: "keo-bonbond", code: "12", cartonCount: 17, tubeCount: 29 },
  { productId: "keo-epoxy-cat", code: "01", cartonCount: 46, tubeCount: 25 },
  { productId: "keo-epoxy-cat", code: "02", cartonCount: 9, tubeCount: 24 },
  { productId: "keo-epoxy-cat", code: "03", cartonCount: 15, tubeCount: 21 },
  { productId: "keo-epoxy-cat", code: "04", cartonCount: 11, tubeCount: 15 },
  { productId: "keo-epoxy-cat", code: "05", cartonCount: 11, tubeCount: 5 },
  { productId: "keo-epoxy-cat", code: "06", cartonCount: 7, tubeCount: 12 },
  { productId: "keo-epoxy-cat", code: "07", cartonCount: 3, tubeCount: 12 },
  { productId: "keo-epoxy-cat", code: "08", cartonCount: 16, tubeCount: 19 },
  { productId: "keo-epoxy-cat", code: "09", cartonCount: 32, tubeCount: 17 },
  { productId: "keo-epoxy-cat", code: "10", cartonCount: 28, tubeCount: 3 },
  { productId: "keo-epoxy-cat", code: "11", cartonCount: 19, tubeCount: 20 },
  { productId: "keo-epoxy-cat", code: "12", cartonCount: 9, tubeCount: 12 }
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
  { id: "c01", name: "VLXD Minh Phát", phone: "0901 234 567", province: "Long An", address: "Bến Lức", recentPriceNote: "Ke cân bằng 3MM gần nhất: 47K/bao" },
  { id: "c02", name: "Anh Hải thợ lát", phone: "0918 888 122", province: "TP.HCM", address: "Bình Chánh", recentPriceNote: "Nêm gần nhất: 35K/bao" },
  { id: "c03", name: "Kho Đại Lộc", phone: "0933 456 789", province: "Tiền Giang", address: "Cai Lậy", recentPriceNote: "Ke chữ thập 5MM: 85K/bao" }
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
  { id: "ord-1", kiotInvoiceCode: "HD004066", customer: "VLXD Minh Phát", phone: "0901 234 567", productSummary: "B03 x 3 bao, Nêm x 1 bao", total: 176000, codAmount: 176000, province: "Long An", sendDate: "2026-06-05", driver: "Anh Ngọc", warnings: [], status: "reserved" },
  { id: "ord-2", kiotInvoiceCode: "HD004071", customer: "Anh Hải thợ lát", phone: "0918 888 122", productSummary: "B04 x 2 bao", total: 94000, codAmount: 0, province: "TP.HCM", sendDate: "2026-06-05", warnings: ["Công nợ"], status: "packing" },
  { id: "ord-3", kiotInvoiceCode: "HD004082", customer: "Kho Đại Lộc", phone: "0933 456 789", productSummary: "Ke chữ thập 5MM x 4 bao", total: 340000, codAmount: 340000, province: "Tiền Giang", sendDate: "2026-06-06", driver: "Xe Hòa Phát", warnings: ["Cần đối soát giá"], status: "scheduled" },
  { id: "ord-4", kiotInvoiceCode: "HD004091", customer: "Cửa hàng Thành Công", phone: "0977 222 111", productSummary: "Nước tẩy xi măng x 6 can", total: 240000, codAmount: 240000, province: "Thanh Hóa", sendDate: "2026-06-06", driver: "Xe anh Thông", warnings: [], status: "waiting_vehicle" },
  { id: "ord-5", kiotInvoiceCode: "HD004099", customer: "Đại lý Phú Thọ", phone: "0988 555 666", productSummary: "Ke vít xoáy 1.5MM x 2 thùng", total: 70000, codAmount: 0, province: "Phú Thọ", sendDate: "2026-06-07", driver: "Xe Tân Hoa", warnings: ["Gửi nhà xe"], status: "shipped" }
];

export type InventoryRowSeed = {
  key: string;
  productId: string;
  product: string;
  unit: string;
  onHand: number;
  reserved: number;
  lowStockThreshold: number;
  lastMovement: string;
};

export const inventorySeeds: InventoryRowSeed[] = sampleProducts.map((product, index) => ({
  key: product.id,
  productId: product.id,
  product: product.name,
  unit: product.unit,
  onHand: [120, 84, 96, 64, 24, 0, 0, 16, 52, 44, 38, 33, 28, 18, 22, 36, 30, 27, 11, 14, 12, 40, 33, 20, 9, 15, 10, 2, 0, 0, 0, 0, 0, 0, 0, 0][index] ?? 20,
  reserved: [18, 8, 12, 9, 12, 0, 0, 3, 5, 4, 2, 6, 8, 2, 1, 6, 4, 3, 1, 0, 0, 3, 4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0][index] ?? 0,
  lowStockThreshold: [40, 40, 40, 40, 20, 50, 10, 8, 25, 25, 25, 25, 25, 12, 12, 18, 10, 10, 5, 5, 5, 8, 8, 8, 5, 5, 5, 1, 50, 10, 50, 10, 50, 10, 50, 10][index] ?? 5,
  lastMovement: index % 3 === 0 ? "giữ hàng HD004066" : index % 3 === 1 ? "nhập mua" : "xuất giao HD004082"
}));

export type CarrierSeed = {
  id: string;
  name: string;
  phone: string;
  route: string;
  note?: string;
};

export const carrierSeeds: CarrierSeed[] = [
  { id: "ghn", name: "Huy bưu điện (GHN)", phone: "0343207668", route: "Gửi GHN" },
  { id: "tan-tai", name: "Xe Tấn Tài", phone: "Sáng: 0971989565 (9H)\nChiều: 0971919565 (3H30)\n0984690685", route: "Thanh Hóa - Nam Định - Thái Bình - Hải Phòng; xe khách đi Thanh Hóa - Chí Linh Hải Dương tại cây xăng Đông Lĩnh" },
  { id: "tien-phuong", name: "Nhà xe Tiến Phương", phone: "0911501148", route: "Đi Trung Thái Nguyên" },
  { id: "anh-thong", name: "Xe anh Thông", phone: "0988813152 (7H)", route: "Thanh Hóa - Hà Nội; Thanh Hóa - Ninh Bình - Hà Nam - Hà Nội" },
  { id: "tuan-nga-hai", name: "Xe Tuấn Nga Hải", phone: "0942401279", route: "Thái Bình - Nam Định" },
  { id: "tri-hai-phong", name: "Xe Trí Hải Phòng", phone: "0934351985 (8H)", route: "Nam Định - Thái Bình - Hải Phòng" },
  { id: "khanh-mai", name: "Xe Khánh Mai", phone: "09493536643\n0942152217 (16H)", route: "Thái Bình - Nam Định - Hải Phòng" },
  { id: "quang-ninh", name: "Xe Quảng Ninh", phone: "0973600089", route: "Quảng Ninh" },
  { id: "tan-hoa", name: "Xe Tân Hoa", phone: "0912338023", route: "Gửi đi Phú Thọ" },
  { id: "cau-me", name: "Xe Cầu Mè", phone: "0913589055", route: "Hà Giang - Tuyên Quang" },
  { id: "hoang-ha", name: "Gửi Hoàng Hà", phone: "0916155952", route: "Đi Phú Thọ" },
  { id: "manh-tan", name: "Xe Mạnh Tân", phone: "0942819868", route: "Bá Thước - Lang Chánh" },
  { id: "tuy-dinh", name: "Xe Tùy Định", phone: "0962066683", route: "Sơn Tây - chạy Chương Mỹ" },
  { id: "chi-mai", name: "Xe chị Mai", phone: "0913384859 (10H30)", route: "Đi Nam Định" },
  { id: "tuyen-nam-dinh", name: "Xe tuyến Nam Định", phone: "0912334147 (14H30)", route: "Đi Nam Định" },
  { id: "hoa-phat", name: "Xe Hòa Phát", phone: "0837923999", route: "Thanh Hóa - Ninh Bình - Hà Nam - Hà Nội" },
  { id: "hiep-ga", name: "Xe Hiệp Gà", phone: "0949517111", route: "Đi Nghệ An" },
  { id: "van-nam", name: "Xe Vân Nam", phone: "0946732273", route: "Hà Nội - Phú Thọ" },
  { id: "hn-yen-bai", name: "Xe Hà Nội đi Yên Bái", phone: "0979911889", route: "Hà Nội - Yên Bái" },
  { id: "hn-da-nang", name: "Xe Hà Nội đi Đà Nẵng", phone: "0978591596", route: "Hà Nội - Đà Nẵng" },
  { id: "hn-quang-ngai", name: "Xe đi Hà Nội - Quảng Ngãi", phone: "0962521652", route: "Hà Nội - Quảng Ngãi" },
  { id: "hung-dung", name: "Xe Hùng Dung đi Nghệ An", phone: "0911315789", route: "Đi Nghệ An" },
  { id: "chi-phuong", name: "Chị Phượng bến xe phía Bắc", phone: "0919837574", route: "Bến xe phía Bắc" },
  { id: "ngoc-tien", name: "Xe Ngọc Tiến", phone: "0913020667 (10H30 bến xe phía Bắc)", route: "Thái Bình - Nam Định - Hải Dương - Hưng Yên - Hải Phòng" },
  { id: "viet-anh", name: "Xe tải Việt Anh đi Hải Dương", phone: "0923838969", route: "Hải Dương" },
  { id: "thien-hoa", name: "Xe Thiện Hoa", phone: "0964287885", route: "Đi Hà Trung" },
  { id: "sam-huong", name: "Xe Sâm Hương đi Huế", phone: "0914202374 (17H chiều)", route: "Bến xe phía Nam - Huế" },
  { id: "anh-ngoc", name: "Anh Ngọc", phone: "0989140526", route: "Ship trong thành phố", note: "Xe tải nhẹ" }
];

export const revenueByDay = [
  { label: "T2", value: 420000 },
  { label: "T3", value: 690000 },
  { label: "T4", value: 516000 },
  { label: "T5", value: 830000 },
  { label: "T6", value: 610000 },
  { label: "T7", value: 940000 }
];

export const orderStatusStats = [
  { label: "Giữ hàng", value: 7, color: "#1677ff" },
  { label: "Đóng hàng", value: 5, color: "#faad14" },
  { label: "Chờ xe", value: 4, color: "#13c2c2" },
  { label: "Đã gửi", value: 3, color: "#52c41a" },
  { label: "Có vấn đề", value: 2, color: "#ff4d4f" }
];
