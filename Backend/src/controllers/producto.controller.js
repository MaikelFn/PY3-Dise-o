const { getPool } = require('../config/database');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { manejarErrorPostgres } = require('../utils/postgresErrors');

// Listar productos
async function listarProductos(req, res) {
  try {
    const { categoriaID, vendedorID, busqueda } = req.query;

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_productos_listar($1, $2, $3, $4)',
      [
        categoriaID || null,
        vendedorID || null,
        busqueda || null,
        true
      ]
    );

    return res.json(resultado.rows.map(p => ({
      ProductoID: p.productoid,
      VendedorID: p.vendedorid,
      CategoriaID: p.categoriaid,
      Nombre: p.nombre,
      Descripcion: p.descripcion,
      Precio: p.precio,
      ImagenURL: p.imagenprincipal,
      CantidadDisponible: p.cantidaddisponible,
      Activo: p.activo
    })));

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar productos');
  }
}

// Consultar producto por ID
async function consultarProducto(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_productos_consultarporid($1)',
      [req.params.id]
    );

    const p = resultado.rows[0];

    if (!p || !p.activo) {
      return res.status(404).json({
        mensaje: 'Producto no encontrado'
      });
    }

    return res.json({
      ProductoID: p.productoid,
      VendedorID: p.vendedorid,
      CategoriaID: p.categoriaid,
      Nombre: p.nombre,
      Descripcion: p.descripcion,
      Precio: p.precio,
      ImagenURL: p.imagenprincipal,
      CantidadDisponible: p.cantidaddisponible,
      Activo: p.activo
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al consultar producto');
  }
}

// Crear producto
async function crearProducto(req, res) {
  try {
    const { categoriaID, nombre, descripcion, precio } = req.body;

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
      'SELECT * FROM public.sp_productos_crear($1, $2, $3, $4, $5)',
      [
        vendedor.rows[0].vendedorid,
        Number(categoriaID),
        nombre.trim(),
        descripcion ?? null,
        precio
      ]
    );

    const p = resultado.rows[0];

    return res.status(201).json({
      mensaje: 'Producto creado correctamente',
      producto: {
        ProductoID: p.productoid,
        VendedorID: p.vendedorid,
        CategoriaID: p.categoriaid,
        Nombre: p.nombre,
        Descripcion: p.descripcion,
        Precio: p.precio,
        Activo: p.activo
      }
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al crear producto');
  }
}

function detectImageType(buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { mimeType: 'image/jpeg', extension: '.jpg' };
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
    ]))
  ) {
    return { mimeType: 'image/png', extension: '.png' };
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mimeType: 'image/webp', extension: '.webp' };
  }

  return null;
}

