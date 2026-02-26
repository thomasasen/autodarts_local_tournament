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
    state.matchReturnShortcut.inlineOutcomeByLobby = {};
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


  function setHistoryInlineOutcome(lobbyId, type, message) {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!targetLobbyId) {
      return;
    }
    if (!state.matchReturnShortcut.inlineOutcomeByLobby || typeof state.matchReturnShortcut.inlineOutcomeByLobby !== "object") {
      state.matchReturnShortcut.inlineOutcomeByLobby = {};
    }
    const normalizedType = normalizeText(type || "info");
    const normalizedMessage = normalizeText(message || "");
    if (!normalizedMessage) {
      delete state.matchReturnShortcut.inlineOutcomeByLobby[targetLobbyId];
      return;
    }
    state.matchReturnShortcut.inlineOutcomeByLobby[targetLobbyId] = {
      type: normalizedType || "info",
      message: normalizedMessage,
      updatedAt: Date.now(),
    };
  }


  function getHistoryInlineOutcome(lobbyId) {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!targetLobbyId) {
      return null;
    }
    const map = state.matchReturnShortcut.inlineOutcomeByLobby || {};
    const entry = map[targetLobbyId];
    if (!entry || !normalizeText(entry.message || "")) {
      return null;
    }
    return entry;
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
        if (nodeLobbyId && state.matchReturnShortcut.inlineOutcomeByLobby?.[nodeLobbyId]) {
          delete state.matchReturnShortcut.inlineOutcomeByLobby[nodeLobbyId];
        }
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


  function extractHistoryHeaderName(cell) {
    if (!(cell instanceof HTMLElement)) {
      return "";
    }
    const namedNode = cell.querySelector(".ad-ext-player-name p, .ad-ext-player-name, p, span");
    if (namedNode instanceof HTMLElement) {
      return normalizeText(namedNode.textContent || "");
    }
    const fallbackText = normalizeText(cell.textContent || "");
    if (!fallbackText) {
      return "";
    }
    const parts = fallbackText.split(/\s+/).filter(Boolean);
    return normalizeText(parts[parts.length - 1] || fallbackText);
  }


  function parseHistoryStatsTable(table) {
    if (!(table instanceof HTMLTableElement)) {
      return null;
    }
    const headerCells = Array.from(table.querySelectorAll("thead tr td"));
    if (headerCells.length < 2) {
      return null;
    }

    const p1Cell = headerCells[0];
    const p2Cell = headerCells[1];
    const p1Name = extractHistoryHeaderName(p1Cell);
    const p2Name = extractHistoryHeaderName(p2Cell);
    if (!p1Name || !p2Name) {
      return null;
    }

    const p1HasTrophy = Boolean(p1Cell?.querySelector("svg[data-icon='trophy'], [data-icon='trophy'], .fa-trophy"));
    const p2HasTrophy = Boolean(p2Cell?.querySelector("svg[data-icon='trophy'], [data-icon='trophy'], .fa-trophy"));

    let p1Legs = null;
    let p2Legs = null;
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    rows.forEach((row) => {
      if (!(row instanceof HTMLTableRowElement)) {
        return;
      }
      const cells = Array.from(row.querySelectorAll("td"));
      if (cells.length < 3) {
        return;
      }
      const label = normalizeLookup(cells[0].textContent || "");
      const isLegsRow = label.includes("gewonnene legs")
        || label.includes("legs won")
        || label === "legs";
      if (!isLegsRow) {
        return;
      }
      p1Legs = clampInt(cells[1].textContent, 0, 0, 50);
      p2Legs = clampInt(cells[2].textContent, 0, 0, 50);
    });

    if (!Number.isInteger(p1Legs) || !Number.isInteger(p2Legs)) {
      return null;
    }

    let winnerIndex = -1;
    if (p1Legs !== p2Legs) {
      winnerIndex = p1Legs > p2Legs ? 0 : 1;
    } else if (p1HasTrophy !== p2HasTrophy) {
      winnerIndex = p1HasTrophy ? 0 : 1;
    }

    return {
      p1Name,
      p2Name,
      p1Legs,
      p2Legs,
      winnerIndex,
    };
  }


  function getParsedHistoryWinnerName(parsed) {
    if (!parsed) {
      return "";
    }
    if (parsed.winnerIndex === 0) {
      return parsed.p1Name;
    }
    if (parsed.winnerIndex === 1) {
      return parsed.p2Name;
    }
    if (Number.isInteger(parsed.p1Legs) && Number.isInteger(parsed.p2Legs) && parsed.p1Legs !== parsed.p2Legs) {
      return parsed.p1Legs > parsed.p2Legs ? parsed.p1Name : parsed.p2Name;
    }
    return "";
  }


  function participantIdsByName(tournament, name) {
    const key = normalizeLookup(name || "");
    if (!key) {
      return [];
    }
    return (tournament?.participants || [])
      .filter((participant) => normalizeLookup(participant?.name || "") === key)
      .map((participant) => participant.id);
  }


  function getOpenMatchCandidatesByParticipantIds(tournament, idA, idB) {
    const left = normalizeText(idA || "");
    const right = normalizeText(idB || "");
    if (!left || !right || left === right) {
      return [];
    }
    const key = new Set([left, right]);
    return (tournament?.matches || [])
      .filter((match) => {
        if (!match || match.status !== STATUS_PENDING || !match.player1Id || !match.player2Id) {
          return false;
        }
        const set = new Set([normalizeText(match.player1Id), normalizeText(match.player2Id)]);
        return key.size === set.size && [...key].every((entry) => set.has(entry));
      })
      .sort((a, b) => {
        if (a.round !== b.round) {
          return a.round - b.round;
        }
        return a.number - b.number;
      });
  }


  function importHistoryStatsTableResult(lobbyId, hostInfo) {
    const targetLobbyId = normalizeText(lobbyId || "");
    const tournament = state.store.tournament;
    if (!tournament || !targetLobbyId) {
      return null;
    }
    const parsed = parseHistoryStatsTable(hostInfo?.table);
    if (!parsed) {
      logDebug("api", "History table import skipped: stats table not parsable.", {
        lobbyId: targetLobbyId,
      });
      return null;
    }

    const p1Ids = participantIdsByName(tournament, parsed.p1Name);
    const p2Ids = participantIdsByName(tournament, parsed.p2Name);
    const matchCandidates = [];
    const seenMatches = new Set();
    p1Ids.forEach((p1Id) => {
      p2Ids.forEach((p2Id) => {
        getOpenMatchCandidatesByParticipantIds(tournament, p1Id, p2Id).forEach((match) => {
          if (!seenMatches.has(match.id)) {
            seenMatches.add(match.id);
            matchCandidates.push(match);
          }
        });
      });
    });

    if (!matchCandidates.length) {
      return {
        ok: false,
        completed: false,
        reasonCode: "not_found",
        message: "Kein offenes Turnier-Match für die Spieler aus der Statistik gefunden.",
      };
    }
    if (matchCandidates.length > 1) {
      return {
        ok: false,
        completed: false,
        reasonCode: "ambiguous",
        message: "Mehrdeutige Zuordnung: mehrere offene Turnier-Matches passen zu diesen Spielern.",
      };
    }

    const match = matchCandidates[0];
    const p1Lookup = normalizeLookup(parsed.p1Name);
    const matchP1Name = normalizeLookup(participantNameById(tournament, match.player1Id));
    const tableMapsDirect = p1Lookup && matchP1Name === p1Lookup;

    const legs = tableMapsDirect
      ? { p1: parsed.p1Legs, p2: parsed.p2Legs }
      : { p1: parsed.p2Legs, p2: parsed.p1Legs };

    let winnerId = "";
    if (parsed.winnerIndex === 0) {
      winnerId = tableMapsDirect ? match.player1Id : match.player2Id;
    } else if (parsed.winnerIndex === 1) {
      winnerId = tableMapsDirect ? match.player2Id : match.player1Id;
    } else if (legs.p1 !== legs.p2) {
      winnerId = legs.p1 > legs.p2 ? match.player1Id : match.player2Id;
    }

    if (!winnerId) {
      return {
        ok: false,
        completed: false,
        reasonCode: "error",
        message: "Sieger konnte aus der Statistik nicht eindeutig bestimmt werden.",
      };
    }

    const result = updateMatchResult(match.id, winnerId, legs, "auto");
    if (!result.ok) {
      return {
        ok: false,
        completed: false,
        reasonCode: "error",
        message: result.message || "Ergebnis konnte nicht aus der Statistik gespeichert werden.",
      };
    }

    const updatedMatch = findMatch(tournament, match.id);
    if (updatedMatch) {
      const auto = ensureMatchAutoMeta(updatedMatch);
      const now = nowIso();
      auto.provider = API_PROVIDER;
      auto.lobbyId = auto.lobbyId || targetLobbyId;
      auto.status = "completed";
      auto.finishedAt = auto.finishedAt || now;
      auto.lastSyncAt = now;
      auto.lastError = null;
      updatedMatch.updatedAt = now;
      tournament.updatedAt = now;
      schedulePersist();
    }

    logDebug("api", "History table result imported.", {
      lobbyId: targetLobbyId,
      matchId: match.id,
      winnerId,
      legs,
    });
    return {
      ok: true,
      completed: true,
      reasonCode: "completed",
      message: "Ergebnis wurde aus der Match-Statistik übernommen.",
    };
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
    const parsedStats = parseHistoryStatsTable(hostInfo.table);
    const parsedWinnerName = getParsedHistoryWinnerName(parsedStats);
    const parsedScoreText = parsedStats
      ? `${parsedStats.p1Name} ${parsedStats.p1Legs}:${parsedStats.p2Legs} ${parsedStats.p2Name}`
      : "";
    const inlineOutcome = getHistoryInlineOutcome(lobbyId);

    let statusText = "";
    if (isAlreadyCompleted) {
      statusText = "Ergebnis bereits im Turnier gespeichert.";
    } else if (!autoEnabled) {
      statusText = "Auto-Lobby ist deaktiviert. Aktivieren Sie die Funktion im Tab Einstellungen.";
    } else if (!parsedStats) {
      statusText = "Statistik konnte nicht vollständig gelesen werden. Beim Klick wird API-Fallback genutzt.";
    } else if (parsedWinnerName) {
      statusText = `Import bereit. Sieger laut Statistik: ${parsedWinnerName}.`;
    } else if (linkedMatchAny && auto?.status === "error") {
      statusText = `Letzter Sync-Fehler: ${normalizeText(auto.lastError || "Unbekannt") || "Unbekannt"}`;
    } else if (linkedMatchAny && auto?.status === "started") {
      statusText = "Match verknüpft. Ergebnis kann jetzt übernommen werden.";
    } else {
      statusText = "Kein direkt verknüpftes Match gefunden. Ergebnisübernahme versucht Zuordnung über die Statistik.";
    }

    const primaryLabel = isAlreadyCompleted
      ? "Turnierassistent öffnen"
      : (isSyncing ? "\u00dcbernehme..." : "Ergebnis aus Statistik \u00fcbernehmen & Turnier \u00f6ffnen");
    const disabledAttr = isSyncing || (!autoEnabled && !isAlreadyCompleted) ? "disabled" : "";
    const outcomeType = normalizeText(inlineOutcome?.type || "info");
    const outcomeMessage = normalizeText(inlineOutcome?.message || "");
    const outcomeColor = outcomeType === "success"
      ? "#d8ffe7"
      : outcomeType === "error"
        ? "#ffd9dc"
        : "#dbe8ff";
    const outcomeBg = outcomeType === "success"
      ? "rgba(73, 205, 138, 0.16)"
      : outcomeType === "error"
        ? "rgba(214, 74, 105, 0.18)"
        : "rgba(119, 167, 255, 0.14)";
    const outcomeBorder = outcomeType === "success"
      ? "rgba(95, 220, 154, 0.5)"
      : outcomeType === "error"
        ? "rgba(245, 123, 143, 0.52)"
        : "rgba(142, 188, 255, 0.48)";

    root.innerHTML = `
      <div style="margin:10px 0 14px 0;padding:14px;border-radius:12px;border:1px solid rgba(120,203,255,0.45);background:linear-gradient(180deg, rgba(54,70,145,0.92), rgba(34,80,136,0.9));color:#f4f7ff;box-shadow:0 10px 24px rgba(7,11,25,0.28);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;">
          <div style="font-size:15px;line-height:1.2;font-weight:800;letter-spacing:0.25px;">xLokale Turniere</div>
          <div style="font-size:11px;font-weight:700;letter-spacing:0.3px;color:#d5ebff;background:rgba(31,175,198,0.32);border:1px solid rgba(133,219,255,0.42);padding:3px 8px;border-radius:999px;">Match-Import</div>
        </div>
        <div style="font-size:13px;line-height:1.45;color:rgba(240,246,255,0.95);margin-bottom:8px;">${escapeHtml(statusText)}</div>
        ${parsedScoreText ? `<div style="font-size:12px;line-height:1.4;color:rgba(220,236,255,0.88);margin-bottom:10px;">Statistik: ${escapeHtml(parsedScoreText)}</div>` : ""}
        ${outcomeMessage ? `<div style="font-size:12px;line-height:1.4;color:${outcomeColor};background:${outcomeBg};border:1px solid ${outcomeBorder};padding:7px 9px;border-radius:8px;margin-bottom:10px;">${escapeHtml(outcomeMessage)}</div>` : ""}
        <button type="button" data-action="ata-history-sync" style="display:block;width:100%;border:1px solid rgba(99,231,173,0.7);background:linear-gradient(180deg, rgba(83,221,163,0.36), rgba(58,197,141,0.36));color:#ecfff6;border-radius:10px;padding:12px 14px;font-size:14px;font-weight:800;cursor:pointer;letter-spacing:0.2px;" ${disabledAttr}>${escapeHtml(primaryLabel)}</button>
      </div>
    `;

    const syncButton = root.querySelector("[data-action='ata-history-sync']");
    if (syncButton instanceof HTMLButtonElement) {
      if (isSyncing || (!autoEnabled && !isAlreadyCompleted)) {
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
    setHistoryInlineOutcome(targetLobbyId, "info", "Übernehme Ergebnis...");
    setLobbySyncing(targetLobbyId, true);
    renderHistoryImportButton();
    try {
      let syncOutcome = null;
      if (trigger === "inline-history") {
        const hostInfo = findHistoryImportHost(targetLobbyId);
        syncOutcome = importHistoryStatsTableResult(targetLobbyId, hostInfo);
      }

      if (!syncOutcome) {
        syncOutcome = await syncResultForLobbyId(targetLobbyId, {
          notifyErrors: true,
          notifyNotReady: true,
          trigger,
        });
      }

      if (syncOutcome.reasonCode === "completed" || syncOutcome.completed) {
        openAssistantMatchesTab();
        setHistoryInlineOutcome(targetLobbyId, "success", syncOutcome.message || "Ergebnis wurde übernommen.");
        const alreadyStored = normalizeText(syncOutcome.message || "").includes("bereits");
        if (alreadyStored) {
          setNotice("info", syncOutcome.message || "Ergebnis war bereits im Turnier gespeichert.", 2600);
        } else {
          setNotice("success", syncOutcome.message || "Ergebnis wurde in xLokale Turniere \u00fcbernommen.", 2600);
        }
      } else if (!syncOutcome.ok && syncOutcome.message) {
        setHistoryInlineOutcome(targetLobbyId, syncOutcome.reasonCode === "ambiguous" ? "error" : "info", syncOutcome.message);
        const noticeType = syncOutcome.reasonCode === "ambiguous" ? "error" : "info";
        setNotice(noticeType, syncOutcome.message, 3200);
      } else if (syncOutcome.ok && !syncOutcome.completed) {
        setHistoryInlineOutcome(targetLobbyId, "info", "Noch kein finales Ergebnis verfügbar.");
        setNotice("info", "Noch kein finales Ergebnis verf\u00fcgbar. Match l\u00e4uft ggf. noch.", 2600);
      }
    } catch (error) {
      logWarn("api", "Manual shortcut sync failed.", error);
      setHistoryInlineOutcome(targetLobbyId, "error", "Ergebnisübernahme fehlgeschlagen. Bitte erneut versuchen.");
      setNotice("error", "Ergebnis\u00fcbernahme fehlgeschlagen. Bitte sp\u00e4ter erneut versuchen.");
    } finally {
      setLobbySyncing(targetLobbyId, false);
      renderHistoryImportButton();
    }
  }


  async function handleHistoryImportClick(lobbyId) {
    return handleLobbySyncAndOpen(lobbyId, "inline-history");
  }


  function renderMatchReturnShortcut() {
    removeMatchReturnShortcut();
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


