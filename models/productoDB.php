<?php

class ProductoDB {
    private $db;
    private $table = 'producto';

    public function __construct($database)
    {
        $this->db = $database->getConexion();
    }

    public function getAll(){
        $sql = "SELECT * FROM {$this->table}";

        $resultado = $this->db->query($sql);

        if($resultado && $resultado->num_rows > 0){
            $productos = [];

            while($row = $resultado->fetch_assoc()){
                $productos[] = $row;
            }

            return $productos;
        }else{
            return [];
        }
    }

    public function getById($id){
        $sql = "SELECT * FROM {$this->table} WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("i",$id);
            $stmt->execute();

            $resultado = $stmt->get_result();

            if($resultado->num_rows > 0){
                return $resultado->fetch_assoc();
            }
            $stmt->close();
        }
        return null;
    }

    public function createProducto($codigo, $nombre, $precio, $descripcion, $imagen){
        $sql = "INSERT INTO {$this->table} (codigo, nombre, precio, descripcion, imagen) VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("sssss", $codigo, $nombre, $precio, $descripcion, $imagen);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }

    public function updateProducto($id, $codigo, $nombre, $precio, $descripcion, $imagen){
        $sql = "UPDATE {$this->table} SET codigo = ?, nombre = ?, precio = ?, descripcion = ?, imagen = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("sssssi", $codigo, $nombre, $precio, $descripcion, $imagen, $id);
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
            $stmt->bind_param("i",$id);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }
}