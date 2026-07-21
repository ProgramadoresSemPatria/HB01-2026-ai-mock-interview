import type { TranscribeService } from "@/modules/transcribe/service/transcribe-service";
import type { Request, Response } from "express";

export class TranscribeController {
  constructor(private readonly transcribeService: TranscribeService) {}

  transcribe = async (req: Request, res: Response): Promise<void> => {
    const result = await this.transcribeService.transcribe(req.file);

    res.status(200).json({
      text: result.text,
      language_code: result.languageCode,
      language_confidence: result.languageConfidence,
    });
  };
}
