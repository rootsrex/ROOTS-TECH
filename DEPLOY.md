# Deploy en Railway

## Pasos

### 1. Crear proyecto en Railway
- Entra a [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
- Selecciona el repo `rootsrex/ROOTS-TECH`
- Railway detecta el `railway.toml` automáticamente

### 2. Agregar base de datos PostgreSQL
- En tu proyecto Railway → + New → Database → PostgreSQL
- Railway inyecta `DATABASE_URL` automáticamente al servicio

### 3. Variables de entorno (Settings → Variables)
Agrega estas variables en el servicio:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | una clave larga y aleatoria (ej: `openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | `7d` |
| `COMMISSION_RATE` | `0.20` |
| `PORT` | `4000` _(Railway lo inyecta solo)_ |

> `DATABASE_URL` la inyecta Railway automáticamente al conectar PostgreSQL.

### 4. Deploy
Railway hace el build y deploy automáticamente con cada push a `main`.

**Comandos que ejecuta Railway:**
```
Build:  cd backend && npm install && npm run build
Start:  cd backend && npm run db:migrate && node dist/index.js
```

### 5. Acceder a la app
- Railway te da una URL tipo `https://dancepay-production.up.railway.app`
- La API y el frontend salen de la misma URL

### Seed de datos iniciales (opcional)
Desde la terminal de Railway (o localmente apuntando a la DB de prod):
```bash
cd backend && DATABASE_URL="postgresql://..." npx tsx src/seed.ts
```
