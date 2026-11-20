# ClickMarket

Marketplace desarrollado con React, Vite, Node.js, Express y PostgreSQL. Esta guía explica cómo iniciarlo localmente en una computadora Windows para su revisión.

## Ejecutar el proyecto localmente

### Requisitos

- Windows 10 u 11 y PowerShell.
- Git.
- Node.js 22 LTS (Vite requiere Node.js 20.19 o superior, o 22.12 o superior).
- Acceso a Internet y a una base de datos PostgreSQL con el esquema y los datos de ClickMarket. El proyecto de evaluación utiliza Neon.

Verifica las instalaciones:

```powershell
git --version
node --version
npm --version
```

### 1. Descargar el repositorio

Clona el repositorio y entra a su carpeta:

```powershell
git clone https://github.com/MaikelFn/PY3-Dise-o.git
cd PY3-Dise-o
```

Si ya descargaste el proyecto como ZIP, descomprímelo y abre PowerShell en la carpeta `PY3-Dise-o`.

### 2. Configurar la conexión a PostgreSQL

En la carpeta `Backend`, crea un archivo llamado `.env`:

```powershell
notepad Backend\.env
```

Agrega estas variables, sustituyendo `DATABASE_URL` por la cadena de conexión PostgreSQL proporcionada para la evaluación:

```env
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://USUARIO:CONTRASENA@HOST/BASE?sslmode=require
SESSION_SECRET=REEMPLAZAR_POR_UN_VALOR_ALEATORIO
```

Genera un valor para `SESSION_SECRET` con:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado en `SESSION_SECRET`. Guarda el archivo como `Backend/.env` (sin extensión `.txt`). No publiques ni subas este archivo a Git. Si el profesor necesita conectarse a la base Neon de evaluación, comparte únicamente `DATABASE_URL` por un canal privado autorizado; el profesor puede generar su propio `SESSION_SECRET`. `.env` está excluido de Git.

### 3. Preparar la base de datos (solo si se usa una base vacía)

Si te proporcionaron la conexión a la base Neon de evaluación, **no ejecutes estos scripts**: esa base ya contiene la estructura, los procedimientos y los datos.

Para configurar una base PostgreSQL nueva:

1. Crea una base vacía y conéctate a ella. La migración no crea la base de datos; requiere que el esquema `public` no contenga ya las tablas de ClickMarket.
2. Ejecuta una sola vez [`MigracionPostgres.sql`](./Scrips/Creacion/MigracionPostgres.sql). Este script crea las tablas y catálogos iniciales.
3. Ejecuta los procedimientos almacenados en este orden:
   1. [`00_SP_Usuarios_Roles_Vendedores.sql`](./Scrips/Procesos%20Almacenados/00_SP_Usuarios_Roles_Vendedores.sql)
   2. [`02_SP_Direcciones_Categorias_Productos.sql`](./Scrips/Procesos%20Almacenados/02_SP_Direcciones_Categorias_Productos.sql)
   3. [`03_SP_ImagenesProducto_Inventario_Carrito.sql`](./Scrips/Procesos%20Almacenados/03_SP_ImagenesProducto_Inventario_Carrito.sql)
   4. [`04_SP_DetallesCarrito_EstadosPedido.sql`](./Scrips/Procesos%20Almacenados/04_SP_DetallesCarrito_EstadosPedido.sql)
   5. [`05_SP_Pedidos.sql`](./Scrips/Procesos%20Almacenados/05_SP_Pedidos.sql)
   6. [`06_SP_DetallesPedido_MetodosPago_Pago.sql`](./Scrips/Procesos%20Almacenados/06_SP_DetallesPedido_MetodosPago_Pago.sql)
   7. [`07_SP_TiposEnvio_Envios_Notificaciones.sql`](./Scrips/Procesos%20Almacenados/07_SP_TiposEnvio_Envios_Notificaciones.sql)
   8. [`16_SP_Envios.sql`](./Scrips/Procesos%20Almacenados/16_SP_Envios.sql)
   9. [`17_SP_Notificaciones.sql`](./Scrips/Procesos%20Almacenados/17_SP_Notificaciones.sql)
   10. [`18_SP_Pedidos_Dashboards.sql`](./Scrips/Procesos%20Almacenados/18_SP_Pedidos_Dashboards.sql)

La migración base no crea las cuentas de demostración ni los productos de prueba mostrados abajo. Para revisar los roles y datos de evaluación, usa la base de datos proporcionada para el proyecto.

### 4. Instalar e iniciar el backend

Desde la carpeta raíz del repositorio, abre una terminal de PowerShell:

```powershell
cd Backend
npm ci
npm run dev
```

Deja esta terminal abierta. La API debe iniciar en `http://localhost:3000`. Para comprobar que responde y que puede consultar la base, abre `http://localhost:3000/api/categorias` en el navegador; debe devolver una lista JSON.

### 5. Instalar e iniciar el frontend

Abre una segunda terminal de PowerShell, vuelve a la carpeta raíz del repositorio y ejecuta:

```powershell
cd Frontend
npm ci
npm run dev
```

Abre la dirección que muestra Vite, normalmente `http://localhost:5173`. Vite reenvía `/api` y `/imagenes` al backend local; por eso ambas terminales deben permanecer abiertas. No se requiere un archivo `.env` en `Frontend` para el uso local predeterminado.

### 6. Revisar la aplicación

Explora el catálogo, las categorías y la búsqueda. Usa las cuentas de demostración que aparecen al final de este README para revisar las vistas de comprador, vendedor y administrador.

**Importante:** una compra crea un pedido pendiente y reserva existencias en la base conectada, aunque no realiza un cobro real. Publicar productos también escribe en esa base. Evita hacer compras o publicaciones de prueba en la base compartida sin autorización.

Las imágenes que se carguen durante la revisión se guardan en `Backend/public/productos` en esa computadora; no se guardan en Git.

### 7. Detener la aplicación

En cada terminal, presiona `Ctrl+C` para detener el frontend y el backend.

### Problemas frecuentes

- **Falta `DATABASE_URL` o falla la conexión:** revisa que `Backend/.env` exista, que la cadena corresponda a PostgreSQL y que la base esté disponible desde Internet.
- **El frontend no conecta con la API:** confirma que el backend siga activo en el puerto indicado por `PORT` y que `FRONTEND_ORIGIN` sea `http://localhost:5173`.
- **Faltan tablas o procedimientos almacenados:** si usas una base nueva, vuelve a revisar el paso 3 y el orden de ejecución de los scripts.
- **Error de versión de Node.js:** comprueba `node --version` e instala Node.js 22 LTS.

## Cuentas de demostración

Rol	                  Correo	                    Contraseña
Vendedor	vendedor1@demo.clickmarket.test	    3oTYPozG6wkno1iTD0fe
Vendedor	vendedor2@demo.clickmarket.test	    6sZcUFy15U4l2OfD4XBe
Comprador	comprador1@demo.clickmarket.test	_sNZ05R9xuZHnXeIImW_
Comprador	comprador2@demo.clickmarket.test	THTnxF4sp6lu7qws3dQ4
Comprador	comprador3@demo.clickmarket.test	iD1VWHtOR-R5D7MaSw-H
Administrador demo	admin@demo.clickmarket.test	x7gqMllSESH9t6glmqLt
