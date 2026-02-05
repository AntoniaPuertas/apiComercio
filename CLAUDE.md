# Contexto del Proyecto para Claude

Este archivo contiene información relevante para continuar el desarrollo de la API.

## Resumen del Proyecto

API REST de comercio electrónico en PHP vanilla + MySQL. Sin frameworks, arquitectura MVC simple.

## Stack Tecnológico

- **Backend:** PHP 7.4+ (vanilla, sin frameworks)
- **Base de datos:** MySQL 9.1 (WAMP)
- **Servidor:** Apache con mod_rewrite
- **Entorno:** WAMP64 en Windows

## Arquitectura

```
Petición HTTP → api/index.php (router) → Controller → Model → MySQL
```

- **Router (`api/index.php`):** Parsea URL, identifica recurso y método, instancia controller
- **Controllers:** Procesan request, validan datos, llaman al modelo, formatean respuesta JSON
- **Models:** Interactúan con BD usando mysqli prepared statements

## Configuración Actual

```php
// config/config.php
DB_HOST: localhost
DB_USER: root
DB_PASS: '' (vacío)
DB_NAME: apiComercioDB

// Configuración JWT
JWT_SECRET_KEY: 'apiComercio_secret_key_2024_cambiar_en_produccion'
JWT_EXPIRATION: 86400 (24 horas)
JWT_ISSUER: 'apiComercio'
```

MySQL path en WAMP: `c:/wamp64/bin/mysql/mysql9.1.0/bin/mysql.exe`

## Autenticación JWT

### Estructura de archivos
- `lib/JWT.php` - Librería para generar/validar tokens
- `lib/AuthMiddleware.php` - Middleware de autorización
- `controllers/AuthController.php` - Endpoint de login
- `admin/login.html` - Pantalla de login
- `admin/js/auth.js` - Módulo JS de autenticación

### Uso del Middleware
```php
// Solo admin
AuthMiddleware::soloAdmin();

// Admin o usuario
AuthMiddleware::verificar(['admin', 'usuario']);

// Cualquier usuario autenticado
AuthMiddleware::verificar();

// Verificación opcional (no bloquea)
$usuario = AuthMiddleware::verificarOpcional();
```

### Protección de Rutas
| Endpoint | GET | POST/PUT/DELETE |
|----------|-----|-----------------|
| /api/productos | Público | Solo admin |
| /api/usuarios | Solo admin | Solo admin |
| /api/pedidos | Admin/Usuario | Solo admin |
| /api/auth | Público | Público |

## Tablas de la BD

1. **producto** - Catálogo de productos (15 registros de prueba)
   - Campos: id, codigo, nombre, precio, descripcion, categoria, imagen, created_at, updated_at
   - Categorías: Computadoras, Perifericos, Monitores, Audio, Almacenamiento, Tablets, Accesorios, Mobiliario, Componentes
2. **usuario** - Usuarios con roles admin/usuario (4 registros)
   - Campos: id, email, password, nombre, rol, activo, created_at, updated_at
3. **pedido** - Pedidos con estados (4 registros)
   - Campos: id, usuario_id, estado, total, direccion_envio, ciudad, notas, created_at, updated_at
4. **detalle_pedido** - Líneas de pedido (8 registros)
   - Campos: id, pedido_id, producto_id, cantidad, precio_unitario, subtotal, created_at

## Endpoints Implementados

### Autenticación: `/api/auth`
- `POST /api/auth/login` - Autenticar usuario, retorna token JWT
- `GET /api/auth/verify` - Verificar validez del token

### Productos: `/api/productos`
- CRUD completo (GET, POST, PUT, DELETE)
- `GET /api/productos/categorias` - Obtener lista de categorías únicas
- GET es público, POST/PUT/DELETE requiere rol `admin`
- Filtros disponibles: `?search=`, `?categoria=`, `?page=`, `?limit=`

### Usuarios: `/api/usuarios`
- CRUD completo
- Passwords hasheados con bcrypt
- **Protegido:** Requiere rol `admin`

### Pedidos: `/api/pedidos`
- CRUD completo
- `/pedidos/{id}/estado` - PUT para cambiar estado
- `/pedidos/{id}/detalles` - GET, POST, DELETE para gestionar líneas
- Total se recalcula automáticamente
- GET permite rol `admin` o `usuario`, resto requiere `admin`

## Patrón de Código

### Modelo típico:
```php
class NombreDB {
    private $db;
    private $table = 'nombre_tabla';

    public function __construct($database) {
        $this->db = $database->getConexion();
    }

    public function getById($id) {
        $sql = "SELECT * FROM {$this->table} WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        // ... prepared statement pattern
    }
}
```

