// authGuard.js

// Hide page instantly
document.documentElement.style.display = "none";

async function requireAuth(supabaseClient) {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error || !data.session) {
    window.location.replace("login.html");
    return null;
  }

  // Show page ONLY if authenticated
  document.documentElement.style.display = "block";
  return data.session.user;
}
