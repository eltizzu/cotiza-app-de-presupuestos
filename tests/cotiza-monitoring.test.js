const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadMonitoring() {
  const listeners = {};
  const captured = [];
  const sandbox = {
    window: {
      addEventListener(type, handler) {
        listeners[type] = handler;
      },
      CotizaConfig: {
        async loadConfig() {
          return {
            SENTRY_DSN: "https://public@sentry.example/1",
            SENTRY_ENVIRONMENT: "test",
          };
        },
      },
      Sentry: {
        init(options) {
          sandbox.sentryOptions = options;
        },
        captureException(error, context) {
          captured.push({ error, context });
        },
      },
    },
  };
  vm.createContext(sandbox);
  const monitoringCode = fs.readFileSync(path.join(__dirname, "../app/monitoring.js"), "utf8");
  vm.runInContext(monitoringCode, sandbox);
  return { sandbox, listeners, captured };
}

test("captures global unhandled browser errors with Sentry context", async () => {
  const { listeners, captured } = loadMonitoring();
  await new Promise((resolve) => setImmediate(resolve));

  listeners.error({ error: new Error("Boom") });

  assert.equal(captured.length, 1);
  assert.equal(captured[0].error.message, "Boom");
  assert.equal(captured[0].context.extra.area, "window-error");
});

test("captures unhandled promise rejections with Sentry context", async () => {
  const { listeners, captured } = loadMonitoring();
  await new Promise((resolve) => setImmediate(resolve));

  listeners.unhandledrejection({ reason: "Async boom" });

  assert.equal(captured.length, 1);
  assert.equal(captured[0].error.message, "Async boom");
  assert.equal(captured[0].context.extra.area, "unhandled-rejection");
});
