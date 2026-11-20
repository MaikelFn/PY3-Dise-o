
const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');
const { usuarioPuedeVerPedido } = require('./pedido.controller');
const { publicarEvento } = require('../events/pedido.events');

// Consultar envío
async function consultarEnvio(req, res) {
  try {
    const envioID = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_envios_consultarporid($1)',
      [envioID]
    );

    const envio = resultado.rows[0];

    if (!envio || !await usuarioPuedeVerPedido(
      conexion, envio.pedidoid, req.session.usuario
    )) {
      return res.status(404).json({
        mensaje: 'Envío no encontrado'
      });
    }

    return res.json({
      EnvioID: envio.envioid,
      PedidoID: envio.pedidoid,
      TipoEnvioID: envio.tipoenvioid,
      Estado: envio.estado,
      NumeroSeguimiento: envio.numeroseguimiento,
      FechaEnvio: envio.fechaenvio,
      FechaEntrega: envio.fechaentrega
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al consultar envío');
  }
}

// Consultar envío por pedido
async function consultarEnvioPorPedido(req, res) {
  try {
    const pedidoID = Number(req.params.id);

    const conexion = await getPool();

    if (!await usuarioPuedeVerPedido(
      conexion, pedidoID, req.session.usuario
    )) {
      return res.status(404).json({
        mensaje: 'Pedido no encontrado'
      });
    }

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_envios_consultarporpedido($1)',
      [pedidoID]
    );

    const envio = resultado.rows[0];

    if (!envio) {
      return res.json(null);
    }

    return res.json({
      EnvioID: envio.envioid,
      PedidoID: envio.pedidoid,
      TipoEnvioID: envio.tipoenvioid,
      Estado: envio.estado,
      NumeroSeguimiento: envio.numeroseguimiento,
      FechaEnvio: envio.fechaenvio,
      FechaEntrega: envio.fechaentrega
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al consultar envío');
  }
}

// Actualizar estado del envío
async function actualizarEstadoEnvio(req, res) {
  try {
    const envioID = Number(req.params.id);
    const { nuevoEstado } = req.body;

    const estados = ['Preparando', 'Enviado', 'Entregado'];

    if (!estados.includes(nuevoEstado)) {
      return res.status(400).json({
        mensaje: 'Estado de envío inválido'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_envios_actualizarestado($1, $2)',
      [envioID, nuevoEstado]
    );

    const envio = resultado.rows[0];

    if (envio && ['Enviado', 'Entregado'].includes(envio.estado)) {
      const pedidoResultado = await conexion.query(
        'SELECT * FROM public.sp_pedidos_consultarporid($1)',
        [envio.pedidoid]
      );

      const pedido = pedidoResultado.rows[0];

      if (pedido) {
        const tipo = envio.estado === 'Enviado'
          ? 'envio.enviado'
          : 'envio.entregado';

        await publicarEvento(tipo, {
          usuarioID: pedido.usuarioid,
          pedidoID: envio.pedidoid
        });
      }
    }

    return res.json({
      mensaje: 'Estado del envío actualizado',
      envio: {
        EnvioID: envio.envioid,
        PedidoID: envio.pedidoid,
        TipoEnvioID: envio.tipoenvioid,
        Estado: envio.estado,
        NumeroSeguimiento: envio.numeroseguimiento,
        FechaEnvio: envio.fechaenvio,
        FechaEntrega: envio.fechaentrega
      }
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al actualizar envío');
  }
}

module.exports = {
  consultarEnvio,
  consultarEnvioPorPedido,
  actualizarEstadoEnvio
};
