# 📧 Sistema de Notificaciones de Paquetes Privados

## 🎯 Funcionalidad

El sistema envía automáticamente notificaciones por email cuando:

1. **Se crea un paquete privado** con usuarios autorizados
2. **Se edita un paquete** y se agregan NUEVOS usuarios autorizados

## ✅ Características

- ✉️ **Email HTML elegante** con diseño profesional
- 🎨 **Gradiente personalizado** y diseño responsive
- 📸 **Imagen del paquete** incluida en el email
- 📊 **Información completa**: destinos, duración, precio, fechas
- 🔗 **Enlace directo** al paquete en el frontend
- ⚡ **Envío asíncrono** (no bloquea la creación/edición del paquete)
- 🎯 **Detección inteligente** de nuevos usuarios (solo notifica a los nuevos)

---

## 🛠️ Archivos Implementados

### 1. Plantilla de Email
📁 `src/paquetes/templates/paquete-acceso.template.ts`
- Función `generarEmailAccesoPaquete()`
- HTML responsive con gradientes
- Información detallada del paquete

### 2. Servicio de Notificaciones
📁 `src/paquetes/paquetes-notificacion.service.ts`
- `notificarAccesoUsuario()` - Envía email a un usuario
- `notificarAccesoMultiplesUsuarios()` - Envía a múltiples usuarios
- `detectarNuevosUsuarios()` - Detecta usuarios recién autorizados

### 3. Método de Email Genérico
📁 `src/usuarios/services/email.service.ts`
- `sendCustomEmail()` - Nuevo método para enviar emails personalizados

### 4. Integración en PaquetesService
📁 `src/paquetes/paquetes.service.ts`
- Modificado `create()` - Envía notificaciones al crear
- Modificado `update()` - Envía notificaciones solo a nuevos usuarios

### 5. Módulo Actualizado
📁 `src/paquetes/paquetes.module.ts`
- Agregado `PaquetesNotificacionService` a providers

---

## 📋 Flujo de Notificaciones

### Creación de Paquete Privado

```
Admin crea paquete privado
    ↓
Selecciona 3 usuarios autorizados: [A, B, C]
    ↓
Backend guarda el paquete
    ↓
📧 Envía emails a los 3 usuarios
    ↓
✅ Usuarios reciben notificación
```

### Edición de Paquete

```
Admin edita paquete
    ↓
Usuarios anteriores: [A, B, C]
Usuarios nuevos: [A, B, C, D, E]
    ↓
Sistema detecta: NUEVOS = [D, E]
    ↓
📧 Envía emails SOLO a D y E
    ↓
✅ Solo nuevos usuarios son notificados
```

---

## 🎨 Vista Previa del Email

El email incluye:

### Header
- 🎉 Título llamativo con gradiente morado
- Mensaje de bienvenida personalizado

### Contenido Principal
- 📸 **Imagen del paquete** (si existe)
- 📝 **Título del paquete**
- 📊 **Información en grid**:
  - Destinos (ciudad, país)
  - Duración en días
  - Fechas de inicio y fin
  - Precio con moneda

### Call to Action
- 🔵 **Botón grande** "Ver Detalles del Paquete"
- Enlace directo al paquete en el frontend

### Notas y Footer
- 💡 Nota sobre acceso privado
- Enlaces de contacto
- Copyright

---

## ⚙️ Configuración

### Variable de Entorno Requerida

Agrega en tu `.env`:

```env
# URL del frontend para enlaces en emails
FRONTEND_URL=http://localhost:5173
```

**Producción:**
```env
FRONTEND_URL=https://tu-dominio.com
```

### Configuración SMTP (Ya existente)

El sistema usa la configuración SMTP existente:
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=686653001@smtp-brevo.com
SMTP_PASS=wbH7NAYdMnD1FvqI
SMTP_FROM=contacto@viadca.com
```

---

## 🧪 Pruebas

### 1. Crear Paquete Privado

```bash
POST /admin/paquetes
Authorization: Bearer {admin-token}

