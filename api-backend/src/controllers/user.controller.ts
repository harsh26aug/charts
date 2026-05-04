import { Request, Response } from "express";
import { AppDataSource } from "@root/data-source";
import { User, UserRole } from "@entities/User";

export class UserController {
  private userRepo = AppDataSource.getRepository(User);

  list = async (_req: Request, res: Response): Promise<void> => {
    const [users, total] = await this.userRepo.findAndCount({
      order: { createdAt: "DESC" },
    });

    res.json({ success: true, data: users, total });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params["id"] as string;

    if (req.user!.sub !== id && req.user!.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }

    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, data: user });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = req.params["id"] as string;

    if (req.user!.sub !== id && req.user!.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }

    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    Object.assign(user, req.body);
    await this.userRepo.save(user);

    res.json({ success: true, data: user });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const result = await this.userRepo.delete({
      id: req.params["id"] as string,
    });

    if (!result.affected) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, message: "User deleted" });
  };
}

export const userController = new UserController();
