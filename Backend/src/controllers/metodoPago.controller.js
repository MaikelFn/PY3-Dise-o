
const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');
const { adaptarMetodoPago } = require('../adapters/metodoPago.adapter');

/**
 * Lista los métodos de pago disponibles en ClickMarket.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el arreglo de métodos de pago adaptados
 */
async function listarMetodosPago(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_metodospago_listar()'
    );

    const metodosPago = resultado.rows.map(adaptarMetodoPago);

    return res.json(metodosPago);

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar métodos de pago');
  }
}

module.exports = { listarMetodosPago };
