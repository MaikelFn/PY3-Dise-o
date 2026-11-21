
const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');
const { adaptarDireccion } = require('../adapters/direccion.adapter');

/**
 * Lista las direcciones del usuario autenticado.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el arreglo de direcciones adaptadas
 */
async function listarDirecciones(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_direcciones_listarporusuario($1)',
      [req.session.usuario.id]
    );

    return res.json(resultado.rows.map(adaptarDireccion));

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar direcciones');
  }
}

/**
 * Agrega una nueva dirección al usuario autenticado.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con la dirección creada adaptada
 */
async function agregarDireccion(req, res) {
  try {
    const { provincia, canton, distrito, detalle, principal = false } = req.body;
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_direcciones_agregar($1, $2, $3, $4, $5, $6)',
      [
        req.session.usuario.id,
        provincia,
        canton,
        distrito,
        detalle,
        principal
      ]
    );

    const direccion = resultado.rows[0];

    return res.status(201).json({
      mensaje: 'Dirección agregada correctamente',
      direccion: adaptarDireccion(direccion)
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al agregar dirección');
  }
}

/**
 * Actualiza una dirección existente del usuario autenticado.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con la dirección actualizada adaptada
 */
async function actualizarDireccion(req, res) {
  try {
    const id = Number(req.params.id);

    const { provincia, canton, distrito, detalle, principal } = req.body;
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_direcciones_actualizar($1, $2, $3, $4, $5, $6, $7)',
      [
        id,
        req.session.usuario.id,
        provincia,
        canton,
        distrito,
        detalle,
        principal
      ]
    );

    const direccion = resultado.rows[0];

    return res.json({
      mensaje: 'Dirección actualizada correctamente',
      direccion: adaptarDireccion(direccion)
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al actualizar dirección');
  }
}

/**
 * Elimina una dirección del usuario autenticado.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con la confirmación de eliminación
 */
async function eliminarDireccion(req, res) {
  try {
    const id = Number(req.params.id);

    const conexion = await getPool();

    await conexion.query(
      'SELECT * FROM public.sp_direcciones_eliminar($1, $2)',
      [id, req.session.usuario.id]
    );

    return res.json({
      mensaje: 'Dirección eliminada correctamente'
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al eliminar dirección');
  }
}

module.exports = {
  listarDirecciones,
  agregarDireccion,
  actualizarDireccion,
  eliminarDireccion
};
