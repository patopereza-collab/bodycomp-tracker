// Supabase client — replace placeholders with your project credentials
const SUPABASE_URL = 'https://fcvwnussrbdydxxbydth.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdndudXNzcmJkeWR4eGJ5ZHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNTI2MDUsImV4cCI6MjA5MjcyODYwNX0.3709eZcYol43OCZuD1hb7jgTPbyhaIvRsTd16wHNMQQ';

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

async function getMeasurementById(id) {
  const { data, error } = await sb
    .from('measurements')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
}

async function updateMeasurement(id, updates) {
  const { data, error } = await sb
    .from('measurements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

async function deleteMeasurement(id) {
  const { error } = await sb
    .from('measurements')
    .delete()
    .eq('id', id);
  return { error };
}

// ── Storage helpers ────────────────────────────────────────────

async function deletePdf(userId, measurementId) {
  const { error } = await sb.storage
    .from('pdf-reports')
    .remove([`${userId}/${measurementId}.pdf`]);
  return { error };
}

async function uploadPdf(userId, measurementId, pdfBlob) {
  const path = `${userId}/${measurementId}.pdf`;
  const { data, error } = await sb.storage
    .from('pdf-reports')
    .upload(path, pdfBlob, { contentType: 'application/pdf', upsert: true });
  if (error) return { url: null, error };
  const { data: urlData } = sb.storage.from('pdf-reports').getPublicUrl(path);
  return { url: urlData.publicUrl, error: null };
}
