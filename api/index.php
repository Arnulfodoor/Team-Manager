<?php

session_start();
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');

if (!isLogged()) { jsonResponse(['error' => 'No autenticado'], 401); }

$method  = $_SERVER['REQUEST_METHOD'];
$entity  = clean($_GET['entity'] ?? '');
$action  = clean($_GET['action'] ?? 'list');
$id      = (int)($_GET['id'] ?? 0);


$body = [];
if (in_array($method, ['POST','PUT','PATCH'])) {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true) ?? $_POST;
}

$db = getDB();


switch ($entity) {

    
    case 'dashboard':
        $stats = [];
        $stats['jugadores_activos'] = $db->query("SELECT COUNT(*) FROM jugadores WHERE estado='Activo'")->fetchColumn();
        $stats['total_partidos']    = $db->query("SELECT COUNT(*) FROM partidos")->fetchColumn();
        $stats['tarjetas_total']    = $db->query("SELECT COUNT(*) FROM tarjetas")->fetchColumn();
        $stats['multas_pendientes'] = $db->query("SELECT COALESCE(SUM(importe),0) FROM multas WHERE estado='Pendiente'")->fetchColumn();
        $stats['equipos']           = $db->query("SELECT COUNT(*) FROM equipos")->fetchColumn();
        $stats['victorias']         = $db->query("SELECT COUNT(*) FROM partidos WHERE estado='Finalizado' AND goles_favor > goles_contra")->fetchColumn();
        $stats['empates']           = $db->query("SELECT COUNT(*) FROM partidos WHERE estado='Finalizado' AND goles_favor = goles_contra")->fetchColumn();
        $stats['derrotas']          = $db->query("SELECT COUNT(*) FROM partidos WHERE estado='Finalizado' AND goles_favor < goles_contra")->fetchColumn();

        $stats['proximos_partidos'] = $db->query(
            "SELECT p.*, e.nombre as equipo_nombre FROM partidos p LEFT JOIN equipos e ON p.equipo_local_id=e.id
             WHERE p.estado='Programado' ORDER BY p.fecha ASC LIMIT 5"
        )->fetchAll();


        $alertas = [];
        $lesionados = $db->query("SELECT nombre FROM jugadores WHERE estado='Lesionado'")->fetchAll();
        foreach ($lesionados as $j) $alertas[] = ['tipo'=>'lesion','msg'=>"{$j['nombre']} está lesionado",'icon'=>'🤕'];

        $multas_p = $db->query("SELECT m.*, j.nombre FROM multas m JOIN jugadores j ON m.persona_id=j.id WHERE m.estado='Pendiente' AND m.tipo_persona='jugador' LIMIT 5")->fetchAll();
        foreach ($multas_p as $m) $alertas[] = ['tipo'=>'multa','msg'=>"Multa €{$m['importe']} pendiente: {$m['nombre']}",'icon'=>'💰'];

        $sancionados = $db->query("SELECT j.nombre FROM tarjetas t JOIN jugadores j ON t.jugador_id=j.id WHERE t.sancion_partidos > 0")->fetchAll();
        foreach ($sancionados as $s) $alertas[] = ['tipo'=>'sancion','msg'=>"{$s['nombre']} tiene sanción pendiente",'icon'=>'🚫'];

        $stats['alertas'] = $alertas;

        $stats['goles_mes'] = $db->query(
            "SELECT DATE_FORMAT(p.fecha,'%b') as mes, COALESCE(SUM(p.goles_favor),0) as goles
             FROM partidos p WHERE p.estado='Finalizado' AND p.fecha >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
             GROUP BY DATE_FORMAT(p.fecha,'%Y-%m') ORDER BY p.fecha ASC"
        )->fetchAll();

        $stats['top_goleadores'] = $db->query(
            "SELECT j.nombre, COUNT(g.id) as goles FROM goles_partido g
             JOIN jugadores j ON g.jugador_id=j.id GROUP BY g.jugador_id ORDER BY goles DESC LIMIT 5"
        )->fetchAll();

        jsonResponse($stats);
        break;

    case 'jugadores':
        if ($method === 'GET') {
            if ($id) {
                $stmt = $db->prepare(
                    "SELECT j.*, e.nombre as equipo_nombre,
                     (SELECT COUNT(*) FROM goles_partido g WHERE g.jugador_id=j.id) as goles,
                     (SELECT COUNT(*) FROM tarjetas t WHERE t.jugador_id=j.id AND t.tipo='Amarilla') as amarillas,
                     (SELECT COUNT(*) FROM tarjetas t WHERE t.jugador_id=j.id AND t.tipo IN('Roja','Doble Amarilla')) as rojas,
                     (SELECT COUNT(*) FROM asistencia_entrenamiento a WHERE a.jugador_id=j.id AND a.asistio=1) as asistencias
                     FROM jugadores j LEFT JOIN equipos e ON j.equipo_id=e.id WHERE j.id=?"
                );
                $stmt->execute([$id]);
                jsonResponse($stmt->fetch());
            } else {
                $search = clean($_GET['q'] ?? '');
                $equipo = (int)($_GET['equipo'] ?? 0);
                $sql = "SELECT j.*, e.nombre as equipo_nombre,
                        (SELECT COUNT(*) FROM goles_partido g WHERE g.jugador_id=j.id) as goles,
                        (SELECT COUNT(*) FROM tarjetas t WHERE t.jugador_id=j.id AND t.tipo='Amarilla') as amarillas,
                        (SELECT COUNT(*) FROM tarjetas t WHERE t.jugador_id=j.id AND t.tipo IN('Roja','Doble Amarilla')) as rojas
                        FROM jugadores j LEFT JOIN equipos e ON j.equipo_id=e.id WHERE 1=1";
                $params = [];
                if ($search) { $sql .= " AND (j.nombre LIKE ? OR j.posicion LIKE ?)"; $params[] = "%$search%"; $params[] = "%$search%"; }
                if ($equipo) { $sql .= " AND j.equipo_id = ?"; $params[] = $equipo; }
                $sql .= " ORDER BY j.dorsal ASC";
                $stmt = $db->prepare($sql); $stmt->execute($params);
                jsonResponse($stmt->fetchAll());
            }
        }
        elseif ($method === 'POST') {
            $stmt = $db->prepare("INSERT INTO jugadores (nombre,dorsal,posicion,edad,nacionalidad,equipo_id,estado,valoracion,fecha_alta) VALUES (?,?,?,?,?,?,?,?,?)");
            $stmt->execute([
                clean($body['nombre']), (int)$body['dorsal'], clean($body['posicion']),
                (int)$body['edad'],     clean($body['nacionalidad'] ?? 'ES'),
                $body['equipo_id'] ?: null, clean($body['estado'] ?? 'Activo'),
                (float)($body['valoracion'] ?? 7.0), $body['fecha_alta'] ?: date('Y-m-d')
            ]);
            jsonResponse(['success'=>true,'id'=>$db->lastInsertId()]);
        }
        elseif ($method === 'PUT') {
            $stmt = $db->prepare("UPDATE jugadores SET nombre=?,dorsal=?,posicion=?,edad=?,nacionalidad=?,equipo_id=?,estado=?,valoracion=? WHERE id=?");
            $stmt->execute([
                clean($body['nombre']), (int)$body['dorsal'], clean($body['posicion']),
                (int)$body['edad'],     clean($body['nacionalidad'] ?? 'ES'),
                $body['equipo_id'] ?: null, clean($body['estado']), (float)$body['valoracion'], $id
            ]);
            jsonResponse(['success'=>true]);
        }
        elseif ($method === 'DELETE') {
            $db->prepare("DELETE FROM jugadores WHERE id=?")->execute([$id]);
            jsonResponse(['success'=>true]);
        }
        break;

    case 'equipos':
        if ($method === 'GET') {
            $rows = $db->query(
                "SELECT e.*, COUNT(j.id) as num_jugadores,
                 (SELECT nombre FROM entrenadores WHERE equipo_id=e.id AND especialidad='Principal' LIMIT 1) as entrenador_principal
                 FROM equipos e LEFT JOIN jugadores j ON j.equipo_id=e.id GROUP BY e.id ORDER BY e.id"
            )->fetchAll();
            jsonResponse($id ? array_filter($rows, fn($r)=>$r['id']==$id) : $rows);
        }
        elseif ($method === 'POST') {
            $stmt = $db->prepare("INSERT INTO equipos (nombre,categoria,color,descripcion) VALUES (?,?,?,?)");
            $stmt->execute([clean($body['nombre']), clean($body['categoria']), clean($body['color'] ?? '#00e5a0'), clean($body['descripcion'] ?? '')]);
            jsonResponse(['success'=>true,'id'=>$db->lastInsertId()]);
        }
        elseif ($method === 'PUT') {
            $stmt = $db->prepare("UPDATE equipos SET nombre=?,categoria=?,color=?,descripcion=? WHERE id=?");
            $stmt->execute([clean($body['nombre']), clean($body['categoria']), clean($body['color']), clean($body['descripcion'] ?? ''), $id]);
            jsonResponse(['success'=>true]);
        }
        elseif ($method === 'DELETE') {
            $db->prepare("DELETE FROM equipos WHERE id=?")->execute([$id]);
            jsonResponse(['success'=>true]);
        }
        break;


    case 'entrenadores':
        if ($method === 'GET') {
            $rows = $db->query("SELECT en.*, eq.nombre as equipo_nombre FROM entrenadores en LEFT JOIN equipos eq ON en.equipo_id=eq.id ORDER BY en.nombre")->fetchAll();
            jsonResponse($rows);
        }
        elseif ($method === 'POST') {
            $stmt = $db->prepare("INSERT INTO entrenadores (nombre,email,telefono,especialidad,equipo_id,fecha_inicio) VALUES (?,?,?,?,?,?)");
            $stmt->execute([clean($body['nombre']),clean($body['email']??''),clean($body['telefono']??''),clean($body['especialidad']),($body['equipo_id']?:null),$body['fecha_inicio']??date('Y-m-d')]);
            jsonResponse(['success'=>true,'id'=>$db->lastInsertId()]);
        }
        elseif ($method === 'PUT') {
            $stmt = $db->prepare("UPDATE entrenadores SET nombre=?,email=?,telefono=?,especialidad=?,equipo_id=?,activo=? WHERE id=?");
            $stmt->execute([clean($body['nombre']),clean($body['email']??''),clean($body['telefono']??''),clean($body['especialidad']),($body['equipo_id']?:null),(int)($body['activo']??1),$id]);
            jsonResponse(['success'=>true]);
        }
        elseif ($method === 'DELETE') {
            $db->prepare("DELETE FROM entrenadores WHERE id=?")->execute([$id]);
            jsonResponse(['success'=>true]);
        }
        break;


    case 'directivos':
        if ($method === 'GET') {
            jsonResponse($db->query("SELECT * FROM directivos WHERE activo=1 ORDER BY fecha_inicio DESC, nombre ASC")->fetchAll());
        }
        elseif ($method === 'POST') {
            $stmt = $db->prepare("INSERT INTO directivos (nombre,cargo,email,telefono,fecha_inicio) VALUES (?,?,?,?,?)");
            $stmt->execute([clean($body['nombre']),clean($body['cargo']),clean($body['email']??''),clean($body['telefono']??''),$body['fecha_inicio']??date('Y-m-d')]);
            jsonResponse(['success'=>true,'id'=>$db->lastInsertId()]);
        }
        elseif ($method === 'PUT') {
            $stmt = $db->prepare("UPDATE directivos SET nombre=?,cargo=?,email=?,telefono=? WHERE id=?");
            $stmt->execute([clean($body['nombre']),clean($body['cargo']),clean($body['email']??''),clean($body['telefono']??''),$id]);
            jsonResponse(['success'=>true]);
        }
        elseif ($method === 'DELETE') {
            $db->prepare("UPDATE directivos SET activo=0 WHERE id=?")->execute([$id]);
            jsonResponse(['success'=>true]);
        }
        break;


    case 'partidos':
        if ($method === 'GET') {
            $estado = clean($_GET['estado'] ?? '');
            $sql = "SELECT p.*, e.nombre as equipo_nombre FROM partidos p LEFT JOIN equipos e ON p.equipo_local_id=e.id";
            if ($estado) $sql .= " WHERE p.estado='$estado'";
            $sql .= " ORDER BY p.fecha DESC";
            if ($id) {
                $stmt = $db->prepare($sql . " -- single");

                $stmt = $db->prepare("SELECT p.*, e.nombre as equipo_nombre FROM partidos p LEFT JOIN equipos e ON p.equipo_local_id=e.id WHERE p.id=?");
                $stmt->execute([$id]);
                $partido = $stmt->fetch();

                $stmt2 = $db->prepare("SELECT g.*, j.nombre as jugador_nombre FROM goles_partido g JOIN jugadores j ON g.jugador_id=j.id WHERE g.partido_id=?");
                $stmt2->execute([$id]);
                $partido['goles'] = $stmt2->fetchAll();
                jsonResponse($partido);
            } else {
                jsonResponse($db->query($sql)->fetchAll());
            }
        }
        elseif ($method === 'POST') {
            $stmt = $db->prepare("INSERT INTO partidos (equipo_local_id,rival,es_local,fecha,competicion,estado) VALUES (?,?,?,?,?,?)");
            $stmt->execute([$body['equipo_local_id']?:null, clean($body['rival']), (int)($body['es_local']??1), $body['fecha'], clean($body['competicion']), 'Programado']);
            jsonResponse(['success'=>true,'id'=>$db->lastInsertId()]);
        }
        elseif ($method === 'PUT') {
            if ($action === 'resultado') {
                $stmt = $db->prepare("UPDATE partidos SET goles_favor=?,goles_contra=?,estado='Finalizado' WHERE id=?");
                $stmt->execute([(int)$body['goles_favor'], (int)$body['goles_contra'], $id]);

                if (!empty($body['goleadores'])) {
                    foreach ($body['goleadores'] as $g) {
                        $db->prepare("INSERT INTO goles_partido (partido_id,jugador_id,minuto,tipo) VALUES (?,?,?,?)")
                           ->execute([$id, (int)$g['jugador_id'], (int)$g['minuto'], $g['tipo']??'Normal']);
                    }
                }
                jsonResponse(['success'=>true]);
            } else {
                $stmt = $db->prepare("UPDATE partidos SET equipo_local_id=?,rival=?,es_local=?,fecha=?,competicion=?,estado=?,notas=? WHERE id=?");
                $stmt->execute([$body['equipo_local_id']?:null,clean($body['rival']),(int)($body['es_local']??1),$body['fecha'],clean($body['competicion']),clean($body['estado']),clean($body['notas']??''),$id]);
                jsonResponse(['success'=>true]);
            }
        }
        elseif ($method === 'DELETE') {
            $db->prepare("DELETE FROM partidos WHERE id=?")->execute([$id]);
            jsonResponse(['success'=>true]);
        }
        break;

    case 'entrenamientos':
        if ($method === 'GET') {
            $rows = $db->query("SELECT en.*, eq.nombre as equipo_nombre,
                COUNT(a.id) as total_convocados, SUM(a.asistio) as total_asistieron
                FROM entrenamientos en LEFT JOIN equipos eq ON en.equipo_id=eq.id
                LEFT JOIN asistencia_entrenamiento a ON a.entrenamiento_id=en.id
                GROUP BY en.id ORDER BY en.fecha DESC")->fetchAll();
            jsonResponse($rows);
        }
        elseif ($method === 'POST') {
            $stmt = $db->prepare("INSERT INTO entrenamientos (equipo_id,fecha,tipo,duracion,lugar,notas,estado) VALUES (?,?,?,?,?,?,?)");
            $stmt->execute([$body['equipo_id']?:null,$body['fecha'],clean($body['tipo']),(int)($body['duracion']??90),clean($body['lugar']??''),clean($body['notas']??''),clean($body['estado']??'Programado')]);
            jsonResponse(['success'=>true,'id'=>$db->lastInsertId()]);
        }
        elseif ($method === 'PUT') {
            $stmt = $db->prepare("UPDATE entrenamientos SET equipo_id=?,fecha=?,tipo=?,duracion=?,lugar=?,notas=?,estado=? WHERE id=?");
            $stmt->execute([$body['equipo_id']?:null,$body['fecha'],clean($body['tipo']),(int)($body['duracion']??90),clean($body['lugar']??''),clean($body['notas']??''),clean($body['estado']),$id]);
            jsonResponse(['success'=>true]);
        }
        elseif ($method === 'DELETE') {
            $db->prepare("DELETE FROM entrenamientos WHERE id=?")->execute([$id]);
            jsonResponse(['success'=>true]);
        }
        break;

    case 'tarjetas':
        if ($method === 'GET') {
            $rows = $db->query("SELECT t.*, j.nombre as jugador_nombre, p.rival, p.fecha as partido_fecha
                FROM tarjetas t JOIN jugadores j ON t.jugador_id=j.id LEFT JOIN partidos p ON t.partido_id=p.id
                ORDER BY t.fecha DESC")->fetchAll();
            jsonResponse($rows);
        }
        elseif ($method === 'POST') {
            $stmt = $db->prepare("INSERT INTO tarjetas (jugador_id,partido_id,tipo,minuto,motivo,sancion_partidos,fecha) VALUES (?,?,?,?,?,?,?)");
            $stmt->execute([(int)$body['jugador_id'], $body['partido_id']?:null, clean($body['tipo']), (int)($body['minuto']??0), clean($body['motivo']??''), (int)($body['sancion_partidos']??0), $body['fecha']??date('Y-m-d')]);

            if ((int)($body['sancion_partidos']??0) > 0) {
                $db->prepare("UPDATE jugadores SET estado='Sancionado' WHERE id=?")->execute([(int)$body['jugador_id']]);
            }
            jsonResponse(['success'=>true,'id'=>$db->lastInsertId()]);
        }
        elseif ($method === 'DELETE') {
            $db->prepare("DELETE FROM tarjetas WHERE id=?")->execute([$id]);
            jsonResponse(['success'=>true]);
        }
        break;


    case 'multas':
        if ($method === 'GET') {
            $rows = $db->query(
                "SELECT m.*, 
                 CASE m.tipo_persona
                   WHEN 'jugador'     THEN (SELECT nombre FROM jugadores    WHERE id=m.persona_id)
                   WHEN 'entrenador'  THEN (SELECT nombre FROM entrenadores WHERE id=m.persona_id)
                   WHEN 'directivo'   THEN (SELECT nombre FROM directivos   WHERE id=m.persona_id)
                 END as persona_nombre
                 FROM multas m ORDER BY m.fecha DESC"
            )->fetchAll();
            jsonResponse($rows);
        }
        elseif ($method === 'POST') {
            $stmt = $db->prepare("INSERT INTO multas (tipo_persona,persona_id,motivo,importe,fecha,estado,notas) VALUES (?,?,?,?,?,?,?)");
            $stmt->execute([clean($body['tipo_persona']), (int)$body['persona_id'], clean($body['motivo']), (float)$body['importe'], $body['fecha']??date('Y-m-d'), 'Pendiente', clean($body['notas']??'')]);
            jsonResponse(['success'=>true,'id'=>$db->lastInsertId()]);
        }
        elseif ($method === 'PUT') {
            if ($action === 'pagar') {
                $db->prepare("UPDATE multas SET estado='Pagada',fecha_pago=NOW() WHERE id=?")->execute([$id]);
            } else {
                $stmt = $db->prepare("UPDATE multas SET motivo=?,importe=?,estado=?,notas=? WHERE id=?");
                $stmt->execute([clean($body['motivo']),(float)$body['importe'],clean($body['estado']),clean($body['notas']??''),$id]);
            }
            jsonResponse(['success'=>true]);
        }
        elseif ($method === 'DELETE') {
            $db->prepare("DELETE FROM multas WHERE id=?")->execute([$id]);
            jsonResponse(['success'=>true]);
        }
        break;


    case 'rendimiento':
        if ($method === 'GET') {
            if ($id) {
                $rows = $db->prepare("SELECT * FROM rendimiento WHERE jugador_id=? ORDER BY fecha DESC LIMIT 10");
                $rows->execute([$id]);
                jsonResponse($rows->fetchAll());
            } else {
                $rows = $db->query(
                    "SELECT j.id, j.nombre, j.posicion, j.equipo_id, e.nombre as equipo_nombre,
                     j.valoracion, j.estado,
                     (SELECT COUNT(*) FROM goles_partido g WHERE g.jugador_id=j.id) as goles,
                     (SELECT COUNT(*) FROM tarjetas t WHERE t.jugador_id=j.id AND t.tipo='Amarilla') as amarillas,
                     (SELECT COUNT(*) FROM tarjetas t WHERE t.jugador_id=j.id AND t.tipo IN('Roja','Doble Amarilla')) as rojas,
                     (SELECT COUNT(*) FROM asistencia_entrenamiento a WHERE a.jugador_id=j.id AND a.asistio=1) as asistencias,
                     r.velocidad, r.tecnica, r.fisico, r.tactica, r.actitud
                     FROM jugadores j LEFT JOIN equipos e ON j.equipo_id=e.id
                     LEFT JOIN rendimiento r ON r.jugador_id=j.id AND r.id=(SELECT MAX(id) FROM rendimiento WHERE jugador_id=j.id)
                     ORDER BY j.valoracion DESC"
                )->fetchAll();
                jsonResponse($rows);
            }
        }
        elseif ($method === 'POST') {
            $stmt = $db->prepare("INSERT INTO rendimiento (jugador_id,fecha,velocidad,tecnica,fisico,tactica,actitud,valoracion_gen,notas) VALUES (?,?,?,?,?,?,?,?,?)");
            $stmt->execute([(int)$body['jugador_id'],$body['fecha']??date('Y-m-d'),(int)$body['velocidad'],(int)$body['tecnica'],(int)$body['fisico'],(int)$body['tactica'],(int)$body['actitud'],(float)$body['valoracion_gen'],clean($body['notas']??'')]);
            $db->prepare("UPDATE jugadores SET valoracion=? WHERE id=?")->execute([(float)$body['valoracion_gen'],(int)$body['jugador_id']]);
            jsonResponse(['success'=>true,'id'=>$db->lastInsertId()]);
        }
        break;


    case 'estadisticas':
        $data = [];
        $data['totales'] = $db->query(
            "SELECT COUNT(*) as partidos, COALESCE(SUM(goles_favor),0) as goles_favor, COALESCE(SUM(goles_contra),0) as goles_contra,
             SUM(goles_favor>goles_contra) as victorias, SUM(goles_favor=goles_contra) as empates, SUM(goles_favor<goles_contra) as derrotas
             FROM partidos WHERE estado='Finalizado'"
        )->fetch();
        $data['goleadores'] = $db->query(
            "SELECT j.nombre, j.posicion, COUNT(g.id) as goles FROM goles_partido g JOIN jugadores j ON g.jugador_id=j.id GROUP BY g.jugador_id ORDER BY goles DESC LIMIT 10"
        )->fetchAll();
        $data['tarjetas_jugador'] = $db->query(
            "SELECT j.nombre,
             SUM(t.tipo='Amarilla') as amarillas, SUM(t.tipo IN('Roja','Doble Amarilla')) as rojas
             FROM tarjetas t JOIN jugadores j ON t.jugador_id=j.id GROUP BY t.jugador_id ORDER BY amarillas DESC LIMIT 10"
        )->fetchAll();
        $data['clasificacion'] = $db->query(
            "SELECT e.nombre, COUNT(p.id) as pj,
             SUM(p.goles_favor>p.goles_contra) as g,
             SUM(p.goles_favor=p.goles_contra) as emp,
             SUM(p.goles_favor<p.goles_contra) as d,
             COALESCE(SUM(p.goles_favor),0) as gf,
             COALESCE(SUM(p.goles_contra),0) as gc,
             COALESCE(SUM(p.goles_favor),0)-COALESCE(SUM(p.goles_contra),0) as dif,
             SUM(p.goles_favor>p.goles_contra)*3 + SUM(p.goles_favor=p.goles_contra) as pts
             FROM equipos e LEFT JOIN partidos p ON p.equipo_local_id=e.id AND p.estado='Finalizado'
             GROUP BY e.id ORDER BY pts DESC, dif DESC"
        )->fetchAll();
        jsonResponse($data);
        break;

    case 'usuarios':
        requireRole('superadmin','admin');
        if ($method === 'GET') {
            jsonResponse($db->query("SELECT id,nombre,email,rol,activo,ultimo_acceso,created_at FROM usuarios ORDER BY id")->fetchAll());
        }
        elseif ($method === 'POST') {
            $hash = password_hash(clean($body['password']), PASSWORD_DEFAULT);
            $stmt = $db->prepare("INSERT INTO usuarios (nombre,email,password,rol) VALUES (?,?,?,?)");
            $stmt->execute([clean($body['nombre']),clean($body['email']),$hash,clean($body['rol']??'manager')]);
            jsonResponse(['success'=>true,'id'=>$db->lastInsertId()]);
        }
        elseif ($method === 'PUT') {
            if (!empty($body['password'])) {
                $hash = password_hash(clean($body['password']), PASSWORD_DEFAULT);
                $db->prepare("UPDATE usuarios SET nombre=?,email=?,password=?,rol=?,activo=? WHERE id=?")
                   ->execute([clean($body['nombre']),clean($body['email']),$hash,clean($body['rol']),(int)$body['activo'],$id]);
            } else {
                $db->prepare("UPDATE usuarios SET nombre=?,email=?,rol=?,activo=? WHERE id=?")
                   ->execute([clean($body['nombre']),clean($body['email']),clean($body['rol']),(int)$body['activo'],$id]);
            }
            jsonResponse(['success'=>true]);
        }
        elseif ($method === 'DELETE') {
            if ($id === (int)$_SESSION['user_id']) jsonResponse(['error'=>'No puedes eliminar tu propia cuenta'],400);
            $db->prepare("DELETE FROM usuarios WHERE id=?")->execute([$id]);
            jsonResponse(['success'=>true]);
        }
        break;


    case 'auth':
        if ($action === 'logout') { logout(); }
        if ($action === 'me')     { jsonResponse($_SESSION['user']); }
        break;

    default:
        jsonResponse(['error' => 'Entidad no reconocida'], 404);
}
