# ClickMarket Frontend

Interfaz de tienda construida con React y Vite. El catálogo, las categorías, la sesión y el carrito consultan la API existente; las pantallas de comprador, vendedor y administrador se determinan por el rol devuelto por la sesión.

## Desarrollo local

Configura las variables privadas requeridas por el backend en `Backend/.env`. No copies credenciales al frontend ni las publiques.

En una terminal:

```powershell
cd Backend
npm install
npm run dev
```

En otra terminal:

```powershell
cd Frontend
npm install
npm run dev
```

Vite lee únicamente el puerto `PORT` de `Backend/.env` para dirigir las solicitudes de `/api` e `/imagenes` al servidor local; si no está definido, usa el puerto `3000`. Las solicitudes del navegador conservan la cookie de sesión.

Para desplegar el frontend en otro origen, configura `VITE_API_URL` con la URL base de la API que incluya `/api`, y permite ese origen en la configuración existente del backend.

## Funcionalidad conectada

- Registro e inicio/cierre de sesión con cookie de sesión.
- Catálogo y categorías consultados desde la API.
- Carrito y checkout con selección o creación de dirección; el pedido reserva existencias y confirma un pago simulado por transferencia, sin solicitar datos bancarios ni mover dinero real.
- Panel de comprador con perfil y pedidos.
- Panel de vendedor con publicación de productos (incluye imagen e inventario), pedidos de su tienda e ingresos simulados de pedidos confirmados.
- Panel de administrador con consulta del catálogo, mantenimiento de categorías y listado global de pedidos.
- Accesibilidad desde el botón flotante con el símbolo de acceso: tamaño de texto reducido, normal o ampliado, modo de grises y restablecimiento de ajustes. Los cambios se aplican también al catálogo y a los paneles durante la navegación.

Las imágenes de productos se guardan en el almacenamiento local del backend. En despliegues, `Backend/public/productos` debe montarse en almacenamiento persistente.

El backend actual no expone operaciones para persistir favoritos, calificaciones u ofertas, ni listados globales de usuarios. Esas secciones no se simulan como información real.

## Patrón de diseño

Se aplica **Strategy** en `src/components/RoleDashboard.jsx`, mediante `dashboardDataStrategies`. Cada rol selecciona su propia estrategia para cargar perfil, productos o pedidos; el efecto común ejecuta la estrategia correspondiente y conserva una sola estructura de panel.

## Validación

```powershell
npm run lint
npm run build
```
