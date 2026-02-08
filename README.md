# API Comercio

API REST para gestión de comercio electrónico desarrollada en PHP vanilla con MySQL.

## Estructura del Proyecto

```
apiComercio/
├── api/
│   └── index.php              # Router principal de la API
├── config/
│   ├── config.php             # Configuración de BD y JWT
│   ├── config_plantilla.php   # Plantilla de configuración
│   └── database.php           # Clase de conexión a BD
├── controllers/
│   ├── AuthController.php     # Controlador de autenticación
│   ├── RegistroController.php # Controlador de registro de usuarios
│   ├── PasswordResetController.php # Controlador de recuperación de contraseña
│   ├── PerfilController.php   # Controlador de perfil de usuario
│   ├── productoController.php # Controlador de productos
│   ├── usuarioController.php  # Controlador de usuarios
│   └── pedidoController.php   # Controlador de pedidos y detalles
├── lib/
│   ├── JWT.php                # Librería para tokens JWT
│   └── AuthMiddleware.php     # Middleware de autorización
├── models/
│   ├── productoDB.php         # Modelo de productos
│   ├── usuarioDB.php          # Modelo de usuarios
│   ├── pedidoDB.php           # Modelo de pedidos
│   ├── detallePedidoDB.php    # Modelo de detalles de pedido
│   └── PasswordResetDB.php   # Modelo de tokens de recuperación
├── admin/                     # Dashboard de administración
│   ├── index.html
│   ├── css/
│   └── js/
├── tienda/                    # Tienda pública con carrito
│   ├── index.html
│   ├── css/
│   └── js/
├── cliente/                   # Área de cliente (mis pedidos, perfil)
│   ├── index.html
│   └── js/
├── uploads/                   # Imágenes subidas
│   ├── .htaccess              # Bloqueo de ejecución PHP
│   └── productos/             # Imágenes de productos
│       └── .htaccess
├── database/
│   └── apiComercioDB.sql      # Script para crear/recrear la BD
├── login.html                 # Página de login
├── .htaccess                  # Configuración Apache para URL amigables
└── .gitignore
```

## Requisitos

- PHP 7.4+
- MySQL 5.7+ / MariaDB 10.3+
- Apache con mod_rewrite habilitado (WAMP/XAMPP)

## Instalación

### 1. Clonar/Copiar el proyecto
```bash
git clone <repo> c:/wamp64/www/apiComercio
```

### 2. Configurar la base de datos
Copiar la plantilla de configuración:
```bash
cp config/config_plantilla.php config/config.php
```

Editar `config/config.php` con las credenciales de tu BD:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');        // Vacío en WAMP por defecto
define('DB_NAME', 'apiComercioDB');
```

### 3. Crear la base de datos
```bash
mysql -u root -p < database/apiComercioDB.sql
```

O importar desde phpMyAdmin.

## Base de Datos

### Diagrama de Tablas

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  producto   │     │   usuario   │     │     pedido      │
├─────────────┤     ├─────────────┤     ├─────────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)         │
│ codigo      │     │ email       │     │ usuario_id (FK) │──→ usuario.id
│ nombre      │     │ password    │     │ estado          │
│ precio      │     │ nombre      │     │ total           │
│ descripcion │     │ rol         │     │ direccion_envio │
│ categoria   │     │ activo      │     │ ciudad          │
│ imagen      │     │ created_at  │     │ notas           │
│ created_at  │     │ updated_at  │     │ created_at      │
│ updated_at  │     └─────────────┘     │ updated_at      │
└─────────────┘                         └─────────────────┘
       ▲                                         ▲
       │                                         │
       │            ┌─────────────────┐          │
       │            │ detalle_pedido  │          │
       │            ├─────────────────┤          │
       └────────────│ producto_id(FK) │          │
                    │ pedido_id (FK)  │──────────┘
                    │ cantidad        │
                    │ precio_unitario │
                    │ subtotal        │
                    └─────────────────┘
```

### Campos por Tabla

#### producto
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT AUTO_INCREMENT | Clave primaria |
| codigo | VARCHAR(50) UNIQUE | Código SKU del producto |
| nombre | VARCHAR(255) | Nombre del producto |
| precio | DECIMAL(10,2) | Precio unitario |
| descripcion | TEXT | Descripción detallada |
| categoria | VARCHAR(100) | Categoría del producto |
| imagen | VARCHAR(500) | Ruta de imagen local o URL externa |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Fecha de última modificación |

