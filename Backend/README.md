# ClickMarket Backend

## Requisitos

- Node.js y npm
- PostgreSQL (la configuración del proyecto utiliza Neon)

## Configuración

1. Configura `DATABASE_URL` con la cadena de conexión PostgreSQL y `SESSION_SECRET` con un valor aleatorio largo en el `.env` de la raíz o en `Backend/.env`. No compartas ni subas ese archivo.
2. Crea la base y las tablas con `Scrips/Creacion/00_Crear_BD.sql` y `01_Crear_Tablas.sql`.
3. Inserta los datos iniciales con `02_Crear_Datos_Iniciales.sql`.
4. Si la base ya existía, ejecuta `03_Actualizar_Categorias_Activa.sql` y `04_Actualizar_Catalogos_Activos.sql` antes de actualizar los procedimientos almacenados.
5. Ejecuta los procedimientos de `Scrips/Procesos Almacenados` en orden numérico, incluido `18_SP_Pedidos_Dashboards.sql`.
6. Instala dependencias e inicia la API:

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
- `GET /api/health/db`: verifica una consulta real a PostgreSQL.
- `/api/auth`: registro, login, sesión y logout.
- `/api/categorias`: lectura y operaciones administrativas de categorías.
- `GET /api/productos` y `GET /api/productos/:id`: catálogo y búsqueda.
- El catálogo incluye la imagen principal y las existencias disponibles de cada producto.
- `POST /api/productos/publicar`: publicación de producto por un vendedor; recibe `multipart/form-data` con nombre, categoría, precio, existencias, descripción y una imagen JPG, PNG o WebP de hasta 5 MB.
- Las imágenes cargadas se guardan en `Backend/public/productos` y se sirven mediante `/imagenes`; el almacenamiento de ese directorio debe persistir en el entorno de despliegue.
- `/api/carrito`: operaciones de carrito; requiere sesión iniciada.
- `/api/direcciones` y `GET /api/tipos-envio`: datos de entrega para el checkout.
- `/api/pedidos`: historial del comprador y creación exclusiva para compradores de pedidos pendientes desde el carrito.
- `GET /api/pedidos/vendedor` y `GET /api/pedidos/administracion`: pedidos asociados al vendedor autenticado y listado global exclusivo para administradores.

El backend usa el `MemoryStore` predeterminado de `express-session`, adecuado solo para desarrollo. Para producción se debe configurar un almacén persistente de sesiones y HTTPS.
