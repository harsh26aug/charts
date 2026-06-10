import { NextApiRequest, NextApiResponse } from "next";
import { initDataSource } from "@data-source";
import { User, UserRole } from "@entities/User";
import { authenticateRequest, authorizePayload } from "@lib/auth";
import { normalizeError } from "@lib/errors";
import { AppDataSource } from "@data-source";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end("Method Not Allowed");
  }

  try {
    await initDataSource();
    const payload = authenticateRequest(req);
    authorizePayload(payload, [UserRole.ADMIN]);

    const userRepo = AppDataSource.getRepository(User);
    const [users, total] = await userRepo.findAndCount({
      order: { createdAt: "DESC" },
    });

    return res.status(200).json({ success: true, data: users, total });
  } catch (error) {
    const normalized = normalizeError(error);
    return res.status(normalized.status).json({
      success: false,
      message: normalized.message,
    });
  }
}
