import type { WeakAnswersService } from "@/modules/weak-answers/service/weak-answers-service";
import type { Request, Response } from "express";

export class WeakAnswersController {
  constructor(private readonly weakAnswersService: WeakAnswersService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const weakAnswers = await this.weakAnswersService.listForUser(
      req.userId!,
    );
    res.status(200).json({ weakAnswers });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    await this.weakAnswersService.deleteForUser(req.userId!, id);
    res.status(204).send();
  };
}
