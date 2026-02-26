// Auto-generated module split from dist source.
  function playerLookupMap(tournament) {
    const map = new Map();
    tournament.participants.forEach((participant) => {
      map.set(normalizeLookup(participant.name), participant.id);
    });
    return map;
  }


  function extractNameCandidatesFromDom(tournament) {
    const map = playerLookupMap(tournament);
    const counts = new Map();
    const selectors = [
      '[data-testid*="player"]',
      '[data-testid*="name"]',
      '[class*="player"]',
      '[class*="name"]',
      '[class*="scoreboard"]',
    ];

    selectors.forEach((selector) => {
      const nodes = Array.from(document.querySelectorAll(selector)).slice(0, 140);
      nodes.forEach((node) => {
        const text = normalizeText(node.textContent);
        if (!text || text.length > 80) {
          return;
        }
        const lookup = normalizeLookup(text);
        map.forEach((participantId, key) => {
          if (lookup === key || lookup.includes(key)) {
            counts.set(participantId, (counts.get(participantId) || 0) + 1);
          }
        });
      });
    });

    const sorted = [...counts.entries()].sort((left, right) => right[1] - left[1]);
    return sorted.slice(0, 4).map((entry) => entry[0]);
  }


  function extractWinnerFromDom(tournament) {
    const map = playerLookupMap(tournament);
    const selectors = [
      '[class*="winner"]',
      '[data-testid*="winner"]',
      '[aria-label*="winner"]',
      '[aria-label*="Winner"]',
    ];

    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector)).slice(0, 80);
      for (const node of nodes) {
        const text = normalizeLookup(node.textContent || node.getAttribute("aria-label") || "");
        if (!text) {
          continue;
        }
        for (const [nameKey, participantId] of map.entries()) {
          if (text.includes(nameKey)) {
            return participantId;
          }
        }
      }
    }

    const fullText = normalizeText(document.body?.innerText || "");
    const winnerLine = fullText.match(/(?:winner|gewinner)\s*[:\-]\s*([^\n\r]+)/i);
    if (winnerLine) {
      const candidate = normalizeLookup(winnerLine[1]);
      for (const [nameKey, participantId] of map.entries()) {
        if (candidate.includes(nameKey)) {
          return participantId;
        }
      }
    }

    return null;
  }


  function extractLegScoreFromDom(bestOfLegs) {
    const neededWins = getLegsToWin(bestOfLegs);
    const selectors = ['[class*="legs"]', '[data-testid*="legs"]', '[class*="score"]', '[class*="result"]'];
    let fallback = { p1: 0, p2: 0 };

    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector)).slice(0, 120);
      for (const node of nodes) {
        const text = normalizeText(node.textContent);
        if (!text || text.length > 20) {
          continue;
        }
        const match = text.match(/^(\d{1,2})\s*[:\-]\s*(\d{1,2})$/);
        if (!match) {
          continue;
        }
        const p1 = clampInt(match[1], 0, 0, 50);
        const p2 = clampInt(match[2], 0, 0, 50);
        fallback = { p1, p2 };
        if (p1 === neededWins || p2 === neededWins) {
          return fallback;
        }
      }
    }
    return fallback;
  }


  function scanForAutoResult() {
    const tournament = state.store.tournament;
    if (!tournament) {
      return;
    }
    const now = Date.now();
    if (now - state.autoDetect.lastScanAt < 900) {
      return;
    }
    state.autoDetect.lastScanAt = now;

    const winnerId = extractWinnerFromDom(tournament);
    if (!winnerId) {
      return;
    }

    const nameCandidates = extractNameCandidatesFromDom(tournament);
    const candidateIds = nameCandidates.filter((id, index, array) => array.indexOf(id) === index).slice(0, 3);
    if (!candidateIds.length) {
      return;
    }

    let targetMatch = null;
    for (let i = 0; i < candidateIds.length; i += 1) {
      for (let j = i + 1; j < candidateIds.length; j += 1) {
        const match = getOpenMatchByPlayers(tournament, candidateIds[i], candidateIds[j]);
        if (match && (winnerId === candidateIds[i] || winnerId === candidateIds[j])) {
          if (targetMatch) {
            logDebug("autodetect", "Multiple possible matches found, skipping auto close.");
            return;
          }
          targetMatch = match;
        }
      }
    }

    if (!targetMatch) {
      const openWithWinner = tournament.matches.filter((match) => (
        match.status === STATUS_PENDING
        && match.player1Id
        && match.player2Id
        && (match.player1Id === winnerId || match.player2Id === winnerId)
      ));
      if (openWithWinner.length === 1) {
        targetMatch = openWithWinner[0];
      }
    }

    if (!targetMatch) {
      return;
    }

    const legs = extractLegScoreFromDom(tournament.bestOfLegs);
    const fingerprint = `${targetMatch.id}|${winnerId}|${legs.p1}:${legs.p2}|${location.pathname}`;
    if (state.autoDetect.lastFingerprint === fingerprint) {
      return;
    }
    state.autoDetect.lastFingerprint = fingerprint;

    const result = updateMatchResult(targetMatch.id, winnerId, legs, "auto");
    if (result.ok) {
      setNotice("info", `Auto-Ergebnis erkannt: ${participantNameById(tournament, winnerId)} (${targetMatch.id})`, 2600);
      logDebug("autodetect", "Auto result applied.", { matchId: targetMatch.id, winnerId, legs });
    }
  }


  function queueAutoScan() {
    if (state.autoDetect.queued) {
      return;
    }
    state.autoDetect.queued = true;
    requestAnimationFrame(() => {
      state.autoDetect.queued = false;
      scanForAutoResult();
    });
  }


  function startAutoDetectionObserver() {
    if (state.autoDetect.observer) {
      state.autoDetect.observer.disconnect();
      state.autoDetect.observer = null;
    }

    const root = document.body || document.documentElement;
    if (!root) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      const relevant = mutations.some((mutation) => mutation.type === "childList" || mutation.type === "characterData");
      if (relevant) {
        queueAutoScan();
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    state.autoDetect.observer = observer;
    addObserver(observer);
  }


  function removeMatchReturnShortcut() {
    if (state.matchReturnShortcut.root instanceof HTMLElement) {
      state.matchReturnShortcut.root.remove();
    }
    state.matchReturnShortcut.root = null;
    state.matchReturnShortcut.syncing = false;
    state.matchReturnShortcut.inlineSyncingByLobby = {};
  }


  function removeHistoryImportButton() {
    const nodes = Array.from(document.querySelectorAll("[data-ata-history-import-root='1']"));
    nodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        node.remove();
      }
    });
  }


  function isHistoryMatchRoute(pathname = location.pathname) {
    return /^\/history\/matches\/[^/?#]+/i.test(normalizeText(pathname || ""));
  }


  function getHistoryRouteLobbyId(pathname = location.pathname) {
    if (!isHistoryMatchRoute(pathname)) {
      return "";
    }
    return getRouteLobbyId(pathname);
  }


  function isLobbySyncing(lobbyId) {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!targetLobbyId) {
      return false;
    }
    const map = state.matchReturnShortcut.inlineSyncingByLobby || {};
    return Boolean(map[targetLobbyId]);
  }


  function setLobbySyncing(lobbyId, syncing) {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!targetLobbyId) {
      return;
    }
    if (!state.matchReturnShortcut.inlineSyncingByLobby || typeof state.matchReturnShortcut.inlineSyncingByLobby !== "object") {
      state.matchReturnShortcut.inlineSyncingByLobby = {};
    }
    if (syncing) {
      state.matchReturnShortcut.inlineSyncingByLobby[targetLobbyId] = true;
    } else {
      delete state.matchReturnShortcut.inlineSyncingByLobby[targetLobbyId];
    }
    state.matchReturnShortcut.syncing = Object.keys(state.matchReturnShortcut.inlineSyncingByLobby).length > 0;
  }


  function cleanupStaleHistoryImportButtons(activeLobbyId = "") {
    const nodes = Array.from(document.querySelectorAll("[data-ata-history-import-root='1']"));
    nodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      const nodeLobbyId = normalizeText(node.getAttribute("data-lobby-id") || "");
      if (!activeLobbyId || nodeLobbyId !== activeLobbyId) {
        node.remove();
      }
    });
  }


  function findHistoryImportHost(lobbyId) {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!targetLobbyId) {
      return null;
    }
    const routeLinks = Array.from(document.querySelectorAll(`a[href^="/history/matches/${targetLobbyId}"]`));
    const links = routeLinks.filter((link) => link instanceof HTMLAnchorElement);
    for (const link of links) {
      const card = link.closest(".chakra-card, [class*='chakra-card'], article, section, [class*='card']");
      if (!(card instanceof HTMLElement)) {
        continue;
      }
      const table = card.querySelector("table");
      if (table instanceof HTMLElement) {
        return { card, table };
      }
      return { card, table: null };
    }

    const firstTable = document.querySelector("table");
    if (firstTable instanceof HTMLElement) {
      const card = firstTable.closest(".chakra-card, [class*='chakra-card'], article, section, [class*='card']");
      if (card instanceof HTMLElement) {
        return { card, table: firstTable };
      }
      if (firstTable.parentElement instanceof HTMLElement) {
        return { card: firstTable.parentElement, table: firstTable };
      }
    }

    return null;
  }


  function ensureHistoryImportRoot(host, lobbyId) {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!(host instanceof HTMLElement) || !targetLobbyId) {
      return null;
    }
    let root = host.querySelector(`[data-ata-history-import-root='1'][data-lobby-id='${targetLobbyId}']`);
    if (root instanceof HTMLElement) {
      return root;
    }
    root = document.createElement("div");
    root.setAttribute("data-ata-history-import-root", "1");
    root.setAttribute("data-lobby-id", targetLobbyId);
    if (host.firstChild) {
      host.insertBefore(root, host.firstChild);
    } else {
      host.appendChild(root);
    }
    return root;
  }


  function renderHistoryImportButton() {
    const lobbyId = getHistoryRouteLobbyId();
    if (!lobbyId) {
      removeHistoryImportButton();
      return;
    }

    const tournament = state.store.tournament;
    if (!tournament) {
      removeHistoryImportButton();
      return;
    }

    const hostInfo = findHistoryImportHost(lobbyId);
    if (!hostInfo?.card) {
      removeHistoryImportButton();
      return;
    }

    cleanupStaleHistoryImportButtons(lobbyId);
    const root = ensureHistoryImportRoot(hostInfo.card, lobbyId);
    if (!(root instanceof HTMLElement)) {
      return;
    }

    if (hostInfo.table instanceof HTMLElement && root.nextSibling !== hostInfo.table) {
      hostInfo.card.insertBefore(root, hostInfo.table);
    }

    const linkedMatchAny = findTournamentMatchByLobbyId(tournament, lobbyId, true);
    const auto = linkedMatchAny ? ensureMatchAutoMeta(linkedMatchAny) : null;
    const autoEnabled = Boolean(state.store.settings.featureFlags.autoLobbyStart);
    const isSyncing = isLobbySyncing(lobbyId);
    const isAlreadyCompleted = linkedMatchAny?.status === STATUS_COMPLETED;

    let statusText = "";
    if (!autoEnabled) {
      statusText = "Auto-Lobby ist deaktiviert. Aktivieren Sie die Funktion im Tab Einstellungen.";
    } else if (isAlreadyCompleted) {
      statusText = "Ergebnis bereits im Turnier gespeichert.";
    } else if (linkedMatchAny && auto?.status === "error") {
      statusText = `Letzter Sync-Fehler: ${normalizeText(auto.lastError || "Unbekannt") || "Unbekannt"}`;
    } else if (linkedMatchAny && auto?.status === "started") {
      statusText = "Match verknüpft. Ergebnis kann übernommen werden.";
    } else {
      statusText = "Kein direkt verknüpftes Match gefunden. Ergebnisübernahme versucht API-Zuordnung über Stats.";
    }

    const primaryLabel = isAlreadyCompleted
      ? "Turnierassistent öffnen"
      : (isSyncing ? "\u00dcbernehme..." : "Ergebnis \u00fcbernehmen & Turnier \u00f6ffnen");
    const disabledAttr = isSyncing || !autoEnabled ? "disabled" : "";

    root.innerHTML = `
      <div style="margin:8px 0 10px 0;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.22);background:linear-gradient(180deg, rgba(44,50,109,0.85), rgba(31,63,113,0.85));color:#f4f7ff;">
        <div style="font-size:12px;line-height:1.35;color:rgba(232,237,255,0.86);margin-bottom:8px;">${escapeHtml(statusText)}</div>
        <button type="button" data-action="ata-history-sync" style="border:1px solid rgba(90,210,153,0.55);background:rgba(90,210,153,0.24);color:#dcffe8;border-radius:8px;padding:8px 10px;font-size:13px;font-weight:700;cursor:pointer;" ${disabledAttr}>${escapeHtml(primaryLabel)}</button>
      </div>
    `;

    const syncButton = root.querySelector("[data-action='ata-history-sync']");
    if (syncButton instanceof HTMLButtonElement) {
      if (!autoEnabled || isSyncing) {
        syncButton.onclick = null;
      } else if (isAlreadyCompleted) {
        syncButton.onclick = () => {
          openAssistantMatchesTab();
        };
      } else {
        syncButton.onclick = () => {
          handleHistoryImportClick(lobbyId).catch((error) => {
            logWarn("api", "Inline history import action failed.", error);
          });
        };
      }
    }
  }


  function ensureMatchReturnShortcutRoot() {
    if (state.matchReturnShortcut.root instanceof HTMLElement && document.body?.contains(state.matchReturnShortcut.root)) {
      return state.matchReturnShortcut.root;
    }
    const root = document.createElement("div");
    root.id = "ata-match-return-shortcut";
    root.style.position = "fixed";
    root.style.right = "18px";
    root.style.bottom = "18px";
    root.style.zIndex = "2147482990";
    root.style.minWidth = "280px";
    root.style.maxWidth = "340px";
    root.style.borderRadius = "10px";
    root.style.border = "1px solid rgba(255,255,255,0.25)";
    root.style.background = "linear-gradient(180deg, rgba(44,50,109,0.94), rgba(31,63,113,0.94))";
    root.style.color = "#f4f7ff";
    root.style.padding = "10px";
    root.style.boxShadow = "0 12px 24px rgba(7,11,25,0.45)";
    root.style.fontFamily = "\"Open Sans\", \"Segoe UI\", Tahoma, sans-serif";
    document.body.appendChild(root);
    state.matchReturnShortcut.root = root;
    return root;
  }


  function openAssistantMatchesTab() {
    state.activeTab = "matches";
    state.store.ui.activeTab = "matches";
    schedulePersist();
    if (state.drawerOpen) {
      renderShell();
      return;
    }
    openDrawer();
  }


  async function handleLobbySyncAndOpen(lobbyId, trigger = "manual") {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!targetLobbyId || isLobbySyncing(targetLobbyId)) {
      return;
    }
    setLobbySyncing(targetLobbyId, true);
    renderMatchReturnShortcut();
    renderHistoryImportButton();
    try {
      const syncOutcome = await syncResultForLobbyId(targetLobbyId, {
        notifyErrors: true,
        notifyNotReady: true,
        trigger,
      });
      if (syncOutcome.reasonCode === "completed" || syncOutcome.completed) {
        openAssistantMatchesTab();
        const alreadyStored = normalizeText(syncOutcome.message || "").includes("bereits");
        if (alreadyStored) {
          setNotice("info", syncOutcome.message || "Ergebnis war bereits im Turnier gespeichert.", 2600);
        } else {
          setNotice("success", "Ergebnis wurde in xLokale Turniere \u00fcbernommen.", 2400);
        }
      } else if (!syncOutcome.ok && syncOutcome.message) {
        const noticeType = syncOutcome.reasonCode === "ambiguous" ? "error" : "info";
        setNotice(noticeType, syncOutcome.message, 3200);
      } else if (syncOutcome.ok && !syncOutcome.completed) {
        setNotice("info", "Noch kein finales Ergebnis verf\u00fcgbar. Match l\u00e4uft ggf. noch.", 2600);
      }
    } catch (error) {
      logWarn("api", "Manual shortcut sync failed.", error);
      setNotice("error", "Ergebnis\u00fcbernahme fehlgeschlagen. Bitte sp\u00e4ter erneut versuchen.");
    } finally {
      setLobbySyncing(targetLobbyId, false);
      renderMatchReturnShortcut();
      renderHistoryImportButton();
    }
  }


  async function handleMatchShortcutSyncAndOpen(lobbyId) {
    return handleLobbySyncAndOpen(lobbyId, "floating-shortcut");
  }


  async function handleHistoryImportClick(lobbyId) {
    return handleLobbySyncAndOpen(lobbyId, "inline-history");
  }


  function renderMatchReturnShortcut() {
    const lobbyId = getRouteLobbyId();
    if (!lobbyId) {
      removeMatchReturnShortcut();
      return;
    }

    const tournament = state.store.tournament;
    if (!tournament) {
      removeMatchReturnShortcut();
      return;
    }

    const linkedMatchAny = findTournamentMatchByLobbyId(tournament, lobbyId, true);
    const linkedMatchOpen = linkedMatchAny?.status === STATUS_PENDING ? linkedMatchAny : null;
    const auto = linkedMatchAny ? ensureMatchAutoMeta(linkedMatchAny) : null;
    const root = ensureMatchReturnShortcutRoot();
    const isSyncing = isLobbySyncing(lobbyId);
    const autoEnabled = Boolean(state.store.settings.featureFlags.autoLobbyStart);
    const isAlreadyCompleted = linkedMatchAny?.status === STATUS_COMPLETED;
    const hasOpenMatch = Boolean(linkedMatchOpen || !linkedMatchAny);

    const statusText = !autoEnabled
      ? "Auto-Lobby ist deaktiviert. Aktivieren Sie die Funktion im Tab Einstellungen."
      : isAlreadyCompleted
        ? "Ergebnis bereits im Turnier gespeichert."
        : linkedMatchAny && auto?.status === "error"
          ? `Letzter Sync-Fehler: ${normalizeText(auto.lastError || "Unbekannt") || "Unbekannt"}`
          : linkedMatchAny && auto?.status === "started"
            ? "Match verkn\u00fcpft. Ergebnis kann \u00fcbernommen werden."
            : "Kein direkt verkn\u00fcpftes Match gefunden. Ergebnis\u00fcbernahme versucht API-Zuordnung.";

    const primaryLabel = isAlreadyCompleted
      ? "Turnierassistent \u00f6ffnen"
      : hasOpenMatch
        ? (isSyncing ? "\u00dcbernehme..." : "Ergebnis \u00fcbernehmen & Turnier \u00f6ffnen")
        : "Turnierassistent \u00f6ffnen";
    const canSync = autoEnabled && !isAlreadyCompleted && hasOpenMatch;

    const secondaryButtonHtml = canSync
      ? `<button type="button" data-action="open-assistant" style="flex:1 1 auto;border:1px solid rgba(255,255,255,0.28);background:rgba(255,255,255,0.1);color:#f4f7ff;border-radius:8px;padding:8px 10px;font-size:13px;cursor:pointer;">Nur Turnierassistent</button>`
      : "";

    root.innerHTML = `
      <div style="font-size:13px;font-weight:700;letter-spacing:0.3px;margin-bottom:6px;">xLokale Turniere</div>
      <div style="font-size:12px;line-height:1.35;color:rgba(232,237,255,0.86);margin-bottom:8px;">${escapeHtml(statusText)}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" data-action="sync-open" style="flex:1 1 auto;border:1px solid rgba(90,210,153,0.55);background:rgba(90,210,153,0.24);color:#dcffe8;border-radius:8px;padding:8px 10px;font-size:13px;font-weight:700;cursor:pointer;" ${(isSyncing || !autoEnabled) ? "disabled" : ""}>${escapeHtml(primaryLabel)}</button>
        ${secondaryButtonHtml}
      </div>
    `;

    const syncButton = root.querySelector("[data-action='sync-open']");
    if (syncButton instanceof HTMLButtonElement) {
      if (canSync) {
        syncButton.onclick = () => {
          handleMatchShortcutSyncAndOpen(lobbyId).catch((error) => {
            logWarn("api", "Shortcut action failed.", error);
          });
        };
      } else {
        syncButton.onclick = () => {
          openAssistantMatchesTab();
        };
      }
    }

    const openAssistantButton = root.querySelector("[data-action='open-assistant']");
    if (openAssistantButton instanceof HTMLButtonElement) {
      openAssistantButton.onclick = () => {
        openAssistantMatchesTab();
      };
    }
  }


  function cleanupRuntime() {
    if (state.saveTimer) {
      clearTimeout(state.saveTimer);
      state.saveTimer = null;
    }
    if (state.noticeTimer) {
      clearTimeout(state.noticeTimer);
      state.noticeTimer = null;
    }
    if (state.bracket.timeoutHandle) {
      clearTimeout(state.bracket.timeoutHandle);
      state.bracket.timeoutHandle = null;
    }
    removeMatchReturnShortcut();
    removeHistoryImportButton();
    while (state.cleanupStack.length) {
      const cleanup = state.cleanupStack.pop();
      try {
        cleanup();
      } catch (error) {
        logWarn("lifecycle", "Cleanup function failed.", error);
      }
    }
  }


  function initEventBridge() {
    addListener(window, TOGGLE_EVENT, () => {
      toggleDrawer();
    });
    addListener(window, "message", handleBracketMessage);
    addListener(window, "pagehide", cleanupRuntime, { once: true });
    addListener(window, "beforeunload", cleanupRuntime, { once: true });
  }


