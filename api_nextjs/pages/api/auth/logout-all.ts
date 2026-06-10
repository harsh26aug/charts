import { NextApiRequest, NextApiResponse } from "next";
import { initDataSource } from "@data-source";
import { AuthService } from "@services/auth.service";
import { authenticateRequest } from "@lib/auth";
import { normalizeError } from "@lib/errors";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  try {
    await initDataSource();
    const payload = authenticateRequest(req);
    const service = new AuthService();
    await service.logoutAll(payload.sub);
    return res.status(200).json({
      success: true,
      message: "Logged out from all devices",
    });
  } catch (error) {
    const normalized = normalizeError(error);
    return res.status(normalized.status).json({
      success: false,
      message: normalized.message,
    });
  }
}
