# Sistema de Limpieza Automática

Este documento describe el sistema de limpieza automática implementado para mantener la base de datos y Cloudinary limpios.

## 🎯 Objetivos

1. **Eliminación definitiva automática**: Registros soft-deleted se eliminan permanentemente después de 2 semanas (configurable)
2. **Limpieza de imágenes huérfanas**: Detecta y elimina imágenes en Cloudinary que no están relacionadas a paquetes activos
3. **Configuración flexible**: Permite personalizar tiempos, horarios y funcionalidades
4. **Administración manual**: Endpoints para ejecutar limpieza bajo demanda y obtener estadísticas

## 🚀 Funcionalidades

### Eliminación Automática de Registros

- **Qué se elimina**: Paquetes, Usuarios y Mayoristas que han estado soft-deleted por más tiempo del configurado
- **Cuándo**: Diariamente a la hora configurada (por defecto 2:00 AM)
- **Configuración**: `CLEANUP_RETENTION_DAYS` (default: 14 días)

### Limpieza de Imágenes Huérfanas

Una imagen se considera **huérfana** cuando:
- ✅ Tiene `cloudinary_public_id` (está almacenada en Cloudinary)
- ❌ **Y** no está asociada a ningún Paquete activo (paquete eliminado o inexistente)
- ❌ **Y** no está asociada a ningún Hotel activo

**Proceso de limpieza**:
1. Busca imágenes huérfanas en la base de datos
2. Las elimina de Cloudinary usando su API
3. Elimina el registro de la base de datos
4. Registra la operación en logs

## ⚙️ Configuración

### Variables de Entorno

```bash
# Días de retención antes de eliminación definitiva
CLEANUP_RETENTION_DAYS=14

# Hora para ejecutar limpieza automática (0-23)
CLEANUP_HOUR=2

# Minuto para ejecutar limpieza automática (0-59)
CLEANUP_MINUTE=0

# Habilitar eliminación automática de registros
CLEANUP_AUTO_HARD_DELETE=true

# Habilitar limpieza automática de imágenes
CLEANUP_AUTO_IMAGE_CLEANUP=true

# Logs detallados durante la limpieza
CLEANUP_DETAILED_LOGS=false
```

### Configuración de Ejemplo

```bash
# Configuración conservadora: retención de 1 mes
CLEANUP_RETENTION_DAYS=30
CLEANUP_HOUR=3
CLEANUP_MINUTE=30
CLEANUP_DETAILED_LOGS=true

# Configuración agresiva: retención de 1 semana
CLEANUP_RETENTION_DAYS=7
CLEANUP_HOUR=1
CLEANUP_MINUTE=0
CLEANUP_AUTO_IMAGE_CLEANUP=true
```

## 🔌 API Endpoints

### Estadísticas de Limpieza

```http
GET /admin/cleanup/stats
```

**Respuesta**:
```json
{
  "expiredRecords": {
    "paquetes": 5,
    "usuarios": 2,
    "mayoristas": 1
  },
  "orphanedImages": 12,
  "retentionDays": 14,
  "nextCleanup": "2025-08-06T02:00:00.000Z"
}
```

### Ejecutar Limpieza Manual

```http
POST /admin/cleanup/run
```

Ejecuta limpieza completa inmediatamente.

**Respuesta**:
```json
{
  "success": true,
  "message": "Limpieza ejecutada exitosamente",
  "data": {
    "hardDeletedRecords": {
      "paquetes": 5,
      "usuarios": 2,
      "mayoristas": 1
    },
    "orphanedImagesDeleted": 12
  }
}
```

### Eliminación Definitiva Únicamente

```http
POST /admin/cleanup/hard-delete
```

Solo elimina registros expirados, sin tocar imágenes.

### Limpieza de Imágenes Únicamente

```http
POST /admin/cleanup/cleanup-images
```

Solo limpia imágenes huérfanas, sin tocar registros.

## 📋 Logs y Monitoreo

### Logs de Ejemplo

