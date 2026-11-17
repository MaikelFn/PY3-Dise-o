const express = require('express');
const router = express.Router();

const carrito = require('../controllers/carrito.controller');
const { verificarSesion } = require('../middlewares/auth.middleware');

router.use(verificarSesion);

router.post('/', carrito.obtenerOCrearCarrito);
router.get('/', carrito.consultarCarrito);
router.delete('/', carrito.vaciarCarrito);

module.exports = router;
