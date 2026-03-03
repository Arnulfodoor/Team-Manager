'use strict';


const API = {
  baseUrl: (window.CM_CONFIG && window.CM_CONFIG.apiUrl) ? window.CM_CONFIG.apiUrl : '/api/index.php',

  async request(method, entity, opts = {}) {
    const url = new URL(this.baseUrl, location.origin);
    url.searchParams.set('entity', entity);
    if (opts.action) url.searchParams.set('action', opts.action);
    if (opts.id)     url.searchParams.set('id', opts.id);
    if (opts.params) Object.entries(opts.params).forEach(([k,v]) => url.searchParams.set(k,v));

    const cfg = { method, headers: { 'Content-Type': 'application/json' } };
    if (opts.body) cfg.body = JSON.stringify(opts.body);

    const res  = await fetch(url.toString(), cfg);
    const data = await res.json();
    if (data && data.error) throw new Error(data.error);
    return data;
  },
  get:    (entity, opts={}) => API.request('GET',    entity, opts),
  post:   (entity, body)    => API.request('POST',   entity, { body }),
  put:    (entity, id, body, action) => API.request('PUT', entity, { id, body, action }),
  delete: (entity, id)      => API.request('DELETE', entity, { id }),
};


function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast toast-${type} show`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3500);
}


const Modal = {
  el: null,
  open(html) {
    if (!this.el) this.el = document.getElementById('modal');
    document.getElementById('modal-content').innerHTML = html;
    this.el.classList.add('open');
    this.el.querySelector('.modal-close')?.focus();
  },
  close() {
    document.getElementById('modal')?.classList.remove('open');
  }
};

document.addEventListener('click', e => {
  if (e.target.id === 'modal') Modal.close();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') Modal.close();
});


function confirmDelete(msg, cb) {
  Modal.open(`
    <div class="modal-header">
      <div class="modal-title">⚠️ Confirmar eliminación</div>
      <button class="modal-close" onclick="Modal.close()">×</button>
    </div>
    <div class="modal-body">
      <p style="color:var(--text2);font-size:14px">${msg}</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
      <button class="btn btn-danger" onclick="Modal.close();(${cb.toString()})()">Sí, eliminar</button>
    </div>`);
}


function badge(text, type) {
  const map = {
    'Activo':'green','Active':'green','Completado':'green','Pagada':'green',
    'Lesionado':'red','Sancionado':'yellow','Inactivo':'gray','Anulada':'gray',
    'Pendiente':'yellow','Programado':'blue','Aplazado':'gray','Cancelado':'red',
    'En juego':'green',
    'Portero':'blue','Defensa':'gray','Centrocampista':'yellow','Delantero':'red',
    'Amarilla':'yellow','Roja':'red','Doble Amarilla':'red',
    'superadmin':'purple','admin':'blue','manager':'green','readonly':'gray',
  };
  const color = map[text] || type || 'gray';
  return `<span class="badge badge-${color}">${text}</span>`;
}

function avatar(name, color = '') {
  const initials = name.split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
  const style = color ? `style="background:${color}"` : '';
  return `<div class="avatar" ${style}>${initials}</div>`;
}

function avatarCell(name, sub = '', color = '') {
  return `<div class="avatar-cell">${avatar(name, color)}<div><div>${name}</div>${sub?`<div class="text-xs text-muted">${sub}</div>`:''}</div></div>`;
}

function actionBtns(editFn, deleteFn) {
  return `<div class="d-flex gap-2">
    <button class="btn btn-outline btn-xs" onclick="${editFn}">✏️</button>
    <button class="btn btn-danger btn-xs" onclick="${deleteFn}">🗑️</button>
  </div>`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', {day:'2-digit',month:'short',year:'numeric'});
}

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
}


let currentPage = 'dashboard';

function navigate(page) {
  document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const section = document.getElementById('section-' + page);
  if (!section) return;
  section.style.display = 'block';

  document.querySelectorAll(`.nav-link[data-page="${page}"]`).forEach(l => l.classList.add('active'));

  const titles = {
    dashboard:'Dashboard', jugadores:'Jugadores', entrenadores:'Cuerpo Técnico',
    directivos:'Directivos', equipos:'Equipos', partidos:'Partidos',
    entrenamientos:'Entrenamientos', tarjetas:'Tarjetas', multas:'Multas',
    rendimiento:'Rendimiento', estadisticas:'Estadísticas', usuarios:'Usuarios Admin'
  };
  document.getElementById('page-title').textContent = titles[page] || page;
  currentPage = page;
  Pages[page]?.load?.();
}


const Pages = {};


Pages.dashboard = {
  async load() {
    try {
      const d = await API.get('dashboard');
      document.getElementById('stat-jugadores').textContent = d.jugadores_activos;
      document.getElementById('stat-partidos').textContent  = d.total_partidos;
      document.getElementById('stat-tarjetas').textContent  = d.tarjetas_total;
      document.getElementById('stat-multas').textContent    = '€' + parseFloat(d.multas_pendientes).toFixed(0);
      document.getElementById('stat-victorias').textContent = d.victorias + 'V / ' + d.empates + 'E / ' + d.derrotas + 'D';


      const pp = document.getElementById('dash-proximos');
      pp.innerHTML = d.proximos_partidos.length
        ? d.proximos_partidos.map(p => `
          <tr>
            <td>${fmtDateTime(p.fecha)}</td>
            <td><strong>${p.equipo_nombre || '—'}</strong> ${p.es_local?'🏠':'✈️'}</td>
            <td style="color:var(--text2)">vs</td>
            <td>${p.rival}</td>
            <td>${badge(p.competicion,'blue')}</td>
          </tr>`).join('')
        : '<tr><td colspan="5" class="text-muted" style="padding:20px;text-align:center">Sin partidos próximos</td></tr>';


      const al = document.getElementById('dash-alertas');
      al.innerHTML = d.alertas.length
        ? d.alertas.map(a => `<div class="alert alert-warning">${a.icon} ${a.msg}</div>`).join('')
        : '<div class="alert alert-success">✅ Sin alertas activas</div>';


      this.renderBarChart(d.goles_mes);


      const tg = document.getElementById('dash-goleadores');
      tg.innerHTML = d.top_goleadores.map(j => `
        <div class="prog-wrap">
          <div class="prog-label"><span>${j.nombre}</span><span class="text-accent fw-bold">${j.goles} ⚽</span></div>
          <div class="prog-track"><div class="prog-fill" style="width:${Math.min(j.goles*8,100)}%;background:var(--accent)"></div></div>
        </div>`).join('') || '<p class="text-muted text-sm">Sin goles registrados</p>';

    } catch(e) { toast('Error cargando dashboard: ' + e.message, 'danger'); }
  },

  renderBarChart(data) {
    const wrap = document.getElementById('bar-chart');
    if (!data || !data.length) { wrap.innerHTML = '<p class="text-muted text-sm">Sin datos</p>'; return; }
    const max = Math.max(...data.map(d=>+d.goles), 1);
    const colors = ['var(--accent)','var(--accent2)','var(--accent4)','var(--accent)','var(--accent2)','var(--accent4)'];
    wrap.innerHTML = data.map((d,i) => `
      <div class="bar-group">
        <div class="bar-value">${d.goles}</div>
        <div class="bar" style="height:${Math.max((+d.goles/max)*100,4)}px;background:${colors[i%6]}"></div>
        <div class="bar-label">${d.mes}</div>
      </div>`).join('');
  }
};


Pages.jugadores = {
  data: [],
  async load(search = '', equipo = '') {
    const tbody = document.getElementById('jugadores-tbody');
    tbody.innerHTML = '<tr><td colspan="9" class="loading-overlay"><div class="spinner"></div></td></tr>';
    try {
      const params = {};
      if (search) params.q = search;
      if (equipo) params.equipo = equipo;
      this.data = await API.get('jugadores', { params });
      document.getElementById('jugadores-count').textContent = this.data.length;
      tbody.innerHTML = this.data.length ? this.data.map(j => `
        <tr>
          <td><span class="mono fw-bold" style="color:var(--text2)">${j.dorsal||'—'}</span></td>
          <td>${avatarCell(j.nombre, j.posicion)}</td>
          <td>${badge(j.posicion)}</td>
          <td>${j.edad||'—'}</td>
          <td>${j.equipo_nombre||'—'}</td>
          <td>${badge(j.estado)}</td>
          <td><strong class="text-accent">${j.goles||0}</strong></td>
          <td>
            <span style="color:#ffd166">${j.amarillas||0} 🟨</span>
            <span style="color:#ff6b87;margin-left:6px">${j.rojas||0} 🟥</span>
          </td>
          <td>${actionBtns(`Pages.jugadores.edit(${j.id})`, `Pages.jugadores.del(${j.id},'${j.nombre}')`)}</td>
        </tr>`).join('')
        : '<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">👤</div><div class="empty-text">No hay jugadores</div></div></td></tr>';
    } catch(e) { toast(e.message, 'danger'); }
  },

  async openForm(id = null) {
    const equipos = await API.get('equipos');
    const j = id ? await API.get('jugadores', { id }) : {};
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title">${id ? '✏️ Editar' : '➕ Nuevo'} Jugador</div>
        <button class="modal-close" onclick="Modal.close()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nombre completo *</label>
            <input id="fj_nombre" class="form-input" value="${j.nombre||''}" placeholder="Carlos García" required>
          </div>
          <div class="form-group">
            <label class="form-label">Dorsal</label>
            <input id="fj_dorsal" class="form-input" type="number" value="${j.dorsal||''}" min="1" max="99">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Posición *</label>
            <select id="fj_pos" class="form-select">
              ${['Portero','Defensa','Centrocampista','Delantero'].map(p=>`<option ${j.posicion===p?'selected':''}>${p}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Edad</label>
            <input id="fj_edad" class="form-input" type="number" value="${j.edad||''}" min="14" max="50">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Equipo</label>
            <select id="fj_equipo" class="form-select">
              <option value="">Sin asignar</option>
              ${equipos.map(e=>`<option value="${e.id}" ${j.equipo_id==e.id?'selected':''}>${e.nombre}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nacionalidad</label>
            <input id="fj_nac" class="form-input" value="${j.nacionalidad||'ES'}" maxlength="5">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Estado</label>
            <select id="fj_estado" class="form-select">
              ${['Activo','Lesionado','Sancionado','Inactivo'].map(s=>`<option ${j.estado===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Valoración (1–10)</label>
            <input id="fj_val" class="form-input" type="number" value="${j.valoracion||7.0}" min="1" max="10" step="0.1">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha de alta</label>
          <input id="fj_alta" class="form-input" type="date" value="${j.fecha_alta||new Date().toISOString().split('T')[0]}">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Pages.jugadores.save(${id||'null'})">💾 Guardar</button>
      </div>`);
  },

  async save(id) {
    const body = {
      nombre: document.getElementById('fj_nombre').value.trim(),
      dorsal: document.getElementById('fj_dorsal').value,
      posicion: document.getElementById('fj_pos').value,
      edad: document.getElementById('fj_edad').value,
      equipo_id: document.getElementById('fj_equipo').value,
      nacionalidad: document.getElementById('fj_nac').value,
      estado: document.getElementById('fj_estado').value,
      valoracion: document.getElementById('fj_val').value,
      fecha_alta: document.getElementById('fj_alta').value,
    };
    if (!body.nombre) { toast('El nombre es obligatorio','warning'); return; }
    try {
      if (id) await API.put('jugadores', id, body);
      else    await API.post('jugadores', body);
      Modal.close();
      toast(id ? '✅ Jugador actualizado' : '✅ Jugador añadido');
      this.load();
    } catch(e) { toast(e.message,'danger'); }
  },

  edit(id) { this.openForm(id); },

  del(id, nombre) {
    confirmDelete(`¿Eliminar al jugador <strong>${nombre}</strong>? Esta acción no se puede deshacer.`, async () => {
      try { await API.delete('jugadores', id); toast('🗑️ Jugador eliminado'); this.load(); }
      catch(e) { toast(e.message,'danger'); }
    });
  }
};


Pages.entrenadores = {
  async load() {
    const tbody = document.getElementById('entrenadores-tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-overlay"><div class="spinner"></div></td></tr>';
    try {
      const equipos = await API.get('equipos');
      const data = await API.get('entrenadores');
      tbody.innerHTML = data.length ? data.map(e => `
        <tr>
          <td>${avatarCell(e.nombre, e.email)}</td>
          <td>${badge(e.especialidad,'blue')}</td>
          <td>${e.equipo_nombre||'—'}</td>
          <td>${fmtDate(e.fecha_inicio)}</td>
          <td>${badge(e.activo?'Activo':'Inactivo')}</td>
          <td>${actionBtns(`Pages.entrenadores.edit(${e.id})`,`Pages.entrenadores.del(${e.id},'${e.nombre}')`)}</td>
        </tr>`).join('')
        : '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🧑‍🏫</div><div class="empty-text">No hay entrenadores</div></div></td></tr>';
    } catch(e) { toast(e.message,'danger'); }
  },

  async openForm(id = null) {
    const equipos = await API.get('equipos');
    const en = id ? (await API.get('entrenadores')).find(x=>x.id==id) : {};
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title">${id?'✏️ Editar':'➕ Nuevo'} Entrenador</div>
        <button class="modal-close" onclick="Modal.close()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Nombre *</label><input id="fe_nombre" class="form-input" value="${en.nombre||''}" required></div>
          <div class="form-group"><label class="form-label">Especialidad</label>
            <select id="fe_espec" class="form-select">
              ${['Principal','Ayudante','Porteros','Preparación Física','Analista'].map(s=>`<option ${en.especialidad===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Email</label><input id="fe_email" class="form-input" type="email" value="${en.email||''}"></div>
          <div class="form-group"><label class="form-label">Teléfono</label><input id="fe_tel" class="form-input" value="${en.telefono||''}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Equipo</label>
            <select id="fe_equipo" class="form-select">
              <option value="">Sin asignar</option>
              ${equipos.map(e=>`<option value="${e.id}" ${en.equipo_id==e.id?'selected':''}>${e.nombre}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Fecha inicio</label><input id="fe_fecha" class="form-input" type="date" value="${en.fecha_inicio||''}"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Pages.entrenadores.save(${id||'null'})">💾 Guardar</button>
      </div>`);
  },

  async save(id) {
    const body = {
      nombre: document.getElementById('fe_nombre').value.trim(),
      especialidad: document.getElementById('fe_espec').value,
      email: document.getElementById('fe_email').value,
      telefono: document.getElementById('fe_tel').value,
      equipo_id: document.getElementById('fe_equipo').value,
      fecha_inicio: document.getElementById('fe_fecha').value,
      activo: 1,
    };
    if (!body.nombre) { toast('El nombre es obligatorio','warning'); return; }
    try {
      if (id) await API.put('entrenadores', id, body);
      else    await API.post('entrenadores', body);
      Modal.close(); toast('✅ Entrenador guardado'); this.load();
    } catch(e) { toast(e.message,'danger'); }
  },

  edit(id) { this.openForm(id); },
  del(id, nombre) {
    confirmDelete(`¿Eliminar a <strong>${nombre}</strong>?`, async () => {
      try { await API.delete('entrenadores', id); toast('🗑️ Entrenador eliminado'); this.load(); }
      catch(e) { toast(e.message,'danger'); }
    });
  }
};


Pages.directivos = {
  async load() {
    const tbody = document.getElementById('directivos-tbody');
    try {
      const data = await API.get('directivos');
      tbody.innerHTML = data.length ? data.map(d => `
        <tr>
          <td>${avatarCell(d.nombre)}</td>
          <td><strong>${d.cargo}</strong></td>
          <td><a href="mailto:${d.email}" style="color:var(--accent2)">${d.email||'—'}</a></td>
          <td>${d.telefono||'—'}</td>
          <td>${fmtDate(d.fecha_inicio)}</td>
          <td>${actionBtns(`Pages.directivos.edit(${d.id})`,`Pages.directivos.del(${d.id},'${d.nombre}')`)}</td>
        </tr>`).join('')
        : '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">💼</div><div class="empty-text">No hay directivos</div></div></td></tr>';
    } catch(e) { toast(e.message,'danger'); }
  },

  openForm(id = null) {

    const load = async () => {
      const list = id ? await API.get('directivos') : [];
      const d = list.find(x=>x.id==id) || {};
      Modal.open(`
        <div class="modal-header">
          <div class="modal-title">${id?'✏️ Editar':'➕ Nuevo'} Directivo</div>
          <button class="modal-close" onclick="Modal.close()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group"><label class="form-label">Nombre *</label><input id="fd_nombre" class="form-input" value="${d.nombre||''}" required></div>
            <div class="form-group"><label class="form-label">Cargo *</label>
              <select id="fd_cargo" class="form-select">
                ${['Presidente','Vicepresidente','Secretario/a','Tesorero/a','Vocal','Director Deportivo','Otro'].map(c=>`<option ${d.cargo===c?'selected':''}>${c}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Email</label><input id="fd_email" class="form-input" type="email" value="${d.email||''}"></div>
            <div class="form-group"><label class="form-label">Teléfono</label><input id="fd_tel" class="form-input" value="${d.telefono||''}"></div>
          </div>
          <div class="form-group"><label class="form-label">Fecha de inicio</label><input id="fd_fecha" class="form-input" type="date" value="${d.fecha_inicio||''}"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
          <button class="btn btn-primary" onclick="Pages.directivos.save(${id||'null'})">💾 Guardar</button>
        </div>`);
    };
    load();
  },

  async save(id) {
    const body = { nombre:document.getElementById('fd_nombre').value.trim(), cargo:document.getElementById('fd_cargo').value, email:document.getElementById('fd_email').value, telefono:document.getElementById('fd_tel').value, fecha_inicio:document.getElementById('fd_fecha').value };
    if (!body.nombre) { toast('El nombre es obligatorio','warning'); return; }
    try {
      if (id) await API.put('directivos', id, body);
      else    await API.post('directivos', body);
      Modal.close(); toast('✅ Directivo guardado'); this.load();
    } catch(e) { toast(e.message,'danger'); }
  },
  edit(id) { this.openForm(id); },
  del(id, nombre) {
    confirmDelete(`¿Eliminar a <strong>${nombre}</strong>?`, async () => {
      try { await API.delete('directivos', id); toast('🗑️ Directivo eliminado'); this.load(); }
      catch(e) { toast(e.message,'danger'); }
    });
  }
};


Pages.equipos = {
  async load() {
    const grid = document.getElementById('equipos-grid');
    grid.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
    try {
      const data = await API.get('equipos');
      grid.innerHTML = data.length ? data.map(e => `
        <div class="team-card" style="border-color:${e.color}44">
          <div style="width:50px;height:50px;border-radius:12px;background:${e.color}22;display:flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:14px">🛡️</div>
          <div class="bebas" style="font-size:22px;color:${e.color};margin-bottom:4px">${e.nombre}</div>
          <div class="text-muted text-sm mb-2">${e.categoria}</div>
          <div class="text-sm mb-1">👤 <strong>${e.num_jugadores}</strong> jugadores</div>
          <div class="text-sm text-muted mb-2">🧑‍🏫 ${e.entrenador_principal||'Sin entrenador'}</div>
          <div class="d-flex gap-2 mt-2">
            <button class="btn btn-outline btn-sm" onclick="Pages.equipos.edit(${e.id})">✏️ Editar</button>
            <button class="btn btn-danger btn-sm" onclick="Pages.equipos.del(${e.id},'${e.nombre}')">🗑️</button>
          </div>
        </div>`).join('')
        : '<div class="empty-state"><div class="empty-icon">🛡️</div><div class="empty-text">No hay equipos</div></div>';
    } catch(e) { toast(e.message,'danger'); }
  },

  openForm(id = null) {
    const load = async () => {
      const list = id ? await API.get('equipos') : [];
      const eq = list.find(x=>x.id==id)||{};
      Modal.open(`
        <div class="modal-header">
          <div class="modal-title">${id?'✏️ Editar':'➕ Nuevo'} Equipo</div>
          <button class="modal-close" onclick="Modal.close()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group"><label class="form-label">Nombre *</label><input id="feq_nombre" class="form-input" value="${eq.nombre||''}"></div>
            <div class="form-group"><label class="form-label">Categoría</label>
              <select id="feq_cat" class="form-select">${['Senior','Sub-23','Juvenil','Cadete','Infantil','Alevín'].map(c=>`<option ${eq.categoria===c?'selected':''}>${c}</option>`).join('')}</select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Color distintivo</label><input id="feq_color" class="form-input" type="color" value="${eq.color||'#00e5a0'}" style="height:42px;cursor:pointer"></div>
          </div>
          <div class="form-group"><label class="form-label">Descripción</label><textarea id="feq_desc" class="form-textarea">${eq.descripcion||''}</textarea></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
          <button class="btn btn-primary" onclick="Pages.equipos.save(${id||'null'})">💾 Guardar</button>
        </div>`);
    };
    load();
  },

  async save(id) {
    const body = { nombre:document.getElementById('feq_nombre').value.trim(), categoria:document.getElementById('feq_cat').value, color:document.getElementById('feq_color').value, descripcion:document.getElementById('feq_desc').value };
    if (!body.nombre) { toast('El nombre es obligatorio','warning'); return; }
    try {
      if (id) await API.put('equipos',id,body);
      else    await API.post('equipos',body);
      Modal.close(); toast('✅ Equipo guardado'); this.load();
    } catch(e) { toast(e.message,'danger'); }
  },
  edit(id) { this.openForm(id); },
  del(id, nombre) {
    confirmDelete(`¿Eliminar el equipo <strong>${nombre}</strong>?`, async () => {
      try { await API.delete('equipos',id); toast('🗑️ Equipo eliminado'); this.load(); }
      catch(e) { toast(e.message,'danger'); }
    });
  }
};


Pages.partidos = {
  async load(tab = 'programados') {
    const tbody = document.getElementById('partidos-tbody');
    const histTbody = document.getElementById('historial-tbody');
    try {
      const data = await API.get('partidos');
      const prog = data.filter(p => p.estado === 'Programado' || p.estado === 'Aplazado');
      const hist = data.filter(p => p.estado === 'Finalizado' || p.estado === 'Cancelado');

      tbody.innerHTML = prog.length ? prog.map(p => `
        <tr>
          <td>${fmtDateTime(p.fecha)}</td>
          <td><strong>${p.equipo_nombre||'—'}</strong> <span class="text-muted text-xs">${p.es_local?'🏠 Local':'✈️ Fuera'}</span></td>
          <td style="color:var(--text2);font-weight:700;text-align:center">vs</td>
          <td>${p.rival}</td>
          <td>${badge(p.competicion,'blue')}</td>
          <td>${badge(p.estado)}</td>
          <td>
            <div class="d-flex gap-2">
              <button class="btn btn-primary btn-xs" onclick="Pages.partidos.resultado(${p.id},'${p.equipo_nombre||''}','${p.rival}')">⚽ Resultado</button>
              <button class="btn btn-danger btn-xs" onclick="Pages.partidos.del(${p.id})">🗑️</button>
            </div>
          </td>
        </tr>`).join('')
        : '<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📅</div><div class="empty-text">No hay partidos programados</div></div></td></tr>';

      histTbody.innerHTML = hist.length ? hist.map(p => {
        const gf = p.goles_favor ?? '?', gc = p.goles_contra ?? '?';
        const res = gf > gc ? 'badge-green' : gf < gc ? 'badge-red' : 'badge-yellow';
        return `<tr>
          <td>${fmtDateTime(p.fecha)}</td>
          <td>${p.equipo_nombre||'—'} vs ${p.rival}</td>
          <td><span class="badge ${res} bebas" style="font-size:16px">${gf} – ${gc}</span></td>
          <td>${badge(p.competicion,'blue')}</td>
          <td><button class="btn btn-danger btn-xs" onclick="Pages.partidos.del(${p.id})">🗑️</button></td>
        </tr>`;}).join('')
        : '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📊</div><div class="empty-text">Sin historial</div></div></td></tr>';
    } catch(e) { toast(e.message,'danger'); }
  },

  async openForm() {
    const equipos = await API.get('equipos');
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title">⚽ Nuevo Partido</div>
        <button class="modal-close" onclick="Modal.close()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Nuestro equipo</label>
            <select id="fp_equipo" class="form-select">
              <option value="">Seleccionar...</option>
              ${equipos.map(e=>`<option value="${e.id}">${e.nombre}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">¿Local o visitante?</label>
            <select id="fp_local" class="form-select">
              <option value="1">🏠 Local</option>
              <option value="0">✈️ Visitante</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Rival *</label><input id="fp_rival" class="form-input" placeholder="Club Rival FC"></div>
          <div class="form-group"><label class="form-label">Competición</label>
            <select id="fp_comp" class="form-select">
              ${['Liga Regional','Copa','Amistoso','Playoff','Supercopa','Otros'].map(c=>`<option>${c}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Fecha y hora</label><input id="fp_fecha" class="form-input" type="datetime-local"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Pages.partidos.save()">💾 Programar</button>
      </div>`);
  },

  async save() {
    const body = { equipo_local_id:document.getElementById('fp_equipo').value, rival:document.getElementById('fp_rival').value.trim(), es_local:document.getElementById('fp_local').value, fecha:document.getElementById('fp_fecha').value, competicion:document.getElementById('fp_comp').value };
    if (!body.rival) { toast('El rival es obligatorio','warning'); return; }
    try { await API.post('partidos',body); Modal.close(); toast('✅ Partido programado'); this.load(); }
    catch(e) { toast(e.message,'danger'); }
  },

  async resultado(id, local, rival) {
    const jugadores = await API.get('jugadores');
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title">⚽ Registrar Resultado</div>
        <button class="modal-close" onclick="Modal.close()">×</button>
      </div>
      <div class="modal-body">
        <p class="text-muted text-sm mb-2">${local} vs ${rival}</p>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Goles a favor</label><input id="fr_gf" class="form-input" type="number" min="0" value="0"></div>
          <div class="form-group"><label class="form-label">Goles en contra</label><input id="fr_gc" class="form-input" type="number" min="0" value="0"></div>
        </div>
        <hr class="separator">
        <label class="form-label">Goleadores (opcional)</label>
        <div id="goleadores-list"></div>
        <button class="btn btn-outline btn-sm" onclick="Pages.partidos.addGoleador(${JSON.stringify(jugadores).replace(/"/g,'&quot;')})">+ Añadir goleador</button>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Pages.partidos.saveResultado(${id})">✅ Guardar Resultado</button>
      </div>`);
  },

  goleadores: [],
  addGoleador(jugadores) {
    const list = document.getElementById('goleadores-list');
    const idx = list.children.length;
    const row = document.createElement('div');
    row.className = 'form-row mb-1';
    row.innerHTML = `
      <div class="form-group"><select class="form-select" id="gol_jug_${idx}">
        ${jugadores.map(j=>`<option value="${j.id}">${j.nombre}</option>`).join('')}
      </select></div>
      <div class="form-group"><input class="form-input" type="number" id="gol_min_${idx}" placeholder="Min" min="1" max="120"></div>`;
    list.appendChild(row);
  },

  async saveResultado(id) {
    const gf = +document.getElementById('fr_gf').value;
    const gc = +document.getElementById('fr_gc').value;
    const goleadores = [];
    document.querySelectorAll('[id^="gol_jug_"]').forEach((el,i) => {
      goleadores.push({ jugador_id: el.value, minuto: document.getElementById(`gol_min_${i}`).value || 0, tipo: 'Normal' });
    });
    try {
      await API.put('partidos', id, { goles_favor:gf, goles_contra:gc, goleadores }, 'resultado');
      Modal.close(); toast('✅ Resultado guardado'); this.load();
    } catch(e) { toast(e.message,'danger'); }
  },

  del(id) {
    confirmDelete('¿Eliminar este partido?', async () => {
      try { await API.delete('partidos',id); toast('🗑️ Partido eliminado'); this.load(); }
      catch(e) { toast(e.message,'danger'); }
    });
  }
};


Pages.entrenamientos = {
  async load() {
    const tbody = document.getElementById('entrena-tbody');
    try {
      const equipos = await API.get('equipos');
      const data = await API.get('entrenamientos');
      tbody.innerHTML = data.length ? data.map(e => {
        const asist = (e.total_asistieron??0) + '/' + (e.total_convocados??0);
        return `<tr>
          <td>${fmtDateTime(e.fecha)}</td>
          <td>${badge(e.tipo,'blue')}</td>
          <td>${e.equipo_nombre||'—'}</td>
          <td>${e.duracion} min</td>
          <td>${e.lugar||'—'}</td>
          <td>${asist}</td>
          <td>${badge(e.estado)}</td>
          <td>${actionBtns(`Pages.entrenamientos.edit(${e.id})`,`Pages.entrenamientos.del(${e.id})`)}</td>
        </tr>`;}).join('')
        : '<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🏃</div><div class="empty-text">Sin entrenamientos</div></div></td></tr>';
    } catch(err) { toast(err.message,'danger'); }
  },

  async openForm(id = null) {
    const equipos = await API.get('equipos');
    const list = id ? await API.get('entrenamientos') : [];
    const en = list.find(x=>x.id==id)||{};
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title">${id?'✏️ Editar':'📋 Nuevo'} Entrenamiento</div>
        <button class="modal-close" onclick="Modal.close()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Fecha y hora</label><input id="fen_fecha" class="form-input" type="datetime-local" value="${en.fecha?.slice(0,16)||''}"></div>
          <div class="form-group"><label class="form-label">Tipo</label>
            <select id="fen_tipo" class="form-select">${['Táctica','Físico','Técnica','Partido Interno','Recuperación','Porteros'].map(t=>`<option ${en.tipo===t?'selected':''}>${t}</option>`).join('')}</select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Equipo</label>
            <select id="fen_equipo" class="form-select">
              <option value="">Sin asignar</option>
              ${equipos.map(e=>`<option value="${e.id}" ${en.equipo_id==e.id?'selected':''}>${e.nombre}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Duración (min)</label><input id="fen_dur" class="form-input" type="number" value="${en.duracion||90}" min="15"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Lugar</label><input id="fen_lugar" class="form-input" value="${en.lugar||''}" placeholder="Campo principal"></div>
          <div class="form-group"><label class="form-label">Estado</label>
            <select id="fen_estado" class="form-select">${['Programado','Completado','Cancelado'].map(s=>`<option ${en.estado===s?'selected':''}>${s}</option>`).join('')}</select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Notas</label><textarea id="fen_notas" class="form-textarea">${en.notas||''}</textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Pages.entrenamientos.save(${id||'null'})">💾 Guardar</button>
      </div>`);
  },

  async save(id) {
    const body = { equipo_id:document.getElementById('fen_equipo').value, fecha:document.getElementById('fen_fecha').value, tipo:document.getElementById('fen_tipo').value, duracion:document.getElementById('fen_dur').value, lugar:document.getElementById('fen_lugar').value, notas:document.getElementById('fen_notas').value, estado:document.getElementById('fen_estado').value };
    try {
      if (id) await API.put('entrenamientos',id,body);
      else    await API.post('entrenamientos',body);
      Modal.close(); toast('✅ Entrenamiento guardado'); this.load();
    } catch(e) { toast(e.message,'danger'); }
  },
  edit(id) { this.openForm(id); },
  del(id) {
    confirmDelete('¿Eliminar este entrenamiento?', async () => {
      try { await API.delete('entrenamientos',id); toast('🗑️ Eliminado'); this.load(); }
      catch(e) { toast(e.message,'danger'); }
    });
  }
};


Pages.tarjetas = {
  async load() {
    const tbody = document.getElementById('tarjetas-tbody');
    try {
      const data = await API.get('tarjetas');
      const am = data.filter(t=>t.tipo==='Amarilla').length;
      const ro = data.filter(t=>t.tipo!=='Amarilla').length;
      const sa = data.filter(t=>t.sancion_partidos>0).length;
      document.getElementById('stat-amarillas').textContent = am;
      document.getElementById('stat-rojas').textContent = ro;
      document.getElementById('stat-sancionados').textContent = sa;

      tbody.innerHTML = data.length ? data.map(t => `
        <tr>
          <td>${avatarCell(t.jugador_nombre)}</td>
          <td>${badge(t.tipo)}</td>
          <td class="text-sm text-muted">${t.rival ? 'vs '+t.rival : '—'}</td>
          <td>${t.minuto ? t.minuto+"'" : '—'}</td>
          <td>${t.motivo||'—'}</td>
          <td>${fmtDate(t.fecha)}</td>
          <td>${t.sancion_partidos>0 ? `<span class="badge badge-red">🚫 ${t.sancion_partidos} partido(s)</span>` : '<span class="badge badge-gray">Ninguna</span>'}</td>
          <td><button class="btn btn-danger btn-xs" onclick="Pages.tarjetas.del(${t.id})">🗑️</button></td>
        </tr>`).join('')
        : '<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🟨</div><div class="empty-text">Sin tarjetas registradas</div></div></td></tr>';
    } catch(e) { toast(e.message,'danger'); }
  },

  async openForm() {
    const [jugadores, partidos] = await Promise.all([API.get('jugadores'), API.get('partidos')]);
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title">🟨 Registrar Tarjeta</div>
        <button class="modal-close" onclick="Modal.close()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Jugador *</label>
            <select id="ft_jug" class="form-select">
              ${jugadores.map(j=>`<option value="${j.id}">${j.nombre}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Tipo *</label>
            <select id="ft_tipo" class="form-select">
              <option>Amarilla</option><option>Roja</option><option>Doble Amarilla</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Partido (opcional)</label>
            <select id="ft_partido" class="form-select">
              <option value="">Sin partido</option>
              ${partidos.map(p=>`<option value="${p.id}">${p.equipo_nombre||''} vs ${p.rival} (${fmtDate(p.fecha)})</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Minuto</label><input id="ft_min" class="form-input" type="number" min="1" max="120" placeholder="45"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Motivo</label><input id="ft_motivo" class="form-input" placeholder="Falta táctica, protestas..."></div>
          <div class="form-group"><label class="form-label">Sanción (partidos)</label><input id="ft_sanc" class="form-input" type="number" min="0" value="0"></div>
        </div>
        <div class="form-group"><label class="form-label">Fecha *</label><input id="ft_fecha" class="form-input" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Pages.tarjetas.save()">💾 Registrar</button>
      </div>`);
  },

  async save() {
    const body = { jugador_id:document.getElementById('ft_jug').value, tipo:document.getElementById('ft_tipo').value, partido_id:document.getElementById('ft_partido').value, minuto:document.getElementById('ft_min').value, motivo:document.getElementById('ft_motivo').value, sancion_partidos:document.getElementById('ft_sanc').value, fecha:document.getElementById('ft_fecha').value };
    try { await API.post('tarjetas',body); Modal.close(); toast('✅ Tarjeta registrada'); this.load(); }
    catch(e) { toast(e.message,'danger'); }
  },

  del(id) {
    confirmDelete('¿Eliminar esta tarjeta?', async () => {
      try { await API.delete('tarjetas',id); toast('🗑️ Tarjeta eliminada'); this.load(); }
      catch(e) { toast(e.message,'danger'); }
    });
  }
};

Pages.multas = {
  async load() {
    const tbody = document.getElementById('multas-tbody');
    try {
      const data = await API.get('multas');
      const total = data.reduce((s,m)=>s+parseFloat(m.importe),0);
      const pend  = data.filter(m=>m.estado==='Pendiente').reduce((s,m)=>s+parseFloat(m.importe),0);
      const cobr  = data.filter(m=>m.estado==='Pagada').reduce((s,m)=>s+parseFloat(m.importe),0);
      document.getElementById('multas-total').textContent = '€'+total.toFixed(2);
      document.getElementById('multas-pend').textContent  = '€'+pend.toFixed(2);
      document.getElementById('multas-cobr').textContent  = '€'+cobr.toFixed(2);

      tbody.innerHTML = data.length ? data.map(m => `
        <tr>
          <td>${avatarCell(m.persona_nombre||'—', m.tipo_persona)}</td>
          <td>${m.motivo}</td>
          <td><strong class="text-accent4">€${parseFloat(m.importe).toFixed(2)}</strong></td>
          <td>${fmtDate(m.fecha)}</td>
          <td>${badge(m.estado)}</td>
          <td>
            <div class="d-flex gap-2">
              ${m.estado==='Pendiente'?`<button class="btn btn-primary btn-xs" onclick="Pages.multas.pagar(${m.id})">✓ Cobrada</button>`:''}
              <button class="btn btn-danger btn-xs" onclick="Pages.multas.del(${m.id})">🗑️</button>
            </div>
          </td>
        </tr>`).join('')
        : '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">💰</div><div class="empty-text">Sin multas registradas</div></div></td></tr>';
    } catch(e) { toast(e.message,'danger'); }
  },

  async openForm() {
    const [jugadores, entrenadores, directivos] = await Promise.all([API.get('jugadores'),API.get('entrenadores'),API.get('directivos')]);
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title">💰 Nueva Multa</div>
        <button class="modal-close" onclick="Modal.close()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Tipo de persona</label>
            <select id="fm_tipo" class="form-select" onchange="Pages.multas.updatePersonas()">
              <option value="jugador">Jugador</option>
              <option value="entrenador">Entrenador</option>
              <option value="directivo">Directivo</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Persona *</label>
            <select id="fm_persona" class="form-select">
              ${jugadores.map(j=>`<option value="${j.id}" data-tipo="jugador">${j.nombre}</option>`).join('')}
              ${entrenadores.map(e=>`<option value="${e.id}" data-tipo="entrenador" style="display:none">${e.nombre}</option>`).join('')}
              ${directivos.map(d=>`<option value="${d.id}" data-tipo="directivo" style="display:none">${d.nombre}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Motivo *</label>
            <select id="fm_motivo" class="form-select">
              ${['Llegada tarde entrenamiento','Ausencia sin justificar','Indisciplina','Acumulación de tarjetas','Comportamiento antideportivo','Otros'].map(m=>`<option>${m}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Importe (€) *</label><input id="fm_importe" class="form-input" type="number" min="1" step="0.01" placeholder="50.00"></div>
        </div>
        <div class="form-group"><label class="form-label">Fecha</label><input id="fm_fecha" class="form-input" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
        <div class="form-group"><label class="form-label">Notas adicionales</label><textarea id="fm_notas" class="form-textarea" rows="2"></textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Pages.multas.save()">💾 Registrar Multa</button>
      </div>`);
  },

  updatePersonas() {
    const tipo = document.getElementById('fm_tipo').value;
    document.querySelectorAll('#fm_persona option').forEach(opt => {
      opt.style.display = opt.dataset.tipo === tipo ? '' : 'none';
    });
    const first = document.querySelector(`#fm_persona option[data-tipo="${tipo}"]`);
    if (first) first.selected = true;
  },

  async save() {
    const body = { tipo_persona:document.getElementById('fm_tipo').value, persona_id:document.getElementById('fm_persona').value, motivo:document.getElementById('fm_motivo').value, importe:document.getElementById('fm_importe').value, fecha:document.getElementById('fm_fecha').value, notas:document.getElementById('fm_notas').value };
    if (!body.importe || body.importe<=0) { toast('El importe debe ser mayor a 0','warning'); return; }
    try { await API.post('multas',body); Modal.close(); toast('✅ Multa registrada'); this.load(); }
    catch(e) { toast(e.message,'danger'); }
  },

  async pagar(id) {
    try { await API.put('multas',id,{},'pagar'); toast('✅ Multa marcada como pagada'); this.load(); }
    catch(e) { toast(e.message,'danger'); }
  },

  del(id) {
    confirmDelete('¿Eliminar esta multa?', async () => {
      try { await API.delete('multas',id); toast('🗑️ Multa eliminada'); this.load(); }
      catch(e) { toast(e.message,'danger'); }
    });
  }
};


Pages.rendimiento = {
  async load() {
    const wrap = document.getElementById('rendimiento-grid');
    try {
      const data = await API.get('rendimiento');
      wrap.innerHTML = data.map(j => `
        <div class="card">
          <div class="profile-header">
            <div class="profile-av">${j.nombre.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
            <div style="flex:1">
              <div class="fw-bold" style="font-size:15px">${j.nombre}</div>
              <div class="text-muted text-sm">${j.posicion} · ${j.equipo_nombre||'Sin equipo'}</div>
              <div style="margin-top:6px">${badge(j.estado)}</div>
            </div>
            <div class="bebas" style="font-size:36px;color:${+j.valoracion>=8?'var(--accent)':+j.valoracion>=6?'var(--accent4)':'var(--accent3)'}">${j.valoracion}</div>
          </div>
          <div class="card-body">
            <div class="form-row" style="margin-bottom:16px">
              <div class="text-center"><div class="bebas text-accent" style="font-size:28px">${j.goles||0}</div><div class="text-xs text-muted">Goles</div></div>
              <div class="text-center"><div class="bebas text-accent4" style="font-size:28px">${j.amarillas||0}</div><div class="text-xs text-muted">Amarillas</div></div>
              <div class="text-center"><div class="bebas text-accent3" style="font-size:28px">${j.rojas||0}</div><div class="text-xs text-muted">Rojas</div></div>
              <div class="text-center"><div class="bebas" style="font-size:28px">${j.asistencias||0}</div><div class="text-xs text-muted">Asistencias</div></div>
            </div>
            ${j.velocidad!=null?`
              <div class="prog-wrap"><div class="prog-label"><span>Velocidad</span><span>${j.velocidad}/10</span></div><div class="prog-track"><div class="prog-fill" style="width:${j.velocidad*10}%;background:var(--accent)"></div></div></div>
              <div class="prog-wrap"><div class="prog-label"><span>Técnica</span><span>${j.tecnica}/10</span></div><div class="prog-track"><div class="prog-fill" style="width:${j.tecnica*10}%;background:var(--accent2)"></div></div></div>
              <div class="prog-wrap"><div class="prog-label"><span>Físico</span><span>${j.fisico}/10</span></div><div class="prog-track"><div class="prog-fill" style="width:${j.fisico*10}%;background:var(--accent4)"></div></div></div>
              <div class="prog-wrap"><div class="prog-label"><span>Táctica</span><span>${j.tactica}/10</span></div><div class="prog-track"><div class="prog-fill" style="width:${j.tactica*10}%;background:var(--accent3)"></div></div></div>
            `:'<p class="text-muted text-sm">Sin evaluación registrada</p>'}
            <div class="d-flex gap-2 mt-2">
              <button class="btn btn-outline btn-sm w-100" onclick="Pages.rendimiento.evaluar(${j.id},'${j.nombre}')">📊 Evaluar</button>
            </div>
          </div>
        </div>`).join('') || '<div class="empty-state"><div class="empty-icon">📈</div><div class="empty-text">Sin jugadores</div></div>';
    } catch(e) { toast(e.message,'danger'); }
  },

  evaluar(id, nombre) {
    Modal.open(`
      <div class="modal-header">
        <div class="modal-title">📊 Evaluar — ${nombre}</div>
        <button class="modal-close" onclick="Modal.close()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Fecha evaluación</label><input id="ev_fecha" class="form-input" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
        <div class="form-row">
          ${['velocidad','tecnica','fisico','tactica','actitud'].map(attr=>`
            <div class="form-group"><label class="form-label">${attr.charAt(0).toUpperCase()+attr.slice(1)}</label>
              <input id="ev_${attr}" class="form-input" type="number" min="1" max="10" value="7">
            </div>`).join('')}
          <div class="form-group"><label class="form-label">Valoración general</label><input id="ev_val" class="form-input" type="number" min="1" max="10" step="0.1" value="7.0"></div>
        </div>
        <div class="form-group"><label class="form-label">Notas</label><textarea id="ev_notas" class="form-textarea"></textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Pages.rendimiento.saveEval(${id})">💾 Guardar Evaluación</button>
      </div>`);
  },

  async saveEval(jugador_id) {
    const body = { jugador_id, fecha:document.getElementById('ev_fecha').value, velocidad:document.getElementById('ev_velocidad').value, tecnica:document.getElementById('ev_tecnica').value, fisico:document.getElementById('ev_fisico').value, tactica:document.getElementById('ev_tactica').value, actitud:document.getElementById('ev_actitud').value, valoracion_gen:document.getElementById('ev_val').value, notas:document.getElementById('ev_notas').value };
    try { await API.post('rendimiento',body); Modal.close(); toast('✅ Evaluación guardada'); this.load(); }
    catch(e) { toast(e.message,'danger'); }
  }
};


Pages.estadisticas = {
  async load() {
    try {
      const d = await API.get('estadisticas');
      const t = d.totales;
      document.getElementById('estd-partidos').textContent  = t.partidos||0;
      document.getElementById('estd-gf').textContent        = t.goles_favor||0;
      document.getElementById('estd-gc').textContent        = t.goles_contra||0;
      document.getElementById('estd-victorias').textContent = t.victorias||0;
      document.getElementById('estd-empates').textContent   = t.empates||0;
      document.getElementById('estd-derrotas').textContent  = t.derrotas||0;

      document.getElementById('estd-goleadores').innerHTML = d.goleadores.map((g,i) => `
        <div class="prog-wrap">
          <div class="prog-label">
            <span><strong style="color:var(--text2)">${i+1}.</strong> ${g.nombre} <span class="badge badge-gray text-xs">${g.posicion}</span></span>
            <span class="text-accent fw-bold">${g.goles} ⚽</span>
          </div>
          <div class="prog-track"><div class="prog-fill" style="width:${Math.min(g.goles*7,100)}%;background:var(--accent)"></div></div>
        </div>`).join('') || '<p class="text-muted text-sm">Sin datos</p>';


      document.getElementById('estd-tarjetas').innerHTML = d.tarjetas_jugador.map(j => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <span>${j.nombre}</span>
          <span><span class="badge badge-yellow">${j.amarillas} 🟨</span> <span class="badge badge-red">${j.rojas} 🟥</span></span>
        </div>`).join('') || '<p class="text-muted text-sm">Sin datos</p>';

      const clTbody = document.getElementById('estd-clas');
      clTbody.innerHTML = d.clasificacion.map((e,i) => `
        <tr>
          <td><strong ${i===0?'style="color:var(--accent4)"':''}>${i+1}</strong></td>
          <td><strong>${e.nombre}</strong></td>
          <td>${e.pj||0}</td>
          <td class="text-accent">${e.g||0}</td>
          <td class="text-accent4">${e.emp||0}</td>
          <td class="text-accent3">${e.d||0}</td>
          <td>${e.gf||0}</td>
          <td>${e.gc||0}</td>
          <td><strong ${i===0?'style="color:var(--accent)"':''}>${e.pts||0}</strong></td>
        </tr>`).join('') || '<tr><td colspan="9" class="text-muted" style="padding:16px">Sin datos</td></tr>';
    } catch(e) { toast(e.message,'danger'); }
  }
};


Pages.usuarios = {
  async load() {
    const tbody = document.getElementById('usuarios-tbody');
    try {
      const data = await API.get('usuarios');
      tbody.innerHTML = data.map(u => `
        <tr>
          <td>${avatarCell(u.nombre, u.rol)}</td>
          <td>${u.email}</td>
          <td>${badge(u.rol)}</td>
          <td class="text-sm text-muted">${u.ultimo_acceso ? fmtDateTime(u.ultimo_acceso) : 'Nunca'}</td>
          <td>${badge(u.activo?'Activo':'Inactivo')}</td>
          <td>${actionBtns(`Pages.usuarios.edit(${u.id})`,`Pages.usuarios.del(${u.id},'${u.nombre}')`)}</td>
        </tr>`).join('');
    } catch(e) { toast(e.message,'danger'); }
  },

  openForm(id = null) {
    const load = async () => {
      const list = id ? await API.get('usuarios') : [];
      const u = list.find(x=>x.id==id)||{};
      Modal.open(`
        <div class="modal-header">
          <div class="modal-title">${id?'✏️ Editar':'🔐 Nuevo'} Administrador</div>
          <button class="modal-close" onclick="Modal.close()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group"><label class="form-label">Nombre *</label><input id="fu_nombre" class="form-input" value="${u.nombre||''}"></div>
            <div class="form-group"><label class="form-label">Rol</label>
              <select id="fu_rol" class="form-select">${['superadmin','admin','manager','readonly'].map(r=>`<option ${u.rol===r?'selected':''}>${r}</option>`).join('')}</select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Email *</label><input id="fu_email" class="form-input" type="email" value="${u.email||''}"></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Contraseña ${id?'(dejar vacío = sin cambiar)':' *'}</label><input id="fu_pass" class="form-input" type="password" placeholder="••••••••"></div>
            <div class="form-group"><label class="form-label">Estado</label>
              <select id="fu_activo" class="form-select"><option value="1" ${u.activo!==0?'selected':''}>Activo</option><option value="0" ${u.activo===0?'selected':''}>Inactivo</option></select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
          <button class="btn btn-primary" onclick="Pages.usuarios.save(${id||'null'})">💾 Guardar</button>
        </div>`);
    };
    load();
  },

  async save(id) {
    const body = { nombre:document.getElementById('fu_nombre').value.trim(), email:document.getElementById('fu_email').value, rol:document.getElementById('fu_rol').value, activo:document.getElementById('fu_activo').value, password:document.getElementById('fu_pass').value };
    if (!body.nombre||!body.email) { toast('Nombre y email son obligatorios','warning'); return; }
    if (!id && !body.password)     { toast('La contraseña es obligatoria para nuevos usuarios','warning'); return; }
    try {
      if (id) await API.put('usuarios',id,body);
      else    await API.post('usuarios',body);
      Modal.close(); toast('✅ Usuario guardado'); this.load();
    } catch(e) { toast(e.message,'danger'); }
  },

  edit(id) { this.openForm(id); },
  del(id, nombre) {
    confirmDelete(`¿Eliminar al usuario <strong>${nombre}</strong>?`, async () => {
      try { await API.delete('usuarios',id); toast('🗑️ Usuario eliminado'); this.load(); }
      catch(e) { toast(e.message,'danger'); }
    });
  }
};


document.addEventListener('DOMContentLoaded', () => {
  navigate('dashboard');
});
