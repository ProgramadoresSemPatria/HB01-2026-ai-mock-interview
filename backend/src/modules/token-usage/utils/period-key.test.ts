import { describe, expect, it } from "vitest";

import { getCurrentPeriodKey } from "./period-key";

describe("getCurrentPeriodKey", () => {
  it("returns YYYY-MM in UTC", () => {
    expect(getCurrentPeriodKey(new Date("2026-07-15T12:00:00.000Z"))).toBe(
      "2026-07",
    );
  });

  it("rolls over to the next month at UTC boundary", () => {
    expect(getCurrentPeriodKey(new Date("2026-07-31T23:59:59.999Z"))).toBe(
      "2026-07",
    );
    expect(getCurrentPeriodKey(new Date("2026-08-01T00:00:00.000Z"))).toBe(
      "2026-08",
    );
  });
});
