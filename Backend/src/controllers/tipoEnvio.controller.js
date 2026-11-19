
const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');

async function listarTiposEnvio(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_tiposenvio_listar()'
    );

    const tiposEnvio = resultado.rows.map(t => ({
      TipoEnvioID: t.tipoenvioid,
      Nombre: t.nombre,
      Descripcion: t.descripcion,
      Costo: t.costobase
    }));

    return res.json(tiposEnvio);

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar tipos de envío');
  }
}

module.exports = { listarTiposEnvio };
