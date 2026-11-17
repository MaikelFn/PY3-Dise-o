const express = require('express');
const router = express.Router();

const tipoEnvio = require('../controllers/tipoEnvio.controller');

router.get('/', tipoEnvio.listarTiposEnvio);

module.exports = router;
