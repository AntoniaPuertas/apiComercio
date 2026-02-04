# Test de API - Paginacion y Filtros

**Fecha:** 2026-02-04
**Version:** 1.0
**Estado:** Todos los tests pasaron correctamente

---

## Resumen

Se verifico el correcto funcionamiento de la paginacion y filtros de busqueda implementados en los endpoints de la API REST.

### Configuracion del Entorno

- **Servidor:** WAMP 3.3.7 64-bit
- **PHP:** 8.3.14
- **Base de datos:** MariaDB 11.5.2 (puerto 3306)
- **Sistema:** Windows

---

## Estructura de Respuesta Paginada

Todos los endpoints GET devuelven la siguiente estructura:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "total_pages": 5
  }
}
```

---

## Tests Realizados

### 1. Endpoint: Productos (`/api/productos`)

#### Test 1.1: Paginacion basica (pagina 1)
```bash
curl "http://localhost/apiComercio/api/productos?page=1&limit=5"
```

**Resultado:** PASS
- Devuelve 5 productos (IDs 1-5)
- Pagination: `{page:1, limit:5, total:15, total_pages:3}`

#### Test 1.2: Paginacion (pagina 2)
```bash
curl "http://localhost/apiComercio/api/productos?page=2&limit=5"
```

**Resultado:** PASS
- Devuelve 5 productos (IDs 6-10)
- Pagination: `{page:2, limit:5, total:15, total_pages:3}`

#### Test 1.3: Paginacion (ultima pagina)
```bash
curl "http://localhost/apiComercio/api/productos?page=3&limit=5"
```

**Resultado:** PASS
- Devuelve 5 productos (IDs 11-15)
- Pagination: `{page:3, limit:5, total:15, total_pages:3}`

#### Test 1.4: Busqueda con resultados
```bash
curl "http://localhost/apiComercio/api/productos?search=laptop"
```

**Resultado:** PASS
- Devuelve 1 producto: "Laptop HP Pavilion 15"
- Pagination: `{page:1, limit:10, total:1, total_pages:1}`

#### Test 1.5: Busqueda sin resultados
```bash
curl "http://localhost/apiComercio/api/productos?search=noexiste"
```

**Resultado:** PASS
- Devuelve array vacio: `[]`
- Pagination: `{page:1, limit:10, total:0, total_pages:0}`

---

### 2. Endpoint: Usuarios (`/api/usuarios`)

#### Test 2.1: Paginacion basica
```bash
curl "http://localhost/apiComercio/api/usuarios?page=1&limit=2"
```

**Resultado:** PASS
- Devuelve 2 usuarios (Administrador, Juan Garcia)
- Pagination: `{page:1, limit:2, total:4, total_pages:2}`

#### Test 2.2: Busqueda por nombre
```bash
curl "http://localhost/apiComercio/api/usuarios?search=juan"
```

**Resultado:** PASS
- Devuelve 1 usuario: "Juan Garcia"
- Pagination: `{page:1, limit:10, total:1, total_pages:1}`

---

### 3. Endpoint: Pedidos (`/api/pedidos`)

#### Test 3.1: Paginacion basica
```bash
curl "http://localhost/apiComercio/api/pedidos?page=1&limit=2"
```

**Resultado:** PASS
- Devuelve 2 pedidos con datos del cliente
- Incluye campos: `cliente_nombre`, `cliente_email`
- Pagination: `{page:1, limit:2, total:4, total_pages:2}`

#### Test 3.2: Filtro por estado (pendiente)
```bash
curl "http://localhost/apiComercio/api/pedidos?estado=pendiente"
```

**Resultado:** PASS
- Devuelve 1 pedido (Carlos Martinez)
- Pagination: `{page:1, limit:10, total:1, total_pages:1}`

#### Test 3.3: Filtro por estado sin resultados
```bash
curl "http://localhost/apiComercio/api/pedidos?estado=cancelado"
```

**Resultado:** PASS
- Devuelve array vacio (no hay pedidos cancelados)
- Pagination: `{page:1, limit:10, total:0, total_pages:0}`

---

## Parametros Soportados

| Endpoint | Parametro | Descripcion | Valor Default |
|----------|-----------|-------------|---------------|
| Todos | `page` | Numero de pagina | 1 |
| Todos | `limit` | Items por pagina | 10 |
| `/productos` | `search` | Busca en codigo y nombre | - |
| `/usuarios` | `search` | Busca en email y nombre | - |
| `/pedidos` | `estado` | Filtra por estado del pedido | - |

### Estados validos para pedidos:
- `pendiente`
- `procesando`
- `enviado`
- `entregado`
- `cancelado`

---

## Datos de Prueba

### Productos
- Total: 15 registros
- Codigos: PROD001 a PROD015

### Usuarios
- Total: 4 registros
- Admin: admin@comercio.com
- Usuarios: juan@ejemplo.com, maria@ejemplo.com, carlos@ejemplo.com

### Pedidos
- Total: 4 registros
- Estados: 1 entregado, 1 enviado, 1 procesando, 1 pendiente

---

## Notas Tecnicas

1. **Base de datos:** Se utiliza MariaDB (puerto 3306) como DBMS por defecto en WAMP. MySQL esta disponible en el puerto 3308.

2. **Busqueda:** Utiliza `LIKE '%termino%'` para coincidencias parciales.

3. **Seguridad:** Los passwords de usuarios NO se incluyen en las respuestas GET.

4. **JOIN en pedidos:** El endpoint de pedidos incluye informacion del cliente mediante JOIN con la tabla usuarios.

---

## Comandos para Recrear Tests

```bash
# Recrear base de datos
"c:/wamp64/bin/mariadb/mariadb11.5.2/bin/mysql.exe" -u root < database/apiComercioDB.sql

# Ejecutar todos los tests
curl "http://localhost/apiComercio/api/productos?page=1&limit=5"
curl "http://localhost/apiComercio/api/productos?search=laptop"
curl "http://localhost/apiComercio/api/usuarios?page=1&limit=2"
curl "http://localhost/apiComercio/api/usuarios?search=juan"
curl "http://localhost/apiComercio/api/pedidos?estado=pendiente"
```
