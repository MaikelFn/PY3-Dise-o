const { getPool } = require('../config/database');

async function verificarSesion(req, res, next) {
  if (!req.session?.usuario) {
    return res.status(401).json({
      mensaje: 'Debe iniciar sesión'
    });
  }

  try {
    const conexion = await getPool();
    const resultado = await conexion.query(
      'SELECT * FROM public.sp_usuarios_consultarporid($1)',
      [req.session.usuario.id]
    );
    const usuario = resultado.rows[0];

    if (!usuario || usuario.activo !== true) {
      await new Promise((resolve, reject) => {
        req.session.destroy(error => error ? reject(error) : resolve());
      });
      res.clearCookie('clickmarket.sid');

      return res.status(401).json({
        mensaje: 'La sesión ya no está activa'
      });
    }

    req.session.usuario = {
      id: usuario.usuarioid,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      rol: usuario.rol
    };

    return next();
  } catch (error) {
    console.error('Error al validar la sesión:', error);
    return res.status(500).json({
      mensaje: 'Error al validar la sesión'
    });
  }
}

function verificarRol(rol) {
  return (req, res, next) => {
    verificarSesion(req, res, () => {
      if (req.session.usuario.rol !== rol) {
        return res.status(403).json({
          mensaje: 'No tiene permisos'
        });
      }

      next();
    });
  };
}

module.exports = { verificarSesion, verificarRol };
