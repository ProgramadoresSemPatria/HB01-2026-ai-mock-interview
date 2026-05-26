import type {
  AuthService,
  LoginInput,
  PasswordResetInput,
  RequestPasswordResetInput,
  SignupOutput,
} from "@/modules/auth";
import { NotFoundError } from "@/shared";
import type { NextFunction, Request, Response } from "express";

export const PASSWORD_RESET_REQUEST_MESSAGE =
  "If an account with that email exists, you will receive password reset instructions.";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  signUp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await this.authService.signUp(req.body as SignupOutput);
      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.authService.login(req.body as LoginInput);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const result = await this.authService.refreshAccessToken(refreshToken);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  requestPasswordReset = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email } = req.body as RequestPasswordResetInput;
      await this.authService.requestPasswordReset(email);
      res.status(200).json({ message: PASSWORD_RESET_REQUEST_MESSAGE });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(200).json({ message: PASSWORD_RESET_REQUEST_MESSAGE });
        return;
      }
      next(error);
    }
  };

  resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { token, password } = req.body as PasswordResetInput;
      await this.authService.resetPassword(token, password);
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  };
}
