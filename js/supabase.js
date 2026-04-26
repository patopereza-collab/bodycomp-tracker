// Supabase client — replace placeholders with your project credentials
const SUPABASE_URL = 'REEMPLAZAR_CON_TU_URL';
const SUPABASE_KEY = 'REEMPLAZAR_CON_TU_ANON_KEY';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Auth helpers ───────────────────────────────────────────────

async function signUp(email, password) {
  return sb.auth.signUp({ email, password });
}

async function signIn(email, password) {
  return sb.auth.signInWithPassword({ email, password });
}

async function signOut() {
  return sb.auth.signOut();
}

async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}

// ── Profile helpers ────────────────────────────────────────────

async function getProfile(userId) {
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

async function upsertProfile(profile) {
  const { data, error } = await sb
    .from('profiles')
    .upsert(profile, { onConflict: 'id' });
  return { data, error };
}

// ── Measurements helpers ───────────────────────────────────────

async function getMeasurements(userId, { limit = 100, order = 'desc' } = {}) {
  const { data, error } = await sb
    .from('measurements')
    .select('*')
    .eq('user_id', userId)
    .order('fecha_medicion', { ascending: order === 'asc' })
    .limit(limit);
  return { data, error };
}

async function insertMeasurement(measurement) {
  const { data, error } = await sb
    .from('measurements')
    .insert(measurement)
    .select()
    .single();
  return { data, error };
}

async function updateMeasurementPdfUrl(id, pdfUrl) {
  const { error } = await sb
    .from('measurements')
    .update({ pdf_url: pdfUrl })
    .eq('id', id);
  return { error };
}

// ── Storage helpers ────────────────────────────────────────────

async function uploadPdf(userId, measurementId, pdfBlob) {
  const path = `${userId}/${measurementId}.pdf`;
  const { data, error } = await sb.storage
    .from('pdf-reports')
    .upload(path, pdfBlob, { contentType: 'application/pdf', upsert: true });
  if (error) return { url: null, error };
  const { data: urlData } = sb.storage.from('pdf-reports').getPublicUrl(path);
  return { url: urlData.publicUrl, error: null };
}
