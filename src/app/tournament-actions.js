// App layer: runtime orchestration, persistence scheduling and user feedback.

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
    state.activeTab = "matches";
    state.store.ui.activeTab = "matches";
    schedulePersist();
    renderShell();
    return { ok: true, tournament };
  }


  function resetTournamentSession() {
    state.store.tournament = null;
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


  function setTournamentKoDrawLocked(drawLocked) {
    const tournament = state.store.tournament;
    if (!tournament) {
      return { ok: false, message: "Kein aktives Turnier vorhanden." };
    }

    const result = applyTournamentKoDrawLocked(tournament, drawLocked);
    if (!result.ok || !result.changed) {
      return result;
    }

    finalizeTournamentMutation(tournament);
    return result;
  }

