import express, { NextFunction, Response } from 'express';
import { body } from 'express-validator';
import { TypedRequestBody } from '../types/request';
import { BadRequestError } from '../errors/bad-request-error';
import { getContactRows, createContact, manageContacts, constructContactResponse } from '../services/identify';
import { IContactRecord } from '../types/contact';
import { db } from '../db';

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
        try {
            const { email, phoneNumber } = req.body;
    
            if (!(email || phoneNumber)) {
                throw new BadRequestError('Either email or phoneNumber is required')
            }

            await db.connect();
    
            const existingContacts = await getContactRows(email, phoneNumber);
    
            let contacts: IContactRecord[] = [];
            if (!existingContacts.length) {
                contacts = await createContact(email, phoneNumber);
            } else {
                contacts = await manageContacts(existingContacts, email, phoneNumber);
            }
    
            const contactsResponse = constructContactResponse(contacts);
            res.status(200).send(contactsResponse);
            
        } catch(err) {
            throw err;
        } finally {
            db.client.end();
        }
    }
);

export { router as identifyRouter };