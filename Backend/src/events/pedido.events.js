const EventEmitter = require('node:events');

const eventos = new EventEmitter();

async function publicarEvento(tipo, datos) {
  const observadores = eventos.listeners(tipo);

  const resultados = await Promise.allSettled(
    observadores.map(observador => observador(datos))
  );

  for (const resultado of resultados) {
    if (resultado.status === 'rejected') {
      console.error(
        `Error en observador del evento ${tipo}:`,
        resultado.reason
      );
    }
  }
}

module.exports = {
  eventos,
  publicarEvento
};
