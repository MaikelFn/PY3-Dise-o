const { getPool } = require('../config/database');

function mapearUsuario(usuario) {
  return {
    UsuarioID: usuario.usuarioid,
    Nombre: usuario.nombre,
    Apellido: usuario.apellido,
    Correo: usuario.correo,
    RolID: usuario.rolid,
    Rol: usuario.rol,
    FechaRegistro: usuario.fecharegistro,
    Activo: usuario.activo
  };
}

function manejarErrorPostgres(error, res, accion) {
  if (error.code === '23505') {
    return res.status(409).json({
      mensaje: 'El correo ya está registrado'
    });
  }

  if (error.code === '22P02') {
    return res.status(400).json({
      mensaje: 'El identificador de usuario no es válido'
    });
  }

  if (error.code === 'P0001') {
    const mensaje = String(error.message || '');
    if (/no (existe|encontr)/i.test(mensaje)) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    return res.status(400).json({
      mensaje: mensaje || `Error al ${accion} usuario`
    });
  }

  console.error(`Error al ${accion} usuario:`, error);
  return res.status(500).json({
    mensaje: `Error al ${accion} usuario`
  });
}

async function consultarUsuario(req, res) {
  try {
    const usuarioID = Number(req.params.id);
    if (!Number.isInteger(usuarioID)) {
      return res.status(400).json({
        mensaje: 'El identificador de usuario no es válido'
      });
    }

    const sesion = req.session.usuario;
    if (sesion.rol !== 'Administrador' && sesion.id !== usuarioID) {
      return res.status(403).json({
        mensaje: 'No puede consultar este usuario'
      });
    }

    const conexion = await getPool();
    const resultado = await conexion.query(
      'SELECT * FROM public.sp_usuarios_consultarporid($1)',
      [usuarioID]
    );

    if (!resultado.rows.length) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    return res.json({
      usuario: mapearUsuario(resultado.rows[0])
    });
  } catch (error) {
    return manejarErrorPostgres(error, res, 'consultar');
  }
}

async function actualizarUsuario(req, res) {
  try {
    const usuarioID = Number(req.params.id);
    if (!Number.isInteger(usuarioID)) {
      return res.status(400).json({
        mensaje: 'El identificador de usuario no es válido'
      });
    }

    const sesion = req.session.usuario;
    if (sesion.rol !== 'Administrador' && sesion.id !== usuarioID) {
      return res.status(403).json({
        mensaje: 'No puede modificar este usuario'
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(req.body, 'rol') ||
      Object.prototype.hasOwnProperty.call(req.body, 'rolID') ||
      Object.prototype.hasOwnProperty.call(req.body, 'RolID') ||
      Object.prototype.hasOwnProperty.call(req.body, 'Rol')
    ) {
      return res.status(400).json({
        mensaje: 'No puede modificar el rol mediante este endpoint'
      });
    }

    const { nombre, apellido, correo } = req.body;
    const conexion = await getPool();
    const resultado = await conexion.query(
      `SELECT *
       FROM public.sp_usuarios_actualizar($1, $2, $3, $4)`,
      [usuarioID, nombre, apellido, correo]
    );

    if (!resultado.rows.length) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    return res.json({
      mensaje: 'Usuario actualizado correctamente',
      usuario: mapearUsuario(resultado.rows[0])
    });
  } catch (error) {
    if (
      error.message?.includes('correo ya') ||
      error.message?.toLowerCase().includes('correo duplicado')
    ) {
      return res.status(409).json({
        mensaje: 'El correo ya está registrado'
      });
    }

    return manejarErrorPostgres(error, res, 'actualizar');
  }
}

async function desactivarUsuario(req, res) {
  try {
    const usuarioID = Number(req.params.id);
    if (!Number.isInteger(usuarioID)) {
      return res.status(400).json({
        mensaje: 'El identificador de usuario no es válido'
      });
    }

    if (req.session.usuario.id === usuarioID) {
      return res.status(400).json({
        mensaje: 'Un administrador no puede desactivar su propia cuenta'
      });
    }

    const conexion = await getPool();
    const resultado = await conexion.query(
      'SELECT * FROM public.sp_usuarios_desactivar($1)',
      [usuarioID]
    );

    if (!resultado.rows.length) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    return res.json({
      mensaje: 'Usuario desactivado correctamente',
      usuario: mapearUsuario(resultado.rows[0])
    });
  } catch (error) {
    return manejarErrorPostgres(error, res, 'desactivar');
  }
}

module.exports = {
  consultarUsuario,
  actualizarUsuario,
  desactivarUsuario
};
