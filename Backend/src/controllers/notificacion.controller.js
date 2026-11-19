const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');

// Listar notificaciones
async function listarNotificaciones(req, res) {
  try {
    const { soloNoLeidas } = req.query;

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_notificaciones_listarporusuario($1, $2)',
      [req.session.usuario.id, soloNoLeidas === 'true']
    );

    return res.json(resultado.rows);

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar notificaciones');
  }
}

// Consultar notificación
async function consultarNotificacion(req, res) {
  try {
    const id = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_notificaciones_consultarporid($1, $2)',
      [id, req.session.usuario.id]
    );

    if (!resultado.rows.length) {
      return res.status(404).json({
        mensaje: 'Notificación no encontrada'
      });
    }

    return res.json(resultado.rows[0]);

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al consultar notificación');
  }
}

// Marcar notificación como leída
async function marcarLeida(req, res) {
  try {
    const id = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_notificaciones_marcarleida($1, $2)',
      [id, req.session.usuario.id]
    );

    return res.json({
      mensaje: 'Notificación marcada como leída',
      notificacion: resultado.rows[0]
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al marcar notificación');
  }
}

// Marcar todas las notificaciones como leídas
async function marcarTodasLeidas(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_notificaciones_marcartodasleidas($1)',
      [req.session.usuario.id]
    );

    return res.json({
      mensaje: 'Notificaciones actualizadas correctamente',
      notificacionesActualizadas:
        resultado.rows[0].notificacionesactualizadas
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al actualizar notificaciones');
  }
}

module.exports = {
  listarNotificaciones,
  consultarNotificacion,
  marcarLeida,
  marcarTodasLeidas
};
