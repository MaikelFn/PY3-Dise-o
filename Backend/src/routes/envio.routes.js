const express = require('express');
const router = express.Router();

const envio = require('../controllers/envio.controller');

const {
  verificarSesion,
  verificarRol
} = require('../middlewares/auth.middleware');

router.use(verificarSesion);

router.get('/:id', envio.consultarEnvio);

router.patch(
  '/:id/estado',
  verificarRol('Administrador'),
  envio.actualizarEstadoEnvio
);

module.exports = router;
