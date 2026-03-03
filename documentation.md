# 📖 Team Manager — Documentación Técnica

**Versión:** 1.0.0  
**Última actualización:** 2025  
**Stack:** PHP 8.0+ · MySQL 8.0+ · Vanilla JS ES2020

---


## 1. Arquitectura del sistema

Team Manager sigue una arquitectura **MVC ligera** sin framework, con el siguiente flujo de peticiones:

```
Navegador
    │
    ├── GET  /index.php        → Renderiza formulario de login (PHP)
    ├── POST /index.php        → Valida credenciales → redirige a dashboard
    ├── GET  /dashboard.php    → Renderiza la SPA (PHP + HTML)
    │
    └── XHR  /api/index.php    → Router API REST (PHP)
                │
                ├── ?entity=jugadores  → CRUD jugadores
                ├── ?entity=partidos   → CRUD partidos
                ├── ?entity=multas     → CRUD multas
                └── ... (12 entidades)
```

### Patrón SPA con PHP híbrido

- `dashboard.php` sirve el **HTML shell** de la aplicación (una sola carga de página).
- La navegación entre secciones ocurre enteramente en JavaScript (sin recargas).
- Los datos se obtienen y guardan mediante `fetch()` contra `api/index.php`.
- PHP se usa como motor de plantillas para inyectar configuración inicial y controlar acceso.

```
┌─────────────────────────────────────────────┐
│              dashboard.php (shell)          │
│  ┌─────────────┐   ┌──────────────────────┐ │
│  │   sidebar   │   │   secciones ocultas  │ │
│  │   nav       │   │   (display:none)     │ │
│  └─────────────┘   │   se muestran con JS │ │
│                    └──────────────────────┘ │
└─────────────────────────────────────────────┘
         ↕ fetch() JSON
┌─────────────────────────────────────────────┐
│          api/index.php (REST router)        │
│  switch($entity) { case 'jugadores': ...    │
└─────────────────────────────────────────────┘
         ↕ PDO
┌─────────────────────────────────────────────┐
│              MySQL / MariaDB                │
└─────────────────────────────────────────────┘
```

---

## 2. Estructura de archivos

```
clubmanager/
│
├── index.php               Página de login. Arranca sesión, valida POST,
│                           redirige a dashboard si ya está autenticado.
│
├── login.php               Alias completo de index.php. Misma funcionalidad,
│                           accesible por /login.php para conveniencia.
│
├── dashboard.php           Shell de la SPA. Requiere sesión activa.
│                           Inyecta window.CM_CONFIG con BASE_PATH y datos del usuario.
│                           Contiene todas las secciones HTML (ocultas por defecto).
│
├── logout.php              Destruye la sesión y redirige a index.php.
│
├── database.sql            DDL completo: CREATE TABLE + INSERT de datos demo.
│                           Se importa una sola vez al instalar.
│
├── .htaccess               Configuración Apache: seguridad, caché, compresión.
│                           Bloquea acceso directo a config/ e includes/.
│
├── config/
│   └── database.php        Define las constantes DB_HOST, DB_USER, DB_PASS, DB_NAME.
│                           Función getDB(): PDO (singleton de conexión).
│
├── includes/
│   └── auth.php            Funciones de sesión: isLogged(), requireLogin(),
│                           currentUser(), hasRole(), login(), logout().
│                           Define BASE_PATH detectando el subdirectorio automáticamente.
│                           Helpers: jsonResponse(), clean().
│
├── api/
│   └── index.php           Router de la API REST. Lee ?entity, ?action, ?id
│                           y el cuerpo JSON. Despacha a cada case del switch.
│                           Todos los métodos HTTP: GET, POST, PUT, DELETE.
│
└── assets/
    ├── css/
    │   └── main.css        Variables CSS, reset, layout, componentes reutilizables,
    │                       responsive breakpoints.
    └── js/
        └── app.js          Cliente API (objeto API), sistema de navegación (navigate()),
                            objeto Pages con lógica de cada módulo,
                            Modal, toast(), helpers de formato.
```

---

## 3. Base de datos

### Diagrama de relaciones (ERD simplificado)

```
equipos (1) ──────────< jugadores (N)
equipos (1) ──────────< entrenadores (N)
equipos (1) ──────────< partidos (N)      [equipo_local_id]
equipos (1) ──────────< entrenamientos (N)

jugadores (1) ─────────< goles_partido (N)
jugadores (1) ─────────< tarjetas (N)
jugadores (1) ─────────< multas (N)        [tipo_persona='jugador']
jugadores (1) ─────────< rendimiento (N)
jugadores (1) ─────────< asistencia_entrenamiento (N)

partidos (1) ──────────< goles_partido (N)
partidos (1) ──────────< tarjetas (N)      [nullable]

entrenamientos (1) ────< asistencia_entrenamiento (N)

entrenadores (1) ───────< multas (N)       [tipo_persona='entrenador']
directivos (1) ─────────< multas (N)       [tipo_persona='directivo']
```

### Tablas

#### `usuarios`
Cuentas de administración del sistema.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK AI | Identificador único |
| `nombre` | VARCHAR(100) | Nombre completo |
| `email` | VARCHAR(150) UNIQUE | Email de acceso |
| `password` | VARCHAR(255) | Hash bcrypt |
| `rol` | ENUM | `superadmin`, `admin`, `manager`, `readonly` |
| `activo` | TINYINT(1) | 1=activo, 0=desactivado |
| `ultimo_acceso` | DATETIME NULL | Se actualiza en cada login |
| `created_at` | DATETIME | Fecha de creación |

