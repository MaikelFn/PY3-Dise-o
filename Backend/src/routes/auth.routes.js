const express = require('express');
const router = express.Router();

const auth = require('../controllers/auth.controller');

router.post('/registro', auth.registrarUsuario);
router.post('/login', auth.iniciarSesion);
router.get('/sesion', auth.obtenerSesion);
router.post('/logout', auth.cerrarSesion);

module.exports = router;
