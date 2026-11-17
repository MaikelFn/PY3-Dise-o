class Notificacion {
  constructor(usuarioID, titulo, mensaje, pedidoID = null) {
    this.usuarioID = usuarioID;
    this.titulo = titulo;
    this.mensaje = mensaje;
    this.pedidoID = pedidoID;
  }
}

class NotificacionFactory {
  static crear(tipo, usuarioID, pedidoID) {
    switch (tipo) {
      case 'pedido.creado':
        return new Notificacion(
          usuarioID,
          'Pedido registrado',
          `Tu pedido #${pedidoID} fue registrado correctamente.`,
          pedidoID
        );

      case 'pedido.cancelado':
        return new Notificacion(
          usuarioID,
          'Pedido cancelado',
          `Tu pedido #${pedidoID} fue cancelado.`,
          pedidoID
        );

      case 'pago.aprobado':
        return new Notificacion(
          usuarioID,
          'Pago aprobado',
          `El pago de tu pedido #${pedidoID} fue aprobado.`,
          pedidoID
        );

      case 'pago.rechazado':
        return new Notificacion(
          usuarioID,
          'Pago rechazado',
          `El pago de tu pedido #${pedidoID} fue rechazado.`,
          pedidoID
        );

      case 'envio.enviado':
        return new Notificacion(
          usuarioID,
          'Pedido enviado',
          `Tu pedido #${pedidoID} está en camino.`,
          pedidoID
        );

      case 'envio.entregado':
        return new Notificacion(
          usuarioID,
          'Pedido entregado',
          `Tu pedido #${pedidoID} fue entregado.`,
          pedidoID
        );

      default:
        throw new Error(
          `Tipo de notificación no reconocido: ${tipo}`
        );
    }
  }
}

module.exports = {
  Notificacion,
  NotificacionFactory
};
