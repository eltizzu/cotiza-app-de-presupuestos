// Cotiza - error monitoring
// Sentry is enabled only when SENTRY_DSN is provided by /api/config.

(function () {
  let initialized = false;

  function toError(error) {
    if (error instanceof Error) return error;
    if (error && typeof error === "object" && typeof error.message === "string") {
      return new Error(error.message);
    }
    return new Error(String(error || "Error desconocido"));
  }

  function captureException(error, context = {}) {
    if (!initialized || !window.Sentry?.captureException) return;
    window.Sentry.captureException(toError(error), { extra: context });
  }

  function bindGlobalHandlers() {
    window.addEventListener("error", (event) => {
      captureException(event.error || event.message, { area: "window-error" });
    });
    window.addEventListener("unhandledrejection", (event) => {
      captureException(event.reason, { area: "unhandled-rejection" });
    });
  }

  async function init() {
    if (!window.Sentry || typeof window.CotizaConfig?.loadConfig !== "function") return;
    const config = await window.CotizaConfig.loadConfig();
    if (!config.SENTRY_DSN) return;

    window.Sentry.init({
      dsn: config.SENTRY_DSN,
      environment: config.SENTRY_ENVIRONMENT || "production",
      tracesSampleRate: 0,
    });
    initialized = true;
  }

  window.CotizaMonitoring = {
    captureException,
    init,
  };

  bindGlobalHandlers();
  init().catch(() => {});
})();
