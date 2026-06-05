(function (root, factory) {
  const core = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = core;
  }
  root.CotizaCore = core;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const DEFAULT_CURRENCY = "EUR";
  const VALID_VARIABLES = new Set(["area", "quantity", "linear"]);
  const VALID_STATUSES = new Set(["draft", "sent", "accepted", "rejected"]);
  const VALID_PRICE_TYPES = new Set(["Material", "Mano de obra", "Transporte", "Alquiler", "Otro"]);

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function text(value, fallback = "") {
    const result = String(value ?? "").trim();
    return result || fallback;
  }

  function toSafeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeCurrency(value, fallback = DEFAULT_CURRENCY) {
    const candidate = text(value, fallback).toUpperCase();
    try {
      if (typeof Intl.supportedValuesOf === "function") {
        const supportedCurrencies = Intl.supportedValuesOf("currency");
        if (!supportedCurrencies.includes(candidate)) return fallback;
      }
      new Intl.NumberFormat("es-ES", { style: "currency", currency: candidate }).format(1);
      return candidate;
    } catch {
      return fallback;
    }
  }

  function normalizeVariable(value, fallback = "quantity") {
    return VALID_VARIABLES.has(value) ? value : fallback;
  }

  function normalizeStatus(value, fallback = "draft") {
    return VALID_STATUSES.has(value) ? value : fallback;
  }

  function slugId(value, fallback) {
    const slug = text(value, fallback)
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug || fallback;
  }

  function isSafeLogoSrc(value) {
    const src = text(value);
    return (
      /^data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,[a-z0-9+/=]+$/i.test(src) ||
      /^\.{0,2}\/assets\/[a-z0-9._/-]+\.svg$/i.test(src)
    );
  }

  function safeLogoSrc(value) {
    const src = text(value);
    return isSafeLogoSrc(src) ? src : "";
  }

  function sanitizePrice(price) {
    if (!isPlainObject(price)) return null;
    const name = text(price.name);
    if (!name) return null;
    const type = VALID_PRICE_TYPES.has(price.type) ? price.type : "Otro";
    return {
      name,
      type,
      unit: text(price.unit, "unidad"),
      price: Math.max(0, toSafeNumber(price.price, 0)),
    };
  }

  function sanitizeRule(rule) {
    if (!isPlainObject(rule)) return null;
    const name = text(rule.name);
    if (!name) return null;
    return {
      name,
      variable: normalizeVariable(rule.variable, "area"),
      factor: Math.max(0, toSafeNumber(rule.factor, 0)),
      unit: text(rule.unit, "unidad"),
    };
  }

  function sanitizeTemplateLine(line) {
    if (!isPlainObject(line)) return null;
    const priceName = text(line.priceName);
    if (!priceName) return null;
    if (text(line.ruleName)) {
      return {
        priceName,
        ruleName: text(line.ruleName),
        multiplier: Math.max(0, toSafeNumber(line.multiplier, 1)),
      };
    }
    return {
      priceName,
      variable: normalizeVariable(line.variable, "quantity"),
      factor: Math.max(0, toSafeNumber(line.factor, 1)),
    };
  }

  function sanitizeTemplate(template) {
    if (!isPlainObject(template)) return null;
    const name = text(template.name);
    if (!name) return null;
    const id = slugId(template.id || name, `template-${Date.now()}`);
    const lines = Array.isArray(template.lines) ? template.lines.map(sanitizeTemplateLine).filter(Boolean) : [];
    return {
      id,
      name,
      description: text(template.description),
      lines,
    };
  }

  function sanitizeBudgetLine(line) {
    if (!isPlainObject(line)) return null;
    const name = text(line.name);
    if (!name) return null;
    const sanitized = {
      name,
      quantity: Math.max(0, toSafeNumber(line.quantity, 0)),
      unit: text(line.unit, "unidad"),
      unitPrice: Math.max(0, toSafeNumber(line.unitPrice, 0)),
    };
    if (isPlainObject(line.source)) sanitized.source = { ...line.source };
    return sanitized;
  }

  function sanitizeQuoteData(quote, fallback = {}) {
    const source = isPlainObject(quote) ? quote : {};
    return {
      ...fallback,
      number: text(source.number, fallback.number || "P-0001"),
      client: text(source.client),
      address: text(source.address),
      validity: text(source.validity, fallback.validity || "15 dias"),
      date: text(source.date, fallback.date || new Date().toISOString().slice(0, 10)),
      status: normalizeStatus(source.status, fallback.status || "draft"),
      statusUpdatedAt: text(source.statusUpdatedAt, fallback.statusUpdatedAt || new Date().toISOString()),
    };
  }

  function sanitizeSavedQuote(savedQuote, initialQuote) {
    if (!isPlainObject(savedQuote)) return null;
    const lines = Array.isArray(savedQuote.lines) ? savedQuote.lines.map(sanitizeBudgetLine).filter(Boolean) : [];
    const fallbackTotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
    const totals = isPlainObject(savedQuote.totals)
      ? {
          cost: toSafeNumber(savedQuote.totals.cost, fallbackTotal),
          margin: toSafeNumber(savedQuote.totals.margin, 0),
          beforeTax: toSafeNumber(savedQuote.totals.beforeTax, fallbackTotal),
          tax: toSafeNumber(savedQuote.totals.tax, 0),
          total: toSafeNumber(savedQuote.totals.total, fallbackTotal),
        }
      : { cost: fallbackTotal, margin: 0, beforeTax: fallbackTotal, tax: 0, total: fallbackTotal };
    return {
      id: text(savedQuote.id, `quote-${Date.now()}`),
      savedAt: text(savedQuote.savedAt, new Date().toISOString()),
      updatedAt: text(savedQuote.updatedAt, savedQuote.savedAt || new Date().toISOString()),
      quote: sanitizeQuoteData(savedQuote.quote, initialQuote),
      lines,
      notes: text(savedQuote.notes),
      totals,
    };
  }

  function sanitizeImportedState(importedState, initialState) {
    const source = isPlainObject(importedState) ? importedState : {};
    const initial = isPlainObject(initialState) ? initialState : {};
    const initialSettings = initial.settings || {};
    const sourceSettings = isPlainObject(source.settings) ? source.settings : {};
    return {
      ...initial,
      ...source,
      settings: {
        ...initialSettings,
        ...sourceSettings,
        businessLogo: safeLogoSrc(sourceSettings.businessLogo),
        currency: normalizeCurrency(sourceSettings.currency, initialSettings.currency || DEFAULT_CURRENCY),
        tax: toSafeNumber(sourceSettings.tax, initialSettings.tax || 0),
        margin: toSafeNumber(sourceSettings.margin, initialSettings.margin || 0),
      },
      prices: Array.isArray(source.prices) ? source.prices.map(sanitizePrice).filter(Boolean) : initial.prices || [],
      rules: Array.isArray(source.rules) ? source.rules.map(sanitizeRule).filter(Boolean) : initial.rules || [],
      templates: Array.isArray(source.templates)
        ? source.templates.map(sanitizeTemplate).filter(Boolean)
        : initial.templates || [],
      budgetLines: Array.isArray(source.budgetLines)
        ? source.budgetLines.map(sanitizeBudgetLine).filter(Boolean)
        : initial.budgetLines || [],
      draftTemplateLines: Array.isArray(source.draftTemplateLines)
        ? source.draftTemplateLines.map(sanitizeTemplateLine).filter(Boolean)
        : [],
      editingTemplateId: text(source.editingTemplateId) || null,
      quote: sanitizeQuoteData(source.quote, initial.quote || {}),
      nextQuoteNumber: Math.max(1, Math.floor(toSafeNumber(source.nextQuoteNumber, initial.nextQuoteNumber || 1))),
      savedQuotes: Array.isArray(source.savedQuotes)
        ? source.savedQuotes.map((quote) => sanitizeSavedQuote(quote, initial.quote || {})).filter(Boolean)
        : [],
      historyFilters: {
        search: text(source.historyFilters?.search),
        status: source.historyFilters?.status === "all" ? "all" : normalizeStatus(source.historyFilters?.status, "all"),
      },
    };
  }

  function findQuoteIndexByNumber(savedQuotes, number) {
    return (Array.isArray(savedQuotes) ? savedQuotes : []).findIndex(
      (savedQuote) => savedQuote?.quote?.number === number
    );
  }

  function applyBudgetLineEdit(line, field, rawValue) {
    const next = { ...line };
    next[field] = field === "quantity" || field === "unitPrice" ? Math.max(0, toSafeNumber(rawValue, 0)) : text(rawValue);
    if (field === "quantity" || field === "unitPrice" || field === "unit" || field === "name") {
      delete next.source;
    }
    return next;
  }

  function renameTemplatePriceReferences(templates, previousName, nextName) {
    return (Array.isArray(templates) ? templates : []).map((template) => ({
      ...template,
      lines: Array.isArray(template.lines)
        ? template.lines.map((line) => ({
            ...line,
            priceName: line.priceName === previousName ? nextName : line.priceName,
          }))
        : [],
    }));
  }

  function renameTemplateRuleReferences(templates, previousName, nextName) {
    return (Array.isArray(templates) ? templates : []).map((template) => ({
      ...template,
      lines: Array.isArray(template.lines)
        ? template.lines.map((line) => ({
            ...line,
            ruleName: line.ruleName === previousName ? nextName : line.ruleName,
          }))
        : [],
    }));
  }

  function mapSupabaseTemplateRows(templateRows, priceRows, ruleRows) {
    const priceNameById = new Map((Array.isArray(priceRows) ? priceRows : []).map((price) => [price.id, price.name]));
    const ruleNameById = new Map((Array.isArray(ruleRows) ? ruleRows : []).map((rule) => [rule.id, rule.name]));

    return (Array.isArray(templateRows) ? templateRows : [])
      .map((template) => {
        const lines = (Array.isArray(template.template_lines) ? template.template_lines : [])
          .slice()
          .sort((a, b) => toSafeNumber(a.sort_order, 0) - toSafeNumber(b.sort_order, 0))
          .map((line) => {
            const priceName = text(priceNameById.get(line.price_id));
            if (!priceName) return null;
            const ruleName = text(ruleNameById.get(line.rule_id));
            if (ruleName) {
              return {
                priceName,
                ruleName,
                multiplier: Math.max(0, toSafeNumber(line.multiplier, 1)),
              };
            }
            return {
              priceName,
              variable: normalizeVariable(line.variable, "quantity"),
              factor: Math.max(0, toSafeNumber(line.factor, 1)),
            };
          })
          .filter(Boolean);

        return sanitizeTemplate({
          id: template.id,
          name: template.name,
          description: template.description,
          lines,
        });
      })
      .filter(Boolean);
  }

  function mapSupabaseQuoteRows(quoteRows) {
    return (Array.isArray(quoteRows) ? quoteRows : [])
      .map((quote) => {
        const lines = (Array.isArray(quote.quote_lines) ? quote.quote_lines : [])
          .slice()
          .sort((a, b) => toSafeNumber(a.sort_order, 0) - toSafeNumber(b.sort_order, 0))
          .map((line) => {
            const mappedLine = {
              name: line.name,
              quantity: toSafeNumber(line.quantity, 0),
              unit: line.unit,
              unitPrice: toSafeNumber(line.unit_price, 0),
            };
            if (isPlainObject(line.source) && Object.keys(line.source).length > 0) {
              mappedLine.source = { ...line.source };
            }
            return mappedLine;
          });

        return sanitizeSavedQuote(
          {
            id: quote.id,
            savedAt: quote.created_at,
            updatedAt: quote.updated_at,
            quote: {
              number: quote.number,
              client: quote.client_name,
              address: quote.work_address,
              validity: quote.validity,
              date: quote.quote_date,
              status: normalizeStatus(quote.status, "draft"),
              statusUpdatedAt: quote.status_updated_at,
            },
            lines,
            notes: quote.notes,
            totals: {
              cost: toSafeNumber(quote.cost_total, 0),
              margin: toSafeNumber(quote.margin_total, 0),
              beforeTax: toSafeNumber(quote.before_tax_total, 0),
              tax: toSafeNumber(quote.tax_total, 0),
              total: toSafeNumber(quote.grand_total, 0),
            },
          },
          {}
        );
      })
      .filter(Boolean);
  }

  return {
    DEFAULT_CURRENCY,
    applyBudgetLineEdit,
    findQuoteIndexByNumber,
    isSafeLogoSrc,
    normalizeCurrency,
    normalizeStatus,
    normalizeVariable,
    mapSupabaseQuoteRows,
    mapSupabaseTemplateRows,
    renameTemplatePriceReferences,
    renameTemplateRuleReferences,
    safeLogoSrc,
    sanitizeImportedState,
    text,
    toSafeNumber,
  };
});
