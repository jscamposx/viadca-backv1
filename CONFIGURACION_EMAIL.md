# 📧 Configuración de Email - Variables de Entorno

## ⚠️ IMPORTANTE: Remitente Verificado

Actualmente tu remitente verificado en Brevo es:
- **Email**: `no-reply@viadca.app`
- **Nombre**: `viadca`
- **Dominio**: `viadca.app` ✅ Verificado y autenticado

## 🔧 Variables de Entorno Recomendadas

Agrega estas variables a tu archivo `.env`:

```env
# ========================================
# 📧 CONFIGURACIÓN DE EMAIL (BREVO/SMTP)
# ========================================

# Servidor SMTP de Brevo
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false

# Credenciales de Brevo
SMTP_USER=686653001@smtp-brevo.com
SMTP_PASS=wbH7NAYdMnD1FvqI

# ⚡ IMPORTANTE: Usar el email VERIFICADO en Brevo
SMTP_FROM_NAME=Viadca
SMTP_FROM_EMAIL=no-reply@viadca.app

# Alternativamente, puedes usar el formato completo
SMTP_FROM=Viadca <no-reply@viadca.app>

# URL del frontend (para enlaces en emails)
FRONTEND_URL=http://localhost:5173
```

## 🚀 Para Producción

```env
# URL del frontend en producción
FRONTEND_URL=https://tu-dominio.com

# Mismo email verificado
SMTP_FROM_EMAIL=no-reply@viadca.app
```

---

## ✅ Valores por Defecto (Ya Configurados en el Código)

Si NO defines estas variables, el sistema usará:

- **SMTP_FROM_NAME**: `Viadca`
- **SMTP_FROM_EMAIL**: `no-reply@viadca.app` ✅
- **FRONTEND_URL**: `http://localhost:5173`

---

## 🔐 ¿Cómo Verificar un Nuevo Remitente en Brevo?

Si quieres usar otro email (por ejemplo `contacto@viadca.app`):

1. **Ir a Brevo Dashboard** → Remitentes
2. **Agregar remitente** → Ingresar `contacto@viadca.app`
3. **Verificar email** → Brevo enviará un email de confirmación
4. **Autenticar dominio** (opcional pero recomendado):
   - Agregar registros DNS (SPF, DKIM, DMARC)
   - Mejora la entregabilidad

5. **Actualizar `.env`**:
   ```env
   SMTP_FROM_EMAIL=contacto@viadca.app
   ```

---

## ⚠️ Errores Comunes

### Error: "Sender is not valid"
```
Sending has been rejected because the sender you used contacto@viadca.com is not valid
```

**Causa**: Email no verificado en Brevo o dominio incorrecto.

**Solución**: Usar solo emails verificados:
- ✅ `no-reply@viadca.app` (verificado)
- ❌ `contacto@viadca.com` (NO verificado, dominio diferente)

---

## 📊 Estado Actual

✅ **Remitentes Verificados:**
- `no-reply@viadca.app` (dominio `viadca.app` autenticado con DKIM y DMARC)

❌ **Dominios NO Configurados:**
- `viadca.com` (diferente de `viadca.app`)

---

## 🎯 Recomendación

**Opción 1: Usar el dominio actual** (más rápido)
```env
SMTP_FROM_EMAIL=no-reply@viadca.app
```

**Opción 2: Agregar más remitentes** en Brevo
- `contacto@viadca.app`
- `soporte@viadca.app`
- `reservas@viadca.app`

Todos deben usar el dominio **`viadca.app`** que ya está autenticado.

---

## 🧪 Probar Configuración

Después de configurar, reinicia el servidor:
```bash
pnpm run start:dev
```

Luego crea un paquete privado y verifica los logs:
```
✅ Email personalizado enviado a: usuario@email.com
De: Viadca <no-reply@viadca.app>
```

Si ves esto, ¡está funcionando! 🎉
