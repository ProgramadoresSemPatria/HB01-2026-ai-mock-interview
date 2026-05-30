import type { MessageRepository } from "@/modules/interview/repository/message-repository";
import type { SessionRepository } from "@/modules/interview/repository/session-repository";
import type {
  CreateSessionInput,
  InterviewLevel,
} from "@/modules/interview/validations/interview-schemas";
import type { ResumeRepository } from "@/modules/resumes/repository/resume-repository";
import { BadRequestError, NotFoundError } from "@/shared";

export type SessionSummary = {
  id: string;
  resumeId: string;
  level: InterviewLevel;
  turnCount: number;
  maxTurns: number;
  isFinished: boolean;
  createdAt: Date;
};

export type SessionMessage = {
  id: string;
  role: "human" | "ai";
  content: string;
  createdAt: Date;
};

export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly messageRepository: MessageRepository,
    private readonly resumeRepository: ResumeRepository,
  ) {}

  async createSession(
    userId: number,
    input: CreateSessionInput,
  ): Promise<{ id: string }> {
    const resume = await this.resumeRepository.findByIdAndUserId(
      input.resumeId,
      userId,
    );

    if (!resume) {
      throw new NotFoundError();
    }

    if (resume.status !== "ready") {
      const message =
        resume.status === "processing"
          ? "Resume is still being processed"
          : resume.status === "failed"
            ? "Resume processing failed"
            : "Resume is not ready for interview";
      throw new BadRequestError(message);
    }

    const session = await this.sessionRepository.create({
      userId,
      resumeId: input.resumeId,
      level: input.level,
    });

    return { id: session.id };
  }

  async listSessions(userId: number): Promise<SessionSummary[]> {
    const sessions = await this.sessionRepository.listByUserId(userId);
    return sessions.map((session) => ({
      id: session.id,
      resumeId: session.resumeId,
      level: session.level,
      turnCount: session.turnCount,
      maxTurns: session.maxTurns,
      isFinished: session.isFinished,
      createdAt: session.createdAt,
    }));
  }

  async getMessages(
    userId: number,
    sessionId: string,
  ): Promise<SessionMessage[]> {
    const session = await this.sessionRepository.findByIdAndUserId(
      sessionId,
      userId,
    );

    if (!session) {
      throw new NotFoundError();
    }

    const messages = await this.messageRepository.listBySessionId(sessionId);
    return messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    }));
  }
}
