import { env } from "@/config/env";
import { TokenUsageRepository } from "@/modules/token-usage/repository/token-usage-repository";
import { TokenUsageService } from "@/modules/token-usage/service/token-usage-service";

let tokenUsageService: TokenUsageService | undefined;

export function makeTokenUsageService(): TokenUsageService {
  if (!tokenUsageService) {
    tokenUsageService = new TokenUsageService(new TokenUsageRepository(), {
      enabled: env.TOKEN_LIMIT_ENABLED,
      monthlyMax: env.TOKEN_LIMIT_MONTHLY_MAX,
    });
  }

  return tokenUsageService;
}
