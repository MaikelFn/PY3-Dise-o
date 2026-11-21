const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');

/**
 * Lista los detalles del carrito del usuario autenticado.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el arreglo de detalles del carrito
 */
async function listarDetalles(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_detallescarrito_listarporusuario($1)',
      [req.session.usuario.id]
    );

    return res.json(resultado.rows);

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar detalles del carrito');
  }
}

/**
 * Agrega un producto al carrito del usuario autenticado.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con los detalles actualizados del carrito
 */
async function agregarDetalle(req, res) {
  try {
    const { productoID, cantidad } = req.body;

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_detallescarrito_agregar($1, $2, $3)',
      [req.session.usuario.id, productoID, cantidad]
    );

    return res.status(201).json({
      mensaje: 'Producto agregado al carrito',
      detalles: resultado.rows
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al agregar producto al carrito');
  }
}

/**
 * Actualiza la cantidad de un producto en el carrito
 * del usuario autenticado.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con los detalles actualizados del carrito
 */
async function actualizarCantidad(req, res) {
  try {
    const productoID = Number(req.params.productoID);
    const { cantidad } = req.body;

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_detallescarrito_actualizarcantidad($1, $2, $3)',
      [req.session.usuario.id, productoID, cantidad]
    );

    return res.json({
      mensaje: 'Cantidad actualizada correctamente',
      detalles: resultado.rows
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al actualizar cantidad');
  }
}

/**
 * Elimina un producto del carrito del usuario autenticado.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con los detalles actualizados del carrito
 */
async function eliminarDetalle(req, res) {
  try {
    const productoID = Number(req.params.productoID);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_detallescarrito_eliminar($1, $2)',
      [req.session.usuario.id, productoID]
    );

    return res.json({
      mensaje: 'Producto eliminado del carrito',
      detalles: resultado.rows
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al eliminar producto del carrito');
  }
}

module.exports = {
  listarDetalles,
  agregarDetalle,
  actualizarCantidad,
  eliminarDetalle
};
