# Protección de Endpoints Administrativos

## ✅ IMPLEMENTACIÓN COMPLETADA

Se ha implementado la protección completa de todos los endpoints administrativos que requieren permisos de administrador. Esto incluye todas las operaciones de creación, modificación y eliminación (POST, PATCH, DELETE) en los módulos principales.

## � Endpoints Protegidos

### 1. Paquetes (`/admin/paquetes`)
**Endpoints que ahora requieren rol ADMIN:**
- `POST /admin/paquetes` - Crear paquete
- `POST /admin/paquetes/:id/imagenes` - Agregar imagen a paquete
- `PATCH /admin/paquetes/:id` - Actualizar paquete
- `DELETE /admin/paquetes/:id` - Eliminar paquete (soft delete)
- `PATCH /admin/paquetes/:id/restore` - Restaurar paquete
- `DELETE /admin/paquetes/:id/hard` - Eliminar paquete permanentemente

**Endpoints públicos de consulta (sin protección):**
- `GET /admin/paquetes` - Listar paquetes (paginado)
- `GET /admin/paquetes/:id` - Obtener paquete específico
- `GET /admin/paquetes/deleted/list` - Listar paquetes eliminados
- `GET /admin/paquetes/excel/:id` - Generar Excel

### 2. Mayoristas (`/admin/mayoristas`)
**Endpoints que ahora requieren rol ADMIN:**
- `POST /admin/mayoristas` - Crear mayorista
- `PATCH /admin/mayoristas/:id` - Actualizar mayorista
- `DELETE /admin/mayoristas/:id` - Eliminar mayorista (soft delete)
- `PATCH /admin/mayoristas/:id/restore` - Restaurar mayorista
- `DELETE /admin/mayoristas/:id/hard` - Eliminar mayorista permanentemente

**Endpoints públicos de consulta (sin protección):**
- `GET /admin/mayoristas` - Listar mayoristas
- `GET /admin/mayoristas/:id` - Obtener mayorista específico
- `GET /admin/mayoristas/deleted/list` - Listar mayoristas eliminados

### 3. Cloudinary Upload (`/admin/upload`)
**Endpoints que ahora requieren rol ADMIN:**
- `POST /admin/upload/image` - Subir imagen individual
- `POST /admin/upload/images` - Subir múltiples imágenes
- `DELETE /admin/upload/image/:publicId` - Eliminar imagen de Cloudinary

## 🛡️ Mecanismo de Protección

### AdminGuard
- **Ubicación**: `src/usuarios/guards/admin.guard.ts`
- **Funcionalidad**: 
  - Extiende `AuthGuard` para verificar autenticación JWT
  - Verifica que el usuario tenga rol `ADMIN`
  - Retorna `403 Forbidden` si el usuario no es administrador

### Aplicación
```typescript
@UseGuards(AdminGuard)
@Post()
async create(@Body() dto: CreateDto) {
  // Solo usuarios con rol ADMIN pueden ejecutar este endpoint
}
```

## 🔧 Cambios en Módulos

### Importaciones Agregadas
Se agregó la importación del `UsuariosModule` en todos los módulos que usan `AdminGuard`:

1. **CloudinaryModule**
   ```typescript
   imports: [UsuariosModule]
   ```

2. **PaquetesModule**
   ```typescript
   imports: [
     // ...otros imports
     UsuariosModule,
   ]
   ```

3. **MayoristasModule**
   ```typescript
   imports: [
     TypeOrmModule.forFeature([Mayoristas, Paquete]),
     UsuariosModule,
   ]
   ```

## 📋 Requisitos para Usar Endpoints Protegidos

### 1. Autenticación
```http
Authorization: Bearer <jwt_token>
```

### 2. Rol de Usuario
El usuario debe tener rol `ADMIN` en la base de datos:
```sql
UPDATE usuarios SET rol = 'admin' WHERE email = 'admin@example.com';
```

### 3. Token Válido
- Token JWT no expirado
- Token firmado con la clave secreta correcta
- Usuario existente y activo en la base de datos
1. **Autenticación válida** (token JWT)
2. **Rol de administrador** (`UsuarioRol.ADMIN`)

## 🔒 Endpoints Protegidos

### Paquetes (`/admin/paquetes`)
- ✅ `POST /admin/paquetes` - Crear paquete
- ✅ `POST /admin/paquetes/:id/imagenes` - Crear imagen
- ✅ `PATCH /admin/paquetes/:id` - Actualizar paquete
- ✅ `DELETE /admin/paquetes/:id` - Eliminar paquete (soft delete)
- ✅ `PATCH /admin/paquetes/:id/restore` - Restaurar paquete
- ✅ `DELETE /admin/paquetes/:id/hard` - Eliminar permanentemente
- 🟡 `GET /admin/paquetes` - Solo lectura (sin protección adicional)
- 🟡 `GET /admin/paquetes/:id` - Solo lectura (sin protección adicional)
- 🟡 `GET /admin/paquetes/deleted/list` - Solo lectura (sin protección adicional)
- 🟡 `GET /admin/paquetes/excel/:id` - Generar Excel (sin protección adicional)

