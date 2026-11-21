const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');
const { adaptarCategoria } = require('../adapters/categoria.adapter');

/**
 * Lista todas las categorías de productos de ClickMarket.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el arreglo de categorías adaptadas
 */
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

/**
 * Consulta una categoría por su identificador.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con la categoría adaptada
 */
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

    const categoria = resultado.rows[0];

    return res.json(adaptarCategoria(categoria));

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al consultar categoría');
  }
}

/**
 * Crea una nueva categoría de productos.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con la categoría creada adaptada
 */
async function crearCategoria(req, res) {
  try {
    const { nombre, descripcion } = req.body;

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_categorias_crear($1, $2)',
      [nombre.trim(), descripcion ?? null]
    );

    const categoria = resultado.rows[0];

    return res.status(201).json({
      mensaje: 'Categoría creada correctamente',
      categoria: adaptarCategoria(categoria)
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al crear categoría');
  }
}

/**
 * Actualiza una categoría existente.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con la categoría actualizada adaptada
 */
async function actualizarCategoria(req, res) {
  try {
    const categoriaID = Number(req.params.id);
    const { nombre, descripcion } = req.body;

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_categorias_actualizar($1, $2, $3)',
      [categoriaID, nombre.trim(), descripcion ?? null]
    );

    const categoria = resultado.rows[0];

    return res.json({
      mensaje: 'Categoría actualizada correctamente',
      categoria: adaptarCategoria(categoria)
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
