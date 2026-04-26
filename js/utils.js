// Shared utility functions — pure, no DOM, no Supabase
// Exported for both browser (window.utils) and Node/Vitest (module.exports)

// ── Date helpers ───────────────────────────────────────────────

/**
 * Calculate age in full years from a birth date string (YYYY-MM-DD) to today.
 * @param {string} fechaNacimiento — ISO date string
 * @param {Date} [now] — injectable for testing
 * @returns {number}
 */
function calcularEdad(fechaNacimiento, now = new Date()) {
  const nacimiento = new Date(fechaNacimiento);
  let age = now.getFullYear() - nacimiento.getFullYear();
  const m = now.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < nacimiento.getDate())) age--;
  return age;
}

/**
 * Format a DATE string (YYYY-MM-DD) to Spanish locale e.g. "25 de abril de 2026".
 * @param {string} dateStr
 * @returns {string}
 */
function formatFecha(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Format a DATE string as uppercase short e.g. "25 ABRIL 2026".
 * @param {string} dateStr
 * @returns {string}
 */
function formatFechaCorta(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
}

/**
 * Return today's date as YYYY-MM-DD string (local time).
 * @returns {string}
 */
function hoy() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── Body composition calculations ─────────────────────────────

/**
 * Masa grasa en kg.
 * @param {number} pesoKg
 * @param {number} grasaPct — percentage (e.g. 22.0)
 * @returns {number} rounded to 1 decimal
 */
function masaGrasaKg(pesoKg, grasaPct) {
  return Math.round((pesoKg * grasaPct / 100) * 10) / 10;
}

/**
 * Masa muscular en kg.
 * @param {number} pesoKg
 * @param {number} musculoPct — percentage (e.g. 38.0)
 * @returns {number} rounded to 1 decimal
 */
function masaMuscularKg(pesoKg, musculoPct) {
  return Math.round((pesoKg * musculoPct / 100) * 10) / 10;
}

/**
 * Masa libre de grasa (MLG) = peso - masa grasa.
 * @param {number} pesoKg
 * @param {number} grasaPct
 * @returns {number} rounded to 1 decimal
 */
function masaLibreDeGrasa(pesoKg, grasaPct) {
  return Math.round((pesoKg - masaGrasaKg(pesoKg, grasaPct)) * 10) / 10;
}

/**
 * Masa ósea estimada (Pietrobelli et al. 1998).
 * @param {number} mlgKg — masa libre de grasa en kg
 * @param {'M'|'F'} sexo
 * @returns {number} rounded to 1 decimal
 */
function masaOseaKg(mlgKg, sexo) {
  const factor = sexo === 'M' ? 0.191 : 0.161;
  return Math.round(mlgKg * factor * 10) / 10;
}

/**
 * Índice de masa magra = MLG / estatura_m².
 * @param {number} mlgKg
 * @param {number} estaturaCm
 * @returns {number} rounded to 1 decimal
 */
function indiceMasaMagra(mlgKg, estaturaCm) {
  const estM = estaturaCm / 100;
  return Math.round(mlgKg / (estM * estM) * 10) / 10;
}

/**
 * Proteína estimada = masa_muscular × 0.20.
 * @param {number} musculoKg
 * @returns {number} rounded to 1 decimal
 */
function proteinaKg(musculoKg) {
  return Math.round(musculoKg * 0.20 * 10) / 10;
}

/**
 * GET sedentario = TMB × 1.2, rounded to integer.
 * @param {number} tmb
 * @returns {number}
 */
function getSedentario(tmb) {
  return Math.round(tmb * 1.2);
}

/**
 * GET moderado = TMB × 1.55, rounded to integer.
 * @param {number} tmb
 * @returns {number}
 */
function getModerado(tmb) {
  return Math.round(tmb * 1.55);
}

// ── Delta / comparison ─────────────────────────────────────────

/**
 * Calculate delta between current and previous value.
 * @param {number} actual
 * @param {number} anterior
 * @returns {number} rounded to 1 decimal
 */
function calcularDelta(actual, anterior) {
  return Math.round((actual - anterior) * 10) / 10;
}

/**
 * Format a delta value with sign and arrow.
 * @param {number} delta
 * @param {'lower-is-better'|'higher-is-better'} direction
 * @returns {{ text: string, clase: 'delta-good'|'delta-bad'|'delta-neu' }}
 */
function formatDelta(delta, direction = 'lower-is-better') {
  if (delta === 0) return { text: '— sin cambio', clase: 'delta-neu' };
  const arrow = delta < 0 ? '↓' : '↑';
  const absVal = Math.abs(delta);
  const isGood = direction === 'lower-is-better' ? delta < 0 : delta > 0;
  return {
    text: `${arrow} ${absVal}`,
    clase: isGood ? 'delta-good' : 'delta-bad'
  };
}

/**
 * Get the IMC classification label.
 * @param {number} imc
 * @returns {string}
 */
function clasificarIMC(imc) {
  if (imc < 18.5) return 'Bajo peso';
  if (imc < 25)   return 'Normal';
  if (imc < 30)   return 'Sobrepeso';
  if (imc < 35)   return 'Obesidad I';
  if (imc < 40)   return 'Obesidad II';
  return 'Obesidad III';
}

/**
 * Get % grasa classification by sex.
 * @param {number} grasaPct
 * @param {'M'|'F'} sexo
 * @returns {string}
 */
function clasificarGrasa(grasaPct, sexo) {
  if (sexo === 'M') {
    if (grasaPct < 6)  return 'Esencial';
    if (grasaPct < 14) return 'Atlético';
    if (grasaPct < 18) return 'Fitness';
    if (grasaPct < 25) return 'Promedio';
    return 'Obeso';
  }
  // Female
  if (grasaPct < 14) return 'Esencial';
  if (grasaPct < 21) return 'Atlética';
  if (grasaPct < 25) return 'Fitness';
  if (grasaPct < 32) return 'Promedio';
  return 'Obesa';
}

/**
 * Get grasa visceral classification.
 * @param {number} nivel — 1 to 20
 * @returns {string}
 */
function clasificarGrasaVisceral(nivel) {
  if (nivel <= 9)  return 'Normal';
  if (nivel <= 14) return 'Elevado';
  return 'Muy elevado';
}

/**
 * Get body age delta classification.
 * @param {number} bodyAge
 * @param {number} edadReal
 * @returns {string}
 */
function clasificarBodyAge(bodyAge, edadReal) {
  const diff = bodyAge - edadReal;
  if (diff <= -5)  return 'Excelente';
  if (diff <= 0)   return 'Muy bueno';
  if (diff <= 5)   return 'Normal';
  return 'Por mejorar';
}

// ── Derived metric bundle ──────────────────────────────────────

/**
 * Compute all derived metrics from a raw measurement + profile.
 * @param {object} m — measurement row from DB
 * @param {object} p — profile row from DB
 * @returns {object}
 */
function calcularMetricas(m, p) {
  const mlg     = masaLibreDeGrasa(m.peso_kg, m.grasa_pct);
  const grasa   = masaGrasaKg(m.peso_kg, m.grasa_pct);
  const musculo = masaMuscularKg(m.peso_kg, m.musculo_pct);
  const osea    = masaOseaKg(mlg, p.sexo);
  const imm     = indiceMasaMagra(mlg, p.estatura_cm);
  const prot    = proteinaKg(musculo);
  const getSed  = getSedentario(m.tmb_kcal);
  const getMod  = getModerado(m.tmb_kcal);
  const edad    = calcularEdad(p.fecha_nacimiento);

  return {
    mlg,
    grasa,
    musculo,
    osea,
    imm,
    prot,
    getSed,
    getMod,
    edad,
    claseIMC:    clasificarIMC(m.imc),
    claseGrasa:  clasificarGrasa(m.grasa_pct, p.sexo),
    claseGrasaV: clasificarGrasaVisceral(m.grasa_visceral),
    claseBodyAge: clasificarBodyAge(m.body_age, edad)
  };
}

// ── Number formatting ──────────────────────────────────────────

/**
 * Format a number with fixed decimals, removing trailing zeros.
 * @param {number} n
 * @param {number} decimals
 * @returns {string}
 */
function fmt(n, decimals = 1) {
  return Number(n.toFixed(decimals)).toString();
}

// ── Export: browser + Node/Vitest ──────────────────────────────

const utils = {
  calcularEdad,
  formatFecha,
  formatFechaCorta,
  hoy,
  masaGrasaKg,
  masaMuscularKg,
  masaLibreDeGrasa,
  masaOseaKg,
  indiceMasaMagra,
  proteinaKg,
  getSedentario,
  getModerado,
  calcularDelta,
  formatDelta,
  clasificarIMC,
  clasificarGrasa,
  clasificarGrasaVisceral,
  clasificarBodyAge,
  calcularMetricas,
  fmt
};

if (typeof module !== 'undefined') module.exports = utils;
if (typeof window !== 'undefined') window.utils = utils;