### Mayoristas (`/admin/mayoristas`)
- ✅ `POST /admin/mayoristas` - Crear mayorista
- ✅ `PATCH /admin/mayoristas/:id` - Actualizar mayorista
- ✅ `DELETE /admin/mayoristas/:id` - Eliminar mayorista (soft delete)
- ✅ `PATCH /admin/mayoristas/:id/restore` - Restaurar mayorista
- ✅ `DELETE /admin/mayoristas/:id/hard` - Eliminar permanentemente
- 🟡 `GET /admin/mayoristas` - Solo lectura (sin protección adicional)
- 🟡 `GET /admin/mayoristas/:id` - Solo lectura (sin protección adicional)
- 🟡 `GET /admin/mayoristas/deleted/list` - Solo lectura (sin protección adicional)

### Cloudinary/Upload (`/admin/upload`)
- ✅ `POST /admin/upload/image` - Subir imagen
- ✅ `POST /admin/upload/images` - Subir múltiples imágenes
- ✅ `DELETE /admin/upload/image/:publicId` - Eliminar imagen

### Usuarios (`/admin/usuarios`)
- ✅ Ya estaban protegidos desde la implementación inicial

## 🔑 Funcionamiento del AdminGuard

```typescript
@UseGuards(AdminGuard)
```

El `AdminGuard`:
1. **Hereda de `AuthGuard`** - Primero valida el JWT
2. **Valida el rol** - Verifica que `user.rol === UsuarioRol.ADMIN`
3. **Lanza excepción** - `ForbiddenException` si no es admin

## 📡 Respuestas de Error

### 401 Unauthorized
```json
{
  "message": "Token no válido o expirado",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "message": "Acceso denegado. Se requieren permisos de administrador",
  "statusCode": 403
}
```

## 🎯 Endpoints Públicos (Sin Protección)

### Paquetes Públicos (`/paquetes`)
- 🌐 `GET /paquetes/:codigoUrl` - Obtener paquete por código URL

### Usuarios Públicos (`/usuarios`)
- 🌐 `POST /usuarios/register` - Registro
- 🌐 `POST /usuarios/login` - Login
- 🌐 `POST /usuarios/forgot-password` - Solicitar reset
- 🌐 `POST /usuarios/reset-password` - Reset con token
- 🌐 `GET /usuarios/verify-email` - Verificar email
- 🔐 `GET /usuarios/profile` - Ver perfil propio (requiere autenticación)
- 🔐 `PATCH /usuarios/profile` - Actualizar perfil propio (requiere autenticación)

## ⚙️ Configuración

### Headers Requeridos para Admin
```javascript
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

### Ejemplo de Usuario Admin
```javascript
{
  "id": "uuid",
  "email": "admin@example.com",
  "nombre": "Administrador",
  "rol": "admin", // UsuarioRol.ADMIN
  "emailVerificado": true
}
```

## 🔄 Flujo de Autenticación

1. **Login** → `POST /usuarios/login`
2. **Recibir token** → Guardar en frontend
3. **Petición admin** → Incluir `Authorization: Bearer <token>`
4. **Validación** → AuthGuard → AdminGuard → Endpoint

## 📝 Notas Importantes

- Los endpoints `GET` de admin **NO** están protegidos para permitir lectura
- Solo las operaciones de **modificación** requieren rol admin
- El `AdminGuard` extiende `AuthGuard`, por lo que valida ambos aspectos
- Todos los endpoints mantienen validación de DTOs y sanitización

## 👤 Actualización de Perfil de Usuario

### Endpoint: `GET /usuarios/profile`
- **Autenticación**: Requerida (`AuthGuard`)
- **Autorización**: Cualquier usuario puede ver su propio perfil

### Ejemplo de uso:
```json
GET /usuarios/profile
Authorization: Bearer <jwt_token>
```

### Respuesta:
```json
{
  "id": "95d4750c-6ccc-44d0-8bcb-f45c3f9e8f1c",
  "usuario": "testuser",
  "correo": "jscamposx@gmail.com",
  "rol": "admin",
  "activo": true,
  "email_verificado": true,
  "nombre_completo": "Jesus Campos",
  "creadoEn": "2025-08-07T21:13:25.000Z",
  "actualizadoEn": "2025-08-07T21:15:30.000Z"
}
```

### Endpoint: `PATCH /usuarios/profile`
- **Autenticación**: Requerida (`AuthGuard`)
- **Autorización**: Cualquier usuario puede actualizar su propio perfil
- **Campos modificables**: `nombre`, `email`, `telefono`
- **Campos NO modificables**: `rol`, `id`, `contrasena`, `activo`

### Ejemplo de uso:
```json
PATCH /usuarios/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "nombre": "Nuevo Nombre",
  "email": "nuevo@email.com",
  "telefono": "+123456789"
}
```

### Respuesta:
```json
{
  "message": "Perfil actualizado exitosamente",
  "usuario": {
    "id": "uuid",
    "usuario": "usuario",
    "correo": "nuevo@email.com",
    "nombre_completo": "Nuevo Nombre",
    "rol": "admin",
    "activo": true,
    "email_verificado": true,
    "creadoEn": "2025-08-07T21:13:25.000Z",
    "actualizadoEn": "2025-08-07T21:15:30.000Z"
  }
}
```

### Comportamiento especial:
- **Cambio de email**: Si se cambia el email, se requiere nueva verificación
- **Validación de duplicados**: No permite emails ya registrados por otros usuarios
- **Seguridad**: Solo el usuario puede modificar su propio perfil
- **Protección de rol**: Los usuarios NO pueden cambiar su rol (solo admins desde `/admin/usuarios/:id/role`)
