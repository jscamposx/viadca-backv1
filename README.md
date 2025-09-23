# Viadca Back v1

![Viadca](src/assets/imagenes/logo.png)

API REST de gestión de viajes y paquetes turísticos construida con NestJS, TypeScript y MySQL. Incluye autenticación con JWT (cookie HttpOnly + Bearer fallback), subida de archivos a Cloudinary, generación de Excel, caché, rate limiting, limpieza automática de registros e imágenes, y módulos de administración.

> Stack principal: NestJS 11, TypeScript 5, Express 5, TypeORM 0.3, MySQL 8, pnpm.

## Tabla de contenido

- Descripción y funcionalidades
- Requisitos
- Instalación y ejecución
- Variables de entorno (.env)
- Estructura del proyecto
- Scripts disponibles
- Endpoints principales (API)
- Seguridad y buenas prácticas
- Caché y rate limiting
- Subida de imágenes (Cloudinary)
- Generación de Excel
- Limpieza automática (cron)
- Pruebas y linting
- Despliegue
- Licencia

## Descripción y funcionalidades

Este backend centraliza la gestión de:

- Usuarios: registro, verificación de email, login/logout, perfil, recuperación y restablecimiento de contraseña.
- Paquetes turísticos: CRUD administrativo, imágenes (Cloudinary), listados públicos optimizados y estadísticas.
- Mayoristas: CRUD administrativo y estadísticas.
- Contacto: configuración pública de datos de contacto/redes con caché.
- Subida de imágenes: endpoints admin para subir/borrar en Cloudinary.
- Generación de Excel: exportación de paquetes a Excel (ExcelJS) con template propio.
- Mantenimiento: tareas de limpieza de soft-deletes e imágenes huérfanas programadas.

Características transversales:

- Validación y transformación de DTOs con `class-validator`/`class-transformer` y `ValidationPipe` global.
- CORS configurable por entorno, cookies HttpOnly, `trust proxy` habilitado.
- Rate limiting global y por endpoint con `@nestjs/throttler`.
- Caché en memoria con `@nestjs/cache-manager` para respuestas públicas y estadísticas.
- Compresión HTTP y límites elevados de payload para operaciones administrativas.

## Requisitos

- Node.js 18+ (recomendado 20+ LTS)
- pnpm 8+
- MySQL 8 (o compatible)
- Cuenta de Cloudinary (para subir imágenes)

## Instalación y ejecución

1. Instalar dependencias

```bash
pnpm install
```

1. Crear archivo de entorno según tu entorno: `.env.development`, `.env.local` o `.env`

1. Ejecutar

```bash
# desarrollo (watch)
pnpm run start:dev

# desarrollo simple
pnpm run start

# producción (compila y levanta dist/ con NODE_ENV=production)
pnpm run build
pnpm run start:prod
```

Por defecto escucha en el puerto `3000` o el definido en `PORT`.

## Variables de entorno (.env)

El módulo de configuración carga (en orden): `.env.{NODE_ENV}`, `.env.local`, `.env`.

- Servidor
  - `PORT=3000`
  - `NODE_ENV=development|production`
  - `FRONTEND_URL=https://tu-frontend.com` (origins permitidos en producción)
  - `COOKIE_DOMAIN=.tudominio.com` (opcional; útil con subdominios en prod)

- Base de datos (TypeORM MySQL)
  - `DB_HOST=localhost`
  - `DB_PORT=3306`
  - `DB_USERNAME=usuario`
  - `DB_PASSWORD=clave`
  - `DB_DATABASE=viadca`

- Autenticación / JWT
  - `JWT_SECRET=super-secreto-cámbialo`

- Cloudinary
  - `CLOUDINARY_CLOUD_NAME=xxxx`
  - `CLOUDINARY_API_KEY=xxxx`
  - `CLOUDINARY_API_SECRET=xxxx`

- Email (SMTP)
  - `SMTP_HOST=smtp.example.com`
  - `SMTP_PORT=587` (465 para SSL)
  - `SMTP_SECURE=false` (true si usas 465)
  - `SMTP_USER=usuario`
  - `SMTP_PASS=clave`
  - `SMTP_FROM_NAME=Viadca`
  - `SMTP_FROM_EMAIL=no-reply@tudominio.com`

