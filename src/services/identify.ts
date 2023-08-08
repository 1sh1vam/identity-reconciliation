import { ResultSetHeader } from "mysql2";
import { db } from "../db";
import { IContactRecord, IContactReponse } from "../types/contact";

export const getContactRows = async (email?: string, phoneNumber?: number) => {
    let conditionalQuery = '';
    const queryVal = [];
    if (email) {
        conditionalQuery += `email = ?${phoneNumber ? 'or ': ''}`
        queryVal.push(email);
    }

    if (phoneNumber) {
        conditionalQuery += 'phoneNumber = ?';
        queryVal.push(phoneNumber);
    }

    const queryText = `WITH RECURSIVE recursive_query AS (
        SELECT id, linkedId, email, phoneNumber, linkPrecedence, createdAt, updatedAt,
        deletedAt, CAST(id AS CHAR(200)) AS visited
        FROM bite_speed.contacts
        WHERE ${conditionalQuery}

        UNION ALL

        SELECT t.id, t.linkedId, t.email, t.phoneNumber, t.linkPrecedence, t.createdAt,
        t.updatedAt, t.deletedAt, CONCAT(r.visited, ',', t.id)
        FROM bite_speed.contacts AS t
        INNER JOIN recursive_query AS r ON t.linkedId = r.id or t.id = r.linkedId
        WHERE NOT FIND_IN_SET(t.id, r.visited)
      )
      SELECT DISTINCT id, linkedId, email, phoneNumber, linkPrecedence, createdAt, updatedAt, deletedAt
      FROM recursive_query order by createdAt;`;

    const [rows] = await db.client.query(queryText, queryVal);

    return rows as IContactRecord[];
}

export const createContact = async (emailId?: string, phoneNumber?: number, linkPrecedence: IContactRecord['linkPrecedence'] = 'primary', linkedId?: number) => {
    const queryText = `
        INSERT INTO bite_speed.contacts (linkedId, email, phoneNumber, linkPrecedence)
        values(?, ?, ?, ?)
    `;

    const [result] = await db.client.query(queryText, [linkedId, emailId, phoneNumber, linkPrecedence]);

    const rowId = (result as ResultSetHeader).insertId;

    const [rows] = await db.client.query('SELECT * FROM bite_speed.contacts where id = ?', [rowId]);

    return rows as IContactRecord[];
}

export const turnPrimaryContactToSecondary = async (contact1: IContactRecord, contact2: IContactRecord, contacts: IContactRecord[]) => {
    const contact1CAt = new Date(contact1.createdAt);
    const conract2CAt = new Date(contact2.createdAt);

    let primaryContactId: number;
    let secondaryContactId: number;

    if (contact1CAt < conract2CAt) {
        contact1.linkPrecedence = 'primary';
        contact2.linkPrecedence = 'secondary';
        contact2.linkedId = contact1.id;
        primaryContactId = contact1.id;
        secondaryContactId = contact2.id;
    } else {
        contact2.linkPrecedence = 'primary';
        contact1.linkPrecedence = 'secondary';
        contact1.linkedId = contact2.id;
        primaryContactId = contact2.id;
        secondaryContactId = contact1.id;
    }

    await db.client.beginTransaction();

    const promise1 = db.client.query(
        `UPDATE bite_speed.contacts SET linkPrecedence = 'primary' where id = ?`,
        [primaryContactId]
    );
    const promise2 = db.client.query(
        `UPDATE bite_speed.contacts SET linkPrecedence = 'secondary', linkedId = ? where id = ?`,
        [primaryContactId, secondaryContactId]
    )

    await Promise.all([promise1, promise2]);

    await db.client.commit();

    const modifiedContacts: IContactRecord[] = [];

    // These are the ids that are related to another primary id when user gives an email of primary contact id and
    // phone number of a record which is linked to another primary id
    const idsToBeFiltered: number[] = [];
    contacts.forEach((contact) => {
        if (contact.linkPrecedence === 'primary' && contact.id !== primaryContactId) idsToBeFiltered.push(contact.id);

        if (contact.linkedId && idsToBeFiltered.includes(contact.linkedId)) {
            idsToBeFiltered.push(contact.id);
        }
    });

    // Only return the contacts related to new primary contact
    contacts.forEach((contact) => {
        if (contact.id === contact1.id) modifiedContacts.push(contact1);
        else if (contact.id === contact2.id) modifiedContacts.push(contact2);
        else if (!idsToBeFiltered.includes(contact.id)) modifiedContacts.push(contact);
    })
    return modifiedContacts;
}

export const manageContacts = async (contacts: IContactRecord[], email?: string, phoneNumber?: number) => {
    let emailRow: IContactRecord | undefined;
    let phoneRow: IContactRecord | undefined;

    // Get the rows having the email or phone;
    for (const contact of contacts) {
        if (email && phoneNumber && contact.email === email && contact.phoneNumber === phoneNumber) {
            emailRow = contact;
            phoneRow = contact;
            break;
        }

        if (!emailRow && email && contact.email === email) {
            emailRow = contact;
        }

        if (!phoneRow && phoneNumber && contact.phoneNumber === phoneNumber) {
            phoneRow = contact;
        }
    }

    // If only a record with email or phone number exists
    if ((email && !emailRow) || (phoneNumber && !phoneRow)) {
        const recordToBeUpdated = (emailRow || phoneRow)!;
        // If the record does not have either an email or phone number then update the current row
        // with the new data
        if (!(recordToBeUpdated.email && recordToBeUpdated.phoneNumber)) {
            const fieldToUpdate = recordToBeUpdated.email ? 'phoneNumber' : 'email';
            const updatedFieldVal = recordToBeUpdated.email ? phoneNumber : email;

            // If the missing field (email | phoneNumber) in db is again sent null in request
            if (!updatedFieldVal) return contacts;
            await db.client.query(
                `UPDATE bite_speed.contacts SET ${fieldToUpdate} = ? where id = ?`,
                [updatedFieldVal, recordToBeUpdated.id]
            )

            recordToBeUpdated[fieldToUpdate] = updatedFieldVal as any;

            return contacts.map((contact) => contact.id === recordToBeUpdated.id ? recordToBeUpdated : contact);
        } else {
            // create secondary contact
            const [secondaryContact] = await createContact(
                email,
                phoneNumber,
                'secondary',
                recordToBeUpdated.id
            );

            return [ ...contacts, secondaryContact ]
        }
    } else if (emailRow && phoneRow && emailRow.email !== phoneRow.email && emailRow.phoneNumber !== phoneRow.phoneNumber) {
        // update the link precedence
        return turnPrimaryContactToSecondary(emailRow, phoneRow, contacts);
    }

    return contacts;
}

export const constructContactResponse = (contacts: IContactRecord[]) => {
    const contactRes: IContactReponse['contact'] = {
        phoneNumbers: [],
        emails: [],
        primaryContatctId: 0,
        secondaryContactIds: []
    };
    contacts.forEach((contact) => {
        if (contact.linkPrecedence === 'primary') {
            contactRes.primaryContatctId = contact.id;
            contact.phoneNumber && contactRes.phoneNumbers.unshift(contact.phoneNumber);
            contact.email && contactRes.emails.unshift(contact.email);
        } else {
            contact.phoneNumber && contactRes.phoneNumbers.push(contact.phoneNumber);
            contact.email && contactRes.emails.push(contact.email);
            contactRes.secondaryContactIds.push(contact.id);
        }
    });

    contactRes.emails = [...new Set(contactRes.emails)];
    contactRes.phoneNumbers = [...new Set(contactRes.phoneNumbers)];

    return { contact: contactRes };
}