const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');

// Obtener o crear carrito
async function obtenerOCrearCarrito(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_carritos_obtenerocrear($1)',
      [req.session.usuario.id]
    );

    const c = resultado.rows[0];

    return res.json({
      CarritoID: c.carritoid,
      UsuarioID: c.usuarioid,
      FechaCreacion: c.fechacreacion
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al obtener carrito');
  }
}

// Consultar carrito
async function consultarCarrito(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_carritos_consultarporusuario($1)',
      [req.session.usuario.id]
    );

    const carrito = resultado.rows.map(c => ({
      CarritoID: c.carritoid,
      UsuarioID: c.usuarioid,
      FechaCreacion: c.fechacreacion
    }));

    return res.json(carrito);

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al consultar carrito');
  }
}

// Vaciar carrito
async function vaciarCarrito(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_carritos_vaciar($1)',
      [req.session.usuario.id]
    );

    return res.json({
      mensaje: 'Carrito vaciado correctamente',
      carrito: resultado.rows
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al vaciar carrito');
  }
}

module.exports = {
  obtenerOCrearCarrito,
  consultarCarrito,
  vaciarCarrito
};
