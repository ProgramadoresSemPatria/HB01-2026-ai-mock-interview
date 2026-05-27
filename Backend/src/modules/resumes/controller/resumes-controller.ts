import type { ResumeService } from "@/modules/resumes/service/resume-service";
import { BadRequestError } from "@/shared";
import type { NextFunction, Request, Response } from "express";

export class ResumesController {
  constructor(private readonly resumeService: ResumeService) {}

  upload = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError("PDF file is required");
      }

      const preview = await this.resumeService.uploadPdf(req.userId!, req.file);
      res.status(201).json(preview);
    } catch (error) {
      next(error);
    }
  };

  getById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = String(req.params.id);
      const detail = await this.resumeService.getResume(req.userId!, id);
      res.status(200).json(detail);
    } catch (error) {
      next(error);
    }
  };
}
