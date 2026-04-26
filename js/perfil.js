let currentUserId = null;

(async () => {
  const session = await getSession();
  currentUserId = session.user.id;
  const { data: profile } = await getProfile(currentUserId);
  if (profile) cargarFormulario(profile);
})();

function cargarFormulario(profile) {
  if (profile.nombre)           document.getElementById('nombre').value = profile.nombre;
  if (profile.fecha_nacimiento) {
    document.getElementById('fecha-nacimiento').value = profile.fecha_nacimiento;
    actualizarEdad(profile.fecha_nacimiento);
  }
  if (profile.sexo)        document.getElementById('sexo').value = profile.sexo;
  if (profile.estatura_cm) document.getElementById('estatura').value = profile.estatura_cm;
}

document.getElementById('fecha-nacimiento').addEventListener('input', e => {
  actualizarEdad(e.target.value);
});

function actualizarEdad(fechaStr) {
  const el = document.getElementById('edad-display');
  if (!fechaStr) { el.textContent = '— años'; return; }
  const edad = utils.calcularEdad(fechaStr);
  el.textContent = `${edad} años`;
}

async function guardarPerfil() {
  const nombre   = document.getElementById('nombre').value.trim();
  const fecha    = document.getElementById('fecha-nacimiento').value;
  const sexo     = document.getElementById('sexo').value;
  const estatura = parseFloat(document.getElementById('estatura').value);

  if (!nombre || !fecha || !sexo || !estatura) {
    showToast('Completá todos los campos obligatorios.', 'error');
    return;
  }

  const btn = document.getElementById('btn-guardar');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Guardando...';

  const { error } = await upsertProfile({
    id: currentUserId,
    nombre,
    fecha_nacimiento: fecha,
    sexo,
    estatura_cm: estatura
  });

  btn.disabled = false;
  btn.textContent = 'Guardar perfil';

  if (error) { showToast('Error al guardar: ' + error.message, 'error'); return; }
  showToast('Perfil guardado correctamente.', 'success');
  setTimeout(() => { window.location.href = '/historial.html'; }, 1200);
}

async function cambiarContrasena() {
  const pass1 = document.getElementById('nueva-pass').value;
  const pass2 = document.getElementById('confirmar-pass').value;
  const errEl = document.getElementById('pass-error');
  errEl.classList.remove('visible');

  if (pass1.length < 6) { errEl.textContent = 'La contraseña debe tener al menos 6 caracteres.'; errEl.classList.add('visible'); return; }
  if (pass1 !== pass2)  { errEl.textContent = 'Las contraseñas no coinciden.'; errEl.classList.add('visible'); return; }

  const btn = document.getElementById('btn-cambiar-pass');
  btn.disabled = true;
  const { error } = await sb.auth.updateUser({ password: pass1 });
  btn.disabled = false;

  if (error) { errEl.textContent = error.message; errEl.classList.add('visible'); return; }
  document.getElementById('nueva-pass').value = '';
  document.getElementById('confirmar-pass').value = '';
  showToast('Contraseña actualizada.', 'success');
}

async function cerrarSesion() {
  await signOut();
  window.location.href = '/index.html';
}

function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  setTimeout(() => { el.classList.remove('show'); }, 3000);
}
