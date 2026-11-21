/**
 * Adapta un registro de estado de pedido devuelto por PostgreSQL
 * al contrato JSON que consume el frontend.
 *
 * @param {object} estado Fila proveniente de sp_estadospedido_listar
 * @returns {object} Estado de pedido con las propiedades de la API
 */
function adaptarEstadoPedido(estado) {
  return {
    EstadoPedidoID: estado.estadopedidoid,
    Nombre: estado.nombre,
    Descripcion: estado.descripcion
  };
}

module.exports = { adaptarEstadoPedido };
