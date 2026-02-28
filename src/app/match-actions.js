// App layer: runtime orchestration, persistence scheduling and user feedback.

  function updateMatchResult(matchId, winnerId, legs, source, stats = null) {
    const tournament = state.store.tournament;
    if (!tournament) {
      return { ok: false, message: "Kein aktives Turnier vorhanden." };
    }

    const result = applyMatchResultToTournament(tournament, matchId, winnerId, legs, source, stats);
    if (!result.ok) {
      return result;
    }

    refreshDerivedMatches(tournament);
    tournament.updatedAt = nowIso();
    schedulePersist();
    renderShell();
    return { ok: true };
  }

