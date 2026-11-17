const { getPool } = require('../config/database');

async function listarMetodosPago(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.request()
      .execute('dbo.sp_MetodosPago_Listar');

    return res.json(resultado.recordset);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al listar métodos de pago'
    });
  }
}

module.exports = { listarMetodosPago };
