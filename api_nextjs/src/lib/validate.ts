import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { HttpError } from "@lib/errors";

type Constructor<T> = new () => T;

function normalizeValues(query: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(query).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
}

async function executeValidation<T extends object>(
  DtoClass: Constructor<T>,
  payload: unknown,
): Promise<T> {
  const instance = plainToInstance(DtoClass, payload, {
    enableImplicitConversion: true,
  });
  const errors = await validate(instance as object, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    const messages = errors.flatMap((error) =>
      Object.values(error.constraints || {}),
    );
    throw new HttpError(400, JSON.stringify(messages));
  }

  return instance;
}

export async function validateBody<T extends object>(
  DtoClass: Constructor<T>,
  body: unknown,
): Promise<T> {
  return executeValidation(DtoClass, body);
}

export async function validateQuery<T extends object>(
  DtoClass: Constructor<T>,
  query: Record<string, string | string[] | undefined>,
): Promise<T> {
  return executeValidation(DtoClass, normalizeValues(query));
}
