# 📊 Guía de Implementación - Ordenamiento de Paquetes

## Backend Implementado ✅

El backend ahora acepta dos query parameters adicionales:

### Query Parameters

| Parámetro | Tipo | Valores Permitidos | Por Defecto | Descripción |
|-----------|------|-------------------|-------------|-------------|
| `sortBy` | string | `titulo`, `precio_total`, `fecha_inicio`, `activo`, `created_at` | `created_at` | Campo por el cual ordenar |
| `sortOrder` | string | `ASC`, `DESC` (case-insensitive) | `DESC` | Dirección del ordenamiento |

### Ejemplos de URLs

```
GET /admin/paquetes?sortBy=titulo&sortOrder=ASC
GET /admin/paquetes?sortBy=precio_total&sortOrder=DESC
GET /admin/paquetes?sortBy=fecha_inicio&sortOrder=ASC
GET /admin/paquetes?sortBy=activo&sortOrder=DESC
GET /admin/paquetes?page=1&limit=10&sortBy=titulo&sortOrder=ASC
```

---

## Implementación en Frontend (React/Vue/etc)

### 1. Estado para el Ordenamiento

```typescript
const [sortConfig, setSortConfig] = useState<{
  sortBy: 'titulo' | 'precio_total' | 'fecha_inicio' | 'activo' | 'created_at';
  sortOrder: 'ASC' | 'DESC';
}>({
  sortBy: 'created_at',
  sortOrder: 'DESC'
});
```

### 2. Función para Cambiar Ordenamiento

```typescript
const handleSort = (field: 'titulo' | 'precio_total' | 'fecha_inicio' | 'activo') => {
  setSortConfig(prev => {
    // Si es el mismo campo, alternar ASC/DESC
    if (prev.sortBy === field) {
      return {
        sortBy: field,
        sortOrder: prev.sortOrder === 'ASC' ? 'DESC' : 'ASC'
      };
    }
    // Si es un campo nuevo, ordenar ASC por defecto
    return {
      sortBy: field,
      sortOrder: 'ASC'
    };
  });
};
```

### 3. Componente de Botón de Ordenamiento

```tsx
interface SortButtonProps {
  field: 'titulo' | 'precio_total' | 'fecha_inicio' | 'activo';
  label: string;
  currentSort: typeof sortConfig;
  onSort: (field: typeof field) => void;
}

const SortButton: React.FC<SortButtonProps> = ({ field, label, currentSort, onSort }) => {
  const isActive = currentSort.sortBy === field;
  const isAsc = isActive && currentSort.sortOrder === 'ASC';
  const isDesc = isActive && currentSort.sortOrder === 'DESC';

  return (
    <button
      onClick={() => onSort(field)}
      className={`px-3 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm ${
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'bg-white text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span>{label}</span>
      {isActive && (
        <svg 
          stroke="currentColor" 
          fill="none" 
          strokeWidth="2" 
          viewBox="0 0 24 24" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`w-3 h-3 transition-transform ${isDesc ? 'rotate-180' : ''}`}
          height="1em" 
          width="1em" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
      )}
    </button>
  );
};
```

### 4. Uso en el Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
  <SortButton 
    field="titulo" 
    label="Título" 
    currentSort={sortConfig} 
    onSort={handleSort} 
  />
  <SortButton 
    field="precio_total" 
    label="Precio" 
    currentSort={sortConfig} 
    onSort={handleSort} 
  />
  <SortButton 
    field="fecha_inicio" 
    label="Fecha inicio" 
    currentSort={sortConfig} 
    onSort={handleSort} 
  />
  <SortButton 
    field="activo" 
    label="Estado" 
    currentSort={sortConfig} 
    onSort={handleSort} 
  />
</div>
```

### 5. Petición HTTP (usando axios/fetch)

```typescript
// Con axios
const fetchPaquetes = async () => {
  const response = await axios.get('/admin/paquetes', {
    params: {
      page: currentPage,
      limit: itemsPerPage,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      // ... otros filtros
    }
  });
  return response.data;
};

// Con fetch
const fetchPaquetes = async () => {
  const params = new URLSearchParams({
    page: currentPage.toString(),
    limit: itemsPerPage.toString(),
    sortBy: sortConfig.sortBy,
    sortOrder: sortConfig.sortOrder,
    // ... otros filtros
  });

  const response = await fetch(`/admin/paquetes?${params}`);
  return response.json();
};
```

### 6. useEffect para Recargar Datos

```typescript
useEffect(() => {
  fetchPaquetes();
}, [sortConfig.sortBy, sortConfig.sortOrder, currentPage]);
```

---

## Ejemplo Completo (React + TypeScript)

```tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

type SortField = 'titulo' | 'precio_total' | 'fecha_inicio' | 'activo';
type SortOrder = 'ASC' | 'DESC';

interface SortConfig {
  sortBy: SortField | 'created_at';
  sortOrder: SortOrder;
}

const PackagesPage: React.FC = () => {
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC'
    }));
  };

  useEffect(() => {
    const fetchPaquetes = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get('/admin/paquetes', {
          params: {
            sortBy: sortConfig.sortBy,
            sortOrder: sortConfig.sortOrder
          }
        });
        setPaquetes(data.data);
      } catch (error) {
        console.error('Error fetching paquetes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaquetes();
  }, [sortConfig]);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
        {(['titulo', 'precio_total', 'fecha_inicio', 'activo'] as SortField[]).map((field) => {
          const labels = {
            titulo: 'Título',
            precio_total: 'Precio',
            fecha_inicio: 'Fecha inicio',
            activo: 'Estado'
          };
          
          const isActive = sortConfig.sortBy === field;
          
          return (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={`px-3 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm ${
                isActive ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{labels[field]}</span>
              {isActive && (
                <svg
                  className={`w-3 h-3 transition-transform ${sortConfig.sortOrder === 'DESC' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div>
          {/* Tu grid/tabla de paquetes aquí */}
        </div>
      )}
    </div>
  );
};

export default PackagesPage;
```

---

## Comportamiento Visual

1. **Sin ordenamiento activo**: Todos los botones con fondo blanco
2. **Campo activo ASC**: Botón azul con flecha hacia arriba ↑
3. **Campo activo DESC**: Botón azul con flecha hacia abajo ↓
4. **Al hacer clic**:
   - Primera vez: Ordena ASC
   - Segunda vez (mismo campo): Cambia a DESC
   - Tercer vez (mismo campo): Cambia a ASC (ciclo)

---

## Notas Importantes

⚠️ El backend valida que `sortBy` solo acepte los valores permitidos
⚠️ Si envías un valor inválido, recibirás un error 400
⚠️ Por defecto, se ordena por `created_at DESC` (más recientes primero)
⚠️ El ordenamiento se combina con paginación y filtros existentes

---

## Testing

```bash
# Ordenar por título ascendente
curl "http://localhost:3000/admin/paquetes?sortBy=titulo&sortOrder=ASC"

# Ordenar por precio descendente
curl "http://localhost:3000/admin/paquetes?sortBy=precio_total&sortOrder=DESC"

# Combinar con filtros
curl "http://localhost:3000/admin/paquetes?sortBy=fecha_inicio&sortOrder=ASC&activo=true"
```
