const { sql, getPool } = require('../config/database');

async function listarDetallesPedido(req, res) {
  try {
    const pedidoID = Number(req.params.id);

    if (
      !Number.isSafeInteger(pedidoID) ||
      pedidoID <= 0 ||
      pedidoID > 2147483647
    ) {
      return res.status(400).json({
        mensaje: 'ID de pedido inválido'
      });
    }

    const conexion = await getPool();

    const acceso = await conexion.request()
      .input('PedidoID', sql.Int, pedidoID)
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .query(`
        SELECT P.PedidoID
        FROM dbo.Pedidos P
        WHERE P.PedidoID = @PedidoID
          AND (
            P.UsuarioID = @UsuarioID
            OR EXISTS (
              SELECT 1
              FROM dbo.Usuarios U
              INNER JOIN dbo.Roles R ON R.RolID = U.RolID
              WHERE U.UsuarioID = @UsuarioID
                AND R.Nombre = 'Administrador'
            )
          )
      `);

    if (!acceso.recordset.length) {
      return res.status(404).json({
        mensaje: 'Pedido no encontrado'
      });
    }

    const resultado = await conexion.request()
      .input('PedidoID', sql.Int, pedidoID)
      .execute('dbo.sp_DetallesPedido_ListarPorPedido');

    return res.json(resultado.recordset);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al consultar detalles del pedido'
    });
  }
}

module.exports = { listarDetallesPedido };
