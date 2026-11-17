const { sql, getPool } = require('../config/database');
const { publicarEvento } = require('../events/pedido.events');

function manejarError(res, error) {
  console.error(error);

  if (error.number >= 51100 && error.number < 51200) {
    return res.status(400).json({
      mensaje: error.message
    });
  }

  return res.status(500).json({
    mensaje: 'Error al procesar pedido'
  });
}

function validarID(id) {
  return Number.isSafeInteger(id) && id > 0 && id <= 2147483647;
}

async function usuarioPuedeVerPedido(conexion, pedidoID, usuario) {
  const resultado = await conexion.request()
    .input('PedidoID', sql.Int, pedidoID)
    .input('UsuarioID', sql.Int, usuario.id)
    .execute('dbo.sp_Pedidos_ValidarAcceso');

  return resultado.recordset.length > 0;
}

// Para rutas donde :id es el PedidoID (ej. /api/pedidos/:id/pagos).
// Debe ejecutarse despues de verificarSesion.
async function verificarAccesoPedido(req, res, next) {
  try {
    const pedidoID = Number(req.params.id);

    if (!validarID(pedidoID)) {
      return res.status(400).json({
        mensaje: 'ID de pedido inválido'
      });
    }

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
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al verificar acceso al pedido'
    });
  }
}

async function crearPedido(req, res) {
  try {
    const { direccionID, tipoEnvioID } = req.body;

    if (!validarID(direccionID) || !validarID(tipoEnvioID)) {
      return res.status(400).json({
        mensaje: 'Dirección o tipo de envío inválido'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .input('DireccionID', sql.Int, direccionID)
      .input('TipoEnvioID', sql.Int, tipoEnvioID)
      .execute('dbo.sp_Pedidos_CrearDesdeCarrito');

    const pedidoID = resultado.recordset[0].PedidoID;

    await publicarEvento('pedido.creado', {
      usuarioID: req.session.usuario.id,
      pedidoID
    });

    return res.status(201).json({
      mensaje: 'Pedido creado e inventario reservado',
      pedidoID
    });
  } catch (error) {
    return manejarError(res, error);
  }
}

async function consultarPedido(req, res) {
  try {
    const pedidoID = Number(req.params.id);

    if (!validarID(pedidoID)) {
      return res.status(400).json({
        mensaje: 'ID de pedido inválido'
      });
    }

    const conexion = await getPool();

    if (!await usuarioPuedeVerPedido(
      conexion, pedidoID, req.session.usuario
    )) {
      return res.status(404).json({
        mensaje: 'Pedido no encontrado'
      });
    }

    const resultado = await conexion.request()
      .input('PedidoID', sql.Int, pedidoID)
      .execute('dbo.sp_Pedidos_ConsultarPorID');

    return res.json(resultado.recordset[0]);
  } catch (error) {
    return manejarError(res, error);
  }
}

async function listarPedidos(req, res) {
  try {
    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('UsuarioID', sql.Int, req.session.usuario.id)
      .execute('dbo.sp_Pedidos_ListarPorUsuario');

    return res.json(resultado.recordset);
  } catch (error) {
    return manejarError(res, error);
  }
}

async function confirmarPedido(req, res) {
  try {
    const pedidoID = Number(req.params.id);

    if (!validarID(pedidoID)) {
      return res.status(400).json({
        mensaje: 'ID de pedido inválido'
      });
    }

    const conexion = await getPool();

    const resultado = await conexion.request()
      .input('PedidoID', sql.Int, pedidoID)
      .execute('dbo.sp_Pedidos_Confirmar');

    return res.json({
      mensaje: 'Pedido confirmado correctamente',
      pedido: resultado.recordset[0]
    });
  } catch (error) {
    return manejarError(res, error);
  }
}

async function cancelarPedido(req, res) {
  try {
    const pedidoID = Number(req.params.id);

    if (!validarID(pedidoID)) {
      return res.status(400).json({
        mensaje: 'ID de pedido inválido'
      });
    }

    const conexion = await getPool();

    if (!await usuarioPuedeVerPedido(
      conexion, pedidoID, req.session.usuario
    )) {
      return res.status(404).json({
        mensaje: 'Pedido no encontrado'
      });
    }

    const resultado = await conexion.request()
      .input('PedidoID', sql.Int, pedidoID)
      .execute('dbo.sp_Pedidos_Cancelar');

    const pedidoCancelado = resultado.recordset[0];

    await publicarEvento('pedido.cancelado', {
      usuarioID: pedidoCancelado.UsuarioID,
      pedidoID
    });

    return res.json({
      mensaje: 'Pedido cancelado e inventario liberado',
      pedido: pedidoCancelado
    });
  } catch (error) {
    return manejarError(res, error);
  }
}

module.exports = {
  crearPedido,
  consultarPedido,
  listarPedidos,
  confirmarPedido,
  cancelarPedido,
  usuarioPuedeVerPedido,
  verificarAccesoPedido
};