#### `equipos`
Equipos del club.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK AI | Identificador único |
| `nombre` | VARCHAR(100) | Nombre del equipo |
| `categoria` | VARCHAR(50) | Senior, Sub-23, Juvenil, etc. |
| `color` | VARCHAR(10) | Color HEX para la UI |
| `descripcion` | TEXT | Descripción libre |
| `created_at` | DATETIME | Fecha de creación |

#### `jugadores`
Plantilla de jugadores.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK AI | Identificador único |
| `nombre` | VARCHAR(100) | Nombre completo |
| `dorsal` | TINYINT UNSIGNED | Número de dorsal |
| `posicion` | ENUM | `Portero`, `Defensa`, `Centrocampista`, `Delantero` |
| `edad` | TINYINT UNSIGNED | Edad en años |
| `nacionalidad` | VARCHAR(5) | Código de país (ES, BR, AR…) |
| `equipo_id` | INT FK NULL | Referencia a `equipos.id` |
| `estado` | ENUM | `Activo`, `Lesionado`, `Sancionado`, `Inactivo` |
| `valoracion` | DECIMAL(3,1) | Valoración general 1.0–10.0 |
| `foto` | VARCHAR(255) NULL | Ruta a foto (no implementado en UI) |
| `fecha_alta` | DATE | Fecha de incorporación al club |
| `created_at` | DATETIME | Fecha de registro |

#### `entrenadores`
Cuerpo técnico.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK AI | Identificador único |
| `nombre` | VARCHAR(100) | Nombre completo |
| `email` | VARCHAR(150) | Correo electrónico |
| `telefono` | VARCHAR(30) | Teléfono de contacto |
| `especialidad` | VARCHAR(80) | Principal, Porteros, Preparación Física… |
| `equipo_id` | INT FK NULL | Equipo asignado |
| `fecha_inicio` | DATE | Fecha de incorporación |
| `activo` | TINYINT(1) | Estado activo/inactivo |
| `foto` | VARCHAR(255) NULL | Ruta a foto |
| `created_at` | DATETIME | Fecha de registro |

#### `directivos`
Junta directiva.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK AI | Identificador único |
| `nombre` | VARCHAR(100) | Nombre completo |
| `cargo` | VARCHAR(80) | Cargo en la directiva |
| `email` | VARCHAR(150) | Correo electrónico |
| `telefono` | VARCHAR(30) | Teléfono |
| `fecha_inicio` | DATE | Inicio en el cargo |
| `activo` | TINYINT(1) | Soft delete: 0=eliminado |
| `created_at` | DATETIME | Fecha de creación |

#### `partidos`
Registro de partidos.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK AI | Identificador único |
| `equipo_local_id` | INT FK NULL | Nuestro equipo |
| `rival` | VARCHAR(100) | Nombre del equipo contrario |
| `es_local` | TINYINT(1) | 1=jugamos en casa, 0=fuera |
| `fecha` | DATETIME | Fecha y hora del partido |
| `competicion` | VARCHAR(100) | Liga, Copa, Amistoso… |
| `estado` | ENUM | `Programado`, `En juego`, `Finalizado`, `Aplazado`, `Cancelado` |
| `goles_favor` | TINYINT UNSIGNED NULL | Goles marcados (NULL=no jugado) |
| `goles_contra` | TINYINT UNSIGNED NULL | Goles encajados |
| `notas` | TEXT | Notas adicionales |
| `created_at` | DATETIME | Fecha de creación |

#### `goles_partido`
Goleadores de cada partido.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK AI | Identificador único |
| `partido_id` | INT FK | Referencia a `partidos.id` (CASCADE) |
| `jugador_id` | INT FK | Referencia a `jugadores.id` (CASCADE) |
| `minuto` | TINYINT UNSIGNED | Minuto del gol |
| `tipo` | ENUM | `Normal`, `Penalty`, `Falta`, `Autogol` |

#### `entrenamientos`
Sesiones de entrenamiento.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK AI | Identificador único |
| `equipo_id` | INT FK NULL | Equipo convocado |
| `fecha` | DATETIME | Fecha y hora |
| `tipo` | ENUM | `Táctica`, `Físico`, `Técnica`, `Partido Interno`, `Recuperación`, `Porteros` |
| `duracion` | SMALLINT UNSIGNED | Duración en minutos |
| `lugar` | VARCHAR(150) | Instalación donde se realiza |
| `notas` | TEXT | Descripción de la sesión |
| `estado` | ENUM | `Programado`, `Completado`, `Cancelado` |
| `created_at` | DATETIME | Fecha de creación |

#### `asistencia_entrenamiento`
Control de asistencia a entrenamientos (UNIQUE por entrenamiento+jugador).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK AI | Identificador único |
| `entrenamiento_id` | INT FK | Referencia a `entrenamientos.id` (CASCADE) |
| `jugador_id` | INT FK | Referencia a `jugadores.id` (CASCADE) |
| `asistio` | TINYINT(1) | 1=asistió, 0=faltó |
| `justificacion` | VARCHAR(255) | Motivo de ausencia |

