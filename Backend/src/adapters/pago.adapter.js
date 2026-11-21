/**
 * Adapta un registro de pago devuelto por PostgreSQL
 * al contrato JSON que consume el frontend.
 *
 * @param {object} pago Fila proveniente de una función sp_pagos_*
 * @returns {object} Pago con las propiedades de la API
 */
function adaptarPago(pago) {
  return {
    PagoID: pago.pagoid,
    PedidoID: pago.pedidoid,
    MetodoPagoID: pago.metodopagoid,
    Monto: pago.monto,
    Estado: pago.estado,
    FechaPago: pago.fechapago
  };
}

module.exports = { adaptarPago };
