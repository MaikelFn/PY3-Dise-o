const { sql, getPool } = require('../config/database');

async function consultarInventario(req, res) {
  try {
    const productoID = Number(req.params.id);

    if (!Number.isInteger(productoID) || productoID <= 0) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    const conexion = await getPool();
    const resultado = await conexion.request()
      .input('ProductoID', sql.Int, productoID)
      .execute('dbo.sp_Inventarios_ConsultarPorProducto');

    if (!resultado.recordset.length) {
      return res.status(404).json({
        mensaje: 'Inventario no encontrado'
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al consultar inventario'
    });
  }
}

async function agregarExistencias(req, res) {
  try {
    const productoID = Number(req.params.id);
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

    const vendedor = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .query(`
        SELECT V.VendedorID
        FROM dbo.Vendedores V
        INNER JOIN dbo.Usuarios U
          ON U.UsuarioID = V.UsuarioID
        WHERE V.UsuarioID = @UsuarioID
          AND V.Activo = 1
          AND U.Activo = 1
      `);

    if (!vendedor.recordset.length) {
      return res.status(403).json({
        mensaje: 'No tiene un perfil de vendedor activo'
      });
    }

    const resultado = await conexion.request()
      .input('ProductoID', sql.Int, productoID)
      .input('VendedorID', sql.Int, vendedor.recordset[0].VendedorID)
      .input('Cantidad', sql.Int, cantidad)
      .execute('dbo.sp_Inventarios_AgregarExistencias');

    return res.json({
      mensaje: 'Existencias agregadas correctamente',
      inventario: resultado.recordset[0]
    });
  } catch (error) {
    if (error.number === 50601) {
      return res.status(400).json({ mensaje: error.message });
    }

    if (error.number === 50602) {
      return res.status(403).json({ mensaje: error.message });
    }

    if (error.number === 50603) {
      return res.status(409).json({ mensaje: error.message });
    }

    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al agregar existencias'
    });
  }
}

module.exports = {
  consultarInventario,
  agregarExistencias
};