#### `tarjetas`
Registro disciplinario.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK AI | Identificador único |
| `jugador_id` | INT FK | Jugador sancionado (CASCADE) |
| `partido_id` | INT FK NULL | Partido donde ocurrió |
| `tipo` | ENUM | `Amarilla`, `Roja`, `Doble Amarilla` |
| `minuto` | TINYINT UNSIGNED NULL | Minuto de la tarjeta |
| `motivo` | VARCHAR(255) | Descripción del motivo |
| `sancion_partidos` | TINYINT UNSIGNED | Partidos de sanción (0=ninguna) |
| `fecha` | DATE | Fecha de la tarjeta |
| `created_at` | DATETIME | Fecha de registro |

#### `multas`
Sanciones económicas.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK AI | Identificador único |
| `tipo_persona` | ENUM | `jugador`, `entrenador`, `directivo` |
| `persona_id` | INT | ID en la tabla correspondiente (polimórfico) |
| `motivo` | VARCHAR(255) | Descripción de la multa |
| `importe` | DECIMAL(8,2) | Importe en euros |
| `fecha` | DATE | Fecha de la multa |
| `estado` | ENUM | `Pendiente`, `Pagada`, `Anulada` |
| `fecha_pago` | DATE NULL | Fecha en que se pagó |
| `notas` | TEXT | Notas adicionales |
| `created_at` | DATETIME | Fecha de registro |

#### `rendimiento`
Evaluaciones periódicas de jugadores.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK AI | Identificador único |
| `jugador_id` | INT FK | Jugador evaluado (CASCADE) |
| `fecha` | DATE | Fecha de la evaluación |
| `velocidad` | TINYINT UNSIGNED | Atributo 1–10 |
| `tecnica` | TINYINT UNSIGNED | Atributo 1–10 |
| `fisico` | TINYINT UNSIGNED | Atributo 1–10 |
| `tactica` | TINYINT UNSIGNED | Atributo 1–10 |
| `actitud` | TINYINT UNSIGNED | Atributo 1–10 |
| `valoracion_gen` | DECIMAL(3,1) | Valoración global 1.0–10.0 |
| `notas` | TEXT | Observaciones libres |
| `created_at` | DATETIME | Fecha de registro |

#### `noticias`
Avisos internos del club (tabla preparada para uso futuro en UI).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INT PK AI | Identificador único |
| `titulo` | VARCHAR(200) | Título del aviso |
| `contenido` | TEXT | Cuerpo del aviso |
| `tipo` | ENUM | `Aviso`, `Noticia`, `Urgente` |
| `activo` | TINYINT(1) | Visible o archivado |
| `created_at` | DATETIME | Fecha de publicación |

---

## 4. Módulo de autenticación

**Archivo:** `includes/auth.php`

Este archivo **no llama `session_start()`** — esa responsabilidad recae en cada archivo raíz. Esto evita llamadas duplicadas.

### Funciones disponibles

#### `isLogged(): bool`
Comprueba si hay una sesión activa válida.
```php
if (!isLogged()) {
    header('Location: ' . BASE_PATH . '/index.php');
    exit;
}
```

#### `requireLogin(): void`
Redirige a login si no hay sesión. Usar al inicio de páginas protegidas.
```php
// dashboard.php
session_start();
require_once __DIR__ . '/includes/auth.php';
requireLogin();
```

#### `currentUser(): array`
Devuelve los datos del usuario en sesión.
```php
$user = currentUser();
// ['id' => 1, 'nombre' => 'Admin', 'email' => '...', 'rol' => 'superadmin']
```

#### `hasRole(string ...$roles): bool`
Comprueba si el usuario tiene al menos uno de los roles indicados.
```php
if (hasRole('superadmin', 'admin')) {
    // mostrar opciones de administración
}
```

#### `requireRole(string ...$roles): void`
Aborta con 403 JSON si el usuario no tiene el rol requerido. Usar en endpoints de API.
```php
requireRole('superadmin', 'admin');
```

#### `login(string $email, string $password): array`
Valida credenciales contra la base de datos, crea la sesión y actualiza `ultimo_acceso`.
```php
$result = login('admin@clubfc.com', 'admin123');
// ['success' => true, 'user' => [...]]
// ['success' => false, 'message' => 'Credenciales incorrectas']
```

#### `logout(): void`
Destruye completamente la sesión (datos, cookie) y redirige a login.

#### `jsonResponse(mixed $data, int $code = 200): void`
Envía una respuesta JSON con el código HTTP apropiado y termina la ejecución.
```php
jsonResponse(['success' => true, 'id' => 42]);
jsonResponse(['error' => 'No encontrado'], 404);
```

#### `clean(string $val): string`
Sanitiza una cadena: `strip_tags` + `trim` + `htmlspecialchars` con UTF-8.
```php
$nombre = clean($_POST['nombre'] ?? '');
```

### Detección de BASE_PATH

`auth.php` define automáticamente la constante `BASE_PATH` al incluirse. Detecta si la aplicación está instalada en la raíz del servidor o en un subdirectorio:

```
http://localhost/              → BASE_PATH = ''
http://localhost/clubmanager/  → BASE_PATH = '/clubmanager'
http://tudominio.com/          → BASE_PATH = ''
```

Los archivos raíz usan `BASE_PATH` en sus redirecciones y el dashboard lo inyecta en `window.CM_CONFIG.basePath` para que el JavaScript construya las URLs de la API correctamente.

---

## 5. API REST interna

**Archivo:** `api/index.php`

