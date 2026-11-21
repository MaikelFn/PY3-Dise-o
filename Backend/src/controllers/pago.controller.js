
const { getPool } = require('../config/database');
const { usuarioPuedeVerPedido } = require('./pedido.controller');
const { publicarEvento } = require('../events/pedido.events');
const { manejarErrorPostgres } = require('../utils/postgresErrors');
const { adaptarPago } = require('../adapters/pago.adapter');

/**
 * Registra un pago para un pedido del usuario autenticado.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el pago registrado adaptado
 */
async function registrarPago(req, res) {
  try {
    const { pedidoID, metodoPagoID } = req.body;

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_pagos_registrar($1, $2, $3)',
      [pedidoID, metodoPagoID, req.session.usuario.id]
    );

    const pago = resultado.rows[0];

    return res.status(201).json({
      mensaje: 'Pago registrado correctamente',
      pago: adaptarPago(pago)
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al registrar pago');
  }
}

/**
 * Consulta un pago por su identificador.
 * Solo usuarios con acceso al pedido asociado pueden consultarlo.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el pago adaptado
 */
async function consultarPago(req, res) {
  try {
    const pagoID = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_pagos_consultarporid($1)',
      [pagoID]
    );

    const pago = resultado.rows[0];

    if (!pago || !await usuarioPuedeVerPedido(
      conexion, pago.pedidoid, req.session.usuario
    )) {
      return res.status(404).json({
        mensaje: 'Pago no encontrado'
      });
    }

    return res.json(adaptarPago(pago));

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al consultar pago');
  }
}

/**
 * Lista los pagos asociados a un pedido.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el arreglo de pagos adaptados
 */
async function listarPagosPorPedido(req, res) {
  try {
    const pedidoID = Number(req.params.id);
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_pagos_listarporpedido($1)',
      [pedidoID]
    );

    return res.json(resultado.rows.map(adaptarPago));

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar pagos');
  }
}

/**
 * Aprueba un pago y confirma el pedido asociado.
 * Operación administrativa de prueba que publica el evento
 * de pago aprobado.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el pago aprobado adaptado
 */
async function aprobarPago(req, res) {
  try {
    const pagoID = Number(req.params.id);

    const conexion = await getPool();

    await conexion.query(
      'SELECT * FROM public.sp_pagos_aprobar($1)',
      [pagoID]
    );

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_pagos_consultarporid($1)',
      [pagoID]
    );

    const pago = resultado.rows[0];

    if (pago) {
      const pedidoResultado = await conexion.query(
        'SELECT * FROM public.sp_pedidos_consultarporid($1)',
        [pago.pedidoid]
      );

      const pedido = pedidoResultado.rows[0];

      if (pedido) {
        await publicarEvento('pago.aprobado', {
          usuarioID: pedido.usuarioid,
          pedidoID: pago.pedidoid
        });
      }
    }

    return res.json({
      mensaje: 'Pago aprobado y pedido confirmado',
      pago: pago ? adaptarPago(pago) : null
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al aprobar pago');
  }
}

/**
 * Rechaza un pago y actualiza el estado del pedido asociado.
 * Publica el evento de pago rechazado.
 *
 * @param {object} req Objeto de solicitud HTTP de Express
 * @param {object} res Objeto de respuesta HTTP de Express
 * @returns {Promise<void>} Responde con el pago rechazado adaptado
 */
async function rechazarPago(req, res) {
  try {
    const pagoID = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_pagos_rechazar($1)',
      [pagoID]
    );

    const pago = resultado.rows[0];

    if (pago) {
      const pedidoResultado = await conexion.query(
        'SELECT * FROM public.sp_pedidos_consultarporid($1)',
        [pago.pedidoid]
      );

      const pedido = pedidoResultado.rows[0];

      if (pedido) {
        await publicarEvento('pago.rechazado', {
          usuarioID: pedido.usuarioid,
          pedidoID: pago.pedidoid
        });
      }
    }

    return res.json({
      mensaje: 'Pago rechazado correctamente',
      pago: pago ? adaptarPago(pago) : null
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al rechazar pago');
  }
}

module.exports = {
  registrarPago,
  consultarPago,
  listarPagosPorPedido,
  aprobarPago,
  rechazarPago
};
