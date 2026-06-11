// Cotiza - Supabase data sync
// Reads and writes prices, rules, templates, quotes and settings.

(function () {
  function getState() {
    return window.Cotiza?.state;
  }

  function getBusinessId() {
    return window.CotizaAuth?.businessId || null;
  }

  function isEnabled() {
    return Boolean(window.sb && window.CotizaAuth?.user && getBusinessId());
  }

  function numberOrZero(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function withError(result, label) {
    if (result?.error) throw new Error(`${label}: ${result.error.message}`);
    return result?.data;
  }

  function nextNumberFromQuotes(savedQuotes) {
    const maxNumber = (Array.isArray(savedQuotes) ? savedQuotes : []).reduce((max, savedQuote) => {
      const match = /^P-(\d+)$/i.exec(savedQuote?.quote?.number || "");
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    return maxNumber + 1;
  }

  function periodStart(period) {
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

  function buildMetricsFromQuoteRows(quoteRows) {
    const statusCounts = { draft: 0, sent: 0, accepted: 0, rejected: 0 };
    const clients = new Map();
    let totalAmount = 0;

    (quoteRows || []).forEach((quote) => {
      const status = quote.status || "draft";
      const total = numberOrZero(quote.grand_total);
      const clientName = String(quote.client_name || "Sin cliente").trim() || "Sin cliente";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      totalAmount += total;
      const current = clients.get(clientName) || { name: clientName, total: 0, count: 0 };
      current.total += total;
      current.count += 1;
      clients.set(clientName, current);
    });

    const totalQuotes = quoteRows?.length || 0;
    const pending = (statusCounts.draft || 0) + (statusCounts.sent || 0);
    return {
      totalQuotes,
      totalAmount,
      statusCounts,
      rates: {
        draft: totalQuotes ? Math.round(((statusCounts.draft || 0) / totalQuotes) * 100) : 0,
        sent: totalQuotes ? Math.round(((statusCounts.sent || 0) / totalQuotes) * 100) : 0,
        accepted: totalQuotes ? Math.round(((statusCounts.accepted || 0) / totalQuotes) * 100) : 0,
        rejected: totalQuotes ? Math.round(((statusCounts.rejected || 0) / totalQuotes) * 100) : 0,
        pending: totalQuotes ? Math.round((pending / totalQuotes) * 100) : 0,
      },
      topClients: [...clients.values()].sort((a, b) => b.total - a.total).slice(0, 5),
    };
  }

  async function findByName(table, name) {
    if (!name) return null;
    return withError(
      await window.sb
        .from(table)
        .select("id")
        .eq("business_id", getBusinessId())
        .eq("name", name)
        .maybeSingle(),
      `Buscar ${table}`
    );
  }

  async function idByName(table, name) {
    const row = await findByName(table, name);
    return row?.id || null;
  }

  async function findClientByName(name) {
    if (!name) return null;
    return withError(
      await window.sb
        .from("clients")
        .select("*")
        .eq("business_id", getBusinessId())
        .eq("name", name)
        .maybeSingle(),
      "Buscar cliente"
    );
  }

  const CotizaSync = {
    isEnabled,

    async loadFromSupabase() {
      if (!isEnabled()) return null;
      const businessId = getBusinessId();

      const [pricesRes, rulesRes, templatesRes, quotesRes, businessRes] = await Promise.all([
        window.sb.from("prices").select("*").eq("business_id", businessId).order("name"),
        window.sb.from("rules").select("*").eq("business_id", businessId).order("name"),
        window.sb
          .from("templates")
          .select("*, template_lines(*)")
          .eq("business_id", businessId)
          .order("name"),
        window.sb
          .from("quotes")
          .select("*, quote_lines(*)")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false }),
        window.sb.from("businesses").select("*").eq("id", businessId).single(),
      ]);

      const priceRows = withError(pricesRes, "Cargar precios") || [];
      const ruleRows = withError(rulesRes, "Cargar rendimientos") || [];
      const templateRows = withError(templatesRes, "Cargar plantillas") || [];
      const quoteRows = withError(quotesRes, "Cargar presupuestos") || [];
      const business = withError(businessRes, "Cargar negocio");

      const savedQuotes = window.Cotiza.core.mapSupabaseQuoteRows(quoteRows);
      const nextQuoteNumber = Math.max(
        numberOrZero(business?.next_quote_number) || 1,
        nextNumberFromQuotes(savedQuotes)
      );

      return {
        prices: priceRows.map((price) => ({
          name: price.name,
          type: price.type,
          unit: price.unit,
          price: numberOrZero(price.unit_price),
        })),
        rules: ruleRows.map((rule) => ({
          name: rule.name,
          variable: rule.variable,
          factor: numberOrZero(rule.factor),
          unit: rule.unit,
        })),
        templates: window.Cotiza.core.mapSupabaseTemplateRows(templateRows, priceRows, ruleRows),
        savedQuotes,
        nextQuoteNumber,
        settings: business
          ? {
              businessName: business.name,
              businessPhone: business.phone,
              businessEmail: business.email,
              businessAddress: business.address,
              businessLogo: business.logo_url,
              currency: business.currency,
              tax: numberOrZero(business.tax_rate),
              margin: numberOrZero(business.margin_rate),
            }
          : null,
      };
    },

    async loadAndApply({ seedIfEmpty = false } = {}) {
      const state = getState();
      if (!state || !isEnabled()) return;

      const data = await this.loadFromSupabase();
      if (!data) return;

      const remoteIsEmpty =
        data.prices.length === 0 &&
        data.rules.length === 0 &&
        data.templates.length === 0 &&
        data.savedQuotes.length === 0;

      if (seedIfEmpty && remoteIsEmpty) {
        await this.saveAllLocal();
        return;
      }

      state.prices = data.prices;
      state.rules = data.rules;
      state.templates = data.templates;
      state.savedQuotes = data.savedQuotes;
      state.nextQuoteNumber = data.nextQuoteNumber;
      state.draftTemplateLines = [];
      state.editingTemplateId = null;
      if (data.settings) state.settings = { ...(state.settings || {}), ...data.settings };

      window.Cotiza?.saveState?.();
      window.CotizaRender?.renderAll?.();
      window.CotizaDashboard?.refresh?.();
      window.CotizaClients?.refresh?.();
    },

    async saveAllLocal() {
      const state = getState();
      if (!state || !isEnabled()) return;
      await this.saveSettings(state.settings, state.nextQuoteNumber);
      for (const price of state.prices) await this.upsertPrice(price);
      for (const rule of state.rules) await this.upsertRule(rule);
      for (const template of state.templates) await this.saveTemplate(template);
      for (const savedQuote of state.savedQuotes) await this.saveQuote(savedQuote, state.nextQuoteNumber);
    },

    async saveSettings(settings, nextQuoteNumber) {
      if (!isEnabled()) return;
      const payload = {
        name: settings.businessName,
        phone: settings.businessPhone || "",
        email: settings.businessEmail || "",
        address: settings.businessAddress || "",
        logo_url: settings.businessLogo || "",
        currency: settings.currency,
        tax_rate: settings.tax,
        margin_rate: settings.margin,
      };
      if (nextQuoteNumber) payload.next_quote_number = nextQuoteNumber;
      withError(await window.sb.from("businesses").update(payload).eq("id", getBusinessId()), "Guardar negocio");
    },

    async getDashboardMetrics(period = "month") {
      if (!isEnabled()) return null;
      const businessId = getBusinessId();
      const start = periodStart(period);
      const rows = withError(
        await window.sb
          .from("quotes")
          .select("number, client_name, quote_date, status, grand_total")
          .eq("business_id", businessId)
          .gte("quote_date", start)
          .order("quote_date", { ascending: true }),
        "Cargar metricas"
      );
      return buildMetricsFromQuoteRows(rows || []);
    },

    async getClientsWithQuoteStats() {
      if (!isEnabled()) return [];
      const businessId = getBusinessId();
      const [clientsRes, quotesRes] = await Promise.all([
        window.sb.from("clients").select("*").eq("business_id", businessId).order("name"),
        window.sb
          .from("quotes")
          .select("*, quote_lines(*)")
          .eq("business_id", businessId)
          .order("quote_date", { ascending: false }),
      ]);
      const clients = withError(clientsRes, "Cargar clientes") || [];
      const quotes = withError(quotesRes, "Cargar historial de clientes") || [];
      const clientById = new Map(clients.map((client) => [client.id, client]));
      const grouped = new Map();

      function ensureGroup(client, fallbackName) {
        const name = String(client?.name || fallbackName || "Sin cliente").trim() || "Sin cliente";
        const key = (client?.id || name).toLowerCase();
        if (!grouped.has(key)) {
          grouped.set(key, {
            key,
            id: client?.id || null,
            name,
            phone: client?.phone || "",
            email: client?.email || "",
            firstContact: "",
            lastContact: "",
            quoteCount: 0,
            totalAmount: 0,
            quotes: [],
          });
        }
        return grouped.get(key);
      }

      clients.forEach((client) => ensureGroup(client, client.name));
      quotes.forEach((quote) => {
        const client = quote.client_id ? clientById.get(quote.client_id) : null;
        const group = ensureGroup(client, quote.client_name);
        const mapped = window.Cotiza.core.mapSupabaseQuoteRows([quote])[0];
        const date = quote.quote_date || "";
        group.quoteCount += 1;
        group.totalAmount += numberOrZero(quote.grand_total);
        if (date && (!group.firstContact || date < group.firstContact)) group.firstContact = date;
        if (date && (!group.lastContact || date > group.lastContact)) group.lastContact = date;
        if (mapped) group.quotes.push(mapped);
      });

      return [...grouped.values()];
    },

    async ensureClientFromQuote(savedQuote) {
      if (!isEnabled()) return null;
      const name = String(savedQuote?.quote?.client || "").trim();
      if (!name) return null;
      const existing = await findClientByName(name);
      if (existing) return existing.id;
      const created = withError(
        await window.sb
          .from("clients")
          .insert({
            business_id: getBusinessId(),
            name,
            address: savedQuote?.quote?.address || "",
          })
          .select("id")
          .single(),
        "Crear cliente"
      );
      return created?.id || null;
    },

    async upsertPrice(price, previousName) {
      if (!isEnabled()) return;
      if (previousName && previousName !== price.name) {
        const previous = await findByName("prices", previousName);
        if (previous) {
          withError(
            await window.sb
              .from("prices")
              .update({
                name: price.name,
                type: price.type,
                unit: price.unit,
                unit_price: price.price,
              })
              .eq("id", previous.id),
            "Renombrar precio"
          );
          return;
        }
      }
      withError(
        await window.sb.from("prices").upsert(
          {
            business_id: getBusinessId(),
            name: price.name,
            type: price.type,
            unit: price.unit,
            unit_price: price.price,
          },
          { onConflict: "business_id,name" }
        ),
        "Guardar precio"
      );
    },

    async deletePrice(name) {
      if (!isEnabled()) return;
      withError(
        await window.sb.from("prices").delete().eq("business_id", getBusinessId()).eq("name", name),
        "Eliminar precio"
      );
    },

    async upsertRule(rule, previousName) {
      if (!isEnabled()) return;
      if (previousName && previousName !== rule.name) {
        const previous = await findByName("rules", previousName);
        if (previous) {
          withError(
            await window.sb
              .from("rules")
              .update({
                name: rule.name,
                variable: rule.variable,
                factor: rule.factor,
                unit: rule.unit,
              })
              .eq("id", previous.id),
            "Renombrar rendimiento"
          );
          return;
        }
      }
      withError(
        await window.sb.from("rules").upsert(
          {
            business_id: getBusinessId(),
            name: rule.name,
            variable: rule.variable,
            factor: rule.factor,
            unit: rule.unit,
          },
          { onConflict: "business_id,name" }
        ),
        "Guardar rendimiento"
      );
    },

    async deleteRule(name) {
      if (!isEnabled()) return;
      withError(
        await window.sb.from("rules").delete().eq("business_id", getBusinessId()).eq("name", name),
        "Eliminar rendimiento"
      );
    },

    async saveTemplate(template, previousName) {
      if (!isEnabled()) return;
      const businessId = getBusinessId();
      let existing = null;
      if (previousName && previousName !== template.name) existing = await findByName("templates", previousName);
      if (!existing) existing = await findByName("templates", template.name);

      const templatePayload = {
        business_id: businessId,
        name: template.name,
        description: template.description || "",
      };

      let templateId = existing?.id;
      if (templateId) {
        withError(await window.sb.from("templates").update(templatePayload).eq("id", templateId), "Guardar plantilla");
      } else {
        const created = withError(
          await window.sb.from("templates").insert(templatePayload).select("id").single(),
          "Crear plantilla"
        );
        templateId = created.id;
      }

      withError(await window.sb.from("template_lines").delete().eq("template_id", templateId), "Limpiar plantilla");

      const linePayloads = [];
      for (const [index, line] of (template.lines || []).entries()) {
        const priceId = await idByName("prices", line.priceName);
        if (!priceId) continue;
        const ruleId = line.ruleName ? await idByName("rules", line.ruleName) : null;
        if (line.ruleName && !ruleId) continue;
        linePayloads.push({
          template_id: templateId,
          price_id: priceId,
          rule_id: ruleId,
          variable: ruleId ? null : line.variable || "quantity",
          factor: ruleId ? 1 : line.factor || 1,
          multiplier: ruleId ? line.multiplier || 1 : 1,
          sort_order: index,
        });
      }

      if (linePayloads.length > 0) {
        withError(await window.sb.from("template_lines").insert(linePayloads), "Guardar partidas de plantilla");
      }
    },

    async saveQuote(savedQuote, nextQuoteNumber) {
      if (!isEnabled() || !savedQuote?.quote?.number) return;
      const clientId = await this.ensureClientFromQuote(savedQuote);
      const quotePayload = {
        business_id: getBusinessId(),
        client_id: clientId,
        number: savedQuote.quote.number,
        client_name: savedQuote.quote.client || "",
        work_address: savedQuote.quote.address || "",
        validity: savedQuote.quote.validity || "15 dias",
        quote_date: savedQuote.quote.date || new Date().toISOString().slice(0, 10),
        status: savedQuote.quote.status || "draft",
        status_updated_at: savedQuote.quote.statusUpdatedAt || new Date().toISOString(),
        notes: savedQuote.notes || "",
        cost_total: savedQuote.totals?.cost || 0,
        margin_total: savedQuote.totals?.margin || 0,
        before_tax_total: savedQuote.totals?.beforeTax || 0,
        tax_total: savedQuote.totals?.tax || 0,
        grand_total: savedQuote.totals?.total || 0,
      };

      const row = withError(
        await window.sb
          .from("quotes")
          .upsert(quotePayload, { onConflict: "business_id,number" })
          .select("id")
          .single(),
        "Guardar presupuesto"
      );

      withError(await window.sb.from("quote_lines").delete().eq("quote_id", row.id), "Limpiar presupuesto");
      const linePayloads = (savedQuote.lines || []).map((line, index) => ({
        quote_id: row.id,
        name: line.name,
        quantity: line.quantity || 0,
        unit: line.unit || "unidad",
        unit_price: line.unitPrice || 0,
        source: line.source || {},
        sort_order: index,
      }));
      if (linePayloads.length > 0) {
        withError(await window.sb.from("quote_lines").insert(linePayloads), "Guardar lineas del presupuesto");
      }
      if (nextQuoteNumber) await this.saveSettings(getState().settings, nextQuoteNumber);
    },

    async deleteQuote(number) {
      if (!isEnabled() || !number) return;
      withError(
        await window.sb.from("quotes").delete().eq("business_id", getBusinessId()).eq("number", number),
        "Eliminar presupuesto"
      );
    },
  };

  window.CotizaSync = CotizaSync;
})();
