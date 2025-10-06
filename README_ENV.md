# Configuración de Variables de Entorno

Este backend usa `@nestjs/config` y carga variables desde (prioridad descendente):
1. `.env.<NODE_ENV>` (por ejemplo `.env.production` si `NODE_ENV=production`)
2. `.env.local`
3. `.env`

## Variables principales

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| NODE_ENV | Entorno de ejecución | `development`, `production` |
| PORT | Puerto HTTP | `3000` |
| FRONTEND_URL | URL permitida para CORS en producción | `https://app.midominio.com` |
| DB_TYPE | Tipo de BD (soporta mysql) | `mysql` |
| DB_HOST | Host de la BD | `localhost` |
| DB_PORT | Puerto | `3306` |
| DB_USERNAME | Usuario BD | `admin` |
| DB_PASSWORD | Password BD | `xxxx` |
| DB_DATABASE | Nombre BD | `viadca` |
| DB_SSL | `true` para habilitar SSL (RDS/Aurora) | `true` |
| DB_LOGGING | Habilita logs SQL (`true`/`false`) | `false` |
| DB_SYNCHRONIZE | Usa `synchronize` de TypeORM (evitar en prod) | `false` |
| EXCEL_PROTECT | Protege hoja Excel generada | `true` |

## Recomendaciones de producción
- `DB_SYNCHRONIZE=false` y usar migraciones.
- `DB_LOGGING=false` salvo debugging puntual.
- `DB_SSL=true` en RDS (usa `rejectUnauthorized:false` por simplicidad; para mayor seguridad proveer CA raíz).
- Asegura `FRONTEND_URL` configurado para restringir CORS.
- Driver: se utiliza solamente `mysql2` (el paquete `mysql` clásico fue removido). No instales ambos para evitar conflictos.

## Ejemplo rápido `.env.production`
```
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://app.viadca.com
DB_TYPE=mysql
DB_HOST=mi-rds.amazonaws.com
DB_PORT=3306
DB_USERNAME=admin
DB_PASSWORD=***
DB_DATABASE=viadca
DB_SSL=true
DB_LOGGING=false
DB_SYNCHRONIZE=false
EXCEL_PROTECT=true
```

## Migraciones (pendiente si las adoptas)
Si decides dejar de usar `synchronize`, crea un script:
```
"typeorm:migration:generate": "ts-node ./node_modules/typeorm/cli.js migration:generate src/migrations/InitSchema -d src/data-source.ts"
```
Y un `data-source.ts` que reutilice las mismas variables de entorno.

## Troubleshooting
- Error SSL: revisa `DB_SSL` y versión de MySQL.
- Campos que faltan tras despliegue: probablemente `DB_SYNCHRONIZE` desactivado sin migraciones aplicadas.
- CORS bloqueado: confirma `FRONTEND_URL` y que el navegador envía origin esperado.

