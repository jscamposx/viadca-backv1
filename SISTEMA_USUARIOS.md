# Sistema de Autenticación y Usuarios - Viadca

## Descripción
Sistema completo de autenticación con registro, verificación por email, restablecimiento de contraseña y gestión de roles.

## Características

### 🔐 Autenticación
- Registro de usuarios con verificación por email
- Login con JWT
- Restablecimiento de contraseña por email
- Guards de autenticación y autorización

### 👥 Roles de Usuario
- **admin**: Acceso completo al sistema
- **pre-autorizado**: Usuario registrado pendiente de aprobación
- **usuario**: Usuario con acceso básico

### 📧 Sistema de Email
- Configurado con Brevo (SendinBlue)
- Emails de verificación automáticos
- Emails de restablecimiento de contraseña
- Templates HTML responsivos

## Configuración

### Variables de Entorno
```bash
# JWT Secret (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=tu-jwt-secret-muy-seguro-aqui

# URLs del frontend
FRONTEND_URL=http://localhost:3000

# Configuración de Email (Brevo)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=686653001@smtp-brevo.com
SMTP_PASS=wbH7NAYdMnD1FvqI
```

### Usuario Administrador Principal
El sistema crea automáticamente un usuario administrador:
- **Usuario**: `admin`
- **Contraseña**: `admin123456`
- **Email**: `admin@viadca.com`
- **Rol**: `admin`

⚠️ **IMPORTANTE**: Cambiar la contraseña en producción.

## Endpoints de API

### 🌐 Endpoints Públicos (Autenticación)

#### Registrar Usuario
```
POST /usuarios/register
```
**Body:**
```json
{
  "usuario": "nuevousuario",
  "correo": "usuario@email.com",
  "contrasena": "password123",
  "nombre_completo": "Nombre Completo" // opcional
}
```

#### Verificar Email
```
POST /usuarios/verify-email
```
**Body:**
```json
{
  "token": "token-de-verificacion"
}
```

#### Login
```
POST /usuarios/login
```
**Body:**
```json
{
  "usuario": "admin",
  "contrasena": "admin123456"
}
```
**Response:**
```json
{
  "access_token": "jwt-token-aqui",
  "usuario": {
    "id": "uuid",
    "usuario": "admin",
    "correo": "admin@viadca.com",
    "rol": "admin",
    "nombre_completo": "Administrador Principal",
    "email_verificado": true
  }
}
```

#### Solicitar Restablecimiento de Contraseña
```
POST /usuarios/forgot-password
```
**Body:**
```json
{
  "correo": "usuario@email.com"
}
```

#### Restablecer Contraseña
```
POST /usuarios/reset-password
```
**Body:**
```json
{
  "token": "token-de-recuperacion",
  "nuevaContrasena": "nuevapassword123"
}
```

### 👤 Endpoints Autenticados (Usuario)

#### Obtener Perfil
```
GET /usuarios/profile
Headers: Authorization: Bearer {jwt-token}
```

### 🛡️ Endpoints de Administración (Solo Admin)

#### Listar Todos los Usuarios
```
GET /admin/usuarios
Headers: Authorization: Bearer {jwt-token}
```

#### Obtener Usuario por ID
```
GET /admin/usuarios/:id
Headers: Authorization: Bearer {jwt-token}
```

#### Listar Usuarios Eliminados
```
GET /admin/usuarios/deleted/list
Headers: Authorization: Bearer {jwt-token}
```

#### Obtener Estadísticas de Usuarios
```
GET /admin/usuarios/stats/overview
Headers: Authorization: Bearer {jwt-token}
```
**Response:**
```json
{
  "total": 10,
  "activos": 8,
  "eliminados": 2,
  "preAutorizados": 5,
  "admins": 1,
  "emailsVerificados": 7,
  "noVerificados": 3
}
```

#### Actualizar Rol de Usuario
```
PATCH /admin/usuarios/:id/role
Headers: Authorization: Bearer {jwt-token}
```
**Body:**
```json
{
  "rol": "admin", // "admin", "pre-autorizado", "usuario"
  "activo": true
}
```

#### Eliminar Usuario (Soft Delete)
```
PATCH /admin/usuarios/:id/soft-delete
Headers: Authorization: Bearer {jwt-token}
```

