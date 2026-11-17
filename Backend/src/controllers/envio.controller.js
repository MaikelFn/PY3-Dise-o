const { sql, getPool } = require('../config/database');
const { usuarioPuedeVerPedido } = require('./pedido.controller');

function idValido(valor) {
  const numero = Number(valor);

  return Number.isSafeInteger(numero) &&
    numero > 0 &&
    numero <= 2147483647;
}

async function consultarEnvio(req, res) {
  try {
    const envioID = Number(req.params.id);

    if (!idValido(envioID)) {
      return res.status(400).json({
        mensaje: 'ID de envío inválido'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('EnvioID', sql.Int, envioID)
      .execute('dbo.sp_Envios_ConsultarPorID');

    const envio = resultado.recordset[0];

    if (!envio || !await usuarioPuedeVerPedido(
      conexion, envio.PedidoID, req.session.usuario
    )) {
      return res.status(404).json({
        mensaje: 'Envío no encontrado'
      });
    }

    return res.json(envio);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al consultar envío'
    });
  }
}

async function consultarEnvioPorPedido(req, res) {
  try {
    const pedidoID = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('PedidoID', sql.Int, pedidoID)
      .execute('dbo.sp_Envios_ConsultarPorPedido');

    return res.json(resultado.recordset[0] || null);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al consultar envío'
    });
  }
}

async function actualizarEstadoEnvio(req, res) {
  try {
    const envioID = Number(req.params.id);
    const { nuevoEstado } = req.body;

    if (!idValido(envioID)) {
      return res.status(400).json({
        mensaje: 'ID de envío inválido'
      });
    }

    const estados = ['Preparando', 'Enviado', 'Entregado'];

    if (!estados.includes(nuevoEstado)) {
      return res.status(400).json({
        mensaje: 'Estado de envío inválido'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('EnvioID', sql.Int, envioID)
      .input('NuevoEstado', sql.VarChar(20), nuevoEstado)
      .execute('dbo.sp_Envios_ActualizarEstado');

    return res.json({
      mensaje: 'Estado del envío actualizado',
      envio: resultado.recordset[0]
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al actualizar envío'
    });
  }
}

module.exports = {
  consultarEnvio,
  consultarEnvioPorPedido,
  actualizarEstadoEnvio
};
