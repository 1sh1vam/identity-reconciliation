import { ResultSetHeader } from "mysql2";
import { db } from "../db";
import { IContactRecord } from "../types/contact";

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