- Limpieza (cleanup)
  - `CLEANUP_RETENTION_DAYS=14`
  - `CLEANUP_HOUR=2`
  - `CLEANUP_MINUTE=0`
  - `CLEANUP_AUTO_HARD_DELETE=true`
  - `CLEANUP_AUTO_IMAGE_CLEANUP=true`
  - `CLEANUP_DETAILED_LOGS=false`

## Estructura del proyecto

```text
src/
  app.module.ts           # Módulo raíz: Config, Cache, Throttler, TypeORM, módulos de dominio
  main.ts                 # Bootstrap: CORS, pipes globales, compresión, cookies, body limits

  usuarios/               # Autenticación, guardas, DTOs y servicios de usuarios
    usuarios.controller.ts
    usuarios.service.ts
    guards/
      auth.guard.ts
      admin.guard.ts
    decorators/user.decorator.ts
    dto/

  paquetes/               # Gestión de paquetes turísticos
    paquetes.controller.ts
    paquetes.service.ts
    dto/
    entidades/paquete.entity.ts

  mayoristas/             # Gestión de mayoristas
    mayoristas.controller.ts
    mayoristas.service.ts

  contacto/               # Datos de contacto/redes públicas (con caché)
    contacto.controller.ts
    contacto.service.ts

  cloudinary/             # Integración con Cloudinary para imágenes
    upload.controller.ts
    cloudinary.service.ts
    cloudinary.module.ts

  excel/                  # Generación de reportes Excel
    excel.service.ts
    templates/paquete-excel.template.ts

  common/                 # Limpieza programada y utilidades comunes
    cleanup.module.ts
    services/cleanup.service.ts
    config/cleanup.config.ts

  entities/               # Entidades TypeORM compartidas (Usuario, Hotel, Imagen, etc.)
  utils/                  # Utilidades (interceptores, helpers)
```

## Scripts disponibles

Desde `package.json`:

- `pnpm run start` — Inicia la app.
- `pnpm run start:dev` — Watch mode con `NODE_ENV=dev`.
- `pnpm run start:prod` — Ejecuta `dist/main` con `NODE_ENV=production`.
- `pnpm run build` — Compila TypeScript.
- `pnpm run lint` — Lint con ESLint.
- `pnpm run format` — Formatea con Prettier.
- `pnpm run test` — Tests unitarios con Jest.
- `pnpm run test:e2e` — Tests e2e.
- `pnpm run test:cov` — Cobertura.

## Endpoints principales (API)

Base URL: `http://localhost:{PORT}` (por defecto `3000`).

- Usuarios (`/usuarios`)
  - `POST /register` — Registro (rate limit: 5/min).
  - `POST /verify-email` — Verificar correo.
  - `POST /login` — Login, setea cookie `access_token` HttpOnly (rate limit: 5/min).
  - `POST /logout` — Logout, limpia cookie.
  - `POST /forgot-password` — Solicita reset (rate limit: 5/min).
  - `POST /reset-password` — Restablece contraseña (rate limit: 5/min).
  - `GET /profile` — Perfil autenticado (rate limit: 60/min).
  - `PATCH /profile` — Actualiza perfil (rate limit: 20/min).

- Paquetes públicos (`/paquetes`)
  - `GET /listado` — Listado simple para tarjetas (cache 5 min; 100 req/min).
  - `GET /:codigoUrl` — Detalle público por código.

- Administración de paquetes (`/admin/paquetes`) [requiere rol admin]
  - `GET /stats/overview` — KPIs (cache 30s).
  - `POST /` — Crear paquete (payload grande permitido).
  - `POST /:id/imagenes` — Agregar imagen a paquete.
  - `GET /` — Listado paginado (filtros en `query`).
  - `GET /:id` — Detalle.
  - `PATCH /:id` — Actualizar paquete (payload grande permitido).
  - `DELETE /:id` — Soft delete.
  - `PATCH /:id/restore` — Restaurar.
  - `GET /deleted/list` — Listar soft-deleted.
  - `GET /custom/hoteles` — Hoteles personalizados (isCustom=true).
  - `DELETE /:id/hard` — Eliminación permanente.
  - `GET /excel/:id` — Descargar Excel del paquete.

- Administración de mayoristas (`/admin/mayoristas`) [requiere rol admin]
  - CRUD completo, `GET /stats/overview` con cache 30s, soft/hard delete y restore.

