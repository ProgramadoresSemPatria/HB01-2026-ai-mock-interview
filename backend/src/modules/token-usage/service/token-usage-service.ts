import type { TokenUsageRepository } from "@/modules/token-usage/repository/token-usage-repository";
import type { LlmUsage } from "@/modules/token-usage/types/llm-usage";
import { getTotalTokens } from "@/modules/token-usage/types/llm-usage";
import { getCurrentPeriodKey } from "@/modules/token-usage/utils/period-key";
import { TokenLimitExceededError, logger } from "@/shared";

export type TokenUsageServiceConfig = {
  enabled: boolean;
  monthlyMax: number;
};

export type UserTokenUsageSnapshot = {
  periodKey: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export class TokenUsageService {
  constructor(
    private readonly repository: TokenUsageRepository,
    private readonly config: TokenUsageServiceConfig,
  ) {}

  async getUsage(userId: number): Promise<UserTokenUsageSnapshot> {
    const periodKey = getCurrentPeriodKey();
    const record = await this.repository.findByUserAndPeriod(userId, periodKey);

    const promptTokens = record?.promptTokens ?? 0;
    const completionTokens = record?.completionTokens ?? 0;

    return {
      periodKey,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    };
  }

  async assertWithinLimit(userId: number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const usage = await this.getUsage(userId);
    if (usage.totalTokens >= this.config.monthlyMax) {
      throw new TokenLimitExceededError();
    }
  }

  async recordUsage(userId: number, usage: LlmUsage | undefined): Promise<void> {
    if (!usage) {
      logger.warn("LLM usage metadata missing; token usage not recorded", {
        userId,
      });
      return;
    }

    const promptTokens = usage.promptTokens;
    const completionTokens = usage.completionTokens;

    if (promptTokens === 0 && completionTokens === 0) {
      logger.warn("LLM usage metadata is zero; token usage not recorded", {
        userId,
      });
      return;
    }

    await this.repository.incrementUsage(userId, promptTokens, completionTokens);

    if (!this.config.enabled) {
      return;
    }

    const updated = await this.getUsage(userId);
    if (updated.totalTokens > this.config.monthlyMax) {
      logger.warn("User exceeded monthly token limit after LLM call", {
        userId,
        totalTokens: updated.totalTokens,
        monthlyMax: this.config.monthlyMax,
      });
    } else if (getTotalTokens(usage) > 0) {
      logger.info("Token usage recorded", {
        userId,
        promptTokens,
        completionTokens,
        periodTotal: updated.totalTokens,
      });
    }
  }
}
