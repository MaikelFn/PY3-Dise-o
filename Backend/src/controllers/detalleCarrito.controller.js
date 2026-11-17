const { sql, getPool } = require('../config/database');

function manejarError(res, error) {
  const errores = {
    50801: 400,
    50802: 403,
    50803: 404,
    50804: 409,
    50805: 400,
    50806: 404,
    50807: 409,
    50808: 404
  };

  if (errores[error.number]) {
    return res.status(errores[error.number]).json({
      mensaje: error.message
    });
  }

  console.error(error);
  return res.status(500).json({
    mensaje: 'Error al procesar detalle del carrito'
  });
}

async function listarDetalles(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .execute('dbo.sp_DetallesCarrito_ListarPorUsuario');

    return res.json(resultado.recordset);
  } catch (error) {
    return manejarError(res, error);
  }
}

async function agregarDetalle(req, res) {
  try {
    const { productoID, cantidad } = req.body;

    if (
      !Number.isInteger(productoID) ||
      productoID <= 0 ||
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {
      return res.status(400).json({
        mensaje: 'Producto o cantidad inválida'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .input('ProductoID', sql.Int, productoID)
      .input('Cantidad', sql.Int, cantidad)
      .execute('dbo.sp_DetallesCarrito_Agregar');

    return res.status(201).json({
      mensaje: 'Producto agregado al carrito',
      detalles: resultado.recordset
    });
  } catch (error) {
    return manejarError(res, error);
  }
}

async function actualizarCantidad(req, res) {
  try {
    const productoID = Number(req.params.productoID);
    const { cantidad } = req.body;

    if (
      !Number.isInteger(productoID) ||
      productoID <= 0 ||
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {
      return res.status(400).json({
        mensaje: 'Producto o cantidad inválida'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .input('ProductoID', sql.Int, productoID)
      .input('Cantidad', sql.Int, cantidad)
      .execute('dbo.sp_DetallesCarrito_ActualizarCantidad');

    return res.json({
      mensaje: 'Cantidad actualizada correctamente',
      detalles: resultado.recordset
    });
  } catch (error) {
    return manejarError(res, error);
  }
}

async function eliminarDetalle(req, res) {
  try {
    const productoID = Number(req.params.productoID);

    if (!Number.isInteger(productoID) || productoID <= 0) {
      return res.status(400).json({
        mensaje: 'ID de producto inválido'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .input('ProductoID', sql.Int, productoID)
      .execute('dbo.sp_DetallesCarrito_Eliminar');

    return res.json({
      mensaje: 'Producto eliminado del carrito',
      detalles: resultado.recordset
    });
  } catch (error) {
    return manejarError(res, error);
  }
}

module.exports = {
  listarDetalles,
  agregarDetalle,
  actualizarCantidad,
  eliminarDetalle
};
