const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');
const { adaptarRol } = require('../adapters/rol.adapter');

// Listar roles
async function listarRoles(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_roles_listar()'
    );

    const roles = resultado.rows.map(adaptarRol);

    return res.json(roles);

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar roles');
  }
}

module.exports = { listarRoles };
