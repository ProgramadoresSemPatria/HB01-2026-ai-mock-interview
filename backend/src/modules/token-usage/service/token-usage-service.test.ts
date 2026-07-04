import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TokenUsageRepository } from "@/modules/token-usage/repository/token-usage-repository";
import { TokenUsageService } from "@/modules/token-usage/service/token-usage-service";
import { TokenLimitExceededError } from "@/shared";

describe("TokenUsageService", () => {
  let repository: TokenUsageRepository;
  let service: TokenUsageService;

  beforeEach(() => {
    repository = {
      findByUserAndPeriod: vi.fn(),
      incrementUsage: vi.fn(),
    } as unknown as TokenUsageRepository;

    service = new TokenUsageService(repository, {
      enabled: true,
      monthlyMax: 100,
    });
  });

  it("does not throw when usage is below the monthly max", async () => {
    vi.mocked(repository.findByUserAndPeriod).mockResolvedValue({
      userId: 1,
      periodKey: "2026-07",
      promptTokens: 40,
      completionTokens: 30,
    });

    await expect(service.assertWithinLimit(1)).resolves.toBeUndefined();
  });

  it("throws TokenLimitExceededError when usage is at the monthly max", async () => {
    vi.mocked(repository.findByUserAndPeriod).mockResolvedValue({
      userId: 1,
      periodKey: "2026-07",
      promptTokens: 60,
      completionTokens: 40,
    });

    await expect(service.assertWithinLimit(1)).rejects.toBeInstanceOf(
      TokenLimitExceededError,
    );
  });

  it("skips limit checks when disabled", async () => {
    service = new TokenUsageService(repository, {
      enabled: false,
      monthlyMax: 100,
    });

    vi.mocked(repository.findByUserAndPeriod).mockResolvedValue({
      userId: 1,
      periodKey: "2026-07",
      promptTokens: 100,
      completionTokens: 100,
    });

    await expect(service.assertWithinLimit(1)).resolves.toBeUndefined();
  });

  it("increments usage through the repository", async () => {
    vi.mocked(repository.incrementUsage).mockResolvedValue({
      userId: 1,
      periodKey: "2026-07",
      promptTokens: 25,
      completionTokens: 10,
    });
    vi.mocked(repository.findByUserAndPeriod).mockResolvedValue({
      userId: 1,
      periodKey: "2026-07",
      promptTokens: 25,
      completionTokens: 10,
    });

    await service.recordUsage(1, {
      promptTokens: 25,
      completionTokens: 10,
    });

    expect(repository.incrementUsage).toHaveBeenCalledWith(1, 25, 10);
  });
});
