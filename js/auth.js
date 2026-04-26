// Auth guard — include in every protected page (all except index.html)
// Runs immediately; redirects to login if no session, to profile if name is empty.
(async () => {
  const session = await getSession();
  if (!session) {
    window.location.href = '/index.html';
    return;
  }
  const { data: profile } = await getProfile(session.user.id);
  // Skip profile check if we're already on perfil.html
  if (!profile?.nombre && !window.location.pathname.endsWith('perfil.html')) {
    window.location.href = '/perfil.html';
  }
})();
