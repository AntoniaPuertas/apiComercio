<?php

/**
 * AuthMiddleware - Middleware de autenticación y autorización
 *
 * Valida tokens JWT y controla el acceso por roles.
 *
 * Uso:
 *   require_once 'lib/AuthMiddleware.php';
 *   $usuario = AuthMiddleware::verificar(['admin']); // Solo admin
 *   $usuario = AuthMiddleware::verificar(['admin', 'usuario']); // Admin o usuario
 *   $usuario = AuthMiddleware::verificar(); // Cualquier usuario autenticado
 *
 * @author API Comercio
 * @version 1.0
 */

require_once __DIR__ . '/JWT.php';

class AuthMiddleware
{
    /**
     * Verifica la autenticación y autorización del usuario
     *
     * @param array $rolesPermitidos Roles que tienen acceso (vacío = cualquier rol)
     * @return array Datos del usuario si está autorizado
     *
     * Si no está autorizado, termina la ejecución con HTTP 401 o 403
     */
    public static function verificar($rolesPermitidos = [])
    {
        // 1. Obtener el token del header
        $token = self::obtenerToken();

        if (!$token) {
            self::respuestaNoAutorizado('Token de autenticación requerido');
        }

        // 2. Validar y decodificar el token
        $jwt = new JWT();
        $payload = $jwt->decode($token);

        if (!$payload) {
            self::respuestaNoAutorizado('Token inválido o expirado');
        }

        // 3. Verificar que el payload tenga los campos necesarios
        if (!isset($payload['sub']) || !isset($payload['rol'])) {
            self::respuestaNoAutorizado('Token malformado');
        }

        // 4. Verificar el rol si se especificaron roles permitidos
        if (!empty($rolesPermitidos)) {
            if (!in_array($payload['rol'], $rolesPermitidos)) {
                self::respuestaProhibido('No tienes permisos para acceder a este recurso');
            }
        }

        // 5. Retornar datos del usuario
        return [
            'id' => $payload['sub'],
            'email' => $payload['email'] ?? null,
            'nombre' => $payload['nombre'] ?? null,
            'rol' => $payload['rol']
        ];
    }

    /**
     * Verifica si hay un token válido sin terminar la ejecución
     *
     * Útil cuando quieres comportamiento diferente para usuarios
     * autenticados vs no autenticados (ej: listar productos públicos
     * pero mostrar precios especiales a usuarios logueados)
     *
     * @return array|null Datos del usuario si está autenticado, null si no
     */
    public static function verificarOpcional()
    {
        $token = self::obtenerToken();

        if (!$token) {
            return null;
        }

        $jwt = new JWT();
        $payload = $jwt->decode($token);

        if (!$payload) {
            return null;
        }

        return [
            'id' => $payload['sub'],
            'email' => $payload['email'] ?? null,
            'nombre' => $payload['nombre'] ?? null,
            'rol' => $payload['rol']
        ];
    }

    /**
     * Verifica solo que el usuario sea admin
     *
     * Atajo para AuthMiddleware::verificar(['admin'])
     *
     * @return array Datos del usuario si es admin
     */
    public static function soloAdmin()
    {
        return self::verificar(['admin']);
    }

    /**
     * Verifica que el usuario sea admin O sea el dueño del recurso
     *
     * Útil para endpoints como "ver mi perfil" o "ver mis pedidos"
     * donde el admin puede ver todo pero un usuario solo lo suyo
     *
     * @param int $idRecurso ID del usuario dueño del recurso
     * @return array Datos del usuario autenticado
     */
    public static function adminOPropietario($idRecurso)
    {
        $usuario = self::verificar(); // Cualquier usuario autenticado

        // Admin puede acceder a todo
        if ($usuario['rol'] === 'admin') {
            return $usuario;
        }

        // Usuario normal solo puede acceder a sus propios recursos
        if ($usuario['id'] != $idRecurso) {
            self::respuestaProhibido('Solo puedes acceder a tus propios recursos');
        }

        return $usuario;
    }

    /**
     * Obtiene el token del header Authorization
     *
     * Formato esperado: Authorization: Bearer <token>
     *
     * @return string|null Token si existe, null si no
     */
    private static function obtenerToken()
    {
        $headers = self::getAuthorizationHeader();

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
     * Obtiene el header Authorization de forma compatible
     *
     * @return string|null Header Authorization si existe
     */
    private static function getAuthorizationHeader()
    {
        // Método 1: getallheaders()
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                return $headers['Authorization'];
            }
            if (isset($headers['authorization'])) {
                return $headers['authorization'];
            }
        }

        // Método 2: $_SERVER
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
     * Envía respuesta 401 Unauthorized y termina ejecución
     *
     * @param string $mensaje Mensaje de error
     */
    private static function respuestaNoAutorizado($mensaje)
    {
        http_response_code(401);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => false,
            'error' => $mensaje,
            'code' => 'UNAUTHORIZED'
        ]);
        exit();
    }

    /**
     * Envía respuesta 403 Forbidden y termina ejecución
     *
     * @param string $mensaje Mensaje de error
     */
    private static function respuestaProhibido($mensaje)
    {
        http_response_code(403);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => false,
            'error' => $mensaje,
            'code' => 'FORBIDDEN'
        ]);
        exit();
    }
}
