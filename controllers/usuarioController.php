<?php

class UsuarioController {
    private $usuarioDB;
    private $requestMethod;
    private $usuarioId;

    public function __construct($db, $requestMethod, $usuarioId = null)
    {
        $this->usuarioDB = new UsuarioDB($db);
        $this->requestMethod = $requestMethod;
        $this->usuarioId = $usuarioId;
    }

    public function processRequest(){
        $method = $this->requestMethod;

        switch($method){
            case 'GET':
                if($this->usuarioId){
                    $respuesta = $this->getUsuario($this->usuarioId);
                }else{
                    $respuesta = $this->getAllUsuarios();
                }
                break;
            case 'POST':
                $respuesta = $this->createUsuario();
                break;
            case 'PUT':
                if($this->usuarioId){
                    $respuesta = $this->updateUsuario($this->usuarioId);
                }else{
                    $respuesta = $this->respuestaNoEncontrada();
                }
                break;
            case 'DELETE':
                if($this->usuarioId){
                    $respuesta = $this->deleteUsuario($this->usuarioId);
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

    private function getUsuario($id){
        $usuario = $this->usuarioDB->getById($id);
        if(!$usuario){
            return $this->respuestaNoEncontrada();
        }
        $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
        $respuesta['body'] = json_encode([
            'success' => true,
            'data' => $usuario
        ]);
        return $respuesta;
    }

    private function getAllUsuarios(){
        $usuarios = $this->usuarioDB->getAll();

        $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
        $respuesta['body'] = json_encode([
            'success' => true,
            'data' => $usuarios,
            'count' => count($usuarios)
        ]);
        return $respuesta;
    }

    private function createUsuario(){
        $input = json_decode(file_get_contents("php://input"), true);

        if(!$input || !isset($input['email']) || !isset($input['password']) || !isset($input['nombre'])){
            $respuesta['status_code_header'] = 'HTTP/1.1 400 Bad Request';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Datos incompletos. Se requieren: email, password, nombre'
            ]);
            return $respuesta;
        }

        // Verificar si el email ya existe
        $existente = $this->usuarioDB->getByEmail($input['email']);
        if($existente){
            $respuesta['status_code_header'] = 'HTTP/1.1 409 Conflict';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'El email ya esta registrado'
            ]);
            return $respuesta;
        }

        $rol = isset($input['rol']) ? $input['rol'] : 'usuario';

        $resultado = $this->usuarioDB->create($input['email'], $input['password'], $input['nombre'], $rol);
        if($resultado){
            $respuesta['status_code_header'] = 'HTTP/1.1 201 Created';
            $respuesta['body'] = json_encode([
                'success' => true,
                'message' => 'Usuario creado correctamente'
            ]);
        }else{
            $respuesta['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Error al crear el usuario'
            ]);
        }
        return $respuesta;
    }

    private function updateUsuario($id){
        $input = json_decode(file_get_contents("php://input"), true);

        if(!$input || !isset($input['email']) || !isset($input['nombre']) || !isset($input['rol'])){
            $respuesta['status_code_header'] = 'HTTP/1.1 400 Bad Request';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Datos incompletos. Se requieren: email, nombre, rol'
            ]);
            return $respuesta;
        }

        $usuario = $this->usuarioDB->getById($id);
        if(!$usuario){
            return $this->respuestaNoEncontrada();
        }

        $activo = isset($input['activo']) ? (int)$input['activo'] : 1;

        $resultado = $this->usuarioDB->update($id, $input['email'], $input['nombre'], $input['rol'], $activo);
        if($resultado){
            $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
            $respuesta['body'] = json_encode([
                'success' => true,
                'message' => 'Usuario actualizado correctamente'
            ]);
        }else{
            $respuesta['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Error al actualizar el usuario'
            ]);
        }
        return $respuesta;
    }

    private function deleteUsuario($id){
        $usuario = $this->usuarioDB->getById($id);
        if(!$usuario){
            return $this->respuestaNoEncontrada();
        }

        $resultado = $this->usuarioDB->delete($id);
        if($resultado){
            $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
            $respuesta['body'] = json_encode([
                'success' => true,
                'message' => 'Usuario eliminado correctamente'
            ]);
        }else{
            $respuesta['status_code_header'] = 'HTTP/1.1 500 Internal Server Error';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Error al eliminar el usuario. Puede tener pedidos asociados.'
            ]);
        }
        return $respuesta;
    }

    private function respuestaNoEncontrada(){
        $respuesta['status_code_header'] = 'HTTP/1.1 404 Not Found';
        $respuesta['body'] = json_encode([
            'success' => false,
            'error' => 'Usuario no encontrado'
        ]);
        return $respuesta;
    }
}
