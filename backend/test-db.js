// backend/test-db.js
import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    const [dbs] = await conn.query('SHOW DATABASES');
    console.log(dbs.map(d => d.Database));
    await conn.end();
  } catch (err) {
    console.error('Conexión fallida:', err.message);
  }
})();
