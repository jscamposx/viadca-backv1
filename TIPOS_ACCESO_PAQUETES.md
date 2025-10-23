# 🔐 Sistema de Tipos de Acceso para Paquetes

## Descripción General

El sistema ahora cuenta con **3 tipos de acceso** para paquetes turísticos, permitiendo diferentes niveles de visibilidad y control de acceso.

---

## 📊 Tipos de Acceso

### 1. **PÚBLICO** (`publico`)

✅ **Características:**
- Aparece en el listado público (`/paquetes/listado`)
- Accesible sin autenticación
- Visible para todos los usuarios
- **Uso:** Paquetes promocionales, ofertas abiertas

```typescript
{
  "tipoAcceso": "publico",
  "esPublico": true
}
```

---

### 2. **PRIVADO** (`privado`)

🔒 **Características:**
- **NO** aparece en listados públicos
- **SÍ** aparece en `/mis-paquetes` para usuarios autorizados
- Requiere autenticación (login)
- Solo visible para usuarios en la lista `usuariosAutorizados`
- **Envía notificaciones por email** cuando se autoriza a un usuario
- **Uso:** Paquetes personalizados, grupos cerrados

```typescript
{
  "tipoAcceso": "privado",
  "esPublico": false,
  "usuariosAutorizadosIds": ["uuid-1", "uuid-2"]
}
```

**📧 Email Automático:**
Cuando se crea o actualiza un paquete privado, se envía un email a los usuarios autorizados con:
- Detalles del paquete
- Imagen principal
- Enlace directo al paquete
- Información de acceso privado

---

### 3. **LINK-PRIVADO** (`link-privado`) 🆕

🔗 **Características:**
- **NO** aparece en ningún listado (ni público ni `/mis-paquetes`)
- Accesible **mediante URL directa** sin login
- Cualquiera con el enlace puede verlo
- **NO requiere autenticación**
- **NO envía notificaciones por email**
- **Uso:** Paquetes compartidos con clientes específicos, propuestas temporales

```typescript
{
  "tipoAcceso": "link-privado",
  "esPublico": false
}
```

**💡 Caso de uso perfecto:**
- Crear propuesta para cliente específico
- Compartir enlace por WhatsApp/Email/SMS
- Cliente accede sin necesidad de crear cuenta
- Paquete permanece oculto para otros usuarios

---

## 🗂️ Resumen de Visibilidad

| Tipo | Listado Público | /mis-paquetes | Acceso Directo (URL) | Requiere Login | Notificaciones |
|------|----------------|---------------|---------------------|----------------|----------------|
| `publico` | ✅ Sí | ❌ No | ✅ Sí | ❌ No | ❌ No |
| `privado` | ❌ No | ✅ Sí (autorizados) | ✅ Sí (autorizados) | ✅ Sí | ✅ Sí |
| `link-privado` | ❌ No | ❌ No | ✅ Sí (cualquiera) | ❌ No | ❌ No |

---

## 🛠️ Implementación Técnica

### Base de Datos

**Entidad Paquete:**
```typescript
@Column({ type: 'varchar', default: 'publico' })
tipoAcceso: 'publico' | 'privado' | 'link-privado';
```

### DTOs

**CreatePaqueteDto / UpdatePaqueteDto:**
```typescript
@IsOptional()
@IsIn(['publico', 'privado', 'link-privado'])
readonly tipoAcceso?: 'publico' | 'privado' | 'link-privado';
```

### Service

**Listado Público (`findAllPublicSimple`):**
```typescript
where: {
  eliminadoEn: null,
  activo: true,
  esPublico: true,
  tipoAcceso: 'publico' // Solo públicos, excluye link-privado
}
```

**Mis Paquetes (`findAllForUser`):**
```typescript
where: {
  eliminadoEn: null,
  activo: true,
  esPublico: false,
  tipoAcceso: 'privado' // Solo privados con autorización
}
```

