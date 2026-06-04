import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  { sku: "KCB-1MM", name: "Ke cân bằng 1MM", unit: "bao", price: 47000, packageRule: "30 kg / bao", aliases: ["kcb", "1ly", "ke 1 ly"] },
  { sku: "KCB-1-5MM", name: "Ke cân bằng 1.5MM", unit: "bao", price: 47000, packageRule: "30 kg / bao", aliases: ["1.5ly", "ke 1.5 ly"] },
  { sku: "KCB-2MM", name: "Ke cân bằng 2MM", unit: "bao", price: 47000, packageRule: "30 kg / bao", aliases: ["B04", "2ly", "ke 2 ly"] },
  { sku: "KCB-3MM", name: "Ke cân bằng 3MM", unit: "bao", price: 47000, packageRule: "30 kg / bao", aliases: ["B03", "3ly", "ke 3 ly"] },
  { sku: "NEM", name: "Nêm", unit: "bao", price: 35000, packageRule: "30 kg / bao", aliases: ["nem", "nêm", "nem 1 bao"] },
  { sku: "KSK", name: "Kìm siết ke", unit: "thùng", price: 25000, packageRule: "50 cái / thùng", aliases: ["kìm siết", "kim siet"] },
  { sku: "KCT-1MM", name: "Ke chữ thập 1MM", unit: "bao", price: 85000, packageRule: "30 kg / bao", aliases: ["chữ thập 1ly"] },
  { sku: "KCT-1-5MM", name: "Ke chữ thập 1.5MM", unit: "bao", price: 85000, packageRule: "30 kg / bao", aliases: ["chữ thập 1.5ly"] },
  { sku: "KCT-2MM", name: "Ke chữ thập 2MM", unit: "bao", price: 85000, packageRule: "30 kg / bao", aliases: ["chữ thập 2ly"] },
  { sku: "KCT-3MM", name: "Ke chữ thập 3MM", unit: "bao", price: 85000, packageRule: "30 kg / bao", aliases: ["chữ thập 3ly"] },
  { sku: "KCT-5MM", name: "Ke chữ thập 5MM", unit: "bao", price: 85000, packageRule: "30 kg / bao", aliases: ["5ly", "chữ thập 5ly"] },
  { sku: "KVX-1MM", name: "Ke vít xoáy 1MM", unit: "thùng", price: 35000, packageRule: "60 túi / thùng - 1 túi 50 cái", aliases: ["vít xoáy 1ly", "vit xoay 1ly"] },
  { sku: "KVX-1-5MM", name: "Ke vít xoáy 1.5MM", unit: "thùng", price: 35000, packageRule: "60 túi / thùng - 1 túi 50 cái", aliases: ["vít xoáy 1.5ly", "vit xoay 1.5ly"] },
  { sku: "NTXM", name: "Nước tẩy xi măng", unit: "can", price: 40000, packageRule: "12 can / 1 thùng 1.7 lít", aliases: ["nước tẩy", "tay xi mang"] },
  { sku: "BONBOND", name: "Keo 2 thành phần BONBOND (hàng công nghệ Thái)", unit: "cái", price: 60000, packageRule: "30 cái / thùng", aliases: ["bonbond"] },
  { sku: "EPOXY-CAT", name: "Keo 2 thành phần EPOXY CAT", unit: "cái", price: 70000, packageRule: "30 cái / thùng", aliases: ["epoxy cat"] },
  { sku: "SUNG-EPOXY", name: "Súng bắn keo EPOXY", unit: "cái", price: 70000, packageRule: "30 cái / thùng", aliases: ["súng epoxy", "sung epoxy"] },
  { sku: "BIRON-RE", name: "Bộ biron rẻ", unit: "bộ", price: 20000, packageRule: null, aliases: ["biron rẻ"] },
  { sku: "BIRON-DAT", name: "Bộ biron đắt", unit: "bộ", price: 35000, packageRule: null, aliases: ["biron đắt"] },
  { sku: "RACH-MACH", name: "Rạch mạch", unit: "cái", price: 10000, packageRule: null, aliases: ["rạch mạch"] },
  { sku: "SUI", name: "Sủi", unit: "cái", price: 20000, packageRule: null, aliases: ["sủi", "sui"] },
  { sku: "KICH-GACH", name: "Kích gạch", unit: "cái", price: 30000, packageRule: "40 cái / thùng", aliases: ["kích gạch"] },
  { sku: "BAN-KEO-RANG-CUA", name: "Bàn kéo răng cưa", unit: "cái", price: 90000, packageRule: null, aliases: ["bàn kéo"] },
  { sku: "BAY-RANG-CUA", name: "Bay răng cưa", unit: "cái", price: 45000, packageRule: null, aliases: ["bay"] },
  { sku: "MU-CHIET-MACH", name: "Mủ chiết mạch", unit: "cái", price: 12000, packageRule: null, aliases: ["mủ chiết mạch"] }
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        unit: product.unit,
        defaultPrice: product.price,
        packageRule: product.packageRule,
        aliases: {
          deleteMany: {},
          create: product.aliases.map((value) => ({ value }))
        }
      },
      create: {
        sku: product.sku,
        name: product.name,
        unit: product.unit,
        defaultPrice: product.price,
        packageRule: product.packageRule,
        aliases: {
          create: product.aliases.map((value) => ({ value }))
        }
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
