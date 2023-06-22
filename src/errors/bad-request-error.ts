import { FieldValidationError, ValidationError } from 'express-validator';
import { CustomError } from './custom-error';

export class BadRequestError extends CustomError {
    statusCode = 400;

    constructor(public message: string, public errors: FieldValidationError[]) {
        super(message);
    }

    serializeErrors() {
        return this.errors.map((err) => ({
            message: err.msg,
            field: err.path
        }))
    }
}