### Convención de llamadas

```
Método  URL                                        Body
──────  ─────────────────────────────────────────  ────────────────
GET     /api/index.php?entity=jugadores            —
GET     /api/index.php?entity=jugadores&id=5       —
GET     /api/index.php?entity=jugadores&q=carlos   —
POST    /api/index.php?entity=jugadores            { nombre, dorsal, ... }
PUT     /api/index.php?entity=jugadores&id=5       { nombre, dorsal, ... }
DELETE  /api/index.php?entity=jugadores&id=5       —
PUT     /api/index.php?entity=multas&id=3&action=pagar    {}
PUT     /api/index.php?entity=partidos&id=2&action=resultado  { goles_favor, goles_contra, goleadores[] }
```

Todas las respuestas son JSON. Los errores incluyen `{ "error": "mensaje" }`.

### Endpoints detallados

---

#### `entity=dashboard` — GET

Devuelve el resumen completo para el panel principal.

**Respuesta:**
```json
{
  "jugadores_activos": 8,
  "total_partidos": 6,
  "tarjetas_total": 4,
  "multas_pendientes": "225.00",
  "equipos": 3,
  "victorias": 2,
  "empates": 1,
  "derrotas": 0,
  "proximos_partidos": [
    {
      "id": 4,
      "rival": "FC Montaña",
      "fecha": "2025-03-26 18:00:00",
      "competicion": "Liga Regional",
      "equipo_nombre": "Primer Equipo",
      "es_local": "0"
    }
  ],
  "alertas": [
    { "tipo": "lesion", "msg": "David García está lesionado", "icon": "🤕" },
    { "tipo": "multa",  "msg": "Multa €50 pendiente: Carlos Ruiz", "icon": "💰" }
  ],
  "goles_mes": [
    { "mes": "Mar", "goles": "6" }
  ],
  "top_goleadores": [
    { "nombre": "Carlos Ruiz", "goles": "4" },
    { "nombre": "Juan Pérez",  "goles": "2" }
  ]
}
```

---

#### `entity=jugadores`

**GET — Listar todos:**
```
GET /api/index.php?entity=jugadores
GET /api/index.php?entity=jugadores&q=carlos         (búsqueda por nombre/posición)
GET /api/index.php?entity=jugadores&equipo=1         (filtro por equipo)
```

Cada jugador incluye campos calculados: `goles`, `amarillas`, `rojas` (desde subconsultas).

**GET — Obtener uno:**
```
GET /api/index.php?entity=jugadores&id=5
```
Incluye además: `asistencias` (entrenamientos asistidos).

**POST — Crear:**
```json
{
  "nombre": "Carlos García",
  "dorsal": 9,
  "posicion": "Delantero",
  "edad": 22,
  "nacionalidad": "ES",
  "equipo_id": 1,
  "estado": "Activo",
  "valoracion": 7.5,
  "fecha_alta": "2025-01-15"
}
```

**PUT — Actualizar:**
```
PUT /api/index.php?entity=jugadores&id=5
```
Mismo body que POST.

**DELETE:**
```
DELETE /api/index.php?entity=jugadores&id=5
```

---

#### `entity=equipos`

**GET — Listar:**
Incluye `num_jugadores` (COUNT) y `entrenador_principal` (subconsulta).

**POST/PUT — Crear/Actualizar:**
```json
{
  "nombre": "Equipo C",
  "categoria": "Juvenil",
  "color": "#ff4d6d",
  "descripcion": "Equipo juvenil del club"
}
```

---

#### `entity=entrenadores`

**GET — Listar:**
Incluye `equipo_nombre` mediante JOIN.

**POST/PUT:**
```json
{
  "nombre": "Pedro Martínez",
  "email": "pedro@club.com",
  "telefono": "+34 600 000 001",
  "especialidad": "Principal",
  "equipo_id": 1,
  "fecha_inicio": "2025-01-01",
  "activo": 1
}
```

---

#### `entity=directivos`

**GET — Listar:**
Solo registros con `activo = 1`, ordenados por `fecha_inicio DESC`.

**DELETE:**
Hace **soft delete** (`UPDATE activo=0`), no elimina el registro.

**POST/PUT:**
```json
{
  "nombre": "Ana López",
  "cargo": "Vocal",
  "email": "ana@club.com",
  "telefono": "+34 600 000 002",
  "fecha_inicio": "2025-01-01"
}
```

---

#### `entity=partidos`

**GET — Listar:**
```
GET /api/index.php?entity=partidos              (todos)
GET /api/index.php?entity=partidos&estado=Programado
GET /api/index.php?entity=partidos&id=3         (incluye array 'goles')
```

**POST — Programar partido:**
```json
{
  "equipo_local_id": 1,
  "rival": "Club Rival",
  "es_local": 1,
  "fecha": "2025-04-10T18:00",
  "competicion": "Liga Regional"
}
```

**PUT — Editar datos:**
```json
{
  "equipo_local_id": 1,
  "rival": "Club Rival",
  "es_local": 1,
  "fecha": "2025-04-10T18:00",
  "competicion": "Liga Regional",
  "estado": "Aplazado",
  "notas": "Aplazado por lluvia"
}
```

