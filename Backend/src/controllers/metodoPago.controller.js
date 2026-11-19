
const { getPool } = require('../config/database');

async function listarMetodosPago(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_metodospago_listar()'
    );

    const metodosPago = resultado.rows.map(m => ({
      MetodoPagoID: m.metodopagoid,
      Nombre: m.nombre,
      Descripcion: m.descripcion
    }));

    return res.json(metodosPago);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al listar métodos de pago'
    });
  }
}

module.exports = { listarMetodosPago };
