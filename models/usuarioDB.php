<?php

class UsuarioDB {
    private $db;
    private $table = 'usuario';

    public function __construct($database)
    {
        $this->db = $database->getConexion();
    }

    public function getAll(){
        $sql = "SELECT id, email, nombre, rol, activo, created_at, updated_at FROM {$this->table}";

        $resultado = $this->db->query($sql);

        if($resultado && $resultado->num_rows > 0){
            $usuarios = [];

            while($row = $resultado->fetch_assoc()){
                $usuarios[] = $row;
            }

            return $usuarios;
        }else{
            return [];
        }
    }

    public function getById($id){
        $sql = "SELECT id, email, nombre, rol, activo, created_at, updated_at FROM {$this->table} WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("i", $id);
            $stmt->execute();

            $resultado = $stmt->get_result();

            if($resultado->num_rows > 0){
                return $resultado->fetch_assoc();
            }
            $stmt->close();
        }
        return null;
    }

    public function getByEmail($email){
        $sql = "SELECT * FROM {$this->table} WHERE email = ?";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("s", $email);
            $stmt->execute();

            $resultado = $stmt->get_result();

            if($resultado->num_rows > 0){
                return $resultado->fetch_assoc();
            }
            $stmt->close();
        }
        return null;
    }

    public function create($email, $password, $nombre, $rol = 'usuario'){
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $sql = "INSERT INTO {$this->table} (email, password, nombre, rol) VALUES (?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("ssss", $email, $passwordHash, $nombre, $rol);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }

    public function update($id, $email, $nombre, $rol, $activo){
        $sql = "UPDATE {$this->table} SET email = ?, nombre = ?, rol = ?, activo = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("sssii", $email, $nombre, $rol, $activo, $id);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }

    public function updatePassword($id, $password){
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $sql = "UPDATE {$this->table} SET password = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("si", $passwordHash, $id);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }

    public function delete($id){
        $sql = "DELETE FROM {$this->table} WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("i", $id);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }

    public function verificarCredenciales($email, $password){
        $usuario = $this->getByEmail($email);
        if($usuario && password_verify($password, $usuario['password'])){
            unset($usuario['password']);
            return $usuario;
        }
        return null;
    }
}
