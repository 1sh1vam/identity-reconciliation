import 'dotenv/config';
import { app } from "./app";
import { db } from "./db";

const start = async () => {
    try {
        // replace this password with db password
        await db.connect(process.env.DB_PASSWORD!);
        await db.client.query('CREATE TABLE IF NOT EXISTS bite_speed.contacts (id INT PRIMARY KEY AUTO_INCREMENT, phoneNumber INT, email VARCHAR(50), linkedId INT, linkPrecedence CHAR(20), createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, deletedAt BOOLEAN)')
    } catch(err) {
        console.log('failed to connect to db', err);
    }
    app.listen(3000, () => {
        console.log('Server started on port 3000');
    });
}

start();