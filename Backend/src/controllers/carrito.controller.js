const { sql, getPool } = require('../config/database');

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
  obtenerOCrearCarrito,
  consultarCarrito,
  vaciarCarrito
};
