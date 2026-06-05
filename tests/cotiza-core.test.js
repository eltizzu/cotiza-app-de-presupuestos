const assert = require("node:assert/strict");
const test = require("node:test");

const core = require("../app/core.js");

test("normalizes invalid currency codes to EUR", () => {
  assert.equal(core.normalizeCurrency("EUR"), "EUR");
  assert.equal(core.normalizeCurrency("usd"), "USD");
  assert.equal(core.normalizeCurrency("NOT_A_CURRENCY"), "EUR");
  assert.equal(core.normalizeCurrency(""), "EUR");
});

test("sanitizes imported state before it reaches localStorage", () => {
  const initialState = {
    settings: { currency: "EUR", tax: 21, margin: 20, businessLogo: "" },
    prices: [{ name: "Hora", type: "Mano de obra", unit: "hora", price: 25 }],
    rules: [{ name: "Horas", variable: "area", factor: 1, unit: "horas" }],
    templates: [{ id: "paint", name: "Pintar", description: "Base", lines: [] }],
    quote: { number: "P-0001", status: "draft" },
    nextQuoteNumber: 2,
    savedQuotes: [],
    historyFilters: { search: "", status: "all" },
  };
  const imported = {
    settings: {
      currency: "bad",
      tax: "Infinity",
      margin: "12.5",
      businessLogo: 'x" onerror="alert(1)',
    },
    prices: [{ name: "<b>Hora</b>", type: "", unit: "hora", price: "30" }, { name: "", price: 9 }],
    rules: [{ name: "Horas", variable: "bad", factor: "0.5", unit: "horas" }],
    templates: [
      {
        id: 'tpl" onclick="x',
        name: "Trabajo",
        description: "Desc",
        lines: [{ priceName: "Hora", variable: "bad", factor: "2" }],
      },
    ],
    savedQuotes: "not-array",
  };

  const sanitized = core.sanitizeImportedState(imported, initialState);

  assert.equal(sanitized.settings.currency, "EUR");
  assert.equal(sanitized.settings.tax, 21);
  assert.equal(sanitized.settings.margin, 12.5);
  assert.equal(sanitized.settings.businessLogo, "");
  assert.deepEqual(sanitized.prices, [{ name: "<b>Hora</b>", type: "Otro", unit: "hora", price: 30 }]);
  assert.equal(sanitized.rules[0].variable, "area");
  assert.equal(sanitized.templates[0].id, "tpl-onclick-x");
  assert.equal(sanitized.templates[0].lines[0].variable, "quantity");
  assert.deepEqual(sanitized.savedQuotes, []);
});

test("only safe logo sources are allowed in rendered attributes", () => {
  assert.equal(core.safeLogoSrc("data:image/png;base64,AAAA"), "data:image/png;base64,AAAA");
  assert.equal(core.safeLogoSrc("../assets/cotiza-logo-mark.svg"), "../assets/cotiza-logo-mark.svg");
  assert.equal(core.safeLogoSrc('x" onerror="alert(1)'), "");
  assert.equal(core.safeLogoSrc("javascript:alert(1)"), "");
});

test("finds existing saved quotes by nested quote number", () => {
  const savedQuotes = [
    { quote: { number: "P-0001" }, id: "a" },
    { quote: { number: "P-0002" }, id: "b" },
  ];

  assert.equal(core.findQuoteIndexByNumber(savedQuotes, "P-0002"), 1);
  assert.equal(core.findQuoteIndexByNumber(savedQuotes, "P-9999"), -1);
});

test("editing a calculated line removes stale calculation source", () => {
  const line = {
    name: "Hora oficial",
    quantity: 4.5,
    unit: "hora",
    unitPrice: 28,
    source: { ruleName: "Horas pintura por m2" },
  };

  const edited = core.applyBudgetLineEdit(line, "quantity", "5");

  assert.equal(edited.quantity, 5);
  assert.equal(edited.source, undefined);
});

test("renames price references across templates", () => {
  const templates = [
    {
      id: "paint",
      lines: [{ priceName: "Hora oficial" }, { priceName: "Pintura" }],
    },
  ];

  const renamed = core.renameTemplatePriceReferences(templates, "Hora oficial", "Hora senior");

  assert.equal(renamed[0].lines[0].priceName, "Hora senior");
  assert.equal(renamed[0].lines[1].priceName, "Pintura");
});

test("renames rule references across templates", () => {
  const templates = [
    {
      id: "paint",
      lines: [{ ruleName: "Horas pintura" }, { priceName: "Pintura" }],
    },
  ];

  const renamed = core.renameTemplateRuleReferences(templates, "Horas pintura", "Horas pintura pro");

  assert.equal(renamed[0].lines[0].ruleName, "Horas pintura pro");
  assert.equal(renamed[0].lines[1].priceName, "Pintura");
});

test("maps Supabase template lines to local price and rule names", () => {
  const templates = [
    {
      id: "template-row-id",
      name: "Pintar habitacion",
      description: "Paredes y techo",
      template_lines: [
        { price_id: "price-2", variable: "area", factor: "1.25", multiplier: "1", sort_order: 2 },
        { price_id: "price-1", rule_id: "rule-1", factor: "1", multiplier: "2", sort_order: 1 },
      ],
    },
  ];

  const mapped = core.mapSupabaseTemplateRows(
    templates,
    [{ id: "price-1", name: "Hora oficial" }, { id: "price-2", name: "Pintura blanca" }],
    [{ id: "rule-1", name: "Horas pintura" }]
  );

  assert.deepEqual(mapped, [
    {
      id: "template-row-id",
      name: "Pintar habitacion",
      description: "Paredes y techo",
      lines: [
        { priceName: "Hora oficial", ruleName: "Horas pintura", multiplier: 2 },
        { priceName: "Pintura blanca", variable: "area", factor: 1.25 },
      ],
    },
  ]);
});

test("maps Supabase quote rows to saved quote format", () => {
  const mapped = core.mapSupabaseQuoteRows([
    {
      id: "quote-row-id",
      number: "P-0007",
      client_name: "Ana",
      work_address: "Calle Mayor",
      validity: "15 dias",
      quote_date: "2026-06-05",
      status: "sent",
      status_updated_at: "2026-06-05T10:00:00Z",
      notes: "Notas",
      cost_total: "100",
      margin_total: "20",
      before_tax_total: "120",
      tax_total: "25.2",
      grand_total: "145.2",
      created_at: "2026-06-05T09:00:00Z",
      updated_at: "2026-06-05T10:05:00Z",
      quote_lines: [
        {
          name: "Hora oficial",
          quantity: "2",
          unit: "hora",
          unit_price: "30",
          source: { ruleName: "Horas pintura" },
          sort_order: 1,
        },
      ],
    },
  ]);

  assert.deepEqual(mapped, [
    {
      id: "quote-row-id",
      savedAt: "2026-06-05T09:00:00Z",
      updatedAt: "2026-06-05T10:05:00Z",
      quote: {
        number: "P-0007",
        client: "Ana",
        address: "Calle Mayor",
        validity: "15 dias",
        date: "2026-06-05",
        status: "sent",
        statusUpdatedAt: "2026-06-05T10:00:00Z",
      },
      lines: [
        {
          name: "Hora oficial",
          quantity: 2,
          unit: "hora",
          unitPrice: 30,
          source: { ruleName: "Horas pintura" },
        },
      ],
      notes: "Notas",
      totals: {
        cost: 100,
        margin: 20,
        beforeTax: 120,
        tax: 25.2,
        total: 145.2,
      },
    },
  ]);
});
