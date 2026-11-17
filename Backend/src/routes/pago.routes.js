const express = require('express');
const router = express.Router();

const pago = require('../controllers/pago.controller');

const {
  verificarSesion,
  verificarRol
} = require('../middlewares/auth.middleware');

router.use(verificarSesion);

router.post('/', pago.registrarPago);
router.get('/:id', pago.consultarPago);

router.post(
  '/:id/aprobar',
  verificarRol('Administrador'),
  pago.aprobarPago
);

router.post(
  '/:id/rechazar',
  verificarRol('Administrador'),
  pago.rechazarPago
);

module.exports = router;
