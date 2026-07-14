import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@estudiofisio.com").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Administrador",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });

  const unitNames = ["Unidade 1", "Unidade 2", "Unidade 3"];
  for (const name of unitNames) {
    const existing = await prisma.unit.findFirst({ where: { name } });
    if (!existing) {
      await prisma.unit.create({
        data: { name, address: "Endereço a definir" },
      });
    }
  }

  console.log("Seed concluído.");
  console.log(`Admin: ${admin.email} / senha: ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
