
const { getPool } = require('../config/database');
const { usuarioPuedeVerPedido } = require('./pedido.controller');
const { publicarEvento } = require('../events/pedido.events');
const { manejarErrorPostgres } = require('../utils/postgresErrors');

// Registrar pago
async function registrarPago(req, res) {
  try {
    const { pedidoID, metodoPagoID } = req.body;

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_pagos_registrar($1, $2, $3)',
      [pedidoID, metodoPagoID, req.session.usuario.id]
    );

    const p = resultado.rows[0];

    return res.status(201).json({
      mensaje: 'Pago registrado correctamente',
      pago: {
        PagoID: p.pagoid,
        PedidoID: p.pedidoid,
        MetodoPagoID: p.metodopagoid,
        Monto: p.monto,
        Estado: p.estado,
        FechaPago: p.fechapago
      }
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al registrar pago');
  }
}

// Consultar pago
async function consultarPago(req, res) {
  try {
    const pagoID = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_pagos_consultarporid($1)',
      [pagoID]
    );

    const p = resultado.rows[0];

    if (!p || !await usuarioPuedeVerPedido(
      conexion, p.pedidoid, req.session.usuario
    )) {
      return res.status(404).json({
        mensaje: 'Pago no encontrado'
      });
    }

    return res.json({
      PagoID: p.pagoid,
      PedidoID: p.pedidoid,
      MetodoPagoID: p.metodopagoid,
      Monto: p.monto,
      Estado: p.estado,
      FechaPago: p.fechapago
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al consultar pago');
  }
}

// Listar pagos por pedido
async function listarPagosPorPedido(req, res) {
  try {
    const pedidoID = Number(req.params.id);
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_pagos_listarporpedido($1)',
      [pedidoID]
    );

    return res.json(resultado.rows.map(p => ({
      PagoID: p.pagoid,
      PedidoID: p.pedidoid,
      MetodoPagoID: p.metodopagoid,
      Monto: p.monto,
      Estado: p.estado,
      FechaPago: p.fechapago
    })));

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar pagos');
  }
}

// Aprobar pago (operación administrativa de prueba)
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

    const p = resultado.rows[0];

    if (p) {
      const pedidoResultado = await conexion.query(
        'SELECT * FROM public.sp_pedidos_consultarporid($1)',
        [p.pedidoid]
      );

      const pedido = pedidoResultado.rows[0];

      if (pedido) {
        await publicarEvento('pago.aprobado', {
          usuarioID: pedido.usuarioid,
          pedidoID: p.pedidoid
        });
      }
    }

    return res.json({
      mensaje: 'Pago aprobado y pedido confirmado',
      pago: p ? {
        PagoID: p.pagoid,
        PedidoID: p.pedidoid,
        MetodoPagoID: p.metodopagoid,
        Monto: p.monto,
        Estado: p.estado,
        FechaPago: p.fechapago
      } : null
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al aprobar pago');
  }
}

// Rechazar pago
async function rechazarPago(req, res) {
  try {
    const pagoID = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_pagos_rechazar($1)',
      [pagoID]
    );

    const p = resultado.rows[0];

    if (p) {
      const pedidoResultado = await conexion.query(
        'SELECT * FROM public.sp_pedidos_consultarporid($1)',
        [p.pedidoid]
      );

      const pedido = pedidoResultado.rows[0];

      if (pedido) {
        await publicarEvento('pago.rechazado', {
          usuarioID: pedido.usuarioid,
          pedidoID: p.pedidoid
        });
      }
    }

    return res.json({
      mensaje: 'Pago rechazado correctamente',
      pago: p ? {
        PagoID: p.pagoid,
        PedidoID: p.pedidoid,
        MetodoPagoID: p.metodopagoid,
        Monto: p.monto,
        Estado: p.estado,
        FechaPago: p.fechapago
      } : null
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
