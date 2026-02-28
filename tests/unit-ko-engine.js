  test("KO engine: 9 Teilnehmer erzeugen genau ein offenes Match in Runde 1", () => {
    const tournament = createKoTournament(participantList(9, "K9"));
    const openRoundOne = getMatchesByStage(tournament, MATCH_STAGE_KO)
      .filter((match) => match.round === 1 && match.player1Id && match.player2Id && !isByeMatchResult(match));
    assertEqual(openRoundOne.length, 1);
  });


  test("KO engine: Draw-Lock hält die KO-Struktur stabil", () => {
    const tournament = createKoTournament(participantList(8, "DL"), { koDrawLocked: true });
    const before = JSON.stringify(tournament.ko?.rounds || []);
    tournament.participants = tournament.participants.slice().reverse();
    synchronizeKoBracketState(tournament);
    const after = JSON.stringify(tournament.ko?.rounds || []);
    assertEqual(after, before);
  });


  test("KO engine: Gewinnerfortschreibung belegt das Finale", () => {
    const tournament = createKoTournament(participantList(4, "AF"));
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    const semi1 = koMatches.find((match) => match.round === 1 && match.number === 1);
    const semi2 = koMatches.find((match) => match.round === 1 && match.number === 2);
    const final = koMatches.find((match) => match.round === 2 && match.number === 1);

    semi1.status = STATUS_COMPLETED;
    semi1.winnerId = semi1.player1Id;
    semi1.legs = { p1: 2, p2: 0 };
    semi2.status = STATUS_COMPLETED;
    semi2.winnerId = semi2.player2Id;
    semi2.legs = { p1: 1, p2: 2 };

    const changed = advanceKoWinners(tournament);
    assert(changed, "Fortschreibung der Gewinner sollte Änderungen erzeugen.");
    assertEqual(final.player1Id, semi1.player1Id);
    assertEqual(final.player2Id, semi2.player2Id);
  });


  test("KO engine: Migration hebt Legacy-KO auf Engine v3", () => {
    const tournament = createKoTournament(participantList(8, "MV"));
    tournament.ko = {
      ...cloneSerializable(tournament.ko),
      engineVersion: 2,
    };

    const changed = migrateKoTournamentToV3(tournament, KO_DRAW_MODE_SEEDED);
    assert(changed, "Legacy-KO muss als geändert erkannt werden.");
    assertEqual(tournament.ko.engineVersion, KO_ENGINE_VERSION);
    assertEqual(tournament.ko.drawLocked, true);
  });

