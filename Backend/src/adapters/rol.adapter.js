/**
 * Adapta un registro de rol devuelto por PostgreSQL
 * al contrato JSON que consume el frontend.
 *
 * @param {object} rol Fila proveniente de sp_roles_listar
 * @returns {object} Rol con las propiedades de la API
 */
function adaptarRol(rol) {
  return {
    RolID: rol.rolid,
    Nombre: rol.nombre,
    Descripcion: rol.descripcion
  };
}

module.exports = { adaptarRol };
