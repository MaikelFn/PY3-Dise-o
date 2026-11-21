const express = require('express');
const router = express.Router();

const imagen = require('../controllers/imagen.controller');
const { verificarRol } = require('../middlewares/auth.middleware');
const uploadProductImage = require('../middlewares/productImageUpload.middleware');

router.get('/productos/:id/imagenes', imagen.listarImagenes);

router.post(
  '/productos/:id/imagenes',
  verificarRol('Vendedor'),
  uploadProductImage,
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
