  test("KO engine: 9 Teilnehmer erzeugen genau ein offenes Match in Runde 1", () => {
    const tournament = createKoTournament(participantList(9, "K9"));
    const openRoundOne = getMatchesByStage(tournament, MATCH_STAGE_KO)
      .filter((match) => match.round === 1 && match.player1Id && match.player2Id && !isByeMatchResult(match));
    assertEqual(openRoundOne.length, 1);
  });


  test("KO engine: Draw-Lock haelt die KO-Struktur stabil", () => {
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
    assert(changed, "Fortschreibung der Gewinner sollte Aenderungen erzeugen.");
    assertEqual(final.player1Id, semi1.player1Id);
    assertEqual(final.player2Id, semi2.player2Id);
  });


  test("KO engine: Default bleibt ohne Spiel um Platz 3 unveraendert", () => {
    const tournament = createKoTournament(participantList(4, "NF"));
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    const thirdPlace = koMatches.find((match) => normalizeText(match?.meta?.bracket?.matchRole || "") === "third_place");
    assertEqual(Boolean(thirdPlace), false);
    assertEqual(koMatches.length, 3);
    assertEqual(tournament.ko?.enableThirdPlaceMatch, false);
  });


  test("KO engine: Spiel um Platz 3 nutzt Halbfinal-Verlierer und beeinflusst Finale nicht", () => {
    const tournament = createKoTournament(participantList(4, "TP"), { enableThirdPlaceMatch: true });
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    const semifinals = koMatches
      .filter((match) => match.round === 1)
      .sort((left, right) => left.number - right.number);
    const final = koMatches.find((match) => Number(match?.meta?.bracket?.placementRank) === 1);
    const thirdPlace = koMatches.find((match) => normalizeText(match?.meta?.bracket?.matchRole || "") === "third_place");

    assert(Boolean(final), "Finale erwartet.");
    assert(Boolean(thirdPlace), "Spiel um Platz 3 erwartet.");
    assertEqual(koMatches.length, 4);
    assertEqual(tournament.ko?.enableThirdPlaceMatch, true);
    assertEqual(semifinals.length, 2);
    assertEqual(semifinals[0]?.meta?.bracket?.advancesLoserTo, thirdPlace.id);
    assertEqual(semifinals[1]?.meta?.bracket?.advancesLoserTo, thirdPlace.id);

    const semi1Winner = semifinals[0].player1Id;
    const semi2Winner = semifinals[1].player2Id;
    const semi1Loser = semifinals[0].player2Id;
    const semi2Loser = semifinals[1].player1Id;
    const res1 = applyMatchResultToTournament(tournament, semifinals[0].id, semi1Winner, { p1: 2, p2: 0 }, "manual");
    const res2 = applyMatchResultToTournament(tournament, semifinals[1].id, semi2Winner, { p1: 1, p2: 2 }, "manual");
    assert(res1.ok, res1.message || "Semi 1 konnte nicht abgeschlossen werden.");
    assert(res2.ok, res2.message || "Semi 2 konnte nicht abgeschlossen werden.");

    const changed = synchronizeKoBracketState(tournament);
    assert(changed, "KO-Sync sollte Final- und Bronze-Slots belegen.");

    assertEqual(final.player1Id, semi1Winner);
    assertEqual(final.player2Id, semi2Winner);
    assertEqual(thirdPlace.player1Id, semi1Loser);
    assertEqual(thirdPlace.player2Id, semi2Loser);
  });


  test("KO engine: Bye-Szenario erzeugt keinen kaputten Platz-3-Pfad", () => {
    const tournament = createKoTournament(participantList(3, "BY"), { enableThirdPlaceMatch: true });
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    const thirdPlace = koMatches.find((match) => normalizeText(match?.meta?.bracket?.matchRole || "") === "third_place");
    assertEqual(Boolean(thirdPlace), false);
    assertEqual(koMatches.length, 3);
  });


  test("KO engine: Alt-Daten ohne Bronze-Flag bleiben gueltig", () => {
    const tournament = createKoTournament(participantList(8, "LG"));
    const legacySnapshot = cloneSerializable(tournament);
    delete legacySnapshot.ko.enableThirdPlaceMatch;

    const normalized = normalizeTournament(legacySnapshot, true);
    assert(Boolean(normalized), "Legacy-Turnier sollte normalisierbar bleiben.");
    assertEqual(normalized.ko.enableThirdPlaceMatch, false);
  });


  test("KO engine: Migration hebt Legacy-KO auf Engine v3", () => {
    const tournament = createKoTournament(participantList(8, "MV"));
    tournament.ko = {
      ...cloneSerializable(tournament.ko),
      engineVersion: 2,
    };

    const changed = migrateKoTournamentToV3(tournament, KO_DRAW_MODE_SEEDED);
    assert(changed, "Legacy-KO muss als geaendert erkannt werden.");
    assertEqual(tournament.ko.engineVersion, KO_ENGINE_VERSION);
    assertEqual(tournament.ko.drawLocked, true);
    assertEqual(tournament.ko.enableThirdPlaceMatch, false);
  });

