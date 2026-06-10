export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

const statusMap: Record<string, number> = {
  "Email already registered": 409,
  "Invalid credentials": 401,
  "Account is disabled": 403,
  "Invalid or expired refresh token": 401,
  "Invalid refresh token": 401,
  "Forbidden": 403,
  "User not found": 404,
};

export function normalizeError(err: unknown): HttpError {
  if (err instanceof HttpError) {
    return err;
  }

  if (err instanceof Error) {
    const status = statusMap[err.message] || 500;
    const message = status === 500 ? "Internal server error" : err.message;
    return new HttpError(status, message);
  }

  return new HttpError(500, "Internal server error");
}
