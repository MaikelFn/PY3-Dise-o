
const { getPool } = require('../config/database');

const { eventos } = require('../events/pedido.events');

const {
  NotificacionFactory
} = require('../factories/notificacion.factory');

async function guardarNotificacion(tipo, datos) {
  const { usuarioID, pedidoID } = datos;

  const notificacion = NotificacionFactory.crear(
    tipo,
    usuarioID,
    pedidoID
  );

  const conexion = await getPool();

  await conexion.query(
    'SELECT * FROM public.sp_notificaciones_crear($1, $2, $3, $4)',
    [
      notificacion.usuarioID,
      notificacion.titulo,
      notificacion.mensaje,
      notificacion.pedidoID
    ]
  );
}

const tipos = [
  'pedido.creado',
  'pedido.cancelado',
  'pago.aprobado',
  'pago.rechazado',
  'envio.enviado',
  'envio.entregado'
];

for (const tipo of tipos) {
  eventos.on(tipo, datos => {
    guardarNotificacion(tipo, datos).catch(error => {
      console.error('Error al guardar notificación:', error);
    });
  });
}

module.exports = {
  guardarNotificacion
};
