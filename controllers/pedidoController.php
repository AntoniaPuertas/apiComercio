<?php

class PedidoController {
    private $pedidoDB;
    private $detallePedidoDB;
    private $productoDB;
    private $requestMethod;
    private $pedidoId;
    private $accion;

    public function __construct($db, $requestMethod, $pedidoId = null, $accion = null)
    {
        $this->pedidoDB = new PedidoDB($db);
        $this->detallePedidoDB = new DetallePedidoDB($db);
        $this->productoDB = new ProductoDB($db);
        $this->requestMethod = $requestMethod;
        $this->pedidoId = $pedidoId;
        $this->accion = $accion;
    }

    public function processRequest(){
        $method = $this->requestMethod;

        // Manejar acciones especiales (detalles, estado)
        if($this->accion === 'detalles' && $this->pedidoId){
            return $this->processDetalles();
        }

        if($this->accion === 'estado' && $this->pedidoId && $method === 'PUT'){
            return $this->cambiarEstado($this->pedidoId);
        }

        switch($method){
            case 'GET':
                if($this->pedidoId){
                    $respuesta = $this->getPedido($this->pedidoId);
                }else{
                    $respuesta = $this->getAllPedidos();
                }
                break;
            case 'POST':
                $respuesta = $this->createPedido();
                break;
            case 'PUT':
                if($this->pedidoId){
                    $respuesta = $this->updatePedido($this->pedidoId);
                }else{
                    $respuesta = $this->respuestaNoEncontrada();
                }
                break;
            case 'DELETE':
                if($this->pedidoId){
                    $respuesta = $this->deletePedido($this->pedidoId);
                }else{
                    $respuesta = $this->respuestaNoEncontrada();
                }
                break;
            default:
                $respuesta = $this->respuestaNoEncontrada();
        }

        header($respuesta['status_code_header']);
        if($respuesta['body']){
            echo $respuesta['body'];
        }
    }

    private function processDetalles(){
        $method = $this->requestMethod;

        switch($method){
            case 'GET':
                $respuesta = $this->getDetallesPedido($this->pedidoId);
                break;
            case 'POST':
                $respuesta = $this->addDetalle($this->pedidoId);
                break;
            case 'DELETE':
                $respuesta = $this->removeDetalle($this->pedidoId);
                break;
            default:
                $respuesta = $this->respuestaNoEncontrada();
        }

        header($respuesta['status_code_header']);
        if($respuesta['body']){
            echo $respuesta['body'];
        }
    }

    private function getPedido($id){
        $pedido = $this->pedidoDB->getById($id);
        if(!$pedido){
            return $this->respuestaNoEncontrada();
        }

        // Incluir detalles del pedido
        $pedido['detalles'] = $this->detallePedidoDB->getByPedidoId($id);

        $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
        $respuesta['body'] = json_encode([
            'success' => true,
            'data' => $pedido
        ]);
        return $respuesta;
    }

    private function getAllPedidos(){
        $pedidos = $this->pedidoDB->getAll();

        $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
        $respuesta['body'] = json_encode([
            'success' => true,
            'data' => $pedidos,
            'count' => count($pedidos)
        ]);
        return $respuesta;
    }

