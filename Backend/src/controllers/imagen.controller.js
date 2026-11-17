const { sql, getPool } = require('../config/database');

function manejarError(res, error) {
  const errores = {
    50501: 400,
    50502: 400,
    50503: 404,
    50507: 404,
    50508: 404
  };

  if (errores[error.number]) {
    return res.status(errores[error.number]).json({
      mensaje: error.message
    });
  }

  console.error(error);
  return res.status(500).json({
    mensaje: 'Error al procesar imagen'
  });
}

async function obtenerVendedor(conexion, usuarioID) {
  const resultado = await conexion.request()
    .input('UsuarioID', sql.Int, usuarioID)
    .execute('dbo.sp_Vendedores_ObtenerPorUsuario');

  return resultado.recordset[0]?.VendedorID;
}

async function listarImagenes(req, res) {
  try {
    const productoID = Number(req.params.id);

    if (!Number.isInteger(productoID) || productoID <= 0) {
      return res.status(400).json({
        mensaje: 'ID de producto inválido'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('ProductoID', sql.Int, productoID)
      .execute('dbo.sp_ImagenesProducto_ListarPorProducto');

    return res.json(resultado.recordset);
  } catch (error) {
    return manejarError(res, error);
  }
}

async function agregarImagen(req, res) {
  try {
    const productoID = Number(req.params.id);
    const {
      imagenURL,
      esPrincipal = false,
      orden = 0
    } = req.body;

    if (
      !Number.isInteger(productoID) ||
      productoID <= 0 ||
      typeof imagenURL !== 'string' ||
      !imagenURL.trim() ||
      imagenURL.length > 500 ||
      !/^https?:\/\/\S+$/i.test(imagenURL.trim()) ||
      typeof esPrincipal !== 'boolean' ||
      !Number.isInteger(orden) ||
      orden < 0
    ) {
      return res.status(400).json({
        mensaje: 'Datos de imagen inválidos'
      });
    }

    const conexion = await getPool();
    const vendedorID = await obtenerVendedor(
      conexion,
      req.session.usuario.id
    );

    if (!vendedorID) {
      return res.status(403).json({
        mensaje: 'No tiene un perfil de vendedor activo'
      });
    }

    const resultado = await conexion.request()
      .input('ProductoID', sql.Int, productoID)
      .input('VendedorID', sql.Int, vendedorID)
      .input('ImagenURL', sql.NVarChar(500), imagenURL.trim())
      .input('EsPrincipal', sql.Bit, esPrincipal)
      .input('Orden', sql.Int, orden)
      .execute('dbo.sp_ImagenesProducto_Agregar');

    return res.status(201).json({
      mensaje: 'Imagen agregada correctamente',
      imagen: resultado.recordset[0]
    });
  } catch (error) {
    return manejarError(res, error);
  }
}

async function establecerPrincipal(req, res) {
  try {
    const imagenID = Number(req.params.id);

    if (!Number.isInteger(imagenID) || imagenID <= 0) {
      return res.status(400).json({
        mensaje: 'ID de imagen inválido'
      });
    }

    const conexion = await getPool();
    const vendedorID = await obtenerVendedor(
      conexion,
      req.session.usuario.id
    );

    if (!vendedorID) {
      return res.status(403).json({
        mensaje: 'No tiene un perfil de vendedor activo'
      });
    }

    const resultado = await conexion.request()
      .input('ImagenID', sql.Int, imagenID)
      .input('VendedorID', sql.Int, vendedorID)
      .execute('dbo.sp_ImagenesProducto_EstablecerPrincipal');

    return res.json({
      mensaje: 'Imagen principal actualizada correctamente',
      imagenes: resultado.recordset
    });
  } catch (error) {
    return manejarError(res, error);
  }
}

async function eliminarImagen(req, res) {
  try {
    const imagenID = Number(req.params.id);

    if (!Number.isInteger(imagenID) || imagenID <= 0) {
      return res.status(400).json({
        mensaje: 'ID de imagen inválido'
      });
    }

    const conexion = await getPool();
    const vendedorID = await obtenerVendedor(
      conexion,
      req.session.usuario.id
    );

    if (!vendedorID) {
      return res.status(403).json({
        mensaje: 'No tiene un perfil de vendedor activo'
      });
    }

    await conexion.request()
      .input('ImagenID', sql.Int, imagenID)
      .input('VendedorID', sql.Int, vendedorID)
      .execute('dbo.sp_ImagenesProducto_Eliminar');

    return res.json({
      mensaje: 'Imagen eliminada correctamente'
    });
  } catch (error) {
    return manejarError(res, error);
  }
}

module.exports = {
  listarImagenes,
  agregarImagen,
  establecerPrincipal,
  eliminarImagen
};
