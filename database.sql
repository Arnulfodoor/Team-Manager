

CREATE DATABASE IF NOT EXISTS clubmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clubmanager;


CREATE TABLE IF NOT EXISTS usuarios (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    rol         ENUM('superadmin','admin','manager','readonly') DEFAULT 'manager',
    activo      TINYINT(1) DEFAULT 1,
    ultimo_acceso DATETIME NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS equipos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    categoria   VARCHAR(50),
    color       VARCHAR(10) DEFAULT '#00e5a0',
    descripcion TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS entrenadores (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    email         VARCHAR(150),
    telefono      VARCHAR(30),
    especialidad  VARCHAR(80),
    equipo_id     INT NULL,
    fecha_inicio  DATE,
    activo        TINYINT(1) DEFAULT 1,
    foto          VARCHAR(255) DEFAULT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS jugadores (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    dorsal        TINYINT UNSIGNED,
    posicion      ENUM('Portero','Defensa','Centrocampista','Delantero') NOT NULL,
    edad          TINYINT UNSIGNED,
    nacionalidad  VARCHAR(5) DEFAULT 'ES',
    equipo_id     INT NULL,
    estado        ENUM('Activo','Lesionado','Sancionado','Inactivo') DEFAULT 'Activo',
    valoracion    DECIMAL(3,1) DEFAULT 7.0,
    foto          VARCHAR(255) DEFAULT NULL,
    fecha_alta    DATE,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS directivos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    cargo       VARCHAR(80) NOT NULL,
    email       VARCHAR(150),
    telefono    VARCHAR(30),
    fecha_inicio DATE,
    activo      TINYINT(1) DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS partidos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    equipo_local_id INT NULL,
    rival           VARCHAR(100) NOT NULL,
    es_local        TINYINT(1) DEFAULT 1,
    fecha           DATETIME NOT NULL,
    competicion     VARCHAR(100),
    estado          ENUM('Programado','En juego','Finalizado','Aplazado','Cancelado') DEFAULT 'Programado',
    goles_favor     TINYINT UNSIGNED DEFAULT NULL,
    goles_contra    TINYINT UNSIGNED DEFAULT NULL,
    notas           TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_local_id) REFERENCES equipos(id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS goles_partido (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    partido_id  INT NOT NULL,
    jugador_id  INT NOT NULL,
    minuto      TINYINT UNSIGNED,
    tipo        ENUM('Normal','Penalty','Falta','Autogol') DEFAULT 'Normal',
    FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,
    FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS entrenamientos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id   INT NULL,
    fecha       DATETIME NOT NULL,
    tipo        ENUM('Táctica','Físico','Técnica','Partido Interno','Recuperación','Porteros') DEFAULT 'Técnica',
    duracion    SMALLINT UNSIGNED DEFAULT 90,
    lugar       VARCHAR(150),
    notas       TEXT,
    estado      ENUM('Programado','Completado','Cancelado') DEFAULT 'Programado',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS asistencia_entrenamiento (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    entrenamiento_id  INT NOT NULL,
    jugador_id        INT NOT NULL,
    asistio           TINYINT(1) DEFAULT 1,
    justificacion     VARCHAR(255),
    UNIQUE KEY unique_asistencia (entrenamiento_id, jugador_id),
    FOREIGN KEY (entrenamiento_id) REFERENCES entrenamientos(id) ON DELETE CASCADE,
    FOREIGN KEY (jugador_id)       REFERENCES jugadores(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS tarjetas (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    jugador_id  INT NOT NULL,
    partido_id  INT NULL,
    tipo        ENUM('Amarilla','Roja','Doble Amarilla') NOT NULL,
    minuto      TINYINT UNSIGNED,
    motivo      VARCHAR(255),
    sancion_partidos TINYINT UNSIGNED DEFAULT 0,
    fecha       DATE NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE,
    FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS multas (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    tipo_persona ENUM('jugador','entrenador','directivo') NOT NULL,
    persona_id  INT NOT NULL,
    motivo      VARCHAR(255) NOT NULL,
    importe     DECIMAL(8,2) NOT NULL,
    fecha       DATE NOT NULL,
    estado      ENUM('Pendiente','Pagada','Anulada') DEFAULT 'Pendiente',
    fecha_pago  DATE NULL,
    notas       TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS rendimiento (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    jugador_id      INT NOT NULL,
    fecha           DATE NOT NULL,
    velocidad       TINYINT UNSIGNED DEFAULT 5,
    tecnica         TINYINT UNSIGNED DEFAULT 5,
    fisico          TINYINT UNSIGNED DEFAULT 5,
    tactica         TINYINT UNSIGNED DEFAULT 5,
    actitud         TINYINT UNSIGNED DEFAULT 5,
    valoracion_gen  DECIMAL(3,1) DEFAULT 7.0,
    notas           TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS noticias (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    titulo      VARCHAR(200) NOT NULL,
    contenido   TEXT,
    tipo        ENUM('Aviso','Noticia','Urgente') DEFAULT 'Noticia',
    activo      TINYINT(1) DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Super Admin',      'admin@clubfc.com',   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin'),
('Manager Deportivo','manager@clubfc.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager');


INSERT INTO equipos (nombre, categoria, color) VALUES
('Primer Equipo',  'Senior',   '#00e5a0'),
('Equipo B',       'Sub-23',   '#0066ff'),
('Juvenil A',      'Juvenil',  '#ff4d6d');


INSERT INTO entrenadores (nombre, email, telefono, especialidad, equipo_id, fecha_inicio) VALUES
('Miguel Fernández', 'miguel@clubfc.com', '+34 600 111 222', 'Principal',           1, '2022-07-01'),
('Luis Sánchez',     'luis@clubfc.com',   '+34 600 333 444', 'Preparación Física',  1, '2023-01-15'),
('Ana Torres',       'ana@clubfc.com',    '+34 600 555 666', 'Porteros',            2, '2023-06-01');


INSERT INTO directivos (nombre, cargo, email, telefono, fecha_inicio) VALUES
('Roberto Castillo', 'Presidente',    'presidente@clubfc.com', '+34 600 100 200', '2020-01-01'),
('Elena Martín',     'Vicepresidente','vice@clubfc.com',       '+34 600 300 400', '2020-01-01'),
('Pedro Vega',       'Tesorero',      'tesorero@clubfc.com',   '+34 600 500 600', '2021-06-01'),
('Laura Díaz',       'Secretaria',    'secretaria@clubfc.com', '+34 600 700 800', '2021-06-01');


INSERT INTO jugadores (nombre, dorsal, posicion, edad, nacionalidad, equipo_id, estado, valoracion, fecha_alta) VALUES
('Carlos Ruiz',    9,  'Delantero',       24, 'ES', 1, 'Activo',   8.2, '2022-07-01'),
('Marco López',    1,  'Portero',         28, 'ES', 1, 'Activo',   7.8, '2021-07-01'),
('David García',   4,  'Defensa',         22, 'ES', 1, 'Lesionado',6.5, '2023-01-15'),
('Sergio Mora',    8,  'Centrocampista',  26, 'BR', 1, 'Activo',   7.9, '2022-01-10'),
('Juan Pérez',     11, 'Delantero',       21, 'AR', 1, 'Activo',   7.2, '2023-07-01'),
('Luis Gómez',     3,  'Defensa',         25, 'ES', 1, 'Activo',   7.0, '2021-07-01'),
('Pablo Hernández',7,  'Centrocampista',  23, 'ES', 2, 'Activo',   7.4, '2023-07-01'),
('Raúl Castro',    10, 'Delantero',       20, 'CO', 2, 'Activo',   7.6, '2024-01-01'),
('Andrés Molina',  2,  'Defensa',         24, 'ES', 2, 'Activo',   6.8, '2023-07-01'),
('Fernando Ríos',  6,  'Centrocampista',  22, 'MX', 2, 'Sancionado',7.1,'2024-01-01');


INSERT INTO partidos (equipo_local_id, rival, es_local, fecha, competicion, estado, goles_favor, goles_contra) VALUES
(1, 'Club Rival FC',     1, '2025-03-08 17:00:00', 'Liga Regional', 'Finalizado', 3, 1),
(1, 'Deportivo Norte',   0, '2025-03-12 19:00:00', 'Liga Regional', 'Finalizado', 1, 1),
(1, 'Athletic Sur',      1, '2025-03-19 17:30:00', 'Copa Local',    'Finalizado', 2, 0),
(1, 'FC Montaña',        0, '2025-03-26 18:00:00', 'Liga Regional', 'Programado', NULL, NULL),
(2, 'Juvenil Oeste',     1, '2025-03-28 16:00:00', 'Liga Sub-23',   'Programado', NULL, NULL),
(1, 'Real Comarca',      1, '2025-04-05 17:00:00', 'Liga Regional', 'Programado', NULL, NULL);


INSERT INTO goles_partido (partido_id, jugador_id, minuto, tipo) VALUES
(1, 1, 15, 'Normal'), (1, 1, 67, 'Normal'), (1, 4, 82, 'Penalty'),
(2, 5, 45, 'Normal'),
(3, 1, 22, 'Normal'), (3, 5, 77, 'Falta');


INSERT INTO entrenamientos (equipo_id, fecha, tipo, duracion, lugar, estado) VALUES
(1, '2025-03-17 10:00:00', 'Táctica',    90, 'Campo Principal', 'Completado'),
(1, '2025-03-19 10:00:00', 'Físico',     75, 'Gimnasio',        'Completado'),
(2, '2025-03-20 09:00:00', 'Técnica',    60, 'Campo B',         'Completado'),
(1, '2025-03-25 10:00:00', 'Partido Interno', 90, 'Campo Principal', 'Programado'),
(1, '2025-03-27 10:00:00', 'Táctica',   90, 'Campo Principal', 'Programado');


INSERT INTO tarjetas (jugador_id, partido_id, tipo, minuto, motivo, sancion_partidos, fecha) VALUES
(1, 1, 'Amarilla',       34, 'Falta táctica',    0, '2025-03-08'),
(3, 1, 'Amarilla',       56, 'Protestas',        0, '2025-03-08'),
(5, 2, 'Roja',           80, 'Doble amarilla',   1, '2025-03-12'),
(10,NULL,'Amarilla',     NULL,'Conducta antideportiva',0,'2025-03-20');


INSERT INTO multas (tipo_persona, persona_id, motivo, importe, fecha, estado) VALUES
('jugador',    1,  'Llegada tarde entrenamiento',  50.00,  '2025-03-10', 'Pendiente'),
('jugador',    3,  'Indisciplina',                150.00,  '2025-03-05', 'Pagada'),
('jugador',    5,  'Acumulación de tarjetas',     100.00,  '2025-03-12', 'Pendiente'),
('entrenador', 2,  'Ausencia sin justificar',      75.00,  '2025-03-15', 'Pendiente');


INSERT INTO rendimiento (jugador_id, fecha, velocidad, tecnica, fisico, tactica, actitud, valoracion_gen) VALUES
(1, '2025-03-01', 9, 8, 8, 7, 9, 8.2),
(2, '2025-03-01', 6, 8, 7, 8, 9, 7.8),
(3, '2025-03-01', 7, 6, 6, 7, 7, 6.5),
(4, '2025-03-01', 8, 8, 8, 9, 8, 7.9),
(5, '2025-03-01', 8, 7, 7, 7, 7, 7.2);


INSERT INTO noticias (titulo, contenido, tipo) VALUES
('Bienvenidos a Team Manager', 'Sistema de gestión deportiva instalado correctamente.', 'Aviso'),
('Próximo partido importante', 'El 26 de marzo jugamos fuera contra FC Montaña. Concentración a las 15:00.', 'Noticia');
