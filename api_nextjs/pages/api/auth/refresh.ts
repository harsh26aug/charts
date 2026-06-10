import { NextApiRequest, NextApiResponse } from "next";
import { initDataSource } from "@data-source";
import { AuthService } from "@services/auth.service";
import { RefreshTokenDto } from "@dto/auth.dto";
import { validateBody } from "@lib/validate";
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
    const payload = await validateBody(RefreshTokenDto, req.body);
    const service = new AuthService();
    const tokens = await service.refreshTokens(payload.refreshToken);
    return res.status(200).json({ success: true, data: tokens });
  } catch (error) {
    const normalized = normalizeError(error);
    return res.status(normalized.status).json({
      success: false,
      message: normalized.message,
    });
  }
}
