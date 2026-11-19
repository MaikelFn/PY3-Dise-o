const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');

// Listar imágenes
async function listarImagenes(req, res) {
  try {
    const productoID = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_imagenesproducto_listarporproducto($1)',
      [productoID]
    );

    const imagenes = resultado.rows.map(i => ({
      ImagenID: i.imagenid,
      ProductoID: i.productoid,
      ImagenURL: i.imagenurl,
      EsPrincipal: i.esprincipal,
      Orden: i.orden
    }));

    return res.json(imagenes);

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar imágenes');
  }
}

// Agregar imagen
async function agregarImagen(req, res) {
  try {
    const productoID = Number(req.params.id);
    const { imagenURL, esPrincipal = false, orden = 0 } = req.body;

    if (!/^https?:\/\/\S+$/i.test(imagenURL.trim())) {
      return res.status(400).json({
        mensaje: 'Datos de imagen inválidos'
      });
    }

    const conexion = await getPool();

    const vendedor = await conexion.query(
      'SELECT * FROM public.sp_vendedores_obtenerporusuario($1)',
      [req.session.usuario.id]
    );

    if (!vendedor.rows.length) {
      return res.status(403).json({
        mensaje: 'No tiene un perfil de vendedor activo'
      });
    }

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_imagenesproducto_agregar($1, $2, $3, $4, $5)',
      [
        productoID,
        vendedor.rows[0].vendedorid,
        imagenURL.trim(),
        esPrincipal,
        orden
      ]
    );

    const i = resultado.rows[0];

    return res.status(201).json({
      mensaje: 'Imagen agregada correctamente',
      imagen: {
        ImagenID: i.imagenid,
        ProductoID: i.productoid,
        ImagenURL: i.imagenurl,
        EsPrincipal: i.esprincipal,
        Orden: i.orden
      }
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al agregar imagen');
  }
}

// Establecer imagen principal
async function establecerPrincipal(req, res) {
  try {
    const imagenID = Number(req.params.id);

    const conexion = await getPool();

    const vendedor = await conexion.query(
      'SELECT * FROM public.sp_vendedores_obtenerporusuario($1)',
      [req.session.usuario.id]
    );

    if (!vendedor.rows.length) {
      return res.status(403).json({
        mensaje: 'No tiene un perfil de vendedor activo'
      });
    }

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_imagenesproducto_establecerprincipal($1, $2)',
      [imagenID, vendedor.rows[0].vendedorid]
    );

    const imagenes = resultado.rows.map(i => ({
      ImagenID: i.imagenid,
      ProductoID: i.productoid,
      ImagenURL: i.imagenurl,
      EsPrincipal: i.esprincipal,
      Orden: i.orden
    }));

    return res.json({
      mensaje: 'Imagen principal actualizada correctamente',
      imagenes
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al establecer imagen principal');
  }
}

// Eliminar imagen
async function eliminarImagen(req, res) {
  try {
    const imagenID = Number(req.params.id);

    const conexion = await getPool();

    const vendedor = await conexion.query(
      'SELECT * FROM public.sp_vendedores_obtenerporusuario($1)',
      [req.session.usuario.id]
    );

    if (!vendedor.rows.length) {
      return res.status(403).json({
        mensaje: 'No tiene un perfil de vendedor activo'
      });
    }

    await conexion.query(
      'SELECT * FROM public.sp_imagenesproducto_eliminar($1, $2)',
      [imagenID, vendedor.rows[0].vendedorid]
    );

    return res.json({
      mensaje: 'Imagen eliminada correctamente'
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al eliminar imagen');
  }
}

module.exports = {
  listarImagenes,
  agregarImagen,
  establecerPrincipal,
  eliminarImagen
};
