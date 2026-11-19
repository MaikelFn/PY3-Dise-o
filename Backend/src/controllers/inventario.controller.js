const { getPool } = require('../config/database');

// Consultar inventario
async function consultarInventario(req, res) {
  try {
    const productoID = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_inventarios_consultarporproducto($1)',
      [productoID]
    );

    if (!resultado.rows.length) {
      return res.status(404).json({
        mensaje: 'Inventario no encontrado'
      });
    }

    const i = resultado.rows[0];

    return res.json({
      InventarioID: i.inventarioid,
      ProductoID: i.productoid,
      CantidadDisponible: i.cantidaddisponible,
      CantidadReservada: i.cantidadreservada
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al consultar inventario'
    });
  }
}

// Agregar existencias
async function agregarExistencias(req, res) {
  try {
    const productoID = Number(req.params.id);
    const { cantidad } = req.body;

    const conexion = await getPool();

    const vendedor = await conexion.query(
      'SELECT * FROM public.sp_vendedores_obtenerporusuario($1)',
      [req.session.usuario.id]
    );

    if (!vendedor.rows.length) {
      return res.status(403).json({
        mensaje: 'No tiene un perfil de vendedor activo'
      });
    }

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_inventarios_agregarexistencias($1, $2, $3)',
      [
        productoID,
        vendedor.rows[0].vendedorid,
        cantidad
      ]
    );

    const i = resultado.rows[0];

    return res.json({
      mensaje: 'Existencias agregadas correctamente',
      inventario: {
        InventarioID: i.inventarioid,
        ProductoID: i.productoid,
        CantidadDisponible: i.cantidaddisponible,
        CantidadReservada: i.cantidadreservada
      }
    });

  } catch (error) {
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
