/**
 * Adapta un registro de dirección devuelto por PostgreSQL
 * al contrato JSON que consume el frontend.
 *
 * @param {object} direccion Fila proveniente de una función sp_direcciones_*
 * @returns {object} Dirección con las propiedades de la API
 */
function adaptarDireccion(direccion) {
  return {
    DireccionID: direccion.direccionid,
    UsuarioID: direccion.usuarioid,
    Provincia: direccion.provincia,
    Canton: direccion.canton,
    Distrito: direccion.distrito,
    Detalle: direccion.detalle,
    Principal: direccion.principal
  };
}

module.exports = { adaptarDireccion };
