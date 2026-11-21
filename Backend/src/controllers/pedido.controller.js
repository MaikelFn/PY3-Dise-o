
const { getPool } = require('../config/database');
const { publicarEvento } = require('../events/pedido.events');
const { manejarErrorPostgres } = require('../utils/postgresErrors');
const { adaptarPago } = require('../adapters/pago.adapter');
const {
  adaptarPedido,
  adaptarPedidoLista,
  adaptarPedidoAdmin,
  adaptarPedidoVendedor,
  adaptarPedidoResumen
} = require('../adapters/pedido.adapter');

// Verificar acceso al pedido
async function usuarioPuedeVerPedido(conexion, pedidoID, usuario) {
  const resultado = await conexion.query(
    'SELECT * FROM public.sp_pedidos_validaracceso($1, $2)',
    [pedidoID, usuario.id]
  );

  if (resultado.rows.length > 0) return true;

  const vendedorResultado = await conexion.query(`
    SELECT 1
    FROM public.detallepedido dp
    JOIN public.producto p ON p.productoid = dp.productoid
    JOIN public.vendedor v ON v.vendedorid = p.vendedorid
    WHERE dp.pedidoid = $1
      AND v.usuarioid = $2
    LIMIT 1
  `, [pedidoID, usuario.id]);

  return vendedorResultado.rows.length > 0;
}

// Middleware de acceso
async function verificarAccesoPedido(req, res, next) {
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

    next();

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al verificar acceso al pedido');
  }
}

// Crear pedido
async function crearPedido(req, res) {
  try {
    const { direccionID, tipoEnvioID } = req.body;

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_pedidos_creardesdecarrito($1, $2, $3)',
      [req.session.usuario.id, direccionID, tipoEnvioID]
    );

    const pedidoID = resultado.rows[0].pedidoid;

    await publicarEvento('pedido.z', {
      usuarioID: req.session.usuario.id,
      pedidoID
    });

    return res.status(201).json({
      mensaje: 'Pedido creado e inventario reservado',
      pedidoID
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al crear pedido');
  }
}

async function crearPedidoConPagoSimulado(req, res) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      mensaje: 'Los pagos simulados solo están disponibles fuera de producción'
    });
  }

  const direccionID = Number(req.body?.direccionID);
  const tipoEnvioID = Number(req.body?.tipoEnvioID);

  if (!Number.isSafeInteger(direccionID) || direccionID < 1 ||
      !Number.isSafeInteger(tipoEnvioID) || tipoEnvioID < 1) {
    return res.status(400).json({
      mensaje: 'Selecciona una dirección y un tipo de envío válidos'
    });
  }

  const conexion = await getPool();
  let cliente;
  let transaccionIniciada = false;

  try {
    cliente = await conexion.connect();
    await cliente.query('BEGIN');
    transaccionIniciada = true;

    const pedidoResultado = await cliente.query(
      'SELECT * FROM public.sp_pedidos_creardesdecarrito($1, $2, $3)',
      [req.session.usuario.id, direccionID, tipoEnvioID]
    );
    const pedidoID = pedidoResultado.rows[0]?.pedidoid;

    if (!pedidoID) {
      throw new Error('No se pudo crear el pedido desde el carrito');
    }

    const metodosResultado = await cliente.query(
      'SELECT * FROM public.sp_metodospago_listar()'
    );
    const metodoTransferencia = metodosResultado.rows.find(
      (metodo) => String(metodo.nombre || '').trim().toLocaleLowerCase('es') === 'transferencia'
    );

    if (!metodoTransferencia) {
      await cliente.query('ROLLBACK');
      transaccionIniciada = false;
      return res.status(503).json({
        mensaje: 'No está disponible el método de pago simulado por transferencia'
      });
    }

    const pagoResultado = await cliente.query(
      'SELECT * FROM public.sp_pagos_registrar($1, $2, $3)',
      [pedidoID, metodoTransferencia.metodopagoid, req.session.usuario.id]
    );
    const pagoID = pagoResultado.rows[0]?.pagoid;

    if (!pagoID) {
      throw new Error('No se pudo registrar el pago simulado');
    }

    await cliente.query(
      'SELECT * FROM public.sp_pagos_aprobar($1)',
      [pagoID]
    );
    const pagoAprobadoResultado = await cliente.query(
      'SELECT * FROM public.sp_pagos_consultarporid($1)',
      [pagoID]
    );
    const pago = pagoAprobadoResultado.rows[0];

    if (!pago) {
      throw new Error('No se pudo confirmar el pago simulado');
    }

    await cliente.query('COMMIT');
    transaccionIniciada = false;

    await publicarEvento('pedido.creado', {
      usuarioID: req.session.usuario.id,
      pedidoID
    });
    await publicarEvento('pago.aprobado', {
      usuarioID: req.session.usuario.id,
      pedidoID
    });

    return res.status(201).json({
      mensaje: 'Pedido confirmado mediante un pago simulado; no se procesó dinero real',
      pedidoID,
      pago: adaptarPago(pago)
    });
  } catch (error) {
    if (cliente && transaccionIniciada) {
      try {
        await cliente.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error al revertir el checkout con pago simulado:', rollbackError);
      }
    }

    return manejarErrorPostgres(error, res, 'Error al confirmar el pedido con pago simulado');
  } finally {
    cliente?.release();
  }
}

