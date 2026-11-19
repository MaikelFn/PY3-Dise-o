
const { getPool } = require('../config/database');

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
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al listar tipos de envío'
    });
  }
}

module.exports = { listarTiposEnvio };
