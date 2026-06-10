import { NextApiRequest, NextApiResponse } from "next";
import { initDataSource } from "@data-source";
import { User, UserRole } from "@entities/User";
import { authenticateRequest, authorizePayload } from "@lib/auth";
import { AppDataSource } from "@data-source";
import { UpdateProfileDto } from "@dto/auth.dto";
import { validateBody } from "@lib/validate";
import { normalizeError } from "@lib/errors";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await initDataSource();

  try {
    const payload = authenticateRequest(req);
    const userRepo = AppDataSource.getRepository(User);
    const id = req.query.id as string;

    if (req.method === "GET") {
      if (payload.sub !== id && payload.role !== UserRole.ADMIN) {
        throw new Error("Forbidden");
      }

      const user = await userRepo.findOne({ where: { id } });
      if (!user) {
        throw new Error("User not found");
      }

      return res.status(200).json({ success: true, data: user });
    }

    if (req.method === "PATCH") {
      if (payload.sub !== id && payload.role !== UserRole.ADMIN) {
        throw new Error("Forbidden");
      }

      const body = await validateBody(UpdateProfileDto, req.body);
      const user = await userRepo.findOne({ where: { id } });
      if (!user) {
        throw new Error("User not found");
      }

      Object.assign(user, body);
      await userRepo.save(user);
      return res.status(200).json({ success: true, data: user });
    }

    if (req.method === "DELETE") {
      authorizePayload(payload, [UserRole.ADMIN]);

      const result = await userRepo.delete({ id });
      if (!result.affected) {
        throw new Error("User not found");
      }

      return res.status(200).json({ success: true, message: "User deleted" });
    }

    res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
    return res.status(405).end("Method Not Allowed");
  } catch (error) {
    const normalized = normalizeError(error);
    return res.status(normalized.status).json({
      success: false,
      message: normalized.message,
    });
  }
}
