// Cotiza - Supabase client + auth helpers
// Exposes: window.sb, window.CotizaAuth

(function () {
  function showElement(element, display = "") {
    if (element) element.style.display = display;
  }

  function setText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  }

  const fallbackAuth = {
    user: null,
    businessId: null,
    isNewBusiness: false,
    async init() {
      this._showApp();
      this._updateCloudUi();
    },
    async signIn() {
      throw new Error("Supabase no esta disponible en este navegador.");
    },
    async signOut() {},
    openLogin() {
      showElement(document.getElementById("cotiza-login-overlay"), "flex");
    },
    closeLogin() {
      showElement(document.getElementById("cotiza-login-overlay"), "none");
    },
    _showApp() {
      showElement(document.querySelector(".layout"));
      showElement(document.querySelector(".topbar"));
    },
    _updateCloudUi() {
      setText("cloudStatus", "Modo local");
      const loginButton = document.getElementById("openLogin");
      const logoutButton = document.getElementById("logout-btn");
      if (loginButton) loginButton.hidden = false;
      if (logoutButton) logoutButton.hidden = true;
    },
  };

  if (
    typeof supabase === "undefined" ||
    typeof SUPABASE_URL === "undefined" ||
    typeof SUPABASE_ANON_KEY === "undefined"
  ) {
    window.CotizaAuth = fallbackAuth;
    document.addEventListener("DOMContentLoaded", () => fallbackAuth.init());
    return;
  }

  const { createClient } = supabase;
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.sb = sb;

  const CotizaAuth = {
    user: null,
    businessId: null,
    isNewBusiness: false,

    async init() {
      this._bindLoginControls();
      const {
        data: { session },
      } = await sb.auth.getSession();

      if (session) {
        this.user = session.user;
        try {
          await this._loadBusiness();
          this._showApp();
          await this._refreshCloudData();
        } catch (err) {
          console.error("Error cargando negocio en init():", err);
          this._showApp();
        }
      } else {
        this._showLocalMode();
      }

      sb.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          this.user = session.user;
          try {
            await this._loadBusiness();
            this._showApp();
            await this._refreshCloudData();
          } catch (err) {
            console.error("Error al cargar datos de la nube:", err);
            this._showApp();
          }
        } else if (event === "SIGNED_OUT") {
          this.user = null;
          this.businessId = null;
          this.isNewBusiness = false;
          this._showLocalMode();
        }
      });
    },

    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },

    async signOut() {
      await sb.auth.signOut();
    },

    openLogin() {
      const error = document.getElementById("login-error");
      if (error) {
        error.textContent = "";
        error.style.display = "none";
      }
      showElement(document.getElementById("cotiza-login-overlay"), "flex");
    },

    closeLogin() {
      showElement(document.getElementById("cotiza-login-overlay"), "none");
    },

    async _loadBusiness() {
      this.isNewBusiness = false;
      const { data: rows, error } = await sb
        .from("businesses")
        .select("id")
        .eq("owner_id", this.user.id)
        .order("created_at", { ascending: true })
        .limit(1);

      if (error) throw error;

      const data = rows?.[0] ?? null;

      if (data) {
        this.businessId = data.id;
        return;
      }

      const { data: created, error: createErr } = await sb
        .from("businesses")
        .insert({ owner_id: this.user.id, name: "Mi negocio" })
        .select("id")
        .single();
      if (createErr) throw createErr;
      this.businessId = created.id;
      this.isNewBusiness = true;
    },

    async _refreshCloudData() {
      if (!window.CotizaSync?.loadAndApply) return;
      await window.CotizaSync.loadAndApply({ seedIfEmpty: this.isNewBusiness });
    },

    _bindLoginControls() {
      document.getElementById("openLogin")?.addEventListener("click", () => this.openLogin());
      document.getElementById("login-cancel")?.addEventListener("click", () => this.closeLogin());
      document.getElementById("logout-btn")?.addEventListener("click", () => this.signOut());
      document.getElementById("login-btn")?.addEventListener("click", async () => {
        const button = document.getElementById("login-btn");
        const error = document.getElementById("login-error");
        button.disabled = true;
        button.textContent = "Entrando...";
        try {
          await this.signIn(
            document.getElementById("login-email").value,
            document.getElementById("login-password").value
          );
        } catch (err) {
          error.textContent = err.message;
          error.style.display = "block";
        } finally {
          button.disabled = false;
          button.textContent = "Entrar";
        }
      });
    },

    _showLocalMode() {
      this.closeLogin();
      this._showApp();
      this._updateCloudUi();
    },

    _showApp() {
      this.closeLogin();
      showElement(document.querySelector(".layout"));
      showElement(document.querySelector(".topbar"));
      this._updateCloudUi();
    },

    _updateCloudUi() {
      const isLoggedIn = Boolean(this.user && this.businessId);
      setText("cloudStatus", isLoggedIn ? "Nube conectada" : "Modo local");
      const loginButton = document.getElementById("openLogin");
      const logoutButton = document.getElementById("logout-btn");
      if (loginButton) loginButton.hidden = isLoggedIn;
      if (logoutButton) logoutButton.hidden = !isLoggedIn;

      // Banner y botón restaurar: ocultar advertencias cuando hay nube conectada
      const noticeText = document.getElementById("demo-notice-text");
      const restoreBtn = document.querySelector("button.restore-btn, #restore-demo, [data-action='restore']");
      if (noticeText) {
        noticeText.textContent = isLoggedIn
          ? "Tus datos se guardan en la nube automaticamente."
          : "No cargues datos sensibles. La informacion se guarda solo en este navegador y puede borrarse desde \"Restaurar demo\".";
      }
      if (restoreBtn) restoreBtn.hidden = isLoggedIn;
    },
  };

  window.CotizaAuth = CotizaAuth;
  document.addEventListener("DOMContentLoaded", () => CotizaAuth.init());
})();
