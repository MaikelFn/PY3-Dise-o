const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { adaptarImagen } = require('../adapters/imagen.adapter');

function detectImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: '.jpg' };
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mimeType: 'image/png', extension: '.png' };
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { mimeType: 'image/webp', extension: '.webp' };
  }
  return null;
}

// Listar imágenes
async function listarImagenes(req, res) {
  try {
    const productoID = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_imagenesproducto_listarporproducto($1)',
      [productoID]
    );

    const imagenes = resultado.rows.map(adaptarImagen);

    return res.json(imagenes);

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar imágenes');
  }
}

// Agregar imagen
async function agregarImagen(req, res) {
  try {
    const productoID = Number(req.params.id);
    const esPrincipal = req.body.esPrincipal === 'true' || req.body.esPrincipal === true;
    const orden = Number(req.body.orden || 0);

    if (!req.file) {
      return res.status(400).json({ mensaje: 'Selecciona una imagen.' });
    }

    const imageType = detectImageType(req.file.buffer);
    if (!imageType || imageType.mimeType !== req.file.mimetype) {
      return res.status(415).json({
        mensaje: 'La imagen debe ser JPG, PNG o WebP válida.'
      });
    }

    const fileName = `${crypto.randomBytes(16).toString('hex')}${imageType.extension}`;
    const imageDirectory = path.join(__dirname, '../../public/productos');
    const imagePath = path.join(imageDirectory, fileName);
    const imagenURL = `/imagenes/productos/${fileName}`;

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
        imagenURL,
        esPrincipal,
        orden
      ]
    );

    const i = resultado.rows[0];
    await fs.mkdir(imageDirectory, { recursive: true });
    await fs.writeFile(imagePath, req.file.buffer);

    return res.status(201).json({
      mensaje: 'Imagen agregada correctamente',
      imagen: adaptarImagen(i)
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

    const imagenes = resultado.rows.map(adaptarImagen);

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
