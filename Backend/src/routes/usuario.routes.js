const express = require('express');
const router = express.Router();

const usuario = require('../controllers/usuario.controller');
const {
  verificarSesion,
  verificarRol
} = require('../middlewares/auth.middleware');

router.get(
  '/',
  verificarRol('Administrador'),
  usuario.listarUsuarios
);

router.get('/:id', verificarSesion, usuario.consultarUsuario);

router.put('/:id', verificarSesion, usuario.actualizarUsuario);

router.patch(
  '/:id/desactivar',
  verificarRol('Administrador'),
  usuario.desactivarUsuario
);

router.patch(
  '/:id/rol',
  verificarRol('Administrador'),
  usuario.asignarRol
);

module.exports = router;
