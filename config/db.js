const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

pool.on('connect', (client) => {
    client.query("SET TIME ZONE 'Asia/Jakarta'") // Setiap koneksi ke db menggunakan timezone jakarta
  console.log('Terhubung ke Postgres');
});

pool.on('error', (err) => {
  console.error(err.message);
})

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
}