**PUT action=resultado — Registrar resultado:**
```
PUT /api/index.php?entity=partidos&id=4&action=resultado
```
```json
{
  "goles_favor": 3,
  "goles_contra": 1,
  "goleadores": [
    { "jugador_id": 1, "minuto": 15, "tipo": "Normal" },
    { "jugador_id": 4, "minuto": 67, "tipo": "Penalty" }
  ]
}
```
Cambia el estado del partido a `Finalizado` automáticamente.

---

#### `entity=entrenamientos`

**GET — Listar:**
Incluye `equipo_nombre`, `total_convocados` y `total_asistieron` (agregados).

**POST/PUT:**
```json
{
  "equipo_id": 1,
  "fecha": "2025-04-12T10:00",
  "tipo": "Táctica",
  "duracion": 90,
  "lugar": "Campo Principal",
  "notas": "Trabajo de presión alta",
  "estado": "Programado"
}
```

---

#### `entity=tarjetas`

**GET — Listar:**
Incluye `jugador_nombre` (JOIN), `rival` y `partido_fecha` del partido vinculado.

**POST — Registrar:**
```json
{
  "jugador_id": 3,
  "tipo": "Amarilla",
  "partido_id": 4,
  "minuto": 55,
  "motivo": "Falta táctica",
  "sancion_partidos": 0,
  "fecha": "2025-04-10"
}
```
Si `sancion_partidos > 0`, actualiza automáticamente `jugadores.estado = 'Sancionado'`.

---

#### `entity=multas`

**GET — Listar:**
Resuelve `persona_nombre` con CASE según `tipo_persona` (consulta polimórfica).

**POST — Crear:**
```json
{
  "tipo_persona": "jugador",
  "persona_id": 2,
  "motivo": "Llegada tarde entrenamiento",
  "importe": 50.00,
  "fecha": "2025-04-01",
  "notas": ""
}
```

**PUT action=pagar:**
```
PUT /api/index.php?entity=multas&id=1&action=pagar
```
Cambia `estado = 'Pagada'` y registra `fecha_pago = NOW()`.

**PUT — Editar:**
```json
{
  "motivo": "Indisciplina grave",
  "importe": 200.00,
  "estado": "Anulada",
  "notas": "Error al registrar"
}
```

---

#### `entity=rendimiento`

**GET — Listar todos:**
Devuelve todos los jugadores con su **última evaluación** (JOIN a la fila con MAX(id) de rendimiento). Incluye goles, amarillas, rojas y asistencias calculados.

**GET — Historial de un jugador:**
```
GET /api/index.php?entity=rendimiento&id=5
```
Devuelve las últimas 10 evaluaciones del jugador.

**POST — Crear evaluación:**
```json
{
  "jugador_id": 1,
  "fecha": "2025-04-01",
  "velocidad": 9,
  "tecnica": 8,
  "fisico": 8,
  "tactica": 7,
  "actitud": 9,
  "valoracion_gen": 8.2,
  "notas": "Excelente temporada"
}
```
Actualiza también `jugadores.valoracion` con el nuevo valor.

---

#### `entity=estadisticas` — GET

Devuelve datos agregados de la temporada completa.

```json
{
  "totales": {
    "partidos": "3",
    "goles_favor": "6",
    "goles_contra": "2",
    "victorias": "2",
    "empates": "1",
    "derrotas": "0"
  },
  "goleadores": [
    { "nombre": "Carlos Ruiz", "posicion": "Delantero", "goles": "4" }
  ],
  "tarjetas_jugador": [
    { "nombre": "Carlos Ruiz", "amarillas": "1", "rojas": "0" }
  ],
  "clasificacion": [
    {
      "nombre": "Primer Equipo",
      "pj": "3", "g": "2", "emp": "1", "d": "0",
      "gf": "6", "gc": "2", "dif": "4", "pts": "7"
    }
  ]
}
```

---

#### `entity=usuarios`

Requiere rol `superadmin` o `admin`. Devuelve todos los campos excepto `password`.

**POST — Crear:**
```json
{
  "nombre": "Nuevo Admin",
  "email": "nuevo@club.com",
  "password": "contraseña_segura",
  "rol": "manager"
}
```
La contraseña se hashea con `password_hash(..., PASSWORD_DEFAULT)`.

**PUT — Editar:**
Si `password` está vacío, no se modifica. Si se incluye, se regenera el hash.

**DELETE:**
No permite eliminar la propia cuenta del usuario autenticado.

---

## 6. Frontend SPA

**Archivo:** `assets/js/app.js`

### Cliente API (`API`)

Objeto singleton que centraliza todas las peticiones AJAX:

```javascript
// Uso interno de Pages.*
const jugadores = await API.get('jugadores');
const jugadores = await API.get('jugadores', { params: { q: 'carlos' } });
const jugador   = await API.get('jugadores', { id: 5 });
await API.post('jugadores', { nombre: 'Test', posicion: 'Portero', ... });
await API.put('jugadores', 5, { nombre: 'Actualizado' });
await API.put('partidos',  3, { goles_favor: 2 }, 'resultado');
await API.delete('jugadores', 5);
```

La URL base se toma de `window.CM_CONFIG.apiUrl` (inyectado por PHP en `dashboard.php`), lo que garantiza compatibilidad con subdirectorios.

### Sistema de navegación

```javascript
navigate('jugadores');  // Muestra #section-jugadores, oculta el resto
                        // Activa el nav-link correspondiente
                        // Actualiza el título del topbar
                        // Llama a Pages.jugadores.load()
```

### Objeto `Pages`

