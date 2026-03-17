(() => {
  if (window.__ATA_PROBE_V2?.installed) {
    console.info("[ATA_PROBE_V2] already active. Use __ATA_PROBE_V2.help()");
    return;
  }

  const MAX_EVENTS = 1200;
  const MAX_KEYS = 80;
  const MAX_ERROR_TEXT = 600;
  const startedAt = new Date().toISOString();
  const events = [];
  const xhrMeta = new WeakMap();
  const listeners = [];
  const SENSITIVE_KEY_PATTERN = /(token|secret|password|authorization|api[_-]?key|id_token|refresh_token|access_token|session_state|code|state)/i;

  const original = {
    fetch: window.fetch,
    xhrOpen: window.XMLHttpRequest?.prototype?.open,
    xhrSend: window.XMLHttpRequest?.prototype?.send,
    xhrSetRequestHeader: window.XMLHttpRequest?.prototype?.setRequestHeader,
  };

  const nowIso = () => new Date().toISOString();

  function pushEvent(evt) {
    events.push({ at: nowIso(), ...evt });
    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS);
    }
  }

  function normalizeUrl(input) {
    try {
      const url = new URL(String(input || ""), location.href);
      const queryKeys = [];
      const redactedQueryKeys = [];
      url.searchParams.forEach((_, key) => {
        const normalizedKey = String(key || "");
        if (!normalizedKey) {
          return;
        }
        if (SENSITIVE_KEY_PATTERN.test(normalizedKey)) {
          redactedQueryKeys.push(normalizedKey);
        } else {
          queryKeys.push(normalizedKey);
        }
      });
      return {
        full: `${url.origin}${url.pathname}`,
        host: url.host,
        path: url.pathname,
        queryKeys: Array.from(new Set(queryKeys)).sort(),
        redactedQueryKeys: Array.from(new Set(redactedQueryKeys)).sort(),
      };
    } catch (_) {
      const fallback = String(input || "");
      return { full: fallback, host: "", path: fallback, queryKeys: [], redactedQueryKeys: [] };
    }
  }

  function sanitizeErrorMessage(value) {
    const raw = String(value || "");
    let text = raw.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED]");
    text = text.replace(
      /([?&#][^=&#]*?(?:token|secret|password|authorization|api[_-]?key|id_token|refresh_token|access_token|session_state|code|state)[^=&#]*)=([^&#]*)/gi,
      "$1=[REDACTED]",
    );
    if (text.length > MAX_ERROR_TEXT) {
      return `${text.slice(0, MAX_ERROR_TEXT)}…`;
    }
    return text;
  }

  function headersToObject(headers) {
    if (!headers) {
      return {};
    }
    try {
      if (typeof Headers !== "undefined" && headers instanceof Headers) {
        const out = {};
        headers.forEach((value, key) => {
          out[String(key).toLowerCase()] = String(value);
        });
        return out;
      }
      if (Array.isArray(headers)) {
        const out = {};
        headers.forEach((entry) => {
          if (Array.isArray(entry) && entry.length >= 2) {
            out[String(entry[0]).toLowerCase()] = String(entry[1]);
          }
        });
        return out;
      }
      if (typeof headers === "object") {
        const out = {};
        Object.keys(headers).forEach((key) => {
          out[String(key).toLowerCase()] = String(headers[key]);
        });
        return out;
      }
    } catch (_) {
      // Ignore malformed headers.
    }
    return {};
  }

  function authInfoFromHeaders(headersObj) {
    const raw = String(headersObj?.authorization || "").trim();
    if (!raw) {
      return { present: false, scheme: "", tokenLength: 0 };
    }
    const match = raw.match(/^([A-Za-z-]+)\s+(.+)$/);
    if (!match) {
      return { present: true, scheme: "plain", tokenLength: raw.length };
    }
    return {
      present: true,
      scheme: match[1],
      tokenLength: String(match[2] || "").length,
    };
  }

  function safeParseJson(text) {
    if (typeof text !== "string" || !text.trim()) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch (_) {
      return null;
    }
  }

  function collectJsonKeys(value, prefix = "", depth = 0, out = new Set()) {
    if (depth > 3 || value == null) {
      return out;
    }
    if (Array.isArray(value)) {
      const next = prefix ? `${prefix}[]` : "[]";
      out.add(next);
      if (value.length > 0) {
        collectJsonKeys(value[0], next, depth + 1, out);
      }
      return out;
    }
    if (typeof value !== "object") {
      return out;
    }
    const keys = Object.keys(value);
    keys.forEach((key) => {
      const path = prefix ? `${prefix}.${key}` : key;
      out.add(path);
      collectJsonKeys(value[key], path, depth + 1, out);
    });
    return out;
  }

  function bodySummary(body) {
    if (body == null) {
      return { type: "none", size: 0, json: false, keys: [] };
    }
    if (typeof body === "string") {
      const json = safeParseJson(body);
      const keys = json ? Array.from(collectJsonKeys(json)).slice(0, MAX_KEYS).sort() : [];
      return { type: "string", size: body.length, json: Boolean(json), keys };
    }
    if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
      return { type: "urlsearchparams", size: body.toString().length, json: false, keys: [] };
    }
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      const keys = [];
      body.forEach((_, key) => {
        keys.push(String(key));
      });
      return {
        type: "formdata",
        size: 0,
        json: false,
        keys: Array.from(new Set(keys)).slice(0, MAX_KEYS).sort(),
      };
    }
    if (typeof Blob !== "undefined" && body instanceof Blob) {
      return { type: "blob", size: Number(body.size || 0), json: false, keys: [] };
    }
    return { type: typeof body, size: 0, json: false, keys: [] };
  }

  function isApiHost(host) {
    return String(host || "").toLowerCase() === "api.autodarts.io";
  }

  function getStatusPills() {
    const result = [];
    const visited = new Set();

    function walk(root) {
      if (!root || visited.has(root)) {
        return;
      }
      visited.add(root);

      try {
        root.querySelectorAll?.(".ata-status-pill").forEach((el) => {
          const text = String(el.textContent || "").trim();
          if (text) {
            result.push(text);
          }
        });
      } catch (_) {
        // Ignore selector errors.
      }

      try {
        root.querySelectorAll?.("*").forEach((el) => {
          if (el.shadowRoot) {
            walk(el.shadowRoot);
          }
        });
      } catch (_) {
        // Ignore selector errors.
      }
    }

    walk(document);
    return Array.from(new Set(result));
  }

  function summarizeCapabilities() {
    const map = new Map();
    events.forEach((evt) => {
      if (evt.type !== "network" || !isApiHost(evt.host)) {
        return;
      }
      const key = `${evt.method} ${evt.path}`;
      const current = map.get(key) || {
        method: evt.method,
        host: evt.host,
        path: evt.path,
        count: 0,
        statusCounts: {},
        authSeen: false,
        requestBodyTypes: new Set(),
        requestBodyKeyPaths: new Set(),
        examples: [],
      };

      current.count += 1;
      const statusKey = String(evt.status ?? "ERR");
      current.statusCounts[statusKey] = (current.statusCounts[statusKey] || 0) + 1;
      current.authSeen = current.authSeen || Boolean(evt.auth?.present);

      if (evt.requestBody?.type) {
        current.requestBodyTypes.add(evt.requestBody.type);
      }
      if (Array.isArray(evt.requestBody?.keys)) {
        evt.requestBody.keys.forEach((entry) => current.requestBodyKeyPaths.add(entry));
      }

      if (current.examples.length < 5) {
        current.examples.push({
          status: evt.status ?? null,
          ms: evt.ms ?? null,
          requestBodyType: evt.requestBody?.type || "none",
        });
      }

      map.set(key, current);
    });

    return Array.from(map.values())
      .map((entry) => ({
        method: entry.method,
        host: entry.host,
        path: entry.path,
        count: entry.count,
        statusCounts: entry.statusCounts,
        authSeen: entry.authSeen,
        requestBodyTypes: Array.from(entry.requestBodyTypes).sort(),
        requestBodyKeyPaths: Array.from(entry.requestBodyKeyPaths).sort(),
        examples: entry.examples,
      }))
      .sort((a, b) => b.count - a.count);
  }

  if (typeof original.fetch === "function") {
    window.fetch = function ataProbeV2Fetch(input, init) {
      const method = String(
        init?.method || (typeof input === "object" && input?.method) || "GET",
      ).toUpperCase();
      const target = normalizeUrl((typeof input === "string" ? input : input?.url) || "");
      const headers = {
        ...headersToObject(typeof input === "object" ? input?.headers : null),
        ...headersToObject(init?.headers),
      };
      const auth = authInfoFromHeaders(headers);
      const requestBody = bodySummary(
        Object.prototype.hasOwnProperty.call(init || {}, "body")
          ? init?.body
          : (typeof input === "object" ? input?.body : undefined),
      );
      const startedAtMs = performance.now();

      return original.fetch.apply(this, arguments)
        .then((response) => {
          pushEvent({
            type: "network",
            via: "fetch",
            method,
            url: target.full,
            host: target.host,
            path: target.path,
            queryKeys: target.queryKeys,
            redactedQueryKeys: target.redactedQueryKeys,
            status: response.status,
            ok: response.ok,
            ms: Math.round(performance.now() - startedAtMs),
            auth,
            requestBody,
            requestHeaderNames: Object.keys(headers).slice(0, 60),
          });
          return response;
        })
        .catch((error) => {
          pushEvent({
            type: "network",
            via: "fetch",
            method,
            url: target.full,
            host: target.host,
            path: target.path,
            queryKeys: target.queryKeys,
            redactedQueryKeys: target.redactedQueryKeys,
            status: null,
            ok: false,
            ms: Math.round(performance.now() - startedAtMs),
            auth,
            requestBody,
            requestHeaderNames: Object.keys(headers).slice(0, 60),
            error: sanitizeErrorMessage(error?.message || error || "fetch failed"),
          });
          throw error;
        });
    };
  }

  const xhrPrototype = window.XMLHttpRequest?.prototype;
  if (xhrPrototype && original.xhrOpen && original.xhrSend && original.xhrSetRequestHeader) {
    xhrPrototype.open = function ataProbeV2XhrOpen(method, url) {
      xhrMeta.set(this, {
        method: String(method || "GET").toUpperCase(),
        target: normalizeUrl(url),
        headers: {},
        startedAtMs: 0,
        requestBody: { type: "none", size: 0, json: false, keys: [] },
      });
      return original.xhrOpen.apply(this, arguments);
    };

    xhrPrototype.setRequestHeader = function ataProbeV2XhrSetRequestHeader(name, value) {
      const meta = xhrMeta.get(this) || {
        method: "GET",
        target: normalizeUrl(""),
        headers: {},
        startedAtMs: 0,
        requestBody: { type: "none", size: 0, json: false, keys: [] },
      };
      meta.headers[String(name || "").toLowerCase()] = String(value || "");
      xhrMeta.set(this, meta);
      return original.xhrSetRequestHeader.apply(this, arguments);
    };

    xhrPrototype.send = function ataProbeV2XhrSend(body) {
      const meta = xhrMeta.get(this) || {
        method: "GET",
        target: normalizeUrl(""),
        headers: {},
        startedAtMs: 0,
        requestBody: { type: "none", size: 0, json: false, keys: [] },
      };
      meta.startedAtMs = performance.now();
      meta.requestBody = bodySummary(body);
      xhrMeta.set(this, meta);

      this.addEventListener("loadend", () => {
        const current = xhrMeta.get(this) || meta;
        pushEvent({
          type: "network",
          via: "xhr",
          method: current.method,
          url: current.target.full,
          host: current.target.host,
          path: current.target.path,
          queryKeys: current.target.queryKeys,
          redactedQueryKeys: current.target.redactedQueryKeys,
          status: Number(this.status || 0) || null,
          ok: Number(this.status || 0) >= 200 && Number(this.status || 0) < 300,
          ms: Math.round(performance.now() - (current.startedAtMs || performance.now())),
          auth: authInfoFromHeaders(current.headers),
          requestBody: current.requestBody,
          requestHeaderNames: Object.keys(current.headers).slice(0, 60),
        });
      }, { once: true });

      return original.xhrSend.apply(this, arguments);
    };
  }

  function onError(event) {
    pushEvent({
      type: "error",
      message: sanitizeErrorMessage(event?.message || "window error"),
      source: String(event?.filename || ""),
      line: event?.lineno || null,
      col: event?.colno || null,
    });
  }

  function onRejection(event) {
    pushEvent({
      type: "error",
      message: sanitizeErrorMessage(event?.reason?.message || event?.reason || "unhandledrejection"),
      source: "promise",
    });
  }

  window.addEventListener("error", onError, true);
  window.addEventListener("unhandledrejection", onRejection, true);
  listeners.push(() => window.removeEventListener("error", onError, true));
  listeners.push(() => window.removeEventListener("unhandledrejection", onRejection, true));

  window.__ATA_PROBE_V2 = {
    installed: true,
    startedAt,
    help() {
      console.log(
        [
          "[ATA_PROBE_V2]",
          "- __ATA_PROBE_V2.clear()",
          "- __ATA_PROBE_V2.printCapabilities()",
          "- __ATA_PROBE_V2.report()",
          "- await __ATA_PROBE_V2.copyReport()",
          "- __ATA_PROBE_V2.stop()",
        ].join("\n"),
      );
    },
    clear() {
      events.length = 0;
      return true;
    },
    report() {
      const runtime = window.__ATA_RUNTIME || null;
      const debugReport = runtime?.getDebugReport?.() || null;
      const networkEvents = events.filter((entry) => entry.type === "network");
      const apiEvents = networkEvents.filter((entry) => isApiHost(entry.host));
      const errorEvents = events.filter((entry) => entry.type === "error");
      const safePage = `${location.origin}${location.pathname}`;
      const safeLastEvents = events
        .filter((entry) => (entry.type === "network" ? isApiHost(entry.host) : true))
        .slice(-150);

      return {
        generatedAt: nowIso(),
        startedAt,
        page: safePage,
        ataRuntimePresent: Boolean(runtime),
        ataVersion: runtime?.version || null,
        statusPills: getStatusPills(),
        debugSessionCount: debugReport?.sessionCount ?? null,
        counters: {
          allEvents: events.length,
          networkEvents: networkEvents.length,
          apiEvents: apiEvents.length,
          errorEvents: errorEvents.length,
        },
        capabilities: summarizeCapabilities(),
        lastEvents: safeLastEvents,
      };
    },
    printCapabilities() {
      const rows = this.report().capabilities;
      console.table(rows);
      return rows;
    },
    async copyReport() {
      const payload = JSON.stringify(this.report(), null, 2);
      if (typeof copy === "function") {
        copy(payload);
        return true;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        return true;
      }
      console.log(payload);
      return false;
    },
    stop() {
      try {
        if (typeof original.fetch === "function") {
          window.fetch = original.fetch;
        }
        const currentXhr = window.XMLHttpRequest?.prototype;
        if (currentXhr && original.xhrOpen) {
          currentXhr.open = original.xhrOpen;
        }
        if (currentXhr && original.xhrSend) {
          currentXhr.send = original.xhrSend;
        }
        if (currentXhr && original.xhrSetRequestHeader) {
          currentXhr.setRequestHeader = original.xhrSetRequestHeader;
        }
        listeners.forEach((cleanup) => {
          try {
            cleanup();
          } catch (_) {
            // Ignore cleanup errors.
          }
        });
      } finally {
        delete window.__ATA_PROBE_V2;
      }
      return true;
    },
  };

  console.info("[ATA_PROBE_V2] active. Use __ATA_PROBE_V2.help()");
})();