**Verificación de Acceso (`canUserAccessPaquete`):**
```typescript
// PÚBLICO - Todos pueden verlo
if (tipoAcceso === 'publico') return true;

// LINK-PRIVADO - Cualquiera con el link
if (tipoAcceso === 'link-privado') return true;

// PRIVADO - Solo usuarios autorizados o admin
if (tipoAcceso === 'privado') {
  if (!userId) return false; // Requiere login
  if (userRole === 'admin') return true;
  return usuariosAutorizados.some(u => u.id === userId);
}
```

---

## 📝 Ejemplos de Uso

### Crear Paquete Link-Privado

```typescript
POST /paquetes
{
  "titulo": "Paquete Riviera Maya - Propuesta para Cliente VIP",
  "tipoAcceso": "link-privado",
  "esPublico": false,
  "origen": "CDMX",
  "fecha_inicio": "2025-06-01",
  "fecha_fin": "2025-06-08",
  "precio_total": 25000,
  "moneda": "MXN",
  // ... otros campos
}
```

**Respuesta:**
```json
{
  "id": "uuid-123",
  "codigoUrl": "ABC12",
  "tipoAcceso": "link-privado"
}
```

**Compartir:**
```
https://tu-dominio.com/paquetes/ABC12
```

✅ Cualquiera con este enlace puede verlo
❌ No aparece en listados
❌ No requiere login

---

### Crear Paquete Privado con Usuarios

```typescript
POST /paquetes
{
  "titulo": "Viaje Corporativo - Empresa XYZ",
  "tipoAcceso": "privado",
  "esPublico": false,
  "usuariosAutorizadosIds": [
    "019ca5af-4300-403f-bfa9-9c884908c3df",
    "019ca5af-5600-403f-bfa9-9c884908c4ef"
  ],
  // ... otros campos
}
```

**Resultado:**
- 📧 Envía email a ambos usuarios
- 🔒 Solo ellos pueden verlo en `/mis-paquetes`
- ✅ Requiere login para acceder

---

## 🔄 Migración desde Sistema Anterior

### Antes (Solo esPublico)
```typescript
{
  "esPublico": true  // Paquete público
}
// o
{
  "esPublico": false,  // Paquete privado
  "usuariosAutorizadosIds": ["uuid1", "uuid2"]
}
```

### Ahora (Con tipoAcceso)
```typescript
{
  "tipoAcceso": "publico",  // Reemplaza esPublico: true
  "esPublico": true
}
// o
{
  "tipoAcceso": "privado",  // Privado con autorizados
  "esPublico": false,
  "usuariosAutorizadosIds": ["uuid1", "uuid2"]
}
// o
{
  "tipoAcceso": "link-privado",  // 🆕 Nuevo tipo
  "esPublico": false
}
```

**⚠️ Nota:** El campo `esPublico` se mantiene por compatibilidad, pero `tipoAcceso` es el campo principal.

---

## 🎯 Recomendaciones de Uso

| Escenario | Tipo Recomendado |
|-----------|------------------|
| Oferta general en sitio web | `publico` |
| Viaje grupal con lista cerrada | `privado` |
| Propuesta para cliente específico | `link-privado` |
| Paquete para compartir por WhatsApp | `link-privado` |
| Viaje corporativo con empleados registrados | `privado` |
| Promoción temporal sin login | `link-privado` |

---

## 🔍 Debugging

Ver tipo de acceso en logs:
```bash
🔐 DEBUG canUserAccessPaquete - tipoAcceso: link-privado
✅ DEBUG canUserAccessPaquete - Paquete LINK-PRIVADO, acceso permitido sin login
```

---

## 📚 Documentación Relacionada

- [Sistema de Notificaciones](./NOTIFICACIONES_PAQUETES.md)
- [Configuración de Email](./CONFIGURACION_EMAIL.md)
- [README Principal](./README.md)

---

**Última actualización:** 2025-10-22  
**Versión:** 1.0.0
