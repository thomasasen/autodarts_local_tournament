  test("Rules config: Tie-Break-Profil kann umgestellt werden", () => {
    const tournament = createLeagueTournament(participantList(4, "TB"));
    const result = applyTournamentTieBreakProfile(tournament, TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF);

    assert(result.ok && result.changed, "Profilwechsel sollte erfolgreich sein.");
    assertEqual(tournament.rules.tieBreakProfile, TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF);
  });


  test("Rules config: gleicher Tie-Break-Wert meldet changed=false", () => {
    const tournament = createLeagueTournament(participantList(4, "TS"));
    const result = applyTournamentTieBreakProfile(tournament, TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE);

    assert(result.ok, "Aufruf sollte erfolgreich bleiben.");
    assertEqual(result.changed, false);
  });


  test("Rules config: Draw-Lock ist nur im KO-Modus verfügbar", () => {
    const tournament = createLeagueTournament(participantList(4, "DK"));
    const result = applyTournamentKoDrawLocked(tournament, false);

    assertEqual(result.ok, false);
    assert(result.message.includes("KO-Modus"), "Fehlermeldung zum KO-Modus erwartet.");
  });


  test("Rules config: Draw-Lock toggelt auf dem übergebenen KO-Turnier", () => {
    const tournament = createKoTournament(participantList(8, "DT"), { koDrawLocked: true });
    const result = applyTournamentKoDrawLocked(tournament, false);

    assert(result.ok && result.changed, "Draw-Lock sollte umschaltbar sein.");
    assertEqual(tournament.ko.drawLocked, false);
  });