**Categorías disponibles:** Computadoras, Perifericos, Monitores, Audio, Almacenamiento, Tablets, Accesorios, Mobiliario, Componentes

#### usuario
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT AUTO_INCREMENT | Clave primaria |
| email | VARCHAR(255) UNIQUE | Email (login) |
| password | VARCHAR(255) | Contraseña hasheada (bcrypt) |
| nombre | VARCHAR(100) | Nombre completo |
| rol | ENUM('admin','usuario') | Rol del usuario |
| activo | BOOLEAN | Estado de la cuenta |
| created_at | TIMESTAMP | Fecha de registro |
| updated_at | TIMESTAMP | Fecha de última modificación |

#### pedido
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT AUTO_INCREMENT | Clave primaria |
| usuario_id | INT | FK a usuario |
| estado | ENUM | pendiente, procesando, enviado, entregado, cancelado |
| total | DECIMAL(10,2) | Total del pedido (calculado) |
| direccion_envio | TEXT | Dirección de entrega |
| ciudad | VARCHAR(100) | Ciudad de envío |
| notas | TEXT | Observaciones |
| created_at | TIMESTAMP | Fecha del pedido |
| updated_at | TIMESTAMP | Fecha de última modificación |

#### detalle_pedido
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT AUTO_INCREMENT | Clave primaria |
| pedido_id | INT | FK a pedido (CASCADE DELETE) |
| producto_id | INT | FK a producto |
| cantidad | INT | Unidades |
| precio_unitario | DECIMAL(10,2) | Precio al momento de la compra |
| subtotal | DECIMAL(10,2) | cantidad * precio_unitario |
| created_at | TIMESTAMP | Fecha de adición |

## Autenticación JWT

La API utiliza JSON Web Tokens (JWT) para la autenticación.

### Endpoints de Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/login` | Iniciar sesión y obtener token |
| POST | `/auth/register` | Registrar nuevo usuario (auto-login) |
| POST | `/auth/forgot-password` | Solicitar token de recuperación |
| POST | `/auth/reset-password` | Restablecer contraseña con token |
| GET | `/auth/verify` | Verificar validez del token |

**Login:**
```bash
curl -X POST http://localhost/apiComercio/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@comercio.com","password":"password"}'
```

**Respuesta:**
```json
{
    "success": true,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expira_en": 86400,
        "usuario": {
            "id": 1,
            "email": "admin@comercio.com",
            "nombre": "Administrador",
            "rol": "admin"
        }
    }
}
```

**Uso del token:**
```bash
curl http://localhost/apiComercio/api/usuarios \
  -H "Authorization: Bearer <token>"
```

### Niveles de Acceso
- **Público:** No requiere autenticación
- **Usuario:** Requiere token válido (rol: usuario o admin)
- **Admin:** Requiere token válido con rol admin

## API Endpoints

**Base URL:** `http://localhost/apiComercio/api`

### Productos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/productos` | Listar productos | Público |
| GET | `/productos/{id}` | Obtener un producto | Público |
| GET | `/productos/categorias` | Listar categorías únicas | Público |
| POST | `/productos` | Crear producto | Admin |
| PUT | `/productos/{id}` | Actualizar producto | Admin |
| DELETE | `/productos/{id}` | Eliminar producto | Admin |
| POST | `/productos/{id}/imagen` | Subir imagen de producto | Admin |

**Filtros disponibles (GET):**
- `?search=texto` - Buscar por código, nombre o descripción
- `?categoria=Perifericos` - Filtrar por categoría
- `?page=1&limit=10` - Paginación

**POST/PUT Body:**
```json
{
    "codigo": "PROD001",
    "nombre": "Laptop HP",
    "precio": 899.99,
    "descripcion": "Descripción del producto",
    "categoria": "Computadoras",
    "imagen": "https://ejemplo.com/imagen.jpg"
}
```

### Usuarios

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/usuarios` | Listar todos los usuarios | Admin |
| GET | `/usuarios/{id}` | Obtener un usuario | Admin |
| POST | `/usuarios` | Crear usuario | Admin |
| PUT | `/usuarios/{id}` | Actualizar usuario | Admin |
| DELETE | `/usuarios/{id}` | Eliminar usuario | Admin |

### Perfil (Usuario autenticado)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/perfil` | Obtener mis datos | Usuario |
| PUT | `/perfil` | Actualizar mis datos | Usuario |

**POST Body (crear):**
```json
{
    "email": "nuevo@ejemplo.com",
    "password": "contraseña123",
    "nombre": "Nombre Usuario",
    "rol": "usuario"
}
```

