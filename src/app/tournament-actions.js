// App layer: runtime orchestration, persistence scheduling and user feedback.
  const DRAW_UNLOCK_OVERRIDE_WINDOW_MS = 30000;


  function clearTransientMatchShortcutState() {
    state.matchReturnShortcut.pendingDrawUnlockOverride = null;
    state.matchReturnShortcut.pendingConfirmationByLobby = {};
  }


  function getPendingDrawUnlockOverrideForTournament(tournamentId) {
    const targetTournamentId = normalizeText(tournamentId || "");
    const pending = state.matchReturnShortcut?.pendingDrawUnlockOverride;
    if (!targetTournamentId || !pending || typeof pending !== "object") {
      return null;
    }
    const pendingTournamentId = normalizeText(pending.tournamentId || "");
    const pendingToken = normalizeText(pending.token || "");
    const expiresAt = Number(pending.expiresAt || 0);
    if (!pendingToken || pendingTournamentId !== targetTournamentId) {
      return null;
    }
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      state.matchReturnShortcut.pendingDrawUnlockOverride = null;
      return null;
    }
    return {
      token: pendingToken,
      expiresAt,
      ttlMs: Math.max(0, expiresAt - Date.now()),
    };
  }


  function issuePendingDrawUnlockOverride(tournamentId) {
    const targetTournamentId = normalizeText(tournamentId || "");
    if (!targetTournamentId) {
      return null;
    }
    const pending = {
      tournamentId: targetTournamentId,
      token: `${targetTournamentId}:${uuid("draw_unlock_override")}`,
      expiresAt: Date.now() + DRAW_UNLOCK_OVERRIDE_WINDOW_MS,
    };
    state.matchReturnShortcut.pendingDrawUnlockOverride = pending;
    return {
      token: pending.token,
      expiresAt: pending.expiresAt,
      ttlMs: DRAW_UNLOCK_OVERRIDE_WINDOW_MS,
    };
  }


  function clearPendingDrawUnlockOverride(tournamentId = "") {
    const pending = state.matchReturnShortcut?.pendingDrawUnlockOverride;
    if (!pending || typeof pending !== "object") {
      return;
    }
    const targetTournamentId = normalizeText(tournamentId || "");
    if (!targetTournamentId || normalizeText(pending.tournamentId || "") === targetTournamentId) {
      state.matchReturnShortcut.pendingDrawUnlockOverride = null;
    }
  }


  function finalizeTournamentMutation(tournament, activeTab = state.activeTab) {
    if (!tournament) {
      return;
    }
    refreshDerivedMatches(tournament);
    tournament.updatedAt = nowIso();
    state.activeTab = activeTab;
    state.store.ui.activeTab = activeTab;
    schedulePersist();
    renderShell();
  }


  function createTournamentSession(config) {
    const errors = validateCreateConfig(config);
    if (errors.length) {
      return { ok: false, message: errors.join(" ") };
    }

    const tournament = createTournament(config);
    refreshDerivedMatches(tournament);
    tournament.updatedAt = nowIso();
    state.store.tournament = tournament;
    clearTransientMatchShortcutState();
    state.activeTab = "matches";
    state.store.ui.activeTab = "matches";
    schedulePersist();
    renderShell();
    return { ok: true, tournament };
  }


  function resetTournamentSession() {
    state.store.tournament = null;
    clearTransientMatchShortcutState();
    state.apiAutomation.startingMatchId = "";
    state.apiAutomation.authBackoffUntil = 0;
    state.activeTab = "tournament";
    state.store.ui.activeTab = "tournament";
    schedulePersist();
    renderShell();
    return { ok: true };
  }


  function importTournamentPayload(rawObject) {
    if (!rawObject || typeof rawObject !== "object") {
      return { ok: false, message: "JSON ist leer oder ungültig." };
    }

    let tournament = rawObject.tournament || null;
    if (!tournament && rawObject.mode && rawObject.participants) {
      tournament = rawObject;
    }

    const normalizedTournament = normalizeTournament(
      tournament,
      state.store.settings.featureFlags.koDrawLockDefault !== false,
    );
    if (!normalizedTournament) {
      return { ok: false, message: "Turnierdaten konnten nicht validiert werden." };
    }

    const participantCountError = getParticipantCountError(normalizedTournament.mode, normalizedTournament.participants.length);
    if (participantCountError) {
      return { ok: false, message: participantCountError };
    }

    refreshDerivedMatches(normalizedTournament);
    normalizedTournament.updatedAt = nowIso();
    state.store.tournament = normalizedTournament;
    clearTransientMatchShortcutState();
    state.activeTab = "matches";
    state.store.ui.activeTab = "matches";
    schedulePersist();
    renderShell();
    return { ok: true, tournament: normalizedTournament };
  }


  function setTournamentTieBreakProfile(profile) {
    const tournament = state.store.tournament;
    if (!tournament) {
      return { ok: false, message: "Kein aktives Turnier vorhanden." };
    }

    const result = applyTournamentTieBreakProfile(tournament, profile);
    if (!result.ok || !result.changed) {
      return result;
    }

    finalizeTournamentMutation(tournament);
    return result;
  }


  function setTournamentKoDrawLocked(drawLocked, options = {}) {
    const tournament = state.store.tournament;
    if (!tournament) {
      return { ok: false, message: "Kein aktives Turnier vorhanden." };
    }

    const currentDrawLocked = tournament?.ko?.drawLocked !== false;
    const nextDrawLocked = Boolean(drawLocked);
    const pendingOverride = getPendingDrawUnlockOverrideForTournament(tournament.id);
    const requestedToken = normalizeText(options?.confirmOverrideToken || "");
    let allowUnlockOverride = false;
    if (currentDrawLocked && !nextDrawLocked && requestedToken) {
      if (!pendingOverride || pendingOverride.token !== requestedToken) {
        return {
          ok: false,
          changed: false,
          reasonCode: "draw_unlock_override_invalid",
          message: "Promoter-Override ist ungültig oder abgelaufen. Bitte Entsperren erneut starten.",
        };
      }
      allowUnlockOverride = true;
    }

    const result = applyTournamentKoDrawLocked(tournament, nextDrawLocked, {
      allowUnlockOverride,
    });
    if (!result.ok && result.reasonCode === "draw_unlock_requires_override") {
      const override = issuePendingDrawUnlockOverride(tournament.id);
      return {
        ...result,
        override,
      };
    }
    if (!result.ok || !result.changed) {
      return result;
    }

    clearPendingDrawUnlockOverride(tournament.id);
    finalizeTournamentMutation(tournament);
    return result;
  }

