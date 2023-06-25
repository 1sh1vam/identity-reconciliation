import mysql from 'mysql2/promise';

class Database {
  private _client?: mysql.Connection;

  get client() {
    if (!this._client) {
      throw new Error('Can not access client before connecting.');
    }

    return this._client;
  }

  async connect(password: string = 'root@123') {
    const client = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      database: 'bite_speed',
      password: password
    });

    this._client = client;
  }
}

export const db = new Database();
