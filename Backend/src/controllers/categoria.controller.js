const { sql, getPool } = require('../config/database');

// Listar categorías
async function listarCategorias(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.request()
      .execute('dbo.sp_Categorias_Listar');

    return res.json(resultado.recordset);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al listar categorías'
    });
  }
}

// Consultar categoría
async function consultarCategoria(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('CategoriaID', sql.Int, req.params.id)
      .execute('dbo.sp_Categorias_ConsultarPorID');

    if (!resultado.recordset.length) {
      return res.status(404).json({
        mensaje: 'Categoría no encontrada'
      });
    }

    return res.json(resultado.recordset[0]);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al consultar categoría'
    });
  }
}

// Crear categoría
async function crearCategoria(req, res) {
  try {
    const { nombre, descripcion } = req.body;

    if (typeof nombre !== 'string' || !nombre.trim() ||
        nombre.length > 100 ||
        (descripcion != null &&
         (typeof descripcion !== 'string' || descripcion.length > 300))) {
      return res.status(400).json({
        mensaje: 'Datos de categoría inválidos'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('Nombre', sql.NVarChar(100), nombre.trim())
      .input('Descripcion', sql.NVarChar(300), descripcion ?? null)
      .execute('dbo.sp_Categorias_Crear');

    return res.status(201).json({
      mensaje: 'Categoría creada correctamente',
      categoria: resultado.recordset[0]
    });

  } catch (error) {
    if ([50302, 2601, 2627].includes(error.number)) {
      return res.status(409).json({
        mensaje: 'Ya existe una categoría con ese nombre'
      });
    }

    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al crear categoría'
    });
  }
}

// Actualizar categoría
async function actualizarCategoria(req, res) {
  try {
    const { nombre, descripcion } = req.body;

    if (typeof nombre !== 'string' || !nombre.trim() ||
        nombre.length > 100 ||
        (descripcion != null &&
         (typeof descripcion !== 'string' || descripcion.length > 300))) {
      return res.status(400).json({
        mensaje: 'Datos de categoría inválidos'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('CategoriaID', sql.Int, req.params.id)
      .input('Nombre', sql.NVarChar(100), nombre.trim())
      .input('Descripcion', sql.NVarChar(300), descripcion ?? null)
      .execute('dbo.sp_Categorias_Actualizar');

    return res.json({
      mensaje: 'Categoría actualizada correctamente',
      categoria: resultado.recordset[0]
    });

  } catch (error) {
    if (error.number === 50304) {
      return res.status(404).json({
        mensaje: 'Categoría no encontrada'
      });
    }

    if ([50305, 2601, 2627].includes(error.number)) {
      return res.status(409).json({
        mensaje: 'Ya existe una categoría con ese nombre'
      });
    }

    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al actualizar categoría'
    });
  }
}

module.exports = {
  listarCategorias,
  consultarCategoria,
  crearCategoria,
  actualizarCategoria
};
