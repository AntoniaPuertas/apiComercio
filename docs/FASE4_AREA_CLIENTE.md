# Fase 4: Área de Cliente

## Estructura de Archivos

```
apiComercio/
├── admin/                      # Panel de administración (solo admins)
│   ├── login.html              # Login compartido (redirige según rol)
│   ├── index.html              # Dashboard admin
│   ├── css/styles.css
│   └── js/
│       ├── auth.js
│       ├── api.js
│       ├── app.js
│       ├── components.js
│       ├── productos.js
│       ├── usuarios.js
│       └── pedidos.js
│
├── cliente/                    # Área de cliente (solo usuarios)
│   ├── index.html              # Dashboard cliente
│   └── js/
│       ├── app.js              # Lógica específica del cliente
│       └── pedidos.js          # Módulo de "Mis Pedidos"
│
└── api/                        # Backend (ya existe)
```

## Archivos Compartidos

El área de cliente usará algunos archivos del admin mediante rutas relativas:
- `../admin/css/styles.css` - Estilos compartidos
- `../admin/js/auth.js` - Módulo de autenticación
- `../admin/js/api.js` - Cliente API

## Funcionalidades del Cliente

### 1. Dashboard Principal
- Ver resumen de pedidos
- Acceso rápido a funciones

### 2. Mis Pedidos
- Listar solo los pedidos del usuario logueado
- Ver detalles de cada pedido
- Ver estado de los pedidos

### 3. Mi Perfil
- Ver datos personales
- Modificar: email, nombre, password
- NO puede modificar: rol, estado (activo/inactivo)

## Cambios en la API

### Nuevo Endpoint: GET /api/usuarios/me
Retorna los datos del usuario autenticado.

### Nuevo Endpoint: PUT /api/usuarios/me
Permite al usuario modificar sus propios datos.
- Campos permitidos: email, nombre, password
- Campos NO permitidos: rol, activo

### Modificación: GET /api/pedidos
Para usuarios no-admin, filtrar automáticamente por `usuario_id` del token.

## Protección de Rutas

| Ruta | Acceso |
|------|--------|
| `/admin/login.html` | Público |
| `/admin/index.html` | Solo admin |
| `/cliente/index.html` | Solo usuario (no admin) |

## Flujo de Login

```
1. Usuario accede a /admin/login.html
2. Introduce credenciales
3. Si rol = admin → redirige a /admin/index.html
4. Si rol = usuario → redirige a /cliente/index.html
```

## Checklist de Implementación

### Backend
- [x] Crear endpoint GET /api/perfil
- [x] Crear endpoint PUT /api/perfil
- [x] Modificar GET /api/pedidos para filtrar por usuario

### Frontend - Admin
- [x] Proteger /admin/index.html solo para admins
- [x] Actualizar login.html con redirección por rol

### Frontend - Cliente
- [x] Crear /cliente/index.html
- [x] Crear /cliente/js/app.js
- [x] Crear módulo "Mis Pedidos"
- [x] Crear módulo "Mi Perfil"

### Seguridad
- [x] Verificar que cliente no pueda acceder a /admin
- [x] Verificar que admin puede acceder a ambas áreas
- [x] Verificar que usuario solo ve sus pedidos

## Diseño del Dashboard Cliente

```
┌─────────────────────────────────────────────────────────────┐
│  SIDEBAR                │  CONTENIDO PRINCIPAL              │
│  ─────────              │  ────────────────────             │
│  API Comercio           │                                   │
│  [Usuario]              │  Mis Pedidos                      │
│                         │  ┌─────────────────────────────┐  │
│  ☐ Mis Pedidos          │  │ #1234 │ Pendiente │ $150   │  │
│  ☐ Mi Perfil            │  │ #1233 │ Enviado   │ $89    │  │
│                         │  │ #1232 │ Entregado │ $210   │  │
│                         │  └─────────────────────────────┘  │
│  ─────────              │                                   │
│  Juan García            │                                   │
│  [Cerrar sesión]        │                                   │
└─────────────────────────────────────────────────────────────┘
```
