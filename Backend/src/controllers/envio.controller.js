
const { getPool } = require('../config/database');
const { manejarErrorPostgres } = require('../utils/postgresErrors');
const { usuarioPuedeVerPedido } = require('./pedido.controller');
const { publicarEvento } = require('../events/pedido.events');
const { adaptarEnvio } = require('../adapters/envio.adapter');

/**
 * Consulta un envío por su identificador.
 * Solo usuarios con acceso al pedido asociado pueden consultarlo.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el envío adaptado
 */
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

    return res.json(adaptarEnvio(envio));

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al consultar envío');
  }
}

/**
 * Consulta el envío asociado a un pedido.
 * Solo usuarios con acceso al pedido pueden consultarlo.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el envío adaptado o null
 */
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

    return res.json(adaptarEnvio(envio));

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al consultar envío');
  }
}

/**
 * Actualiza el estado de un envío.
 * Publica los eventos de envío despachado o entregado.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el envío actualizado adaptado
 */
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
      envio: adaptarEnvio(envio)
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
