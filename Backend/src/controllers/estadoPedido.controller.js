
const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');
const { adaptarEstadoPedido } = require('../adapters/estadoPedido.adapter');

/**
 * Lista los estados de pedido disponibles en ClickMarket.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el arreglo de estados adaptados
 */
async function listarEstados(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_estadospedido_listar()'
    );

    const estados = resultado.rows.map(adaptarEstadoPedido);

    return res.json(estados);

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar estados de pedido');
  }
}

module.exports = { listarEstados };
