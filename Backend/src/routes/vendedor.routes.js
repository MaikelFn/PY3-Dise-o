const express = require('express');
const router = express.Router();

const vendedor = require('../controllers/vendedor.controller');
const {
  verificarSesion,
  verificarRol
} = require('../middlewares/auth.middleware');

router.get('/', vendedor.listarVendedores);
router.get('/:id', vendedor.consultarVendedor);

router.post(
  '/',
  verificarRol('Vendedor'),
  vendedor.registrarVendedor
);

router.put(
  '/:id',
  verificarRol('Vendedor'),
  vendedor.actualizarVendedor
);

router.delete(
  '/:id',
  verificarRol('Administrador'),
  vendedor.desactivarVendedor
);

module.exports = router;
