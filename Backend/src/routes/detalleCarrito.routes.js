const express = require('express');
const router = express.Router();

const detalle = require('../controllers/detalleCarrito.controller');
const { verificarSesion } = require('../middlewares/auth.middleware');

router.use(verificarSesion);

router.get('/', detalle.listarDetalles);
router.post('/', detalle.agregarDetalle);
router.put('/:productoID', detalle.actualizarCantidad);
router.delete('/:productoID', detalle.eliminarDetalle);

module.exports = router;
