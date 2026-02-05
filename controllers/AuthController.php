<?php

/**
 * AuthController - Controlador de autenticación
 *
 * Maneja el endpoint de login y genera tokens JWT.
 *
 * Endpoints:
 * - POST /api/auth/login - Autenticar usuario y obtener token
 *
 * @author API Comercio
 * @version 1.0
 */

require_once __DIR__ . '/../lib/JWT.php';

class AuthController
{
    /**
     * Modelo de usuarios para verificar credenciales
     * @var UsuarioDB
     */
    private $usuarioDB;

    /**
     * Método HTTP de la petición
     * @var string
     */
    private $requestMethod;

    /**
     * Acción solicitada (login, logout, etc.)
     * @var string|null
     */
    private $action;

    /**
     * Instancia de JWT para generar tokens
     * @var JWT
     */
    private $jwt;

    /**
     * Constructor
     *
     * @param Database $database Conexión a la base de datos
     * @param string $requestMethod Método HTTP (GET, POST, etc.)
     * @param string|null $action Acción a realizar
     */
    public function __construct($database, $requestMethod, $action = null)
    {
        $this->usuarioDB = new UsuarioDB($database);
        $this->requestMethod = $requestMethod;
        $this->action = $action;
        $this->jwt = new JWT();
    }

    /**
     * Procesa la petición según el método y acción
     */
    public function processRequest()
    {
        $respuesta = null;

        switch ($this->action) {
            case 'login':
                if ($this->requestMethod === 'POST') {
                    $respuesta = $this->login();
                } else {
                    $respuesta = $this->metodoNoPermitido();
                }
                break;

            case 'verify':
                // Endpoint para verificar si un token es válido
                if ($this->requestMethod === 'GET' || $this->requestMethod === 'POST') {
                    $respuesta = $this->verificarToken();
                } else {
                    $respuesta = $this->metodoNoPermitido();
                }
                break;

            default:
                $respuesta = $this->accionNoEncontrada();
                break;
        }

        // Enviar respuesta
        header($respuesta['status_code_header']);
        if ($respuesta['body']) {
            echo $respuesta['body'];
        }
    }

