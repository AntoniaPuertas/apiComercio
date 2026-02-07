-- =============================================
-- Base de datos para API Comercio
-- Script para crear/recrear la base de datos completa
-- =============================================

-- Eliminar la base de datos si existe (para recrear desde cero)
DROP DATABASE IF EXISTS apiComercioDB;

-- Crear la base de datos
CREATE DATABASE apiComercioDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE apiComercioDB;

-- =============================================
-- ESTRUCTURA DE TABLAS
-- =============================================

-- Tabla: producto
CREATE TABLE producto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    imagen VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: usuario
CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: pedido
CREATE TABLE pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    estado ENUM('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    direccion_envio TEXT,
    ciudad VARCHAR(100),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    INDEX idx_estado (estado),
    INDEX idx_ciudad (ciudad),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: detalle_pedido
CREATE TABLE detalle_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pedido (pedido_id),
    INDEX idx_producto (producto_id),
    FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: password_reset (tokens para recuperacion de contrasena)
CREATE TABLE password_reset (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    expira_at TIMESTAMP NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_usuario (usuario_id),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- DATOS DE PRUEBA
-- =============================================

-- Productos (15 productos de tecnologia)
INSERT INTO producto (codigo, nombre, precio, descripcion, categoria, imagen) VALUES
('PROD001', 'Laptop HP Pavilion 15', 899.99, 'Laptop HP Pavilion con procesador Intel Core i5, 8GB RAM, 512GB SSD, pantalla 15.6 pulgadas Full HD', 'Computadoras', 'https://ejemplo.com/images/laptop-hp.jpg'),
('PROD002', 'Mouse Logitech MX Master 3', 99.99, 'Mouse inalambrico ergonomico con scroll electromagnetico y conexion Bluetooth', 'Perifericos', 'https://ejemplo.com/images/mouse-logitech.jpg'),
('PROD003', 'Teclado Mecanico Keychron K2', 89.00, 'Teclado mecanico 75% con switches Gateron Brown, retroiluminacion RGB y conectividad Bluetooth', 'Perifericos', 'https://ejemplo.com/images/teclado-keychron.jpg'),
('PROD004', 'Monitor Samsung 27 4K', 449.99, 'Monitor Samsung 27 pulgadas UHD 4K, panel IPS, HDR10, 60Hz, USB-C con carga', 'Monitores', 'https://ejemplo.com/images/monitor-samsung.jpg'),
('PROD005', 'Auriculares Sony WH-1000XM5', 349.99, 'Auriculares inalambricos con cancelacion de ruido activa, 30 horas de bateria, audio Hi-Res', 'Audio', 'https://ejemplo.com/images/auriculares-sony.jpg'),
('PROD006', 'Webcam Logitech C920', 79.99, 'Webcam Full HD 1080p con microfono estereo integrado y correccion automatica de luz', 'Perifericos', 'https://ejemplo.com/images/webcam-logitech.jpg'),
('PROD007', 'SSD Samsung 970 EVO Plus 1TB', 129.99, 'Unidad de estado solido NVMe M.2, velocidad lectura 3500MB/s, escritura 3300MB/s', 'Almacenamiento', 'https://ejemplo.com/images/ssd-samsung.jpg'),
('PROD008', 'Tablet iPad Air 2024', 599.00, 'iPad Air con chip M2, pantalla Liquid Retina 10.9 pulgadas, 64GB almacenamiento', 'Tablets', 'https://ejemplo.com/images/ipad-air.jpg'),
('PROD009', 'Cargador USB-C 65W', 45.99, 'Cargador rapido GaN de 65W con tecnologia PD 3.0, compatible con laptops y smartphones', 'Accesorios', 'https://ejemplo.com/images/cargador-usbc.jpg'),
('PROD010', 'Hub USB-C 7 en 1', 59.99, 'Hub multipuerto con HDMI 4K, 2x USB 3.0, USB-C PD, lector SD/microSD, ethernet', 'Accesorios', 'https://ejemplo.com/images/hub-usbc.jpg'),
('PROD011', 'Silla Gamer Secretlab Titan', 449.00, 'Silla ergonomica para gaming con soporte lumbar ajustable, reposabrazos 4D, reclinable 165 grados', 'Mobiliario', 'https://ejemplo.com/images/silla-secretlab.jpg'),
('PROD012', 'Disco Duro Externo WD 2TB', 79.99, 'Disco duro portatil USB 3.0, 2TB de capacidad, compatible con Windows y Mac', 'Almacenamiento', 'https://ejemplo.com/images/hdd-wd.jpg'),
('PROD013', 'Lampara LED de Escritorio', 39.99, 'Lampara LED con 5 niveles de brillo, temperatura de color ajustable, puerto USB de carga', 'Accesorios', 'https://ejemplo.com/images/lampara-led.jpg'),
('PROD014', 'Mousepad XL RGB', 34.99, 'Alfombrilla de raton extendida 900x400mm con iluminacion RGB perimetral y base antideslizante', 'Perifericos', 'https://ejemplo.com/images/mousepad-rgb.jpg'),
('PROD015', 'Memoria RAM Corsair 16GB', 69.99, 'Kit de memoria DDR4 16GB (2x8GB) 3200MHz, disipador de aluminio, compatible con XMP 2.0', 'Componentes', 'https://ejemplo.com/images/ram-corsair.jpg');

-- Usuarios (1 admin + 3 usuarios normales)
-- Nota: La contraseña de todos es 'password' (hasheada con password_hash de PHP)
INSERT INTO usuario (email, password, nombre, rol) VALUES
('admin@comercio.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'admin'),
('juan@ejemplo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Juan Garcia', 'usuario'),
('maria@ejemplo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Maria Lopez', 'usuario'),
('carlos@ejemplo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carlos Martinez', 'usuario');

-- Pedidos de prueba
INSERT INTO pedido (usuario_id, estado, total, direccion_envio, ciudad, notas) VALUES
(2, 'entregado', 999.98, 'Calle Principal 123, 28001', 'Madrid', 'Dejar en porteria'),
(3, 'enviado', 538.00, 'Avenida Central 456, 08001', 'Barcelona', NULL),
(2, 'procesando', 449.99, 'Calle Principal 123, 28001', 'Madrid', 'Envio urgente'),
(4, 'pendiente', 244.97, 'Plaza Mayor 789, 46001', 'Valencia', 'Llamar antes de entregar');

-- Detalles de pedidos
INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
-- Pedido 1: Juan Garcia - Laptop + Mouse = 999.98
(1, 1, 1, 899.99, 899.99),
(1, 2, 1, 99.99, 99.99),
-- Pedido 2: Maria Lopez - Teclado + Silla = 538.00
(2, 3, 1, 89.00, 89.00),
(2, 11, 1, 449.00, 449.00),
-- Pedido 3: Juan Garcia - Monitor = 449.99
(3, 4, 1, 449.99, 449.99),
-- Pedido 4: Carlos Martinez - Webcam + SSD + Mousepad = 244.97
(4, 6, 1, 79.99, 79.99),
(4, 7, 1, 129.99, 129.99),
(4, 14, 1, 34.99, 34.99);

-- =============================================
-- VERIFICACION
-- =============================================
SELECT 'Productos' as tabla, COUNT(*) as total FROM producto
UNION ALL
SELECT 'Usuarios', COUNT(*) FROM usuario
UNION ALL
SELECT 'Pedidos', COUNT(*) FROM pedido
UNION ALL
SELECT 'Detalles', COUNT(*) FROM detalle_pedido;
