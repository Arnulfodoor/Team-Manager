<div align="center">

# ⚽ Team Manager

**Sistema completo de gestión para clubes deportivos**



*Gestiona jugadores, equipos, partidos, entrenamientos, tarjetas, multas y rendimiento desde un único panel de control.*

<img width="1361" height="641" alt="image" src="https://github.com/user-attachments/assets/d764ca40-1ea1-41e5-a078-8b36328ee1e3" />

<img width="1067" height="609" alt="image" src="https://github.com/user-attachments/assets/e161f2cd-814b-438d-bdd1-c1ba0ab38b1c" />

<img width="1087" height="612" alt="image" src="https://github.com/user-attachments/assets/3093e9c3-e36b-4bc8-ba26-d466977fe555" />

<img width="1066" height="551" alt="image" src="https://github.com/user-attachments/assets/495eaca4-a4dd-4c0b-b319-ef411a1abeb6" />

---

</div>



## ✨ Características

| Módulo | Descripción |
|--------|-------------|
| 🔐 **Autenticación** | Login seguro con sesiones PHP y contraseñas bcrypt |
| 👤 **Jugadores** | CRUD completo con búsqueda, filtros y perfil detallado |
| 🧑‍🏫 **Entrenadores** | Gestión del cuerpo técnico por especialidad y equipo |
| 💼 **Directivos** | Junta directiva con cargos y datos de contacto |
| 🛡️ **Equipos** | Multi-equipo con categorías y colores personalizados |
| ⚽ **Partidos** | Programación, resultados y registro de goleadores |
| 🏃 **Entrenamientos** | Sesiones con tipo, duración, lugar y asistencia |
| 🟨 **Tarjetas** | Amarillas, rojas y sanciones automáticas |
| 💰 **Multas** | Control financiero con seguimiento de cobros |
| 📈 **Rendimiento** | Evaluaciones periódicas con 5 atributos por jugador |
| 📊 **Estadísticas** | Clasificación interna, goleadores y análisis de temporada |
| 🔑 **Usuarios** | Gestión de administradores con 4 niveles de rol |

### Puntos clave

- ⚡ **Sin dependencias externas** — cero frameworks, cero npm, cero composer
- 📱 **Diseño responsive** — funciona en escritorio, tablet y móvil
- 🎨 **Interfaz moderna** — tema oscuro con paleta personalizada
- 🔒 **Seguro por defecto** — bcrypt, sesiones estrictas, cabeceras de seguridad HTTP
- 🌍 **Multi-entorno** — funciona en raíz `/` o en subdirectorio `/team-manager/` automáticamente
- 🗄️ **Base de datos relacional** — esquema normalizado con foreign keys e integridad referencial

---

## 🛠️ Tecnologías

### Backend
- **PHP 8.0+** — Lógica de servidor, sesiones y router de API REST
- **PDO** — Capa de abstracción de base de datos con prepared statements
- **MySQL 8.0+ / MariaDB 10.6+** — Motor de base de datos relacional

### Frontend
- **HTML5 + CSS3** — Estructura y estilos sin frameworks CSS externos
- **Vanilla JavaScript ES2020** — Interactividad SPA y llamadas AJAX fetch
- **Google Fonts** — Bebas Neue + DM Sans + DM Mono

### Infraestructura
- **Apache 2.4+** con `mod_rewrite` (o Nginx equivalente)
- Compatible con **XAMPP**, **Laragon**, **WAMP** para desarrollo local

---

### Requisitos del sistema

| Requisito | Mínimo | Recomendado |
|-----------|--------|-------------|
| PHP | 8.0 | 8.2+ |
| MySQL | 8.0 | 8.0+ |
| MariaDB | 10.6 | 10.11+ |
| Apache | 2.4 | 2.4+ |
| Nginx | 1.18 | 1.24+ |

**Extensiones PHP requeridas:** `pdo`, `pdo_mysql`, `session`, `json`, `mbstring`


---


## 🧩 Módulos del sistema

### 🏠 Dashboard
Panel principal con métricas en tiempo real: jugadores activos, partidos totales, tarjetas, multas pendientes, próximos partidos, alertas automáticas (lesiones, multas sin cobrar, sanciones activas), gráfico de goles por mes y top 5 goleadores de la temporada.

### 👤 Jugadores
Gestión completa de la plantilla con campos: nombre, dorsal, posición (Portero / Defensa / Centrocampista / Delantero), edad, nacionalidad, equipo asignado, estado (Activo / Lesionado / Sancionado / Inactivo), valoración 1-10 y fecha de alta. Búsqueda en tiempo real. Indicadores de goles y tarjetas por jugador.

### 🧑‍🏫 Entrenadores
Cuerpo técnico con especialidades: Principal, Ayudante, Porteros, Preparación Física, Analista. Asignación por equipo, email, teléfono y fecha de incorporación.

