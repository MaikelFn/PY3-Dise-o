/**
 * Adapta un registro de inventario devuelto por PostgreSQL
 * al contrato JSON que consume el frontend.
 *
 * @param {object} inventario Fila proveniente de una función sp_inventarios_*
 * @returns {object} Inventario con las propiedades de la API
 */
function adaptarInventario(inventario) {
  return {
    InventarioID: inventario.inventarioid,
    ProductoID: inventario.productoid,
    CantidadDisponible: inventario.cantidaddisponible,
    CantidadReservada: inventario.cantidadreservada
  };
}

module.exports = { adaptarInventario };
