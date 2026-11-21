
const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');
const { adaptarTipoEnvio } = require('../adapters/tipoEnvio.adapter');

async function listarTiposEnvio(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_tiposenvio_listar()'
    );

    const tiposEnvio = resultado.rows.map(adaptarTipoEnvio);

    return res.json(tiposEnvio);

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar tipos de envío');
  }
}

module.exports = { listarTiposEnvio };
