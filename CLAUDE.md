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
```

MySQL path en WAMP: `c:/wamp64/bin/mysql/mysql9.1.0/bin/mysql.exe`

## Tablas de la BD

1. **producto** - Catálogo de productos (15 registros de prueba)
2. **usuario** - Usuarios con roles admin/usuario (4 registros)
3. **pedido** - Pedidos con estados (4 registros)
4. **detalle_pedido** - Líneas de pedido (8 registros)

## Endpoints Implementados

### Productos: `/api/productos`
- CRUD completo (GET, POST, PUT, DELETE)

### Usuarios: `/api/usuarios`
- CRUD completo
- Passwords hasheados con bcrypt
- Método `verificarCredenciales()` en modelo (sin usar aún)

### Pedidos: `/api/pedidos`
- CRUD completo
- `/pedidos/{id}/estado` - PUT para cambiar estado
- `/pedidos/{id}/detalles` - GET, POST, DELETE para gestionar líneas
- Total se recalcula automáticamente

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

## Funcionalidades Pendientes (Posibles)

- [ ] Autenticación JWT
- [ ] Endpoint de login (`POST /api/auth/login`)
- [ ] Middleware de autorización por rol
- [ ] Paginación en listados
- [ ] Filtros y búsqueda
- [ ] Validación de stock
- [ ] Historial de cambios de estado
- [ ] Carrito de compras

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
