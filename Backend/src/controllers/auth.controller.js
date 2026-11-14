
const bcrypt = require('bcrypt');
const { sql, getPool } = require('../config/database');
const { promisify } = require('util');

// Registrar usuario
async function registrarUsuario(req, res) {
  try {
    const { nombre, apellido, correo, contrasena } = req.body;

    if ([nombre, apellido, correo, contrasena].some(
      valor => typeof valor !== 'string' || !valor.trim()
    )) {
      return res.status(400).json({
        mensaje: 'Todos los campos son obligatorios'
      });
    }

    if (nombre.length > 100 || apellido.length > 100 ||
        correo.length > 150 || contrasena.length < 8 ||
        contrasena.length > 72) {
      return res.status(400).json({
        mensaje: 'Datos de registro inválidos'
      });
    }

    const conexion = await getPool();

    const rol = await conexion.request()
      .query("SELECT RolID FROM dbo.Roles WHERE Nombre = 'Comprador'");

    if (!rol.recordset.length) {
      return res.status(500).json({
        mensaje: 'Rol Comprador no encontrado'
      });
    }

    const hash = await bcrypt.hash(contrasena, 10);

    const resultado = await conexion.request()
      .input('Nombre', sql.NVarChar(100), nombre.trim())
      .input('Apellido', sql.NVarChar(100), apellido.trim())
      .input('Correo', sql.NVarChar(150), correo.trim())
      .input('ContrasenaHash', sql.NVarChar(255), hash)
      .input('RolID', sql.Int, rol.recordset[0].RolID)
      .execute('dbo.sp_Usuarios_Registrar');

    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      usuario: resultado.recordset[0]
    });

  } catch (error) {
    if ([50003, 2601, 2627].includes(error.number)) {
      return res.status(409).json({
        mensaje: 'El correo ya está registrado'
      });
    }

    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al registrar usuario'
    });
  }
}

// Iniciar sesión
async function iniciarSesion(req, res) {
  try {
    const { correo, contrasena } = req.body;

    if (typeof correo !== 'string' ||
        typeof contrasena !== 'string' ||
        !correo.trim() || !contrasena) {
      return res.status(400).json({
        mensaje: 'Correo y contraseña son obligatorios'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('Correo', sql.NVarChar(150), correo.trim())
      .execute('dbo.sp_Usuarios_ConsultarPorCorreo');

    const usuario = resultado.recordset[0];

    if (!usuario || !usuario.Activo ||
        !await bcrypt.compare(contrasena, usuario.ContrasenaHash)) {
      return res.status(401).json({
        mensaje: 'Credenciales incorrectas'
      });
    }

    await promisify(req.session.regenerate).call(req.session);

    req.session.usuario = {
      id: usuario.UsuarioID,
      nombre: usuario.Nombre,
      apellido: usuario.Apellido,
      correo: usuario.Correo,
      rol: usuario.Rol
    };

    await promisify(req.session.save).call(req.session);

    return res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: req.session.usuario
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al iniciar sesión'
    });
  }
}

// Consultar sesión
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

// Cerrar sesión
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
    console.error(error);
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
