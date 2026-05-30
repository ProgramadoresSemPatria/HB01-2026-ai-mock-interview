import type { SessionService } from "@/modules/interview/service/session-service";
import type { InterviewStreamService } from "@/modules/interview/service/stream-service";
import type {
  CreateSessionInput,
  StreamMessageInput,
} from "@/modules/interview/validations/interview-schemas";
import type { Request, Response } from "express";

export class InterviewController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly streamService: InterviewStreamService,
  ) {}

  createSession = async (req: Request, res: Response): Promise<void> => {
    const result = await this.sessionService.createSession(
      req.userId!,
      req.body as CreateSessionInput,
    );
    res.status(201).json(result);
  };

  listSessions = async (req: Request, res: Response): Promise<void> => {
    const sessions = await this.sessionService.listSessions(req.userId!);
    res.status(200).json({ sessions });
  };

  stream = async (req: Request, res: Response): Promise<void> => {
    const sessionId = String(req.params.sessionId);
    const { content } = req.body as StreamMessageInput;

    await this.streamService.streamTurn(req.userId!, sessionId, content, res);
  };

  getMessages = async (req: Request, res: Response): Promise<void> => {
    const sessionId = String(req.params.sessionId);
    const messages = await this.sessionService.getMessages(
      req.userId!,
      sessionId,
    );
    res.status(200).json({ messages });
  };
}
