const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');
const { adaptarCategoria } = require('../adapters/categoria.adapter');

// Listar categorías
async function listarCategorias(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_categorias_listar()'
    );

    const categorias = resultado.rows.map(adaptarCategoria);

    return res.json(categorias);

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar categorías');
  }
}

// Consultar categoría
async function consultarCategoria(req, res) {
  try {
    const categoriaID = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_categorias_consultarporid($1)',
      [categoriaID]
    );

    if (!resultado.rows.length) {
      return res.status(404).json({
        mensaje: 'Categoría no encontrada'
      });
    }

    const c = resultado.rows[0];

    return res.json(adaptarCategoria(c));

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al consultar categoría');
  }
}

// Crear categoría
async function crearCategoria(req, res) {
  try {
    const { nombre, descripcion } = req.body;

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_categorias_crear($1, $2)',
      [nombre.trim(), descripcion ?? null]
    );

    const c = resultado.rows[0];

    return res.status(201).json({
      mensaje: 'Categoría creada correctamente',
      categoria: adaptarCategoria(c)
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al crear categoría');
  }
}

// Actualizar categoría
async function actualizarCategoria(req, res) {
  try {
    const categoriaID = Number(req.params.id);
    const { nombre, descripcion } = req.body;

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_categorias_actualizar($1, $2, $3)',
      [categoriaID, nombre.trim(), descripcion ?? null]
    );

    const c = resultado.rows[0];

    return res.json({
      mensaje: 'Categoría actualizada correctamente',
      categoria: adaptarCategoria(c)
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al actualizar categoría');
  }
}

module.exports = {
  listarCategorias,
  consultarCategoria,
  crearCategoria,
  actualizarCategoria
};
