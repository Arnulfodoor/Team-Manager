<?php


require_once __DIR__ . '/../config/database.php';


if (!defined('BASE_PATH')) {
    $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');

    $dir = dirname($script);

    if (basename($dir) === 'api' || basename($dir) === 'includes') {
        $dir = dirname($dir);
    }
    $base = rtrim($dir, '/');
    if ($base === '.') $base = '';
    define('BASE_PATH', $base);
}


function isLogged(): bool {
    return isset($_SESSION['user_id']);
}

function requireLogin(): void {
    if (!isLogged()) {
        header('Location: ' . BASE_PATH . '/index.php');
        exit;
    }
}

function currentUser(): array {
    return $_SESSION['user'] ?? [];
}

function hasRole(string ...$roles): bool {
    $userRole = $_SESSION['user']['rol'] ?? '';
    return in_array($userRole, $roles, true);
}

function requireRole(string ...$roles): void {
    if (!hasRole(...$roles)) {
        http_response_code(403);
        die(json_encode(['error' => 'Acceso denegado']));
    }
}


function login(string $email, string $password): array {
    $db   = getDB();
    $stmt = $db->prepare("SELECT * FROM usuarios WHERE email = ? AND activo = 1");
    $stmt->execute([trim($email)]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        return ['success' => false, 'message' => 'Credenciales incorrectas. Verifica tu email y contraseña.'];
    }


    $db->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?")->execute([$user['id']]);

    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user']    = [
        'id'     => $user['id'],
        'nombre' => $user['nombre'],
        'email'  => $user['email'],
        'rol'    => $user['rol'],
    ];

    return ['success' => true, 'user' => $_SESSION['user']];
}

function logout(): void {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    header('Location: ' . BASE_PATH . '/index.php');
    exit;
}


function jsonResponse(mixed $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}


function clean(string $val): string {
    return htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
}
