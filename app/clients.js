(function () {
const { escapeHtml, money, state } = window.Cotiza;
let clientsCache = [];
let selectedClientKey = "";

function normalizeName(value) {
  return String(value || "").trim() || "Sin cliente";
}

function quoteDate(savedQuote) {
  return savedQuote?.quote?.date || savedQuote?.savedAt?.slice(0, 10) || "";
}

function buildClientsFromQuotes(savedQuotes) {
  const clients = new Map();
  (Array.isArray(savedQuotes) ? savedQuotes : []).forEach((savedQuote) => {
    const name = normalizeName(savedQuote?.quote?.client);
    const key = name.toLowerCase();
    const current = clients.get(key) || {
      key,
      id: null,
      name,
      phone: "",
      email: "",
      firstContact: quoteDate(savedQuote),
      lastContact: quoteDate(savedQuote),
      quoteCount: 0,
      totalAmount: 0,
      quotes: [],
    };
    const date = quoteDate(savedQuote);
    if (date && (!current.firstContact || date < current.firstContact)) current.firstContact = date;
    if (date && (!current.lastContact || date > current.lastContact)) current.lastContact = date;
    current.quoteCount += 1;
    current.totalAmount += Number(savedQuote?.totals?.total) || 0;
    current.quotes.push(savedQuote);
    clients.set(key, current);
  });
  return [...clients.values()];
}

function sortClients(clients, sort) {
  return [...clients].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "recent") return String(b.lastContact || "").localeCompare(String(a.lastContact || ""));
    return b.totalAmount - a.totalAmount;
  });
}

function filterClients(clients) {
  const search = (document.getElementById("clientSearch")?.value || "").trim().toLowerCase();
  const sort = document.getElementById("clientSort")?.value || "volume";
  const filtered = search
    ? clients.filter((client) => `${client.name} ${client.phone}`.toLowerCase().includes(search))
    : clients;
  return sortClients(filtered, sort);
}

function buildQuoteLinesHtml(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return `<p class="client-history-empty">Sin partidas cargadas.</p>`;
  return `
    <div class="client-history-lines">
      ${lines
        .map(
          (line) => `
            <div class="client-history-line">
              <span>${escapeHtml(line.name || "Partida")}</span>
              <span>${escapeHtml(line.quantity || 0)} ${escapeHtml(line.unit || "unidad")} x ${money(line.unitPrice || 0)}</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function buildClientHistoryHtml(quotes) {
  return [...(quotes || [])]
    .sort((a, b) => String(quoteDate(b)).localeCompare(String(quoteDate(a))))
    .map(
      (savedQuote) => `
        <div class="client-history-item">
          <strong>${escapeHtml(savedQuote.quote?.number || "Sin numero")}</strong>
          <span>${escapeHtml(quoteDate(savedQuote) || "Sin fecha")} - ${escapeHtml(savedQuote.quote?.status || "draft")}</span>
          <span>${escapeHtml(savedQuote.quote?.address || "Sin direccion")} - ${money(savedQuote.totals?.total || 0)}</span>
          ${buildQuoteLinesHtml(savedQuote.lines || [])}
        </div>
      `
    )
    .join("");
}

function renderClientsTable() {
  const target = document.getElementById("clientsTable");
  if (!target) return;
  const clients = filterClients(clientsCache);
  if (clients.length === 0) {
    target.innerHTML = `<tr><td colspan="5">No hay clientes para mostrar.</td></tr>`;
    renderClientDetail(null);
    return;
  }
  if (!selectedClientKey || !clients.some((client) => client.key === selectedClientKey)) {
    selectedClientKey = clients[0].key;
  }
  target.innerHTML = clients
    .map(
      (client) => `
        <tr class="client-row ${client.key === selectedClientKey ? "active" : ""}" data-client-key="${escapeHtml(client.key)}">
          <td><strong>${escapeHtml(client.name)}</strong></td>
          <td>${escapeHtml(client.phone || "Sin indicar")}</td>
          <td>${escapeHtml(client.email || "Sin indicar")}</td>
          <td>${escapeHtml(client.firstContact || "Sin fecha")}</td>
          <td>${client.quoteCount} / ${money(client.totalAmount)}</td>
        </tr>
      `
    )
    .join("");
  renderClientDetail(clients.find((client) => client.key === selectedClientKey));
}

function renderClientDetail(client) {
  const target = document.getElementById("clientDetail");
  if (!target) return;
  if (!client) {
    target.innerHTML = `
      <p class="eyebrow">Historial</p>
      <h2>Selecciona un cliente</h2>
      <p>Al elegirlo vas a ver sus presupuestos, estados e importes.</p>
    `;
    return;
  }
  const history = buildClientHistoryHtml(client.quotes || []);
  target.innerHTML = `
    <p class="eyebrow">Historial</p>
    <h2>${escapeHtml(client.name)}</h2>
    <p>${client.quoteCount} presupuesto(s) - ${money(client.totalAmount)}</p>
    <div class="client-history">${history || "<p>Sin presupuestos asociados.</p>"}</div>
  `;
}

async function loadClients() {
  if (window.CotizaSync?.isEnabled?.() && window.CotizaSync?.getClientsWithQuoteStats) {
    clientsCache = await window.CotizaSync.getClientsWithQuoteStats();
  } else {
    clientsCache = buildClientsFromQuotes(state.savedQuotes || []);
  }
}

async function refresh() {
  await loadClients();
  renderClientsTable();
}

function bind() {
  document.getElementById("clientSearch")?.addEventListener("input", renderClientsTable);
  document.getElementById("clientSort")?.addEventListener("change", renderClientsTable);
  document.getElementById("clientsTable")?.addEventListener("click", (event) => {
    const row = event.target.closest("[data-client-key]");
    if (!row) return;
    selectedClientKey = row.dataset.clientKey;
    renderClientsTable();
  });
}

window.CotizaClients = {
  buildClientsFromQuotes,
  buildClientHistoryHtml,
  refresh,
};

document.addEventListener("DOMContentLoaded", () => {
  bind();
  refresh();
});
})();
