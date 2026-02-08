<script>
async function requireAuth(supabaseClient) {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    window.location.href = "login.html";
    return null;
  }

  return data.session.user;
}
</script>
