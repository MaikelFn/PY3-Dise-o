const express = require('express');
const router = express.Router();

const notificacion = require('../controllers/notificacion.controller');

const {
  verificarSesion
} = require('../middlewares/auth.middleware');

router.use(verificarSesion);

router.get('/', notificacion.listarNotificaciones);

router.get('/:id', notificacion.consultarNotificacion);

router.patch('/leidas/todas', notificacion.marcarTodasLeidas);

router.patch('/:id/leida', notificacion.marcarLeida);

module.exports = router;
