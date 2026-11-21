/**
 * Adapta un registro de carrito devuelto por PostgreSQL
 * al contrato JSON que consume el frontend.
 *
 * @param {object} carrito Fila proveniente de una función sp_carritos_*
 * @returns {object} Carrito con las propiedades de la API
 */
function adaptarCarrito(carrito) {
  return {
    CarritoID: carrito.carritoid,
    UsuarioID: carrito.usuarioid,
    FechaCreacion: carrito.fechacreacion
  };
}

module.exports = { adaptarCarrito };
