// Auto-generated module split from dist source.
  function setTournamentTieBreakProfile(profile) {
    const tournament = state.store.tournament;
    if (!tournament) {
      return { ok: false, message: "Kein aktives Turnier vorhanden." };
    }
    const nextProfile = normalizeTieBreakProfile(profile, TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE);
    const currentProfile = normalizeTieBreakProfile(
      tournament?.rules?.tieBreakProfile,
      TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE,
    );
    if (nextProfile === currentProfile) {
      return { ok: true, changed: false };
    }
    tournament.rules = normalizeTournamentRules({
      ...(tournament.rules || {}),
      tieBreakProfile: nextProfile,
    });
    refreshDerivedMatches(tournament);
    tournament.updatedAt = nowIso();
    schedulePersist();
    renderShell();
    return { ok: true, changed: true };
  }


  function setTournamentKoDrawLocked(drawLocked) {
    const tournament = state.store.tournament;
    if (!tournament) {
      return { ok: false, message: "Kein aktives Turnier vorhanden." };
    }
    if (tournament.mode !== "ko") {
      return { ok: false, message: "Draw-Lock ist nur im KO-Modus verfügbar." };
    }
    const nextDrawLocked = Boolean(drawLocked);
    const currentDrawLocked = tournament?.ko?.drawLocked !== false;
    if (nextDrawLocked === currentDrawLocked) {
      return { ok: true, changed: false };
    }
    tournament.ko = normalizeTournamentKoMeta({
      ...(tournament.ko || {}),
      drawLocked: nextDrawLocked,
    }, normalizeKoDrawMode(tournament?.ko?.drawMode, KO_DRAW_MODE_SEEDED), nextDrawLocked);
    refreshDerivedMatches(tournament);
    tournament.updatedAt = nowIso();
    schedulePersist();
    renderShell();
    return { ok: true, changed: true };
  }


