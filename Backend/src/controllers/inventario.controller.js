const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');
const { adaptarInventario } = require('../adapters/inventario.adapter');

/**
 * Consulta el inventario de un producto.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el inventario adaptado
 */
async function consultarInventario(req, res) {
  try {
    const productoID = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_inventarios_consultarporproducto($1)',
      [productoID]
    );

    if (!resultado.rows.length) {
      return res.status(404).json({
        mensaje: 'Inventario no encontrado'
      });
    }

    const inventario = resultado.rows[0];

    return res.json(adaptarInventario(inventario));

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al consultar inventario');
  }
}

/**
 * Agrega existencias al inventario de un producto.
 * Requiere un perfil de vendedor activo.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el inventario actualizado adaptado
 */
async function agregarExistencias(req, res) {
  try {
    const productoID = Number(req.params.id);
    const { cantidad } = req.body;

    const conexion = await getPool();

    const vendedor = await conexion.query(
      'SELECT * FROM public.sp_vendedores_obtenerporusuario($1)',
      [req.session.usuario.id]
    );

    if (!vendedor.rows.length) {
      return res.status(403).json({
        mensaje: 'No tiene un perfil de vendedor activo'
      });
    }

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_inventarios_agregarexistencias($1, $2, $3)',
      [
        productoID,
        vendedor.rows[0].vendedorid,
        cantidad
      ]
    );

    const inventario = resultado.rows[0];

    return res.json({
      mensaje: 'Existencias agregadas correctamente',
      inventario: adaptarInventario(inventario)
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al agregar existencias');
  }
}

module.exports = {
  consultarInventario,
  agregarExistencias
};
