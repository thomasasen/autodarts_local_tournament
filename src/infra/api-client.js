// Auto-generated module split from dist source.
  function shouldShowAuthNotice() {
    const now = Date.now();
    if (now - state.apiAutomation.lastAuthNoticeAt < API_AUTH_NOTICE_THROTTLE_MS) {
      return false;
    }
    state.apiAutomation.lastAuthNoticeAt = now;
    return true;
  }


  function getAuthTokenFromCookie() {
    try {
      const value = `; ${document.cookie || ""}`;
      const parts = value.split("; Authorization=");
      if (parts.length !== 2) {
        return "";
      }
      let token = parts.pop().split(";").shift() || "";
      try {
        token = decodeURIComponent(token);
      } catch (_) {
        // Keep raw token if decoding fails.
      }
      token = String(token).trim().replace(/^Bearer\s+/i, "");
      return token;
    } catch (_) {
      return "";
    }
  }


  function decodeJwtPayload(token) {
    const rawToken = normalizeText(token || "");
    if (!rawToken) {
      return null;
    }
    const parts = rawToken.split(".");
    if (parts.length < 2) {
      return null;
    }
    try {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "===".slice((base64.length + 3) % 4);
      const json = atob(padded);
      return JSON.parse(json);
    } catch (_) {
      return null;
    }
  }


  function getTokenExpiryMs(token, fallbackExpiryMs = 0) {
    const payload = decodeJwtPayload(token);
    const expSeconds = Number(payload?.exp || 0);
    if (Number.isFinite(expSeconds) && expSeconds > 0) {
      return expSeconds * 1000;
    }
    return Number(fallbackExpiryMs || 0);
  }


  function cacheResolvedAuthToken(token, source = "", fallbackExpiryMs = 0) {
    const normalizedToken = normalizeText(token || "");
    state.apiAutomation.authToken = normalizedToken;
    state.apiAutomation.authTokenSource = normalizeText(source || "");
    state.apiAutomation.authTokenExpiresAt = normalizedToken
      ? getTokenExpiryMs(normalizedToken, fallbackExpiryMs)
      : 0;
    return normalizedToken;
  }


  function isCachedAuthTokenUsable() {
    const token = normalizeText(state.apiAutomation.authToken || "");
    if (!token) {
      return false;
    }
    const expiresAt = Number(state.apiAutomation.authTokenExpiresAt || 0);
    if (!Number.isFinite(expiresAt) || expiresAt <= 0) {
      return true;
    }
    return Date.now() < (expiresAt - 30 * 1000);
  }


  function getRefreshTokenFromStorage() {
    try {
      return normalizeText(localStorage.getItem("autodarts_refresh_token") || "");
    } catch (_) {
      return "";
    }
  }


  function extractAuthTokenFromAuthorizationHeader(value) {
    const rawValue = normalizeText(value || "");
    if (!rawValue) {
      return "";
    }
    if (/^basic\s+/i.test(rawValue)) {
      return "";
    }
    if (/^[a-z-]+\s+/i.test(rawValue) && !/^bearer\s+/i.test(rawValue)) {
      return "";
    }
    return normalizeText(rawValue.replace(/^bearer\s+/i, ""));
  }


  function getHeaderValueCaseInsensitive(headers, name) {
    const target = normalizeText(name || "").toLowerCase();
    if (!target || !headers) {
      return "";
    }
    if (typeof Headers !== "undefined" && headers instanceof Headers) {
      return normalizeText(headers.get(target) || "");
    }
    if (Array.isArray(headers)) {
      for (let index = 0; index < headers.length; index += 1) {
        const entry = headers[index];
        if (!Array.isArray(entry) || entry.length < 2) {
          continue;
        }
        if (normalizeText(entry[0] || "").toLowerCase() === target) {
          return normalizeText(entry[1] || "");
        }
      }
      return "";
    }
    if (typeof headers === "object") {
      const keys = Object.keys(headers);
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        if (normalizeText(key || "").toLowerCase() === target) {
          return normalizeText(headers[key] || "");
        }
      }
    }
    return "";
  }


  function isApiProviderUrl(url) {
    const value = normalizeText(url || "");
    if (!value) {
      return false;
    }
    try {
      return normalizeText(new URL(value, location.href).host).toLowerCase() === API_PROVIDER;
    } catch (_) {
      return false;
    }
  }


  function captureAuthTokenFromAuthorizationHeader(value, source = "request-header") {
    const token = extractAuthTokenFromAuthorizationHeader(value);
    if (!token) {
      return "";
    }
    const previousToken = normalizeText(state.apiAutomation.authToken || "");
    const previousSource = normalizeText(state.apiAutomation.authTokenSource || "");
    const normalizedSource = normalizeText(source || "request-header");
    cacheResolvedAuthToken(token, normalizedSource);
    if (token !== previousToken || normalizedSource !== previousSource) {
      logDebug("api", "Auth token captured from runtime request header.", {
        source: normalizedSource,
        tokenLength: token.length,
      });
      refreshRuntimeStatusUi();
    }
    return token;
  }


  function captureAuthTokenFromRequestHeaders(headers, options = {}) {
    const requestUrl = normalizeText(options.requestUrl || "");
    if (requestUrl && !isApiProviderUrl(requestUrl)) {
      return "";
    }
    const authorizationHeader = getHeaderValueCaseInsensitive(headers, "authorization");
    if (!authorizationHeader) {
      return "";
    }
    return captureAuthTokenFromAuthorizationHeader(
      authorizationHeader,
      normalizeText(options.source || "request-header"),
    );
  }


  const AUTH_HEADER_CAPTURE_EVENT_NAME = "ata:auth-header-captured";
  const AUTH_HEADER_CAPTURE_DEFAULT_SOURCE = "request-header:bridge";
  const AUTH_HEADER_CAPTURE_PAGE_FLAG = "__ataAuthHeaderBridgeInstalled";


  function buildPageContextAuthHeaderBridgeScript() {
    return `
(() => {
  const EVENT_NAME = ${JSON.stringify(AUTH_HEADER_CAPTURE_EVENT_NAME)};
  const DEFAULT_SOURCE = ${JSON.stringify(AUTH_HEADER_CAPTURE_DEFAULT_SOURCE)};
  const PAGE_FLAG = ${JSON.stringify(AUTH_HEADER_CAPTURE_PAGE_FLAG)};
  const API_HOST = ${JSON.stringify(API_PROVIDER)};
  const META_KEY = "__ataAuthCaptureMeta";
  const normalize = (value) => String(value == null ? "" : value).trim();
  const extractToken = (value) => {
    const rawValue = normalize(value);
    if (!rawValue) {
      return "";
    }
    if (/^basic\\s+/i.test(rawValue)) {
      return "";
    }
    if (/^[a-z-]+\\s+/i.test(rawValue) && !/^bearer\\s+/i.test(rawValue)) {
      return "";
    }
    return normalize(rawValue.replace(/^bearer\\s+/i, ""));
  };
  const isApiUrl = (url) => {
    const value = normalize(url);
    if (!value) {
      return false;
    }
    try {
      return normalize(new URL(value, location.href).host).toLowerCase() === API_HOST;
    } catch (_) {
      return false;
    }
  };
  const readHeaderValue = (headers, name) => {
    const target = normalize(name).toLowerCase();
    if (!target || !headers) {
      return "";
    }
    if (typeof Headers !== "undefined" && headers instanceof Headers) {
      return normalize(headers.get(target) || "");
    }
    if (Array.isArray(headers)) {
      for (let index = 0; index < headers.length; index += 1) {
        const entry = headers[index];
        if (!Array.isArray(entry) || entry.length < 2) {
          continue;
        }
        if (normalize(entry[0] || "").toLowerCase() === target) {
          return normalize(entry[1] || "");
        }
      }
      return "";
    }
    if (typeof headers === "object") {
      const keys = Object.keys(headers);
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        if (normalize(key || "").toLowerCase() === target) {
          return normalize(headers[key] || "");
        }
      }
    }
    return "";
  };
  const emit = (authorizationHeader, source, requestUrl) => {
    const request = normalize(requestUrl);
    if (request && !isApiUrl(request)) {
      return;
    }
    const token = extractToken(authorizationHeader);
    if (!token) {
      return;
    }
    window.dispatchEvent(new CustomEvent(EVENT_NAME, {
      detail: {
        token,
        source: normalize(source || DEFAULT_SOURCE) || DEFAULT_SOURCE,
        requestUrl: request,
      },
    }));
  };

  try {
    if (window[PAGE_FLAG]) {
      return;
    }
    window[PAGE_FLAG] = true;

    const xhrPrototype = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
    if (xhrPrototype && typeof xhrPrototype.open === "function" && typeof xhrPrototype.setRequestHeader === "function") {
      const originalOpen = xhrPrototype.open;
      const originalSetRequestHeader = xhrPrototype.setRequestHeader;
      const originalSend = typeof xhrPrototype.send === "function" ? xhrPrototype.send : null;

      xhrPrototype.open = function ataAuthBridgeOpen(method, url) {
        this[META_KEY] = {
          requestUrl: normalize(url || ""),
          headers: {},
        };
        return originalOpen.apply(this, arguments);
      };

      xhrPrototype.setRequestHeader = function ataAuthBridgeSetRequestHeader(name, value) {
        try {
          const meta = this[META_KEY] || { requestUrl: "", headers: {} };
          const normalizedName = normalize(name || "").toLowerCase();
          meta.headers[normalizedName] = normalize(value || "");
          this[META_KEY] = meta;
          if (normalizedName === "authorization") {
            emit(meta.headers.authorization, "request-header:xhr", meta.requestUrl);
          }
        } catch (_) {
          // Ignore capture errors to avoid impacting host runtime.
        }
        return originalSetRequestHeader.apply(this, arguments);
      };

      if (originalSend) {
        xhrPrototype.send = function ataAuthBridgeSend() {
          try {
            const meta = this[META_KEY];
            emit(meta?.headers?.authorization || "", "request-header:xhr", meta?.requestUrl || "");
          } catch (_) {
            // Ignore capture errors to avoid impacting host runtime.
          }
          return originalSend.apply(this, arguments);
        };
      }
    }

    if (typeof window.fetch === "function") {
      const originalFetch = window.fetch;
      window.fetch = function ataAuthBridgeFetch(input, init) {
        try {
          const requestUrl = normalize(
            (typeof input === "string" ? input : (input?.url || ""))
            || (typeof init?.url === "string" ? init.url : ""),
          );
          emit(readHeaderValue(init?.headers, "authorization"), "request-header:fetch", requestUrl);
          if (input && typeof input === "object") {
            emit(readHeaderValue(input.headers, "authorization"), "request-header:fetch", requestUrl);
          }
        } catch (_) {
          // Ignore capture errors to avoid impacting host runtime.
        }
        return originalFetch.apply(this, arguments);
      };
    }
  } catch (_) {
    // Ignore bridge-install errors to avoid impacting host runtime.
  }
})();
`;
  }


  function installPageContextAuthHeaderCaptureBridge() {
    try {
      if (window[AUTH_HEADER_CAPTURE_PAGE_FLAG]) {
        return true;
      }
      const root = document.documentElement || document.head || document.body;
      if (!root) {
        return false;
      }
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.textContent = buildPageContextAuthHeaderBridgeScript();
      root.appendChild(script);
      script.remove();
      return Boolean(window[AUTH_HEADER_CAPTURE_PAGE_FLAG]);
    } catch (error) {
      logWarn("api", "Page-context auth header bridge installation failed.", error);
      return false;
    }
  }


  function installRuntimeAuthHeaderCapture() {
    if (!state.apiAutomation.authHeaderCaptureInstalled) {
      state.apiAutomation.authHeaderCaptureInstalled = true;

      const bridgeEventListener = (event) => {
        try {
          const detail = event?.detail && typeof event.detail === "object"
            ? event.detail
            : {};
          const requestUrl = normalizeText(detail.requestUrl || "");
          if (requestUrl && !isApiProviderUrl(requestUrl)) {
            return;
          }
          const source = normalizeText(detail.source || AUTH_HEADER_CAPTURE_DEFAULT_SOURCE)
            || AUTH_HEADER_CAPTURE_DEFAULT_SOURCE;
          const authorizationValue = normalizeText(detail.token || detail.authorization || "");
          if (!authorizationValue) {
            return;
          }
          captureAuthTokenFromAuthorizationHeader(authorizationValue, source);
        } catch (error) {
          logWarn("api", "Auth header capture bridge event handling failed.", error);
        }
      };

      window.addEventListener(AUTH_HEADER_CAPTURE_EVENT_NAME, bridgeEventListener, true);
      addCleanup(() => {
        window.removeEventListener(AUTH_HEADER_CAPTURE_EVENT_NAME, bridgeEventListener, true);
      });
    }
    if (!state.apiAutomation.authHeaderBridgeInjected) {
      state.apiAutomation.authHeaderBridgeInjected = installPageContextAuthHeaderCaptureBridge();
    }
  }


  function getAuthStateSnapshot() {
    installRuntimeAuthHeaderCapture();
    const cookieToken = getAuthTokenFromCookie();
    const refreshToken = getRefreshTokenFromStorage();
    const cachedToken = normalizeText(state.apiAutomation.authToken || "");
    const hasCookieToken = Boolean(cookieToken);
    const hasRefreshToken = Boolean(refreshToken);
    const hasCachedToken = Boolean(cachedToken);
    return {
      hasCookieToken,
      hasRefreshToken,
      hasCachedToken,
      hasAnyAuthContext: hasCookieToken || hasRefreshToken || hasCachedToken,
      cookieTokenLength: cookieToken.length,
      refreshTokenLength: refreshToken.length,
      cachedTokenLength: cachedToken.length,
      cachedTokenUsable: isCachedAuthTokenUsable(),
      source: hasCookieToken
        ? "cookie"
        : (hasCachedToken ? "cache" : (hasRefreshToken ? "refresh-token" : "none")),
    };
  }


  async function refreshAuthTokenFromStorageToken(refreshToken) {
    const payload = {
      refresh_token: normalizeText(refreshToken || ""),
      client_id: API_AUTH_CLIENT_ID,
    };
    const response = await fetch(`${API_AUTH_BASE}/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      credentials: "omit",
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    const body = parseJsonOrText(text);
    if (!response.ok) {
      throw createApiError(response.status, extractApiErrorMessage(response.status, body), body);
    }
    return body || {};
  }


  async function resolveAuthToken(options = {}) {
    installRuntimeAuthHeaderCapture();
    const forceRefresh = Boolean(options.forceRefresh);
    const cookieToken = getAuthTokenFromCookie();
    if (cookieToken && !forceRefresh) {
      return cacheResolvedAuthToken(cookieToken, "cookie");
    }

    if (!forceRefresh && isCachedAuthTokenUsable()) {
      state.apiAutomation.authTokenSource = state.apiAutomation.authTokenSource || "cache";
      return normalizeText(state.apiAutomation.authToken || "");
    }

    const refreshToken = getRefreshTokenFromStorage();
    if (!refreshToken) {
      cacheResolvedAuthToken("", "");
      return "";
    }

    if (!forceRefresh && state.apiAutomation.authRefreshPromise) {
      try {
        return await state.apiAutomation.authRefreshPromise;
      } catch (_) {
        return "";
      }
    }

    state.apiAutomation.authRefreshPromise = (async () => {
      try {
        const refreshed = await refreshAuthTokenFromStorageToken(refreshToken);
        const accessToken = normalizeText(refreshed?.access_token || "");
        if (!accessToken) {
          cacheResolvedAuthToken("", "");
          return "";
        }
        const nextRefreshToken = normalizeText(refreshed?.refresh_token || "");
        if (nextRefreshToken && nextRefreshToken !== refreshToken) {
          try {
            localStorage.setItem("autodarts_refresh_token", nextRefreshToken);
          } catch (_) {
            // Ignore storage write failures.
          }
        }
        const expiresInMs = Math.max(0, Number(refreshed?.expires_in || 0)) * 1000;
        return cacheResolvedAuthToken(accessToken, "refresh", Date.now() + expiresInMs);
      } catch (error) {
        logWarn("api", "Auth token refresh via refresh_token failed.", error);
        cacheResolvedAuthToken("", "");
        return "";
      } finally {
        state.apiAutomation.authRefreshPromise = null;
      }
    })();

    return state.apiAutomation.authRefreshPromise;
  }


  function getBoardId() {
    try {
      const rawBoardValue = localStorage.getItem("autodarts-board");
      if (!rawBoardValue) {
        return "";
      }
      let boardId = rawBoardValue;
      try {
        const parsed = JSON.parse(rawBoardValue);
        if (typeof parsed === "string") {
          boardId = parsed;
        } else if (parsed && typeof parsed === "object") {
          boardId = normalizeText(parsed.id || parsed.boardId || parsed.uuid || parsed.value || "");
        }
      } catch (_) {
        // Keep raw value when localStorage entry is not JSON encoded.
      }
      return normalizeText(String(boardId || "").replace(/^"+|"+$/g, ""));
    } catch (_) {
      return "";
    }
  }


  function isValidBoardId(boardId) {
    const value = normalizeText(boardId || "");
    if (!value) {
      return false;
    }
    if (value === "[object Object]" || value.toLowerCase() === "manual") {
      return false;
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return true;
    }
    return /^[a-z0-9][a-z0-9-]{7,}$/i.test(value);
  }


  function collectRuntimeStatus() {
    const authState = getAuthStateSnapshot();
    const boardId = getBoardId();
    const boardPreview = boardId.length > 18 ? `${boardId.slice(0, 7)}...${boardId.slice(-6)}` : boardId;
    const autoEnabled = Boolean(state.store?.settings?.featureFlags?.autoLobbyStart);
    const authBlocked = Number(state.apiAutomation?.authBackoffUntil || 0) > Date.now();
    const hasToken = authState.hasAnyAuthContext;
    const hasBoard = isValidBoardId(boardId);
    const hasBoardValue = Boolean(boardId);
    return {
      hasToken,
      hasBoard,
      boardId: boardId || "",
      autoEnabled,
      authBlocked,
      apiLabel: hasToken ? (authBlocked ? "API Auth abgelaufen" : "API Auth bereit") : "API Auth fehlt",
      boardLabel: hasBoard
        ? `Board aktiv (${boardPreview})`
        : hasBoardValue
          ? `Board-ID ung\u00fcltig (${boardPreview})`
          : "Kein aktives Board",
      autoLabel: autoEnabled ? "Auto-Lobby ON" : "Auto-Lobby OFF",
    };
  }


  function renderRuntimeStatusBar() {
    const status = collectRuntimeStatus();
    const apiStateClass = status.hasToken && !status.authBlocked ? "ata-status-ok" : "ata-status-warn";
    const boardStateClass = status.hasBoard ? "ata-status-ok" : "ata-status-warn";
    const autoStateClass = status.autoEnabled ? "ata-status-info" : "ata-status-neutral";
    const hint = status.autoEnabled && (!status.hasToken || !status.hasBoard)
      ? renderDocLinkableMessage("Hinweis: F\u00fcr API-Halbautomatik werden Auth-Token und aktives Board ben\u00f6tigt.", {
        tagName: "span",
        className: "ata-runtime-hint",
      })
      : "";
    return `
      <div class="ata-runtime-statusbar">
        ${renderDocLinkableMessage(status.apiLabel, {
          tagName: "span",
          className: `ata-status-pill ${apiStateClass}`,
        })}
        ${renderDocLinkableMessage(status.boardLabel, {
          tagName: "span",
          className: `ata-status-pill ${boardStateClass}`,
        })}
        ${renderDocLinkableMessage(status.autoLabel, {
          tagName: "span",
          className: `ata-status-pill ${autoStateClass}`,
        })}
        ${hint}
      </div>
    `;
  }


  function runtimeStatusSignature() {
    const status = collectRuntimeStatus();
    return [
      status.hasToken ? "1" : "0",
      status.authBlocked ? "1" : "0",
      status.boardId || "",
      status.autoEnabled ? "1" : "0",
    ].join("|");
  }


  function refreshRuntimeStatusUi() {
    const signature = runtimeStatusSignature();
    if (signature === state.runtimeStatusSignature) {
      return;
    }
    state.runtimeStatusSignature = signature;
    if (state.drawerOpen) {
      renderShell();
    }
  }


  function createApiError(status, message, body) {
    const error = new Error(String(message || "API request failed."));
    error.status = Number(status || 0);
    error.body = body;
    return error;
  }


  function apiBodyToErrorText(value, depth = 0) {
    if (value == null || depth > 3) {
      return "";
    }
    if (typeof value === "string") {
      return normalizeText(value);
    }
    if (Array.isArray(value)) {
      const parts = value.map((entry) => apiBodyToErrorText(entry, depth + 1)).filter(Boolean);
      return normalizeText(parts.join(" | "));
    }
    if (typeof value === "object") {
      const parts = [];
      ["message", "error", "detail", "title", "reason", "description"].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const text = apiBodyToErrorText(value[key], depth + 1);
          if (text) {
            parts.push(text);
          }
        }
      });
      if (value.errors && typeof value.errors === "object") {
        Object.entries(value.errors).forEach(([key, entry]) => {
          const text = apiBodyToErrorText(entry, depth + 1);
          if (text) {
            parts.push(`${key}: ${text}`);
          }
        });
      }
      const deduped = [...new Set(parts.map((entry) => normalizeText(entry)).filter(Boolean))];
      if (deduped.length) {
        return normalizeText(deduped.join(" | "));
      }
      try {
        const json = JSON.stringify(value);
        if (json && json !== "{}") {
          return normalizeText(json);
        }
      } catch (_) {
        return "";
      }
      return "";
    }
    return normalizeText(String(value));
  }


  function extractApiErrorMessage(status, body) {
    const detail = apiBodyToErrorText(body);
    if (detail) {
      return `HTTP ${status}: ${detail}`;
    }
    return `HTTP ${status}`;
  }


  function parseJsonOrText(rawText) {
    const text = String(rawText || "");
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch (_) {
      return text;
    }
  }


  async function requestJsonViaGm(method, url, payload, headers) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method,
        url,
        timeout: API_REQUEST_TIMEOUT_MS,
        headers,
        data: payload ? JSON.stringify(payload) : undefined,
        onload: (response) => {
          const status = Number(response?.status || 0);
          const body = parseJsonOrText(response?.responseText || "");
          if (status >= 200 && status < 300) {
            resolve(body || {});
            return;
          }
          reject(createApiError(status, extractApiErrorMessage(status, body), body));
        },
        onerror: () => {
          reject(createApiError(0, "Netzwerkfehler bei API-Anfrage.", null));
        },
        ontimeout: () => {
          reject(createApiError(0, "API-Anfrage Timeout.", null));
        },
      });
    });
  }


  async function requestJsonViaFetch(method, url, payload, headers) {
    const response = await fetch(url, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
      cache: "no-store",
      credentials: "omit",
    });
    const text = await response.text();
    const body = parseJsonOrText(text);
    if (!response.ok) {
      throw createApiError(response.status, extractApiErrorMessage(response.status, body), body);
    }
    return body || {};
  }


  async function apiRequestJson(method, url, payload, token) {
    const headers = { Accept: "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (payload) {
      headers["Content-Type"] = "application/json";
    }

    if (typeof GM_xmlhttpRequest === "function") {
      try {
        return await requestJsonViaGm(method, url, payload, headers);
      } catch (error) {
        const status = Number(error?.status || 0);
        if (status > 0) {
          throw error;
        }
        logWarn("api", "GM_xmlhttpRequest failed, falling back to fetch().", error);
      }
    }

    return requestJsonViaFetch(method, url, payload, headers);
  }


  async function createLobby(payload, token) {
    return apiRequestJson("POST", `${API_GS_BASE}/lobbies`, payload, token);
  }


  async function deleteLobby(lobbyId, token) {
    return apiRequestJson("DELETE", `${API_GS_BASE}/lobbies/${encodeURIComponent(lobbyId)}`, null, token);
  }


  async function addLobbyPlayer(lobbyId, name, boardId, token) {
    return apiRequestJson("POST", `${API_GS_BASE}/lobbies/${encodeURIComponent(lobbyId)}/players`, { name, boardId }, token);
  }


  async function startLobby(lobbyId, token) {
    return apiRequestJson("POST", `${API_GS_BASE}/lobbies/${encodeURIComponent(lobbyId)}/start`, null, token);
  }


  async function fetchMatchStats(lobbyId, token) {
    return apiRequestJson("GET", `${API_AS_BASE}/matches/${encodeURIComponent(lobbyId)}/stats`, null, token);
  }


  function getRouteLobbyId(pathname = location.pathname) {
    const route = normalizeText(pathname || "");
    if (!route) {
      return "";
    }
    const match = route.match(/^\/(?:(?:history\/)?(?:matches|lobbies))\/([^/?#]+)/i);
    if (!match || !match[1]) {
      return "";
    }
    try {
      return normalizeText(decodeURIComponent(match[1]));
    } catch (_) {
      return normalizeText(match[1]);
    }
  }


  function isApiSyncCandidateMatch(match, includeErrored = false) {
    if (!match || match.status !== STATUS_PENDING) {
      return false;
    }
    const auto = ensureMatchAutoMeta(match);
    if (!auto.lobbyId) {
      return false;
    }
    if (auto.status === "started") {
      return true;
    }
    return includeErrored && auto.status === "error";
  }


  installRuntimeAuthHeaderCapture();


  function findTournamentMatchByLobbyId(tournament, lobbyId, includeCompleted = false) {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!tournament || !targetLobbyId) {
      return null;
    }
    return tournament.matches.find((match) => {
      if (!includeCompleted && match.status !== STATUS_PENDING) {
        return false;
      }
      const auto = ensureMatchAutoMeta(match);
      return normalizeText(auto.lobbyId || "") === targetLobbyId;
    }) || null;
  }


