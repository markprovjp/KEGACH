import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  { sku: "KCB-1MM", name: "Ke can bang 1MM", price: 47000, packageRule: "30 kg / bao", aliases: ["kcb", "1ly", "ke 1 ly"] },
  { sku: "KCB-1-5MM", name: "Ke can bang 1.5MM", price: 47000, packageRule: "30 kg / bao", aliases: ["1.5ly", "ke 1.5 ly"] },
  { sku: "KCB-2MM", name: "Ke can bang 2MM", price: 47000, packageRule: "30 kg / bao", aliases: ["B04", "2ly", "ke 2 ly"] },
  { sku: "KCB-3MM", name: "Ke can bang 3MM", price: 47000, packageRule: "30 kg / bao", aliases: ["B03", "3ly", "ke 3 ly"] },
  { sku: "NEM", name: "Nem", price: 35000, packageRule: "30 kg / bao", aliases: ["nem", "nem 1 bao"] },
  { sku: "KSK", name: "Kim siet ke", price: 25000, packageRule: "50 cai / thung", aliases: ["kim siet", "kim siet ke"] },
  { sku: "KCT-1MM", name: "Ke chu thap 1MM", price: 85000, packageRule: "30 kg / bao", aliases: ["chu thap 1ly"] },
  { sku: "KCT-1-5MM", name: "Ke chu thap 1.5MM", price: 85000, packageRule: "30 kg / bao", aliases: ["chu thap 1.5ly"] },
  { sku: "KCT-2MM", name: "Ke chu thap 2MM", price: 85000, packageRule: "30 kg / bao", aliases: ["chu thap 2ly"] },
  { sku: "KCT-3MM", name: "Ke chu thap 3MM", price: 85000, packageRule: "30 kg / bao", aliases: ["chu thap 3ly"] },
  { sku: "KCT-5MM", name: "Ke chu thap 5MM", price: 85000, packageRule: "30 kg / bao", aliases: ["5ly", "chu thap 5ly"] },
  { sku: "KVX-1MM", name: "Ke vit xoay 1MM", price: 35000, packageRule: "60 tui / thung, 1 tui 50 cai", aliases: ["vit xoay 1ly"] },
  { sku: "KVX-1-5MM", name: "Ke vit xoay 1.5MM", price: 35000, packageRule: "60 tui / thung, 1 tui 50 cai", aliases: ["vit xoay 1.5ly"] },
  { sku: "NTXM", name: "Nuoc tay xi mang", price: 40000, packageRule: "12 can / thung, 1.7 lit", aliases: ["nuoc tay", "tay xi mang"] },
  { sku: "BONBOND", name: "Keo 2 thanh phan BONBOND", price: 60000, packageRule: "30 cai / thung", aliases: ["bonbond"] },
  { sku: "EPOXY-CAT", name: "Keo 2 thanh phan EPOXY CAT", price: 70000, packageRule: "30 cai / thung", aliases: ["epoxy cat"] },
  { sku: "SUNG-EPOXY", name: "Sung ban keo EPOXY", price: 70000, packageRule: "30 cai / thung", aliases: ["sung epoxy"] },
  { sku: "BIRON-RE", name: "Bo biron re", price: 20000, packageRule: null, aliases: ["biron re"] },
  { sku: "BIRON-DAT", name: "Bo biron dat", price: 35000, packageRule: null, aliases: ["biron dat"] },
  { sku: "RACH-MACH", name: "Rach mach", price: 10000, packageRule: null, aliases: ["rach mach"] },
  { sku: "SUI", name: "Sui", price: 20000, packageRule: null, aliases: ["sui"] },
  { sku: "KICH-GACH", name: "Kich gach", price: 30000, packageRule: "40 cai / thung", aliases: ["kich gach"] },
  { sku: "BAN-KEO-RANG-CUA", name: "Ban keo rang cua", price: 90000, packageRule: null, aliases: ["ban keo"] },
  { sku: "BAY-RANG-CUA", name: "Bay rang cua", price: 45000, packageRule: null, aliases: ["bay"] },
  { sku: "MU-CHIET-MACH", name: "Mu chiet mach", price: 12000, packageRule: null, aliases: ["mu chiet mach"] }
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        unit: "bao",
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
        unit: "bao",
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