### 💼 Directivos
Junta directiva con cargos: Presidente, Vicepresidente, Secretario/a, Tesorero/a, Vocal, Director Deportivo. Datos de contacto completos.

### 🛡️ Equipos
Soporte multi-equipo: Senior, Sub-23, Juvenil, Cadete, Infantil, Alevín. Color distintivo personalizable y descripción libre.

### ⚽ Partidos
Programación con equipo, rival, fecha, competición y condición (local/visitante). Registro de resultados con goles y goleadores detallados (minuto y tipo: Normal, Penalty, Falta, Autogol). Historial separado de partidos programados y finalizados.

### 🏃 Entrenamientos
Sesiones con tipo (Táctica, Físico, Técnica, Partido Interno, Recuperación, Porteros), duración, lugar y notas. Registro de asistencia individual por jugador con justificación de ausencias.

### 🟨 Tarjetas
Registro de amarillas, rojas y dobles amarillas vinculadas a partido y minuto. Sanciones en número de partidos con actualización automática del estado del jugador. Estadísticas globales en tiempo real.

### 💰 Multas
Sanciones económicas para jugadores, entrenadores y directivos. Motivos predefinidos. Flujo: `Pendiente → Pagada / Anulada`. Resumen financiero con totales en tiempo real.

### 📈 Rendimiento
Evaluaciones periódicas con 5 atributos numéricos del 1 al 10: Velocidad, Técnica, Físico, Táctica y Actitud. Valoración general y notas libres. Historial de evaluaciones por jugador. Visualización con barras de progreso.

### 📊 Estadísticas
Resumen de temporada: PJ, victorias, empates, derrotas, GF, GC. Top 10 goleadores con barras comparativas. Ranking de tarjetas por jugador. Tabla de clasificación interna calculada automáticamente desde los resultados registrados.

### 🔑 Usuarios Admin
Gestión de cuentas administrativas con 4 roles. Solo accesible para `superadmin` y `admin`. Soporte para cambio de contraseña, activar/desactivar cuentas y registro de último acceso.

---

## 🔑 Roles y permisos

| Rol | Dashboard | CRUD General | Multas | Tarjetas | Usuarios Admin |
|-----|:---------:|:------------:|:------:|:--------:|:--------------:|
| `superadmin` | ✅ | ✅ Lec/Esc | ✅ | ✅ | ✅ |
| `admin` | ✅ | ✅ Lec/Esc | ✅ | ✅ | ✅ |
| `manager` | ✅ | ✅ Lec/Esc | ✅ | ✅ | ❌ |
| `readonly` | ✅ | 👁️ Solo lectura | 👁️ | 👁️ | ❌ |

---

## 🔐 Credenciales demo

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@clubfc.com` | `password` | superadmin |
| `manager@clubfc.com` | `password` | manager |

> ⚠️ **Importante:** Cambia estas credenciales antes de desplegar en producción.
>
> ```bash
> php -r "echo password_hash('nueva_contraseña', PASSWORD_DEFAULT);"
> ```
> ```sql
> UPDATE usuarios SET password = '$2y$10$...' WHERE email = 'admin@clubfc.com';
> ```

---

## 🔌 API REST

Todos los endpoints son internos (requieren sesión activa) y se invocan desde `app.js` mediante `fetch`.

**URL base:** `/api/index.php?entity={entidad}`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `?entity=dashboard` | Estadísticas del panel |
| `GET/POST/PUT/DELETE` | `?entity=jugadores` | CRUD jugadores |
| `GET/POST/PUT/DELETE` | `?entity=equipos` | CRUD equipos |
| `GET/POST/PUT/DELETE` | `?entity=entrenadores` | CRUD entrenadores |
| `GET/POST/PUT/DELETE` | `?entity=directivos` | CRUD directivos |
| `GET/POST/PUT/DELETE` | `?entity=partidos` | CRUD partidos |
| `PUT` | `?entity=partidos&action=resultado&id={id}` | Registrar resultado |
| `GET/POST/PUT/DELETE` | `?entity=entrenamientos` | CRUD entrenamientos |
| `GET/POST/DELETE` | `?entity=tarjetas` | Registro de tarjetas |
| `GET/POST/PUT/DELETE` | `?entity=multas` | CRUD multas |
| `PUT` | `?entity=multas&action=pagar&id={id}` | Marcar multa como pagada |
| `GET/POST` | `?entity=rendimiento` | Evaluaciones de rendimiento |
| `GET` | `?entity=estadisticas` | Estadísticas de temporada |
| `GET/POST/PUT/DELETE` | `?entity=usuarios` | CRUD admins (superadmin/admin) |

📖 Ver documentación completa de cada endpoint en [DOCUMENTATION.md](https://github.com/Arnulfodoor/Team-Manager/blob/main/documentation.md).

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**.




---
