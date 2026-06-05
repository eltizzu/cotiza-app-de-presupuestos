(function () {
const core = window.CotizaCore;

const initialState = {
  settings: {
    businessName: "Reformas Norte",
    businessPhone: "",
    businessEmail: "",
    businessAddress: "",
    businessLogo: "",
    currency: "EUR",
    tax: 21,
    margin: 20,
  },
  prices: [
    { name: "Pintura plastica interior", type: "Material", unit: "litro", price: 8.5 },
    { name: "Material auxiliar pintura", type: "Material", unit: "m2", price: 0.65 },
    { name: "Grifo monomando estandar", type: "Material", unit: "unidad", price: 42 },
    { name: "Material auxiliar fontaneria", type: "Material", unit: "unidad", price: 9 },
    { name: "Suelo laminado AC5", type: "Material", unit: "m2", price: 18.5 },
    { name: "Rodapie y remates", type: "Material", unit: "metro lineal", price: 4.2 },
    { name: "Foco LED empotrable", type: "Material", unit: "unidad", price: 12.5 },
    { name: "Hora oficial", type: "Mano de obra", unit: "hora", price: 28 },
    { name: "Desplazamiento urbano", type: "Transporte", unit: "unidad", price: 25 },
  ],
  rules: [
    { name: "Litros pintura por m2 y mano", variable: "area", factor: 0.125, unit: "litros" },
    { name: "Horas pintura por m2", variable: "area", factor: 0.18, unit: "horas" },
    { name: "Horas cambio de grifo", variable: "quantity", factor: 1.2, unit: "horas" },
    { name: "Horas colocar suelo por m2", variable: "area", factor: 0.35, unit: "horas" },
    { name: "Horas cambiar foco", variable: "quantity", factor: 0.45, unit: "horas" },
    { name: "Desplazamiento por trabajo", variable: "quantity", factor: 1, unit: "unidad" },
  ],
  templates: [
    {
      id: "paint-room",
      name: "Pintar habitacion",
      description: "Calcula pintura, material auxiliar, mano de obra y desplazamiento usando m2.",
      lines: [
        { priceName: "Pintura plastica interior", ruleName: "Litros pintura por m2 y mano", multiplier: 2 },
        { priceName: "Material auxiliar pintura", variable: "area", factor: 1 },
        { priceName: "Hora oficial", ruleName: "Horas pintura por m2", multiplier: 1 },
        { priceName: "Desplazamiento urbano", ruleName: "Desplazamiento por trabajo", multiplier: 1 },
      ],
    },
    {
      id: "tap-change",
      name: "Cambiar grifo",
      description: "Calcula grifo, auxiliar de fontaneria, mano de obra y desplazamiento por cantidad.",
      lines: [
        { priceName: "Grifo monomando estandar", variable: "quantity", factor: 1 },
        { priceName: "Material auxiliar fontaneria", variable: "quantity", factor: 1 },
        { priceName: "Hora oficial", ruleName: "Horas cambio de grifo", multiplier: 1 },
        { priceName: "Desplazamiento urbano", ruleName: "Desplazamiento por trabajo", multiplier: 1 },
      ],
    },
    {
      id: "floor-install",
      name: "Colocar suelo laminado",
      description: "Calcula material por m2, remates por metros lineales, mano de obra y desplazamiento.",
      lines: [
        { priceName: "Suelo laminado AC5", variable: "area", factor: 1.08 },
        { priceName: "Rodapie y remates", variable: "linear", factor: 1 },
        { priceName: "Hora oficial", ruleName: "Horas colocar suelo por m2", multiplier: 1 },
        { priceName: "Desplazamiento urbano", ruleName: "Desplazamiento por trabajo", multiplier: 1 },
      ],
    },
    {
      id: "spotlight-change",
      name: "Cambiar foco",
      description: "Calcula foco, mano de obra y desplazamiento segun cantidad.",
      lines: [
        { priceName: "Foco LED empotrable", variable: "quantity", factor: 1 },
        { priceName: "Hora oficial", ruleName: "Horas cambiar foco", multiplier: 1 },
        { priceName: "Desplazamiento urbano", ruleName: "Desplazamiento por trabajo", multiplier: 1 },
      ],
    },
  ],
  budgetLines: [],
  draftTemplateLines: [],
  editingTemplateId: null,
  quote: {
    number: "P-0001",
    client: "",
    address: "",
    validity: "15 dias",
    date: new Date().toISOString().slice(0, 10),
    status: "draft",
    statusUpdatedAt: new Date().toISOString(),
  },
  nextQuoteNumber: 2,
  savedQuotes: [],
  historyFilters: {
    search: "",
    status: "all",
  },
};

const variableLabels = { area: "m2", quantity: "cantidad", linear: "metros lineales" };

const quoteStatuses = {
  draft: "Borrador",
  sent: "Enviado",
  accepted: "Aceptado",
  rejected: "Rechazado",
};

function mergeByKey(savedItems = [], defaultItems = [], key) {
  const savedKeys = new Set(savedItems.map((item) => item[key]));
  return [...savedItems, ...defaultItems.filter((item) => !savedKeys.has(item[key]))];
}

function normalizeQuote(savedQuote) {
  const lines = Array.isArray(savedQuote.lines) ? savedQuote.lines : [];
  const fallbackTotal = lines.reduce(
    (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0),
    0
  );
  const totals = savedQuote.totals || {
    cost: fallbackTotal,
    margin: 0,
    beforeTax: fallbackTotal,
    tax: 0,
    total: fallbackTotal,
  };

  return {
    id: savedQuote.id || `quote-${Date.now()}`,
    savedAt: savedQuote.savedAt || new Date().toISOString(),
    updatedAt: savedQuote.updatedAt || savedQuote.savedAt || new Date().toISOString(),
    quote: { ...initialState.quote, ...savedQuote.quote },
    lines,
    notes: savedQuote.notes || "",
    totals,
  };
}

function loadState() {
  let saved = initialState;
  try {
    const savedState = localStorage.getItem("cotiza-demo-state");
    saved = savedState ? JSON.parse(savedState) : initialState;
  } catch {
    saved = initialState;
  }

  const safeSaved = core.sanitizeImportedState(saved, initialState);
  const normalized = {
    ...initialState,
    ...safeSaved,
    settings: {
      ...initialState.settings,
      ...safeSaved.settings,
      currency: core.normalizeCurrency(safeSaved.settings.currency, initialState.settings.currency),
      businessLogo: core.safeLogoSrc(safeSaved.settings.businessLogo),
    },
    prices: mergeByKey(safeSaved.prices, initialState.prices, "name"),
    rules: mergeByKey(safeSaved.rules, initialState.rules, "name"),
    templates: mergeByKey(safeSaved.templates, initialState.templates, "id"),
    budgetLines: safeSaved.budgetLines || [],
    draftTemplateLines: safeSaved.draftTemplateLines || [],
    editingTemplateId: safeSaved.editingTemplateId || null,
    quote: { ...initialState.quote, ...safeSaved.quote },
    nextQuoteNumber: safeSaved.nextQuoteNumber || initialState.nextQuoteNumber,
    savedQuotes: safeSaved.savedQuotes || [],
    historyFilters: { ...initialState.historyFilters, ...safeSaved.historyFilters },
  };

  normalized.savedQuotes = normalized.savedQuotes.map(normalizeQuote);
  return normalized;
}

const state = loadState();

function saveState() {
  try {
    localStorage.setItem("cotiza-demo-state", JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

const money = (value) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: core.normalizeCurrency(state.settings.currency, "EUR"),
  }).format(core.toSafeNumber(value, 0));

const getPrice = (name) => state.prices.find((price) => price.name === name);
const getRule = (name) => state.rules.find((rule) => rule.name === name);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.Cotiza = {
  core,
  escapeHtml,
  getPrice,
  getRule,
  money,
  quoteStatuses,
  saveState,
  state,
  variableLabels,
};
})();
