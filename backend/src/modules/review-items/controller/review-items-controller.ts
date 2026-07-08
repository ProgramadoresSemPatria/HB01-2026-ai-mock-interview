import type { ReviewItemsService } from "@/modules/review-items/service/review-items-service";
import type { PatchReviewItemInput } from "@/modules/review-items/validations/review-items-schemas";
import { listReviewItemsQuerySchema } from "@/modules/review-items/validations/review-items-schemas";
import type { Request, Response } from "express";
import { z } from "zod";

export class ReviewItemsController {
  constructor(private readonly reviewItemsService: ReviewItemsService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const queryResult = listReviewItemsQuerySchema.safeParse(req.query);

    if (!queryResult.success) {
      res.status(422).json({
        message: "Validation failed",
        errors: z.treeifyError(queryResult.error),
      });
      return;
    }

    const reviewItems = await this.reviewItemsService.listForUser(
      req.userId!,
      queryResult.data.status,
    );
    res.status(200).json({ reviewItems });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const { status } = req.body as PatchReviewItemInput;
    const item = await this.reviewItemsService.updateStatus(
      req.userId!,
      id,
      status,
    );
    res.status(200).json(item);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    await this.reviewItemsService.deleteForUser(req.userId!, id);
    res.status(204).send();
  };
}
