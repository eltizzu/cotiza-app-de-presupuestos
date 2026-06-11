const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const core = require("../app/core.js");

function createFakeSupabase(fixtures = {}) {
  const calls = [];
  const ids = {
    prices: "price-id",
    rules: "rule-id",
    templates: "template-id",
    quotes: "quote-id",
    clients: "client-id",
  };

  class Builder {
    constructor(table) {
      this.table = table;
      this.action = "select";
      this.filters = [];
      this.payload = null;
      this.options = null;
    }

    select() {
      return this;
    }

    eq(column, value) {
      this.filters.push({ column, value });
      return this;
    }

    gte(column, value) {
      this.filters.push({ column, value, operator: "gte" });
      return this;
    }

    order() {
      return this;
    }

    update(payload) {
      this.action = "update";
      this.payload = payload;
      calls.push({ action: "update", table: this.table, payload, filters: this.filters });
      return this;
    }

    insert(payload) {
      this.action = "insert";
      this.payload = payload;
      calls.push({ action: "insert", table: this.table, payload, filters: this.filters });
      return this;
    }

    upsert(payload, options) {
      this.action = "upsert";
      this.payload = payload;
      this.options = options;
      calls.push({ action: "upsert", table: this.table, payload, options, filters: this.filters });
      return this;
    }

    delete() {
      this.action = "delete";
      calls.push({ action: "delete", table: this.table, filters: this.filters });
      return this;
    }

    maybeSingle() {
      const rows = this._rows();
      return Promise.resolve({ data: rows[0] || null, error: null });
    }

    single() {
      if (this.action === "insert" || this.action === "upsert") {
        return Promise.resolve({ data: { id: ids[this.table] || `${this.table}-id` }, error: null });
      }
      return Promise.resolve({ data: this._rows()[0] || null, error: null });
    }

    then(resolve, reject) {
      return Promise.resolve({ data: this._rows(), error: null }).then(resolve, reject);
    }

    _rows() {
      let rows = fixtures[this.table] || [];
      for (const filter of this.filters) {
        if (filter.operator === "gte") {
          rows = rows.filter((row) => String(row[filter.column] || "") >= String(filter.value));
        } else {
          rows = rows.filter((row) => row[filter.column] === filter.value);
        }
      }
      return rows;
    }
  }

  return {
    calls,
    from(table) {
      return new Builder(table);
    },
  };
}

function loadSync(fakeSb, state) {
  const sandbox = {
    console,
    window: {
      sb: fakeSb,
      Cotiza: {
        core,
        state,
        saveState() {
          state.savedLocally = true;
        },
      },
      CotizaAuth: {
        user: { id: "user-id" },
        businessId: "business-id",
      },
      CotizaRender: {
        renderAll() {
          state.rendered = true;
        },
      },
    },
  };
  vm.createContext(sandbox);
  const syncCode = fs.readFileSync(path.join(__dirname, "../app/supabase-sync.js"), "utf8");
  vm.runInContext(syncCode, sandbox);
  return sandbox.window.CotizaSync;
}

test("loads settings, prices, rules, templates and quotes from Supabase", async () => {
  const state = {};
  const fakeSb = createFakeSupabase({
    businesses: [
      {
        id: "business-id",
        name: "Reformas Test",
        phone: "600",
        email: "a@test.com",
        address: "Calle 1",
        logo_url: "",
        currency: "EUR",
        tax_rate: "21",
        margin_rate: "20",
        next_quote_number: 4,
      },
    ],
    prices: [{ id: "price-1", business_id: "business-id", name: "Hora oficial", type: "Mano de obra", unit: "hora", unit_price: "30" }],
    rules: [{ id: "rule-1", business_id: "business-id", name: "Horas pintura", variable: "area", factor: "0.2", unit: "horas" }],
    templates: [
      {
        id: "template-1",
        business_id: "business-id",
        name: "Pintar",
        description: "Base",
        template_lines: [{ price_id: "price-1", rule_id: "rule-1", multiplier: "2", sort_order: 1 }],
      },
    ],
    quotes: [
      {
        id: "quote-1",
        business_id: "business-id",
        number: "P-0003",
        client_name: "Ana",
        work_address: "Obra",
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
        quote_lines: [{ name: "Hora oficial", quantity: "2", unit: "hora", unit_price: "30", sort_order: 1 }],
      },
    ],
  });
  const sync = loadSync(fakeSb, state);

  await sync.loadAndApply();

  assert.equal(state.settings.businessName, "Reformas Test");
  assert.equal(state.prices[0].price, 30);
  assert.equal(state.rules[0].factor, 0.2);
  assert.equal(state.templates[0].lines[0].ruleName, "Horas pintura");
  assert.equal(state.savedQuotes[0].quote.number, "P-0003");
  assert.equal(state.nextQuoteNumber, 4);
  assert.equal(state.savedLocally, true);
  assert.equal(state.rendered, true);
});

