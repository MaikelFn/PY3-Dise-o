const express = require('express');
const router = express.Router();
const carrito = require('../controllers/carrito.controller');
const { verificarSesion } = require('../middlewares/auth.middleware');

router.use(verificarSesion);
router.get('/', carrito.listarDetalles);
router.post('/items', carrito.agregarProducto);
router.patch('/items/:productoId', carrito.actualizarCantidad);
router.delete('/items/:productoId', carrito.eliminarProducto);

module.exports = router;