### Controller típico:
```php
class NombreController {
    private $modelDB;
    private $requestMethod;
    private $id;

    public function processRequest() {
        switch($this->requestMethod) {
            case 'GET': // ...
            case 'POST': // ...
        }
        header($respuesta['status_code_header']);
        echo $respuesta['body'];
    }
}
```

### Respuesta típica:
```php
$respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
$respuesta['body'] = json_encode([
    'success' => true,
    'data' => $datos
]);
```

## Funcionalidades Implementadas

- [x] Autenticación JWT (`lib/JWT.php`)
- [x] Endpoint de login (`POST /api/auth/login`)
- [x] Middleware de autorización por rol (`lib/AuthMiddleware.php`)
- [x] Dashboard admin con login (`admin/login.html`)
- [x] Paginación en listados

## Funcionalidades Pendientes (Posibles)

- [ ] Validación de stock
- [ ] Historial de cambios de estado
- [ ] Carrito de compras
- [ ] Refresh tokens
- [ ] Rate limiting

## Datos de Prueba

- **Admin:** admin@comercio.com / password
- **Usuarios:** juan@ejemplo.com, maria@ejemplo.com, carlos@ejemplo.com (todos con password: `password`)

## Comandos Útiles

```bash
# Recrear BD completa
"c:/wamp64/bin/mysql/mysql9.1.0/bin/mysql.exe" -u root < database/apiComercioDB.sql

# Ejecutar query
"c:/wamp64/bin/mysql/mysql9.1.0/bin/mysql.exe" -u root apiComercioDB -e "SELECT * FROM producto"
```

## Notas Importantes

1. El linter de VSCode muestra errores en SQL porque está configurado para SQL Server, no MySQL. Los archivos .sql son correctos.

2. La contraseña de MySQL en WAMP está vacía por defecto, no es "root".

3. Los IDs de usuario en pedidos de prueba:
   - usuario_id 2 = Juan Garcia
   - usuario_id 3 = Maria Lopez
   - usuario_id 4 = Carlos Martinez

4. Foreign Keys:
   - `pedido.usuario_id` → RESTRICT (no permite borrar usuario con pedidos)
   - `detalle_pedido.pedido_id` → CASCADE (al borrar pedido, borra detalles)
   - `detalle_pedido.producto_id` → RESTRICT (no permite borrar producto en pedidos)

5. **Puerto MySQL:** WAMP usa el puerto 3308 (no el 3306 predeterminado). La conexión en `config/database.php` incluye este puerto.

---

## Historial de Cambios

### 2026-02-05: Agregar campos categoria y ciudad

**Objetivo:** Agregar campo `categoria` a productos y campo `ciudad` a pedidos.

#### Archivos modificados:

**Base de datos:**
- `database/apiComercioDB.sql` - Agregados campos categoria (producto) y ciudad (pedido) con índices

**Modelos:**
- `models/ProductoDB.php`:
  - Nuevo método `getCategorias()` para obtener categorías únicas
  - Actualizado `getAllPaginated()` con filtro por categoría
  - Actualizado `createProducto()` y `updateProducto()` con parámetro categoria
- `models/PedidoDB.php`:
  - Actualizado `create()` y `update()` con parámetro ciudad

**Controllers:**
- `controllers/ProductoController.php`:
  - Nuevo método `getCategorias()`
  - Actualizado `getAllProductos()` con filtro categoria
  - Actualizado validaciones para incluir categoria
- `controllers/PedidoController.php`:
  - Campo ciudad requerido en `createPedido()`
  - Actualizado `updatePedido()` para manejar ciudad

**Router:**
- `api/index.php` - Nueva ruta `GET /api/productos/categorias`

**Dashboard Admin:**
- `admin/index.html` - Agregado filtro de categorías
- `admin/js/api.js` - Método `API.productos.getCategorias()`
- `admin/js/productos.js`:
  - Filtro por categoría en listado
  - Campo categoría en formulario con datalist
  - Columna categoría en tabla
- `admin/js/pedidos.js`:
  - Campo ciudad en formulario de nuevo pedido
  - Muestra ciudad en vista de detalles

**Área Cliente:**
- `cliente/js/pedidos.js` - Muestra ciudad en detalles del pedido

**Configuración:**
- `config/database.php` - Especificado puerto 3308 para MySQL de WAMP

#### Categorías disponibles:
Computadoras, Perifericos, Monitores, Audio, Almacenamiento, Tablets, Accesorios, Mobiliario, Componentes

#### Ciudades de prueba:
Madrid, Barcelona, Valencia
