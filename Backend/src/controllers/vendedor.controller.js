const { sql, getPool } = require('../config/database');

function errorVendedor(res, error) {
  const errores = {
    50101: 400,
    50102: 403,
    50103: 409,
    50104: 404,
    50105: 400,
    50106: 404
  };

  if (errores[error.number]) {
    return res.status(errores[error.number]).json({
      mensaje: error.message
    });
  }

  console.error(error);
  return res.status(500).json({
    mensaje: 'Error al procesar vendedor'
  });
}

async function listarVendedores(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('SoloActivos', sql.Bit, 1)
      .execute('dbo.sp_Vendedores_Listar');

    return res.json(resultado.recordset);
  } catch (error) {
    return errorVendedor(res, error);
  }
}

async function consultarVendedor(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('VendedorID', sql.Int, id)
      .execute('dbo.sp_Vendedores_ConsultarPorID');

    if (!resultado.recordset.length) {
      return res.status(404).json({
        mensaje: 'Vendedor no encontrado'
      });
    }

    const vendedor = resultado.recordset[0];

    // No exponer datos personales de vendedores inactivos.
    if (!vendedor.Activo) {
      return res.status(404).json({
        mensaje: 'Vendedor no encontrado'
      });
    }

    return res.json(vendedor);
  } catch (error) {
    return errorVendedor(res, error);
  }
}

async function registrarVendedor(req, res) {
  try {
    const { nombreComercial, descripcion } = req.body;

    if (
      typeof nombreComercial !== 'string' ||
      !nombreComercial.trim() ||
      nombreComercial.length > 150 ||
      (descripcion != null &&
        (typeof descripcion !== 'string' || descripcion.length > 500))
    ) {
      return res.status(400).json({
        mensaje: 'Datos del vendedor inválidos'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .input('NombreComercial', sql.NVarChar(150), nombreComercial)
      .input('Descripcion', sql.NVarChar(500), descripcion ?? null)
      .execute('dbo.sp_Vendedores_Registrar');

    return res.status(201).json({
      mensaje: 'Vendedor registrado correctamente',
      vendedor: resultado.recordset[0]
    });
  } catch (error) {
    return errorVendedor(res, error);
  }
}

async function actualizarVendedor(req, res) {
  try {
    const id = Number(req.params.id);
    const { nombreComercial, descripcion } = req.body;

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      typeof nombreComercial !== 'string' ||
      !nombreComercial.trim() ||
      nombreComercial.length > 150 ||
      (descripcion != null &&
        (typeof descripcion !== 'string' || descripcion.length > 500))
    ) {
      return res.status(400).json({
        mensaje: 'Datos del vendedor inválidos'
      });
    }

    const conexion = await getPool();

    // Verificar que el vendedor pertenece al usuario.
    const propietario = await conexion.request()
      .input('VendedorID', sql.Int, id)
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .execute('dbo.sp_Vendedores_ValidarPropietario');

    if (!propietario.recordset.length) {
      return res.status(403).json({
        mensaje: 'No puede modificar este vendedor'
      });
    }

    const resultado = await conexion.request()
      .input('VendedorID', sql.Int, id)
      .input('NombreComercial', sql.NVarChar(150), nombreComercial)
      .input('Descripcion', sql.NVarChar(500), descripcion ?? null)
      .execute('dbo.sp_Vendedores_Actualizar');

    return res.json({
      mensaje: 'Vendedor actualizado correctamente',
      vendedor: resultado.recordset[0]
    });
  } catch (error) {
    return errorVendedor(res, error);
  }
}

async function desactivarVendedor(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    const conexion = await getPool();

    // Solo un administrador puede desactivar vendedores.
    const resultado = await conexion.request()
      .input('VendedorID', sql.Int, id)
      .execute('dbo.sp_Vendedores_Desactivar');

    return res.json({
      mensaje: 'Vendedor desactivado correctamente',
      vendedor: resultado.recordset[0]
    });
  } catch (error) {
    return errorVendedor(res, error);
  }
}

module.exports = {
  listarVendedores,
  consultarVendedor,
  registrarVendedor,
  actualizarVendedor,
  desactivarVendedor
};