// Consultar pedido
async function consultarPedido(req, res) {
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
      'SELECT * FROM public.sp_pedidos_consultarporid($1)',
      [pedidoID]
    );

    const p = resultado.rows[0];

    if (!p) {
      return res.status(404).json({
        mensaje: 'Pedido no encontrado'
      });
    }

    return res.json(adaptarPedido(p));

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al consultar pedido');
  }
}

// Listar pedidos
async function listarPedidos(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_pedidos_listarporusuario($1)',
      [req.session.usuario.id]
    );

    return res.json(resultado.rows.map(adaptarPedidoLista));

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar pedidos');
  }
}

async function listarPedidosAdministrador(_req, res) {
  try {
    const conexion = await getPool();
    const resultado = await conexion.query(
      'SELECT * FROM public.sp_pedidos_listaradmin()'
    );

    return res.json(resultado.rows.map(adaptarPedidoAdmin));
  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar pedidos para administración');
  }
}

async function listarPedidosVendedor(req, res) {
  try {
    const conexion = await getPool();
    const resultado = await conexion.query(
      'SELECT * FROM public.sp_pedidos_listarporvendedor($1)',
      [req.session.usuario.id]
    );

    return res.json(resultado.rows.map(adaptarPedidoVendedor));
  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al listar ventas de la tienda');
  }
}

// Confirmar pedido
async function confirmarPedido(req, res) {
  try {
    const pedidoID = Number(req.params.id);

    const conexion = await getPool();

    const resultado = await conexion.query(
      'SELECT * FROM public.sp_pedidos_confirmar($1)',
      [pedidoID]
    );

    const p = resultado.rows[0];

    return res.json({
      mensaje: 'Pedido confirmado correctamente',
      pedido: adaptarPedidoResumen(p)
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al confirmar pedido');
  }
}

// Cancelar pedido
async function cancelarPedido(req, res) {
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
      'SELECT * FROM public.sp_pedidos_cancelar($1)',
      [pedidoID]
    );

    const p = resultado.rows[0];

    await publicarEvento('pedido.cancelado', {
      usuarioID: p.usuarioid,
      pedidoID
    });

    return res.json({
      mensaje: 'Pedido cancelado e inventario liberado',
      pedido: adaptarPedidoResumen(p)
    });

  } catch (error) {
    return manejarErrorPostgres(error, res, 'Error al cancelar pedido');
  }
}

module.exports = {
  crearPedido,
  crearPedidoConPagoSimulado,
  consultarPedido,
  listarPedidos,
  listarPedidosAdministrador,
  listarPedidosVendedor,
  confirmarPedido,
  cancelarPedido,
  usuarioPuedeVerPedido,
  verificarAccesoPedido
};
