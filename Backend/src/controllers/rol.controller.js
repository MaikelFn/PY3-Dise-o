const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');

// Listar roles
async function listarRoles(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_roles_listar()'
    );

    const roles = resultado.rows.map(r => ({
      RolID: r.rolid,
      Nombre: r.nombre,
      Descripcion: r.descripcion
    }));

    return res.json(roles);

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar roles');
  }
}

module.exports = { listarRoles };
