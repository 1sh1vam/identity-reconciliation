import dotenv from 'dotenv';
dotenv.config();
import { app } from "./app";
import { db } from "./db";

const start = async () => {
    try {
        await db.init_db();
    } catch(err) {
        console.log('failed to connect to db', err);
    }
    app.listen(3000, () => {
        console.log('Server started on port 3000');
    });
}

start();