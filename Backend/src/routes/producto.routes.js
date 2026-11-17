const express = require('express');
const router = express.Router();
const producto = require('../controllers/producto.controller');

router.get('/', producto.listarProductos);
router.get('/:id', producto.consultarProducto);

module.exports = router;
