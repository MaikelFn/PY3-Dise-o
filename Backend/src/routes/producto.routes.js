const express = require('express');
const router = express.Router();

const producto = require('../controllers/producto.controller');
const { verificarSesion } = require('../middlewares/auth.middleware');

router.get('/', producto.listarProductos);
router.get('/:id', producto.consultarProducto);
router.post('/', verificarSesion, producto.crearProducto);
router.put('/:id', verificarSesion, producto.actualizarProducto);
router.delete('/:id', verificarSesion, producto.desactivarProducto);

module.exports = router;
