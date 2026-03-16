// Auto-generated module split from dist source.
  function hasRelevantCompletedTieBreakMatch(tournament) {
    const matches = Array.isArray(tournament?.matches) ? tournament.matches : [];
    return matches.some((match) => (
      match?.status === STATUS_COMPLETED
      && (match.stage === MATCH_STAGE_GROUP || match.stage === MATCH_STAGE_LEAGUE)
    ));
  }


  function applyTournamentTieBreakProfile(tournament, profile) {
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
    if (hasRelevantCompletedTieBreakMatch(tournament)) {
      return {
        ok: false,
        changed: false,
        reasonCode: "tie_break_locked",
        message: `Tie-Break-Profil ist gesperrt, sobald ein Gruppen- oder Liga-Ergebnis abgeschlossen wurde (DRA 6.16.1). Siehe: ${DRA_GUI_RULE_TIE_BREAK_URL}`,
      };
    }
    tournament.rules = normalizeTournamentRules({
      ...(tournament.rules || {}),
      tieBreakProfile: nextProfile,
    });
    return { ok: true, changed: true };
  }


  function applyTournamentKoDrawLocked(tournament, drawLocked, options = {}) {
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
    const allowUnlockOverride = Boolean(options?.allowUnlockOverride);
    if (!nextDrawLocked && currentDrawLocked && !allowUnlockOverride) {
      return {
        ok: false,
        changed: false,
        reasonCode: "draw_unlock_requires_override",
        message: `Draw-Lock bleibt aktiv. Zum Entsperren ist ein expliziter Promoter-Override erforderlich (DRA 6.12.1). Siehe: ${DRA_GUI_RULE_DRAW_LOCK_URL}`,
      };
    }
    tournament.ko = normalizeTournamentKoMeta({
      ...(tournament.ko || {}),
      drawLocked: nextDrawLocked,
    }, normalizeKoDrawMode(tournament?.ko?.drawMode, KO_DRAW_MODE_SEEDED), nextDrawLocked);
    return { ok: true, changed: true };
  }


