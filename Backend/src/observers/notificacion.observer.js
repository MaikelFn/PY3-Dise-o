const { sql, getPool } = require('../config/database');

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

  await conexion.request()
    .input('UsuarioID', sql.Int, notificacion.usuarioID)
    .input('Titulo', sql.NVarChar(150), notificacion.titulo)
    .input('Mensaje', sql.NVarChar(500), notificacion.mensaje)
    .input('PedidoID', sql.Int, notificacion.pedidoID)
    .execute('dbo.sp_Notificaciones_Crear');
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
  eventos.on(tipo, datos => guardarNotificacion(tipo, datos));
}

module.exports = {
  guardarNotificacion
};
