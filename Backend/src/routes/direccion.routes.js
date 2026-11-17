const express = require('express');
const router = express.Router();

const direccion = require('../controllers/direccion.controller');
const {
  verificarSesion
} = require('../middlewares/auth.middleware');

router.use(verificarSesion);

router.get('/', direccion.listarDirecciones);
router.post('/', direccion.agregarDireccion);
router.put('/:id', direccion.actualizarDireccion);
router.delete('/:id', direccion.eliminarDireccion);

module.exports = router;
