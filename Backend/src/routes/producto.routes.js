const express = require('express');
const router = express.Router();

const producto = require('../controllers/producto.controller');
const {
  verificarSesion,
  verificarRol
} = require('../middlewares/auth.middleware');
const uploadProductImage = require('../middlewares/productImageUpload.middleware');

router.get('/', producto.listarProductos);
router.get('/:id', producto.consultarProducto);
router.post(
  '/publicar',
  verificarSesion,
  verificarRol('Vendedor'),
  uploadProductImage,
  producto.publicarProducto
);
router.post('/', verificarSesion, producto.crearProducto);
router.put('/:id', verificarSesion, producto.actualizarProducto);
router.delete('/:id', verificarSesion, producto.desactivarProducto);

module.exports = router;
