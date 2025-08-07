# Seguridad y Validación - Sistema de Usuarios y Backend

## Resumen de Implementación

Este documento describe todas las medidas de seguridad implementadas en el backend para prevenir ataques de inyección SQL, XSS y otros vectores de ataque comunes.

## 1. Validadores Personalizados de Seguridad

### Ubicación
- `src/common/validators/security.validator.ts`

### Validadores Implementados

#### `@IsNoSQLInjection`
- **Propósito**: Prevenir inyección SQL detectando patrones maliciosos
- **Patrones detectados**:
  - Comentarios SQL (`--`, `/*`, `*/`)
  - Palabras clave SQL (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `DROP`, `UNION`, `ALTER`)
  - Caracteres de escape y comillas (`'`, `"`, `;`, `\`)
- **Uso**: Aplicado a todos los campos de entrada de texto

#### `@IsCleanText`
- **Propósito**: Prevenir ataques XSS y contenido malicioso
- **Detecta**:
  - Tags HTML (`<script>`, `<iframe>`, `<object>`, `<embed>`)
  - Protocolos peligrosos (`javascript:`, `data:`, `vbscript:`)
  - Caracteres de control y especiales
- **Uso**: Aplicado a campos de texto visible al usuario

## 2. Aplicación de Validadores

### DTOs de Usuarios
- ✅ `CreateUsuarioDto`: Todos los campos validados
- ✅ `LoginDto`: Usuario y contraseña validados
- ✅ `ForgotPasswordDto`: Correo validado
- ✅ `ResetPasswordDto`: Token y nueva contraseña validados
- ✅ `VerifyEmailDto`: Token validado

### DTOs de Paquetes
- ✅ `CreatePaqueteDto`: Todos los campos de texto validados
- ✅ `UpdatePaqueteDto`: Todos los campos de texto validados
- ✅ `CreateDestinoDto`: Campo destino validado
- ✅ `CreateImagenDto`: Campos de texto validados
- ✅ `UpdateImagenDto`: Campos de texto validados
- ✅ `CreateHotelDto`: Campos de texto validados
- ✅ `UpdateHotelDto`: Campos de texto validados

### DTOs de Mayoristas
- ✅ `CreateMayoristaDto`: Nombre y tipo_producto validados
- ✅ `UpdateMayoristaDto`: Campos opcionales validados

### DTOs de Cloudinary
- ✅ `UploadImageDto`: Folder y nombre validados

## 3. Validación de Entrada

### Configuración Global
```typescript
// src/main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Solo propiedades en DTOs
    forbidNonWhitelisted: true, // Rechaza propiedades extra
    transform: true,           // Transforma tipos automáticamente
    disableErrorMessages: false, // Muestra mensajes de error
  }),
);
```

### Validadores por Campo

#### Campos de Texto
- **Longitud máxima**: Todos los campos tienen límites apropiados
- **Caracteres permitidos**: Regex específicos para cada tipo de campo
- **Sanitización**: Validadores personalizados aplicados

#### IDs y UUIDs
- **Formato**: Validación de UUID v4 con `@IsUUID('4')`
- **Aplicación**: Todos los endpoints que reciben IDs usan `ParseUUIDPipe`

#### Números y Fechas
- **Rangos**: Validación de rangos mínimos y máximos
- **Formato**: Validación de formato de fecha ISO

## 4. Seguridad en Consultas de Base de Datos

### TypeORM Parameterización
- ✅ Todas las consultas usan métodos parameterizados de TypeORM
- ✅ No hay concatenación de strings en consultas SQL
- ✅ No hay uso de `query()` con strings dinámicos

### Ejemplos de Consultas Seguras
```typescript
// ✅ CORRECTO - Parameterizado
const user = await this.usuarioRepository.findOne({
  where: { usuario: loginDto.usuario }
});

// ✅ CORRECTO - Query Builder parameterizado
const users = await this.usuarioRepository
  .createQueryBuilder('user')
  .where('user.correo = :correo', { correo })
  .getOne();

