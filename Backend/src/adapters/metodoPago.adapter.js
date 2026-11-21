/**
 * Adapta un registro de método de pago devuelto por PostgreSQL
 * al contrato JSON que consume el frontend.
 *
 * @param {object} metodoPago Fila proveniente de sp_metodospago_listar
 * @returns {object} Método de pago con las propiedades de la API
 */
function adaptarMetodoPago(metodoPago) {
  return {
    MetodoPagoID: metodoPago.metodopagoid,
    Nombre: metodoPago.nombre,
    Descripcion: metodoPago.descripcion
  };
}

module.exports = { adaptarMetodoPago };
