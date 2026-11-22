# ClickMarket


## Estructura del proyecto

```
PY3-Dise-o/
├── Backend/
│   ├── server.js              
│   ├── src/
│   │   ├── app.js              
│   │   ├── config/database.js  
│   │   ├── controllers/        
│   │   ├── adapters/           
│   │   ├── routes/             
│   │   ├── middlewares/        
│   │   ├── events/            
│   │   ├── observers/         
│   │   ├── factories/          
│   │   ├── models/             
│   │   ├── services/          
│   │   └── utils/              
│   └── public/productos/       
├── Frontend/
│   └── src/                   
└── README.md
```

## Requisitos

- Windows 10/11, Linux o macOS.
- [Node.js](https://nodejs.org) 22 LTS o superior (Vite 8 lo requiere).
- Git.
- Acceso a una base de datos PostgreSQL con el esquema y las funciones `sp_*` de ClickMarket ya creadas.


## Puesta en marcha

### 1. Descargar el repositorio

```powershell o cmd
git clone https://github.com/MaikelFn/PY3-Dise-o.git
cd PY3-Dise-o
```

### 2. Configurar el backend

Crea `Backend/.env`:

```env
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://neondb_owner:npg_yD8KTnesHQ7B@ep-broad-credit-bcyib2zt-pooler.c-16.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SESSION_SECRET=BAILECOMOJUANALACUBANAELRITMOQUESESIENTESABROSOCOMOJUGODEMANZANA
```

### 3. Instalar e iniciar el backend

```powershell o cmd
cd Backend
npm install
npm run dev
```

La API queda en `http://localhost:3000`. Verifica que responde y que llega a la base:

### 4. Instalar e iniciar el frontend

En una segunda terminal:

```powershell o cmd
cd Frontend
npm install
npm run dev
```

Abre la URL que muestra Vite (normalmente `http://localhost:5173`).

### 5. Detener

`Ctrl+C` en cada terminal.


## Credenciales de prueba

```
Rol	                  Correo	                    Contraseña
Vendedor	vendedor2@demo.clickmarket.test	    6sZcUFy15U4l2OfD4XBe
Comprador	comprador1@demo.clickmarket.test	_sNZ05R9xuZHnXeIImW_
Comprador	comprador2@demo.clickmarket.test	THTnxF4sp6lu7qws3dQ4
Comprador	comprador3@demo.clickmarket.test	iD1VWHtOR-R5D7MaSw-H
Administrador demo	admin@demo.clickmarket.test	x7gqMllSESH9t6glmqLt
```