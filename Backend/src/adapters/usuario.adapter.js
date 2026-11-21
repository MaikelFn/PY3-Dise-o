/**
 * Adapta un registro de usuario devuelto por PostgreSQL
 * al contrato JSON que consume el frontend.
 *
 * @param {object} usuario Fila proveniente de una función sp_usuarios_*
 * @returns {object} Usuario con las propiedades de la API
 */
function adaptarUsuario(usuario) {
  return {
    UsuarioID: usuario.usuarioid,
    Nombre: usuario.nombre,
    Apellido: usuario.apellido,
    Correo: usuario.correo,
    RolID: usuario.rolid,
    Rol: usuario.rol,
    FechaRegistro: usuario.fecharegistro,
    Activo: usuario.activo
  };
}

module.exports = { adaptarUsuario };
