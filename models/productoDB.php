<?php

class ProductoDB
{
    private $db;
    private $table = 'producto';

    public function __construct($database)
    {
        $this->db = $database->getConexion();
    }

    public function getAll()
    {
        $sql = "SELECT * FROM {$this->table}";

        $resultado = $this->db->query($sql);

        if ($resultado && $resultado->num_rows > 0) {
            $productos = [];

            while ($row = $resultado->fetch_assoc()) {
                $productos[] = $row;
            }

            return $productos;
        } else {
            return [];
        }
    }

    public function getAllPaginated($page = 1, $limit = 10, $search = '', $categoria = '')
    {
        $page = max(1, (int)$page);
        $limit = max(1, (int)$limit);
        $offset = ($page - 1) * $limit;

        // Construir WHERE clause para búsqueda y filtro
        $conditions = [];
        if (!empty($search)) {
            $search = '%' . $this->db->real_escape_string($search) . '%';
            $conditions[] = "(codigo LIKE '{$search}' OR nombre LIKE '{$search}' OR descripcion LIKE '{$search}')";
        }
        if (!empty($categoria)) {
            $categoria = $this->db->real_escape_string($categoria);
            $conditions[] = "categoria = '{$categoria}'";
        }
        $where = count($conditions) > 0 ? ' WHERE ' . implode(' AND ', $conditions) : '';

        // Contar total de registros
        $countSql = "SELECT COUNT(*) as total FROM {$this->table}" . $where;
        $countResult = $this->db->query($countSql);
        $countRow = $countResult->fetch_assoc();
        $total = (int)$countRow['total'];
        $totalPages = ceil($total / $limit);

        // Obtener datos paginados
        $sql = "SELECT * FROM {$this->table}" . $where . " LIMIT ? OFFSET ?";
        $stmt = $this->db->prepare($sql);

        if ($stmt) {
            $stmt->bind_param("ii", $limit, $offset);
            $stmt->execute();
            $resultado = $stmt->get_result();

            $productos = [];
            while ($row = $resultado->fetch_assoc()) {
                $productos[] = $row;
            }
            $stmt->close();

            return [
                'data' => $productos,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'total_pages' => $totalPages
                ]
            ];
        }

        return [
            'data' => [],
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => 0,
                'total_pages' => 0
            ]
        ];
    }

    public function getById($id)
    {
        $sql = "SELECT * FROM {$this->table} WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("i", $id);
            $stmt->execute();

            $resultado = $stmt->get_result();

            if ($resultado->num_rows > 0) {
                return $resultado->fetch_assoc();
            }
            $stmt->close();
        }
        return null;
    }

    public function getCategorias()
    {
        $sql = "SELECT DISTINCT categoria FROM {$this->table} WHERE categoria IS NOT NULL AND categoria != '' ORDER BY categoria";
        $resultado = $this->db->query($sql);

        if ($resultado && $resultado->num_rows > 0) {
            $categorias = [];
            while ($row = $resultado->fetch_assoc()) {
                $categorias[] = $row['categoria'];
            }
            return $categorias;
        }
        return [];
    }

    public function createProducto($codigo, $nombre, $precio, $descripcion, $categoria, $imagen)
    {
        $sql = "INSERT INTO {$this->table} (codigo, nombre, precio, descripcion, categoria, imagen) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("ssssss", $codigo, $nombre, $precio, $descripcion, $categoria, $imagen);
            $resultado = $stmt->execute();
            $insertId = $this->db->insert_id;
            $stmt->close();
            return $resultado ? $insertId : false;
        }
        return false;
    }

    public function updateImagen($id, $ruta)
    {
        $sql = "UPDATE {$this->table} SET imagen = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("si", $ruta, $id);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }

    public function updateProducto($id, $codigo, $nombre, $precio, $descripcion, $categoria, $imagen)
    {
        $sql = "UPDATE {$this->table} SET codigo = ?, nombre = ?, precio = ?, descripcion = ?, categoria = ?, imagen = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("ssssssi", $codigo, $nombre, $precio, $descripcion, $categoria, $imagen, $id);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }

    public function delete($id)
    {
        try {
            $sql = "DELETE FROM {$this->table} WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            if ($stmt) {
                $stmt->bind_param("i", $id);
                $resultado = $stmt->execute();
                $stmt->close();
                return $resultado;
            }
            return false;
        } catch (mysqli_sql_exception $e) {
            // Foreign key constraint violation u otro error
            return false;
        }
    }
}
