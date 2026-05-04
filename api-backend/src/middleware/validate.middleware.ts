import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

type RequestSource = "body" | "query";
const validatedQueryKey = 'validatedQuery';

function createValidator<T extends object>(
  DtoClass: new () => T,
  source: RequestSource,
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const payload = source === "body" ? req.body : req.query;
    const instance = plainToInstance(DtoClass, payload, {
      enableImplicitConversion: true,
    });
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = errors.flatMap((e) =>
        Object.values(e.constraints || {}),
      );
      res
        .status(400)
        .json({
          success: false,
          message: "Validation failed",
          errors: messages,
        });
      return;
    }

    if (source === "body") {
      req.body = instance;
    } else {
      res.locals[validatedQueryKey] = instance;
    }

    next();
  };
}

export function validateDto<T extends object>(DtoClass: new () => T) {
  return createValidator(DtoClass, "body");
}

export function validateQueryDto<T extends object>(DtoClass: new () => T) {
  return createValidator(DtoClass, "query");
}

export function getValidatedQuery<T>(res: Response): T {
  return res.locals[validatedQueryKey] as T;
}
