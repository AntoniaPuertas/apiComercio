<?php

class PedidoDB {
    private $db;
    private $table = 'pedido';

    public function __construct($database)
    {
        $this->db = $database->getConexion();
    }

    public function getAll(){
        $sql = "SELECT p.*, u.nombre as cliente_nombre, u.email as cliente_email
                FROM {$this->table} p
                JOIN usuario u ON p.usuario_id = u.id
                ORDER BY p.created_at DESC";

        $resultado = $this->db->query($sql);

        if($resultado && $resultado->num_rows > 0){
            $pedidos = [];

            while($row = $resultado->fetch_assoc()){
                $pedidos[] = $row;
            }

            return $pedidos;
        }else{
            return [];
        }
    }

    public function getById($id){
        $sql = "SELECT p.*, u.nombre as cliente_nombre, u.email as cliente_email
                FROM {$this->table} p
                JOIN usuario u ON p.usuario_id = u.id
                WHERE p.id = ?";
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

    public function getByUsuarioId($usuarioId){
        $sql = "SELECT * FROM {$this->table} WHERE usuario_id = ? ORDER BY created_at DESC";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("i", $usuarioId);
            $stmt->execute();

            $resultado = $stmt->get_result();

            $pedidos = [];
            while($row = $resultado->fetch_assoc()){
                $pedidos[] = $row;
            }
            $stmt->close();
            return $pedidos;
        }
        return [];
    }

    public function create($usuarioId, $direccionEnvio, $notas = null){
        $sql = "INSERT INTO {$this->table} (usuario_id, direccion_envio, notas) VALUES (?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("iss", $usuarioId, $direccionEnvio, $notas);
            $resultado = $stmt->execute();
            if($resultado){
                $insertId = $this->db->insert_id;
                $stmt->close();
                return $insertId;
            }
            $stmt->close();
        }
        return false;
    }

    public function updateEstado($id, $estado){
        $sql = "UPDATE {$this->table} SET estado = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("si", $estado, $id);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }

    public function updateTotal($id, $total){
        $sql = "UPDATE {$this->table} SET total = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("di", $total, $id);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }

    public function update($id, $direccionEnvio, $notas){
        $sql = "UPDATE {$this->table} SET direccion_envio = ?, notas = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("ssi", $direccionEnvio, $notas, $id);
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

    public function recalcularTotal($pedidoId){
        $sql = "UPDATE {$this->table} SET total = (
                    SELECT COALESCE(SUM(subtotal), 0)
                    FROM detalle_pedido
                    WHERE pedido_id = ?
                ) WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("ii", $pedidoId, $pedidoId);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }
}
