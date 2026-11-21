
const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');
const { usuarioPuedeVerPedido } = require('./pedido.controller');
const { adaptarDetallePedido } = require('../adapters/detallePedido.adapter');

async function listarDetallesPedido(req, res) {
  try {
    const pedidoID = Number(req.params.id);

    const conexion = await getPool();

    if (!await usuarioPuedeVerPedido(
      conexion, pedidoID, req.session.usuario
    )) {
      return res.status(404).json({
        mensaje: 'Pedido no encontrado'
      });
    }

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_detallespedido_listarporpedido($1)',
      [pedidoID]
    );

    const detalles = resultado.rows.map(adaptarDetallePedido);

    return res.json(detalles);

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al consultar detalles del pedido');
  }
}

module.exports = { listarDetallesPedido };
