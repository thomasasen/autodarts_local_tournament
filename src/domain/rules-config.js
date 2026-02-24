// Auto-generated module split from dist source.
  function setTournamentTieBreakMode(mode) {
    const tournament = state.store.tournament;
    if (!tournament) {
      return { ok: false, message: "Kein aktives Turnier vorhanden." };
    }
    const nextMode = normalizeTieBreakMode(mode, TIE_BREAK_MODE_DRA_STRICT);
    const currentMode = normalizeTieBreakMode(tournament?.rules?.tieBreakMode, TIE_BREAK_MODE_DRA_STRICT);
    if (nextMode === currentMode) {
      return { ok: true, changed: false };
    }
    tournament.rules = normalizeTournamentRules({
      ...(tournament.rules || {}),
      tieBreakMode: nextMode,
    });
    refreshDerivedMatches(tournament);
    tournament.updatedAt = nowIso();
    schedulePersist();
    renderShell();
    return { ok: true, changed: true };
  }


