<?php

session_start();

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/auth.php';

if (isLogged()) {
    header('Location: ' . BASE_PATH . '/dashboard.php');
    exit;
}

$error   = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim($_POST['email']    ?? '');
    $password = trim($_POST['password'] ?? '');

    if (empty($email) || empty($password)) {
        $error = 'Por favor, completa todos los campos.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'El formato del email no es válido.';
    } else {
        $result = login($email, $password);
        if ($result['success']) {
            header('Location: ' . BASE_PATH . '/dashboard.php');
            exit;
        } else {
            $error = $result['message'];
        }
    }
}

$prev_email = htmlspecialchars($_POST['email'] ?? '', ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Manager — Iniciar Sesión</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= BASE_PATH ?>/assets/css/main.css">
  <style>
    body {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; overflow: hidden;
    }
    .login-bg {
      position: fixed; inset: 0; z-index: 0;
      background:
        radial-gradient(ellipse at 20% 60%, rgba(0,229,160,.10) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 20%, rgba(0,102,255,.08) 0%, transparent 50%),
        radial-gradient(ellipse at 60% 80%, rgba(255,77,109,.06) 0%, transparent 45%),
        linear-gradient(180deg, #0a0d12 0%, #0d1520 100%);
    }
    .grid-overlay {
      position: fixed; inset: 0; z-index: 0;
      background-image:
        linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    .orb { position:fixed; border-radius:50%; filter:blur(80px); opacity:.35; z-index:0; animation:float 8s ease-in-out infinite; }
    .orb-1 { width:400px;height:400px;background:var(--accent);top:-100px;left:-100px;animation-delay:0s; }
    .orb-2 { width:300px;height:300px;background:var(--accent2);bottom:-80px;right:-80px;animation-delay:-3s; }
    .orb-3 { width:200px;height:200px;background:var(--accent3);top:50%;right:15%;animation-delay:-6s; }
    @keyframes float { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.05)} }

    .login-wrap {
      position:relative; z-index:10;
      width:100%; max-width:460px; padding:20px;
      animation: slideUp .5s ease both;
    }
    @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }

    .login-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 48px 44px;
      box-shadow: 0 0 0 1px rgba(0,229,160,.04), 0 40px 80px rgba(0,0,0,.55), 0 0 120px rgba(0,229,160,.05);
    }
    .brand-logo {
      font-family:'Bebas Neue',sans-serif; font-size:42px; letter-spacing:3px;
      background:linear-gradient(135deg,var(--accent) 0%,var(--accent2) 100%);
      -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
      line-height:1; margin-bottom:4px;
    }
    .brand-tagline { font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:2.5px;margin-bottom:36px; }
    .divider { height:1px;background:linear-gradient(90deg,transparent,var(--border),transparent);margin:28px 0; }

    .input-wrap { position:relative; margin-bottom:18px; }
    .input-wrap label { display:block;font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px; }
    .input-wrap .input-icon { position:absolute;left:14px;bottom:11px;font-size:15px;pointer-events:none;z-index:1; }
    .input-wrap input {
      width:100%; padding:12px 14px 12px 42px;
      background:var(--bg); border:1.5px solid var(--border); border-radius:10px;
      color:var(--text); font-family:'DM Sans',sans-serif; font-size:14px;
      outline:none; transition:border-color .2s,box-shadow .2s,background .2s;
    }
    .input-wrap input:focus { border-color:var(--accent);background:var(--bg2);box-shadow:0 0 0 4px rgba(0,229,160,.10); }
    .input-wrap input::placeholder { color:var(--text3); }
    .toggle-pass { position:absolute;right:12px;bottom:11px;background:none;border:none;color:var(--text2);cursor:pointer;font-size:16px;padding:2px;transition:color .2s; }
    .toggle-pass:hover { color:var(--accent); }

    .btn-submit {
      width:100%; padding:14px;
      background:var(--accent); border:none; border-radius:10px;
      color:#0a0d12; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700;
      cursor:pointer; transition:all .2s; position:relative; overflow:hidden; letter-spacing:.3px;
    }
    .btn-submit::after { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.15),transparent);opacity:0;transition:opacity .2s; }
    .btn-submit:hover { background:#00c988;transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,229,160,.35); }
    .btn-submit:hover::after { opacity:1; }
    .btn-submit:active { transform:translateY(0); }

    .alert-login { padding:13px 16px;border-radius:10px;font-size:13px;margin-bottom:22px;display:flex;align-items:flex-start;gap:10px;animation:fadeIn .3s ease; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
    .alert-error { background:rgba(255,77,109,.10);border:1px solid rgba(255,77,109,.30);color:#ff8099; }
    .alert-ok    { background:rgba(0,229,160,.10);border:1px solid rgba(0,229,160,.25);color:var(--accent); }

    .demo-box { margin-top:22px;padding:14px 18px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;font-size:12px;color:var(--text2);line-height:2; }
    .demo-box strong { color:var(--text); }
    .demo-box code { font-family:'DM Mono',monospace;color:var(--accent);background:rgba(0,229,160,.08);padding:1px 7px;border-radius:4px;cursor:pointer;transition:background .15s; }
    .demo-box code:hover { background:rgba(0,229,160,.18); }

    .login-footer { text-align:center;margin-top:20px;font-size:11px;color:var(--text3); }
  </style>
</head>
<body>

  <div class="login-bg"></div>
  <div class="grid-overlay"></div>
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>

  <div class="login-wrap">
    <div class="login-card">

      <div class="brand-logo">⚽ Team Manager</div>
      <div class="brand-tagline">Sistema de Gestión Deportiva Pro</div>

      <?php if ($error): ?>
      <div class="alert-login alert-error">
        <span style="flex-shrink:0">⚠️</span>
        <span><?= $error ?></span>
      </div>
      <?php endif; ?>

      <?php if ($success): ?>
      <div class="alert-login alert-ok">
        <span style="flex-shrink:0">✅</span>
        <span><?= $success ?></span>
      </div>
      <?php endif; ?>

      <form method="POST" action="<?= BASE_PATH ?>/login.php" id="loginForm" novalidate>

        <div class="input-wrap">
          <label for="email">Correo electrónico</label>
          <span class="input-icon">📧</span>
          <input
            type="email"
            id="email"
            name="email"
            value="<?= $prev_email ?>"
            placeholder="admin@clubfc.com"
            autocomplete="email"
            autofocus
            required
          >
        </div>

        <div class="input-wrap" style="margin-bottom:26px">
          <label for="password">Contraseña</label>
          <span class="input-icon">🔒</span>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          >
          <button type="button" class="toggle-pass" id="togglePass" title="Mostrar contraseña">👁️</button>
        </div>

        <button type="submit" class="btn-submit" id="btnSubmit">
          Iniciar Sesión →
        </button>

      </form>

      <div class="divider"></div>

      <div class="demo-box">
        <strong>Acceso demo disponible:</strong><br>
        📧 Email: <code onclick="fillDemo('admin@clubfc.com','admin123')">admin@clubfc.com</code><br>
        🔑 Contraseña: <code onclick="fillDemo('admin@clubfc.com','admin123')">admin123</code>
        <br><span style="font-size:11px;color:var(--text3)">Haz clic en las credenciales para rellenar automáticamente</span>
      </div>

    </div>

    <div class="login-footer">
      Team Manager v1.0 &nbsp;·&nbsp; <?= date('Y') ?>
    </div>
  </div>

  <script>
    document.getElementById('togglePass').addEventListener('click', function() {
      const inp = document.getElementById('password');
      const isPass = inp.type === 'password';
      inp.type = isPass ? 'text' : 'password';
      this.textContent = isPass ? '🙈' : '👁️';
    });

    function fillDemo(email, pass) {
      document.getElementById('email').value    = email;
      document.getElementById('password').value = pass;
      document.getElementById('btnSubmit').focus();
    }

    document.getElementById('loginForm').addEventListener('submit', function(e) {
      const email = document.getElementById('email').value.trim();
      const pass  = document.getElementById('password').value.trim();
      if (!email || !pass) {
        e.preventDefault();
        const btn = document.getElementById('btnSubmit');
        btn.textContent = '⚠️ Completa los campos';
        btn.style.background = 'var(--accent3)';
        setTimeout(() => { btn.textContent = 'Iniciar Sesión →'; btn.style.background = ''; }, 2200);
        return;
      }
      const btn = document.getElementById('btnSubmit');
      btn.disabled = true;
      btn.textContent = '⏳ Verificando...';
      btn.style.opacity = '.8';
    });

    if (document.getElementById('email').value) {
      document.getElementById('password').focus();
    }
  </script>

</body>
</html>
