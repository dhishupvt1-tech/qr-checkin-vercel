// authGuard.js
async function requireAuth(supabaseClient) {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error || !data.session) {
    window.location.href = "login.html";
    return null;
  }

  return data.session.user;
}