async function publicarProducto(req, res) {
  const categoriaID = Number(req.body.categoriaID);
  const precio = Number(req.body.precio);
  const cantidad = Number(req.body.cantidad);
  const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
  const descripcion = typeof req.body.descripcion === 'string'
    ? req.body.descripcion.trim()
    : '';

  if (
    !nombre ||
    nombre.length > 150 ||
    !Number.isInteger(categoriaID) ||
    categoriaID < 1 ||
    !Number.isFinite(precio) ||
    precio <= 0 ||
    !Number.isInteger(cantidad) ||
    cantidad < 1 ||
    cantidad > 2147483647 ||
    descripcion.length > 1000
  ) {
    return res.status(400).json({
      mensaje: 'Revisa el nombre, categoría, precio, existencias y descripción.'
    });
  }

  if (!req.file) {
    return res.status(400).json({
      mensaje: 'Selecciona una foto para publicar el producto.'
    });
  }

  const imageType = detectImageType(req.file.buffer);

  if (!imageType || imageType.mimeType !== req.file.mimetype) {
    return res.status(415).json({
      mensaje: 'El contenido del archivo no corresponde a una imagen JPG, PNG o WebP válida.'
    });
  }

  const fileName = `${crypto.randomBytes(16).toString('hex')}${imageType.extension}`;
  const imageDirectory = path.join(__dirname, '../../public/productos');
  const imagePath = path.join(imageDirectory, fileName);
  const imageURL = `/imagenes/productos/${fileName}`;
  let client;
  let transactionStarted = false;
  let imageWritten = false;

  try {
    const connection = await getPool();
    client = await connection.connect();
    await client.query('BEGIN');
    transactionStarted = true;

    const seller = await client.query(
      'SELECT * FROM public.sp_vendedores_obtenerporusuario($1)',
      [req.session.usuario.id]
    );

    if (!seller.rows.length) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.status(403).json({
        mensaje: 'No tiene un perfil de vendedor activo.'
      });
    }

    const sellerID = seller.rows[0].vendedorid;
    const createdProduct = await client.query(
      'SELECT * FROM public.sp_productos_crear($1, $2, $3, $4, $5)',
      [sellerID, categoriaID, nombre, descripcion || null, precio]
    );
    const product = createdProduct.rows[0];

    if (!product) {
      throw new Error('El procedimiento no devolvió el producto creado.');
    }

    await client.query(
      'SELECT * FROM public.sp_imagenesproducto_agregar($1, $2, $3, $4, $5)',
      [product.productoid, sellerID, imageURL, true, 0]
    );
    await client.query(
      'SELECT * FROM public.sp_inventarios_agregarexistencias($1, $2, $3)',
      [product.productoid, sellerID, cantidad]
    );

    await fs.mkdir(imageDirectory, { recursive: true });
    const imageFile = await fs.open(imagePath, 'wx');
    imageWritten = true;
    try {
      await imageFile.writeFile(req.file.buffer);
    } finally {
      await imageFile.close();
    }

    await client.query('COMMIT');
    transactionStarted = false;

    return res.status(201).json({
      mensaje: 'Producto publicado correctamente.',
      producto: {
        ProductoID: product.productoid,
        VendedorID: product.vendedorid,
        CategoriaID: product.categoriaid,
        Nombre: product.nombre,
        Descripcion: product.descripcion,
        Precio: product.precio,
        ImagenURL: imageURL,
        CantidadDisponible: cantidad,
        Activo: product.activo
      }
    });
  } catch (error) {
    if (transactionStarted && client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error al revertir la publicación del producto:', rollbackError);
      }
    }

    if (imageWritten) {
      try {
        await fs.unlink(imagePath);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') {
          console.error('Error al limpiar la imagen de un producto no publicado:', cleanupError);
        }
      }
    }

    return manejarErrorPostgres(error, res, 'Error al publicar producto.');
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Actualizar producto
async function actualizarProducto(req, res) {
  try {
    const productoID = Number(req.params.id);
    const { categoriaID, nombre, descripcion, precio } = req.body;

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
      'SELECT * FROM public.sp_productos_actualizar($1, $2, $3, $4, $5, $6)',
      [
        productoID,
        vendedor.rows[0].vendedorid,
        Number(categoriaID),
        nombre.trim(),
        descripcion ?? null,
        precio
      ]
    );

    const p = resultado.rows[0];

    return res.json({
      mensaje: 'Producto actualizado correctamente',
      producto: {
        ProductoID: p.productoid,
        VendedorID: p.vendedorid,
        CategoriaID: p.categoriaid,
        Nombre: p.nombre,
        Descripcion: p.descripcion,
        Precio: p.precio,
        Activo: p.activo
      }
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al actualizar producto');
  }
}

// Desactivar producto
async function desactivarProducto(req, res) {
  try {
    const productoID = Number(req.params.id);

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
      'SELECT * FROM public.sp_productos_desactivar($1, $2)',
      [productoID, vendedor.rows[0].vendedorid]
    );

    const p = resultado.rows[0];

    return res.json({
      mensaje: 'Producto desactivado correctamente',
      producto: {
        ProductoID: p.productoid,
        VendedorID: p.vendedorid,
        CategoriaID: p.categoriaid,
        Nombre: p.nombre,
        Descripcion: p.descripcion,
        Precio: p.precio,
        Activo: p.activo
      }
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al desactivar producto');
  }
}

module.exports = {
  listarProductos,
  consultarProducto,
  crearProducto,
  publicarProducto,
  actualizarProducto,
  desactivarProducto
};
