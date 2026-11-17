const { sql, getPool } = require('../config/database');


function parsePositiveInteger(value) {
  if (!/^[1-9]\d*$/.test(String(value))) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function handleError(error, res, operation) {
  if ([50803, 50804, 50807].includes(error.number)) {
    return res.status(409).json({ mensaje: 'El producto no está disponible o no hay existencias suficientes' });
  }

  if ([50806, 50808].includes(error.number)) {
    return res.status(404).json({ mensaje: 'El producto no está en el carrito' });
  }

  console.error(`Error al ${operation} producto del carrito:`, error);
  return res.status(500).json({ mensaje: `Error al ${operation} producto del carrito` });
}

async function listarDetalles(req, res) {
  try {
    const conexion = await getPool();
    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .execute('dbo.sp_DetallesCarrito_ListarPorUsuario');

    return res.json(resultado.recordset);
  } catch (error) {
    console.error('Error al consultar el carrito:', error);
    return res.status(500).json({ mensaje: 'Error al consultar el carrito' });
  }
}

async function agregarProducto(req, res) {
  const productoID = parsePositiveInteger(req.body?.productoId);
  const cantidad = parsePositiveInteger(req.body?.cantidad ?? 1);
  if (!productoID || !cantidad) {
    return res.status(400).json({ mensaje: 'Producto y cantidad deben ser números positivos' });
  }

  try {
    const conexion = await getPool();
    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .input('ProductoID', sql.Int, productoID)
      .input('Cantidad', sql.Int, cantidad)
      .execute('dbo.sp_DetallesCarrito_Agregar');

    return res.status(201).json(resultado.recordset);
  } catch (error) {
    return handleError(error, res, 'agregar');
  }
}

async function actualizarCantidad(req, res) {
  const productoID = parsePositiveInteger(req.params.productoId);
  const cantidad = parsePositiveInteger(req.body?.cantidad);
  if (!productoID || !cantidad) {
    return res.status(400).json({ mensaje: 'Producto y cantidad deben ser números positivos' });
  }

  try {
    const conexion = await getPool();
    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .input('ProductoID', sql.Int, productoID)
      .input('Cantidad', sql.Int, cantidad)
      .execute('dbo.sp_DetallesCarrito_ActualizarCantidad');

    return res.json(resultado.recordset);
  } catch (error) {
    return handleError(error, res, 'actualizar');
  }
}

async function eliminarProducto(req, res) {
  const productoID = parsePositiveInteger(req.params.productoId);
  if (!productoID) {
    return res.status(400).json({ mensaje: 'ID de producto inválido' });
  }

  try {
    const conexion = await getPool();
    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .input('ProductoID', sql.Int, productoID)
      .execute('dbo.sp_DetallesCarrito_Eliminar');

    return res.json(resultado.recordset);
  } catch (error) {
    return handleError(error, res, 'eliminar');
async function obtenerOCrearCarrito(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .execute('dbo.sp_Carritos_ObtenerOCrear');

    return res.json(resultado.recordset[0]);
  } catch (error) {
    if (error.number === 50701) {
      return res.status(403).json({ mensaje: error.message });
    }

    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al obtener carrito'
    });
  }
}

async function consultarCarrito(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .execute('dbo.sp_Carritos_ConsultarPorUsuario');

    return res.json(resultado.recordset);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al consultar carrito'
    });
  }
}

async function vaciarCarrito(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .execute('dbo.sp_Carritos_Vaciar');

    return res.json({
      mensaje: 'Carrito vaciado correctamente',
      carrito: resultado.recordset
    });
  } catch (error) {
    if (error.number === 50702) {
      return res.status(404).json({ mensaje: error.message });
    }

    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al vaciar carrito'
    });

  }
}

module.exports = {
  listarDetalles,
  agregarProducto,
  actualizarCantidad,
  eliminarProducto,

  obtenerOCrearCarrito,
  consultarCarrito,
  vaciarCarrito
}; 
