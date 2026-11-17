const { sql, getPool } = require('../config/database');
const { usuarioPuedeVerPedido } = require('./pedido.controller');
const { publicarEvento } = require('../events/pedido.events');

function idValido(valor) {
  const numero = Number(valor);

  return Number.isSafeInteger(numero) &&
    numero > 0 &&
    numero <= 2147483647;
}

async function registrarPago(req, res) {
  try {
    const { pedidoID, metodoPagoID } = req.body;

    if (!idValido(pedidoID) || !idValido(metodoPagoID)) {
      return res.status(400).json({
        mensaje: 'Pedido o método de pago inválido'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('PedidoID', sql.Int, Number(pedidoID))
      .input('MetodoPagoID', sql.Int, Number(metodoPagoID))
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .execute('dbo.sp_Pagos_Registrar');

    return res.status(201).json({
      mensaje: 'Pago registrado correctamente',
      pago: resultado.recordset[0]
    });
  } catch (error) {
    if (error.number === 51401) {
      return res.status(404).json({ mensaje: error.message });
    }

    if (error.number === 51402) {
      return res.status(400).json({ mensaje: error.message });
    }

    if (error.number === 51403) {
      return res.status(409).json({ mensaje: error.message });
    }

    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al registrar pago'
    });
  }
}

async function consultarPago(req, res) {
  try {
    const pagoID = Number(req.params.id);

    if (!idValido(pagoID)) {
      return res.status(400).json({
        mensaje: 'ID de pago inválido'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('PagoID', sql.Int, pagoID)
      .execute('dbo.sp_Pagos_ConsultarPorID');

    const pago = resultado.recordset[0];

    if (!pago || !await usuarioPuedeVerPedido(
      conexion, pago.PedidoID, req.session.usuario
    )) {
      return res.status(404).json({
        mensaje: 'Pago no encontrado'
      });
    }

    return res.json(pago);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al consultar pago'
    });
  }
}

async function listarPagosPorPedido(req, res) {
  try {
    const pedidoID = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('PedidoID', sql.Int, pedidoID)
      .execute('dbo.sp_Pagos_ListarPorPedido');

    return res.json(resultado.recordset);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al listar pagos'
    });
  }
}

// Operación administrativa de prueba.
// En producción la aprobación debe depender de una
// verificación confiable de la pasarela de pagos.
async function aprobarPago(req, res) {
  try {
    const pagoID = Number(req.params.id);

    if (!idValido(pagoID)) {
      return res.status(400).json({
        mensaje: 'ID de pago inválido'
      });
    }

    const conexion = await getPool();

    await conexion.request()
      .input('PagoID', sql.Int, pagoID)
      .execute('dbo.sp_Pagos_Aprobar');

    const resultado = await conexion.request()
      .input('PagoID', sql.Int, pagoID)
      .execute('dbo.sp_Pagos_ConsultarPorID');

    const pago = resultado.recordset[0];

    if (pago) {
      const pedidoResultado = await conexion.request()
        .input('PedidoID', sql.Int, pago.PedidoID)
        .execute('dbo.sp_Pedidos_ConsultarPorID');

      const pedido = pedidoResultado.recordset[0];

      if (pedido) {
        await publicarEvento('pago.aprobado', {
          usuarioID: pedido.UsuarioID,
          pedidoID: pago.PedidoID
        });
      }
    }

    return res.json({
      mensaje: 'Pago aprobado y pedido confirmado',
      pago
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al aprobar pago'
    });
  }
}

async function rechazarPago(req, res) {
  try {
    const pagoID = Number(req.params.id);

    if (!idValido(pagoID)) {
      return res.status(400).json({
        mensaje: 'ID de pago inválido'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('PagoID', sql.Int, pagoID)
      .execute('dbo.sp_Pagos_Rechazar');

    const pago = resultado.recordset[0];

    if (pago) {
      const pedidoResultado = await conexion.request()
        .input('PedidoID', sql.Int, pago.PedidoID)
        .execute('dbo.sp_Pedidos_ConsultarPorID');

      const pedido = pedidoResultado.recordset[0];

      if (pedido) {
        await publicarEvento('pago.rechazado', {
          usuarioID: pedido.UsuarioID,
          pedidoID: pago.PedidoID
        });
      }
    }

    return res.json({
      mensaje: 'Pago rechazado correctamente',
      pago
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al rechazar pago'
    });
  }
}

module.exports = {
  registrarPago,
  consultarPago,
  listarPagosPorPedido,
  aprobarPago,
  rechazarPago
};
