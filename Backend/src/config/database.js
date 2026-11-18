const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error(
    'Falta configurar DATABASE_URL en el archivo .env'
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (error) => {
  console.error(
    'Error inesperado en una conexion inactiva de PostgreSQL:',
    error
  );
});

async function getPool() {
  return pool;
}

async function probarConexion() {
  const resultado = await pool.query(`
    SELECT
      current_database() AS base_datos,
      current_schema() AS esquema,
      version() AS version_postgresql
  `);

  return resultado.rows[0];
}

module.exports = {
  pool,
  getPool,
  probarConexion
};
