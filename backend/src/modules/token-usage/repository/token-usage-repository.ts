import prisma from "@/infrastructure/database";
import { getCurrentPeriodKey } from "@/modules/token-usage/utils/period-key";

export type TokenUsageRecord = {
  userId: number;
  periodKey: string;
  promptTokens: number;
  completionTokens: number;
};

export class TokenUsageRepository {
  async findByUserAndPeriod(
    userId: number,
    periodKey: string = getCurrentPeriodKey(),
  ): Promise<TokenUsageRecord | null> {
    const row = await prisma.userTokenUsage.findUnique({
      where: {
        userId_periodKey: { userId, periodKey },
      },
    });

    if (!row) {
      return null;
    }

    return {
      userId: row.userId,
      periodKey: row.periodKey,
      promptTokens: row.promptTokens,
      completionTokens: row.completionTokens,
    };
  }

  async incrementUsage(
    userId: number,
    promptTokens: number,
    completionTokens: number,
    periodKey: string = getCurrentPeriodKey(),
  ): Promise<TokenUsageRecord> {
    const row = await prisma.userTokenUsage.upsert({
      where: {
        userId_periodKey: { userId, periodKey },
      },
      create: {
        userId,
        periodKey,
        promptTokens,
        completionTokens,
      },
      update: {
        promptTokens: { increment: promptTokens },
        completionTokens: { increment: completionTokens },
      },
    });

    return {
      userId: row.userId,
      periodKey: row.periodKey,
      promptTokens: row.promptTokens,
      completionTokens: row.completionTokens,
    };
  }
}
