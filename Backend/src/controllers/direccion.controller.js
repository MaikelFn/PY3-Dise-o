
const { getPool } = require('../config/database');

// Listar direcciones
async function listarDirecciones(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_direcciones_listarporusuario($1)',
      [req.session.usuario.id]
    );

    return res.json(resultado.rows.map(d => ({
      DireccionID: d.direccionid,
      UsuarioID: d.usuarioid,
      Provincia: d.provincia,
      Canton: d.canton,
      Distrito: d.distrito,
      Detalle: d.detalle,
      Principal: d.principal
    })));

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al listar direcciones'
    });
  }
}

// Agregar dirección
async function agregarDireccion(req, res) {
  try {
    const { provincia, canton, distrito, detalle, principal = false } = req.body;
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_direcciones_agregar($1, $2, $3, $4, $5, $6)',
      [
        req.session.usuario.id,
        provincia,
        canton,
        distrito,
        detalle,
        principal
      ]
    );

    const d = resultado.rows[0];

    return res.status(201).json({
      mensaje: 'Dirección agregada correctamente',
      direccion: {
        DireccionID: d.direccionid,
        UsuarioID: d.usuarioid,
        Provincia: d.provincia,
        Canton: d.canton,
        Distrito: d.distrito,
        Detalle: d.detalle,
        Principal: d.principal
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al agregar dirección'
    });
  }
}

// Actualizar dirección
async function actualizarDireccion(req, res) {
  try {
    const id = Number(req.params.id);

    const { provincia, canton, distrito, detalle, principal } = req.body;
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_direcciones_actualizar($1, $2, $3, $4, $5, $6, $7)',
      [
        id,
        req.session.usuario.id,
        provincia,
        canton,
        distrito,
        detalle,
        principal
      ]
    );

    const d = resultado.rows[0];

    return res.json({
      mensaje: 'Dirección actualizada correctamente',
      direccion: {
        DireccionID: d.direccionid,
        UsuarioID: d.usuarioid,
        Provincia: d.provincia,
        Canton: d.canton,
        Distrito: d.distrito,
        Detalle: d.detalle,
        Principal: d.principal
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al actualizar dirección'
    });
  }
}

// Eliminar dirección
async function eliminarDireccion(req, res) {
  try {
    const id = Number(req.params.id);

    const conexion = await getPool();

    await conexion.query(
      'SELECT * FROM public.sp_direcciones_eliminar($1, $2)',
      [id, req.session.usuario.id]
    );

    return res.json({
      mensaje: 'Dirección eliminada correctamente'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al eliminar dirección'
    });
  }
}

module.exports = {
  listarDirecciones,
  agregarDireccion,
  actualizarDireccion,
  eliminarDireccion
};
