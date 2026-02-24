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


  async function handleMatchShortcutSyncAndOpen(lobbyId) {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!targetLobbyId || state.matchReturnShortcut.syncing) {
      return;
    }
    state.matchReturnShortcut.syncing = true;
    renderMatchReturnShortcut();
    try {
      const syncOutcome = await syncResultForLobbyId(targetLobbyId, {
        notifyErrors: true,
        notifyNotReady: true,
      });
      openAssistantMatchesTab();
      if (syncOutcome.completed) {
        setNotice("success", "Ergebnis wurde in xLokale Turniere \u00fcbernommen.", 2400);
      } else if (!syncOutcome.ok && syncOutcome.message) {
        setNotice("info", syncOutcome.message, 3200);
      } else if (syncOutcome.ok && !syncOutcome.completed) {
        setNotice("info", "Noch kein finales Ergebnis verf\u00fcgbar. Match l\u00e4uft ggf. noch.", 2600);
      }
    } catch (error) {
      logWarn("api", "Manual shortcut sync failed.", error);
      setNotice("error", "Ergebnis\u00fcbernahme fehlgeschlagen. Bitte sp\u00e4ter erneut versuchen.");
    } finally {
      state.matchReturnShortcut.syncing = false;
      renderMatchReturnShortcut();
    }
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
    if (!linkedMatchAny) {
      removeMatchReturnShortcut();
      return;
    }

    const linkedMatchOpen = linkedMatchAny.status === STATUS_PENDING ? linkedMatchAny : null;
    const auto = ensureMatchAutoMeta(linkedMatchAny);
    const root = ensureMatchReturnShortcutRoot();
    const isSyncing = state.matchReturnShortcut.syncing;
    const hasOpenMatch = Boolean(linkedMatchOpen);

    const statusText = linkedMatchAny.status === STATUS_COMPLETED
      ? "Ergebnis bereits im Turnier gespeichert."
      : auto.status === "error"
        ? `Letzter Sync-Fehler: ${normalizeText(auto.lastError || "Unbekannt") || "Unbekannt"}`
        : auto.status === "started"
          ? "Match verkn\u00fcpft. Ergebnis kann \u00fcbernommen werden."
          : "API-Sync wartet auf Match-Start.";

    const primaryLabel = hasOpenMatch
      ? (isSyncing ? "\u00dcbernehme..." : "Ergebnis \u00fcbernehmen & Turnier \u00f6ffnen")
      : "Turnierassistent \u00f6ffnen";

    const secondaryButtonHtml = hasOpenMatch
      ? `<button type="button" data-action="open-assistant" style="flex:1 1 auto;border:1px solid rgba(255,255,255,0.28);background:rgba(255,255,255,0.1);color:#f4f7ff;border-radius:8px;padding:8px 10px;font-size:13px;cursor:pointer;">Nur Turnierassistent</button>`
      : "";

    root.innerHTML = `
      <div style="font-size:13px;font-weight:700;letter-spacing:0.3px;margin-bottom:6px;">xLokale Turniere</div>
      <div style="font-size:12px;line-height:1.35;color:rgba(232,237,255,0.86);margin-bottom:8px;">${escapeHtml(statusText)}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" data-action="sync-open" style="flex:1 1 auto;border:1px solid rgba(90,210,153,0.55);background:rgba(90,210,153,0.24);color:#dcffe8;border-radius:8px;padding:8px 10px;font-size:13px;font-weight:700;cursor:pointer;" ${isSyncing ? "disabled" : ""}>${escapeHtml(primaryLabel)}</button>
        ${secondaryButtonHtml}
      </div>
    `;

    const syncButton = root.querySelector("[data-action='sync-open']");
    if (syncButton instanceof HTMLButtonElement) {
      if (hasOpenMatch) {
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


