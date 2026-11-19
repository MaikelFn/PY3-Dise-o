const { getPool } = require('../config/database');

// Listar detalles del carrito
async function listarDetalles(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_detallescarrito_listarporusuario($1)',
      [req.session.usuario.id]
    );

    return res.json(resultado.rows);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al listar detalles del carrito'
    });
  }
}

// Agregar producto al carrito
async function agregarDetalle(req, res) {
  try {
    const { productoID, cantidad } = req.body;

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_detallescarrito_agregar($1, $2, $3)',
      [req.session.usuario.id, productoID, cantidad]
    );

    return res.status(201).json({
      mensaje: 'Producto agregado al carrito',
      detalles: resultado.rows
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al agregar producto al carrito'
    });
  }
}

// Actualizar cantidad
async function actualizarCantidad(req, res) {
  try {
    const productoID = Number(req.params.productoID);
    const { cantidad } = req.body;

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_detallescarrito_actualizarcantidad($1, $2, $3)',
      [req.session.usuario.id, productoID, cantidad]
    );

    return res.json({
      mensaje: 'Cantidad actualizada correctamente',
      detalles: resultado.rows
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al actualizar cantidad'
    });
  }
}

// Eliminar producto del carrito
async function eliminarDetalle(req, res) {
  try {
    const productoID = Number(req.params.productoID);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_detallescarrito_eliminar($1, $2)',
      [req.session.usuario.id, productoID]
    );

    return res.json({
      mensaje: 'Producto eliminado del carrito',
      detalles: resultado.rows
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al eliminar producto del carrito'
    });
  }
}

module.exports = {
  listarDetalles,
  agregarDetalle,
  actualizarCantidad,
  eliminarDetalle
};