Cada módulo es un objeto dentro de `Pages` con al menos estos métodos:

```javascript
Pages.jugadores = {
  data: [],           // Cache local de los registros (opcional)
  
  async load() { },   // Llamado por navigate() — carga datos y renderiza tabla
  
  async openForm(id = null) { },  // Abre modal de creación (id=null) o edición
  
  async save(id) { }, // Lee el formulario del modal y llama API.post o API.put
  
  edit(id)  { },      // Llama a openForm(id)
  
  del(id, nombre) {   // Muestra confirmDelete() y llama API.delete
    confirmDelete(`¿Eliminar a ${nombre}?`, async () => {
      await API.delete('jugadores', id);
      this.load();
    });
  }
};
```

### Modal

```javascript
Modal.open(htmlString);  // Inyecta HTML en #modal-content y muestra el overlay
Modal.close();           // Oculta el modal
```

El overlay se cierra al hacer clic fuera del modal o presionar `Escape`.

### Notificaciones Toast

```javascript
toast('✅ Jugador guardado');              // tipo 'success' por defecto
toast('❌ Error de conexión', 'danger');
toast('⚠️ Campo obligatorio', 'warning');
```

Desaparece automáticamente a los 3.5 segundos.

### Helpers de formato

```javascript
badge('Activo')        // → '<span class="badge badge-green">Activo</span>'
badge('Roja')          // → '<span class="badge badge-red">Roja</span>'
avatar('Carlos Ruiz')  // → '<div class="avatar">CR</div>'
avatarCell('Carlos Ruiz', 'Delantero')  // → avatar + nombre + subtítulo
fmtDate('2025-03-08 17:00:00')          // → '08 mar 2025'
fmtDateTime('2025-03-08 17:00:00')      // → '08 mar 2025, 17:00'
actionBtns('Pages.jugadores.edit(1)', 'Pages.jugadores.del(1)')  // → HTML botones
```

---

## 7. Sistema de estilos CSS

**Archivo:** `assets/css/main.css`

### Variables CSS (Design Tokens)

```css
:root {
  --bg:       #0a0d12;   /* Fondo principal */
  --bg2:      #10151e;   /* Fondo secundario (sidebar, inputs) */
  --bg3:      #161c28;   /* Fondo hover */
  --card:     #1a2030;   /* Fondo de tarjetas y modales */
  --border:   #252d3d;   /* Color de bordes */
  --accent:   #00e5a0;   /* Verde principal (éxito, acciones) */
  --accent2:  #0066ff;   /* Azul (info, links) */
  --accent3:  #ff4d6d;   /* Rojo (peligro, errores) */
  --accent4:  #f5a623;   /* Amarillo/naranja (advertencia) */
  --text:     #e8edf5;   /* Texto principal */
  --text2:    #7a8499;   /* Texto secundario */
  --text3:    #3a4255;   /* Texto deshabilitado */
  --sidebar-w: 250px;    /* Ancho del sidebar */
}
```

### Componentes principales

| Clase | Uso |
|-------|-----|
| `.card` | Contenedor con fondo y borde. `.card-header`, `.card-body`, `.card-body-0` |
| `.stat-card` | Tarjeta de estadística. Modificadores: `.stat-green`, `.stat-blue`, `.stat-red`, `.stat-yellow` |
| `.btn` | Botón base. Variantes: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-outline` |
| `.btn-sm` `.btn-xs` | Tamaños de botón |
| `.badge` | Etiqueta de estado. Variantes: `.badge-green`, `.badge-blue`, `.badge-red`, `.badge-yellow`, `.badge-gray`, `.badge-purple` |
| `.form-input` `.form-select` `.form-textarea` | Campos de formulario |
| `.form-row` | Grid 2 columnas para formularios |
| `.form-row3` | Grid 3 columnas |
| `.modal-overlay` `.modal` | Sistema de modales. `.modal-wide` para modales amplios |
| `.tabs` `.tab` | Navegación por pestañas |
| `.prog-track` `.prog-fill` | Barras de progreso |
| `.avatar` `.avatar-cell` | Avatar circular con iniciales |
| `.toast` | Notificaciones flotantes |
| `.empty-state` | Estado vacío de tablas |
| `.grid-2` `.grid-3` `.grid-4` | Layouts de rejilla |
| `.stats-row.stats-4` | Fila de 4 tarjetas de estadística |

### Responsive

| Breakpoint | Comportamiento |
|------------|---------------|
| `> 1024px` | Layout completo con sidebar fijo |
| `≤ 1024px` | Sidebar colapsado, accesible con botón hamburgesa |
| `≤ 640px` | Grid de stats en 2 columnas, formularios en 1 columna |

---

## 8. Módulos funcionales

### Flujo de un partido

```
1. Admin crea partido              → estado: 'Programado'
2. El día del partido              → estado: 'En juego' (manual)
3. Admin registra resultado        → estado: 'Finalizado'
   ├── Registra goles_favor / goles_contra
   └── Registra goleadores en goles_partido
```

### Flujo de una tarjeta con sanción

```
1. Admin registra tarjeta          → se crea en 'tarjetas'
   └── Si sancion_partidos > 0
       └── jugadores.estado = 'Sancionado'  (automático)
2. El jugador cumple sanción       → Admin cambia manualmente estado a 'Activo'
```

### Flujo de una multa

```
1. Admin crea multa                → estado: 'Pendiente'
2. La persona paga                 → Admin hace clic en "Cobrada"
   └── estado: 'Pagada', fecha_pago = NOW()
