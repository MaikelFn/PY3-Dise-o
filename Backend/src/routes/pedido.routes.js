const express = require('express');
const router = express.Router();

const pedido = require('../controllers/pedido.controller');
const {
  verificarSesion,
  verificarRol
} = require('../middlewares/auth.middleware');

router.use(verificarSesion);

router.get('/', pedido.listarPedidos);
router.get('/:id', pedido.consultarPedido);
router.post('/', pedido.crearPedido);

router.post(
  '/:id/confirmar',
  verificarRol('Administrador'),
  pedido.confirmarPedido
);

router.post('/:id/cancelar', pedido.cancelarPedido);

module.exports = router;