**PUT Body (actualizar):**
```json
{
    "email": "actualizado@ejemplo.com",
    "nombre": "Nombre Actualizado",
    "rol": "usuario",
    "activo": 1
}
```

### Pedidos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/pedidos` | Listar todos los pedidos | Admin/Usuario |
| GET | `/pedidos/{id}` | Obtener pedido con detalles | Admin/Usuario |
| POST | `/pedidos` | Crear pedido | Admin/Usuario |
| PUT | `/pedidos/{id}` | Actualizar pedido | Admin |
| DELETE | `/pedidos/{id}` | Eliminar pedido | Admin |
| PUT | `/pedidos/{id}/estado` | Cambiar estado | Admin |
| GET | `/pedidos/{id}/detalles` | Ver detalles del pedido | Admin |
| POST | `/pedidos/{id}/detalles` | Agregar producto al pedido | Admin |
| DELETE | `/pedidos/{id}/detalles` | Quitar producto del pedido | Admin |

**Filtros disponibles (GET):**
- `?estado=pendiente` - Filtrar por estado
- `?usuario_id=2` - Filtrar por cliente
- `?page=1&limit=10` - Paginación

**POST Body (crear pedido con productos):**
```json
{
    "usuario_id": 2,
    "ciudad": "Madrid",
    "direccion_envio": "Calle Example 123, 28001",
    "notas": "Dejar en portería",
    "productos": [
        {"producto_id": 1, "cantidad": 2},
        {"producto_id": 3, "cantidad": 1}
    ]
}
```

**PUT Body (cambiar estado):**
```json
{
    "estado": "enviado"
}
```
Estados válidos: `pendiente`, `procesando`, `enviado`, `entregado`, `cancelado`

**POST Body (agregar detalle):**
```json
{
    "producto_id": 5,
    "cantidad": 2
}
```

**DELETE Body (quitar detalle):**
```json
{
    "detalle_id": 3
}
```

## Respuestas de la API

### Respuesta exitosa
```json
{
    "success": true,
    "data": { ... },
    "count": 10
}
```

### Respuesta de error
```json
{
    "success": false,
    "error": "Mensaje de error"
}
```

### Códigos HTTP
- `200 OK` - Operación exitosa
- `201 Created` - Recurso creado
- `400 Bad Request` - Datos incompletos o inválidos
- `404 Not Found` - Recurso no encontrado
- `409 Conflict` - Conflicto (ej: email duplicado)
- `500 Internal Server Error` - Error del servidor

## Datos de Prueba

### Usuarios
| Email | Password | Rol |
|-------|----------|-----|
| admin@comercio.com | password | admin |
| juan@ejemplo.com | password | usuario |
| maria@ejemplo.com | password | usuario |
| carlos@ejemplo.com | password | usuario |

### Productos
15 productos de tecnología (PROD001 - PROD015):
- Laptops, monitores, periféricos
- Precios entre 34.99 y 899.99

### Pedidos
4 pedidos de prueba en diferentes estados con sus detalles.

## Modelos - Métodos Disponibles

### ProductoDB
- `getAll()` - Obtener todos los productos
- `getAllPaginated($page, $limit, $search, $categoria)` - Obtener paginado con filtros
- `getById($id)` - Obtener producto por ID
- `getCategorias()` - Obtener lista de categorías únicas
- `createProducto($codigo, $nombre, $precio, $descripcion, $categoria, $imagen)` - Crear (retorna ID)
- `updateProducto($id, $codigo, $nombre, $precio, $descripcion, $categoria, $imagen)` - Actualizar
- `updateImagen($id, $ruta)` - Actualizar solo la imagen
- `delete($id)` - Eliminar

### UsuarioDB
- `getAll()` - Obtener todos (sin passwords)
- `getById($id)` - Obtener por ID (sin password)
- `getByEmail($email)` - Obtener por email (con password para auth)
- `create($email, $password, $nombre, $rol)` - Crear (hashea password)
- `update($id, $email, $nombre, $rol, $activo)` - Actualizar
- `updatePassword($id, $password)` - Cambiar contraseña
- `delete($id)` - Eliminar
- `verificarCredenciales($email, $password)` - Login

