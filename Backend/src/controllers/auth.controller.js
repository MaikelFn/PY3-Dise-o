const bcrypt = require('bcrypt');
const { getPool } = require('../config/database');
const { promisify } = require('util');
const { manejarErrorPostgres } = require('../utils/postgresErrors');
const { adaptarUsuario } = require('../adapters/usuario.adapter');

/**
 * Registra un nuevo usuario en ClickMarket con rol Comprador.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el usuario registrado adaptado
 */
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
      usuario: adaptarUsuario(usuario)
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al registrar usuario');
  }
}

/**
 * Inicia sesión de un usuario verificando sus credenciales.
 * Regenera la sesión para prevenir fijación de sesión.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con la sesión creada o un error 401
 */
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
    return manejarErrorPostgres(error, res, 'Error al iniciar sesión');
  }
}

/**
 * Devuelve los datos del usuario de la sesión activa.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {void} Responde con el usuario en sesión o un error 401
 */
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

/**
 * Cierra la sesión activa del usuario y elimina la cookie de sesión.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con la confirmación de cierre
 */
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
    return manejarErrorPostgres(error, res, 'Error al cerrar sesión');
  }
}

module.exports = {
  registrarUsuario,
  iniciarSesion,
  obtenerSesion,
  cerrarSesion
};
