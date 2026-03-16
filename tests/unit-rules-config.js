  test("Rules config: Tie-Break-Profil kann umgestellt werden", () => {
    const tournament = createLeagueTournament(participantList(4, "TB"));
    const result = applyTournamentTieBreakProfile(tournament, TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF);

    assert(result.ok && result.changed, "Profilwechsel sollte erfolgreich sein.");
    assertEqual(tournament.rules.tieBreakProfile, TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF);
  });


  test("Rules config: Tie-Break-Profil wird nach erstem Liga-/Gruppenergebnis gesperrt", () => {
    const tournament = createLeagueTournament(participantList(4, "TL"));
    const firstMatch = tournament.matches.find((match) => match.stage === MATCH_STAGE_LEAGUE);
    assert(Boolean(firstMatch), "Liga-Testturnier muss mindestens ein Liga-Match enthalten.");
    firstMatch.status = STATUS_COMPLETED;
    firstMatch.winnerId = firstMatch.player1Id;
    firstMatch.legs = { p1: 2, p2: 0 };

    const result = applyTournamentTieBreakProfile(tournament, TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF);
    assertEqual(result.ok, false);
    assertEqual(result.reasonCode, "tie_break_locked");
    assertEqual(tournament.rules.tieBreakProfile, TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE);
  });


  test("Rules config: gleicher Tie-Break-Wert meldet changed=false", () => {
    const tournament = createLeagueTournament(participantList(4, "TS"));
    const result = applyTournamentTieBreakProfile(tournament, TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE);

    assert(result.ok, "Aufruf sollte erfolgreich bleiben.");
    assertEqual(result.changed, false);
  });


  test("Rules config: Draw-Lock ist nur im KO-Modus verfuegbar", () => {
    const tournament = createLeagueTournament(participantList(4, "DK"));
    const result = applyTournamentKoDrawLocked(tournament, false);

    assertEqual(result.ok, false);
    assert(result.message.includes("KO-Modus"), "Fehlermeldung zum KO-Modus erwartet.");
  });


  test("Rules config: Draw-Lock entsperren erfordert Promoter-Override", () => {
    const tournament = createKoTournament(participantList(8, "DO"), { koDrawLocked: true });
    const blocked = applyTournamentKoDrawLocked(tournament, false);

    assertEqual(blocked.ok, false);
    assertEqual(blocked.reasonCode, "draw_unlock_requires_override");
    assertEqual(tournament.ko.drawLocked, true);
  });


  test("Rules config: Draw-Lock mit Promoter-Override entsperrbar", () => {
    const tournament = createKoTournament(participantList(8, "DT"), { koDrawLocked: true });
    const result = applyTournamentKoDrawLocked(tournament, false, { allowUnlockOverride: true });

    assert(result.ok && result.changed, "Draw-Lock sollte mit Override umschaltbar sein.");
    assertEqual(tournament.ko.drawLocked, false);
  });
