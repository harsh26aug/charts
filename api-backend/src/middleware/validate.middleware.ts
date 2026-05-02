import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export function validateDto<T extends object>(DtoClass: new () => T) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const instance = plainToInstance(DtoClass, req.body);
        const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });

        if (errors.length > 0) {
            const messages = errors.flatMap((e) => Object.values(e.constraints || {}));
            res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
            return;
        }

        req.body = instance;
        next();
    };
}