test("writes prices, rules, templates and quotes to Supabase tables", async () => {
  const state = {
    settings: { businessName: "Reformas Test", businessPhone: "", businessEmail: "", businessAddress: "", businessLogo: "", currency: "EUR", tax: 21, margin: 20 },
    nextQuoteNumber: 8,
  };
  const fakeSb = createFakeSupabase({
    prices: [{ id: "price-id", business_id: "business-id", name: "Hora oficial" }],
    rules: [{ id: "rule-id", business_id: "business-id", name: "Horas pintura" }],
    templates: [],
  });
  const sync = loadSync(fakeSb, state);

  await sync.saveSettings(state.settings, state.nextQuoteNumber);
  await sync.upsertPrice({ name: "Hora oficial", type: "Mano de obra", unit: "hora", price: 30 });
  await sync.upsertRule({ name: "Horas pintura", variable: "area", factor: 0.2, unit: "horas" });
  await sync.saveTemplate({
    id: "local-template",
    name: "Pintar",
    description: "Base",
    lines: [{ priceName: "Hora oficial", ruleName: "Horas pintura", multiplier: 2 }],
  });
  await sync.saveQuote(
    {
      quote: { number: "P-0007", client: "Ana", address: "Obra", validity: "15 dias", date: "2026-06-05", status: "sent", statusUpdatedAt: "2026-06-05T10:00:00Z" },
      notes: "Notas",
      totals: { cost: 100, margin: 20, beforeTax: 120, tax: 25.2, total: 145.2 },
      lines: [{ name: "Hora oficial", quantity: 2, unit: "hora", unitPrice: 30, source: { ruleName: "Horas pintura" } }],
    },
    state.nextQuoteNumber
  );

  assert(fakeSb.calls.some((call) => call.table === "businesses" && call.action === "update" && call.payload.next_quote_number === 8));
  assert(fakeSb.calls.some((call) => call.table === "prices" && call.action === "upsert" && call.options.onConflict === "business_id,name"));
  assert(fakeSb.calls.some((call) => call.table === "rules" && call.action === "upsert" && call.options.onConflict === "business_id,name"));
  assert(fakeSb.calls.some((call) => call.table === "templates" && call.action === "insert"));
  assert(fakeSb.calls.some((call) => call.table === "template_lines" && call.action === "insert" && call.payload[0].price_id === "price-id" && call.payload[0].rule_id === "rule-id"));
  assert(fakeSb.calls.some((call) => call.table === "quotes" && call.action === "upsert" && call.options.onConflict === "business_id,number"));
  assert(fakeSb.calls.some((call) => call.table === "quote_lines" && call.action === "insert" && call.payload[0].source.ruleName === "Horas pintura"));
});

test("calculates dashboard metrics from Supabase quotes", async () => {
  const fakeSb = createFakeSupabase({
    quotes: [
      { business_id: "business-id", number: "P-1", client_name: "Ana", quote_date: "2099-06-01", status: "accepted", grand_total: "100" },
      { business_id: "business-id", number: "P-2", client_name: "Ana", quote_date: "2099-06-02", status: "sent", grand_total: "50" },
      { business_id: "business-id", number: "P-3", client_name: "Luis", quote_date: "2099-06-03", status: "rejected", grand_total: "25" },
    ],
  });
  const sync = loadSync(fakeSb, { settings: {} });

  const metrics = await sync.getDashboardMetrics("quarter");

  assert.equal(metrics.totalQuotes, 3);
  assert.equal(metrics.totalAmount, 175);
  assert.equal(metrics.statusCounts.accepted, 1);
  assert.equal(metrics.rates.sent, 33);
  assert.equal(metrics.rates.accepted, 33);
  assert.equal(metrics.rates.rejected, 33);
  assert.equal(metrics.rates.pending, 33);
  assert.equal(metrics.topClients[0].name, "Ana");
  assert.equal(metrics.topClients[0].total, 150);
});