    private function createPedido(){
        $input = json_decode(file_get_contents("php://input"), true);

        if(!$input || !isset($input['usuario_id']) || !isset($input['direccion_envio'])){
            $respuesta['status_code_header'] = 'HTTP/1.1 400 Bad Request';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Datos incompletos. Se requieren: usuario_id, direccion_envio'
            ]);
            return $respuesta;
        }

        $notas = isset($input['notas']) ? $input['notas'] : null;

        $pedidoId = $this->pedidoDB->create($input['usuario_id'], $input['direccion_envio'], $notas);

        if($pedidoId){
            // Si vienen productos, agregarlos al pedido
            if(isset($input['productos']) && is_array($input['productos'])){
                foreach($input['productos'] as $item){
                    if(isset($item['producto_id']) && isset($item['cantidad'])){
                        $producto = $this->productoDB->getById($item['producto_id']);
                        if($producto){
                            $precio = isset($item['precio_unitario']) ? $item['precio_unitario'] : $producto['precio'];
                            $this->detallePedidoDB->create($pedidoId, $item['producto_id'], $item['cantidad'], $precio);
                        }
                    }
                }
                // Recalcular total
                $this->pedidoDB->recalcularTotal($pedidoId);
            }

            $respuesta['status_code_header'] = 'HTTP/1.1 201 Created';
            $respuesta['body'] = json_encode([
                'success' => true,
                'message' => 'Pedido creado correctamente',
                'pedido_id' => $pedidoId
            ]);
        }else{
            $respuesta['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Error al crear el pedido'
            ]);
        }
        return $respuesta;
    }

    private function updatePedido($id){
        $input = json_decode(file_get_contents("php://input"), true);

        $pedido = $this->pedidoDB->getById($id);
        if(!$pedido){
            return $this->respuestaNoEncontrada();
        }

        $direccionEnvio = isset($input['direccion_envio']) ? $input['direccion_envio'] : $pedido['direccion_envio'];
        $notas = isset($input['notas']) ? $input['notas'] : $pedido['notas'];

        $resultado = $this->pedidoDB->update($id, $direccionEnvio, $notas);
        if($resultado){
            $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
            $respuesta['body'] = json_encode([
                'success' => true,
                'message' => 'Pedido actualizado correctamente'
            ]);
        }else{
            $respuesta['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Error al actualizar el pedido'
            ]);
        }
        return $respuesta;
    }

    private function cambiarEstado($id){
        $input = json_decode(file_get_contents("php://input"), true);

        if(!$input || !isset($input['estado'])){
            $respuesta['status_code_header'] = 'HTTP/1.1 400 Bad Request';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Se requiere el campo: estado'
            ]);
            return $respuesta;
        }

        $estadosValidos = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];
        if(!in_array($input['estado'], $estadosValidos)){
            $respuesta['status_code_header'] = 'HTTP/1.1 400 Bad Request';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Estado no valido. Estados permitidos: ' . implode(', ', $estadosValidos)
            ]);
            return $respuesta;
        }

        $pedido = $this->pedidoDB->getById($id);
        if(!$pedido){
            return $this->respuestaNoEncontrada();
        }

        $resultado = $this->pedidoDB->updateEstado($id, $input['estado']);
        if($resultado){
            $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
            $respuesta['body'] = json_encode([
                'success' => true,
                'message' => 'Estado actualizado correctamente'
            ]);
        }else{
            $respuesta['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Error al actualizar el estado'
            ]);
        }

        header($respuesta['status_code_header']);
        echo $respuesta['body'];
        exit();
    }

    private function deletePedido($id){
        $pedido = $this->pedidoDB->getById($id);
        if(!$pedido){
            return $this->respuestaNoEncontrada();
        }

        $resultado = $this->pedidoDB->delete($id);
        if($resultado){
            $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
            $respuesta['body'] = json_encode([
                'success' => true,
                'message' => 'Pedido eliminado correctamente'
            ]);
        }else{
            $respuesta['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Error al eliminar el pedido'
            ]);
        }
        return $respuesta;
    }

    private function getDetallesPedido($pedidoId){
        $pedido = $this->pedidoDB->getById($pedidoId);
        if(!$pedido){
            return $this->respuestaNoEncontrada();
        }

        $detalles = $this->detallePedidoDB->getByPedidoId($pedidoId);

        $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
        $respuesta['body'] = json_encode([
            'success' => true,
            'data' => $detalles,
            'count' => count($detalles)
        ]);
        return $respuesta;
    }

    private function addDetalle($pedidoId){
        $input = json_decode(file_get_contents("php://input"), true);

        if(!$input || !isset($input['producto_id']) || !isset($input['cantidad'])){
            $respuesta['status_code_header'] = 'HTTP/1.1 400 Bad Request';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Datos incompletos. Se requieren: producto_id, cantidad'
            ]);
            return $respuesta;
        }

        $pedido = $this->pedidoDB->getById($pedidoId);
        if(!$pedido){
            return $this->respuestaNoEncontrada();
        }

        $producto = $this->productoDB->getById($input['producto_id']);
        if(!$producto){
            $respuesta['status_code_header'] = 'HTTP/1.1 404 Not Found';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Producto no encontrado'
            ]);
            return $respuesta;
        }

        $precio = isset($input['precio_unitario']) ? $input['precio_unitario'] : $producto['precio'];

        $detalleId = $this->detallePedidoDB->create($pedidoId, $input['producto_id'], $input['cantidad'], $precio);

        if($detalleId){
            $this->pedidoDB->recalcularTotal($pedidoId);

            $respuesta['status_code_header'] = 'HTTP/1.1 201 Created';
            $respuesta['body'] = json_encode([
                'success' => true,
                'message' => 'Producto agregado al pedido',
                'detalle_id' => $detalleId
            ]);
        }else{
            $respuesta['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Error al agregar el producto'
            ]);
        }
        return $respuesta;
    }

    private function removeDetalle($pedidoId){
        $input = json_decode(file_get_contents("php://input"), true);

        if(!$input || !isset($input['detalle_id'])){
            $respuesta['status_code_header'] = 'HTTP/1.1 400 Bad Request';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Se requiere el campo: detalle_id'
            ]);
            return $respuesta;
        }

        $detalle = $this->detallePedidoDB->getById($input['detalle_id']);
        if(!$detalle || $detalle['pedido_id'] != $pedidoId){
            $respuesta['status_code_header'] = 'HTTP/1.1 404 Not Found';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Detalle no encontrado en este pedido'
            ]);
            return $respuesta;
        }

        $resultado = $this->detallePedidoDB->delete($input['detalle_id']);
        if($resultado){
            $this->pedidoDB->recalcularTotal($pedidoId);

            $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
            $respuesta['body'] = json_encode([
                'success' => true,
                'message' => 'Producto eliminado del pedido'
            ]);
        }else{
            $respuesta['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Error al eliminar el producto del pedido'
            ]);
        }
        return $respuesta;
    }

    private function respuestaNoEncontrada(){
        $respuesta['status_code_header'] = 'HTTP/1.1 404 Not Found';
        $respuesta['body'] = json_encode([
            'success' => false,
            'error' => 'Pedido no encontrado'
        ]);
        return $respuesta;
    }
}
