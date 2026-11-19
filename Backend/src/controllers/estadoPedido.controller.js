
const { getPool } = require('../config/database');

async function listarEstados(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_estadospedido_listar()'
    );

    const estados = resultado.rows.map(e => ({
      EstadoPedidoID: e.estadopedidoid,
      Nombre: e.nombre,
      Descripcion: e.descripcion
    }));

    return res.json(estados);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al listar estados de pedido'
    });
  }
}

module.exports = { listarEstados };
