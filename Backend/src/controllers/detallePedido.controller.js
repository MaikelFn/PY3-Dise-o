const { sql, getPool } = require('../config/database');
const { usuarioPuedeVerPedido } = require('./pedido.controller');

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

    if (!await usuarioPuedeVerPedido(
      conexion, pedidoID, req.session.usuario
    )) {
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
