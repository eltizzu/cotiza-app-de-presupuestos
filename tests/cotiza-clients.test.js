const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadClientsModule() {
  const state = { savedQuotes: [] };
  const sandbox = {
    window: {
      Cotiza: {
        state,
        escapeHtml(value) {
          return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;");
        },
        money(value) {
          return `${Number(value || 0).toFixed(2)} EUR`;
        },
      },
    },
    document: {
      addEventListener() {},
      getElementById() {
        return null;
      },
    },
  };
  vm.createContext(sandbox);
  const clientsCode = fs.readFileSync(path.join(__dirname, "../app/clients.js"), "utf8");
  vm.runInContext(clientsCode, sandbox);
  return sandbox.window.CotizaClients;
}

test("groups local quotes by client name when there is no client id", () => {
  const clientsModule = loadClientsModule();

  const clients = clientsModule.buildClientsFromQuotes([
    { quote: { client: "Ana", date: "2026-06-01" }, totals: { total: 100 }, lines: [] },
    { quote: { client: "Ana", date: "2026-06-05" }, totals: { total: 50 }, lines: [] },
  ]);

  assert.equal(clients.length, 1);
  assert.equal(clients[0].name, "Ana");
  assert.equal(clients[0].firstContact, "2026-06-01");
  assert.equal(clients[0].quoteCount, 2);
  assert.equal(clients[0].totalAmount, 150);
});

test("renders client quote history with quote lines", () => {
  const clientsModule = loadClientsModule();

  const html = clientsModule.buildClientHistoryHtml([
    {
      quote: { number: "P-1", date: "2026-06-05", status: "sent", address: "Obra" },
      totals: { total: 145 },
      lines: [
        { name: "Hora oficial", quantity: 2, unit: "hora", unitPrice: 30 },
        { name: "Pintura interior", quantity: 3, unit: "litro", unitPrice: 8.5 },
      ],
    },
  ]);

  assert.match(html, /P-1/);
  assert.match(html, /Hora oficial/);
  assert.match(html, /2 hora/);
  assert.match(html, /30.00 EUR/);
  assert.match(html, /Pintura interior/);
});