// ❌ INCORRECTO - Concatenación (NO USADO)
// const query = `SELECT * FROM usuarios WHERE usuario = '${usuario}'`;
```

## 5. Autenticación y Autorización

### Guards Implementados
- `AuthGuard`: Verifica JWT válido
- `AdminGuard`: Verifica rol de administrador

### Configuración JWT
- Tokens firmados con secret seguro
- Expiración configurada
- Verificación en cada request protegido

## 6. Endpoints y Validación

### Endpoints Públicos
- `POST /usuarios/register`: Validación completa de entrada
- `POST /usuarios/login`: Validación de credenciales
- `POST /usuarios/forgot-password`: Validación de correo
- `POST /usuarios/reset-password`: Validación de token y nueva contraseña
- `GET /usuarios/verify-email`: Validación de token

### Endpoints Administrativos
- `POST /admin/usuarios`: Validación completa + autorización admin
- `PATCH /admin/usuarios/:id`: Validación de UUID + datos + autorización
- `DELETE /admin/usuarios/:id`: Validación de UUID + autorización

### Endpoints de Paquetes/Mayoristas
- Todos los endpoints POST/PATCH tienen validación completa
- IDs validados con `ParseUUIDPipe`
- Datos de entrada sanitizados

## 7. Mejores Prácticas Implementadas

### Validación de Entrada
1. **Whitelist**: Solo propiedades definidas en DTOs
2. **Sanitización**: Validadores personalizados para prevenir inyección
3. **Límites**: Longitud máxima en todos los campos de texto
4. **Tipos**: Validación estricta de tipos de datos

### Seguridad de Consultas
1. **Parameterización**: Todas las consultas usan parámetros
2. **ORM**: TypeORM previene inyección SQL automáticamente
3. **Sin SQL directo**: No hay concatenación de strings en consultas

### Autenticación
1. **JWT**: Tokens seguros con expiración
2. **Hash**: Contraseñas hasheadas con bcrypt
3. **Guards**: Protección de endpoints sensibles

### Autorización
1. **Roles**: Sistema de roles para diferentes niveles de acceso
2. **Separación**: Endpoints admin separados de públicos
3. **Verificación**: Doble verificación en endpoints críticos

## 8. Configuración Adicional

### Variables de Entorno
```bash
# .env
JWT_SECRET=tu_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password_seguro
DB_DATABASE=viajes_db
```

### Headers de Seguridad
- CORS configurado apropiadamente
- Trust proxy para headers reales
- Compresión habilitada

## 9. Testing y Verificación

### Pruebas Recomendadas
1. **Inyección SQL**: Intentar patrones maliciosos en todos los campos
2. **XSS**: Intentar scripts maliciosos en campos de texto
3. **Autorización**: Verificar acceso a endpoints protegidos
4. **Validación**: Probar límites y tipos de datos

### Herramientas Sugeridas
- **OWASP ZAP**: Para pruebas automatizadas de seguridad
- **Postman**: Para pruebas manuales de endpoints
- **Jest**: Para pruebas unitarias de validadores

## 10. Mantenimiento

### Actualizaciones Regulares
1. Mantener dependencias actualizadas
2. Revisar logs de seguridad regularmente
3. Actualizar patrones de validación según nuevas amenazas

### Monitoreo
1. Rate limiting en endpoints sensibles (recomendado)
2. Logging de intentos de acceso no autorizado
3. Alertas para patrones de ataque

## Conclusión

El sistema implementa múltiples capas de seguridad:
- **Validación de entrada** estricta con sanitización
- **Prevención de inyección SQL** mediante parameterización
- **Prevención de XSS** con validadores personalizados
- **Autenticación y autorización** robustas
- **Separación de responsabilidades** entre endpoints públicos y administrativos

Todas las entradas de usuario son validadas, sanitizadas y procesadas de manera segura antes de llegar a la base de datos o ser devueltas al cliente.
