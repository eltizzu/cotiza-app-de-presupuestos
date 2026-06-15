// Cotiza - runtime config loader
// anon key is intentionally public (Supabase client-side key, RLS enforced)

(function () {
  const STATIC_CONFIG = {
    SUPABASE_URL: "https://pszjetkmuajjiwrrlunn.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzempldGttdWFqaml3cnJsdW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTM3NjEsImV4cCI6MjA5NjIyOTc2MX0.OCK1l58FmAFTy5C0I5GGUakQZ_h-2D2NS7yUTLBRF0w",
    SENTRY_DSN: "",
    SENTRY_ENVIRONMENT: "production",
  };

  async function loadConfig() {
    return STATIC_CONFIG;
  }

  window.CotizaConfig = { loadConfig };
})();
