const express = require('express');
const router = express.Router();

const estadoPedido = require('../controllers/estadoPedido.controller');

router.get('/', estadoPedido.listarEstados);

module.exports = router;
