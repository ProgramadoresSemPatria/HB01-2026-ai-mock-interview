import type { ReviewItemsService } from "@/modules/review-items/service/review-items-service";
import type { NextFunction, Request, Response } from "express";

export class ReviewItemsController {
  constructor(private readonly reviewItemsService: ReviewItemsService) {}

  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const reviewItems = await this.reviewItemsService.listForUser(req.userId!);
      res.status(200).json({ reviewItems });
    } catch (error) {
      next(error);
    }
  };
}
