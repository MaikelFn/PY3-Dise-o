/**
 * Adapta un registro de producto devuelto por PostgreSQL
 * al contrato JSON completo que consume el frontend.
 *
 * @param {object} producto Fila proveniente de una función sp_productos_*
 * @returns {object} Producto con las propiedades de la API
 */
function adaptarProducto(producto) {
  return {
    ProductoID: producto.productoid,
    VendedorID: producto.vendedorid,
    CategoriaID: producto.categoriaid,
    Nombre: producto.nombre,
    Descripcion: producto.descripcion,
    Precio: producto.precio,
    ImagenURL: producto.imagenprincipal,
    CantidadDisponible: producto.cantidaddisponible,
    Activo: producto.activo
  };
}

/**
 * Adapta un registro de producto devuelto por PostgreSQL
 * al contrato JSON reducido usado en las respuestas de
 * creación, actualización y desactivación.
 *
 * @param {object} producto Fila proveniente de una función sp_productos_*
 * @returns {object} Producto sin ImagenURL ni CantidadDisponible
 */
function adaptarProductoResumen(producto) {
  return {
    ProductoID: producto.productoid,
    VendedorID: producto.vendedorid,
    CategoriaID: producto.categoriaid,
    Nombre: producto.nombre,
    Descripcion: producto.descripcion,
    Precio: producto.precio,
    Activo: producto.activo
  };
}

module.exports = { adaptarProducto, adaptarProductoResumen };
