let currentUser   = null;
let currentProfile = null;

(async () => {
  const session = await getSession();
  currentUser = session.user;
  const { data } = await getProfile(currentUser.id);
  currentProfile = data;

  // Default date = today
  document.getElementById('fecha-medicion').value = utils.hoy();
})();

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

  const medicion = {
    user_id:        currentUser.id,
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

  const { data, error } = await insertMeasurement(medicion);
  if (error) {
    btn.disabled = false;
    btn.textContent = 'Guardar y generar PDF';
    showToast('Error al guardar: ' + error.message, 'error');
    return;
  }

  // Generate PDF
  btn.innerHTML = '<span class="spinner"></span>Generando PDF...';
  try {
    // Fetch last 6 measurements for the history trend chart in PDF
    const { data: historial } = await getMeasurements(currentUser.id, { limit: 6, order: 'asc' });
    const pdfBlob = await generarPDFBlob(data, currentProfile, historial || []);

    // Upload to Storage
    const { url, error: uploadErr } = await uploadPdf(currentUser.id, data.id, pdfBlob);
    if (!uploadErr && url) {
      await updateMeasurementPdfUrl(data.id, url);
      // Trigger browser download
      const a = document.createElement('a');
      a.href = URL.createObjectURL(pdfBlob);
      a.download = `biocomp-${data.fecha_medicion}.pdf`;
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
