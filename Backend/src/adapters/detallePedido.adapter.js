/**
 * Adapta un registro de detalle de pedido devuelto por PostgreSQL
 * al contrato JSON que consume el frontend.
 *
 * @param {object} detalle Fila proveniente de sp_detallespedido_listarporpedido
 * @returns {object} Detalle de pedido con las propiedades de la API
 */
function adaptarDetallePedido(detalle) {
  return {
    DetallePedidoID: detalle.detallepedidoid,
    PedidoID: detalle.pedidoid,
    ProductoID: detalle.productoid,
    Cantidad: detalle.cantidad,
    PrecioUnitario: detalle.preciounitario,
    Subtotal: detalle.subtotal
  };
}

module.exports = { adaptarDetallePedido };
