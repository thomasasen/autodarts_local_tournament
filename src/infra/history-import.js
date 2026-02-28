// Auto-generated module split from dist source.
  // History import and lobby-route helpers.


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


  function scoreParticipantNameMatch(participantName, tableName) {
    const participantLookup = normalizeLookup(participantName || "");
    const tableLookup = normalizeLookup(tableName || "");
    if (!participantLookup || !tableLookup) {
      return 0;
    }
    if (participantLookup === tableLookup) {
      return 400;
    }

    const participantToken = normalizeToken(participantLookup);
    const tableToken = normalizeToken(tableLookup);
    if (participantToken && tableToken && participantToken === tableToken) {
      return 360;
    }

    const participantWords = participantLookup.split(/\s+/).filter(Boolean);
    const tableWords = tableLookup.split(/\s+/).filter(Boolean);
    if (participantWords.includes(tableLookup) || tableWords.includes(participantLookup)) {
      return 300;
    }
    if (
      participantLookup.startsWith(`${tableLookup} `)
      || participantLookup.endsWith(` ${tableLookup}`)
      || tableLookup.startsWith(`${participantLookup} `)
      || tableLookup.endsWith(` ${participantLookup}`)
    ) {
      return 280;
    }

    if (participantToken && tableToken && participantToken.includes(tableToken)) {
      return 240;
    }
    if (participantToken && tableToken && tableToken.includes(participantToken)) {
      return 200;
    }
    if (participantLookup.includes(tableLookup)) {
      return 170;
    }
    if (tableLookup.includes(participantLookup)) {
      return 140;
    }
    return 0;
  }


  function participantIdsByName(tournament, name) {
    const tableName = normalizeText(name || "");
    if (!tableName) {
      return [];
    }
    const scored = (tournament?.participants || [])
      .map((participant) => ({
        id: participant?.id,
        score: scoreParticipantNameMatch(participant?.name || "", tableName),
      }))
      .filter((entry) => entry.id && entry.score > 0)
      .sort((left, right) => right.score - left.score);
    if (!scored.length) {
      return [];
    }

    const exact = scored.filter((entry) => entry.score >= 360);
    if (exact.length) {
      return exact.map((entry) => entry.id);
    }

    const strong = scored.filter((entry) => entry.score >= 280);
    if (strong.length) {
      return strong.map((entry) => entry.id);
    }

    const medium = scored.filter((entry) => entry.score >= 200);
    if (medium.length === 1) {
      return [medium[0].id];
    }
    return medium.map((entry) => entry.id);
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


  function resolveTableToMatchOrder(tournament, match, parsed) {
    const matchP1Name = participantNameById(tournament, match?.player1Id);
    const matchP2Name = participantNameById(tournament, match?.player2Id);
    const directScore = scoreParticipantNameMatch(matchP1Name, parsed?.p1Name)
      + scoreParticipantNameMatch(matchP2Name, parsed?.p2Name);
    const swappedScore = scoreParticipantNameMatch(matchP1Name, parsed?.p2Name)
      + scoreParticipantNameMatch(matchP2Name, parsed?.p1Name);
    if (swappedScore > directScore) {
      return false;
    }
    if (directScore > swappedScore) {
      return true;
    }
    const parsedP1Lookup = normalizeLookup(parsed?.p1Name || "");
    const matchP1Lookup = normalizeLookup(matchP1Name || "");
    if (parsedP1Lookup && matchP1Lookup && parsedP1Lookup === matchP1Lookup) {
      return true;
    }
    return true;
  }


  function normalizeHistoryLegsForTournament(tournament, match, winnerId, legsRaw) {
    const legsToWin = getLegsToWin(tournament?.bestOfLegs);
    const winnerIsP1 = winnerId === match?.player1Id;
    let p1 = clampInt(legsRaw?.p1, 0, 0, 99);
    let p2 = clampInt(legsRaw?.p2, 0, 0, 99);
    let winnerLegs = winnerIsP1 ? p1 : p2;
    let loserLegs = winnerIsP1 ? p2 : p1;
    let adjusted = false;

    if (winnerLegs <= loserLegs) {
      winnerLegs = loserLegs + 1;
      adjusted = true;
    }

    if (winnerLegs !== legsToWin) {
      winnerLegs = legsToWin;
      adjusted = true;
    }

    loserLegs = clampInt(loserLegs, 0, 0, Math.max(0, legsToWin - 1));
    if (loserLegs >= winnerLegs) {
      loserLegs = Math.max(0, winnerLegs - 1);
      adjusted = true;
    }

    p1 = winnerIsP1 ? winnerLegs : loserLegs;
    p2 = winnerIsP1 ? loserLegs : winnerLegs;
    return {
      legs: { p1, p2 },
      adjusted,
      legsToWin,
    };
  }


  function findHistoryImportMatchCandidates(tournament, lobbyId, parsed) {
    const targetLobbyId = normalizeText(lobbyId || "");
    const linkedByLobby = findTournamentMatchByLobbyId(tournament, targetLobbyId, false);
    const seenMatches = new Set();
    const matchCandidates = [];
    const pushMatch = (match) => {
      if (!match?.id || seenMatches.has(match.id)) {
        return;
      }
      seenMatches.add(match.id);
      matchCandidates.push(match);
    };

    if (linkedByLobby?.status === STATUS_PENDING && linkedByLobby.player1Id && linkedByLobby.player2Id) {
      pushMatch(linkedByLobby);
    }

    const p1Ids = participantIdsByName(tournament, parsed?.p1Name);
    const p2Ids = participantIdsByName(tournament, parsed?.p2Name);
    p1Ids.forEach((p1Id) => {
      p2Ids.forEach((p2Id) => {
        getOpenMatchCandidatesByParticipantIds(tournament, p1Id, p2Id).forEach((match) => {
          pushMatch(match);
        });
      });
    });

    return {
      linkedByLobby: linkedByLobby && linkedByLobby.status === STATUS_PENDING ? linkedByLobby : null,
      matchCandidates,
    };
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

    const selection = findHistoryImportMatchCandidates(tournament, targetLobbyId, parsed);
    const linkedByLobby = selection.linkedByLobby;
    const matchCandidates = selection.matchCandidates;
    let match = null;
    if (linkedByLobby?.player1Id && linkedByLobby?.player2Id) {
      match = linkedByLobby;
    } else if (!matchCandidates.length) {
      return {
        ok: false,
        completed: false,
        reasonCode: "not_found",
        message: "Kein offenes Turnier-Match aus Lobby-ID oder Statistik-Spielern gefunden.",
      };
    } else if (matchCandidates.length > 1) {
      return {
        ok: false,
        completed: false,
        reasonCode: "ambiguous",
        message: "Mehrdeutige Zuordnung: mehrere offene Turnier-Matches passen zu diesen Spielern.",
      };
    } else {
      match = matchCandidates[0];
    }

    const tableMapsDirect = resolveTableToMatchOrder(tournament, match, parsed);

    const legsRaw = tableMapsDirect
      ? { p1: parsed.p1Legs, p2: parsed.p2Legs }
      : { p1: parsed.p2Legs, p2: parsed.p1Legs };

    let winnerId = "";
    if (parsed.winnerIndex === 0) {
      winnerId = tableMapsDirect ? match.player1Id : match.player2Id;
    } else if (parsed.winnerIndex === 1) {
      winnerId = tableMapsDirect ? match.player2Id : match.player1Id;
    } else if (legsRaw.p1 !== legsRaw.p2) {
      winnerId = legsRaw.p1 > legsRaw.p2 ? match.player1Id : match.player2Id;
    }

    if (!winnerId) {
      return {
        ok: false,
        completed: false,
        reasonCode: "error",
        message: "Sieger konnte aus der Statistik nicht eindeutig bestimmt werden.",
      };
    }

    const normalizedLegs = normalizeHistoryLegsForTournament(tournament, match, winnerId, legsRaw);
    const result = updateMatchResult(match.id, winnerId, normalizedLegs.legs, "auto");
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
      legs: normalizedLegs.legs,
      adjustedLegs: normalizedLegs.adjusted,
      linkedByLobby: Boolean(linkedByLobby?.id),
    });
    const successMessage = normalizedLegs.adjusted
      ? `Ergebnis übernommen. Legs wurden auf Turniermodus (First to ${normalizedLegs.legsToWin}) normalisiert.`
      : "Ergebnis wurde aus der Match-Statistik übernommen.";
    return {
      ok: true,
      completed: true,
      reasonCode: "completed",
      message: successMessage,
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
          <div style="font-size:15px;line-height:1.2;font-weight:800;letter-spacing:0.25px;">xLokales Turnier</div>
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
          setNotice("success", syncOutcome.message || "Ergebnis wurde in xLokales Turnier \u00fcbernommen.", 2600);
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
