<?php

class UsuarioDB
{
    private $db;
    private $table = 'usuario';

    public function __construct($database)
    {
        $this->db = $database->getConexion();
    }

    public function getAll()
    {
        $sql = "SELECT id, email, nombre, rol, activo, created_at, updated_at FROM {$this->table}";

        $resultado = $this->db->query($sql);

        if ($resultado && $resultado->num_rows > 0) {
            $usuarios = [];

            while ($row = $resultado->fetch_assoc()) {
                $usuarios[] = $row;
            }

            return $usuarios;
        } else {
            return [];
        }
    }

    public function getAllPaginated($page = 1, $limit = 10, $search = '')
    {
        $page = max(1, (int)$page);
        $limit = max(1, (int)$limit);
        $offset = ($page - 1) * $limit;

        // Construir WHERE clause para búsqueda
        $where = '';
        if (!empty($search)) {
            $search = '%' . $this->db->real_escape_string($search) . '%';
            $where = " WHERE email LIKE '{$search}' OR nombre LIKE '{$search}'";
        }

        // Contar total de registros
        $countSql = "SELECT COUNT(*) as total FROM {$this->table}" . $where;
        $countResult = $this->db->query($countSql);
        $countRow = $countResult->fetch_assoc();
        $total = (int)$countRow['total'];
        $totalPages = ceil($total / $limit);

        // Obtener datos paginados
        $sql = "SELECT id, email, nombre, rol, activo, created_at, updated_at FROM {$this->table}" . $where . " LIMIT ? OFFSET ?";
        $stmt = $this->db->prepare($sql);

        if ($stmt) {
            $stmt->bind_param("ii", $limit, $offset);
            $stmt->execute();
            $resultado = $stmt->get_result();

            $usuarios = [];
            while ($row = $resultado->fetch_assoc()) {
                $usuarios[] = $row;
            }
            $stmt->close();

            return [
                'data' => $usuarios,
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
        $sql = "SELECT id, email, nombre, rol, activo, created_at, updated_at FROM {$this->table} WHERE id = ?";
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

    public function getByEmail($email)
    {
        $sql = "SELECT * FROM {$this->table} WHERE email = ?";
        $stmt = $this->db->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("s", $email);
            $stmt->execute();

            $resultado = $stmt->get_result();

            if ($resultado->num_rows > 0) {
                return $resultado->fetch_assoc();
            }
            $stmt->close();
        }
        return null;
    }

    public function create($email, $password, $nombre, $rol = 'usuario')
    {
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $sql = "INSERT INTO {$this->table} (email, password, nombre, rol) VALUES (?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("ssss", $email, $passwordHash, $nombre, $rol);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }

    public function update($id, $email, $nombre, $rol, $activo)
    {
        $sql = "UPDATE {$this->table} SET email = ?, nombre = ?, rol = ?, activo = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("sssii", $email, $nombre, $rol, $activo, $id);
            $resultado = $stmt->execute();
            $stmt->close();
            return $resultado;
        }
        return false;
    }

    public function updatePassword($id, $password)
    {
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $sql = "UPDATE {$this->table} SET password = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("si", $passwordHash, $id);
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

    public function verificarCredenciales($email, $password)
    {
        $usuario = $this->getByEmail($email);
        if ($usuario && password_verify($password, $usuario['password'])) {
            unset($usuario['password']);
            return $usuario;
        }
        return null;
    }
}
