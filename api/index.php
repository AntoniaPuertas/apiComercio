<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';
require_once '../models/productoDB.php';
require_once '../controllers/productoController.php';

//averiguar la url de la petición
$requestUrl = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

//obtener el método utilizado en la petición
$requestMethod = $_SERVER['REQUEST_METHOD'];

//dividir en segmentos
$segmentos = explode('/', trim($requestUrl, '/'));

if($segmentos[1] !== 'api' || !isset($segmentos[2]) || $segmentos[2] !== 'productos'){
    $respuesta['status_code_header'] = 'HTTP/1.1 404 Not Found';
    echo json_encode([
        'success' => false,
        'error' => 'Endpoint no encontrado'
    ]);
    exit();
}

$productoId = null;
if(isset($segmentos[3])){
    $productoId = (int)$segmentos[3];
}

$database = new Database();
$productoController = new ProductoController($database, $requestMethod, $productoId);
$productoController->processRequest();
$database->close();