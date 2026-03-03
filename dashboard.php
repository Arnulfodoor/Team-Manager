<?php
session_start();
require_once __DIR__ . '/includes/auth.php';
requireLogin();
$user = currentUser();
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Team Manager</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="<?= BASE_PATH ?>/assets/css/main.css">
</head>
<body>

<div class="app-layout">

  <!-- SIDEBAR -->
  <nav class="sidebar" id="sidebar">
    <div class="sidebar-logo">
      <div class="brand">⚽ Team Manager</div>

    </div>

    <div class="sidebar-nav">
      <div class="nav-section">Principal</div>
      <a class="nav-link" data-page="dashboard"      onclick="navigate('dashboard')"><span class="ni">🏠</span> Dashboard</a>
      <a class="nav-link" data-page="equipos"        onclick="navigate('equipos')"><span class="ni">🛡️</span> Equipos</a>
      <a class="nav-link" data-page="partidos"       onclick="navigate('partidos')"><span class="ni">⚽</span> Partidos</a>
      <a class="nav-link" data-page="entrenamientos" onclick="navigate('entrenamientos')"><span class="ni">🏃</span> Entrenamientos</a>

      <div class="nav-section">Personas</div>
      <a class="nav-link" data-page="jugadores"      onclick="navigate('jugadores')"><span class="ni">👤</span> Jugadores</a>
      <a class="nav-link" data-page="entrenadores"   onclick="navigate('entrenadores')"><span class="ni">🧑‍🏫</span> Entrenadores</a>
      <a class="nav-link" data-page="directivos"     onclick="navigate('directivos')"><span class="ni">💼</span> Directivos</a>

      <div class="nav-section">Control</div>
      <a class="nav-link" data-page="tarjetas"       onclick="navigate('tarjetas')"><span class="ni">🟨</span> Tarjetas</a>
      <a class="nav-link" data-page="multas"         onclick="navigate('multas')"><span class="ni">💰</span> Multas</a>
      <a class="nav-link" data-page="rendimiento"    onclick="navigate('rendimiento')"><span class="ni">📈</span> Rendimiento</a>
      <a class="nav-link" data-page="estadisticas"   onclick="navigate('estadisticas')"><span class="ni">📊</span> Estadísticas</a>

      <?php if (hasRole('superadmin','admin')): ?>
      <div class="nav-section">Administración</div>
      <a class="nav-link" data-page="usuarios"       onclick="navigate('usuarios')"><span class="ni">🔐</span> Usuarios</a>
      <?php endif; ?>
    </div>

    <div class="sidebar-footer">
      <div class="user-pill">
        <div class="user-av"><?= strtoupper(substr($user['nombre'],0,1)) ?></div>
        <div style="flex:1;min-width:0">
          <div class="user-name"><?= htmlspecialchars($user['nombre']) ?></div>
          <div class="user-role"><?= htmlspecialchars($user['rol']) ?></div>
        </div>
        <a href="/logout.php" class="btn btn-outline btn-sm" title="Cerrar sesión">⏏</a>
      </div>
    </div>
  </nav>

  <div class="main-content">

    <header class="topbar">
      <div class="d-flex align-center gap-3">
        <button class="btn btn-outline btn-icon" id="menu-toggle" onclick="document.getElementById('sidebar').classList.toggle('open')" style="display:none">☰</button>
        <div class="topbar-title" id="page-title">Dashboard</div>
      </div>
      <div class="topbar-right" id="topbar-actions">
      </div>
    </header>

    <div class="page-content">


      <section class="page-section" id="section-dashboard">
        <div class="stats-row stats-4">
          <div class="stat-card stat-green">
            <div class="stat-icon">👤</div>
            <div class="stat-value" id="stat-jugadores">—</div>
            <div class="stat-label">Jugadores Activos</div>
          </div>
          <div class="stat-card stat-blue">
            <div class="stat-icon">⚽</div>
            <div class="stat-value" id="stat-partidos">—</div>
            <div class="stat-label">Partidos Totales</div>
          </div>
          <div class="stat-card stat-red">
            <div class="stat-icon">🟨</div>
            <div class="stat-value" id="stat-tarjetas">—</div>
            <div class="stat-label">Tarjetas</div>
          </div>
          <div class="stat-card stat-yellow">
            <div class="stat-icon">💰</div>
            <div class="stat-value" id="stat-multas">—</div>
            <div class="stat-label">Multas Pendientes</div>
          </div>
        </div>

         <div class="card mb-3">
          <div class="card-body" style="padding:14px 20px">
            <span class="text-muted text-sm">Temporada actual: </span>
            <span class="bebas text-accent" style="font-size:18px" id="stat-victorias">—</span>
          </div>
        </div>

        <div class="grid-2 mb-3">
          <div class="card">
            <div class="card-header">
              <span class="card-title">📅 Próximos Partidos</span>
              <button class="btn btn-outline btn-sm" onclick="navigate('partidos')">Ver todos</button>
            </div>
            <div class="card-body-0 table-wrap">
              <table><tbody id="dash-proximos">
                <tr><td colspan="5" class="loading-overlay"><div class="spinner"></div></td></tr>
              </tbody></table>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><span class="card-title">⚠️ Alertas</span></div>
            <div class="card-body" id="dash-alertas"><div class="loading-overlay"><div class="spinner"></div></div></div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-header"><span class="card-title">📊 Goles por Mes</span></div>
            <div class="card-body"><div class="bar-chart" id="bar-chart" style="align-items:flex-end"><div class="loading-overlay"><div class="spinner"></div></div></div></div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">⚽ Top Goleadores</span></div>
            <div class="card-body" id="dash-goleadores"><div class="loading-overlay"><div class="spinner"></div></div></div>
          </div>
        </div>
      </section>

      <section class="page-section" id="section-jugadores" style="display:none">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Plantilla (<span id="jugadores-count">0</span>)</span>
            <div class="d-flex gap-2 align-center" style="flex-wrap:wrap">
              <div class="search-wrap">
                <span class="search-icon">🔍</span>
                <input class="form-input" id="search-jugadores" placeholder="Buscar..." oninput="Pages.jugadores.load(this.value)" style="width:200px;padding-top:8px;padding-bottom:8px">
              </div>
              <button class="btn btn-primary btn-sm" onclick="Pages.jugadores.openForm()">+ Jugador</button>
            </div>
          </div>
          <div class="card-body-0 table-wrap">
            <table>
              <thead><tr><th>#</th><th>Jugador</th><th>Posición</th><th>Edad</th><th>Equipo</th><th>Estado</th><th>Goles</th><th>Tarjetas</th><th>Acciones</th></tr></thead>
              <tbody id="jugadores-tbody"><tr><td colspan="9" class="loading-overlay"><div class="spinner"></div></td></tr></tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="page-section" id="section-entrenadores" style="display:none">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Cuerpo Técnico</span>
            <button class="btn btn-primary btn-sm" onclick="Pages.entrenadores.openForm()">+ Entrenador</button>
          </div>
          <div class="card-body-0 table-wrap">
            <table>
              <thead><tr><th>Entrenador</th><th>Especialidad</th><th>Equipo</th><th>Desde</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody id="entrenadores-tbody"></tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="page-section" id="section-directivos" style="display:none">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Junta Directiva</span>
            <button class="btn btn-primary btn-sm" onclick="Pages.directivos.openForm()">+ Directivo</button>
          </div>
          <div class="card-body-0 table-wrap">
            <table>
              <thead><tr><th>Nombre</th><th>Cargo</th><th>Email</th><th>Teléfono</th><th>Desde</th><th>Acciones</th></tr></thead>
              <tbody id="directivos-tbody"></tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="page-section" id="section-equipos" style="display:none">
        <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
          <button class="btn btn-primary" onclick="Pages.equipos.openForm()">+ Nuevo Equipo</button>
        </div>
        <div class="grid-3" id="equipos-grid"></div>
      </section>

      <section class="page-section" id="section-partidos" style="display:none">
        <div class="tabs">
          <div class="tab active" onclick="switchPartidosTab(this,'tab-prog')">📅 Programados</div>
          <div class="tab" onclick="switchPartidosTab(this,'tab-hist')">📋 Historial</div>
        </div>

        <div id="tab-prog">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Partidos Programados</span>
              <button class="btn btn-primary btn-sm" onclick="Pages.partidos.openForm()">+ Nuevo Partido</button>
            </div>
            <div class="card-body-0 table-wrap">
              <table>
                <thead><tr><th>Fecha</th><th>Nuestro Equipo</th><th></th><th>Rival</th><th>Competición</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody id="partidos-tbody"></tbody>
              </table>
            </div>
          </div>
        </div>

        <div id="tab-hist" style="display:none">
          <div class="card">
            <div class="card-header"><span class="card-title">Historial de Partidos</span></div>
            <div class="card-body-0 table-wrap">
              <table>
                <thead><tr><th>Fecha</th><th>Partido</th><th>Resultado</th><th>Competición</th><th></th></tr></thead>
                <tbody id="historial-tbody"></tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section class="page-section" id="section-entrenamientos" style="display:none">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Sesiones de Entrenamiento</span>
            <button class="btn btn-primary btn-sm" onclick="Pages.entrenamientos.openForm()">+ Nueva Sesión</button>
          </div>
          <div class="card-body-0 table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Equipo</th><th>Duración</th><th>Lugar</th><th>Asistencia</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody id="entrena-tbody"></tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="page-section" id="section-tarjetas" style="display:none">
        <div class="stats-row stats-3 mb-3">
          <div class="stat-card stat-yellow">
            <div class="stat-icon">🟨</div>
            <div class="stat-value" id="stat-amarillas">—</div>
            <div class="stat-label">Amarillas</div>
          </div>
          <div class="stat-card stat-red">
            <div class="stat-icon">🟥</div>
            <div class="stat-value" id="stat-rojas">—</div>
            <div class="stat-label">Rojas</div>
          </div>
          <div class="stat-card stat-blue">
            <div class="stat-icon">🚫</div>
            <div class="stat-value" id="stat-sancionados">—</div>
            <div class="stat-label">Sancionados</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">Registro de Tarjetas</span>
            <button class="btn btn-primary btn-sm" onclick="Pages.tarjetas.openForm()">+ Registrar</button>
          </div>
          <div class="card-body-0 table-wrap">
            <table>
              <thead><tr><th>Jugador</th><th>Tipo</th><th>Partido</th><th>Min</th><th>Motivo</th><th>Fecha</th><th>Sanción</th><th>Acciones</th></tr></thead>
              <tbody id="tarjetas-tbody"></tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="page-section" id="section-multas" style="display:none">
        <div class="stats-row stats-3 mb-3">
          <div class="stat-card stat-red">
            <div class="stat-icon">💸</div>
            <div class="stat-value text-sm" id="multas-total">—</div>
            <div class="stat-label">Total Multas</div>
          </div>
          <div class="stat-card stat-yellow">
            <div class="stat-icon">⏳</div>
            <div class="stat-value text-sm" id="multas-pend">—</div>
            <div class="stat-label">Pendiente</div>
          </div>
          <div class="stat-card stat-green">
            <div class="stat-icon">✅</div>
            <div class="stat-value text-sm" id="multas-cobr">—</div>
            <div class="stat-label">Cobrado</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">Registro de Multas</span>
            <button class="btn btn-primary btn-sm" onclick="Pages.multas.openForm()">+ Nueva Multa</button>
          </div>
          <div class="card-body-0 table-wrap">
            <table>
              <thead><tr><th>Persona</th><th>Motivo</th><th>Importe</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody id="multas-tbody"></tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="page-section" id="section-rendimiento" style="display:none">
        <div class="grid-3" id="rendimiento-grid">
          <div class="loading-overlay"><div class="spinner"></div></div>
        </div>
      </section>

      <section class="page-section" id="section-estadisticas" style="display:none">
        <div class="stats-row stats-3 mb-3">
          <div class="stat-card stat-blue"><div class="stat-icon">🏟️</div><div class="stat-value" id="estd-partidos">—</div><div class="stat-label">Partidos</div></div>
          <div class="stat-card stat-green"><div class="stat-icon">✅</div><div class="stat-value" id="estd-victorias">—</div><div class="stat-label">Victorias</div></div>
          <div class="stat-card stat-yellow"><div class="stat-icon">🤝</div><div class="stat-value" id="estd-empates">—</div><div class="stat-label">Empates</div></div>
        </div>
        <div class="stats-row stats-3 mb-3">
          <div class="stat-card stat-red"><div class="stat-icon">❌</div><div class="stat-value" id="estd-derrotas">—</div><div class="stat-label">Derrotas</div></div>
          <div class="stat-card stat-green"><div class="stat-icon">⚽</div><div class="stat-value" id="estd-gf">—</div><div class="stat-label">Goles a Favor</div></div>
          <div class="stat-card stat-red"><div class="stat-icon">😓</div><div class="stat-value" id="estd-gc">—</div><div class="stat-label">Goles en Contra</div></div>
        </div>

        <div class="grid-2 mb-3">
          <div class="card">
            <div class="card-header"><span class="card-title">⚽ Top Goleadores</span></div>
            <div class="card-body" id="estd-goleadores"></div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">🟨 Tarjetas por Jugador</span></div>
            <div class="card-body" id="estd-tarjetas"></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">🏆 Clasificación</span></div>
          <div class="card-body-0 table-wrap">
            <table>
              <thead><tr><th>Pos</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>Pts</th></tr></thead>
              <tbody id="estd-clas"></tbody>
            </table>
          </div>
        </div>
      </section>

      <?php if (hasRole('superadmin','admin')): ?>
      <section class="page-section" id="section-usuarios" style="display:none">
        <div class="card">
          <div class="card-header">
            <span class="card-title">🔐 Usuarios Administradores</span>
            <button class="btn btn-primary btn-sm" onclick="Pages.usuarios.openForm()">+ Nuevo Admin</button>
          </div>
          <div class="card-body-0 table-wrap">
            <table>
              <thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Último acceso</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody id="usuarios-tbody"></tbody>
            </table>
          </div>
        </div>
      </section>
      <?php endif; ?>

    </div>
  </div>
</div>


<div class="modal-overlay" id="modal">
  <div class="modal" id="modal-content"></div>
</div>


<div class="toast" id="toast"></div>

<script>

  window.CM_CONFIG = {
    basePath: '<?= BASE_PATH ?>',
    apiUrl:   '<?= BASE_PATH ?>/api/index.php',
    user: {
      nombre: '<?= addslashes($user['nombre']) ?>',
      rol:    '<?= addslashes($user['rol']) ?>'
    }
  };
</script>
<script src="<?= BASE_PATH ?>/assets/js/app.js"></script>
<script>

  function switchPartidosTab(el, show) {
    el.closest('.tabs').querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('tab-prog').style.display = 'none';
    document.getElementById('tab-hist').style.display = 'none';
    document.getElementById(show).style.display = 'block';
  }
 
  const mq = window.matchMedia('(max-width:1024px)');
  function checkMobile() { document.getElementById('menu-toggle').style.display = mq.matches?'flex':'none'; }
  mq.addEventListener('change',checkMobile);
  checkMobile();
</script>
</body>
</html>
