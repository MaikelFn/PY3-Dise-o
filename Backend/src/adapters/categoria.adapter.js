/**
 * Adapta un registro de categoría devuelto por PostgreSQL
 * al contrato JSON que consume el frontend.
 *
 * @param {object} categoria Fila proveniente de una función sp_categorias_*
 * @returns {object} Categoría con las propiedades de la API
 */
function adaptarCategoria(categoria) {
  return {
    CategoriaID: categoria.categoriaid,
    Nombre: categoria.nombre,
    Descripcion: categoria.descripcion
  };
}

module.exports = { adaptarCategoria };
