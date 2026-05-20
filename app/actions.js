const { getPrice, getRule, quoteStatuses, saveState, state } = window.Cotiza;
const render = window.CotizaRender;
let toastTimer;

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.toggle("error", type === "error");
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2600);
}

function inputValueForVariable(variable) {
  if (variable === "area") return Number(document.getElementById("budgetArea").value) || 0;
  if (variable === "quantity") return Number(document.getElementById("budgetQuantity").value) || 0;
  if (variable === "linear") return Number(document.getElementById("budgetLinear").value) || 0;
  return 0;
}

function calculateLine(line) {
  const price = getPrice(line.priceName);
  if (!price) return null;

  let quantity = 0;
  if (line.ruleName) {
    const rule = getRule(line.ruleName);
    if (!rule) return null;
    quantity = inputValueForVariable(rule.variable) * rule.factor * (line.multiplier || 1);
  } else {
    quantity = inputValueForVariable(line.variable) * (line.factor || 1);
  }

  return {
    name: price.name,
    quantity: Number(quantity.toFixed(2)),
    unit: price.unit,
    unitPrice: price.price,
  };
}

function calculateBudget() {
  const templateId = document.getElementById("budgetTemplate").value;
  const template = state.templates.find((item) => item.id === templateId);
  if (!template) return;
  state.budgetLines = template.lines.map(calculateLine).filter(Boolean);
  render.renderBudget();
}

function resetTemplateForm() {
  state.editingTemplateId = null;
  state.draftTemplateLines = [];
  document.getElementById("templateForm").reset();
  document.getElementById("saveTemplateButton").textContent = "Guardar trabajo tipo";
  document.getElementById("cancelTemplateEdit").classList.add("hidden");
  render.renderDraftTemplateLines();
  saveState();
}

function nextQuoteNumberLabel() {
  return `P-${String(state.nextQuoteNumber).padStart(4, "0")}`;
}

function startNewQuote() {
  state.quote = {
    number: nextQuoteNumberLabel(),
    client: "",
    address: "",
    validity: "15 dias",
    date: new Date().toISOString().slice(0, 10),
    status: "draft",
    statusUpdatedAt: new Date().toISOString(),
  };
  state.budgetLines = [];
  document.getElementById("budgetNotes").value =
    "Presupuesto sujeto a revision final de medidas, estado de superficies y alcance del trabajo.";
  render.renderQuoteData();
  render.renderBudget();
  saveState();
}

function saveCurrentQuote() {
  const existingIndex = state.savedQuotes.findIndex((quote) => quote.number === state.quote.number);
  const existingQuote = existingIndex >= 0 ? state.savedQuotes[existingIndex] : null;
  const savedQuote = {
    id: existingIndex >= 0 ? state.savedQuotes[existingIndex].id : `quote-${Date.now()}`,
    savedAt: existingQuote?.savedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    quote: { ...state.quote },
    lines: state.budgetLines.map((line) => ({ ...line })),
    notes: document.getElementById("budgetNotes").value,
    totals: render.getTotals(),
  };

  if (existingIndex >= 0) {
    state.savedQuotes[existingIndex] = savedQuote;
  } else {
    state.savedQuotes.unshift(savedQuote);
    state.nextQuoteNumber += 1;
  }

  render.renderSavedQuotes();
  saveState();
  showToast(existingIndex >= 0 ? "Presupuesto actualizado." : "Presupuesto guardado.");
}

function loadSavedQuote(id) {
  const savedQuote = state.savedQuotes.find((quote) => quote.id === id);
  if (!savedQuote) return;
  state.quote = { ...savedQuote.quote };
  state.budgetLines = savedQuote.lines.map((line) => ({ ...line }));
  document.getElementById("budgetNotes").value = savedQuote.notes;
  render.renderQuoteData();
  render.renderBudget();
  saveState();
}

function deleteSavedQuote(id) {
  const savedQuote = state.savedQuotes.find((quote) => quote.id === id);
  const label = savedQuote?.quote?.number || "este presupuesto";
  const confirmed = window.confirm(`Eliminar ${label} del historial local. ¿Quieres continuar?`);
  if (!confirmed) return;
  state.savedQuotes = state.savedQuotes.filter((quote) => quote.id !== id);
  render.renderSavedQuotes();
  saveState();
  showToast("Presupuesto eliminado.");
}

function addTemplateLine() {
  const mode = document.getElementById("templateLineMode").value;
  const multiplier = Number(document.getElementById("templateLineMultiplier").value) || 1;
  const priceName = document.getElementById("templateLinePrice").value;
  const line =
    mode === "rule"
      ? { priceName, ruleName: document.getElementById("templateLineRule").value, multiplier }
      : { priceName, variable: document.getElementById("templateLineVariable").value, factor: multiplier };
  state.draftTemplateLines.push(line);
  render.renderDraftTemplateLines();
  saveState();
}

