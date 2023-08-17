import { Request, Response, NextFunction } from "express";
import { FieldValidationError, validationResult } from "express-validator"
import { BadRequestError } from "../errors/bad-request-error";

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        throw new BadRequestError('', errors.array() as FieldValidationError[]);
    }

    next();
}