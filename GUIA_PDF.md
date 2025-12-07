# 📄 Generación de Cotizaciones en PDF

## 🎯 Descripción General

El sistema ahora incluye un endpoint para generar cotizaciones de paquetes turísticos en formato PDF profesional. El PDF generado incluye toda la información del paquete con un diseño limpio y profesional.

## 🔗 Endpoint

```
GET     :id
```

### Parámetros

- **id** (UUID, requerido): ID del paquete para el cual generar la cotización

### Respuesta

El endpoint retorna directamente el archivo PDF con los siguientes headers:

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="cotizacion_{id}_{fecha}.pdf"
```

## 📋 Contenido del PDF

### Página 1: Portada
- Logo de la empresa (si existe en `src/assets/imagenes/logo.png`)
- Título "COTIZACIÓN" con línea decorativa
- Fecha actual
- Título del paquete en grande
- Destinos incluidos (separados por •)
- Duración en recuadro con borde
- **Precio total en recuadro destacado** (fondo gris con borde naranja, precio en grande)
- Número de personas

### Página 2+: Detalles
El PDF incluye las siguientes secciones con diseño profesional:

1. **FECHAS DEL VIAJE**
   - Dos recuadros lado a lado con fechas de salida y regreso

2. **QUÉ INCLUYE**
   - Lista con viñetas circulares naranjas

3. **QUÉ NO INCLUYE**
   - Lista con viñetas circulares

4. **HOSPEDAJE**
   - Nombre del hotel
   - Clasificación por estrellas

5. **ITINERARIO DETALLADO**
   - Cada día en recuadro naranja con "DÍA X"
   - Descripción en recuadro con fondo gris claro
   - Bien estructurado y fácil de leer

6. **REQUISITOS**
   - Lista de requisitos para el viaje

7. **NOTAS IMPORTANTES**
   - Información adicional relevante

### Pie de Página
Todas las páginas incluyen:
- Información de contacto
- Número de página

## 💻 Ejemplos de Uso

### Frontend (JavaScript/TypeScript)

```typescript
// Función para descargar PDF de cotización
async function descargarCotizacionPDF(paqueteId: string) {
  try {
    const response = await fetch(
      `http://localhost:3000/admin/paquetes/pdf/${paqueteId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}` // Si requiere autenticación
        }
      }
    );

    if (!response.ok) {
      throw new Error('Error al generar PDF');
    }

    // Crear blob del PDF
    const blob = await response.blob();
    
    // Crear URL del blob
    const url = window.URL.createObjectURL(blob);
    
    // Crear enlace temporal y hacer click
    const a = document.createElement('a');
    a.href = url;
    a.download = `cotizacion_${paqueteId}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
  } catch (error) {
    console.error('Error descargando PDF:', error);
    alert('Error al generar la cotización en PDF');
  }
}
```

### React Component

```tsx
import React from 'react';

interface PaqueteCardProps {
  paqueteId: string;
}

export const PaqueteCard: React.FC<PaqueteCardProps> = ({ paqueteId }) => {
  const [loading, setLoading] = React.useState(false);

  const handleDownloadPDF = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/paquetes/pdf/${paqueteId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) throw new Error('Error al generar PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion_${paqueteId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleDownloadPDF}
        disabled={loading}
      >
        {loading ? 'Generando...' : '📄 Descargar PDF'}
      </button>
    </div>
  );
};
```

### Axios

```typescript
import axios from 'axios';

async function descargarPDF(paqueteId: string) {
  try {
    const response = await axios.get(
      `/admin/paquetes/pdf/${paqueteId}`,
      {
        responseType: 'blob', // Importante para archivos binarios
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    // Crear URL del blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    
    // Descargar
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cotizacion_${paqueteId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

## 🎨 Personalización

### Colores
Los colores del PDF se pueden personalizar editando la constante `COLORS` en `src/pdf/pdf.service.ts`:

```typescript
private readonly COLORS = {
  primary: '#2D3748',    // Gris oscuro profesional - títulos
  accent: '#D97706',     // Naranja/dorado - acentos y elementos destacados
  success: '#059669',    // Verde - elementos positivos
  text: '#374151',       // Gris medio - texto normal
  lightGray: '#F3F4F6',  // Gris claro - fondos
  border: '#E5E7EB',     // Gris para bordes
  white: '#FFFFFF',      // Blanco
};
```

**Paleta de colores profesional sin azul**, ideal para cotizaciones elegantes y modernas.

### Logo
Para agregar el logo de la empresa:
1. Coloca el archivo `logo.png` en `src/assets/imagenes/`
2. El logo aparecerá automáticamente en la portada (tamaño: 120px de ancho)

### Información de Contacto
Edita el método `agregarPieDePagina()` en `src/pdf/pdf.service.ts` para cambiar la información de contacto en el pie de página.

## 🔒 Seguridad

El endpoint está protegido y requiere:
- Autenticación válida
- Permisos de administrador (según configuración del `AdminGuard`)

## ⚠️ Notas Importantes

1. **Imágenes de Cloudinary**: Actualmente el PDF no descarga imágenes de Cloudinary. Para implementar esto, necesitarás agregar lógica para descargar las imágenes y agregarlas al PDF.

2. **Mayoristas**: El PDF **NO** incluye información de mayoristas, cumpliendo con el requisito de que esta información nunca debe aparecer en las cotizaciones.

3. **Paginación Automática**: El servicio maneja automáticamente el salto de página cuando el contenido excede el espacio disponible.

4. **Throttling**: El endpoint tiene configuración de throttling para evitar abuso (600 requests por minuto por IP).

## 🚀 Próximas Mejoras

1. Integración con Cloudinary para incluir imágenes reales
2. Plantillas personalizables por agencia
3. Soporte para múltiples idiomas
4. Marca de agua opcional
5. Firma digital opcional

## 📝 Diferencias con Excel

| Característica | Excel | PDF |
|---------------|-------|-----|
| Formato | .xlsx editable | .pdf no editable |
| Diseño | Tablas y celdas | Diseño gráfico fluido |
| Imágenes | Soportadas | Soportadas |
| Tamaño archivo | Más pequeño | Más grande |
| Uso | Datos y análisis | Presentación final |
| Mayoristas | ❌ No incluye | ❌ No incluye |

## 🛠️ Troubleshooting

### Error: "Paquete no encontrado"
- Verifica que el ID del paquete sea válido
- Asegúrate de que el paquete no esté eliminado

### Error 500: "Error interno del servidor"
- Revisa los logs del servidor
- Verifica que todas las relaciones del paquete estén correctamente configuradas
- Asegúrate de que PDFKit esté correctamente instalado

### PDF vacío o corrupto
- Verifica que el paquete tenga datos suficientes
- Revisa los logs para mensajes de error durante la generación
