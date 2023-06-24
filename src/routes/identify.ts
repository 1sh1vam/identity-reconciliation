import express, { NextFunction, Response } from 'express';
import { body } from 'express-validator';
import { TypedRequestBody } from '../types/request';
import { BadRequestError } from '../errors/bad-request-error';
import { getContactRows, createContact, manageContacts, constructContactResponse } from '../services/identify';
import { IContactRecord } from '../types/contact';

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
    async (req: TypedRequestBody<IdentifyBodyT>, res: Response, next: NextFunction) => {
        const { email, phoneNumber } = req.body;

        if (!(email || phoneNumber)) {
            throw new BadRequestError('Either email or phoneNumber is required')
        }

        const existingContacts = await getContactRows(email, phoneNumber);

        let contacts: IContactRecord[] = [];
        if (!existingContacts.length) {
            contacts = await createContact(email, phoneNumber);
        } else {
            contacts = await manageContacts(existingContacts, email, phoneNumber);
        }

        const contactsResponse = constructContactResponse(contacts);
        res.status(200).send(contactsResponse);
    }
);

export { router as identifyRouter };