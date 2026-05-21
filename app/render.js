(function () {
const { escapeHtml, money, quoteStatuses, state, variableLabels } = window.Cotiza;

function showSection(id) {
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
  document.querySelectorAll(".nav-button").forEach((button) => button.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelector(`[data-section="${id}"]`).classList.add("active");
}

function renderSettings() {
  document.getElementById("businessName").textContent = state.settings.businessName;
  document.getElementById("defaultMargin").textContent = `Margen ${state.settings.margin}%`;
  document.getElementById("inputBusinessName").value = state.settings.businessName;
  document.getElementById("inputCurrency").value = state.settings.currency;
  document.getElementById("inputTax").value = state.settings.tax;
  document.getElementById("inputMargin").value = state.settings.margin;
}

function renderPrices() {
  document.getElementById("pricesTable").innerHTML = state.prices
    .map(
      (price) => `
        <tr>
          <td>${escapeHtml(price.name)}</td>
          <td>${escapeHtml(price.type)}</td>
          <td>${escapeHtml(price.unit)}</td>
          <td>${money(price.price)}</td>
        </tr>
      `
    )
    .join("");
  renderTemplateOptions();
}

function renderRules() {
  document.getElementById("rulesTable").innerHTML = state.rules
    .map(
      (rule) => `
        <tr>
          <td>${escapeHtml(rule.name)}</td>
          <td>${variableLabels[rule.variable]}</td>
          <td>${rule.factor}</td>
          <td>${escapeHtml(rule.unit)}</td>
        </tr>
      `
    )
    .join("");
  renderTemplateOptions();
}

function renderTemplates() {
  document.getElementById("templateList").innerHTML = state.templates
    .map(
      (template) => `
        <article class="template-card" data-template-card="${template.id}">
          <h3>${escapeHtml(template.name)}</h3>
          <p>${escapeHtml(template.description)}</p>
          <div class="template-meta">${template.lines.length} partidas configuradas</div>
          <div class="template-actions">
            <button class="secondary-action" type="button" data-template-edit="${template.id}">Editar</button>
            <button class="secondary-action" type="button" data-template-duplicate="${template.id}">Duplicar</button>
          </div>
        </article>
      `
    )
    .join("");

  document.getElementById("budgetTemplate").innerHTML = state.templates
    .map((template) => `<option value="${escapeHtml(template.id)}">${escapeHtml(template.name)}</option>`)
    .join("");
}

function renderQuoteData() {
  document.getElementById("quoteNumber").value = state.quote.number;
  document.getElementById("quoteClient").value = state.quote.client;
  document.getElementById("quoteAddress").value = state.quote.address;
  document.getElementById("quoteValidity").value = state.quote.validity;
  document.getElementById("quoteDate").value = state.quote.date || new Date().toISOString().slice(0, 10);
  document.getElementById("quoteStatus").value = state.quote.status || "draft";
}

function renderTemplateOptions() {
  document.getElementById("templateLinePrice").innerHTML = state.prices
    .map((price) => `<option value="${escapeHtml(price.name)}">${escapeHtml(price.name)}</option>`)
    .join("");
  document.getElementById("templateLineRule").innerHTML = state.rules
    .map((rule) => `<option value="${escapeHtml(rule.name)}">${escapeHtml(rule.name)}</option>`)
    .join("");
}

function renderDraftTemplateLines() {
  document.getElementById("draftTemplateLines").innerHTML = state.draftTemplateLines
    .map((line, index) => {
      const calcText = line.ruleName
        ? `Rendimiento: ${line.ruleName} x ${line.multiplier || 1}`
        : `${variableLabels[line.variable]} x ${line.factor || 1}`;
      return `
        <div class="mini-item">
          <span>${escapeHtml(line.priceName)}<br />${escapeHtml(calcText)}</span>
          <button class="remove-line" type="button" data-draft-remove="${index}" aria-label="Quitar partida">x</button>
        </div>
      `;
    })
    .join("");
}

function renderBudget() {
  document.getElementById("budgetLines").innerHTML = state.budgetLines
    .map(
      (line, index) => `
        <tr>
          <td><input value="${escapeHtml(line.name)}" data-index="${index}" data-field="name" /></td>
          <td><input type="number" min="0" step="0.01" value="${line.quantity}" data-index="${index}" data-field="quantity" /></td>
          <td><input value="${escapeHtml(line.unit)}" data-index="${index}" data-field="unit" /></td>
          <td><input type="number" min="0" step="0.01" value="${line.unitPrice}" data-index="${index}" data-field="unitPrice" /></td>
          <td>
            <span data-line-total="${index}">${money(line.quantity * line.unitPrice)}</span>
            <span class="line-actions">
              <button class="line-action" data-move-up="${index}" ${index === 0 ? "disabled" : ""} aria-label="Subir linea">^</button>
              <button class="line-action" data-move-down="${index}" ${index === state.budgetLines.length - 1 ? "disabled" : ""} aria-label="Bajar linea">v</button>
              <button class="remove-line" data-remove="${index}" aria-label="Quitar linea">x</button>
            </span>
          </td>
        </tr>
      `
    )
    .join("");
  renderTotals();
}

function getTotals() {
  const cost = state.budgetLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const margin = cost * (state.settings.margin / 100);
  const beforeTax = cost + margin;
  const tax = beforeTax * (state.settings.tax / 100);
  const total = beforeTax + tax;
  return { cost, margin, beforeTax, tax, total };
}

function renderTotals() {
  const { cost, margin, beforeTax, tax, total } = getTotals();
  document.getElementById("costTotal").textContent = money(cost);
  document.getElementById("subtotal").textContent = money(beforeTax);
  document.getElementById("marginTotal").textContent = money(margin);
  document.getElementById("taxTotal").textContent = money(tax);
  document.getElementById("grandTotal").textContent = money(total);
  renderPrintSheet({ cost, margin, beforeTax, tax, total });
}

function renderLineTotal(index) {
  const line = state.budgetLines[index];
  const target = document.querySelector(`[data-line-total="${index}"]`);
  if (!line || !target) return;
  target.textContent = money(line.quantity * line.unitPrice);
}

function renderPrintSheet(totals) {
  const selectedTemplate = state.templates.find((item) => item.id === document.getElementById("budgetTemplate").value);
  const rows = state.budgetLines
    .map(
      (line) => `
        <tr>
          <td>${escapeHtml(line.name)}</td>
          <td>${line.quantity}</td>
          <td>${escapeHtml(line.unit)}</td>
          <td>${money(line.unitPrice)}</td>
          <td>${money(line.quantity * line.unitPrice)}</td>
        </tr>
      `
    )
    .join("");
  document.getElementById("printSheet").innerHTML = `
    <div class="print-header">
      <div>
        <h1>Presupuesto</h1>
        <p>${escapeHtml(state.settings.businessName)}</p>
      </div>
      <div class="print-meta">
        <p>${formatDate(state.quote.date)}</p>
        <p>${escapeHtml(state.quote.number || "Sin numero")}</p>
        <p>${selectedTemplate ? escapeHtml(selectedTemplate.name) : "Trabajo"}</p>
      </div>
    </div>
    <div class="print-client">
      <p><strong>Cliente:</strong> ${escapeHtml(state.quote.client || "Sin indicar")}</p>
      <p><strong>Direccion / obra:</strong> ${escapeHtml(state.quote.address || "Sin indicar")}</p>
      <p><strong>Validez:</strong> ${escapeHtml(state.quote.validity || "Sin indicar")}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Partida</th>
          <th>Cantidad</th>
          <th>Unidad</th>
          <th>Precio</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="print-totals">
      <p><span>Subtotal</span><strong>${money(totals.beforeTax)}</strong></p>
      <p><span>Impuesto</span><strong>${money(totals.tax)}</strong></p>
      <p class="print-total"><span>Total</span><strong>${money(totals.total)}</strong></p>
    </div>
    <div class="print-notes">
      <strong>Notas</strong>
      <p>${escapeHtml(document.getElementById("budgetNotes").value)}</p>
    </div>
    <div class="print-terms">
      <strong>Condiciones</strong>
      <p>Presupuesto valido por ${escapeHtml(state.quote.validity || "el periodo indicado")} salvo cambios de alcance, mediciones o precios de materiales.</p>
      <p>Los trabajos no incluidos expresamente podran presupuestarse aparte.</p>
    </div>
  `;
}

function renderSavedQuotes() {
  const target = document.getElementById("savedQuotesList");
  const search = (state.historyFilters.search || "").trim().toLowerCase();
  const statusFilter = state.historyFilters.status || "all";
  const filteredQuotes = state.savedQuotes.filter((savedQuote) => {
    const status = savedQuote.quote.status || "draft";
    const searchable = [savedQuote.quote.number, savedQuote.quote.client, savedQuote.quote.address, savedQuote.notes]
      .join(" ")
      .toLowerCase();
    const matchesSearch = !search || searchable.includes(search);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  document.getElementById("quoteSearch").value = state.historyFilters.search;
  document.getElementById("quoteStatusFilter").value = state.historyFilters.status;
  renderCommercialSummary();

  if (state.savedQuotes.length === 0) {
    target.innerHTML = `<div class="mini-item"><span>No hay presupuestos guardados todavia.</span></div>`;
    return;
  }

  if (filteredQuotes.length === 0) {
    target.innerHTML = `<div class="mini-item"><span>No hay presupuestos que coincidan con el filtro.</span></div>`;
    return;
  }

  target.innerHTML = filteredQuotes
    .map((savedQuote) => {
      const status = quoteStatuses[savedQuote.quote.status] ? savedQuote.quote.status : "draft";
      return `
        <div class="mini-item">
          <span>
            <strong>${escapeHtml(savedQuote.quote.number)}</strong>
            <span class="status-pill status-${status}">${quoteStatuses[status]}</span>
            - ${escapeHtml(savedQuote.quote.client || "Sin cliente")}<br />
            ${formatDate(savedQuote.quote.date)} - ${escapeHtml(savedQuote.quote.address || "Sin direccion")} - ${money(savedQuote.totals.total)}
          </span>
          <span class="mini-actions">
            <select data-status-quote="${savedQuote.id}" aria-label="Cambiar estado">
              ${Object.entries(quoteStatuses)
                .map(([value, label]) => `<option value="${value}" ${status === value ? "selected" : ""}>${label}</option>`)
                .join("")}
            </select>
            <button class="secondary-action" type="button" data-load-quote="${savedQuote.id}">Abrir</button>
            <button class="remove-line" type="button" data-delete-quote="${savedQuote.id}" aria-label="Eliminar presupuesto">x</button>
          </span>
        </div>
      `;
    })
    .join("");
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return date.toLocaleDateString("es-ES");
}

function renderCommercialSummary() {
  const summary = state.savedQuotes.reduce(
    (result, savedQuote) => {
      const status = quoteStatuses[savedQuote.quote.status] ? savedQuote.quote.status : "draft";
      result.counts[status] += 1;
      if (status === "accepted") result.acceptedTotal += savedQuote.totals.total || 0;
      if (status === "sent") result.sentTotal += savedQuote.totals.total || 0;
      return result;
    },
    {
      counts: { draft: 0, sent: 0, accepted: 0, rejected: 0 },
      acceptedTotal: 0,
      sentTotal: 0,
    }
  );

  document.getElementById("commercialSummary").innerHTML = `
    <div class="summary-item"><span>Borradores</span><strong>${summary.counts.draft}</strong></div>
    <div class="summary-item"><span>Enviados</span><strong>${summary.counts.sent} / ${money(summary.sentTotal)}</strong></div>
    <div class="summary-item"><span>Aceptados</span><strong>${summary.counts.accepted} / ${money(summary.acceptedTotal)}</strong></div>
    <div class="summary-item"><span>Rechazados</span><strong>${summary.counts.rejected}</strong></div>
  `;
}

window.CotizaRender = {
  getTotals,
  renderBudget,
  renderCommercialSummary,
  renderDraftTemplateLines,
  renderLineTotal,
  renderPrices,
  renderQuoteData,
  renderRules,
  renderSavedQuotes,
  renderSettings,
  renderTemplateOptions,
  renderTemplates,
  renderTotals,
  showSection,
};
})();
