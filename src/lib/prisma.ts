import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL en el archivo .env");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

// Fast Refresh preserves globals, including clients generated for an older schema.
// Reuse the connection only while the generated data model still matches.
const development = process.env.NODE_ENV !== "production";
const cached = development && globalForPrisma.prisma instanceof PrismaClient
  ? globalForPrisma.prisma
  : undefined;
if (development && globalForPrisma.prisma && !cached)
  void globalForPrisma.prisma.$disconnect().catch(() => {});
export const prisma = cached ?? createClient();
if (development) {
  globalForPrisma.prisma = prisma;
}
