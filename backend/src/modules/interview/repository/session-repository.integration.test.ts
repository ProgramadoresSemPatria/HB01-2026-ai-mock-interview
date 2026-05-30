import { afterAll, afterEach, describe, expect, it } from "vitest";
import { disconnectDatabase, resetDatabase } from "@/test/integration/helpers";
import { UserRepository } from "@/modules/auth/repository/user-repository";
import { ResumeRepository } from "@/modules/resumes/repository/resume-repository";
import {
  MAX_TURNS_BY_LEVEL,
  SessionRepository,
} from "./session-repository";

describe("SessionRepository (integration)", () => {
  const userRepository = new UserRepository();
  const resumeRepository = new ResumeRepository();
  const repository = new SessionRepository();

  async function seedUserAndResume() {
    const user = await userRepository.create({
      name: "Session Owner",
      email: `session-owner-${crypto.randomUUID()}@example.com`,
      password: "$2b$10$hashedpasswordplaceholderfortests",
    });
    const resumeId = crypto.randomUUID();
    await resumeRepository.createProcessing(
      user.id,
      "CV.pdf",
      "pdf-url",
      "storage-key",
      resumeId,
    );
    return { user, resumeId };
  }

  afterEach(() => resetDatabase());
  afterAll(() => disconnectDatabase());

  it.each([
    ["entry", 5],
    ["mid", 7],
    ["senior", 8],
  ] as const)("create sets maxTurns to %i for level %s", async (level, maxTurns) => {
    const { user, resumeId } = await seedUserAndResume();

    const session = await repository.create({
      userId: user.id,
      resumeId,
      level,
    });

    expect(session).toMatchObject({
      userId: user.id,
      resumeId,
      level,
      maxTurns,
      turnCount: 0,
      isFinished: false,
    });
    expect(session.maxTurns).toBe(MAX_TURNS_BY_LEVEL[level]);
  });

  it("listByUserId returns sessions for the user ordered by createdAt desc", async () => {
    const { user, resumeId } = await seedUserAndResume();

    const older = await repository.create({
      userId: user.id,
      resumeId,
      level: "entry",
    });
    await new Promise((resolve) => setTimeout(resolve, 15));
    const newer = await repository.create({
      userId: user.id,
      resumeId,
      level: "mid",
    });

    const sessions = await repository.listByUserId(user.id);

    expect(sessions).toHaveLength(2);
    expect(sessions[0]?.id).toBe(newer.id);
    expect(sessions[1]?.id).toBe(older.id);
  });

  it("findByIdAndUserId returns session when owned by user", async () => {
    const { user, resumeId } = await seedUserAndResume();

    const created = await repository.create({
      userId: user.id,
      resumeId,
      level: "entry",
    });

    const found = await repository.findByIdAndUserId(created.id, user.id);

    expect(found).toMatchObject({
      id: created.id,
      userId: user.id,
      resumeId,
      level: "entry",
    });
  });

  it("findByIdAndUserId returns null for another user", async () => {
    const { user, resumeId } = await seedUserAndResume();
    const other = await userRepository.create({
      name: "Other User",
      email: `other-${crypto.randomUUID()}@example.com`,
      password: "$2b$10$hashedpasswordplaceholderfortests",
    });

    const created = await repository.create({
      userId: user.id,
      resumeId,
      level: "entry",
    });

    const found = await repository.findByIdAndUserId(created.id, other.id);

    expect(found).toBeNull();
  });

  it("incrementTurnCount", async () => {
    const { user, resumeId } = await seedUserAndResume();

    const created = await repository.create({
      userId: user.id,
      resumeId,
      level: "entry",
    });
    expect(created.turnCount).toBe(0);

    const updated = await repository.incrementTurnCount(created.id);

    expect(updated.turnCount).toBe(1);
  });

  it("markFinished", async () => {
    const { user, resumeId } = await seedUserAndResume();

    const created = await repository.create({
      userId: user.id,
      resumeId,
      level: "entry",
    });
    expect(created.isFinished).toBe(false);

    const updated = await repository.markFinished(created.id);

    expect(updated.isFinished).toBe(true);
  });
});
