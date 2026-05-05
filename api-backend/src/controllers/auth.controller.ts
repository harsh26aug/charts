import { Request, Response } from "express";
import { AuthService } from "@services/auth.service";

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.login(req.body);
    res.status(200).json({ success: true, data: result });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const tokens = await this.authService.refreshTokens(req.body.refreshToken);
    res.status(200).json({ success: true, data: tokens });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    await this.authService.logout(req.body.refreshToken);
    res.status(200).json({ success: true, message: "Logged out successfully" });
  };

  logoutAll = async (req: Request, res: Response): Promise<void> => {
    await this.authService.logoutAll(req.user!.sub);
    res
      .status(200)
      .json({ success: true, message: "Logged out from all devices" });
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const user = await this.authService.getProfile(req.user!.sub);
    res.status(200).json({ success: true, data: user });
  };
}

export const authController = new AuthController();
