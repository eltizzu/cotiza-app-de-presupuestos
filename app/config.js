// Cotiza - runtime config loader
// Deployed values come from /api/config. Keep real values out of this file.

(function () {
  let configPromise = null;

  async function loadConfig() {
    if (configPromise) return configPromise;
    configPromise = fetchConfig();
    return configPromise;
  }

  async function fetchConfig() {
    try {
      const response = await fetch("/api/config", { cache: "no-store" });
      if (!response.ok) throw new Error("Config no disponible");
      return await response.json();
    } catch {
      return {
        SUPABASE_URL: "",
        SUPABASE_ANON_KEY: "",
        SENTRY_DSN: "",
        SENTRY_ENVIRONMENT: "local",
      };
    }
  }

  window.CotizaConfig = { loadConfig };
})();
