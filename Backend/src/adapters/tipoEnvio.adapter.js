/**
 * Adapta un registro de tipo de envío devuelto por PostgreSQL
 * al contrato JSON que consume el frontend.
 *
 * @param {object} tipoEnvio Fila proveniente de sp_tiposenvio_listar
 * @returns {object} Tipo de envío con las propiedades de la API
 */
function adaptarTipoEnvio(tipoEnvio) {
  return {
    TipoEnvioID: tipoEnvio.tipoenvioid,
    Nombre: tipoEnvio.nombre,
    Descripcion: tipoEnvio.descripcion,
    Costo: tipoEnvio.costobase
  };
}

module.exports = { adaptarTipoEnvio };
