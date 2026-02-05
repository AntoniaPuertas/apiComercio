<?php

/**
 * JWT - Clase para generar y validar JSON Web Tokens
 *
 * Implementación nativa sin dependencias externas.
 * Algoritmo: HS256 (HMAC-SHA256)
 *
 * Estructura del token: header.payload.signature
 * - Header: {"alg": "HS256", "typ": "JWT"}
 * - Payload: Datos del usuario + iat (issued at) + exp (expiration)
 * - Signature: HMAC-SHA256(header.payload, secret_key)
 *
 * @author API Comercio
 * @version 1.0
 */

class JWT
{
    /**
     * Clave secreta para firmar tokens
     * @var string
     */
    private $secretKey;

    /**
     * Tiempo de expiración en segundos
     * @var int
     */
    private $expiration;

    /**
     * Emisor del token
     * @var string
     */
    private $issuer;

    /**
     * Constructor
     *
     * @param string $secretKey Clave secreta (usa JWT_SECRET_KEY si no se proporciona)
     * @param int $expiration Tiempo de expiración en segundos (usa JWT_EXPIRATION si no se proporciona)
     */
    public function __construct($secretKey = null, $expiration = null)
    {
        $this->secretKey = $secretKey ?? (defined('JWT_SECRET_KEY') ? JWT_SECRET_KEY : 'default_secret_key_change_in_production');
        $this->expiration = $expiration ?? (defined('JWT_EXPIRATION') ? JWT_EXPIRATION : 86400);
        $this->issuer = defined('JWT_ISSUER') ? JWT_ISSUER : 'apiComercio';
    }

    /**
     * Codifica datos en Base64 URL-safe
     *
     * Base64 estándar usa +, / y = que pueden causar problemas en URLs.
     * Base64URL reemplaza: + → -, / → _, elimina =
     *
     * @param string $data Datos a codificar
     * @return string Datos codificados en Base64URL
     */
    private function base64UrlEncode($data)
    {
        // Codificar en base64 estándar
        $base64 = base64_encode($data);

        // Convertir a Base64URL: reemplazar + por -, / por _, eliminar =
        $base64Url = strtr($base64, '+/', '-_');

        // Eliminar padding (=)
        return rtrim($base64Url, '=');
    }

    /**
     * Decodifica datos de Base64 URL-safe
     *
     * @param string $data Datos en Base64URL
     * @return string Datos decodificados
     */
    private function base64UrlDecode($data)
    {
        // Convertir de Base64URL a Base64 estándar
        $base64 = strtr($data, '-_', '+/');

        // Añadir padding si es necesario (Base64 requiere longitud múltiplo de 4)
        $padding = strlen($base64) % 4;
        if ($padding) {
            $base64 .= str_repeat('=', 4 - $padding);
        }

        return base64_decode($base64);
    }

    /**
     * Genera un token JWT
     *
     * @param array $payload Datos a incluir en el token (ej: id, email, rol)
     * @return string Token JWT completo (header.payload.signature)
     */
    public function encode($payload)
    {
        // 1. Crear el header (siempre igual para HS256)
        $header = [
            'alg' => 'HS256',  // Algoritmo de firma
            'typ' => 'JWT'     // Tipo de token
        ];

        // 2. Añadir claims estándar al payload
        $payload['iss'] = $this->issuer;           // Issuer (emisor)
        $payload['iat'] = time();                   // Issued At (momento de creación)
        $payload['exp'] = time() + $this->expiration; // Expiration (momento de expiración)

        // 3. Codificar header y payload en Base64URL
        $headerEncoded = $this->base64UrlEncode(json_encode($header));
        $payloadEncoded = $this->base64UrlEncode(json_encode($payload));

        // 4. Crear la firma HMAC-SHA256
        // La firma se calcula sobre: header.payload
        $dataToSign = $headerEncoded . '.' . $payloadEncoded;
        $signature = hash_hmac('sha256', $dataToSign, $this->secretKey, true);
        $signatureEncoded = $this->base64UrlEncode($signature);

        // 5. Retornar el token completo: header.payload.signature
        return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
    }

    /**
     * Decodifica y valida un token JWT
     *
     * @param string $token Token JWT a validar
     * @return array|null Payload decodificado si es válido, null si es inválido
     */
    public function decode($token)
    {
        // 1. Separar las tres partes del token
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            // Token mal formado (debe tener exactamente 3 partes)
            return null;
        }

        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;

        // 2. Verificar la firma
        // Recalcular la firma con los datos recibidos y compararla
        $dataToSign = $headerEncoded . '.' . $payloadEncoded;
        $expectedSignature = $this->base64UrlEncode(
            hash_hmac('sha256', $dataToSign, $this->secretKey, true)
        );

        // Comparación segura contra timing attacks
        if (!hash_equals($expectedSignature, $signatureEncoded)) {
            // Firma inválida - el token fue manipulado
            return null;
        }

        // 3. Decodificar el payload
        $payload = json_decode($this->base64UrlDecode($payloadEncoded), true);

        if (!$payload) {
            // Payload no es JSON válido
            return null;
        }

        // 4. Verificar expiración
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            // Token expirado
            return null;
        }

        // 5. Verificar emisor (opcional pero recomendado)
        if (isset($payload['iss']) && $payload['iss'] !== $this->issuer) {
            // Emisor no coincide
            return null;
        }

        // Token válido - retornar el payload
        return $payload;
    }

    /**
     * Verifica si un token es válido sin decodificarlo completamente
     *
     * @param string $token Token JWT a verificar
     * @return bool true si es válido, false si no
     */
    public function isValid($token)
    {
        return $this->decode($token) !== null;
    }

    /**
     * Obtiene el tiempo restante de validez del token en segundos
     *
     * @param string $token Token JWT
     * @return int|null Segundos restantes, null si token inválido, 0 si expirado
     */
    public function getTimeToExpiration($token)
    {
        $payload = $this->decode($token);

        if (!$payload || !isset($payload['exp'])) {
            return null;
        }

        $remaining = $payload['exp'] - time();
        return max(0, $remaining);
    }
}
