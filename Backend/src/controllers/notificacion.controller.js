const { sql, getPool } = require('../config/database');

function idValido(valor) {
  const numero = Number(valor);

  return Number.isSafeInteger(numero) &&
    numero > 0 &&
    numero <= 2147483647;
}

function manejarError(res, error) {
  if (error.number === 51704) {
    return res.status(404).json({
      mensaje: error.message
    });
  }

  console.error(error);

  return res.status(500).json({
    mensaje: 'Error al procesar notificación'
  });
}

// Listar notificaciones del usuario autenticado
async function listarNotificaciones(req, res) {
  try {
    const { soloNoLeidas } = req.query;

    if (
      soloNoLeidas !== undefined &&
      soloNoLeidas !== 'true' &&
      soloNoLeidas !== 'false'
    ) {
      return res.status(400).json({
        mensaje: 'El filtro soloNoLeidas debe ser true o false'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .input('SoloNoLeidas', sql.Bit, soloNoLeidas === 'true')
      .execute('dbo.sp_Notificaciones_ListarPorUsuario');

    return res.json(resultado.recordset);
  } catch (error) {
    return manejarError(res, error);
  }
}

// Consultar una notificación
async function consultarNotificacion(req, res) {
  try {
    const id = Number(req.params.id);

    if (!idValido(id)) {
      return res.status(400).json({
        mensaje: 'ID de notificación inválido'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('NotificacionID', sql.Int, id)
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .execute('dbo.sp_Notificaciones_ConsultarPorID');

    if (!resultado.recordset.length) {
      return res.status(404).json({
        mensaje: 'Notificación no encontrada'
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    return manejarError(res, error);
  }
}

// Marcar una notificación como leída
async function marcarLeida(req, res) {
  try {
    const id = Number(req.params.id);

    if (!idValido(id)) {
      return res.status(400).json({
        mensaje: 'ID de notificación inválido'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('NotificacionID', sql.Int, id)
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .execute('dbo.sp_Notificaciones_MarcarLeida');

    return res.json({
      mensaje: 'Notificación marcada como leída',
      notificacion: resultado.recordset[0]
    });
  } catch (error) {
    return manejarError(res, error);
  }
}

// Marcar todas las notificaciones como leídas
async function marcarTodasLeidas(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .execute('dbo.sp_Notificaciones_MarcarTodasLeidas');

    return res.json({
      mensaje: 'Notificaciones actualizadas correctamente',
      notificacionesActualizadas:
        resultado.recordset[0].NotificacionesActualizadas
    });
  } catch (error) {
    return manejarError(res, error);
  }
}

module.exports = {
  listarNotificaciones,
  consultarNotificacion,
  marcarLeida,
  marcarTodasLeidas
};
