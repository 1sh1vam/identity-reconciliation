import mysql from 'mysql2/promise';

class Database {
  private _client?: mysql.Connection;

  get client() {
    if (!this._client) {
      throw new Error('Can not access client before connecting.');
    }

    return this._client;
  }

  async init_db() {
    const env = process.env;
    console.log('env', {
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASSWORD
    })
    const client = await this.connect();

    await client.query(`CREATE DATABASE IF NOT EXISTS ${env.DB_NAME};`);
    await client.query(`USE ${env.DB_NAME}`);
    await client.query('CREATE TABLE IF NOT EXISTS bite_speed.contacts (id INT PRIMARY KEY AUTO_INCREMENT, phoneNumber VARCHAR(20), email VARCHAR(50), linkedId INT, linkPrecedence CHAR(20), createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, deletedAt BOOLEAN)');

    await client.end()
  }

  async connect() {
    const env = process.env;
    console.log('env', {
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASSWORD
    })
    const client = await mysql.createConnection({
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASSWORD
    });

    this._client = client;
    return client;
  }
}

export const db = new Database();
