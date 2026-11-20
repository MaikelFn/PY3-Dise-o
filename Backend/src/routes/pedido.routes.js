const express = require('express');
const router = express.Router();

const pedido = require('../controllers/pedido.controller');
const pago = require('../controllers/pago.controller');
const envio = require('../controllers/envio.controller');
const {
  verificarSesion,
  verificarRol
} = require('../middlewares/auth.middleware');
const { verificarAccesoPedido } = pedido;

router.use(verificarSesion);

router.get(
  '/administracion',
  verificarRol('Administrador'),
  pedido.listarPedidosAdministrador
);
router.get(
  '/vendedor',
  verificarRol('Vendedor'),
  pedido.listarPedidosVendedor
);
router.get('/', pedido.listarPedidos);
router.get('/:id', pedido.consultarPedido);
router.post('/', verificarRol('Comprador'), pedido.crearPedido);
router.post(
  '/checkout-simulado',
  verificarRol('Comprador'),
  pedido.crearPedidoConPagoSimulado
);

router.post(
  '/:id/confirmar',
  verificarRol('Administrador'),
  pedido.confirmarPedido
);

router.post('/:id/cancelar', pedido.cancelarPedido);

router.get('/:id/pagos', verificarAccesoPedido, pago.listarPagosPorPedido);
router.get('/:id/envio', verificarAccesoPedido, envio.consultarEnvioPorPedido);

module.exports = router;
