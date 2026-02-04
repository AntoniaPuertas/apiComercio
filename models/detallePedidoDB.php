<?php

class DetallePedidoDB {
    private $db;
    private $table = 'detalle_pedido';

    public function __construct($database)
    {
        $this->db = $database->getConexion();
    }

    public function getByPedidoId($pedidoId){
        $sql = "SELECT dp.*, p.codigo, p.nombre as producto_nombre, p.imagen
                FROM {$this->table} dp
                JOIN producto p ON dp.producto_id = p.id
                WHERE dp.pedido_id = ?";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("i", $pedidoId);
            $stmt->execute();

            $resultado = $stmt->get_result();

            $detalles = [];
            while($row = $resultado->fetch_assoc()){
                $detalles[] = $row;
            }
            $stmt->close();
            return $detalles;
        }
        return [];
    }

    public function getById($id){
        $sql = "SELECT dp.*, p.codigo, p.nombre as producto_nombre
                FROM {$this->table} dp
                JOIN producto p ON dp.producto_id = p.id
                WHERE dp.id = ?";
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

    public function create($pedidoId, $productoId, $cantidad, $precioUnitario){
        $subtotal = $cantidad * $precioUnitario;
        $sql = "INSERT INTO {$this->table} (pedido_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("iiidd", $pedidoId, $productoId, $cantidad, $precioUnitario, $subtotal);
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

    public function findByProductoAndPrecio($pedidoId, $productoId, $precioUnitario){
        $sql = "SELECT * FROM {$this->table} WHERE pedido_id = ? AND producto_id = ? AND precio_unitario = ?";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("iid", $pedidoId, $productoId, $precioUnitario);
            $stmt->execute();
            $resultado = $stmt->get_result();
            if($resultado->num_rows > 0){
                $detalle = $resultado->fetch_assoc();
                $stmt->close();
                return $detalle;
            }
            $stmt->close();
        }
        return null;
    }

    public function updateCantidad($id, $cantidad){
        $sql = "UPDATE {$this->table} SET cantidad = ?, subtotal = cantidad * precio_unitario WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("ii", $cantidad, $id);
            $resultado = $stmt->execute();
            $stmt->close();

            // Recalcular subtotal correctamente
            $sql2 = "UPDATE {$this->table} SET subtotal = cantidad * precio_unitario WHERE id = ?";
            $stmt2 = $this->db->prepare($sql2);
            if($stmt2){
                $stmt2->bind_param("i", $id);
                $stmt2->execute();
                $stmt2->close();
            }

            return $resultado;
        }
        return false;
    }

    public function update($id, $cantidad, $precioUnitario){
        $subtotal = $cantidad * $precioUnitario;
        $sql = "UPDATE {$this->table} SET cantidad = ?, precio_unitario = ?, subtotal = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("iddi", $cantidad, $precioUnitario, $subtotal, $id);
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

    public function deleteByPedidoId($pedidoId){
        $sql = "DELETE FROM {$this->table} WHERE pedido_id = ?";
        $stmt = $this->db->prepare($sql);
        if($stmt){
            $stmt->bind_param("i", $pedidoId);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }
}
