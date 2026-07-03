import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Express } from "express";

import { createApp } from "@/config/app";
import * as databaseHealth from "@/infrastructure/database/health";
import prisma from "@/infrastructure/database";
import * as redisHealth from "@/infrastructure/queue/redis-health";

describe("Health API E2E", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 200 on liveness endpoint without checking dependencies", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("returns 200 on readiness endpoint when database and redis are healthy", async () => {
    const response = await request(app).get("/health/ready");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      checks: {
        database: "ok",
        redis: "ok",
      },
    });
  });

  it("returns 503 on readiness endpoint when database check fails", async () => {
    const pingDatabaseSpy = vi
      .spyOn(databaseHealth, "pingDatabase")
      .mockRejectedValueOnce(new Error("database unavailable"));

    const response = await request(app).get("/health/ready");

    pingDatabaseSpy.mockRestore();

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: "error",
      checks: {
        database: "error",
        redis: "ok",
      },
    });
  });

  it("returns 503 on readiness endpoint when redis check fails", async () => {
    const pingRedisSpy = vi
      .spyOn(redisHealth, "pingRedis")
      .mockRejectedValueOnce(new Error("redis unavailable"));

    const response = await request(app).get("/health/ready");

    pingRedisSpy.mockRestore();

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: "error",
      checks: {
        database: "ok",
        redis: "error",
      },
    });
  });
});
