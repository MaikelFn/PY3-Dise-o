
const { getPool } = require('../config/database');
const { publicarEvento } = require('../events/pedido.events');

// Verificar acceso al pedido
async function usuarioPuedeVerPedido(conexion, pedidoID, usuario) {
  const resultado = await conexion.query(
    'SELECT * FROM public.sp_pedidos_validaracceso($1, $2)',
    [pedidoID, usuario.id]
  );

  return resultado.rows.length > 0;
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
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al verificar acceso al pedido'
    });
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

    await publicarEvento('pedido.creado', {
      usuarioID: req.session.usuario.id,
      pedidoID
    });

    return res.status(201).json({
      mensaje: 'Pedido creado e inventario reservado',
      pedidoID
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al crear pedido'
    });
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

    return res.json({
      PedidoID: p.pedidoid,
      UsuarioID: p.usuarioid,
      DireccionID: p.direccionid,
      TipoEnvioID: p.tipoenvioid,
      EstadoPedidoID: p.estadopedidoid,
      FechaPedido: p.fechapedido,
      Total: p.total
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al consultar pedido'
    });
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

    return res.json(resultado.rows.map(p => ({
      PedidoID: p.pedidoid,
      UsuarioID: p.usuarioid,
      DireccionID: p.direccionid,
      TipoEnvioID: p.tipoenvioid,
      EstadoPedidoID: p.estadopedidoid,
      FechaPedido: p.fechapedido,
      Total: p.total
    })));

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al listar pedidos'
    });
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
      pedido: {
        PedidoID: p.pedidoid,
        UsuarioID: p.usuarioid,
        EstadoPedidoID: p.estadopedidoid,
        Total: p.total
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al confirmar pedido'
    });
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
      pedido: {
        PedidoID: p.pedidoid,
        UsuarioID: p.usuarioid,
        EstadoPedidoID: p.estadopedidoid,
        Total: p.total
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      mensaje: 'Error al cancelar pedido'
    });
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