    /**
     * Procesa el login de un usuario
     *
     * Flujo:
     * 1. Obtener y validar datos del body (email, password)
     * 2. Verificar credenciales contra la BD
     * 3. Verificar que el usuario esté activo
     * 4. Generar token JWT
     * 5. Retornar token y datos del usuario
     *
     * @return array Respuesta con status_code_header y body
     */
    private function login()
    {
        // 1. Obtener datos del body JSON
        $input = json_decode(file_get_contents('php://input'), true);

        // Validar que se recibieron datos
        if (!$input) {
            return $this->respuestaError(
                'HTTP/1.1 400 Bad Request',
                'Datos de entrada inválidos. Se espera JSON con email y password.'
            );
        }

        $email = isset($input['email']) ? trim($input['email']) : '';
        $password = isset($input['password']) ? $input['password'] : '';

        // 2. Validar campos requeridos
        if (empty($email) || empty($password)) {
            return $this->respuestaError(
                'HTTP/1.1 400 Bad Request',
                'Email y password son requeridos'
            );
        }

        // Validar formato de email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->respuestaError(
                'HTTP/1.1 400 Bad Request',
                'Formato de email inválido'
            );
        }

        // 3. Verificar credenciales contra la BD
        $usuario = $this->usuarioDB->verificarCredenciales($email, $password);

        if (!$usuario) {
            // Credenciales inválidas - no especificar si es email o password por seguridad
            return $this->respuestaError(
                'HTTP/1.1 401 Unauthorized',
                'Credenciales inválidas'
            );
        }

        // 4. Verificar que el usuario esté activo
        if (isset($usuario['activo']) && !$usuario['activo']) {
            return $this->respuestaError(
                'HTTP/1.1 401 Unauthorized',
                'Usuario inactivo. Contacte al administrador.'
            );
        }

        // 5. Generar token JWT
        $payload = [
            'sub' => $usuario['id'],        // Subject (ID del usuario)
            'email' => $usuario['email'],
            'nombre' => $usuario['nombre'],
            'rol' => $usuario['rol']
        ];

        $token = $this->jwt->encode($payload);

        // 6. Preparar datos del usuario para la respuesta (sin información sensible)
        $usuarioRespuesta = [
            'id' => $usuario['id'],
            'email' => $usuario['email'],
            'nombre' => $usuario['nombre'],
            'rol' => $usuario['rol']
        ];

        // 7. Retornar respuesta exitosa
        $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
        $respuesta['body'] = json_encode([
            'success' => true,
            'message' => 'Login exitoso',
            'data' => [
                'token' => $token,
                'expira_en' => JWT_EXPIRATION,
                'usuario' => $usuarioRespuesta
            ]
        ]);

        return $respuesta;
    }

    /**
     * Verifica si un token es válido
     *
     * Útil para que el frontend verifique si la sesión sigue activa
     *
     * @return array Respuesta con status_code_header y body
     */
    private function verificarToken()
    {
        // Obtener token del header Authorization
        $token = $this->obtenerTokenDelHeader();

        if (!$token) {
            return $this->respuestaError(
                'HTTP/1.1 401 Unauthorized',
                'Token no proporcionado'
            );
        }

        // Intentar decodificar el token
        $payload = $this->jwt->decode($token);

        if (!$payload) {
            return $this->respuestaError(
                'HTTP/1.1 401 Unauthorized',
                'Token inválido o expirado'
            );
        }

        // Token válido - retornar información
        $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
        $respuesta['body'] = json_encode([
            'success' => true,
            'message' => 'Token válido',
            'data' => [
                'usuario' => [
                    'id' => $payload['sub'],
                    'email' => $payload['email'],
                    'nombre' => $payload['nombre'],
                    'rol' => $payload['rol']
                ],
                'expira_en' => $this->jwt->getTimeToExpiration($token)
            ]
        ]);

        return $respuesta;
    }

    /**
     * Obtiene el token del header Authorization
     *
     * Formato esperado: Authorization: Bearer <token>
     *
     * @return string|null Token si existe, null si no
     */
    private function obtenerTokenDelHeader()
    {
        $headers = $this->getAuthorizationHeader();

        if (!$headers) {
            return null;
        }

        // Verificar formato "Bearer <token>"
        if (preg_match('/Bearer\s+(.*)$/i', $headers, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }

    /**
     * Obtiene el header Authorization de forma compatible con diferentes servidores
     *
     * @return string|null Header Authorization si existe
     */
    private function getAuthorizationHeader()
    {
        // Método 1: getallheaders() - funciona en la mayoría de casos
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            // Los headers pueden venir en diferentes casos
            if (isset($headers['Authorization'])) {
                return $headers['Authorization'];
            }
            if (isset($headers['authorization'])) {
                return $headers['authorization'];
            }
        }

        // Método 2: $_SERVER - alternativa para algunos servidores
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            return $_SERVER['HTTP_AUTHORIZATION'];
        }

        // Método 3: Apache específico
        if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        return null;
    }

    /**
     * Genera respuesta de error
     *
     * @param string $statusCode Header HTTP de estado
     * @param string $mensaje Mensaje de error
     * @return array Respuesta formateada
     */
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

    /**
     * Respuesta para método HTTP no permitido
     *
     * @return array Respuesta 405
     */
    private function metodoNoPermitido()
    {
        return $this->respuestaError(
            'HTTP/1.1 405 Method Not Allowed',
            'Método no permitido'
        );
    }

    /**
     * Respuesta para acción no encontrada
     *
     * @return array Respuesta 404
     */
    private function accionNoEncontrada()
    {
        return [
            'status_code_header' => 'HTTP/1.1 404 Not Found',
            'body' => json_encode([
                'success' => false,
                'error' => 'Acción no encontrada',
                'acciones_disponibles' => [
                    'POST /api/auth/login' => 'Autenticar usuario',
                    'GET /api/auth/verify' => 'Verificar token'
                ]
            ])
        ];
    }
}
