import { CustomError } from './custom-error';

export class NotFoundError extends CustomError {
    statusCode = 404;

    constructor(public message = 'Not found') {
        super(message);
    }

    serializeErrors() {
        return [
            { message: this.message }
        ]
    }
}