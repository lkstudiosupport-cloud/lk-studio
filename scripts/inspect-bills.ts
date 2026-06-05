import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  type Col = { name: string; type: string; notnull: number; dflt_value: string | null };
  const cols = await prisma.$queryRaw<Col[]>`PRAGMA table_info(Bill)`;
  console.log("Bill columns:", cols.map((c) => c.name).join(", "));

  try {
    const bills = await prisma.bill.findMany({ take: 5 });
    console.log("Bill count:", bills.length);
    console.log(JSON.stringify(bills, null, 2));
  } catch (e) {
    console.error("findMany failed:", e);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
