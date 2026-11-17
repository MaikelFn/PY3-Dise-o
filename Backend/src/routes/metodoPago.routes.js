const express = require('express');
const router = express.Router();

const metodoPago = require('../controllers/metodoPago.controller');

router.get('/', metodoPago.listarMetodosPago);

module.exports = router;
