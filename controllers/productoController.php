<?php

class ProductoController
{
    private $productoDB;
    private $requestMethod;
    private $productoId;

    public function __construct($db, $requestMethod, $productoId = null)
    {
        $this->productoDB = new ProductoDB($db);
        $this->requestMethod = $requestMethod;
        $this->productoId = $productoId;
    }

    public function processRequest()
    {
        $method = $this->requestMethod;
        //comprobar el método de llamada
        switch ($method) {
            case 'GET':
                if ($this->productoId) {
                    $respuesta = $this->getProducto($this->productoId);
                } else {
                    $respuesta = $this->getAllProductos();
                }
                break;
            case 'POST':
                $respuesta = $this->createProducto();
                break;
            case 'PUT':
                if ($this->productoId) {
                    $respuesta = $this->actualizarProducto($this->productoId);
                } else {
                    $respuesta = $this->respuestaNoEncontrada();
                }
                break;
            case 'DELETE':
                if ($this->productoId) {
                    $respuesta = $this->deleteProducto($this->productoId);
                } else {
                    $respuesta = $this->respuestaNoEncontrada();
                }
                break;
            default:
                $respuesta = $this->respuestaNoEncontrada();
        }
        //Se le envía al cliente la cabecera y el cuerpo
        header($respuesta['status_code_header']);
        if ($respuesta['body']) {
            echo $respuesta['body'];
        }
    }

    private function getProducto($id)
    {
        $producto = $this->productoDB->getById($id);
        if (!$producto) {
            return $this->respuestaNoEncontrada();
        }
        $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
        $respuesta['body'] = json_encode([
            'success' => true,
            'data' => $producto
        ]);
        return $respuesta;
    }

    private function getAllProductos()
    {
        // Obtener parámetros de paginación, búsqueda y filtro
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $categoria = isset($_GET['categoria']) ? $_GET['categoria'] : '';

        // Usar nuevo método paginado
        $resultado = $this->productoDB->getAllPaginated($page, $limit, $search, $categoria);

        $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
        $respuesta['body'] = json_encode([
            'success' => true,
            'data' => $resultado['data'],
            'pagination' => $resultado['pagination']
        ]);
        return $respuesta;
    }

    public function getCategorias()
    {
        $categorias = $this->productoDB->getCategorias();

        $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
        $respuesta['body'] = json_encode([
            'success' => true,
            'data' => $categorias
        ]);

        header($respuesta['status_code_header']);
        echo $respuesta['body'];
        exit();
    }

    private function createProducto()
    {
        $input = json_decode(file_get_contents("php://input"), true);

        if (!$input || !isset($input['codigo']) || !isset($input['nombre']) || !isset($input['precio'])) {
            $respuesta['status_code_header'] = 'HTTP/1.1 400 Bad Request';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Datos incompletos. Se requieren: codigo, nombre, precio'
            ]);
            return $respuesta;
        }

        $descripcion = isset($input['descripcion']) ? $input['descripcion'] : '';
        $categoria = isset($input['categoria']) ? $input['categoria'] : '';
        $imagen = isset($input['imagen']) ? $input['imagen'] : '';

        $resultado = $this->productoDB->createProducto($input['codigo'], $input['nombre'], $input['precio'], $descripcion, $categoria, $imagen);
        if ($resultado) {
            $respuesta['status_code_header'] = 'HTTP/1.1 201 Created';
            $respuesta['body'] = json_encode([
                'success' => true,
                'message' => 'Producto creado correctamente'
            ]);
        } else {
            $respuesta['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Error al crear el producto'
            ]);
        }
        return $respuesta;
    }

    private function actualizarProducto($id)
    {
        $input = json_decode(file_get_contents("php://input"), true);

        if (!$input || !isset($input['codigo']) || !isset($input['nombre']) || !isset($input['precio'])) {
            $respuesta['status_code_header'] = 'HTTP/1.1 400 Bad Request';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Datos incompletos. Se requieren: codigo, nombre, precio'
            ]);
            return $respuesta;
        }

        $producto = $this->productoDB->getById($id);
        if (!$producto) {
            return $this->respuestaNoEncontrada();
        }

        $descripcion = isset($input['descripcion']) ? $input['descripcion'] : '';
        $categoria = isset($input['categoria']) ? $input['categoria'] : '';
        $imagen = isset($input['imagen']) ? $input['imagen'] : '';

        $resultado = $this->productoDB->updateProducto($id, $input['codigo'], $input['nombre'], $input['precio'], $descripcion, $categoria, $imagen);
        if ($resultado) {
            $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
            $respuesta['body'] = json_encode([
                'success' => true,
                'message' => 'Producto actualizado correctamente'
            ]);
        } else {
            $respuesta['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Error al actualizar el producto'
            ]);
        }
        return $respuesta;
    }

    private function deleteProducto($id)
    {
        $producto = $this->productoDB->getById($id);
        if (!$producto) {
            return $this->respuestaNoEncontrada();
        }

        $resultado = $this->productoDB->delete($id);
        if ($resultado) {
            $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
            $respuesta['body'] = json_encode([
                'success' => true,
                'message' => 'Producto eliminado correctamente'
            ]);
        } else {
            $respuesta['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Error al eliminar el producto. Puede estar incluido en pedidos existentes.'
            ]);
        }
        return $respuesta;
    }

    private function respuestaNoEncontrada()
    {
        $respuesta['status_code_header'] = 'HTTP/1.1 404 Not Found';
        $respuesta['body'] = json_encode([
            'success' => false,
            'error' => 'Producto no encontrado'
        ]);
        return $respuesta;
    }
}