#### Restaurar Usuario
```
PATCH /admin/usuarios/:id/restore
Headers: Authorization: Bearer {jwt-token}
```

#### Eliminar Usuario Permanentemente
```
POST /admin/usuarios/:id/hard-delete
Headers: Authorization: Bearer {jwt-token}
```

## Uso en el Frontend

### Registro de Usuario
```javascript
const register = async (userData) => {
  const response = await fetch('/usuarios/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
};
```

### Login
```javascript
const login = async (credentials) => {
  const response = await fetch('/usuarios/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  const data = await response.json();
  
  if (data.access_token) {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.usuario));
  }
  
  return data;
};
```

### Hacer Peticiones Autenticadas
```javascript
const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('access_token');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Ejemplo: obtener perfil
const getProfile = async () => {
  const response = await authenticatedFetch('/usuarios/profile');
  return response.json();
};
```

### Verificar Email
```javascript
// En la página de verificación (/verificar-email?token=...)
const verifyEmail = async (token) => {
  const response = await fetch('/usuarios/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  return response.json();
};
```

### Gestión de Usuarios (Admin)
```javascript
// Listar usuarios
const getUsers = async () => {
  const response = await authenticatedFetch('/admin/usuarios');
  return response.json();
};

// Obtener estadísticas
const getUserStats = async () => {
  const response = await authenticatedFetch('/admin/usuarios/stats/overview');
  return response.json();
};

// Actualizar rol
const updateUserRole = async (userId, roleData) => {
  const response = await authenticatedFetch(`/admin/usuarios/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify(roleData)
  });
  return response.json();
};

// Eliminar usuario
const deleteUser = async (userId) => {
  const response = await authenticatedFetch(`/admin/usuarios/${userId}/soft-delete`, {
    method: 'PATCH'
  });
  return response.json();
};

// Restaurar usuario
const restoreUser = async (userId) => {
  const response = await authenticatedFetch(`/admin/usuarios/${userId}/restore`, {
    method: 'PATCH'
  });
  return response.json();
};
```

## Migración de Base de Datos

Ejecutar el script de migración:
```sql
-- migrations/update-usuarios-auth.sql
-- Agrega las columnas necesarias para autenticación
```

## Guards y Decorators

### Uso en Controllers
```typescript
// Solo usuarios autenticados
@UseGuards(AuthGuard)
@Get('protected')
async protectedRoute(@User() user) {
  return user;
}

// Solo administradores
@UseGuards(AdminGuard)
@Get('admin-only')
async adminRoute(@User() user) {
  return { message: 'Solo admins pueden ver esto' };
}
```

## Seguridad

### Buenas Prácticas Implementadas
- ✅ Hash de contraseñas con bcrypt (12 rounds)
- ✅ Tokens JWT con expiración (24h)
- ✅ Verificación de email obligatoria
- ✅ Tokens de recuperación con expiración (1h)
- ✅ Validación de entrada con class-validator
- ✅ Guards de autenticación y autorización
- ✅ No exposición de contraseñas en respuestas

### Recomendaciones Adicionales
- Cambiar JWT_SECRET en producción
- Configurar HTTPS en producción
- Implementar rate limiting
- Logs de auditoría para acciones sensibles
- Configurar CORS apropiadamente

## Flujo de Registro Completo

1. **Usuario se registra** → POST /usuarios/register
2. **Sistema envía email de verificación**
3. **Usuario hace clic en el enlace** → POST /usuarios/verify-email
4. **Sistema confirma verificación y envía email de bienvenida**
5. **Usuario puede hacer login** → POST /usuarios/login
6. **Administrador puede cambiar rol si es necesario** → PATCH /usuarios/:id/role

## Emails Automáticos

### Templates Incluidos
- **Verificación de email**: Con botón y enlace de respaldo
- **Restablecimiento de contraseña**: Con enlace temporal
- **Bienvenida**: Confirmación de cuenta verificada

### Personalización
Los templates están en `EmailService` y pueden personalizarse fácilmente modificando el HTML.

## Estados de Usuario

- **Registrado no verificado**: Puede existir pero no hacer login
- **Verificado pre-autorizado**: Puede hacer login con acceso limitado
- **Admin**: Acceso completo al sistema
- **Eliminado (soft delete)**: No puede hacer login, pero datos preservados
