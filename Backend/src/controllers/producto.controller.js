const { sql, getPool } = require('../config/database');

// Listar productos
async function listarProductos(req, res) {
  try {
    const { categoriaID, vendedorID, busqueda } = req.query;

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('CategoriaID', sql.Int, categoriaID || null)
      .input('VendedorID', sql.Int, vendedorID || null)
      .input('Busqueda', sql.NVarChar(150), busqueda || null)
      .input('SoloActivos', sql.Bit, 1)
      .execute('dbo.sp_Productos_Listar');

    return res.json(resultado.recordset);

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

    const resultado = await conexion.request()
      .input('ProductoID', sql.Int, req.params.id)
      .execute('dbo.sp_Productos_ConsultarPorID');

    if (!resultado.recordset.length || !resultado.recordset[0].Activo) {
      return res.status(404).json({
        mensaje: 'Producto no encontrado'
      });
    }

    return res.json(resultado.recordset[0]);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al consultar producto'
    });
  }
}

async function crearProducto(req, res) {
  try {
    const { categoriaID, nombre, descripcion, precio } = req.body;

    if (!Number.isInteger(Number(categoriaID)) ||
        Number(categoriaID) <= 0 ||
        typeof nombre !== 'string' ||
        !nombre.trim() ||
        nombre.length > 150 ||
        (descripcion != null && typeof descripcion !== 'string') ||
        typeof precio !== 'number' ||
        !Number.isFinite(precio) ||
        precio < 0) {
      return res.status(400).json({
        mensaje: 'Datos del producto inválidos'
      });
    }

    const conexion = await getPool();
    const usuario = req.session.usuario;

    const vendedor = await conexion.request()
      .input('UsuarioID', sql.Int, usuario.id)
      .execute('dbo.sp_Vendedores_ObtenerPorUsuario');

    if (!vendedor.recordset.length) {
      return res.status(403).json({
        mensaje: 'No tiene un perfil de vendedor activo'
      });
    }

    const resultado = await conexion.request()
      .input('VendedorID', sql.Int, vendedor.recordset[0].VendedorID)
      .input('CategoriaID', sql.Int, Number(categoriaID))
      .input('Nombre', sql.NVarChar(150), nombre.trim())
      .input('Descripcion', sql.NVarChar(sql.MAX), descripcion ?? null)
      .input('Precio', sql.Decimal(12, 2), precio)
      .execute('dbo.sp_Productos_Crear');

    return res.status(201).json({
      mensaje: 'Producto creado correctamente',
      producto: resultado.recordset[0]
    });

  } catch (error) {
    if (error.number === 50404) {
      return res.status(404).json({
        mensaje: 'La categoría no existe'
      });
    }

    if (error.number === 50403) {
      return res.status(403).json({
        mensaje: 'El vendedor no está activo'
      });
    }

    if ([50401, 50402].includes(error.number)) {
      return res.status(400).json({
        mensaje: error.message
      });
    }

    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al crear producto'
    });
  }
}

async function actualizarProducto(req, res) {
  try {
    const productoID = Number(req.params.id);
    const { categoriaID, nombre, descripcion, precio } = req.body;

    if (
      !Number.isInteger(productoID) ||
      productoID <= 0 ||
      !Number.isInteger(Number(categoriaID)) ||
      Number(categoriaID) <= 0 ||
      typeof nombre !== 'string' ||
      !nombre.trim() ||
      nombre.length > 150 ||
      (descripcion != null && typeof descripcion !== 'string') ||
      typeof precio !== 'number' ||
      !Number.isFinite(precio) ||
      precio < 0
    ) {
      return res.status(400).json({
        mensaje: 'Datos del producto inválidos'
      });
    }

    const conexion = await getPool();

    // Obtener el vendedor asociado al usuario autenticado
    const vendedor = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .execute('dbo.sp_Vendedores_ObtenerPorUsuario');

    if (!vendedor.recordset.length) {
      return res.status(403).json({
        mensaje: 'No tiene un perfil de vendedor activo'
      });
    }

    const resultado = await conexion.request()
      .input('ProductoID', sql.Int, productoID)
      .input('VendedorID', sql.Int, vendedor.recordset[0].VendedorID)
      .input('CategoriaID', sql.Int, Number(categoriaID))
      .input('Nombre', sql.NVarChar(150), nombre.trim())
      .input('Descripcion', sql.NVarChar(sql.MAX), descripcion ?? null)
      .input('Precio', sql.Decimal(12, 2), precio)
      .execute('dbo.sp_Productos_Actualizar');

    return res.json({
      mensaje: 'Producto actualizado correctamente',
      producto: resultado.recordset[0]
    });

  } catch (error) {
    if (error.number === 50407) {
      return res.status(404).json({
        mensaje: 'El producto no existe, está inactivo o no pertenece al vendedor'
      });
    }

    if (error.number === 50408) {
      return res.status(404).json({
        mensaje: 'La categoría no existe'
      });
    }

    if ([50405, 50406].includes(error.number)) {
      return res.status(400).json({
        mensaje: error.message
      });
    }

    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al actualizar producto'
    });
  }
}

async function desactivarProducto(req, res) {
  try {
    const productoID = Number(req.params.id);

    if (!Number.isInteger(productoID) || productoID <= 0) {
      return res.status(400).json({
        mensaje: 'ID de producto inválido'
      });
    }

    const conexion = await getPool();

    const vendedor = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .execute('dbo.sp_Vendedores_ObtenerPorUsuario');

    if (!vendedor.recordset.length) {
      return res.status(403).json({
        mensaje: 'No tiene un perfil de vendedor activo'
      });
    }

    const resultado = await conexion.request()
      .input('ProductoID', sql.Int, productoID)
      .input('VendedorID', sql.Int, vendedor.recordset[0].VendedorID)
      .execute('dbo.sp_Productos_Desactivar');

    return res.json({
      mensaje: 'Producto desactivado correctamente',
      producto: resultado.recordset[0]
    });

  } catch (error) {
    if (error.number === 50409) {
      return res.status(404).json({
        mensaje: 'El producto no existe o no pertenece al vendedor'
      });
    }

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
