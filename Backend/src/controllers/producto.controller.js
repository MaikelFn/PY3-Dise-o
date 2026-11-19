const { getPool } = require('../config/database');

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
      Activo: p.activo
    })));

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al listar productos'
    });
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
      Activo: p.activo
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al consultar producto'
    });
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
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al crear producto'
    });
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
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al actualizar producto'
    });
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
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al desactivar producto'
    });
  }
}

module.exports = {
  listarProductos,
  consultarProducto,
  crearProducto,
  actualizarProducto,
  desactivarProducto
};
