# ClickMarket - desarrollo local

## Requisitos

- Node.js y npm
- SQL Server accesible desde esta computadora

## Configuración

1. Copiar `Backend/.env.example` a `.env` en la raíz del repositorio.
2. Completar las credenciales de SQL Server y establecer un valor aleatorio largo para `SESSION_SECRET`. El archivo `.env` está excluido de Git.
3. Crear la base y tablas con `Scrips/Creacion/00_Crear_BD.sql` y `01_Crear_Tablas.sql`.
4. Insertar datos iniciales con `02_Crear_Datos_Iniciales.sql`.
5. Si la base ya existía, ejecutar `03_Actualizar_Categorias_Activa.sql` y `04_Actualizar_Catalogos_Activos.sql` antes de actualizar los procedimientos almacenados. En una base nueva, estos pasos son idempotentes.
6. Ejecutar los procedimientos de `Scrips/Procesos Almacenados` en orden numérico.
7. Instalar dependencias y arrancar la API:

   ```powershell
   cd Backend
   npm install
   npm run dev
   ```

El backend lee primero el `.env` de la raíz y completa cualquier variable faltante con `Backend/.env`. No compartas ni subas el `.env`.

## Aplicaciones

Con la API activa, abre otra terminal:

```powershell
cd Frontend
npm install
npm run dev
```

Vite reenvía `/api` a `http://localhost:3000`; el navegador usa la misma dirección de origen y envía la cookie de sesión automáticamente. Para usar otro host de API, define `VITE_API_URL` en `Frontend/.env.local`.

## Comprobaciones y rutas disponibles

- `GET /api/health`: estado de Express.
- `GET /api/health/db`: verifica una consulta real a SQL Server.
- `/api/auth`: registro, login, sesión y logout.
- `/api/categorias`: lectura y operaciones administrativas de categorías.
- `GET /api/productos` y `GET /api/productos/:id`: catálogo y búsqueda.
- `/api/carrito`: operaciones de carrito; requiere sesión iniciada.

El backend usa el `MemoryStore` predeterminado de `express-session`, adecuado solo para desarrollo. Para producción se debe configurar un almacén persistente de sesiones y HTTPS. Pedidos, pagos, envíos y notificaciones tienen procedimientos SQL, pero aún no están expuestos como rutas HTTP.
