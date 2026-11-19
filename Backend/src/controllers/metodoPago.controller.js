
const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');

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
    return manejarErrorPostgres(error, res, 'Error al listar métodos de pago');
  }
}

module.exports = { listarMetodosPago };
