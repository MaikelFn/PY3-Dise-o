# ClickMarket Backend - Paso 1

## Instalación
1. Abrir la carpeta en VS Code.
2. Copiar `.env.example` como `.env` y configurar credenciales reales de SQL Server.
3. Ejecutar `npm install`.
4. Ejecutar `npm run dev`.

## Verificar
- `http://localhost:3000/api/health` comprueba Express.
- `http://localhost:3000/api/health/db` comprueba SQL Server y ClickMarketDB.

Si la BD está en otro puerto, actualizar `DB_PORT` en `.env`.
Nunca subir `.env` al repositorio.
