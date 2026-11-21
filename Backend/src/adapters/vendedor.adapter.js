/**
 * Adapta un registro de vendedor devuelto por PostgreSQL
 * al contrato JSON que consume el frontend.
 *
 * @param {object} vendedor Fila proveniente de una función sp_vendedores_*
 * @returns {object} Vendedor con las propiedades de la API
 */
function adaptarVendedor(vendedor) {
  return {
    VendedorID: vendedor.vendedorid,
    UsuarioID: vendedor.usuarioid,
    NombreComercial: vendedor.nombrecomercial,
    Descripcion: vendedor.descripcion,
    Activo: vendedor.activo
  };
}

module.exports = { adaptarVendedor };
