const express = require('express');
const router = express.Router();

const inventario = require('../controllers/inventario.controller');
const { verificarRol } = require('../middlewares/auth.middleware');

router.get(
  '/productos/:id/inventario',
  inventario.consultarInventario
);

router.post(
  '/productos/:id/inventario',
  verificarRol('Vendedor'),
  inventario.agregarExistencias
);

module.exports = router;
