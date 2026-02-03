# API Comercio

API REST para gestión de comercio electrónico desarrollada en PHP vanilla con MySQL.

## Estructura del Proyecto

```
apiComercio/
├── api/
│   └── index.php              # Router principal de la API
├── config/
│   ├── config.php             # Configuración de BD (credenciales)
│   ├── config_plantilla.php   # Plantilla de configuración
│   └── database.php           # Clase de conexión a BD
├── controllers/
│   ├── productoController.php # Controlador de productos
│   ├── usuarioController.php  # Controlador de usuarios
│   └── pedidoController.php   # Controlador de pedidos y detalles
├── models/
│   ├── productoDB.php         # Modelo de productos
│   ├── usuarioDB.php          # Modelo de usuarios
│   ├── pedidoDB.php           # Modelo de pedidos
│   └── detallePedidoDB.php    # Modelo de detalles de pedido
├── database/
│   └── apiComercioDB.sql      # Script para crear/recrear la BD
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
│ imagen      │     │ activo      │     │ notas           │
│ created_at  │     │ created_at  │     │ created_at      │
│ updated_at  │     │ updated_at  │     │ updated_at      │
└─────────────┘     └─────────────┘     └─────────────────┘
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
| imagen | VARCHAR(500) | URL de la imagen |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Fecha de última modificación |

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

## API Endpoints

**Base URL:** `http://localhost/apiComercio/api`

### Productos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/productos` | Listar todos los productos |
| GET | `/productos/{id}` | Obtener un producto |
| POST | `/productos` | Crear producto |
| PUT | `/productos/{id}` | Actualizar producto |
| DELETE | `/productos/{id}` | Eliminar producto |

**POST/PUT Body:**
```json
{
    "codigo": "PROD001",
    "nombre": "Laptop HP",
    "precio": 899.99,
    "descripcion": "Descripción del producto",
    "imagen": "https://ejemplo.com/imagen.jpg"
}
```

### Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/usuarios` | Listar todos los usuarios |
| GET | `/usuarios/{id}` | Obtener un usuario |
| POST | `/usuarios` | Crear usuario |
| PUT | `/usuarios/{id}` | Actualizar usuario |
| DELETE | `/usuarios/{id}` | Eliminar usuario |

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

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/pedidos` | Listar todos los pedidos |
| GET | `/pedidos/{id}` | Obtener pedido con detalles |
| POST | `/pedidos` | Crear pedido |
| PUT | `/pedidos/{id}` | Actualizar pedido |
| DELETE | `/pedidos/{id}` | Eliminar pedido |
| PUT | `/pedidos/{id}/estado` | Cambiar estado |
| GET | `/pedidos/{id}/detalles` | Ver detalles del pedido |
| POST | `/pedidos/{id}/detalles` | Agregar producto al pedido |
| DELETE | `/pedidos/{id}/detalles` | Quitar producto del pedido |

**POST Body (crear pedido con productos):**
```json
{
    "usuario_id": 2,
    "direccion_envio": "Calle Example 123, Ciudad",
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
- `getById($id)` - Obtener producto por ID
- `createProducto($codigo, $nombre, $precio, $descripcion, $imagen)` - Crear
- `updateProducto($id, $codigo, $nombre, $precio, $descripcion, $imagen)` - Actualizar
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
- `getById($id)` - Obtener por ID con info de cliente
- `getByUsuarioId($usuarioId)` - Pedidos de un usuario
- `create($usuarioId, $direccionEnvio, $notas)` - Crear (retorna ID)
- `update($id, $direccionEnvio, $notas)` - Actualizar
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
# Listar productos
curl http://localhost/apiComercio/api/productos

# Crear producto
curl -X POST http://localhost/apiComercio/api/productos \
  -H "Content-Type: application/json" \
  -d '{"codigo":"PROD016","nombre":"Nuevo Producto","precio":99.99,"descripcion":"Desc","imagen":"url"}'

# Crear pedido
curl -X POST http://localhost/apiComercio/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{"usuario_id":2,"direccion_envio":"Calle 123","productos":[{"producto_id":1,"cantidad":1}]}'

# Cambiar estado de pedido
curl -X PUT http://localhost/apiComercio/api/pedidos/1/estado \
  -H "Content-Type: application/json" \
  -d '{"estado":"enviado"}'
```

## Notas de Desarrollo

- Las contraseñas se hashean con `password_hash($password, PASSWORD_BCRYPT)`
- Las validaciones con `password_verify($password, $hash)`
- El total del pedido se recalcula automáticamente al agregar/quitar detalles
- Al eliminar un pedido, sus detalles se eliminan en cascada (FK CASCADE)
- Los productos no se pueden eliminar si tienen pedidos asociados (FK RESTRICT)
