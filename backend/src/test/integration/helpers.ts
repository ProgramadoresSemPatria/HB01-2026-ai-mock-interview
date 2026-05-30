import prisma from "@/infrastructure/database";
import { truncateTables } from "@/test/containers/truncate-tables";

export async function resetDatabase(): Promise<void> {
  await truncateTables();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
