# Plan: Dashboard de Administración para API Comercio

## Visión General del Proyecto

**Objetivo final:** Tienda e-commerce completa con:
- Catálogo público (sin autenticación)
- Área de cliente (ver mis pedidos)
- Dashboard de administración (gestión completa)

**Fases del proyecto:**
1. **Dashboard Admin** ← Fase actual
2. Autenticación JWT (backend + frontend)
3. Catálogo público de productos
4. Área de cliente

---

## Fase 1: Dashboard Admin

### Resumen
Dashboard administrativo en HTML/CSS/JS vanilla ubicado en `/admin` con:
- CRUD completo de productos, usuarios y pedidos
- **Paginación en backend y frontend**
- **Filtros de búsqueda**

---

## Modificaciones al Backend (API)

### Nuevos parámetros en endpoints GET

```
GET /api/productos?page=1&limit=10&search=laptop
GET /api/usuarios?page=1&limit=10&search=juan
GET /api/pedidos?page=1&limit=10&estado=pendiente
```

### Nueva estructura de respuesta paginada

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "total_pages": 5
  }
}
```

### Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `models/productoDB.php` | Añadir método `getAllPaginated($page, $limit, $search)` |
| `models/usuarioDB.php` | Añadir método `getAllPaginated($page, $limit, $search)` |
| `models/pedidoDB.php` | Añadir método `getAllPaginated($page, $limit, $estado)` |
| `controllers/productoController.php` | Parsear parámetros GET, usar nuevo método |
| `controllers/usuarioController.php` | Parsear parámetros GET, usar nuevo método |
| `controllers/pedidoController.php` | Parsear parámetros GET, usar nuevo método |

---

## Estructura de Archivos Frontend

```
admin/
├── index.html              # Layout principal con navegación
├── css/
│   └── styles.css          # Estilos del dashboard
├── js/
│   ├── api.js              # Cliente HTTP para la API
│   ├── app.js              # Inicialización y navegación
│   ├── components.js       # Paginación, búsqueda, toasts
│   ├── productos.js        # CRUD de productos
│   ├── usuarios.js         # CRUD de usuarios
│   └── pedidos.js          # CRUD de pedidos
└── .htaccess               # Configuración Apache (opcional)
```

---

## Componentes del Dashboard

### 1. Layout Principal (`index.html`)
- Sidebar con navegación (Productos, Usuarios, Pedidos)
- Área de contenido dinámico
- Header con título de sección actual

### 2. Componentes Reutilizables (`components.js`)
- **Paginación:** Botones Anterior/Siguiente, indicador de página
- **Búsqueda:** Input con debounce (espera 300ms antes de buscar)
- **Toasts:** Mensajes de éxito/error temporales
- **Modal:** Contenedor para formularios

### 3. Módulo de Productos
- Barra de búsqueda (busca por código o nombre)
- Tabla paginada (10 items por página)
- Botón "Nuevo Producto" → Modal
- Acciones: Editar, Eliminar

### 4. Módulo de Usuarios
- Barra de búsqueda (busca por email o nombre)
- Tabla paginada
- Botón "Nuevo Usuario" → Modal
- Acciones: Editar, Eliminar, Toggle activo

### 5. Módulo de Pedidos
- Filtro por estado (dropdown)
- Tabla paginada
- Click en fila → Modal con detalles
- Cambio de estado inline

---

## Tareas de Implementación

### Parte A: Modificar Backend

- [ ] 1. Modificar `productoDB.php` - añadir paginación y búsqueda
- [ ] 2. Modificar `usuarioDB.php` - añadir paginación y búsqueda
- [ ] 3. Modificar `pedidoDB.php` - añadir paginación y filtro por estado
- [ ] 4. Actualizar `productoController.php` - usar nuevos métodos
- [ ] 5. Actualizar `usuarioController.php` - usar nuevos métodos
- [ ] 6. Actualizar `pedidoController.php` - usar nuevos métodos

### Parte B: Crear Frontend

- [ ] 7. Crear estructura de carpetas `/admin`
- [ ] 8. Crear `index.html` con layout y sidebar
- [ ] 9. Crear `styles.css` con diseño completo
- [ ] 10. Crear `api.js` - cliente HTTP
- [ ] 11. Crear `components.js` - paginación, búsqueda, toasts
- [ ] 12. Crear `app.js` - inicialización y navegación
- [ ] 13. Crear `productos.js` - CRUD completo
- [ ] 14. Crear `usuarios.js` - CRUD completo
- [ ] 15. Crear `pedidos.js` - CRUD con detalles

---

## Archivos a Crear/Modificar

### Backend (modificar)
| Archivo | Cambios |
|---------|---------|
| `models/productoDB.php` | +método paginado |
| `models/usuarioDB.php` | +método paginado |
| `models/pedidoDB.php` | +método paginado |
| `controllers/productoController.php` | +parseo params |
| `controllers/usuarioController.php` | +parseo params |
| `controllers/pedidoController.php` | +parseo params |

### Frontend (crear)
| Archivo | Propósito |
|---------|-----------|
| `admin/index.html` | Layout HTML |
| `admin/css/styles.css` | Estilos |
| `admin/js/api.js` | Cliente HTTP |
| `admin/js/components.js` | Componentes reutilizables |
| `admin/js/app.js` | Inicialización |
| `admin/js/productos.js` | Módulo productos |
| `admin/js/usuarios.js` | Módulo usuarios |
| `admin/js/pedidos.js` | Módulo pedidos |

---

## Verificación

### Probar paginación backend
```bash
curl "http://localhost/apiComercio/api/productos?page=1&limit=5"
curl "http://localhost/apiComercio/api/productos?search=laptop"
```

### Probar dashboard
1. Acceder a `http://localhost/apiComercio/admin/`
2. Verificar que productos carga con paginación
3. Buscar "laptop" → ver resultados filtrados
4. Navegar páginas → ver datos cambiar
5. CRUD completo en cada módulo
6. Filtrar pedidos por estado

---

## Notas Técnicas

- La API ya tiene CORS habilitado
- Paginación por defecto: 10 items por página
- Búsqueda usa LIKE '%term%' en SQL
- Debounce en frontend: 300ms antes de buscar
- No se requiere autenticación (Fase 2)

---

## Fases Futuras

### Fase 2: Autenticación JWT
- Endpoint `POST /api/auth/login`
- Middleware de validación de token
- Pantalla de login en dashboard
- Protección de rutas por rol

### Fase 3: Catálogo Público
- Vista pública de productos (sin login)
- Diseño para clientes

### Fase 4: Área de Cliente
- Login de clientes
- Ver mis pedidos
- Historial de compras
