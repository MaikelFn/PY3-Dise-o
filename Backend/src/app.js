const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const authRoutes = require('./routes/auth.routes');
const categoriaRoutes = require('./routes/categoria.routes');
const productoRoutes = require('./routes/producto.routes');
const rolRoutes = require('./routes/rol.routes');
const vendedorRoutes = require('./routes/vendedor.routes');
const direccionRoutes = require('./routes/direccion.routes');
const imagenRoutes = require('./routes/imagen.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const carritoRoutes = require('./routes/carrito.routes');
const detalleCarritoRoutes = require('./routes/detalleCarrito.routes');
const estadoPedidoRoutes = require('./routes/estadoPedido.routes');
const pedidoRoutes = require('./routes/pedido.routes');
const detallePedidoRoutes = require('./routes/detallePedido.routes');
const metodoPagoRoutes = require('./routes/metodoPago.routes');
const pagoRoutes = require('./routes/pago.routes');
const tipoEnvioRoutes = require('./routes/tipoEnvio.routes');
const envioRoutes = require('./routes/envio.routes');

const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '100kb' }));
app.use(session({
  name: 'clickmarket.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax'
  }
}));
app.use(
  '/imagenes',
  express.static(path.join(__dirname, '../public'))
);
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/vendedores', vendedorRoutes);
app.use('/api/direcciones', direccionRoutes);
app.use('/api', imagenRoutes);
app.use('/api', inventarioRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/carrito/detalles', detalleCarritoRoutes);
app.use('/api/estados-pedido', estadoPedidoRoutes);
app.use('/api/pedidos', detallePedidoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/metodos-pago', metodoPagoRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/tipos-envio', tipoEnvioRoutes);
app.use('/api/envios', envioRoutes);
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((error, _req, res, _next) => {
  console.error('Error interno:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});
module.exports = app;
