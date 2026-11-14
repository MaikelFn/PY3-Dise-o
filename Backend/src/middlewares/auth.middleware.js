function verificarSesion(req, res, next) {
  if (!req.session?.usuario) {
    return res.status(401).json({
      mensaje: 'Debe iniciar sesión'
    });
  }

  next();
}

function verificarRol(rol) {
  return (req, res, next) => {
    if (!req.session?.usuario) {
      return res.status(401).json({
        mensaje: 'Debe iniciar sesión'
      });
    }

    if (req.session.usuario.rol !== rol) {
      return res.status(403).json({
        mensaje: 'No tiene permisos'
      });
    }

    next();
  };
}

module.exports = { verificarSesion, verificarRol };
