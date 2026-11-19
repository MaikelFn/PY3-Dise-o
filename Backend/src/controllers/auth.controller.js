const bcrypt = require('bcrypt');
const { getPool } = require('../config/database');
const { promisify } = require('util');

async function registrarUsuario(req, res) {
  try {
    const { nombre, apellido, correo, contrasena } = req.body;

    const conexion = await getPool();
    const hash = await bcrypt.hash(contrasena, 10);

    const resultado = await conexion.query(
      `SELECT *
       FROM public.sp_usuarios_registrar($1, $2, $3, $4)`,
      [
        nombre.trim(),
        apellido.trim(),
        correo.trim(),
        hash
      ]
    );

    const usuario = resultado.rows[0];

    if (!usuario) {
      throw new Error('La funcion de registro no devolvio un usuario');
    }

    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      usuario: {
        UsuarioID: usuario.usuarioid,
        Nombre: usuario.nombre,
        Apellido: usuario.apellido,
        Correo: usuario.correo,
        RolID: usuario.rolid,
        Rol: usuario.rol,
        FechaRegistro: usuario.fecharegistro,
        Activo: usuario.activo
      }
    });

  } catch (error) {
    if (
      error.code === '23505' ||
      error.message?.includes('correo ya')
    ) {
      return res.status(409).json({
        mensaje: 'El correo ya está registrado'
      });
    }

    console.error('Error al registrar usuario:', error);

    return res.status(500).json({
      mensaje: 'Error al registrar usuario'
    });
  }
}

async function iniciarSesion(req, res) {
  try {
    const { correo, contrasena } = req.body;

    const conexion = await getPool();

    const resultado = await conexion.query(
      `SELECT *
       FROM public.sp_usuarios_consultarporcorreo($1)`,
      [correo.trim()]
    );

    const usuario = resultado.rows[0];

    if (
      !usuario ||
      usuario.activo !== true ||
      typeof usuario.contrasenahash !== 'string' ||
      !(await bcrypt.compare(contrasena, usuario.contrasenahash))
    ) {
      return res.status(401).json({
        mensaje: 'Credenciales incorrectas'
      });
    }

    await promisify(req.session.regenerate).call(req.session);

    req.session.usuario = {
      id: usuario.usuarioid,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      rol: usuario.rol
    };

    await promisify(req.session.save).call(req.session);

    return res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: req.session.usuario
    });

  } catch (error) {
    console.error('Error al iniciar sesión:', error);

    return res.status(500).json({
      mensaje: 'Error al iniciar sesión'
    });
  }
}

function obtenerSesion(req, res) {
  if (!req.session?.usuario) {
    return res.status(401).json({
      mensaje: 'No hay una sesión activa'
    });
  }

  return res.json({
    usuario: req.session.usuario
  });
}

async function cerrarSesion(req, res) {
  if (!req.session?.usuario) {
    return res.status(401).json({
      mensaje: 'No hay una sesión activa'
    });
  }

  try {
    await promisify(req.session.destroy).call(req.session);

    res.clearCookie('clickmarket.sid');

    return res.json({
      mensaje: 'Sesión cerrada correctamente'
    });

  } catch (error) {
    console.error('Error al cerrar sesión:', error);

    return res.status(500).json({
      mensaje: 'Error al cerrar sesión'
    });
  }
}

module.exports = {
  registrarUsuario,
  iniciarSesion,
  obtenerSesion,
  cerrarSesion
};
