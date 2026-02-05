<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../config/config.php';
require_once '../lib/AuthMiddleware.php';
require_once '../models/productoDB.php';
require_once '../models/usuarioDB.php';
require_once '../models/pedidoDB.php';
require_once '../models/detallePedidoDB.php';
require_once '../controllers/productoController.php';
require_once '../controllers/usuarioController.php';
require_once '../controllers/pedidoController.php';
require_once '../controllers/AuthController.php';
require_once '../controllers/PerfilController.php';

// Averiguar la url de la petición
$requestUrl = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Obtener el método utilizado en la petición
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Dividir en segmentos
$segmentos = explode('/', trim($requestUrl, '/'));

// Validar estructura básica de la URL
if (!isset($segmentos[1]) || $segmentos[1] !== 'api' || !isset($segmentos[2])) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => 'Endpoint no encontrado',
        'endpoints_disponibles' => [
            'GET /api/productos' => 'Listar todos los productos',
            'GET /api/productos/{id}' => 'Obtener un producto',
            'POST /api/productos' => 'Crear producto',
            'PUT /api/productos/{id}' => 'Actualizar producto',
            'DELETE /api/productos/{id}' => 'Eliminar producto',
            'GET /api/usuarios' => 'Listar todos los usuarios',
            'GET /api/usuarios/{id}' => 'Obtener un usuario',
            'POST /api/usuarios' => 'Crear usuario',
            'PUT /api/usuarios/{id}' => 'Actualizar usuario',
            'DELETE /api/usuarios/{id}' => 'Eliminar usuario',
            'GET /api/pedidos' => 'Listar todos los pedidos',
            'GET /api/pedidos/{id}' => 'Obtener un pedido con detalles',
            'POST /api/pedidos' => 'Crear pedido',
            'PUT /api/pedidos/{id}' => 'Actualizar pedido',
            'DELETE /api/pedidos/{id}' => 'Eliminar pedido',
            'PUT /api/pedidos/{id}/estado' => 'Cambiar estado del pedido',
            'GET /api/pedidos/{id}/detalles' => 'Obtener detalles del pedido',
            'POST /api/pedidos/{id}/detalles' => 'Agregar producto al pedido',
            'DELETE /api/pedidos/{id}/detalles' => 'Eliminar producto del pedido',
            'POST /api/auth/login' => 'Autenticar usuario y obtener token JWT',
            'GET /api/auth/verify' => 'Verificar validez del token',
            'GET /api/perfil' => 'Obtener mis datos (requiere autenticación)',
            'PUT /api/perfil' => 'Actualizar mis datos (email, nombre, password)'
        ]
    ]);
    exit();
}

$recurso = $segmentos[2];
$id = isset($segmentos[3]) ? $segmentos[3] : null;
$accion = isset($segmentos[4]) ? $segmentos[4] : null;

$database = new Database();

switch ($recurso) {
    case 'productos':
        // Endpoint especial para categorias
        if ($id === 'categorias' && $requestMethod === 'GET') {
            $controller = new ProductoController($database, $requestMethod, null);
            $controller->getCategorias();
            break;
        }
        // GET es publico, POST/PUT/DELETE requiere admin
        if ($requestMethod !== 'GET') {
            AuthMiddleware::soloAdmin();
        }
        $productoId = $id ? (int)$id : null;
        $controller = new ProductoController($database, $requestMethod, $productoId);
        $controller->processRequest();
        break;

    case 'usuarios':
        // Todos los endpoints de usuarios requieren admin
        AuthMiddleware::soloAdmin();
        $usuarioId = $id ? (int)$id : null;
        $controller = new UsuarioController($database, $requestMethod, $usuarioId);
        $controller->processRequest();
        break;

    case 'pedidos':
        // GET permite admin o usuario, el resto solo admin
        if ($requestMethod === 'GET') {
            $usuarioActual = AuthMiddleware::verificar(['admin', 'usuario']);
        } else {
            $usuarioActual = AuthMiddleware::soloAdmin();
        }
        $pedidoId = $id ? (int)$id : null;
        $controller = new PedidoController($database, $requestMethod, $pedidoId, $accion, $usuarioActual);
        $controller->processRequest();
        break;

    case 'auth':
        // Auth es publico (login, verify)
        $controller = new AuthController($database, $requestMethod, $id);
        $controller->processRequest();
        break;

    case 'perfil':
        // Perfil requiere autenticación (cualquier usuario logueado)
        $usuarioActual = AuthMiddleware::verificar(['admin', 'usuario']);
        $controller = new PerfilController($database, $requestMethod, $usuarioActual);
        $controller->processRequest();
        break;

    default:
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Recurso no encontrado: ' . $recurso
        ]);
}

$database->close();
