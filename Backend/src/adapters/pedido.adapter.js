/**
 * Adapta un registro de pedido devuelto por PostgreSQL
 * al contrato JSON de consulta detallada.
 *
 * @param {object} pedido Fila proveniente de una función sp_pedidos_*
 * @returns {object} Pedido con las propiedades de la API
 */
function adaptarPedido(pedido) {
  return {
    PedidoID: pedido.pedidoid,
    UsuarioID: pedido.usuarioid,
    DireccionID: pedido.direccionid,
    TipoEnvioID: pedido.tipoenvioid,
    EstadoPedidoID: pedido.estadopedidoid,
    FechaPedido: pedido.fechapedido,
    Total: pedido.total
  };
}

/**
 * Adapta un registro de la lista de pedidos del usuario
 * al contrato JSON correspondiente.
 *
 * @param {object} pedido Fila proveniente de sp_pedidos_listarporusuario
 * @returns {object} Pedido de lista con las propiedades de la API
 */
function adaptarPedidoLista(pedido) {
  return {
    PedidoID: pedido.pedidoid,
    UsuarioID: pedido.usuarioid,
    DireccionID: pedido.direccionid,
    Estado: pedido.estadopedido,
    FechaPedido: pedido.fechapedido,
    Subtotal: pedido.subtotal,
    Total: pedido.total
  };
}

/**
 * Adapta un registro de la lista administrativa de pedidos
 * al contrato JSON correspondiente.
 *
 * @param {object} pedido Fila proveniente de sp_pedidos_listaradmin
 * @returns {object} Pedido administrativo con las propiedades de la API
 */
function adaptarPedidoAdmin(pedido) {
  return {
    PedidoID: pedido.pedidoid,
    FechaPedido: pedido.fechapedido,
    Estado: pedido.estado,
    Comprador: pedido.comprador,
    CantidadProductos: pedido.cantidadproductos,
    Total: pedido.total
  };
}

/**
 * Adapta un registro de la lista de ventas del vendedor
 * al contrato JSON correspondiente.
 *
 * @param {object} pedido Fila proveniente de sp_pedidos_listarporvendedor
 * @returns {object} Venta del vendedor con las propiedades de la API
 */
function adaptarPedidoVendedor(pedido) {
  return {
    PedidoID: pedido.pedidoid,
    FechaPedido: pedido.fechapedido,
    Estado: pedido.estado,
    Comprador: pedido.comprador,
    CantidadProductos: pedido.cantidadproductos,
    SubtotalVendedor: pedido.subtotalvendedor
  };
}

/**
 * Adapta un registro de pedido devuelto tras confirmarlo
 * o cancelarlo al contrato JSON reducido de la API.
 *
 * @param {object} pedido Fila proveniente de sp_pedidos_confirmar
 *   o sp_pedidos_cancelar
 * @returns {object} Pedido reducido con las propiedades de la API
 */
function adaptarPedidoResumen(pedido) {
  return {
    PedidoID: pedido.pedidoid,
    UsuarioID: pedido.usuarioid,
    EstadoPedidoID: pedido.estadopedidoid,
    Total: pedido.total
  };
}

module.exports = {
  adaptarPedido,
  adaptarPedidoLista,
  adaptarPedidoAdmin,
  adaptarPedidoVendedor,
  adaptarPedidoResumen
};
