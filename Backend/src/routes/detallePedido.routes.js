const express = require('express');
const router = express.Router();

const detallePedido = require('../controllers/detallePedido.controller');
const { verificarSesion } = require('../middlewares/auth.middleware');

router.get(
  '/:id/detalles',
  verificarSesion,
  detallePedido.listarDetallesPedido
);

module.exports = router;
