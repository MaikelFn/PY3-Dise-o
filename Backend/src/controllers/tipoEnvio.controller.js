const { getPool } = require('../config/database');

async function listarTiposEnvio(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.request()
      .execute('dbo.sp_TiposEnvio_Listar');

    return res.json(resultado.recordset);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al listar tipos de envío'
    });
  }
}

module.exports = { listarTiposEnvio };
