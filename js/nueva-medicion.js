let currentUser    = null;
let currentProfile = null;
let editId         = null;

(async () => {
  const session = await getSession();
  currentUser = session.user;
  const { data } = await getProfile(currentUser.id);
  currentProfile = data;

  editId = new URLSearchParams(window.location.search).get('edit');

  if (editId) {
    document.querySelector('.page-title').textContent = 'Editar medición';
    document.getElementById('btn-guardar').textContent = 'Guardar cambios';
    document.querySelector('p[style*="Se guardará"]').textContent =
      'Se actualizará la medición y su reporte PDF.';
    await precargarMedicion(editId);
  } else {
    document.getElementById('fecha-medicion').value = utils.hoy();
  }
})();

async function precargarMedicion(id) {
  const { data: m, error } = await getMeasurementById(id);
  if (error || !m) {
    showToast('Error al cargar la medición.', 'error');
    return;
  }
  document.getElementById('fecha-medicion').value = m.fecha_medicion;
  document.getElementById('peso').value            = m.peso_kg;
  document.getElementById('imc').value             = m.imc;
  document.getElementById('grasa').value           = m.grasa_pct;
  document.getElementById('musculo').value         = m.musculo_pct;
  document.getElementById('tmb').value             = m.tmb_kcal;
  document.getElementById('body-age').value        = m.body_age;
  document.getElementById('grasa-visceral').value  = m.grasa_visceral;
  document.getElementById('notas').value           = m.notas || '';
}

// ── Validation ─────────────────────────────────────────────────

const FIELDS = [
  { id: 'peso',           errId: 'err-peso',           label: 'Peso',           min: 20,  max: 300  },
  { id: 'imc',            errId: 'err-imc',            label: 'IMC',            min: 10,  max: 70   },
  { id: 'grasa',          errId: 'err-grasa',          label: '% Grasa',        min: 1,   max: 70   },
  { id: 'musculo',        errId: 'err-musculo',        label: '% Músculo',      min: 1,   max: 80   },
  { id: 'tmb',            errId: 'err-tmb',            label: 'TMB',            min: 500, max: 5000 },
  { id: 'body-age',       errId: 'err-body-age',       label: 'Body Age',       min: 10,  max: 100  },
  { id: 'grasa-visceral', errId: 'err-grasa-visceral', label: 'Grasa Visceral', min: 1,   max: 20   }
];

function validateForm() {
  let ok = true;
  FIELDS.forEach(f => {
    const input = document.getElementById(f.id);
    const errEl = document.getElementById(f.errId);
    const val   = parseFloat(input.value);
    input.classList.remove('error');
    errEl.classList.remove('visible');

    if (!input.value) {
      input.classList.add('error');
      errEl.textContent = `${f.label} es obligatorio.`;
      errEl.classList.add('visible');
      ok = false;
    } else if (val < f.min || val > f.max) {
      input.classList.add('error');
      errEl.textContent = `${f.label} debe estar entre ${f.min} y ${f.max}.`;
      errEl.classList.add('visible');
      ok = false;
    }
  });

  const fecha = document.getElementById('fecha-medicion').value;
  if (!fecha) {
    showToast('Seleccioná la fecha de la medición.', 'error');
    ok = false;
  }
  return ok;
}

// ── Save ───────────────────────────────────────────────────────

async function guardarMedicion() {
  if (!validateForm()) return;

  const btn = document.getElementById('btn-guardar');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Guardando...';

  const payload = {
    fecha_medicion: document.getElementById('fecha-medicion').value,
    peso_kg:        parseFloat(document.getElementById('peso').value),
    imc:            parseFloat(document.getElementById('imc').value),
    grasa_pct:      parseFloat(document.getElementById('grasa').value),
    musculo_pct:    parseFloat(document.getElementById('musculo').value),
    tmb_kcal:       parseInt(document.getElementById('tmb').value, 10),
    body_age:       parseInt(document.getElementById('body-age').value, 10),
    grasa_visceral: parseInt(document.getElementById('grasa-visceral').value, 10),
    notas:          document.getElementById('notas').value.trim() || null
  };

  let savedId;

  if (editId) {
    const { data, error } = await updateMeasurement(editId, payload);
    if (error) {
      btn.disabled = false;
      btn.textContent = 'Guardar cambios';
      showToast('Error al guardar: ' + error.message, 'error');
      return;
    }
    savedId = editId;
    // Delete old PDF so it gets regenerated
    await deletePdf(currentUser.id, savedId);
    await updateMeasurementPdfUrl(savedId, null);
  } else {
    const { data, error } = await insertMeasurement({ user_id: currentUser.id, ...payload });
    if (error) {
      btn.disabled = false;
      btn.textContent = 'Guardar y generar PDF';
      showToast('Error al guardar: ' + error.message, 'error');
      return;
    }
    savedId = data.id;
  }

  // Generate and upload PDF
  btn.innerHTML = '<span class="spinner"></span>Generando PDF...';
  try {
    const { data: historial } = await getMeasurements(currentUser.id, { limit: 6, order: 'asc' });
    const { data: medicionFull } = await getMeasurementById(savedId);
    const pdfBlob = await generarPDFBlob(medicionFull, currentProfile, historial || []);

    const { url, error: uploadErr } = await uploadPdf(currentUser.id, savedId, pdfBlob);
    if (!uploadErr && url) {
      await updateMeasurementPdfUrl(savedId, url);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(pdfBlob);
      a.download = `biocomp-${medicionFull.fecha_medicion}.pdf`;
      a.click();
    }
  } catch (pdfErr) {
    console.error('PDF generation error:', pdfErr);
    showToast('Medición guardada. Error al generar PDF.', 'error');
  }

  window.location.href = '/historial.html';
}

function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  setTimeout(() => el.classList.remove('show'), 3000);
}
