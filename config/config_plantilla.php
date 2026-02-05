<?php

// =========================================
// Configuración de Base de Datos
// =========================================

define('DB_HOST', '');
define('DB_USER', '');
define('DB_PASS', '');
define('DB_NAME', '');

// =========================================
// Configuración JWT (JSON Web Tokens)
// =========================================

// Clave secreta para firmar tokens JWT
// IMPORTANTE: Cambiar esta clave en producción por una cadena aleatoria de al menos 32 caracteres
define('JWT_SECRET_KEY', 'CAMBIAR_POR_CLAVE_SECRETA_ALEATORIA_32_CARACTERES');

// Tiempo de expiración del token en segundos (86400 = 24 horas)
define('JWT_EXPIRATION', 86400);

// Nombre del emisor del token (usado para validación)
define('JWT_ISSUER', 'apiComercio');