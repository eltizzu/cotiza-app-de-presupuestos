(function () {
const { core, getPrice, getRule, quoteStatuses, saveState, state, variableLabels } = window.Cotiza;
const render = window.CotizaRender;
let toastTimer;
let editingPriceIndex = null;
let editingRuleIndex = null;

function findIndexByName(items, name, ignoreIndex = null) {
  const normalizedName = core.text(name).toLowerCase();
  if (!normalizedName) return -1;
  return items.findIndex((item, index) => index !== ignoreIndex && core.text(item.name).toLowerCase() === normalizedName);
}

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

function syncWhenLogged(task) {
  if (!window.CotizaSync?.isEnabled?.()) return;
  task(window.CotizaSync).catch((error) => {
    showToast(`No se pudo sincronizar con la nube: ${error.message}`, "error");
  });
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
  let source = null;
  if (line.ruleName) {
    const rule = getRule(line.ruleName);
    if (!rule) return null;
    const inputValue = inputValueForVariable(rule.variable);
    const multiplier = line.multiplier || 1;
    quantity = inputValue * rule.factor * multiplier;
    source = {
      inputLabel: variableLabels[rule.variable],
      inputValue,
      factor: rule.factor,
      factorUnit: rule.unit,
      multiplier,
      ruleName: rule.name,
    };
  } else {
    const inputValue = inputValueForVariable(line.variable);
    const factor = line.factor || 1;
    quantity = inputValue * factor;
    source = {
      inputLabel: variableLabels[line.variable],
      inputValue,
      factor,
      factorUnit: price.unit,
      multiplier: 1,
      ruleName: "",
    };
  }

  return {
    name: price.name,
    quantity: Number(quantity.toFixed(2)),
    unit: price.unit,
    unitPrice: price.price,
    source,
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
  document.getElementById("saveTemplateButton").textContent = "Guardar plantilla";
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
  const existingIndex = core.findQuoteIndexByNumber(state.savedQuotes, state.quote.number);
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
  syncWhenLogged((sync) => sync.saveQuote(savedQuote, state.nextQuoteNumber));
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
  const confirmed = window.confirm(`Eliminar ${label} del historial local. Quieres continuar?`);
  if (!confirmed) return;
  state.savedQuotes = state.savedQuotes.filter((quote) => quote.id !== id);
  render.renderSavedQuotes();
  saveState();
  syncWhenLogged((sync) => sync.deleteQuote(savedQuote?.quote?.number));
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
  const duplicatedTemplate = {
    ...template,
    id: `template-${Date.now()}`,
    name: `${template.name} copia`,
    lines: template.lines.map((line) => ({ ...line })),
  };
  state.templates.push(duplicatedTemplate);
  render.renderTemplates();
  saveState();
  syncWhenLogged((sync) => sync.saveTemplate(duplicatedTemplate));
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
  syncWhenLogged((sync) => sync.saveQuote(savedQuote, state.nextQuoteNumber));
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
  const backupState = {
    ...state,
    draftTemplateLines: [],
    editingTemplateId: null,
    historyFilters: { search: "", status: "all" },
  };
  const backup = {
    product: "Cotiza",
    version: 1,
    exportedAt: new Date().toISOString(),
    state: backupState,
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
  const confirmed = window.confirm("Importar este backup reemplazara los datos locales actuales de Cotiza en este navegador. Quieres continuar?");
  if (!confirmed) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(reader.result);
      const importedState = parsed.state || parsed;
      if (!importedState.settings || !Array.isArray(importedState.prices) || !Array.isArray(importedState.templates)) {
        throw new Error("Formato invalido");
      }
      const sanitizedState = core.sanitizeImportedState(importedState, state);
      localStorage.setItem("cotiza-demo-state", JSON.stringify(sanitizedState));
      showToast("Backup importado. Recargando Cotiza...");
      window.location.reload();
    } catch {
      showToast("No se pudo importar el backup. Revisa el archivo JSON.", "error");
    }
  });
  reader.readAsText(file);
}

function resetDemo() {
  const confirmed = window.confirm("Restaurar la demo borrara los datos locales actuales y volvera a los ejemplos iniciales. Quieres continuar?");
  if (!confirmed) return;
  localStorage.removeItem("cotiza-demo-state");
  showToast("Demo restaurada. Recargando Cotiza...");
  window.location.reload();
}

function resetPriceForm() {
  editingPriceIndex = null;
  document.getElementById("priceForm").reset();
  document.getElementById("savePriceButton").textContent = "Agregar precio";
  document.getElementById("cancelPriceEdit").classList.add("hidden");
}

function loadPriceForEdit(index) {
  const price = state.prices[index];
  if (!price) return;
  editingPriceIndex = index;
  document.getElementById("priceName").value = price.name;
  document.getElementById("priceType").value = price.type;
  document.getElementById("priceUnit").value = price.unit;
  document.getElementById("priceValue").value = price.price;
  document.getElementById("savePriceButton").textContent = "Guardar cambios";
  document.getElementById("cancelPriceEdit").classList.remove("hidden");
  document.getElementById("priceName").focus();
}

function deletePrice(index) {
  const price = state.prices[index];
  if (!price) return;
  const affectedTemplateIds = new Set();
  const usedCount = state.templates.reduce(
    (count, template) => {
      const lineCount = template.lines.filter((line) => line.priceName === price.name).length;
      if (lineCount > 0) affectedTemplateIds.add(template.id);
      return count + lineCount;
    },
    0
  );
  const suffix = usedCount ? ` Este precio aparece en ${usedCount} partida(s) de plantillas.` : "";
  const confirmed = window.confirm(`Eliminar ${price.name}.${suffix} Quieres continuar?`);
  if (!confirmed) return;
  state.prices.splice(index, 1);
  state.templates = state.templates.map((template) =>
    affectedTemplateIds.has(template.id)
      ? { ...template, lines: template.lines.filter((line) => line.priceName !== price.name) }
      : template
  );
  if (editingPriceIndex === index) resetPriceForm();
  if (editingPriceIndex !== null && editingPriceIndex > index) editingPriceIndex -= 1;
  render.renderPrices();
  render.renderTemplates();
  render.renderBudget();
  saveState();
  syncWhenLogged(async (sync) => {
    await sync.deletePrice(price.name);
    for (const template of state.templates.filter((item) => affectedTemplateIds.has(item.id))) {
      await sync.saveTemplate(template);
    }
  });
  showToast("Precio eliminado.");
}

function resetRuleForm() {
  editingRuleIndex = null;
  document.getElementById("ruleForm").reset();
  document.getElementById("saveRuleButton").textContent = "Agregar rendimiento";
  document.getElementById("cancelRuleEdit").classList.add("hidden");
}

function loadRuleForEdit(index) {
  const rule = state.rules[index];
  if (!rule) return;
  editingRuleIndex = index;
  document.getElementById("ruleName").value = rule.name;
  document.getElementById("ruleVariable").value = rule.variable;
  document.getElementById("ruleFactor").value = rule.factor;
  document.getElementById("ruleUnit").value = rule.unit;
  document.getElementById("saveRuleButton").textContent = "Guardar cambios";
  document.getElementById("cancelRuleEdit").classList.remove("hidden");
  document.getElementById("ruleName").focus();
}

function deleteRule(index) {
  const rule = state.rules[index];
  if (!rule) return;
  const affectedTemplateIds = new Set();
  const usedCount = state.templates.reduce(
    (count, template) => {
      const lineCount = template.lines.filter((line) => line.ruleName === rule.name).length;
      if (lineCount > 0) affectedTemplateIds.add(template.id);
      return count + lineCount;
    },
    0
  );
  const suffix = usedCount ? ` Este rendimiento aparece en ${usedCount} partida(s) de plantillas.` : "";
  const confirmed = window.confirm(`Eliminar ${rule.name}.${suffix} Quieres continuar?`);
  if (!confirmed) return;
  state.rules.splice(index, 1);
  state.templates = state.templates.map((template) =>
    affectedTemplateIds.has(template.id)
      ? { ...template, lines: template.lines.filter((line) => line.ruleName !== rule.name) }
      : template
  );
  if (editingRuleIndex === index) resetRuleForm();
  if (editingRuleIndex !== null && editingRuleIndex > index) editingRuleIndex -= 1;
  render.renderRules();
  render.renderTemplates();
  render.renderDraftTemplateLines();
  render.renderBudget();
  saveState();
  syncWhenLogged(async (sync) => {
    await sync.deleteRule(rule.name);
    for (const template of state.templates.filter((item) => affectedTemplateIds.has(item.id))) {
      await sync.saveTemplate(template);
    }
  });
  showToast("Rendimiento eliminado.");
}

function bindEvents() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => render.showSection(button.dataset.section));
  });

  document.getElementById("saveSettings").addEventListener("click", () => {
    state.settings = {
      businessName: document.getElementById("inputBusinessName").value || "Mi negocio",
      businessPhone: document.getElementById("inputBusinessPhone").value || "",
      businessEmail: document.getElementById("inputBusinessEmail").value || "",
      businessAddress: document.getElementById("inputBusinessAddress").value || "",
      businessLogo: state.settings.businessLogo || "",
      currency: core.normalizeCurrency(document.getElementById("inputCurrency").value || "EUR"),
      tax: core.toSafeNumber(document.getElementById("inputTax").value, 0),
      margin: core.toSafeNumber(document.getElementById("inputMargin").value, 0),
    };
    render.renderSettings();
    render.renderBudget();
    saveState();
    syncWhenLogged((sync) => sync.saveSettings(state.settings, state.nextQuoteNumber));
    showToast("Configuracion guardada.");
  });

  document.getElementById("inputBusinessLogo").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      state.settings.businessLogo = core.safeLogoSrc(ev.target.result);
      saveState();
      render.renderSettings();
      syncWhenLogged((sync) => sync.saveSettings(state.settings, state.nextQuoteNumber));
      showToast(
        state.settings.businessLogo ? "Logo guardado." : "No se pudo guardar este logo.",
        state.settings.businessLogo ? "success" : "error"
      );
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("removeLogo").addEventListener("click", () => {
    state.settings.businessLogo = "";
    document.getElementById("inputBusinessLogo").value = "";
    saveState();
    render.renderSettings();
    syncWhenLogged((sync) => sync.saveSettings(state.settings, state.nextQuoteNumber));
    showToast("Logo eliminado.");
  });

  document.getElementById("exportBackup").addEventListener("click", exportBackup);
  document.getElementById("importBackup").addEventListener("change", (event) => {
    importBackup(event.target.files[0]);
    event.target.value = "";
  });
  document.getElementById("resetDemo").addEventListener("click", resetDemo);

  document.getElementById("priceForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const priceData = {
      name: document.getElementById("priceName").value,
      type: document.getElementById("priceType").value,
      unit: document.getElementById("priceUnit").value,
      price: Math.max(0, core.toSafeNumber(document.getElementById("priceValue").value, 0)),
    };
    const previousName = editingPriceIndex === null ? null : state.prices[editingPriceIndex]?.name;
    const duplicateIndex = findIndexByName(state.prices, priceData.name, editingPriceIndex);
    if (editingPriceIndex !== null && duplicateIndex >= 0) {
      showToast("Ya existe un precio con ese nombre.", "error");
      return;
    }
    if (editingPriceIndex === null) {
      if (duplicateIndex >= 0) {
        state.prices[duplicateIndex] = priceData;
      } else {
        state.prices.push(priceData);
      }
    } else {
      state.prices[editingPriceIndex] = priceData;
      state.templates = core.renameTemplatePriceReferences(state.templates, previousName, priceData.name);
    }
    const wasEditing = editingPriceIndex !== null || duplicateIndex >= 0;
    resetPriceForm();
    render.renderPrices();
    render.renderTemplates();
    render.renderBudget();
    saveState();
    syncWhenLogged((sync) => sync.upsertPrice(priceData, previousName));
    showToast(wasEditing ? "Precio actualizado." : "Precio agregado.");
  });

  document.getElementById("cancelPriceEdit").addEventListener("click", resetPriceForm);

  document.getElementById("pricesTable").addEventListener("click", (event) => {
    const editIndex = event.target.dataset.priceEdit;
    const deleteIndex = event.target.dataset.priceDelete;
    if (editIndex !== undefined) loadPriceForEdit(Number(editIndex));
    if (deleteIndex !== undefined) deletePrice(Number(deleteIndex));
  });

  document.getElementById("ruleForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const ruleData = {
      name: document.getElementById("ruleName").value,
      variable: core.normalizeVariable(document.getElementById("ruleVariable").value, "area"),
      factor: Math.max(0, core.toSafeNumber(document.getElementById("ruleFactor").value, 0)),
      unit: document.getElementById("ruleUnit").value,
    };
    const previousName = editingRuleIndex === null ? null : state.rules[editingRuleIndex]?.name;
    const duplicateIndex = findIndexByName(state.rules, ruleData.name, editingRuleIndex);
    if (editingRuleIndex !== null && duplicateIndex >= 0) {
      showToast("Ya existe un rendimiento con ese nombre.", "error");
      return;
    }
    if (editingRuleIndex === null) {
      if (duplicateIndex >= 0) {
        state.rules[duplicateIndex] = ruleData;
      } else {
        state.rules.push(ruleData);
      }
    } else {
      state.rules[editingRuleIndex] = ruleData;
      state.templates = core.renameTemplateRuleReferences(state.templates, previousName, ruleData.name);
    }
    const wasEditing = editingRuleIndex !== null || duplicateIndex >= 0;
    resetRuleForm();
    render.renderRules();
    render.renderDraftTemplateLines();
    render.renderBudget();
    saveState();
    syncWhenLogged((sync) => sync.upsertRule(ruleData, previousName));
    showToast(wasEditing ? "Rendimiento actualizado." : "Rendimiento agregado.");
  });

  document.getElementById("cancelRuleEdit").addEventListener("click", resetRuleForm);

  document.getElementById("rulesTable").addEventListener("click", (event) => {
    const editIndex = event.target.dataset.ruleEdit;
    const deleteIndex = event.target.dataset.ruleDelete;
    if (editIndex !== undefined) loadRuleForEdit(Number(editIndex));
    if (deleteIndex !== undefined) deleteRule(Number(deleteIndex));
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
    const previousTemplate = state.templates.find((template) => template.id === state.editingTemplateId);
    const templateData = {
      id: state.editingTemplateId || `template-${Date.now()}`,
      name: document.getElementById("templateName").value,
      description: document.getElementById("templateDescription").value,
      lines: state.draftTemplateLines.map((line) => ({ ...line })),
    };
    const editingTemplateIndex = state.templates.findIndex((template) => template.id === state.editingTemplateId);
    const duplicateTemplateIndex = findIndexByName(
      state.templates,
      templateData.name,
      editingTemplateIndex >= 0 ? editingTemplateIndex : null
    );
    if (wasEditing && duplicateTemplateIndex >= 0) {
      showToast("Ya existe una plantilla con ese nombre.", "error");
      return;
    }
    if (state.editingTemplateId) {
      state.templates = state.templates.map((template) =>
        template.id === state.editingTemplateId ? templateData : template
      );
    } else if (duplicateTemplateIndex >= 0) {
      templateData.id = state.templates[duplicateTemplateIndex].id;
      state.templates[duplicateTemplateIndex] = templateData;
    } else {
      state.templates.push(templateData);
    }
    const updatedExistingTemplate = !wasEditing && duplicateTemplateIndex >= 0;
    state.editingTemplateId = null;
    state.draftTemplateLines = [];
    event.target.reset();
    document.getElementById("saveTemplateButton").textContent = "Guardar plantilla";
    document.getElementById("cancelTemplateEdit").classList.add("hidden");
    render.renderTemplates();
    render.renderDraftTemplateLines();
    saveState();
    syncWhenLogged((sync) => sync.saveTemplate(templateData, previousTemplate?.name));
    showToast(wasEditing || updatedExistingTemplate ? "Plantilla actualizada." : "Plantilla guardada.");
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
    state.budgetLines[index] = core.applyBudgetLineEdit(state.budgetLines[index], field, event.target.value);
    render.renderLineTotal(index);
    render.renderTotals();
    saveState();
  });

  document.getElementById("budgetLines").addEventListener("click", (event) => {
    const index = event.target.dataset.remove;
    const moveUp = event.target.dataset.moveUp;
    const moveDown = event.target.dataset.moveDown;
    if (index !== undefined) {
      const confirmed = window.confirm("Quitar esta linea del presupuesto. Quieres continuar?");
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
})();
