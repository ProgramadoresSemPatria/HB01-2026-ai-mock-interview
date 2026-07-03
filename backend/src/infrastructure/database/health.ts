import { prisma } from "./index";

export async function pingDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
