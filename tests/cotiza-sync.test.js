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
        rows = rows.filter((row) => row[filter.column] === filter.value);
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
