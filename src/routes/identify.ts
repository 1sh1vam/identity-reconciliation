import express, { Response } from 'express';
import { body } from 'express-validator';
import { TypedRequestBody } from '../types/request';
import { BadRequestError } from '../errors/bad-request-error';

const router = express.Router();

type IdentifyBodyT = {
    email?: string;
    phoneNumber?: number;
}

router.post(
    '/identify',
    [
        body('email')
            .optional()
            .isEmail()
            .withMessage('Provide a valid email'),
        body('phoneNumber')
            .optional()
            .isNumeric()
            .withMessage('Phone number must be numeric')
    ],
    async (req: TypedRequestBody<IdentifyBodyT>, res: Response) => {
        const { email, phoneNumber } = req.body;

        if (!(email || phoneNumber)) {
            throw new BadRequestError('Either email or phoneNumber is required')
        }

        res.status(200).send({
            email,
            phoneNumber
        });
    }
);

export { router as identifyRouter };