3. Error o anulación               → Admin edita: estado: 'Anulada'
```

### Flujo de evaluación de rendimiento

```
1. Admin abre perfil de jugador    → módulo 'rendimiento'
2. Hace clic en "Evaluar"          → modal con 5 atributos + valoración
3. Guarda evaluación               → INSERT en 'rendimiento'
   └── UPDATE jugadores.valoracion = valoracion_gen
```

---

## 9. Seguridad

### Autenticación
- Contraseñas almacenadas con `password_hash($pass, PASSWORD_DEFAULT)` (bcrypt, cost 10).
- Verificación con `password_verify()`, nunca comparación directa.
- Sesiones PHP estrictas: `session.use_strict_mode`.
- Cookie de sesión con `httponly` activo (no accesible desde JavaScript).

### Protección de rutas
- `requireLogin()` al inicio de todas las páginas protegidas.
- `requireRole('superadmin', 'admin')` en endpoints sensibles de la API.
- La API rechaza con HTTP 401 si no hay sesión activa.

### Prevención de inyección SQL
- **Todos** los queries usan **PDO Prepared Statements** con parámetros enlazados.
- No se construyen queries con concatenación de strings de entrada del usuario.

### Sanitización de input
- `clean()` aplica `strip_tags` + `trim` + `htmlspecialchars` a todos los datos de entrada.
- Valores enteros se castean con `(int)`, decimales con `(float)`.

### Cabeceras de seguridad HTTP (`.htaccess`)
```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### Protección de directorios sensibles
- `.htaccess` bloquea el acceso HTTP directo a `config/` e `includes/`.
- La configuración de Nginx equivalente se documenta en [README.md](README.md).

### Recomendaciones adicionales para producción
- Deshabilitar `display_errors` en `php.ini`.
- Usar un usuario MySQL con mínimos privilegios (`SELECT, INSERT, UPDATE, DELETE`).
- Activar HTTPS con Let's Encrypt.
- Configurar backups automáticos de la base de datos.

---

## 10. Configuración y entornos

### `config/database.php`

```php
define('DB_HOST',    'localhost');
define('DB_USER',    'root');
define('DB_PASS',    '');
define('DB_NAME',    'clubmanager');
define('DB_CHARSET', 'utf8mb4');

define('APP_NAME',    'ClubManager Pro');
define('APP_VERSION', '1.0');

function getDB(): PDO { /* singleton PDO */ }
```

### Variables de entorno (producción recomendada)

```php
// config/database.php — versión producción
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'clubmanager');
```

```bash
# Apache VirtualHost
SetEnv DB_HOST  localhost
SetEnv DB_USER  clubmanager_user
SetEnv DB_PASS  contraseña_segura
SetEnv DB_NAME  clubmanager
```

### `window.CM_CONFIG` (inyectado en `dashboard.php`)

```javascript
window.CM_CONFIG = {
  basePath: '/clubmanager',            // '' si está en raíz
  apiUrl:   '/clubmanager/api/index.php',
  user: {
    nombre: 'Admin Principal',
    rol:    'superadmin'
  }
};
```

---

## 11. Guía de extensión

### Añadir un nuevo módulo

**Ejemplo: módulo "Médico" para seguimiento de lesiones**

#### 1. Crear la tabla en MySQL

```sql
CREATE TABLE lesiones (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    jugador_id   INT NOT NULL,
    tipo         VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_alta   DATE NULL,
    descripcion  TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE
);
```

#### 2. Añadir el endpoint en `api/index.php`

```php
case 'lesiones':
    if ($method === 'GET') {
        $rows = $db->query(
            "SELECT l.*, j.nombre as jugador_nombre 
             FROM lesiones l JOIN jugadores j ON l.jugador_id=j.id 
             ORDER BY l.fecha_inicio DESC"
        )->fetchAll();
        jsonResponse($rows);
    }
    elseif ($method === 'POST') {
        $stmt = $db->prepare(
            "INSERT INTO lesiones (jugador_id, tipo, fecha_inicio, descripcion) VALUES (?,?,?,?)"
        );
        $stmt->execute([
            (int)$body['jugador_id'],
            clean($body['tipo']),
            $body['fecha_inicio'],
            clean($body['descripcion'] ?? '')
        ]);
        jsonResponse(['success' => true, 'id' => $db->lastInsertId()]);
    }
    // ... PUT, DELETE
    break;
```

#### 3. Añadir el enlace en el sidebar de `dashboard.php`

```html
<div class="nav-section">Médico</div>
<a class="nav-link" data-page="lesiones" onclick="navigate('lesiones')">
  <span class="ni">🩺</span> Lesiones
</a>
```

#### 4. Añadir la sección HTML en `dashboard.php`

```html
<section class="page-section" id="section-lesiones" style="display:none">
  <div class="card">
    <div class="card-header">
      <span class="card-title">Historial de Lesiones</span>
      <button class="btn btn-primary btn-sm" onclick="Pages.lesiones.openForm()">+ Nueva Lesión</button>
    </div>
    <div class="card-body-0 table-wrap">
      <table>
        <thead>
          <tr>
            <th>Jugador</th><th>Tipo</th><th>Inicio</th><th>Alta</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody id="lesiones-tbody"></tbody>
      </table>
    </div>
  </div>
</section>
```