function loadTemplateForEdit(templateId) {
  const template = state.templates.find((item) => item.id === templateId);
  if (!template) return;
  state.editingTemplateId = template.id;
  state.draftTemplateLines = template.lines.map((line) => ({ ...line }));
  document.getElementById("templateName").value = template.name;
  document.getElementById("templateDescription").value = template.description;
  document.getElementById("saveTemplateButton").textContent = "Guardar cambios";
  document.getElementById("cancelTemplateEdit").classList.remove("hidden");
  render.renderDraftTemplateLines();
  saveState();
}

function duplicateTemplate(templateId) {
  const template = state.templates.find((item) => item.id === templateId);
  if (!template) return;
  state.templates.push({
    ...template,
    id: `template-${Date.now()}`,
    name: `${template.name} copia`,
    lines: template.lines.map((line) => ({ ...line })),
  });
  render.renderTemplates();
  saveState();
}

function updateQuoteData() {
  const previousStatus = state.quote.status;
  const nextStatus = document.getElementById("quoteStatus").value;
  state.quote = {
    number: document.getElementById("quoteNumber").value,
    client: document.getElementById("quoteClient").value,
    address: document.getElementById("quoteAddress").value,
    validity: document.getElementById("quoteValidity").value,
    date: document.getElementById("quoteDate").value,
    status: nextStatus,
    statusUpdatedAt: previousStatus === nextStatus ? state.quote.statusUpdatedAt : new Date().toISOString(),
  };
  render.renderTotals();
  saveState();
}

function updateSavedQuoteStatus(id, status) {
  const savedQuote = state.savedQuotes.find((quote) => quote.id === id);
  if (!savedQuote || !quoteStatuses[status]) return;
  savedQuote.quote.status = status;
  savedQuote.quote.statusUpdatedAt = new Date().toISOString();
  if (state.quote.number === savedQuote.quote.number) {
    state.quote.status = status;
    state.quote.statusUpdatedAt = savedQuote.quote.statusUpdatedAt;
    render.renderQuoteData();
    render.renderTotals();
  }
  render.renderSavedQuotes();
  saveState();
}

function updateHistoryFilters() {
  state.historyFilters = {
    search: document.getElementById("quoteSearch").value,
    status: document.getElementById("quoteStatusFilter").value,
  };
  render.renderSavedQuotes();
  saveState();
}

