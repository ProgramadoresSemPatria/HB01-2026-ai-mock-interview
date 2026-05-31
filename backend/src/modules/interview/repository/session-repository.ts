import prisma from "@/infrastructure/database";
import type {
  InterviewLevel,
  InterviewSession,
} from "../../../../prisma/generated/client";

export const MAX_TURNS_BY_LEVEL: Record<InterviewLevel, number> = {
  entry: 5,
  mid: 7,
  senior: 8,
};

export type CreateSessionParams = {
  userId: number;
  resumeId: string;
  level: InterviewLevel;
};

export class SessionRepository {
  async create(params: CreateSessionParams): Promise<InterviewSession> {
    const { userId, resumeId, level } = params;
    return prisma.interviewSession.create({
      data: {
        userId,
        resumeId,
        level,
        maxTurns: MAX_TURNS_BY_LEVEL[level],
      },
    });
  }

  async listByUserId(userId: number): Promise<InterviewSession[]> {
    return prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByIdAndUserId(
    id: string,
    userId: number,
  ): Promise<InterviewSession | null> {
    return prisma.interviewSession.findFirst({
      where: { id, userId },
    });
  }

  async incrementTurnCount(id: string): Promise<InterviewSession> {
    return prisma.interviewSession.update({
      where: { id },
      data: { turnCount: { increment: 1 } },
    });
  }

  async markFinished(id: string): Promise<InterviewSession> {
    return prisma.interviewSession.update({
      where: { id },
      data: { isFinished: true },
    });
  }

  async deleteByIdAndUserId(
    id: string,
    userId: number,
  ): Promise<InterviewSession | null> {
    const row = await prisma.interviewSession.findFirst({
      where: { id, userId },
    });
    if (!row) return null;

    await prisma.interviewSession.delete({
      where: { id },
    });
    return row;
  }
}
