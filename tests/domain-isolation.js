  test("Domain isolation: createTournament works without runtime state", () => {
    const tournament = createKoTournament(participantList(8, "DI"));
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    assertEqual(koMatches.length, 7, "8er-KO muss 7 Match-Knoten enthalten.");
    assertEqual(typeof state, "undefined", "Domain-Harness darf keinen Runtime-State laden.");
  });


  test("Domain isolation: applyMatchResultToTournament works on plain tournament objects", () => {
    const tournament = createKoTournament(participantList(4, "DM"));
    const openMatch = getMatchesByStage(tournament, MATCH_STAGE_KO)
      .find((match) => match.player1Id && match.player2Id && match.status === STATUS_PENDING);
    assert(Boolean(openMatch), "Mindestens ein offenes Match erwartet.");

    const result = applyMatchResultToTournament(
      tournament,
      openMatch.id,
      openMatch.player1Id,
      { p1: 2, p2: 0 },
      "manual",
    );

    assert(result.ok, result.message || "Ergebnis konnte nicht rein funktional angewendet werden.");
    const updated = findMatch(tournament, openMatch.id);
    assertEqual(updated.status, STATUS_COMPLETED);
    assertEqual(updated.winnerId, openMatch.player1Id);
    assertDeepEqual(updated.legs, { p1: 2, p2: 0 });
  });


  test("Domain isolation: rules config mutates only the provided tournament", () => {
    const left = createLeagueTournament(participantList(4, "RL"));
    const right = createLeagueTournament(participantList(4, "RR"));

    const result = applyTournamentTieBreakProfile(left, TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF);
    assert(result.ok && result.changed, "Tie-Break-Profil sollte änderbar sein.");
    assertEqual(left.rules.tieBreakProfile, TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF);
    assertEqual(right.rules.tieBreakProfile, TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE);
  });

