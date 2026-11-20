function nombreCodigoPostgres(error) {
  if (typeof error?.code === 'string' && error.code.trim()) {
    return error.code;
  }

  return 'INTERNAL_ERROR';
}

function limpiarMensaje(error) {
  return String(error?.message || '').replace(/\n/g, ' ').trim();
}

function obtenerRespuesta(codigo, mensaje, mensajeGenerico) {
  switch (codigo) {
    case '23505':
      return {
        status: 409,
        mensaje: mensaje || 'Ya existe un registro con esos datos'
      };
    case '23503':
      return {
        status: 409,
        mensaje: mensaje || 'El registro está relacionado con otros datos'
      };
    case '23514':
      return {
        status: 400,
        mensaje: mensaje || 'Los datos incumplen una regla de validación'
      };
    case '22P02':
      return {
        status: 400,
        mensaje: mensaje || 'El identificador proporcionado no es válido'
      };
    case '22003':
      return {
        status: 400,
        mensaje: mensaje || 'Uno de los valores numéricos está fuera del rango permitido'
      };
    case 'P0001':
      return {
        status: obtenerStatusP0001(mensaje),
        mensaje: mensaje || mensajeGenerico
      };
    default:
      return {
        status: 500,
        mensaje: mensajeGenerico
      };
  }
}

function obtenerStatusP0001(mensaje) {
  const texto = mensaje.toLowerCase();
  const palabrasDeNoEncontrado = [
    'no existe',
    'no encontrado',
    'no pertenece',
    'no tiene',
    'no puede'
  ];

  const estado = palabrasDeNoEncontrado.some(palabra => texto.includes(palabra));
  if (estado) {
    return 404;
  }
  return 400;
}

function manejarErrorPostgres(error, res, mensajeGenerico) {
  const codigo = nombreCodigoPostgres(error);
  const mensaje = limpiarMensaje(error);
  const respuesta = obtenerRespuesta(codigo, mensaje, mensajeGenerico);

  console.error(mensajeGenerico, error);
  return res.status(respuesta.status).json({
    codigo,
    mensaje: respuesta.mensaje
  });
}

module.exports = {
  manejarErrorPostgres,
  nombreCodigoPostgres
};
