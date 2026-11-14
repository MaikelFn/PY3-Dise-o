const express = require('express');
const router = express.Router();

const categoria = require('../controllers/categoria.controller');
const { verificarRol } = require('../middlewares/auth.middleware');

router.get('/', categoria.listarCategorias);
router.get('/:id', categoria.consultarCategoria);
router.post('/', verificarRol('Administrador'), categoria.crearCategoria);
router.put('/:id', verificarRol('Administrador'), categoria.actualizarCategoria);

module.exports = router;
