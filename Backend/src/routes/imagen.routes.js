const express = require('express');
const router = express.Router();

const imagen = require('../controllers/imagen.controller');
const { verificarRol } = require('../middlewares/auth.middleware');

router.get('/productos/:id/imagenes', imagen.listarImagenes);

router.post(
  '/productos/:id/imagenes',
  verificarRol('Vendedor'),
  imagen.agregarImagen
);

router.patch(
  '/imagenes/:id/principal',
  verificarRol('Vendedor'),
  imagen.establecerPrincipal
);

router.delete(
  '/imagenes/:id',
  verificarRol('Vendedor'),
  imagen.eliminarImagen
);

module.exports = router;