- Contacto (`/contacto`)
  - `GET /` — Obtiene datos públicos (cache 5 min).
  - `POST /`, `PATCH /`, `DELETE /` — Administrar (requiere admin).

- Subidas (Cloudinary) (`/admin/upload`) [requiere rol admin]
  - `POST /image` — Subir imagen (campo `file`, opcional `folder`).
  - `POST /images` — Subir múltiples (campo `files`, máx. 10).
  - `DELETE /image/:publicId` — Borrar por `public_id`.

- Limpieza (`/admin/cleanup`) [requiere rol admin]
  - `GET /stats` — Estado y próximos runs (cache 30s).
  - `POST /run` — Ejecuta limpieza manual (soft-deletes e imágenes).
  - `POST /hard-delete` — Forzar hard delete de expirados.
  - `POST /cleanup-images` — Forzar limpieza de imágenes huérfanas.

## Seguridad y buenas prácticas

- Autenticación: JWT firmado con `JWT_SECRET`. El token se entrega en:
  - Cookie `access_token` HttpOnly (predeterminado). En producción sobre HTTPS usa `SameSite=None; Secure` y opcionalmente `COOKIE_DOMAIN`.
  - Respuesta JSON como fallback (para navegadores que bloqueen cookies). El frontend puede enviarlo como `Authorization: Bearer <token>`.

- Validación: `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform`.

- CORS: En prod, `origin` restringido a `FRONTEND_URL`. En dev, `origin: true`.

- Body size: JSON y urlencoded hasta `200mb`. Interceptor `LargePayloadInterceptor` en endpoints admin de paquetes para registrar tamaño y tiempos de respuesta.

- TypeORM `synchronize: true`: útil en desarrollo. En producción se recomienda migraciones y desactivar `synchronize`.

## Caché y rate limiting

- Caché global (memoria): TTL por defecto 300s, máx. 1000 ítems. Endpoints usan `CacheInterceptor`, `@CacheKey` y `@CacheTTL` cuando aplica.

- Rate limiting global (`@nestjs/throttler`):
  - 60 req/min por IP (ventana 60s)
  - 20 req/10s por IP (control de ráfagas)

- Overrides por endpoint:
  - Auth sensible (`/usuarios/register|login|forgot-password|reset-password`): 5 req/min.
  - `GET /usuarios/profile`: 60 req/min.
  - `PATCH /usuarios/profile`: 20 req/min.

## Subida de imágenes (Cloudinary)

- Config por variables `CLOUDINARY_*`.
- Multer en memoria (límite 10MB por archivo, solo imágenes).
- Respuesta incluye `public_id`, `url`, `upload_preset: 'viadca'` y `tipo: 'cloudinary'`.
- Al eliminar paquetes/imagenes se intenta borrar también en Cloudinary.

## Generación de Excel

`GET /admin/paquetes/excel/:id` genera y descarga un Excel (`.xlsx`) del paquete seleccionado usando `exceljs` y el template `excel/templates/paquete-excel.template.ts`.

## Limpieza automática (cron)

- Servicio `CleanupService` ejecuta diariamente a la hora configurada (por defecto 02:00) y:
  - Elimina definitivamente registros soft-deleted más antiguos que `CLEANUP_RETENTION_DAYS`.
  - Limpia imágenes huérfanas en Cloudinary.
- Se puede forzar manualmente desde los endpoints admin.

## Pruebas y linting

```bash
# unit tests
pnpm run test

# e2e tests
pnpm run test:e2e

# cobertura
pnpm run test:cov

# lint y formato
pnpm run lint
pnpm run format
```

## Despliegue

1. Configura correctamente `.env` en el entorno de producción.
2. Compila y ejecuta en modo producción:

```bash
pnpm run build
pnpm run start:prod
```

Notas de producción:

- Establece `NODE_ENV=production` y `FRONTEND_URL` (HTTPS) para cookies `SameSite=None; Secure`.
- Recomendado configurar un proxy (Nginx) con `X-Forwarded-*` y mantener `trust proxy` habilitado.
- Considera desactivar `synchronize` en TypeORM y usar migraciones.

## Licencia

Este proyecto es privado (UNLICENSED). Uso interno.
