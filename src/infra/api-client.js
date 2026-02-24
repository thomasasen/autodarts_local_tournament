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
    const token = getAuthTokenFromCookie();
    const boardId = getBoardId();
    const boardPreview = boardId.length > 18 ? `${boardId.slice(0, 7)}...${boardId.slice(-6)}` : boardId;
    const autoEnabled = Boolean(state.store?.settings?.featureFlags?.autoLobbyStart);
    const authBlocked = Number(state.apiAutomation?.authBackoffUntil || 0) > Date.now();
    const hasToken = Boolean(token);
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
      ? `<span class="ata-runtime-hint">Hinweis: F\u00fcr API-Halbautomatik werden Auth-Token und aktives Board ben\u00f6tigt.</span>`
      : "";
    return `
      <div class="ata-runtime-statusbar">
        <span class="ata-status-pill ${apiStateClass}">${escapeHtml(status.apiLabel)}</span>
        <span class="ata-status-pill ${boardStateClass}">${escapeHtml(status.boardLabel)}</span>
        <span class="ata-status-pill ${autoStateClass}">${escapeHtml(status.autoLabel)}</span>
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


