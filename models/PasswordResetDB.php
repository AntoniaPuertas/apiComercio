<?php

class PasswordResetDB
{
    private $db;
    private $table = 'password_reset';

    public function __construct($database)
    {
        $this->db = $database->getConexion();
    }

    public function create($usuarioId, $token)
    {
        $sql = "INSERT INTO {$this->table} (usuario_id, token, expira_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))";
        $stmt = $this->db->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("is", $usuarioId, $token);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }

    public function getByToken($token)
    {
        $sql = "SELECT * FROM {$this->table} WHERE token = ? AND usado = 0 AND expira_at > NOW()";
        $stmt = $this->db->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("s", $token);
            $stmt->execute();
            $resultado = $stmt->get_result();
            if ($resultado->num_rows > 0) {
                return $resultado->fetch_assoc();
            }
            $stmt->close();
        }
        return null;
    }

    public function markAsUsed($id)
    {
        $sql = "UPDATE {$this->table} SET usado = 1 WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("i", $id);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }

    public function deleteByUsuarioId($usuarioId)
    {
        $sql = "DELETE FROM {$this->table} WHERE usuario_id = ?";
        $stmt = $this->db->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("i", $usuarioId);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }
}
