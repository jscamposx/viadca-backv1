# Resumen de Endpoints - Sistema de Usuarios

## ✅ ENDPOINTS IMPLEMENTADOS

### 🌐 Públicos - Sin autenticación
- `POST /usuarios/register` - Registrar nuevo usuario
- `POST /usuarios/verify-email` - Verificar email con token
- `POST /usuarios/login` - Iniciar sesión
- `POST /usuarios/forgot-password` - Solicitar reset de contraseña
- `POST /usuarios/reset-password` - Restablecer contraseña con token

### 👤 Usuario autenticado
- `GET /usuarios/profile` - Obtener perfil del usuario logueado

### 🛡️ Solo Administradores - `/admin/usuarios`
- `GET /admin/usuarios` - Listar todos los usuarios
- `GET /admin/usuarios/:id` - Obtener usuario específico
- `GET /admin/usuarios/deleted/list` - Listar usuarios eliminados
- `GET /admin/usuarios/stats/overview` - Estadísticas de usuarios
- `PATCH /admin/usuarios/:id/role` - Actualizar rol de usuario
- `PATCH /admin/usuarios/:id/soft-delete` - Eliminar usuario (soft delete)
- `PATCH /admin/usuarios/:id/restore` - Restaurar usuario eliminado
- `POST /admin/usuarios/:id/hard-delete` - Eliminar permanentemente (PELIGROSO)

## 🔧 FUNCIONALIDADES IMPLEMENTADAS

### Autenticación
- ✅ Hash de contraseñas con bcrypt (12 rounds)
- ✅ JWT con expiración de 24h
- ✅ Guards de autenticación y autorización
- ✅ Verificación obligatoria de email para login

### Gestión de Usuarios
- ✅ Tres roles: admin, pre-autorizado, usuario
- ✅ Usuario admin principal creado automáticamente
- ✅ Soft delete con posibilidad de restauración
- ✅ Estadísticas y métricas de usuarios

### Sistema de Email
- ✅ Configurado con Brevo SMTP
- ✅ Email de verificación automático
- ✅ Email de recuperación de contraseña
- ✅ Email de bienvenida tras verificación
- ✅ Templates HTML responsivos
- ✅ **Protección contra emails duplicados** (30 segundos)

### Seguridad
- ✅ Validación de entrada con class-validator
- ✅ Tokens seguros para verificación y recuperación
- ✅ No exposición de contraseñas en respuestas
- ✅ Separación de endpoints públicos y administrativos

## 🚀 PARA EMPEZAR

### 1. Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp .env.auth.example .env.local

# Editar valores necesarios
JWT_SECRET=tu-jwt-secret-muy-seguro
FRONTEND_URL=http://localhost:3000
```

### 2. Ejecutar Migración
```sql
-- Ejecutar migrations/update-usuarios-auth.sql
```

### 3. Usuario Admin Principal
- **Usuario**: `admin`
- **Contraseña**: `admin123456`
- **Email**: `admin@viadca.com`

### 4. Probar Endpoints
```bash
# Registro
curl -X POST http://localhost:3000/usuarios/register \
  -H "Content-Type: application/json" \
  -d '{"usuario":"test","correo":"test@email.com","contrasena":"password123"}'

# Login admin
curl -X POST http://localhost:3000/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","contrasena":"admin123456"}'

# Listar usuarios (requiere token admin)
curl -X GET http://localhost:3000/admin/usuarios \
  -H "Authorization: Bearer TU_JWT_TOKEN"
```

## 📱 FRONTEND INTEGRACIÓN

### Rutas Sugeridas
- `/login` - Formulario de login
- `/register` - Formulario de registro
- `/verificar-email?token=...` - Página de verificación
- `/restablecer-contraseña?token=...` - Página de reset
- `/admin/usuarios` - Panel de gestión de usuarios
- `/admin/usuarios/estadisticas` - Dashboard de estadísticas

### Flujo Típico
1. Usuario se registra → Recibe email de verificación
2. Hace clic en enlace → Cuenta verificada
3. Puede hacer login → Recibe JWT
4. Admin puede cambiar roles desde panel administrativo

## 🔐 GUARDIAS Y PERMISOS

### AuthGuard
- Verifica JWT válido
- Inyecta datos del usuario en request.user

### AdminGuard
- Extiende AuthGuard
- Verifica rol 'admin'
- Bloquea acceso a no-administradores

### Uso en Controllers
```typescript
@UseGuards(AuthGuard)     // Solo usuarios autenticados
@UseGuards(AdminGuard)    // Solo administradores
```

## ⚠️ IMPORTANTE

- Cambiar JWT_SECRET en producción
- Configurar HTTPS en producción
- El admin principal no puede perder rol de admin
- Los endpoints de hard delete son irreversibles
- Los tokens de recuperación expiran en 1 hora
- Los tokens de verificación no tienen expiración automática

## 🔧 SOLUCIÓN EMAILS DUPLICADOS

**Problema resuelto**: El sistema ahora previene el envío de emails duplicados.

### Protección Implementada
- **Cache temporal**: Bloquea emails del mismo tipo al mismo destinatario por 30 segundos
- **Limpieza automática**: Elimina entradas del cache después de 5 minutos
- **Logs detallados**: Registra cuando se bloquean emails duplicados

### Tipos de Email Protegidos
- `verification`: Email de verificación de cuenta
- `reset`: Email de restablecimiento de contraseña  
- `welcome`: Email de bienvenida tras verificación ✨

### Ejemplo de Log
```
[EmailService] Email welcome duplicado bloqueado para: usuario@email.com
```
