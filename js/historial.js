let currentUser    = null;
let currentProfile = null;
let allMediciones  = [];
let pendingDeleteId = null;

(async () => {
  const session = await getSession();
  currentUser = session.user;

  const [{ data: profile }, { data: mediciones }] = await Promise.all([
    getProfile(currentUser.id),
    getMeasurements(currentUser.id, { order: 'desc' })
  ]);

  currentProfile = profile;
  allMediciones  = mediciones || [];

  document.getElementById('loading').style.display = 'none';
  document.getElementById('greeting').textContent = `Hola, ${profile?.nombre || ''}`.toUpperCase();

  if (allMediciones.length === 0) {
    document.getElementById('empty-state').style.display = 'block';
    return;
  }

  renderSummary();
  renderList();
})();

function renderSummary() {
  const latest = allMediciones[0];
  const prev   = allMediciones[1];

  document.getElementById('summary-strip').style.display = 'flex';
  document.getElementById('list-label').style.display    = 'block';

  document.getElementById('summary-peso').innerHTML =
    `${utils.fmt(latest.peso_kg)} <span class="unit">kg</span>`;
  document.getElementById('summary-fecha').textContent =
    utils.formatFecha(latest.fecha_medicion);

  if (prev) {
    const delta = utils.calcularDelta(latest.peso_kg, prev.peso_kg);
    const { text } = utils.formatDelta(delta, 'lower-is-better');
    const deltaEl = document.getElementById('summary-delta');
    deltaEl.style.display = 'block';
    document.getElementById('delta-val').textContent = text;
  }
}

function renderList() {
  const container = document.getElementById('mediciones-list');
  container.innerHTML = '';
  allMediciones.forEach((m, idx) => {
    const prev = allMediciones[idx + 1] || null;
    container.appendChild(buildCard(m, prev));
  });
}

function buildCard(m, prev) {
  const pesoD    = prev ? utils.formatDelta(utils.calcularDelta(m.peso_kg, prev.peso_kg), 'lower-is-better')        : null;
  const grasaD   = prev ? utils.formatDelta(utils.calcularDelta(m.grasa_pct, prev.grasa_pct), 'lower-is-better')    : null;
  const musculoD = prev ? utils.formatDelta(utils.calcularDelta(m.musculo_pct, prev.musculo_pct), 'higher-is-better') : null;

  const card = document.createElement('div');
  card.className = 'medicion-card';
  card.dataset.id = m.id;
  card.innerHTML = `
    <div class="card-top">
      <div class="card-date">${utils.formatFechaCorta(m.fecha_medicion)}</div>
      <div class="card-actions">
        <button class="pdf-btn" onclick="event.stopPropagation(); descargarPDF('${m.id}')">
          <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          PDF
        </button>
        <button class="edit-btn" onclick="event.stopPropagation(); editarMedicion('${m.id}')">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar
        </button>
        <button class="delete-btn" onclick="event.stopPropagation(); confirmarEliminar('${m.id}')">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
          Eliminar
        </button>
      </div>
    </div>
    <div class="card-kpis">
      <div class="kpi-chip kpi-weight">
        <span class="kpi-label">Peso</span>
        <span class="kpi-val">${utils.fmt(m.peso_kg)}</span>
        <span class="kpi-delta ${pesoD ? pesoD.clase : 'delta-neu'}">${pesoD ? pesoD.text + ' kg' : '—'}</span>
      </div>
      <div class="kpi-chip kpi-fat">
        <span class="kpi-label">% Grasa</span>
        <span class="kpi-val">${utils.fmt(m.grasa_pct)}%</span>
        <span class="kpi-delta ${grasaD ? grasaD.clase : 'delta-neu'}">${grasaD ? grasaD.text + '%' : '—'}</span>
      </div>
      <div class="kpi-chip kpi-muscle">
        <span class="kpi-label">% Músculo</span>
        <span class="kpi-val">${utils.fmt(m.musculo_pct)}%</span>
        <span class="kpi-delta ${musculoD ? musculoD.clase : 'delta-neu'}">${musculoD ? musculoD.text + '%' : '—'}</span>
      </div>
    </div>
  `;
  return card;
}

// ── Edit ───────────────────────────────────────────────────────

function editarMedicion(id) {
  window.location.href = `/nueva-medicion.html?edit=${id}`;
}

// ── Delete ─────────────────────────────────────────────────────

function confirmarEliminar(id) {
  pendingDeleteId = id;
  document.getElementById('delete-modal').classList.add('active');
}

function cerrarModal() {
  document.getElementById('delete-modal').classList.remove('active');
  pendingDeleteId = null;
}

async function ejecutarEliminar() {
  if (!pendingDeleteId) return;

  const btn = document.getElementById('btn-confirmar-delete');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="border-top-color:var(--red)"></span>Eliminando...';

  const m = allMediciones.find(x => x.id === pendingDeleteId);

  // Delete PDF from Storage if it exists
  if (m?.pdf_url) {
    await deletePdf(currentUser.id, pendingDeleteId);
  }

  // Delete measurement from DB
  const idToDelete = pendingDeleteId;
  const { error } = await deleteMeasurement(idToDelete);

  btn.disabled = false;
  btn.textContent = 'Eliminar';
  cerrarModal();

  if (error) {
    showToast('Error al eliminar: ' + error.message, 'error');
    return;
  }

  allMediciones = allMediciones.filter(x => x.id !== idToDelete);

  if (allMediciones.length === 0) {
    document.getElementById('summary-strip').style.display = 'none';
    document.getElementById('list-label').style.display    = 'none';
    document.getElementById('mediciones-list').innerHTML   = '';
    document.getElementById('empty-state').style.display  = 'block';
  } else {
    renderSummary();
    renderList();
  }

  showToast('Medición eliminada.', 'success');
}

// Close modal on overlay click
document.getElementById('delete-modal').addEventListener('click', function(e) {
  if (e.target === this) cerrarModal();
});

// ── PDF ────────────────────────────────────────────────────────

async function descargarPDF(medicionId) {
  const m = allMediciones.find(x => x.id === medicionId);
  if (!m) return;

  if (m.pdf_url) {
    window.open(m.pdf_url, '_blank');
    return;
  }

  showToast('Generando PDF...', '');

  try {
    const { data: historial } = await getMeasurements(currentUser.id, { limit: 6, order: 'asc' });
    const pdfBlob = await generarPDFBlob(m, currentProfile, historial || []);
    const { url } = await uploadPdf(currentUser.id, m.id, pdfBlob);
    if (url) {
      await updateMeasurementPdfUrl(m.id, url);
      m.pdf_url = url;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(pdfBlob);
    a.download = `biocomp-${m.fecha_medicion}.pdf`;
    a.click();
    showToast('PDF descargado.', 'success');
  } catch (err) {
    showToast('Error al generar PDF: ' + err.message, 'error');
  }
}

function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  setTimeout(() => el.classList.remove('show'), 3000);
}
