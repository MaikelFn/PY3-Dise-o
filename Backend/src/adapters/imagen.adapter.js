/**
 * Adapta un registro de imagen de producto devuelto por PostgreSQL
 * al contrato JSON que consume el frontend.
 *
 * @param {object} imagen Fila proveniente de una función sp_imagenesproducto_*
 * @returns {object} Imagen con las propiedades de la API
 */
function adaptarImagen(imagen) {
  return {
    ImagenID: imagen.imagenid,
    ProductoID: imagen.productoid,
    ImagenURL: imagen.imagenurl,
    EsPrincipal: imagen.esprincipal,
    Orden: imagen.orden
  };
}

module.exports = { adaptarImagen };
