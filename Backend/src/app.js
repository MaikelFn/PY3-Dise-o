const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const authRoutes = require('./routes/auth.routes');

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
app.use('/api/auth', authRoutes);
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((error, _req, res, _next) => {
  console.error('Error interno:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});
module.exports = app;