function exportBackup() {
  const backup = {
    product: "Cotiza",
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `cotiza-backup-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Backup exportado.");
}

function importBackup(file) {
  if (!file) return;
  const confirmed = window.confirm("Importar este backup reemplazara los datos locales actuales de Cotiza en este navegador. ¿Quieres continuar?");
  if (!confirmed) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(reader.result);
      const importedState = parsed.state || parsed;
      if (!importedState.settings || !Array.isArray(importedState.prices) || !Array.isArray(importedState.templates)) {
        throw new Error("Formato invalido");
      }
      localStorage.setItem("cotiza-demo-state", JSON.stringify(importedState));
      showToast("Backup importado. Recargando Cotiza...");
      window.location.reload();
    } catch {
      showToast("No se pudo importar el backup. Revisa el archivo JSON.", "error");
    }
  });
  reader.readAsText(file);
}

function bindEvents() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => render.showSection(button.dataset.section));
  });

  document.getElementById("saveSettings").addEventListener("click", () => {
    state.settings = {
      businessName: document.getElementById("inputBusinessName").value || "Mi negocio",
      currency: document.getElementById("inputCurrency").value || "EUR",
      tax: Number(document.getElementById("inputTax").value) || 0,
      margin: Number(document.getElementById("inputMargin").value) || 0,
    };
    render.renderSettings();
    render.renderBudget();
    saveState();
    showToast("Configuracion guardada.");
  });

  document.getElementById("exportBackup").addEventListener("click", exportBackup);
  document.getElementById("importBackup").addEventListener("change", (event) => {
    importBackup(event.target.files[0]);
    event.target.value = "";
  });

  document.getElementById("priceForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.prices.push({
      name: document.getElementById("priceName").value,
      type: document.getElementById("priceType").value,
      unit: document.getElementById("priceUnit").value,
      price: Number(document.getElementById("priceValue").value) || 0,
    });
    event.target.reset();
    render.renderPrices();
    saveState();
    showToast("Precio agregado.");
  });

  document.getElementById("ruleForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.rules.push({
      name: document.getElementById("ruleName").value,
      variable: document.getElementById("ruleVariable").value,
      factor: Number(document.getElementById("ruleFactor").value) || 0,
      unit: document.getElementById("ruleUnit").value,
    });
    event.target.reset();
    render.renderRules();
    saveState();
    showToast("Rendimiento agregado.");
  });

  document.getElementById("templateLineMode").addEventListener("change", (event) => {
    const useRule = event.target.value === "rule";
    document.querySelector(".rule-field").classList.toggle("hidden", !useRule);
    document.querySelector(".direct-field").classList.toggle("hidden", useRule);
  });

  document.getElementById("addTemplateLine").addEventListener("click", addTemplateLine);
  document.getElementById("cancelTemplateEdit").addEventListener("click", resetTemplateForm);

  document.getElementById("draftTemplateLines").addEventListener("click", (event) => {
    const index = event.target.dataset.draftRemove;
    if (index === undefined) return;
    state.draftTemplateLines.splice(Number(index), 1);
    render.renderDraftTemplateLines();
    saveState();
  });

  document.getElementById("templateForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.draftTemplateLines.length === 0) return;
    const wasEditing = Boolean(state.editingTemplateId);
    const templateData = {
      id: state.editingTemplateId || `template-${Date.now()}`,
      name: document.getElementById("templateName").value,
      description: document.getElementById("templateDescription").value,
      lines: state.draftTemplateLines.map((line) => ({ ...line })),
    };
    if (state.editingTemplateId) {
      state.templates = state.templates.map((template) =>
        template.id === state.editingTemplateId ? templateData : template
      );
    } else {
      state.templates.push(templateData);
    }
    state.editingTemplateId = null;
    state.draftTemplateLines = [];
    event.target.reset();
    document.getElementById("saveTemplateButton").textContent = "Guardar trabajo tipo";
    document.getElementById("cancelTemplateEdit").classList.add("hidden");
    render.renderTemplates();
    render.renderDraftTemplateLines();
    saveState();
    showToast(wasEditing ? "Trabajo tipo actualizado." : "Trabajo tipo guardado.");
  });

  document.getElementById("templateList").addEventListener("click", (event) => {
    const editId = event.target.dataset.templateEdit;
    const duplicateId = event.target.dataset.templateDuplicate;
    if (editId) loadTemplateForEdit(editId);
    if (duplicateId) duplicateTemplate(duplicateId);
  });

  document.getElementById("calculateBudget").addEventListener("click", () => {
    calculateBudget();
    saveState();
  });

  document.getElementById("budgetNotes").addEventListener("input", () => render.renderTotals());

  document.querySelectorAll("#quoteNumber, #quoteClient, #quoteAddress, #quoteValidity, #quoteDate, #quoteStatus").forEach((input) => {
    input.addEventListener("input", updateQuoteData);
    input.addEventListener("change", updateQuoteData);
  });

  document.getElementById("manualLineForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.budgetLines.push({
      name: document.getElementById("manualLineName").value,
      quantity: Number(document.getElementById("manualLineQuantity").value) || 0,
      unit: document.getElementById("manualLineUnit").value,
      unitPrice: Number(document.getElementById("manualLinePrice").value) || 0,
    });
    event.target.reset();
    document.getElementById("manualLineQuantity").value = 1;
    render.renderBudget();
    saveState();
  });

  document.getElementById("printBudget").addEventListener("click", () => {
    render.renderTotals();
    window.print();
  });

  document.getElementById("saveQuote").addEventListener("click", saveCurrentQuote);
  document.getElementById("newQuote").addEventListener("click", startNewQuote);

  document.getElementById("savedQuotesList").addEventListener("click", (event) => {
    const loadId = event.target.dataset.loadQuote;
    const deleteId = event.target.dataset.deleteQuote;
    if (loadId) loadSavedQuote(loadId);
    if (deleteId) deleteSavedQuote(deleteId);
  });

  document.getElementById("savedQuotesList").addEventListener("change", (event) => {
    const statusQuoteId = event.target.dataset.statusQuote;
    if (!statusQuoteId) return;
    updateSavedQuoteStatus(statusQuoteId, event.target.value);
  });

  document.getElementById("quoteSearch").addEventListener("input", updateHistoryFilters);
  document.getElementById("quoteStatusFilter").addEventListener("change", updateHistoryFilters);

  document.getElementById("budgetLines").addEventListener("input", (event) => {
    const index = Number(event.target.dataset.index);
    const field = event.target.dataset.field;
    if (!field) return;
    state.budgetLines[index][field] =
      field === "quantity" || field === "unitPrice" ? Number(event.target.value) || 0 : event.target.value;
    render.renderLineTotal(index);
    render.renderTotals();
    saveState();
  });

  document.getElementById("budgetLines").addEventListener("click", (event) => {
    const index = event.target.dataset.remove;
    const moveUp = event.target.dataset.moveUp;
    const moveDown = event.target.dataset.moveDown;
    if (index !== undefined) {
      const confirmed = window.confirm("Quitar esta linea del presupuesto. ¿Quieres continuar?");
      if (!confirmed) return;
      state.budgetLines.splice(Number(index), 1);
    }
    if (moveUp !== undefined) {
      const from = Number(moveUp);
      if (from > 0) {
        [state.budgetLines[from - 1], state.budgetLines[from]] = [state.budgetLines[from], state.budgetLines[from - 1]];
      }
    }
    if (moveDown !== undefined) {
      const from = Number(moveDown);
      if (from < state.budgetLines.length - 1) {
        [state.budgetLines[from + 1], state.budgetLines[from]] = [state.budgetLines[from], state.budgetLines[from + 1]];
      }
    }
    render.renderBudget();
    saveState();
  });
}

function init() {
  render.renderSettings();
  render.renderPrices();
  render.renderRules();
  render.renderTemplates();
  render.renderTemplateOptions();
  render.renderDraftTemplateLines();
  render.renderQuoteData();
  render.renderSavedQuotes();
  calculateBudget();
  bindEvents();
}

init();
