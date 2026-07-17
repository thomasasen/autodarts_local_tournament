// Guided controls shown only on the linked AutoDarts match route.

  function getFixedLegsLiveRouteId(pathname = location.pathname) {
    const routeMatch = normalizeText(pathname || "").match(/^\/matches\/([^/?#]+)\/?$/i);
    if (!routeMatch?.[1]) return "";
    try {
      return normalizeText(decodeURIComponent(routeMatch[1]));
    } catch (_) {
      return normalizeText(routeMatch[1]);
    }
  }


  function removeFixedLegsLiveControl() {
    Array.from(document.querySelectorAll("[data-ata-fixed-legs-live='1']")).forEach((node) => node.remove());
    state.fixedLegsLive.root = null;
    state.fixedLegsLive.polling = false;
    state.fixedLegsLive.lastLobbyId = "";
    state.fixedLegsLive.requestVersion += 1;
  }


  function findFixedLegsLiveMatch(tournament, lobbyId) {
    return (tournament?.matches || []).find((match) => (
      isFixedLegsPreliminaryMatch(tournament, match)
      && normalizeText(match?.meta?.auto?.lobbyId || "") === normalizeText(lobbyId || "")
    )) || null;
  }


  function getFixedLegsLivePhaseCopy(resolved) {
    const copy = {
      playing_leg_1: { phase: "Leg 1 läuft", detail: "Nach dem Checkout erscheint die Bestätigung für Leg 2." },
      awaiting_leg_2_confirmation: { phase: "Leg 1 beendet", detail: "Der Leg-Sieger wird gespeichert; Leg 2 startet erst nach deinem Klick." },
      playing_leg_2: { phase: "Leg 2 läuft", detail: "Nach dem Checkout erscheint die Bestätigung zum Matchabschluss." },
      awaiting_finish_confirmation: { phase: "Zwei Legs beendet", detail: "Prüfe den Stand und beende das Match anschließend ausdrücklich." },
      completed: { phase: "Abgeschlossen", detail: "Das Ergebnis wurde aus genau zwei Legs übernommen." },
      blocked: { phase: "Prüfung erforderlich", detail: getFixedLegsSyncErrorMessage(resolved?.reasonCode) },
    };
    return copy[resolved?.phase] || copy.blocked;
  }


  function getFixedLegsLiveAction(resolved, match) {
    if (state.fixedLegsLive.actionInProgress) return { id: "", label: "Wird ausgeführt …" };
    if (resolved?.phase === "awaiting_leg_2_confirmation") {
      return { id: "next", label: "Leg 1 übernehmen & Leg 2 starten" };
    }
    if (resolved?.phase === "awaiting_finish_confirmation") {
      return { id: "finish", label: "Match abschließen & Ergebnis übernehmen" };
    }
    if (resolved?.recoveryAvailable) {
      return { id: "recover", label: "Match jetzt nach zwei Legs beenden" };
    }
    if (resolved?.phase === "completed" && match?.status !== STATUS_COMPLETED) {
      return { id: "adopt", label: "Ergebnis übernehmen" };
    }
    return null;
  }


  function mountFixedLegsLiveControl() {
    let root = document.querySelector("[data-ata-fixed-legs-live='1']");
    if (root instanceof HTMLElement) return root;
    root = document.createElement("section");
    root.setAttribute("data-ata-fixed-legs-live", "1");
    const mount = document.querySelector("main") || document.body;
    if (!mount) return null;
    mount.prepend(root);
    state.fixedLegsLive.root = root;
    return root;
  }


  function paintFixedLegsLiveControl(match, resolved, outcome = null) {
    const tournament = state.store.tournament;
    const root = mountFixedLegsLiveControl();
    if (!root) return;
    const player1 = participantNameById(tournament, match.player1Id);
    const player2 = participantNameById(tournament, match.player2Id);
    const phaseCopy = getFixedLegsLivePhaseCopy(resolved);
    const action = getFixedLegsLiveAction(resolved, match);
    const busy = state.fixedLegsLive.actionInProgress;
    const score = `${Number(resolved?.legs?.p1 || 0)}:${Number(resolved?.legs?.p2 || 0)}`;
    const outcomeText = normalizeText(outcome?.message || "");
    const outcomeColor = outcome?.type === "error" ? "#ffd2d2" : "#d8ffea";
    root.innerHTML = `
      <div style="margin:10px 12px 14px;padding:14px;border-radius:12px;border:1px solid rgba(120,203,255,.55);background:linear-gradient(180deg,rgba(43,62,126,.97),rgba(29,72,122,.97));color:#f4f7ff;box-shadow:0 10px 24px rgba(7,11,25,.28);font-family:system-ui,sans-serif;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div><div style="font-size:12px;font-weight:800;letter-spacing:.3px;color:#bfe7ff;">VORRUNDE · ZWEI FESTE LEGS</div><h2 tabindex="-1" style="font-size:18px;line-height:1.3;margin:3px 0 0;">${escapeHtml(player1)} vs ${escapeHtml(player2)}</h2></div>
          <div style="font-size:24px;font-weight:900;min-width:58px;text-align:center;">${escapeHtml(score)}</div>
        </div>
        <p style="margin:10px 0 2px;font-size:15px;font-weight:800;">${escapeHtml(phaseCopy.phase)}</p>
        <p style="margin:0 0 12px;font-size:13px;line-height:1.45;color:#deebff;">${escapeHtml(phaseCopy.detail)}</p>
        ${action ? `<button type="button" data-action="ata-fixed-legs-${escapeHtml(action.id)}" style="display:block;width:100%;min-height:44px;border:1px solid rgba(99,231,173,.75);background:linear-gradient(180deg,rgba(83,221,163,.38),rgba(58,197,141,.38));color:#f2fff8;border-radius:10px;padding:11px 14px;font-size:14px;font-weight:850;cursor:${busy ? "wait" : "pointer"};" ${busy ? "disabled" : ""}>${escapeHtml(action.label)}</button>` : ""}
        <div aria-live="polite" aria-atomic="true" style="min-height:18px;margin-top:${outcomeText ? "9px" : "0"};font-size:12px;line-height:1.4;color:${outcomeColor};">${escapeHtml(outcomeText)}</div>
      </div>`;
    if (action?.id && !busy) {
      root.querySelector(`[data-action='ata-fixed-legs-${action.id}']`)?.addEventListener("click", () => {
        handleFixedLegsLiveAction(action.id, match.id, match.meta.auto.lobbyId).catch((error) => {
          logWarn("api", "Fixed-Legs live action failed.", error);
        });
      });
    }
  }


  function setFixedLegsLiveError(match, reasonCode, fallbackMessage = "") {
    const message = normalizeText(fallbackMessage || getFixedLegsSyncErrorMessage(reasonCode));
    const auto = ensureMatchAutoMeta(match);
    auto.status = "error";
    auto.lastError = message;
    auto.lastSyncAt = nowIso();
    if (match?.meta?.fixedLegs) match.meta.fixedLegs.syncStatus = "error";
    match.updatedAt = nowIso();
    state.fixedLegsLive.outcome = { type: "error", reasonCode, message };
    schedulePersist();
  }


  async function resolveCurrentFixedLegsLiveState(tournament, match, token) {
    let providerState;
    try {
      providerState = await fetchMatchState(match.meta.auto.lobbyId, token);
    } catch (error) {
      if (Number(error?.status || 0) !== 404) throw error;
      const stats = await fetchMatchStats(match.meta.auto.lobbyId, token);
      return resolveFixedLegsFromApiStats(tournament, match, stats);
    }
    return resolveFixedLegsMatchState({
      providerState,
      expectedPlayers: getFixedLegsExpectedPlayers(tournament, match),
      storedEntries: match?.meta?.fixedLegs?.entries || [],
      allowPositionalFallback: true,
    });
  }


  async function handleFixedLegsLiveAction(actionId, matchId, lobbyId) {
    if (state.fixedLegsLive.actionInProgress) return { ok: false, reasonCode: "fixed_legs_state_conflict" };
    const tournament = state.store.tournament;
    const match = findMatch(tournament, matchId);
    if (!match || normalizeText(match?.meta?.auto?.lobbyId || "") !== normalizeText(lobbyId || "")) return { ok: false, reasonCode: "fixed_legs_state_conflict" };
    if (actionId === "recover" && !window.confirm("Leg 3 wurde bereits begonnen. Match jetzt beenden und ausschließlich den Stand nach zwei abgeschlossenen Legs übernehmen?")) {
      return { ok: false, reasonCode: "cancelled" };
    }
    state.fixedLegsLive.actionInProgress = true;
    state.fixedLegsLive.outcome = null;
    paintFixedLegsLiveControl(match, { phase: "blocked", legs: match.legs, reasonCode: "fixed_legs_result_not_ready" });
    let token = "";
    try {
      token = await resolveAuthToken();
      if (!token) throw Object.assign(new Error("Kein Auth-Token gefunden. Bitte neu einloggen."), { status: 401 });
      const flow = await executeFixedLegsGuidedAction(actionId, {
        load: () => resolveCurrentFixedLegsLiveState(tournament, match, token),
        saveLeg1: (resolved) => {
          const entries = buildFixedLegEntriesFromResolvedState(resolved, getFixedLegsExpectedPlayers(tournament, match), match?.meta?.fixedLegs?.entries || []);
          return applyFixedLegEntriesToTournament(tournament, match.id, entries, "auto");
        },
        next: () => startNextMatchGame(lobbyId, token),
        finish: () => finishApiMatch(lobbyId, token),
        saveResult: (resolved) => persistResolvedFixedLegsResult(tournament, match, resolved, "auto"),
      });
      if (!flow.ok) {
        throw Object.assign(new Error(flow.message || getFixedLegsSyncErrorMessage(flow.reasonCode)), { reasonCode: flow.reasonCode });
      }
      const resolved = flow.resolved;
      if (actionId === "next") {
        match.meta.fixedLegs.syncStatus = "playing_leg_2";
        state.fixedLegsLive.outcome = { type: "success", message: flow.idempotent ? "Leg 2 läuft bereits." : "Leg 1 übernommen. Leg 2 wurde gestartet." };
      } else {
        state.fixedLegsLive.outcome = { type: "success", message: `Ergebnis ${resolved.legs.p1}:${resolved.legs.p2} übernommen.` };
      }
      tournament.updatedAt = nowIso();
      await persistStore().catch(() => schedulePersist());
      renderShell();
      return { ok: true };
    } catch (error) {
      const reasonCode = normalizeText(error?.reasonCode || (actionId === "next" ? "fixed_legs_next_failed" : "fixed_legs_finish_failed"));
      setFixedLegsLiveError(match, reasonCode, normalizeText(error?.message || ""));
      return { ok: false, reasonCode, message: error?.message };
    } finally {
      state.fixedLegsLive.actionInProgress = false;
      renderFixedLegsLiveControl({ force: true }).then(() => {
        const heading = state.fixedLegsLive.root?.querySelector("h2[tabindex='-1']");
        if (heading instanceof HTMLElement) heading.focus({ preventScroll: true });
      }).catch((error) => logWarn("api", "Fixed-Legs live refresh failed.", error));
    }
  }


  async function renderFixedLegsLiveControl(options = {}) {
    const lobbyId = getFixedLegsLiveRouteId();
    const tournament = state.store.tournament;
    if (!lobbyId || !tournament || !state.store.settings.featureFlags.autoLobbyStart) {
      removeFixedLegsLiveControl();
      return;
    }
    const match = findFixedLegsLiveMatch(tournament, lobbyId);
    if (!match) {
      removeFixedLegsLiveControl();
      return;
    }
    if (state.fixedLegsLive.actionInProgress || state.fixedLegsLive.polling) return;
    if (!options.force && state.fixedLegsLive.lastLobbyId === lobbyId && Date.now() - state.fixedLegsLive.lastFetchAt < 900) return;
    state.fixedLegsLive.polling = true;
    state.fixedLegsLive.lastLobbyId = lobbyId;
    state.fixedLegsLive.lastFetchAt = Date.now();
    const requestVersion = ++state.fixedLegsLive.requestVersion;
    try {
      const token = await resolveAuthToken();
      if (!token) {
        paintFixedLegsLiveControl(match, { phase: "blocked", legs: match.legs, reasonCode: "fixed_legs_state_invalid" }, { type: "error", message: "Kein Auth-Token gefunden. Bitte neu einloggen." });
        return;
      }
      let resolved = await resolveCurrentFixedLegsLiveState(tournament, match, token);
      if (requestVersion !== state.fixedLegsLive.requestVersion || getFixedLegsLiveRouteId() !== lobbyId) return;
      if (resolved.phase === "completed" && match.status !== STATUS_COMPLETED) {
        const saved = persistResolvedFixedLegsResult(tournament, match, resolved, "auto");
        if (saved.ok) {
          state.fixedLegsLive.outcome = { type: "success", message: `Nativ beendetes Match erkannt. Ergebnis ${resolved.legs.p1}:${resolved.legs.p2} übernommen.` };
          schedulePersist();
          renderShell();
        }
      }
      if (match.status === STATUS_COMPLETED) {
        resolved = {
          ...resolved,
          ok: true,
          phase: "completed",
          syncStatus: "completed",
          legs: { p1: Number(match.legs?.p1 || 0), p2: Number(match.legs?.p2 || 0) },
          completedLegs: PRELIMINARY_FIXED_LEG_COUNT,
        };
      }
      if (resolved.ok && match?.meta?.fixedLegs && match.meta.fixedLegs.syncStatus !== resolved.syncStatus) {
        match.meta.fixedLegs.syncStatus = resolved.syncStatus;
        schedulePersist();
      }
      paintFixedLegsLiveControl(match, resolved, state.fixedLegsLive.outcome);
    } catch (error) {
      if (requestVersion !== state.fixedLegsLive.requestVersion) return;
      paintFixedLegsLiveControl(match, { phase: "blocked", legs: match.legs, reasonCode: "fixed_legs_state_invalid" }, { type: "error", message: normalizeText(error?.message || "Matchzustand konnte nicht geladen werden.") });
    } finally {
      if (requestVersion === state.fixedLegsLive.requestVersion) state.fixedLegsLive.polling = false;
    }
  }
