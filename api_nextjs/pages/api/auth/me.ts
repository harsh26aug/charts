import { NextApiRequest, NextApiResponse } from "next";
import { initDataSource } from "@data-source";
import { AuthService } from "@services/auth.service";
import { authenticateRequest } from "@lib/auth";
import { normalizeError } from "@lib/errors";

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
    const service = new AuthService();
    const user = await service.getProfile(payload.sub);
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    const normalized = normalizeError(error);
    return res.status(normalized.status).json({
      success: false,
      message: normalized.message,
    });
  }
}
