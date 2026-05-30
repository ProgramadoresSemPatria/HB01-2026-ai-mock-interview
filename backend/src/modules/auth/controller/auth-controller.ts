import type {
  AuthService,
  LoginInput,
  PasswordResetInput,
  RequestPasswordResetInput,
  SignupOutput,
} from "@/modules/auth";
import type { Request, Response } from "express";

export const PASSWORD_RESET_REQUEST_MESSAGE =
  "If an account with that email exists, you will receive password reset instructions.";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  signUp = async (req: Request, res: Response): Promise<void> => {
    const user = await this.authService.signUp(req.body as SignupOutput);
    res.status(201).json({ user });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.login(req.body as LoginInput);
    res.status(200).json(result);
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body as { refreshToken: string };
    const result = await this.authService.refreshAccessToken(refreshToken);
    res.status(200).json(result);
  };

  requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body as RequestPasswordResetInput;
    await this.authService.requestPasswordReset(email);
    res.status(200).json({ message: PASSWORD_RESET_REQUEST_MESSAGE });
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const { token, password } = req.body as PasswordResetInput;
    await this.authService.resetPassword(token, password);
    res.status(200).json({ message: "Password updated successfully" });
  };
}
