const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const authRoutes = require('./routes/auth.routes');
const categoriaRoutes = require('./routes/categoria.routes');
const productoRoutes = require('./routes/producto.routes');
const carritoRoutes = require('./routes/carrito.routes');
const { getPool } = require('./config/database');

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
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ClickMarket API' });
});
app.get('/api/health/db', async (_req, res) => {
  try {
    const conexion = await getPool();
    const resultado = await conexion.request().query('SELECT DB_NAME() AS databaseName');
    res.json({
      status: 'ok',
      database: resultado.recordset[0].databaseName
    });
  } catch (error) {
    console.error('Error al comprobar SQL Server:', error);
    res.status(503).json({ status: 'error', message: 'Base de datos no disponible' });
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/carrito', carritoRoutes);
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((error, _req, res, _next) => {
  console.error('Error interno:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});
module.exports = app;
