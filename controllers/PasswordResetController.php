<?php

class PasswordResetController
{
    private $usuarioDB;
    private $passwordResetDB;
    private $requestMethod;
    private $action;

    public function __construct($database, $requestMethod, $action)
    {
        $this->usuarioDB = new UsuarioDB($database);
        $this->passwordResetDB = new PasswordResetDB($database);
        $this->requestMethod = $requestMethod;
        $this->action = $action;
    }

    public function processRequest()
    {
        if ($this->requestMethod !== 'POST') {
            $respuesta = $this->respuestaError('HTTP/1.1 405 Method Not Allowed', 'Metodo no permitido');
            header($respuesta['status_code_header']);
            echo $respuesta['body'];
            return;
        }

        if ($this->action === 'forgot') {
            $respuesta = $this->forgotPassword();
        } elseif ($this->action === 'reset') {
            $respuesta = $this->resetPassword();
        } else {
            $respuesta = $this->respuestaError('HTTP/1.1 404 Not Found', 'Accion no encontrada');
        }

        header($respuesta['status_code_header']);
        echo $respuesta['body'];
    }

    private function forgotPassword()
    {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['email']) || empty(trim($input['email']))) {
            return $this->respuestaError('HTTP/1.1 400 Bad Request', 'Email es requerido');
        }

        $email = trim($input['email']);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->respuestaError('HTTP/1.1 400 Bad Request', 'Formato de email invalido');
        }

        $usuario = $this->usuarioDB->getByEmail($email);

        // Siempre responder con exito por seguridad (no revelar si el email existe)
        $respuestaGenerica = [
            'status_code_header' => 'HTTP/1.1 200 OK',
            'body' => json_encode([
                'success' => true,
                'message' => 'Si el email existe, recibiras instrucciones para restablecer tu contrasena'
            ])
        ];

        if (!$usuario) {
            return $respuestaGenerica;
        }

        // Invalidar tokens previos del usuario
        $this->passwordResetDB->deleteByUsuarioId($usuario['id']);

        // Generar token de 64 caracteres
        $token = bin2hex(random_bytes(32));

        $resultado = $this->passwordResetDB->create($usuario['id'], $token);

        if (!$resultado) {
            return $this->respuestaError('HTTP/1.1 500 Internal Server Error', 'Error al procesar la solicitud');
        }

        // En modo desarrollo, mostrar el token en la respuesta
        if (defined('DEV_MODE') && DEV_MODE) {
            $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
            $respuesta['body'] = json_encode([
                'success' => true,
                'message' => 'Token de recuperacion generado (modo desarrollo)',
                'data' => [
                    'token' => $token,
                    'expira_en' => '1 hora',
                    'nota_dev' => 'Este token solo se muestra en modo desarrollo'
                ]
            ]);
            return $respuesta;
        }

        return $respuestaGenerica;
    }

    private function resetPassword()
    {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['token']) || !isset($input['new_password'])) {
            return $this->respuestaError('HTTP/1.1 400 Bad Request', 'Token y nueva contrasena son requeridos');
        }

        $token = trim($input['token']);
        $newPassword = $input['new_password'];

        if (strlen($newPassword) < 6) {
            return $this->respuestaError('HTTP/1.1 400 Bad Request', 'La contrasena debe tener al menos 6 caracteres');
        }

        // Buscar token valido
        $resetRecord = $this->passwordResetDB->getByToken($token);

        if (!$resetRecord) {
            return $this->respuestaError('HTTP/1.1 400 Bad Request', 'Token invalido o expirado');
        }

        // Actualizar contrasena
        $resultado = $this->usuarioDB->updatePassword($resetRecord['usuario_id'], $newPassword);

        if (!$resultado) {
            return $this->respuestaError('HTTP/1.1 500 Internal Server Error', 'Error al actualizar la contrasena');
        }

        // Marcar token como usado
        $this->passwordResetDB->markAsUsed($resetRecord['id']);

        $respuesta['status_code_header'] = 'HTTP/1.1 200 OK';
        $respuesta['body'] = json_encode([
            'success' => true,
            'message' => 'Contrasena actualizada correctamente'
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
