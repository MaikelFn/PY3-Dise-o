
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

const pool = new sql.ConnectionPool(config);

async function getPool() {
  if (!pool.connected) {
    await pool.connect();
  }

  return pool;
}

module.exports = { sql, getPool };
