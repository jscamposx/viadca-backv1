# Soft Delete Implementation Guide

## Descripción
Se ha implementado soft delete en el sistema para permitir la eliminación lógica de registros sin perder los datos permanentemente.

## Funcionalidades

### 1. Entidad Base
- **SoftDeleteEntity**: Clase base que incluye las columnas comunes:
  - `id`: UUID primary key
  - `creadoEn`: Fecha de creación
  - `actualizadoEn`: Fecha de última actualización
  - `eliminadoEn`: Fecha de eliminación lógica (null para registros activos)

### 2. Servicio Base
- **SoftDeleteService**: Servicio genérico con métodos para:
  - `findAll()`: Buscar registros activos
  - `findAllWithDeleted()`: Buscar todos incluyendo eliminados
  - `findDeleted()`: Buscar solo eliminados
  - `softDelete(id)`: Eliminación lógica
  - `restore(id)`: Restaurar registro eliminado
  - `hardDelete(id)`: Eliminación física

### 3. Endpoints Disponibles

#### Para Paquetes (`/admin/paquetes`)

**Eliminar (Soft Delete)**
```
DELETE /admin/paquetes/:id
```
- Marca el paquete como eliminado
- Response: 204 No Content

**Restaurar**
```
PATCH /admin/paquetes/:id/restore
```
- Restaura un paquete eliminado
- Response: 200 OK

**Ver Eliminados**
```
GET /admin/paquetes/deleted/list
```
- Lista todos los paquetes eliminados
- Response: Array de paquetes eliminados

**Eliminar Permanentemente**
```
DELETE /admin/paquetes/:id/hard
```
- Elimina el paquete de la base de datos
- ⚠️ **IRREVERSIBLE**
- Response: 204 No Content

## Migración de Base de Datos

### SQL para agregar columnas de soft delete:
```sql
-- Ejecutar el archivo: migrations/add-soft-delete-columns.sql
-- Agrega la columna eliminado_en a todas las tablas principales
-- Incluye índices para mejorar rendimiento
```

## Ejemplos de Uso

### En el Servicio
```typescript
// Buscar solo paquetes activos
const paquetesActivos = await this.paquetesService.findAll();

// Buscar todos (incluyendo eliminados)
const todosPaquetes = await this.paquetesService.findAllWithDeleted();

// Eliminar lógicamente
await this.paquetesService.softDelete(id);

// Restaurar
await this.paquetesService.restore(id);

// Verificar si existe (solo activos)
const existe = await this.paquetesService.exists(id);
```

### En el Frontend
```javascript
// Eliminar paquete
const eliminarPaquete = async (id) => {
  await fetch(`/admin/paquetes/${id}`, { method: 'DELETE' });
};

// Restaurar paquete
const restaurarPaquete = async (id) => {
  await fetch(`/admin/paquetes/${id}/restore`, { method: 'PATCH' });
};

// Ver eliminados
const verEliminados = async () => {
  const response = await fetch('/admin/paquetes/deleted/list');
  return response.json();
};
```

## Consideraciones Importantes

### 1. Rendimiento
- Se han agregado índices en `eliminado_en` para optimizar consultas
- Las consultas por defecto filtran registros eliminados

### 2. Relaciones
- Los registros relacionados deben manejarse cuidadosamente
- Considerar cascade delete para entidades dependientes

### 3. Seguridad
- `hardDelete` debe estar restringido a administradores
- Implementar logs de auditoría para eliminaciones

### 4. Backup y Limpieza
- Programar limpieza periódica de registros muy antiguos
- Mantener backups antes de hard deletes masivos

## Próximos Pasos

1. **✅ Entidades con Soft Delete Implementado**:
   - ✅ **Paquetes** - Entidad principal independiente
   - ✅ **Usuarios** - Gestión de acceso y auditoría
   - ✅ **Mayoristas** - Entidad independiente con CRUD

2. **❌ Entidades SIN Soft Delete (por diseño)**:
   - **Hotel, Destino, Imagen, Itinerario** - Son dependientes de paquetes
   - Se eliminan automáticamente con `cascade: true`
   - No se gestionan independientemente

3. **✅ Sistema de Limpieza Automática**:
   - ✅ **Eliminación definitiva automática** - Registros soft-deleted después de 2 semanas
   - ✅ **Limpieza de imágenes huérfanas** - Detecta y elimina imágenes en Cloudinary no relacionadas a paquetes activos
   - ✅ **Configuración personalizable** - Tiempo de retención, horarios, activación/desactivación
   - ✅ **Endpoints de administración** - Limpieza manual, estadísticas, ejecución bajo demanda

4. **Implementar UI**:
   - Papelera de reciclaje para paquetes y mayoristas
   - Confirmaciones de eliminación
   - Vista de registros eliminados
   - Panel de administración de limpieza

5. **Auditoría**:
   - Log de quién elimina qué
   - Historial de cambios

## Sistema de Limpieza Automática

### Configuración

El sistema permite configurar varios aspectos mediante variables de entorno:

```bash
# Tiempo de retención (días) antes de eliminación definitiva
CLEANUP_RETENTION_DAYS=14

# Hora y minuto para ejecutar limpieza automática
CLEANUP_HOUR=2
CLEANUP_MINUTE=0

# Habilitar/deshabilitar funcionalidades
CLEANUP_AUTO_HARD_DELETE=true
CLEANUP_AUTO_IMAGE_CLEANUP=true
CLEANUP_DETAILED_LOGS=false
```

### Endpoints de Administración

#### Estadísticas de limpieza
```
GET /admin/cleanup/stats
```
Retorna información sobre registros pendientes de limpieza:
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

#### Ejecutar limpieza manual
```
POST /admin/cleanup/run
```
Ejecuta inmediatamente la limpieza completa:
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

#### Eliminación definitiva únicamente
```
POST /admin/cleanup/hard-delete
```
Ejecuta solo la eliminación definitiva de registros expirados.

#### Limpieza de imágenes únicamente
```
POST /admin/cleanup/cleanup-images
```
Ejecuta solo la limpieza de imágenes huérfanas en Cloudinary.

### Automatización

- **Frecuencia**: Diariamente a la hora configurada (por defecto 2:00 AM)
- **Registros**: Elimina definitivamente registros soft-deleted después del tiempo de retención configurado
- **Imágenes**: Detecta y elimina imágenes en Cloudinary que no estén relacionadas a paquetes activos
- **Logs**: Registra todas las operaciones para auditoría

### Detección de Imágenes Huérfanas

Una imagen se considera huérfana cuando:
1. Tiene un `cloudinary_public_id` (está almacenada en Cloudinary)
2. **Y** no está asociada a ningún Paquete activo (paquete eliminado o inexistente)
3. **Y** no está asociada a ningún Hotel activo

El sistema automáticamente:
1. Busca estas imágenes en la base de datos
2. Las elimina de Cloudinary usando el API
3. Elimina el registro de la base de datos
4. Registra la operación en los logs

### Configuración Personalizada

Copia el archivo `.env.cleanup.example` a `.env.local` y personaliza según tus necesidades:

```bash
# Retención de 1 semana en lugar de 2
CLEANUP_RETENTION_DAYS=7

# Ejecutar a las 3:30 AM
CLEANUP_HOUR=3
CLEANUP_MINUTE=30

# Solo eliminar registros, no limpiar imágenes
CLEANUP_AUTO_IMAGE_CLEANUP=false

# Habilitar logs detallados
CLEANUP_DETAILED_LOGS=true
```
