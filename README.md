# Viadca Back v1

<div align="center">

![Viadca](src/assets/imagenes/logo.png)

### 🚀 API REST para gestión de viajes y paquetes turísticos

**Construida con NestJS, TypeScript y MySQL**, optimizada para rendimiento, seguridad y escalabilidad.

> **Stack principal:** NestJS 11 · TypeScript 5 · Express 5 · TypeORM 0.3 · MySQL 8 · pnpm

</div>

---

## 📘 Tabla de contenido

* Descripción y funcionalidades
* Requisitos
* Instalación y ejecución
* Variables de entorno (.env)
* Estructura del proyecto
* Scripts disponibles
* Endpoints principales (API)
* Seguridad y buenas prácticas
* Caché y rate limiting
* Sistema de cola de solicitudes
* Subida de imágenes (Cloudinary)
* Generación de Excel
* Limpieza automática (cron)
* Pruebas y linting
* Despliegue
* Licencia

---

## 🧩 Descripción y funcionalidades

Backend central para gestión de una plataforma de viajes, incluyendo:

### 🔐 **Usuarios**

* Registro, verificación de email, login/logout.
* Recuperación y restablecimiento de contraseña.
* Perfil y actualizaciones.

### 🧳 **Paquetes turísticos**

* CRUD administrativo completo.
* Manejo de imágenes con Cloudinary.
* Listados públicos optimizados + estadísticas.

### 🤝 **Mayoristas**

* CRUD completo + estadísticas.

### 📞 **Configuración pública de contacto**

* Caché para respuestas instantáneas.

### 🖼️ **Subidas de imágenes**

* Endpoints admin para subir/borrar imágenes en Cloudinary.

### 📊 **Exportación a Excel**

* Exportación con plantilla clara y profesional (ExcelJS).

### 🧹 **Mantenimiento automático**

* Cronjobs para limpieza de registros e imágenes huérfanas.

### 🛡️ Características transversales

* DTOs con `class-validator` + `class-transformer`.
* CORS avanzado, cookies HttpOnly, `trust proxy`.
* Rate limiting global y por endpoint.
* Cache Manager con TTL configurable.
* Compresión HTTP y límites elevados de payload.

---

## 📦 Requisitos

* Node.js **18+** (recomendado 20+ LTS)
* pnpm **8+**
* MySQL **8**
* Cuenta de **Cloudinary**

---

## ⚙️ Instalación y ejecución

### 1️⃣ Instalar dependencias

```bash
pnpm install
```

### 2️⃣ Crear archivo .env

`.env.development`, `.env.local` o `.env`

### 3️⃣ Ejecutar en desarrollo o producción

```bash
# desarrollo (watch)
pnpm run start:dev

# desarrollo simple
pnpm run start

# producción
pnpm run build
pnpm run start:prod
```

El servidor escucha en **[http://localhost:3000](http://localhost:3000)** (o `PORT`).

---

## 🔐 Variables de entorno (.env)

El módulo de configuración lee: `.env.{NODE_ENV}`, `.env.local`, `.env`.

### 🔧 Servidor

```
PORT=3000
NODE_ENV=development|production
FRONTEND_URL=https://tu-frontend.com
COOKIE_DOMAIN=.tudominio.com
```

### 🗄️ Base de datos

```
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=usuario
DB_PASSWORD=clave
DB_DATABASE=viadca
```

### 🔑 JWT

```
JWT_SECRET=super-secreto
```

### ☁️ Cloudinary

```
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
```

### 📧 Email SMTP

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario
SMTP_PASS=clave
SMTP_FROM_NAME=Viadca
SMTP_FROM_EMAIL=no-reply@tudominio.com
```

### 🧹 Limpieza automática

```
CLEANUP_RETENTION_DAYS=14
CLEANUP_HOUR=2
CLEANUP_MINUTE=0
CLEANUP_AUTO_HARD_DELETE=true
CLEANUP_AUTO_IMAGE_CLEANUP=true
CLEANUP_DETAILED_LOGS=false
```

---

## 📁 Estructura del proyecto

```text
src/
  app.module.ts           # Config global: Config, Cache, Throttler, TypeORM, módulos
  main.ts                 # Bootstrap: CORS, pipes, compresión, cookies

  usuarios/               # Autenticación y perfil
    usuarios.controller.ts
    usuarios.service.ts
    guards/
    decorators/
    dto/

  paquetes/               # Paquetes turísticos
    paquetes.controller.ts
    paquetes.service.ts
    dto/
    entidades/

  mayoristas/             # Mayoristas y estadísticas

  contacto/               # Datos públicos con caché

  cloudinary/             # Subidas y borrado de imágenes

  excel/                  # Generación de Excel (ExcelJS)

  common/                 # Cleanup automático

  entities/               # Entidades compartidas
  utils/                  # Helpers e interceptores
```

---

## 📜 Scripts disponibles

```bash
pnpm run start        # Ejecuta la app
pnpm run start:dev    # Watch mode
pnpm run start:prod   # Producción
pnpm run build        # Compila TS
pnpm run lint         # ESLint
pnpm run format       # Prettier
pnpm run test         # Unit tests
pnpm run test:e2e     # e2e tests
pnpm run test:cov     # Cobertura
```

---

## 🌐 Endpoints principales

Base URL: `http://localhost:{PORT}`

### 👥 Usuarios

* `POST /register`
* `POST /verify-email`
* `POST /login`
* `POST /logout`
* `POST /forgot-password`
* `POST /reset-password`
* `GET /profile`
* `PATCH /profile`

### 🧳 Paquetes públicos

* `GET /paquetes/listado`
* `GET /paquetes/:codigoUrl`

### 📦 Administración de paquetes

CRUD completo, imágenes, estadísticas, Excel.

### 🤝 Mayoristas

CRUD + KPIs con caché.

### 📞 Contacto

Configuración pública.

### ☁️ Subidas (Cloudinary)

* Subir/borrar imágenes individuales o múltiples.

### 🧹 Limpieza

* Stats, limpieza de soft-deletes, imágenes huérfanas, hard delete.

---

## 🔐 Seguridad y buenas prácticas

* Cookies HttpOnly + fallback Bearer.
* DTOs estrictos + whitelist + forbidNonWhitelisted.
* CORS restringido.
* Compresión y payload limitado.
* `synchronize: true` solo en desarrollo.

---

## ⚡ Caché y Rate Limiting

* Cache Manager global (TTL 300s).
* Rate limiting global (60 req/min, 20 req/10s).
* Auth sensible limitado a 5 req/min.

---

## 🧵 Sistema de cola de solicitudes

* FIFO interno.
* Hasta 3 operaciones paralelas.
* Cola máxima: 200 solicitudes.
* `GET` públicos bypass.

---

## 🖼️ Subida de imágenes (Cloudinary)

* Multer en memoria (máx. 10 MB).
* Retorno con `public_id`, `url` y metadata.

---

## 📊 Generación de Excel

ExcelJS + plantilla personalizada.

---

## 🧹 Limpieza automática (cron)

* Hard delete de expirados.
* Limpieza de imágenes huérfanas.
* Ejecuta diario según horario.

---

## 🧪 Pruebas y linting

```bash
pnpm run test
pnpm run test:e2e
pnpm run test:cov
pnpm run lint
pnpm run format
```

---

## 🚀 Despliegue

```bash
pnpm run build
pnpm run start:prod
```

* Cookies seguras en producción.
* `trust proxy` recomendado con Nginx.
* Migraciones recomendadas para TypeORM.

---

## 📄 Licencia

Proyecto privado (**UNLICENSED**). Uso interno.