#### 5. Añadir la lógica en `app.js`

```javascript
Pages.lesiones = {
  async load() {
    const tbody = document.getElementById('lesiones-tbody');
    const data  = await API.get('lesiones');
    tbody.innerHTML = data.map(l => `
      <tr>
        <td>${avatarCell(l.jugador_nombre)}</td>
        <td>${l.tipo}</td>
        <td>${fmtDate(l.fecha_inicio)}</td>
        <td>${l.fecha_alta ? fmtDate(l.fecha_alta) : badge('En curso','red')}</td>
        <td>${actionBtns(
          `Pages.lesiones.edit(${l.id})`,
          `Pages.lesiones.del(${l.id})`
        )}</td>
      </tr>`).join('');
  },

  async openForm(id = null) {
    const jugadores = await API.get('jugadores');
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title">🩺 ${id ? 'Editar' : 'Nueva'} Lesión</div>
        <button class="modal-close" onclick="Modal.close()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Jugador</label>
          <select id="fl_jug" class="form-select">
            ${jugadores.map(j => `<option value="${j.id}">${j.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tipo de lesión</label>
            <input id="fl_tipo" class="form-input" placeholder="Rotura fibrilar...">
          </div>
          <div class="form-group">
            <label class="form-label">Fecha inicio</label>
            <input id="fl_fecha" class="form-input" type="date">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <textarea id="fl_desc" class="form-textarea"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Pages.lesiones.save(${id || 'null'})">💾 Guardar</button>
      </div>`);
  },

  async save(id) {
    const body = {
      jugador_id:   document.getElementById('fl_jug').value,
      tipo:         document.getElementById('fl_tipo').value,
      fecha_inicio: document.getElementById('fl_fecha').value,
      descripcion:  document.getElementById('fl_desc').value,
    };
    await (id ? API.put('lesiones', id, body) : API.post('lesiones', body));
    Modal.close();
    toast('✅ Lesión guardada');
    this.load();
  },

  edit(id) { this.openForm(id); },

  del(id) {
    confirmDelete('¿Eliminar este registro?', async () => {
      await API.delete('lesiones', id);
      toast('🗑️ Eliminado');
      this.load();
    });
  }
};
```

#### 6. Registrar en el mapa de títulos de `navigate()`

```javascript
const titles = {
  // ... existentes ...
  lesiones: 'Historial de Lesiones',
};
```

---

## 12. Referencia de errores comunes

### Error de conexión a la base de datos

**Síntoma:** Página en blanco o mensaje `Error de conexión: SQLSTATE[HY000]`

**Causas y soluciones:**
```
1. Credenciales incorrectas en config/database.php
   → Verificar DB_USER, DB_PASS, DB_HOST, DB_NAME

2. MySQL no está corriendo
   → Windows: Abrir XAMPP/Laragon Panel → Start MySQL
   → Linux: sudo systemctl start mysql

3. Base de datos no creada
   → Importar database.sql en phpMyAdmin o mysql CLI
```

### Error 403 en assets

**Síntoma:** CSS o JS no cargan, consola muestra 403

**Causa:** Accediendo desde un subdirectorio sin `.htaccess` activo.

**Solución:**
```bash
# Verificar que mod_rewrite está activo
sudo a2enmod rewrite
sudo systemctl restart apache2

# Verificar AllowOverride en el VirtualHost
<Directory /var/www/html>
    AllowOverride All
</Directory>
```

### La API devuelve HTML en lugar de JSON

**Síntoma:** `fetch()` falla con `SyntaxError: Unexpected token`

**Causas:**
```
1. PHP muestra un error antes de que se envíe el header Content-Type
   → Revisar logs de Apache: tail -f /var/log/apache2/error.log

2. session_start() llamado dos veces
   → Verificar que auth.php NO llama session_start()
   → Solo los archivos raíz (index.php, dashboard.php, etc.) lo llaman

3. Error de sintaxis PHP
   → php -l api/index.php
```

### Login no redirige al dashboard

**Síntoma:** El formulario se envía pero vuelve al login sin error

**Causas:**
```
1. BASE_PATH mal calculado → redirige a URL incorrecta
   → Añadir var_dump(BASE_PATH) temporalmente en auth.php para depurar

2. Cookies de sesión bloqueadas por el navegador
   → Verificar que no hay conflicto de dominios/puertos

3. MySQL devuelve el hash incorrecto
   → Verificar: SELECT password FROM usuarios WHERE email='admin@clubfc.com'
   → El hash debe empezar con '$2y$10$'
```

### Caracteres especiales corruptos (acentos, ñ)

**Síntoma:** Nombres con tildes o ñ se guardan o muestran mal

**Solución:**
```php
// config/database.php — ya incluido en getDB()
$dsn = "mysql:host=localhost;dbname=clubmanager;charset=utf8mb4";
```
```sql
-- Verificar el cotejamiento de la BD
ALTER DATABASE clubmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
```apache
# .htaccess
AddDefaultCharset UTF-8
```

### El módulo de usuarios no aparece en el menú

**Síntoma:** El enlace "Usuarios Admin" no se muestra en el sidebar

**Causa:** El usuario autenticado no tiene rol `superadmin` ni `admin`.

**Solución:**
```sql
UPDATE usuarios SET rol = 'superadmin' WHERE email = 'admin@clubfc.com';
```

---