{
  "titulo": "Paquete Exclusivo VIP",
  "esPublico": false,
  "usuariosAutorizadosIds": [
    "uuid-usuario-1",
    "uuid-usuario-2"
  ],
  ...resto de datos
}
```

**Resultado esperado:**
- ✅ Paquete creado
- 📧 2 emails enviados
- Logs en consola:
  ```
  ✅ Email de acceso enviado a usuario1@email.com
  ✅ Email de acceso enviado a usuario2@email.com
  📧 Enviadas 2 notificaciones para paquete "Paquete Exclusivo VIP"
  ```

### 2. Editar Paquete (Agregar Usuarios)

```bash
PATCH /admin/paquetes/{id}
Authorization: Bearer {admin-token}

{
  "usuariosAutorizadosIds": [
    "uuid-usuario-1",    // Ya existía
    "uuid-usuario-2",    // Ya existía
    "uuid-usuario-3",    // NUEVO ✨
    "uuid-usuario-4"     // NUEVO ✨
  ]
}
```

**Resultado esperado:**
- ✅ Paquete actualizado
- 📧 2 emails enviados (solo a usuarios 3 y 4)
- Logs en consola:
  ```
  ✅ Email de acceso enviado a usuario3@email.com
  ✅ Email de acceso enviado a usuario4@email.com
  📧 Enviadas 2 notificaciones para paquete "..."
  ```

### 3. Editar Paquete (Sin Cambios)

```bash
PATCH /admin/paquetes/{id}

{
  "titulo": "Nuevo Título",
  // usuariosAutorizadosIds NO incluido
}
```

**Resultado esperado:**
- ✅ Paquete actualizado
- ❌ NO se envían emails (no se modificaron usuarios)

---

## 🎯 Ejemplo de Email Recibido

```
De: Viajes DCA <contacto@viadca.com>
Para: usuario@email.com
Asunto: 🎉 Nuevo acceso exclusivo: Bellezas de Europa

[EMAIL HTML con diseño profesional]

Hola Juan Pérez,

¡Excelentes noticias! Se te ha otorgado acceso exclusivo 
a un paquete privado especialmente seleccionado para ti.

[IMAGEN DEL PAQUETE]

BELLEZAS DE EUROPA

📍 Destinos: Roma, Italia • París, Francia • Barcelona, España
⏱️ Duración: 15 días
📅 Fechas: 01 dic 2025 - 15 dic 2025
💰 Precio: $85,000 MXN

⭐ ACCESO EXCLUSIVO

[VER DETALLES DEL PAQUETE] ← Botón con enlace

💡 Nota: Este paquete es privado y solo está disponible 
para usuarios autorizados.
```

---

## 🔧 Personalización

### Cambiar Colores del Email

Edita `paquete-acceso.template.ts`:

```typescript
// Gradiente del header
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// Color del precio
color: #667eea;

// Gradiente del botón
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Modificar Contenido

En `paquete-acceso.template.ts` puedes modificar:
- Textos del email
- Estructura del HTML
- Información mostrada
- Estilos CSS inline

---

## 📊 Logs y Monitoreo

### Logs Exitosos

```
✅ Email personalizado enviado a: user@email.com - Asunto: "🎉 Nuevo acceso exclusivo: ..."
✅ Email de acceso enviado a user@email.com para paquete "Bellezas de Europa"
📧 Enviadas 3 notificaciones para paquete "Bellezas de Europa"
```

### Logs de Error

```
❌ Error al enviar email a user@email.com para paquete "...": [detalles del error]
Error enviando notificaciones a nuevos usuarios: [detalles]
```

**Nota:** Los errores en notificaciones NO interrumpen la creación/edición del paquete.

---

## ✅ Ventajas del Sistema

1. **No Bloqueante**: Los emails se envían de forma asíncrona
2. **Inteligente**: Solo notifica a usuarios nuevos en ediciones
3. **Robusto**: Errores en emails no afectan operaciones principales
4. **Profesional**: Diseño de email elegante y responsive
5. **Informativo**: Incluye toda la información relevante del paquete
6. **Accionable**: Enlace directo para ver el paquete

---

## 🚀 Siguiente Paso

1. **Reinicia el servidor**:
   ```bash
   pnpm run start:dev
   ```

2. **Configura FRONTEND_URL** en tu `.env`

3. **Crea un paquete privado** desde el admin

4. **Verifica tu email** 📧

¡Listo! 🎉
