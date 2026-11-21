const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');
const { adaptarCarrito } = require('../adapters/carrito.adapter');

/**
 * Obtiene el carrito del usuario autenticado o lo crea si no existe.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el carrito adaptado
 */
async function obtenerOCrearCarrito(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_carritos_obtenerocrear($1)',
      [req.session.usuario.id]
    );

    const carrito = resultado.rows[0];

    return res.json(adaptarCarrito(carrito));

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al obtener carrito');
  }
}

/**
 * Consulta el carrito del usuario autenticado.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el arreglo de carritos adaptados
 */
async function consultarCarrito(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_carritos_consultarporusuario($1)',
      [req.session.usuario.id]
    );

    const carrito = resultado.rows.map(adaptarCarrito);

    return res.json(carrito);

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al consultar carrito');
  }
}

/**
 * Vacía el carrito del usuario autenticado.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con la confirmación de vaciado
 */
async function vaciarCarrito(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_carritos_vaciar($1)',
      [req.session.usuario.id]
    );

    return res.json({
      mensaje: 'Carrito vaciado correctamente',
      carrito: resultado.rows
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al vaciar carrito');
  }
}

module.exports = {
  obtenerOCrearCarrito,
  consultarCarrito,
  vaciarCarrito
};
