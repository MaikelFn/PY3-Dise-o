const express = require('express');
const router = express.Router();

const rol = require('../controllers/rol.controller');

router.get('/', rol.listarRoles);

module.exports = router;
