<?php

/**
 * PerfilController - Controlador para el perfil del usuario autenticado
 *
 * Permite al usuario ver y modificar sus propios datos.
 * NO permite modificar: rol, activo (solo admin puede)
 *
 * Endpoints:
 * - GET /api/perfil - Obtener mis datos
 * - PUT /api/perfil - Actualizar mis datos
 *
 * @author API Comercio
 * @version 1.0
 */

class PerfilController
{
    private $usuarioDB;
    private $requestMethod;
    private $usuarioActual;

    /**
     * Constructor
     *
     * @param Database $db Conexión a la base de datos
     * @param string $requestMethod Método HTTP
     * @param array $usuarioActual Datos del usuario autenticado (del middleware)
     */
    public function __construct($db, $requestMethod, $usuarioActual)
    {
        $this->usuarioDB = new UsuarioDB($db);
        $this->requestMethod = $requestMethod;
        $this->usuarioActual = $usuarioActual;
    }

    /**
     * Procesa la petición
     */
    public function processRequest()
    {
        switch ($this->requestMethod) {
            case 'GET':
                $respuesta = $this->getMiPerfil();
                break;

            case 'PUT':
                $respuesta = $this->updateMiPerfil();
                break;

            default:
                $respuesta = $this->metodoNoPermitido();
        }

        header($respuesta['status_code_header']);
        if ($respuesta['body']) {
            echo $respuesta['body'];
        }
    }

    /**
     * GET /api/perfil - Obtener datos del usuario autenticado
     */
    private function getMiPerfil()
    {
        $usuario = $this->usuarioDB->getById($this->usuarioActual['id']);

        if (!$usuario) {
            return [
                'status_code_header' => 'HTTP/1.1 404 Not Found',
                'body' => json_encode([
                    'success' => false,
                    'error' => 'Usuario no encontrado'
                ])
            ];
        }

        return [
            'status_code_header' => 'HTTP/1.1 200 OK',
            'body' => json_encode([
                'success' => true,
                'data' => $usuario
            ])
        ];
    }

    /**
     * PUT /api/perfil - Actualizar datos del usuario autenticado
     *
     * Campos permitidos: email, nombre, password
     * Campos NO permitidos: rol, activo
     */
    private function updateMiPerfil()
    {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            return [
                'status_code_header' => 'HTTP/1.1 400 Bad Request',
                'body' => json_encode([
                    'success' => false,
                    'error' => 'Datos de entrada inválidos'
                ])
            ];
        }

        // Obtener datos actuales del usuario
        $usuario = $this->usuarioDB->getById($this->usuarioActual['id']);

        if (!$usuario) {
            return [
                'status_code_header' => 'HTTP/1.1 404 Not Found',
                'body' => json_encode([
                    'success' => false,
                    'error' => 'Usuario no encontrado'
                ])
            ];
        }

        // Preparar datos a actualizar (solo los permitidos)
        $email = isset($input['email']) ? trim($input['email']) : $usuario['email'];
        $nombre = isset($input['nombre']) ? trim($input['nombre']) : $usuario['nombre'];

        // Validar email si se proporciona
        if (!empty($input['email']) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'status_code_header' => 'HTTP/1.1 400 Bad Request',
                'body' => json_encode([
                    'success' => false,
                    'error' => 'Formato de email inválido'
                ])
            ];
        }

        // Verificar si el nuevo email ya existe (si es diferente al actual)
        if ($email !== $usuario['email']) {
            $existente = $this->usuarioDB->getByEmail($email);
            if ($existente) {
                return [
                    'status_code_header' => 'HTTP/1.1 409 Conflict',
                    'body' => json_encode([
                        'success' => false,
                        'error' => 'El email ya está registrado por otro usuario'
                    ])
                ];
            }
        }

        // Validar nombre
        if (empty($nombre)) {
            return [
                'status_code_header' => 'HTTP/1.1 400 Bad Request',
                'body' => json_encode([
                    'success' => false,
                    'error' => 'El nombre no puede estar vacío'
                ])
            ];
        }

        // Actualizar datos básicos (manteniendo rol y activo)
        $resultado = $this->usuarioDB->update(
            $this->usuarioActual['id'],
            $email,
            $nombre,
            $usuario['rol'],    // Mantener el rol actual
            $usuario['activo']  // Mantener el estado actual
        );

        if (!$resultado) {
            return [
                'status_code_header' => 'HTTP/1.1 500 Internal Server Error',
                'body' => json_encode([
                    'success' => false,
                    'error' => 'Error al actualizar el perfil'
                ])
            ];
        }

        // Si se proporciona password, actualizarla
        if (!empty($input['password'])) {
            if (strlen($input['password']) < 6) {
                return [
                    'status_code_header' => 'HTTP/1.1 400 Bad Request',
                    'body' => json_encode([
                        'success' => false,
                        'error' => 'La contraseña debe tener al menos 6 caracteres'
                    ])
                ];
            }

            $this->usuarioDB->updatePassword($this->usuarioActual['id'], $input['password']);
        }

        // Obtener datos actualizados
        $usuarioActualizado = $this->usuarioDB->getById($this->usuarioActual['id']);

        return [
            'status_code_header' => 'HTTP/1.1 200 OK',
            'body' => json_encode([
                'success' => true,
                'message' => 'Perfil actualizado correctamente',
                'data' => $usuarioActualizado
            ])
        ];
    }

    /**
     * Respuesta para método no permitido
     */
    private function metodoNoPermitido()
    {
        return [
            'status_code_header' => 'HTTP/1.1 405 Method Not Allowed',
            'body' => json_encode([
                'success' => false,
                'error' => 'Método no permitido'
            ])
        ];
    }
}
