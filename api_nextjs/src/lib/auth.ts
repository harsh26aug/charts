import { NextApiRequest } from "next";
import * as jwt from "jsonwebtoken";
import { HttpError } from "@lib/errors";
import { JwtPayload } from "@app-types/auth";
import { UserRole } from "@entities/User";

export function getBearerToken(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }

  return authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
}

export function authenticateRequest(req: NextApiRequest): JwtPayload {
  const token = getBearerToken(req);
  if (!token) {
    throw new HttpError(401, "Access token required");
  }

  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
  } catch {
    throw new HttpError(401, "Invalid or expired access token");
  }
}

export function authorizePayload(
  payload: JwtPayload,
  roles: UserRole[],
): void {
  if (!roles.includes(payload.role)) {
    throw new HttpError(403, "Forbidden: insufficient permissions");
  }
}
