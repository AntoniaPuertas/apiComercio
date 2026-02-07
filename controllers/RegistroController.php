<?php

require_once __DIR__ . '/../lib/JWT.php';

class RegistroController
{
    private $usuarioDB;
    private $requestMethod;
    private $jwt;

    public function __construct($database, $requestMethod)
    {
        $this->usuarioDB = new UsuarioDB($database);
        $this->requestMethod = $requestMethod;
        $this->jwt = new JWT();
    }

    public function processRequest()
    {
        if ($this->requestMethod !== 'POST') {
            $respuesta['status_code_header'] = 'HTTP/1.1 405 Method Not Allowed';
            $respuesta['body'] = json_encode([
                'success' => false,
                'error' => 'Metodo no permitido'
            ]);
            header($respuesta['status_code_header']);
            echo $respuesta['body'];
            return;
        }

        $respuesta = $this->registrar();
        header($respuesta['status_code_header']);
        echo $respuesta['body'];
    }

    private function registrar()
    {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            return $this->respuestaError(
                'HTTP/1.1 400 Bad Request',
                'Datos de entrada invalidos. Se espera JSON con email, nombre y password.'
            );
        }

        $email = isset($input['email']) ? trim($input['email']) : '';
        $nombre = isset($input['nombre']) ? trim($input['nombre']) : '';
        $password = isset($input['password']) ? $input['password'] : '';

        // Validar campos requeridos
        if (empty($email) || empty($nombre) || empty($password)) {
            return $this->respuestaError(
                'HTTP/1.1 400 Bad Request',
                'Email, nombre y password son requeridos'
            );
        }

        // Validar formato de email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->respuestaError(
                'HTTP/1.1 400 Bad Request',
                'Formato de email invalido'
            );
        }

        // Validar longitud de password
        if (strlen($password) < 6) {
            return $this->respuestaError(
                'HTTP/1.1 400 Bad Request',
                'La contrasena debe tener al menos 6 caracteres'
            );
        }

        // Verificar que el email no exista
        $existente = $this->usuarioDB->getByEmail($email);
        if ($existente) {
            return $this->respuestaError(
                'HTTP/1.1 409 Conflict',
                'Ya existe un usuario con ese email'
            );
        }

        // Crear usuario con rol 'usuario'
        $resultado = $this->usuarioDB->create($email, $password, $nombre, 'usuario');

        if (!$resultado) {
            return $this->respuestaError(
                'HTTP/1.1 500 Internal Server Error',
                'Error al crear el usuario'
            );
        }

        // Obtener el usuario recien creado para auto-login
        $usuario = $this->usuarioDB->getByEmail($email);

        // Generar token JWT
        $payload = [
            'sub' => $usuario['id'],
            'email' => $usuario['email'],
            'nombre' => $usuario['nombre'],
            'rol' => $usuario['rol']
        ];

        $token = $this->jwt->encode($payload);

        $respuesta['status_code_header'] = 'HTTP/1.1 201 Created';
        $respuesta['body'] = json_encode([
            'success' => true,
            'message' => 'Registro exitoso',
            'data' => [
                'token' => $token,
                'expira_en' => JWT_EXPIRATION,
                'usuario' => [
                    'id' => $usuario['id'],
                    'email' => $usuario['email'],
                    'nombre' => $usuario['nombre'],
                    'rol' => $usuario['rol']
                ]
            ]
        ]);

        return $respuesta;
    }

    private function respuestaError($statusCode, $mensaje)
    {
        return [
            'status_code_header' => $statusCode,
            'body' => json_encode([
                'success' => false,
                'error' => $mensaje
            ])
        ];
    }
}
