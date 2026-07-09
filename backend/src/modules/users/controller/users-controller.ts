import type { UsersService } from "@/modules/users/service/users-service";
import type { UpdateInterviewLocaleInput } from "@/modules/users/validations/users-schemas";
import type { Request, Response } from "express";

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  updateInterviewLocale = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const { interviewLocale } = req.body as UpdateInterviewLocaleInput;
    const result = await this.usersService.updateInterviewLocale(
      req.userId!,
      interviewLocale,
    );
    res.status(200).json(result);
  };
}
