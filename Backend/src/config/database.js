
const sql = require('mssql');

function booleanFromEnv(value, fallback) {
  if (value == null || value === '') return fallback;
  return value.toLowerCase() === 'true';
}

const config = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: booleanFromEnv(process.env.DB_ENCRYPT, false),
    trustServerCertificate: booleanFromEnv(
      process.env.DB_TRUST_SERVER_CERTIFICATE,
      true
    )
  }
};

const pool = new sql.ConnectionPool(config);
let poolPromise;

async function getPool() {
  if (pool.connected) return pool;

  if (!poolPromise) {
    poolPromise = pool.connect().catch((error) => {
      poolPromise = undefined;
      throw error;
    });
  }

  await poolPromise;
  return pool;
}

module.exports = { sql, getPool };
