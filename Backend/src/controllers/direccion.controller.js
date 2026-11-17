const { sql, getPool } = require('../config/database');

function errorDireccion(res, error) {
  const errores = {
    50201: 404,
    50202: 400,
    50203: 404,
    50204: 400,
    50205: 404,
    50206: 409
  };

  if (errores[error.number]) {
    return res.status(errores[error.number]).json({
      mensaje: error.message
    });
  }

  console.error(error);
  return res.status(500).json({
    mensaje: 'Error al procesar dirección'
  });
}

function validarDireccion(datos) {
  const limites = {
    provincia: 100,
    canton: 100,
    distrito: 100,
    detalle: 300
  };

  for (const [campo, limite] of Object.entries(limites)) {
    if (
      typeof datos[campo] !== 'string' ||
      !datos[campo].trim() ||
      datos[campo].length > limite
    ) {
      return false;
    }
  }

  return datos.principal === undefined ||
    typeof datos.principal === 'boolean';
}

async function listarDirecciones(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .execute('dbo.sp_Direcciones_ListarPorUsuario');

    return res.json(resultado.recordset);
  } catch (error) {
    return errorDireccion(res, error);
  }
}

async function agregarDireccion(req, res) {
  try {
    if (!validarDireccion(req.body)) {
      return res.status(400).json({
        mensaje: 'Datos de dirección inválidos'
      });
    }

    const {
      provincia,
      canton,
      distrito,
      detalle,
      principal = false
    } = req.body;

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .input('Provincia', sql.NVarChar(100), provincia)
      .input('Canton', sql.NVarChar(100), canton)
      .input('Distrito', sql.NVarChar(100), distrito)
      .input('Detalle', sql.NVarChar(300), detalle)
      .input('Principal', sql.Bit, principal)
      .execute('dbo.sp_Direcciones_Agregar');

    return res.status(201).json({
      mensaje: 'Dirección agregada correctamente',
      direccion: resultado.recordset[0]
    });
  } catch (error) {
    return errorDireccion(res, error);
  }
}

async function actualizarDireccion(req, res) {
  try {
    const id = Number(req.params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !validarDireccion(req.body) ||
      typeof req.body.principal !== 'boolean'
    ) {
      return res.status(400).json({
        mensaje: 'Datos de dirección inválidos'
      });
    }

    const {
      provincia,
      canton,
      distrito,
      detalle,
      principal
    } = req.body;

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('DireccionID', sql.Int, id)
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .input('Provincia', sql.NVarChar(100), provincia)
      .input('Canton', sql.NVarChar(100), canton)
      .input('Distrito', sql.NVarChar(100), distrito)
      .input('Detalle', sql.NVarChar(300), detalle)
      .input('Principal', sql.Bit, principal)
      .execute('dbo.sp_Direcciones_Actualizar');

    return res.json({
      mensaje: 'Dirección actualizada correctamente',
      direccion: resultado.recordset[0]
    });
  } catch (error) {
    return errorDireccion(res, error);
  }
}

async function eliminarDireccion(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        mensaje: 'ID de dirección inválido'
      });
    }

    const conexion = await getPool();

    await conexion.request()
      .input('DireccionID', sql.Int, id)
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .execute('dbo.sp_Direcciones_Eliminar');

    return res.json({
      mensaje: 'Dirección eliminada correctamente'
    });
  } catch (error) {
    return errorDireccion(res, error);
  }
}

module.exports = {
  listarDirecciones,
  agregarDireccion,
  actualizarDireccion,
  eliminarDireccion
};
