const multer = require('multer');

const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 10,
    fileSize: 5 * 1024 * 1024
  },
  fileFilter(_req, file, callback) {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error('La foto debe ser JPG, PNG o WebP.');
      error.status = 415;
      callback(error);
      return;
    }

    callback(null, true);
  }
});

function uploadProductImage(req, res, next) {
  const uploadImages = String(req.originalUrl || req.path).includes('/publicar')
    ? upload.array('imagenes', 10)
    : upload.single('imagen')

  uploadImages(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({
        mensaje: status === 413
          ? 'La foto no puede superar 5 MB.'
          : 'No se pudo procesar el archivo de imagen.'
      });
    }

    if (error.status === 415) {
      return res.status(error.status).json({
        mensaje: error.message
      });
    }

    return next(error);
  });
}

module.exports = uploadProductImage;
