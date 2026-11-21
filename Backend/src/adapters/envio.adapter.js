/**
 * Adapta un registro de envío devuelto por PostgreSQL
 * al contrato JSON que consume el frontend.
 *
 * @param {object} envio Fila proveniente de una función sp_envios_*
 * @returns {object} Envío con las propiedades de la API
 */
function adaptarEnvio(envio) {
  return {
    EnvioID: envio.envioid,
    PedidoID: envio.pedidoid,
    TipoEnvioID: envio.tipoenvioid,
    Estado: envio.estado,
    NumeroSeguimiento: envio.numeroseguimiento,
    FechaEnvio: envio.fechaenvio,
    FechaEntrega: envio.fechaentrega
  };
}

module.exports = { adaptarEnvio };
