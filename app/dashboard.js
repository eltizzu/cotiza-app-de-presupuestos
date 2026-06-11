(function () {
const { money, state } = window.Cotiza;
let statusChart;
let clientsChart;

function getPeriodStart(period) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
  } else if (period === "quarter") {
    start.setMonth(start.getMonth() - 3);
  } else {
    start.setDate(1);
  }
  return start.toISOString().slice(0, 10);
}

function normalizeQuote(savedQuote) {
  return {
    number: savedQuote?.quote?.number || "",
    clientName: savedQuote?.quote?.client || "Sin cliente",
    date: savedQuote?.quote?.date || savedQuote?.savedAt?.slice(0, 10) || "",
    status: savedQuote?.quote?.status || "draft",
    total: Number(savedQuote?.totals?.total) || 0,
  };
}

function buildMetricsFromQuotes(quotes, period) {
  const start = getPeriodStart(period);
  const filtered = quotes.map(normalizeQuote).filter((quote) => !quote.date || quote.date >= start);
  const statusCounts = { draft: 0, sent: 0, accepted: 0, rejected: 0 };
  const clients = new Map();
  let totalAmount = 0;

  filtered.forEach((quote) => {
    statusCounts[quote.status] = (statusCounts[quote.status] || 0) + 1;
    totalAmount += quote.total;
    const key = quote.clientName.trim() || "Sin cliente";
    const current = clients.get(key) || { name: key, total: 0, count: 0 };
    current.total += quote.total;
    current.count += 1;
    clients.set(key, current);
  });

  const topClients = [...clients.values()].sort((a, b) => b.total - a.total).slice(0, 5);
  const totalQuotes = filtered.length;
  const accepted = statusCounts.accepted || 0;
  const rejected = statusCounts.rejected || 0;
  const pending = (statusCounts.draft || 0) + (statusCounts.sent || 0);

  return {
    totalQuotes,
    totalAmount,
    statusCounts,
    rates: {
      draft: totalQuotes ? Math.round(((statusCounts.draft || 0) / totalQuotes) * 100) : 0,
      sent: totalQuotes ? Math.round(((statusCounts.sent || 0) / totalQuotes) * 100) : 0,
      accepted: totalQuotes ? Math.round((accepted / totalQuotes) * 100) : 0,
      rejected: totalQuotes ? Math.round((rejected / totalQuotes) * 100) : 0,
      pending: totalQuotes ? Math.round((pending / totalQuotes) * 100) : 0,
    },
    topClients,
  };
}

function localMetrics(period) {
  return buildMetricsFromQuotes(state.savedQuotes || [], period);
}

function renderMetricCards(metrics) {
  const target = document.getElementById("dashboardMetrics");
  if (!target) return;
  target.innerHTML = `
    <div class="summary-item"><span>Presupuestos</span><strong>${metrics.totalQuotes}</strong></div>
    <div class="summary-item"><span>Monto presupuestado</span><strong>${money(metrics.totalAmount)}</strong></div>
    <div class="summary-item"><span>Borrador</span><strong>${metrics.rates.draft}%</strong></div>
    <div class="summary-item"><span>Enviados</span><strong>${metrics.rates.sent}%</strong></div>
    <div class="summary-item"><span>Aceptados</span><strong>${metrics.rates.accepted}%</strong></div>
    <div class="summary-item"><span>Rechazados</span><strong>${metrics.rates.rejected}%</strong></div>
  `;
}

function destroyChart(chart) {
  if (chart) chart.destroy();
}

function renderCharts(metrics) {
  if (typeof Chart === "undefined") return;

  const statusCanvas = document.getElementById("statusChart");
  const clientsCanvas = document.getElementById("clientsChart");
  if (!statusCanvas || !clientsCanvas) return;

  destroyChart(statusChart);
  destroyChart(clientsChart);

  statusChart = new Chart(statusCanvas, {
    type: "bar",
    data: {
      labels: ["Borrador", "Enviado", "Aceptado", "Rechazado"],
      datasets: [
        {
          label: "Presupuestos",
          data: [
            metrics.statusCounts.draft || 0,
            metrics.statusCounts.sent || 0,
            metrics.statusCounts.accepted || 0,
            metrics.statusCounts.rejected || 0,
          ],
          backgroundColor: ["#94a3b8", "#38bdf8", "#22c55e", "#ef4444"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });

  clientsChart = new Chart(clientsCanvas, {
    type: "bar",
    data: {
      labels: metrics.topClients.map((client) => client.name),
      datasets: [
        {
          label: "Volumen",
          data: metrics.topClients.map((client) => client.total),
          backgroundColor: "#1d4ed8",
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } },
    },
  });
}

async function getMetrics(period) {
  if (window.CotizaSync?.isEnabled?.() && window.CotizaSync?.getDashboardMetrics) {
    return window.CotizaSync.getDashboardMetrics(period);
  }
  return localMetrics(period);
}

async function refresh() {
  const period = document.getElementById("dashboardPeriod")?.value || "month";
  const metrics = await getMetrics(period);
  renderMetricCards(metrics);
  renderCharts(metrics);
}

function bind() {
  document.getElementById("dashboardPeriod")?.addEventListener("change", refresh);
}

window.CotizaDashboard = {
  buildMetricsFromQuotes,
  getPeriodStart,
  refresh,
};

document.addEventListener("DOMContentLoaded", () => {
  bind();
  refresh();
});
})();
