  test("KO engine: 9 Teilnehmer erzeugen genau ein offenes Match in Runde 1", () => {
    const tournament = createKoTournament(participantList(9, "K9"));
    const openRoundOne = getMatchesByStage(tournament, MATCH_STAGE_KO)
      .filter((match) => match.round === 1 && match.player1Id && match.player2Id && !isByeMatchResult(match));
    assertEqual(openRoundOne.length, 1);
  });


  test("KO labels: offizielle Endphasen werden aus der Feldgroesse abgeleitet", () => {
    assertEqual(getKoRoundLabel(1, 4), "Achtelfinale");
    assertEqual(getKoRoundLabel(2, 4), "Viertelfinale");
    assertEqual(getKoRoundLabel(3, 4), "Halbfinale");
    assertEqual(getKoRoundLabel(4, 4), "Finale");
  });


  test("KO labels: fruehe grosse Felder bleiben bei Letzte N", () => {
    assertEqual(getKoRoundLabel(1, 5), "Letzte 32");
    assertEqual(getKoRoundLabel(1, 6), "Letzte 64");
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


  test("KO engine: blockierende Vorgaenger werden mit offizieller Phase benannt", () => {
    const tournament = createKoTournament(participantList(4, "BL"));
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    const semi1 = koMatches.find((match) => match.round === 1 && match.number === 1);
    const semi2 = koMatches.find((match) => match.round === 1 && match.number === 2);
    const final = koMatches.find((match) => match.round === 2 && match.number === 1);
    final.player1Id = semi1.player1Id;
    final.player2Id = semi2.player1Id;
    const playability = getMatchEditability(tournament, final);
    assertEqual(playability.editable, false);
    assertEqual(playability.reason, "Vorgänger-Match Halbfinale / Spiel 1 muss zuerst abgeschlossen werden.");
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


  test("Doppel-KO: 8 Teilnehmer erzeugen Winners, Losers und Grand Final", () => {
    const tournament = createDoubleKoTournament(participantList(8, "D8"));
    synchronizeKoBracketState(tournament);
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    const winners = koMatches.filter((match) => normalizeText(match?.meta?.bracket?.bracketSide || "") === "winners");
    const losers = koMatches.filter((match) => normalizeText(match?.meta?.bracket?.bracketSide || "") === "losers");
    const finals = koMatches.filter((match) => normalizeText(match?.meta?.bracket?.bracketSide || "") === "finals");

    assertEqual(tournament.mode, "double_ko");
    assertEqual(tournament.ko?.grandFinalResetMode, GRAND_FINAL_RESET_IF_NEEDED);
    assertEqual(winners.length, 7);
    assertEqual(losers.length, 6);
    assertEqual(finals.length, 1);
    assert(Boolean(findMatch(tournament, "wb-r1-m1")), "Winners-Bracket Match erwartet.");
    assert(Boolean(findMatch(tournament, "lb-r1-m1")), "Losers-Bracket Match erwartet.");
    assert(Boolean(findMatch(tournament, "gf-r1-m1")), "Grand Final erwartet.");
  });


  test("Doppel-KO: 6 Teilnehmer bleiben mit Byes stabil", () => {
    const tournament = createDoubleKoTournament(participantList(6, "D6"));
    for (let i = 0; i < 8; i += 1) {
      synchronizeKoBracketState(tournament);
      normalizeCompletedMatchResults(tournament);
    }
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    assertEqual(koMatches.some((match) => match.player1Id === match.player2Id && match.player1Id), false);
    assert(Boolean(findMatch(tournament, "gf-r1-m1")), "Grand Final muss vorhanden bleiben.");
  });


  test("Doppel-KO: Lower-Bracket-Sieger erzwingt Reset-Finale wenn konfiguriert", () => {
    const tournament = createDoubleKoTournament(participantList(2, "DR"), {
      grandFinalResetMode: GRAND_FINAL_RESET_IF_NEEDED,
    });
    synchronizeKoBracketState(tournament);
    const winnersFinal = findMatch(tournament, "wb-r1-m1");
    assert(Boolean(winnersFinal), "Winners Final erwartet.");
    let result = applyMatchResultToTournament(tournament, winnersFinal.id, winnersFinal.player1Id, { p1: 2, p2: 0 }, "manual");
    assert(result.ok, result.message || "Winners Final konnte nicht gespeichert werden.");
    synchronizeKoBracketState(tournament);
    const grandFinal = findMatch(tournament, "gf-r1-m1");
    assertEqual(grandFinal.player1Id, winnersFinal.player1Id);
    assertEqual(grandFinal.player2Id, winnersFinal.player2Id);
    result = applyMatchResultToTournament(tournament, grandFinal.id, grandFinal.player2Id, { p1: 0, p2: 2 }, "manual");
    assert(result.ok, result.message || "Grand Final konnte nicht gespeichert werden.");
    synchronizeKoBracketState(tournament);

    const resetFinal = findMatch(tournament, "gf-r2-m1");
    assert(Boolean(resetFinal), "Reset Final muss nach Grand-Final-Sieg des Lower-Spielers entstehen.");
    assertEqual(resetFinal.player1Id, grandFinal.player1Id);
    assertEqual(resetFinal.player2Id, grandFinal.player2Id);
  });


  test("Doppel-KO: Winners-Bracket-Sieger beendet Grand Final ohne Reset", () => {
    const tournament = createDoubleKoTournament(participantList(2, "DW"), {
      grandFinalResetMode: GRAND_FINAL_RESET_IF_NEEDED,
    });
    synchronizeKoBracketState(tournament);
    const winnersFinal = findMatch(tournament, "wb-r1-m1");
    let result = applyMatchResultToTournament(tournament, winnersFinal.id, winnersFinal.player1Id, { p1: 2, p2: 0 }, "manual");
    assert(result.ok, result.message || "Winners Final konnte nicht gespeichert werden.");
    synchronizeKoBracketState(tournament);
    const grandFinal = findMatch(tournament, "gf-r1-m1");
    result = applyMatchResultToTournament(tournament, grandFinal.id, grandFinal.player1Id, { p1: 2, p2: 0 }, "manual");
    assert(result.ok, result.message || "Grand Final konnte nicht gespeichert werden.");
    synchronizeKoBracketState(tournament);
    assertEqual(Boolean(findMatch(tournament, "gf-r2-m1")), false);
  });


  test("Doppel-KO: single_match erzeugt nie ein Reset-Finale", () => {
    const tournament = createDoubleKoTournament(participantList(2, "DS"), {
      grandFinalResetMode: GRAND_FINAL_RESET_SINGLE_MATCH,
    });
    synchronizeKoBracketState(tournament);
    const winnersFinal = findMatch(tournament, "wb-r1-m1");
    let result = applyMatchResultToTournament(tournament, winnersFinal.id, winnersFinal.player1Id, { p1: 2, p2: 0 }, "manual");
    assert(result.ok, result.message || "Winners Final konnte nicht gespeichert werden.");
    synchronizeKoBracketState(tournament);
    const grandFinal = findMatch(tournament, "gf-r1-m1");
    result = applyMatchResultToTournament(tournament, grandFinal.id, grandFinal.player2Id, { p1: 0, p2: 2 }, "manual");
    assert(result.ok, result.message || "Grand Final konnte nicht gespeichert werden.");
    synchronizeKoBracketState(tournament);
    assertEqual(Boolean(findMatch(tournament, "gf-r2-m1")), false);
  });