```
[CleanupService] Iniciando limpieza automática...
[CleanupService] Eliminando registros soft-deleted anteriores a: 2025-07-22T02:00:00.000Z
[CleanupService] Paquetes eliminados definitivamente: 3
[CleanupService] Usuarios eliminados definitivamente: 1
[CleanupService] Mayoristas eliminados definitivamente: 0
[CleanupService] Iniciando limpieza de imágenes huérfanas en Cloudinary...
[CleanupService] Encontradas 8 imágenes potencialmente huérfanas
[CleanupService] Limpieza de imágenes completada: 8 eliminadas, 0 errores
[CleanupService] Limpieza automática completada exitosamente
```

### Logs Detallados

Con `CLEANUP_DETAILED_LOGS=true`:

```
[CleanupService] Imagen huérfana eliminada: paquete_imagen_001.jpg (viajes_app/paquetes/abc123)
[CleanupService] Imagen huérfana eliminada: hotel_imagen_002.png (viajes_app/hoteles/def456)
```

## 🛡️ Consideraciones de Seguridad

### Control de Acceso

- ❗ **Importante**: Los endpoints de administración deben estar protegidos con autenticación y autorización
- Recomendado: Solo administradores pueden ejecutar limpieza manual
- Sugerido: Logs de auditoría para todas las operaciones

### Respaldos

- 📦 **Antes de hard delete**: Considerar respaldos automáticos
- 🔒 **Imágenes de Cloudinary**: Una vez eliminadas no se pueden recuperar
- 📊 **Logs**: Mantener registros de todas las eliminaciones

## 🚨 Recuperación de Errores

### Errores Comunes

1. **Error de conexión a Cloudinary**:
   - El registro se mantiene en la base de datos
   - Se registra el error en logs
   - Se reintenta en la siguiente ejecución

2. **Error de base de datos**:
   - La transacción se revierte
   - Se registra el error completo
   - No se pierden datos

3. **Imagen no existe en Cloudinary**:
   - Se elimina solo el registro de la base de datos
   - Se registra como warning en logs

### Monitoreo Recomendado

```bash
# Verificar logs de limpieza
grep "CleanupService" /var/log/app.log

# Verificar errores
grep "ERROR.*CleanupService" /var/log/app.log

# Estadísticas rápidas
curl http://localhost:3000/admin/cleanup/stats
```

## 🔧 Desarrollo y Testing

### Pruebas Locales

```bash
# Ejecutar limpieza manual
curl -X POST http://localhost:3000/admin/cleanup/run

# Ver estadísticas
curl http://localhost:3000/admin/cleanup/stats

# Solo eliminar registros
curl -X POST http://localhost:3000/admin/cleanup/hard-delete

# Solo limpiar imágenes
curl -X POST http://localhost:3000/admin/cleanup/cleanup-images
```

### Variables para Testing

```bash
# Retención muy corta para pruebas
CLEANUP_RETENTION_DAYS=1

# Ejecución frecuente para pruebas
CLEANUP_HOUR=0  # Ejecutar cada hora a los 0 minutos

# Logs detallados para debugging
CLEANUP_DETAILED_LOGS=true
```

## 📈 Métricas y Optimización

### Métricas Importantes

- Número de registros eliminados por ejecución
- Número de imágenes huérfanas detectadas
- Tiempo de ejecución de cada limpieza
- Errores y advertencias por período

### Optimización

- **Índices**: Se crean automáticamente en `eliminado_en`
- **Batch processing**: Las imágenes se procesan una por una para evitar timeouts
- **Error handling**: Errores individuales no detienen el proceso completo

## 🎭 Casos de Uso

### Producción Estándar
```bash
CLEANUP_RETENTION_DAYS=14
CLEANUP_HOUR=2
CLEANUP_AUTO_HARD_DELETE=true
CLEANUP_AUTO_IMAGE_CLEANUP=true
```

### Entorno de Desarrollo
```bash
CLEANUP_RETENTION_DAYS=1
CLEANUP_HOUR=0
CLEANUP_DETAILED_LOGS=true
```

### Solo Imágenes (sin eliminar datos)
```bash
CLEANUP_AUTO_HARD_DELETE=false
CLEANUP_AUTO_IMAGE_CLEANUP=true
```

### Conservador (solo manual)
```bash
CLEANUP_AUTO_HARD_DELETE=false
CLEANUP_AUTO_IMAGE_CLEANUP=false
# Usar endpoints manuales según necesidad
```
