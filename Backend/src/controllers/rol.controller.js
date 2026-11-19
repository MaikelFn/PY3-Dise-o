const { getPool } = require('../config/database');

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
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al listar roles'
    });
  }
}

module.exports = { listarRoles };