### PedidoDB
- `getAll()` - Obtener todos con info de cliente
- `getAllPaginated($page, $limit, $estado, $usuarioId)` - Obtener paginado con filtros
- `getById($id)` - Obtener por ID con info de cliente
- `getByUsuarioId($usuarioId)` - Pedidos de un usuario
- `create($usuarioId, $direccionEnvio, $ciudad, $notas)` - Crear (retorna ID)
- `update($id, $direccionEnvio, $ciudad, $notas)` - Actualizar
- `updateEstado($id, $estado)` - Cambiar estado
- `updateTotal($id, $total)` - Actualizar total
- `recalcularTotal($pedidoId)` - Recalcular desde detalles
- `delete($id)` - Eliminar

### DetallePedidoDB
- `getByPedidoId($pedidoId)` - Detalles de un pedido
- `getById($id)` - Obtener detalle por ID
- `create($pedidoId, $productoId, $cantidad, $precioUnitario)` - Agregar
- `update($id, $cantidad, $precioUnitario)` - Modificar
- `delete($id)` - Eliminar detalle
- `deleteByPedidoId($pedidoId)` - Eliminar todos de un pedido

## Ejemplos con cURL

```bash
# Login y obtener token
curl -X POST http://localhost/apiComercio/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@comercio.com","password":"password"}'

# Listar productos (público)
curl http://localhost/apiComercio/api/productos

# Listar productos por categoría
curl "http://localhost/apiComercio/api/productos?categoria=Perifericos"

# Obtener categorías
curl http://localhost/apiComercio/api/productos/categorias

# Crear producto (requiere token admin)
curl -X POST http://localhost/apiComercio/api/productos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"codigo":"PROD016","nombre":"Nuevo Producto","precio":99.99,"descripcion":"Desc","categoria":"Accesorios"}'

# Subir imagen de producto (requiere token admin, multipart/form-data)
curl -X POST http://localhost/apiComercio/api/productos/1/imagen \
  -H "Authorization: Bearer <token>" \
  -F "imagen=@/ruta/a/imagen.jpg"

# Crear pedido (requiere token admin)
curl -X POST http://localhost/apiComercio/api/pedidos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"usuario_id":2,"ciudad":"Madrid","direccion_envio":"Calle 123, 28001","productos":[{"producto_id":1,"cantidad":1}]}'

# Cambiar estado de pedido (requiere token admin)
curl -X PUT http://localhost/apiComercio/api/pedidos/1/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"estado":"enviado"}'
```

## Notas de Desarrollo

- Las contraseñas se hashean con `password_hash($password, PASSWORD_BCRYPT)`
- Las validaciones con `password_verify($password, $hash)`
- El total del pedido se recalcula automáticamente al agregar/quitar detalles
- Al eliminar un pedido, sus detalles se eliminan en cascada (FK CASCADE)
- Los productos no se pueden eliminar si tienen pedidos asociados (FK RESTRICT)
- Los tokens JWT expiran en 24 horas (configurable en `config.php`)
- **Puerto MySQL:** En WAMP se usa el puerto 3308 (configurado en `database.php`)
- **Subida de imágenes:** `POST /api/productos/{id}/imagen` acepta `multipart/form-data`
  - Tipos permitidos: JPEG, PNG, WebP, GIF
  - Tamaño máximo: 2 MB
  - Se optimizan con GD (resize max 800px ancho, JPEG 85%)
  - Se almacenan en `uploads/productos/` con nombre `prod_{id}_{timestamp}.jpg`
  - Al eliminar un producto, se borra su imagen local automáticamente
  - Directorio protegido con `.htaccess` contra ejecución de PHP

## Dashboard

### Admin (`/admin/`)
- Gestión completa de productos, usuarios y pedidos
- Subida de imágenes de productos (validación, optimización, almacenamiento local)
- Miniaturas de productos en el listado
- Filtros por categoría, estado y cliente
- Modificación de pedidos (agregar/quitar productos, cambiar cantidades)

### Cliente (`/cliente/`)
- Ver mis pedidos
- Ver detalles de pedidos
- Gestión de perfil

## Interfaces

- **Tienda (público):** `http://localhost/apiComercio/tienda/` - Catálogo, carrito, checkout
- **Login:** `http://localhost/apiComercio/login.html`
- **Dashboard Admin:** `http://localhost/apiComercio/admin/`
- **Área Cliente:** `http://localhost/apiComercio/cliente/`

### Tienda (`/tienda/`)
- Catálogo de productos con imágenes, filtros por categoría y búsqueda
- Carrito de compras persistente en localStorage
- Registro de nuevos usuarios
- Checkout en 3 pasos (revisión, envío, confirmación)
- Recuperación de contraseña (en DEV_MODE muestra el token en pantalla)