test("groups Supabase clients with quote history", async () => {
  const fakeSb = createFakeSupabase({
    clients: [{ id: "client-1", business_id: "business-id", name: "Ana", phone: "600", email: "ana@test.com" }],
    quotes: [
      {
        id: "quote-1",
        business_id: "business-id",
        client_id: "client-1",
        number: "P-1",
        client_name: "Ana",
        work_address: "Obra",
        validity: "15 dias",
        quote_date: "2026-06-05",
        status: "accepted",
        status_updated_at: "2026-06-05T10:00:00Z",
        grand_total: "100",
        quote_lines: [{ name: "Hora oficial", quantity: "2", unit: "hora", unit_price: "30", sort_order: 1 }],
      },
    ],
  });
  const sync = loadSync(fakeSb, { settings: {} });

  const clients = await sync.getClientsWithQuoteStats();

  assert.equal(clients.length, 1);
  assert.equal(clients[0].name, "Ana");
  assert.equal(clients[0].phone, "600");
  assert.equal(clients[0].quoteCount, 1);
  assert.equal(clients[0].totalAmount, 100);
  assert.equal(clients[0].quotes[0].quote.number, "P-1");
  assert.equal(clients[0].quotes[0].lines[0].name, "Hora oficial");
});

test("creates a client automatically when saving a quote", async () => {
  const state = {
    settings: { businessName: "Reformas Test", businessPhone: "", businessEmail: "", businessAddress: "", businessLogo: "", currency: "EUR", tax: 21, margin: 20 },
    nextQuoteNumber: 2,
  };
  const fakeSb = createFakeSupabase({ clients: [] });
  const sync = loadSync(fakeSb, state);

  await sync.saveQuote(
    {
      quote: { number: "P-1", client: "Nuevo Cliente", address: "Obra", validity: "15 dias", date: "2026-06-05", status: "draft" },
      totals: { total: 10 },
      lines: [],
    },
    2
  );

  assert(fakeSb.calls.some((call) => call.table === "clients" && call.action === "insert" && call.payload.name === "Nuevo Cliente"));
  assert(fakeSb.calls.some((call) => call.table === "quotes" && call.action === "upsert" && call.payload.client_id === "client-id"));
});

test("reuses existing client when saving a quote for the same business and name", async () => {
  const state = {
    settings: { businessName: "Reformas Test", businessPhone: "", businessEmail: "", businessAddress: "", businessLogo: "", currency: "EUR", tax: 21, margin: 20 },
    nextQuoteNumber: 2,
  };
  const fakeSb = createFakeSupabase({
    clients: [{ id: "existing-client", business_id: "business-id", name: "Ana" }],
  });
  const sync = loadSync(fakeSb, state);

  await sync.saveQuote(
    {
      quote: { number: "P-1", client: "Ana", address: "Obra", validity: "15 dias", date: "2026-06-05", status: "draft" },
      totals: { total: 10 },
      lines: [],
    },
    2
  );

  assert.equal(fakeSb.calls.some((call) => call.table === "clients" && call.action === "insert"), false);
  assert(fakeSb.calls.some((call) => call.table === "quotes" && call.action === "upsert" && call.payload.client_id === "existing-client"));
});

test("groups Supabase quotes without client id by client name", async () => {
  const fakeSb = createFakeSupabase({
    clients: [],
    quotes: [
      {
        id: "quote-1",
        business_id: "business-id",
        client_id: null,
        number: "P-1",
        client_name: "Cliente suelto",
        work_address: "Obra 1",
        quote_date: "2026-06-01",
        status: "sent",
        grand_total: "100",
        quote_lines: [],
      },
      {
        id: "quote-2",
        business_id: "business-id",
        client_id: null,
        number: "P-2",
        client_name: "Cliente suelto",
        work_address: "Obra 2",
        quote_date: "2026-06-04",
        status: "accepted",
        grand_total: "75",
        quote_lines: [],
      },
    ],
  });
  const sync = loadSync(fakeSb, { settings: {} });

  const clients = await sync.getClientsWithQuoteStats();

  assert.equal(clients.length, 1);
  assert.equal(clients[0].name, "Cliente suelto");
  assert.equal(clients[0].quoteCount, 2);
  assert.equal(clients[0].totalAmount, 175);
  assert.equal(clients[0].firstContact, "2026-06-01");
});
