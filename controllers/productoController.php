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
                'message' => 'Producto creado correctamente',
                'data' => ['id' => $resultado]
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
        $imagen = isset($input['imagen']) ? $input['imagen'] : $producto['imagen'];

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
            // Eliminar archivo de imagen si es local
            if (!empty($producto['imagen']) && strpos($producto['imagen'], 'uploads/') === 0) {
                $rutaArchivo = __DIR__ . '/../' . $producto['imagen'];
                if (file_exists($rutaArchivo)) {
                    unlink($rutaArchivo);
                }
            }

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

    public function uploadImagen($id)
    {
        // Capturar cualquier warning/notice de PHP para que no rompa el JSON
        ob_start();

        try {
            $producto = $this->productoDB->getById($id);
            if (!$producto) {
                ob_end_clean();
                header('HTTP/1.1 404 Not Found');
                echo json_encode(['success' => false, 'error' => 'Producto no encontrado']);
                exit();
            }

            if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
                $errores = [
                    UPLOAD_ERR_INI_SIZE => 'El archivo excede el tamaño maximo del servidor',
                    UPLOAD_ERR_FORM_SIZE => 'El archivo excede el tamaño maximo del formulario',
                    UPLOAD_ERR_PARTIAL => 'El archivo se subio parcialmente',
                    UPLOAD_ERR_NO_FILE => 'No se envio ningun archivo',
                ];
                $codigoError = isset($_FILES['imagen']) ? $_FILES['imagen']['error'] : UPLOAD_ERR_NO_FILE;
                $mensaje = isset($errores[$codigoError]) ? $errores[$codigoError] : 'Error al subir el archivo';

                ob_end_clean();
                header('HTTP/1.1 400 Bad Request');
                echo json_encode(['success' => false, 'error' => $mensaje]);
                exit();
            }

            $archivo = $_FILES['imagen'];
            $maxSize = 2 * 1024 * 1024; // 2 MB

            // Validar tamaño
            if ($archivo['size'] > $maxSize) {
                ob_end_clean();
                header('HTTP/1.1 400 Bad Request');
                echo json_encode(['success' => false, 'error' => 'La imagen no puede superar 2 MB']);
                exit();
            }

            // Validar tipo MIME real
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->file($archivo['tmp_name']);
            $tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

            if (!in_array($mimeType, $tiposPermitidos)) {
                ob_end_clean();
                header('HTTP/1.1 400 Bad Request');
                echo json_encode(['success' => false, 'error' => 'Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF']);
                exit();
            }

            // Procesar imagen con GD
            $dirUploads = __DIR__ . '/../uploads/productos/';
            $nombreArchivo = 'prod_' . $id . '_' . time() . '.jpg';
            $rutaDestino = $dirUploads . $nombreArchivo;

            switch ($mimeType) {
                case 'image/jpeg':
                    $imgOrigen = @imagecreatefromjpeg($archivo['tmp_name']);
                    break;
                case 'image/png':
                    $imgOrigen = @imagecreatefrompng($archivo['tmp_name']);
                    break;
                case 'image/webp':
                    $imgOrigen = @imagecreatefromwebp($archivo['tmp_name']);
                    break;
                case 'image/gif':
                    $imgOrigen = @imagecreatefromgif($archivo['tmp_name']);
                    break;
                default:
                    $imgOrigen = false;
            }

            if (!$imgOrigen) {
                ob_end_clean();
                header('HTTP/1.1 500 Internal Server Error');
                echo json_encode(['success' => false, 'error' => 'Error al procesar la imagen. El archivo puede estar corrupto.']);
                exit();
            }

            // Redimensionar si ancho > 800px
            $anchoOriginal = imagesx($imgOrigen);
            $altoOriginal = imagesy($imgOrigen);
            $anchoMax = 800;

            if ($anchoOriginal > $anchoMax) {
                $ratio = $anchoMax / $anchoOriginal;
                $nuevoAncho = $anchoMax;
                $nuevoAlto = (int)($altoOriginal * $ratio);

                $imgRedimensionada = imagecreatetruecolor($nuevoAncho, $nuevoAlto);
                imagecopyresampled($imgRedimensionada, $imgOrigen, 0, 0, 0, 0, $nuevoAncho, $nuevoAlto, $anchoOriginal, $altoOriginal);
                imagedestroy($imgOrigen);
                $imgOrigen = $imgRedimensionada;
            }

            // Guardar como JPEG con calidad 85%
            if (!@imagejpeg($imgOrigen, $rutaDestino, 85)) {
                imagedestroy($imgOrigen);
                ob_end_clean();
                header('HTTP/1.1 500 Internal Server Error');
                echo json_encode(['success' => false, 'error' => 'Error al guardar la imagen en disco']);
                exit();
            }
            imagedestroy($imgOrigen);

            // Eliminar imagen anterior si es local
            if (!empty($producto['imagen']) && strpos($producto['imagen'], 'uploads/') === 0) {
                $rutaAnterior = __DIR__ . '/../' . $producto['imagen'];
                if (file_exists($rutaAnterior)) {
                    @unlink($rutaAnterior);
                }
            }

            // Guardar ruta en BD
            $rutaRelativa = 'uploads/productos/' . $nombreArchivo;
            $dbResult = $this->productoDB->updateImagen($id, $rutaRelativa);

            if (!$dbResult) {
                ob_end_clean();
                header('HTTP/1.1 500 Internal Server Error');
                echo json_encode([
                    'success' => false,
                    'error' => 'Imagen guardada en disco pero error al actualizar la base de datos'
                ]);
                exit();
            }

            ob_end_clean();
            header('HTTP/1.1 200 OK');
            echo json_encode([
                'success' => true,
                'message' => 'Imagen subida correctamente',
                'data' => ['imagen' => $rutaRelativa]
            ]);
            exit();

        } catch (\Exception $e) {
            ob_end_clean();
            header('HTTP/1.1 500 Internal Server Error');
            echo json_encode([
                'success' => false,
                'error' => 'Error interno al procesar imagen: ' . $e->getMessage()
            ]);
            exit();
        }
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
