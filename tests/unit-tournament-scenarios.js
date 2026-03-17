  function runKoDerivations(tournament) {
    for (let i = 0; i < 10; i += 1) {
      let changed = false;
      changed = synchronizeKoBracketState(tournament) || changed;
      changed = normalizeCompletedMatchResults(tournament) || changed;
      changed = advanceKoWinners(tournament) || changed;
      changed = synchronizeKoBracketState(tournament) || changed;
      changed = refreshTournamentResultsIndex(tournament) || changed;
      if (!changed) {
        break;
      }
    }
  }


  function runGroupsKoDerivations(tournament) {
    for (let i = 0; i < 10; i += 1) {
      let changed = false;
      changed = resolveGroupsToKoAssignments(tournament) || changed;
      changed = normalizeCompletedMatchResults(tournament) || changed;
      changed = advanceKoWinners(tournament) || changed;
      changed = resolveGroupsToKoAssignments(tournament) || changed;
      changed = refreshTournamentResultsIndex(tournament) || changed;
      if (!changed) {
        break;
      }
    }
  }


  function completeMatchByWinner(tournament, match, winnerId, source = "manual") {
    const legs = winnerId === match.player1Id
      ? { p1: 2, p2: 0 }
      : { p1: 0, p2: 2 };
    const result = applyMatchResultToTournament(tournament, match.id, winnerId, legs, source);
    assert(result.ok, result.message || `Match ${match.id} konnte nicht abgeschlossen werden.`);
  }


  test("Scenario KO (DRA Bye): Seeded 9 Teilnehmer erzeugen genau 1 offenes R1-Match und 7 Byes", () => {
    const tournament = createKoTournament(participantList(9, "S9"), { randomizeKoRound1: false });
    runKoDerivations(tournament);

    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    const roundOne = koMatches.filter((match) => match.round === 1);
    const openRoundOne = roundOne.filter((match) => match.player1Id && match.player2Id && !isByeMatchResult(match));
    const byeRoundOne = roundOne.filter((match) => isByeMatchResult(match));
    const openPair = openRoundOne[0];
    const openPairSorted = [openPair?.player1Id, openPair?.player2Id].filter(Boolean).sort();

    assertEqual(koMatches.length, 15, "9 Spieler im 16er-Baum muessen 15 Match-Knoten ergeben.");
    assertEqual(openRoundOne.length, 1, "Es muss genau ein offenes Match in Runde 1 geben.");
    assertEqual(byeRoundOne.length, 7, "Es muessen genau 7 Byes in Runde 1 entstehen.");
    assertDeepEqual(openPairSorted, ["S98", "S99"]);
  });


  test("Scenario KO (Open Draw): deterministisch bei gleichem Teilnehmerfeld", () => {
    const participants = participantList(12, "OD");
    const left = createKoTournament(cloneSerializable(participants), { randomizeKoRound1: true });
    const right = createKoTournament(cloneSerializable(participants), { randomizeKoRound1: true });
    runKoDerivations(left);
    runKoDerivations(right);

    const signature = (tournament) => getMatchesByStage(tournament, MATCH_STAGE_KO)
      .filter((match) => match.round === 1)
      .map((match) => `${match.number}:${match.player1Id || "-"}:${match.player2Id || "-"}:${isByeMatchResult(match) ? "bye" : "match"}`)
      .join("|");

    assertEqual(signature(left), signature(right), "Open Draw muss deterministisch reproduzierbar bleiben.");
  });


  test("Scenario KO (Straight Knockout): kompletter Turnierlauf endet mit Champion und 7 Ergebnissen", () => {
    const tournament = createKoTournament(participantList(8, "K8"), { randomizeKoRound1: false });
    runKoDerivations(tournament);

    for (const round of [1, 2, 3]) {
      const openMatches = getMatchesByStage(tournament, MATCH_STAGE_KO)
        .filter((match) => match.round === round && match.status === STATUS_PENDING && match.player1Id && match.player2Id);
      openMatches.forEach((match) => {
        completeMatchByWinner(tournament, match, match.player1Id);
      });
      runKoDerivations(tournament);
    }

    const final = getMatchesByStage(tournament, MATCH_STAGE_KO).find((match) => match.round === 3 && match.number === 1);
    const completed = getMatchesByStage(tournament, MATCH_STAGE_KO).filter((match) => match.status === STATUS_COMPLETED);

    assert(Boolean(final?.winnerId), "Finale muss einen Sieger liefern.");
    assertEqual(completed.length, 7, "8er-KO muss mit 7 abgeschlossenen Matches enden.");
    assertEqual(tournament.results.length, 7, "Ergebnisindex muss alle abgeschlossenen KO-Matches enthalten.");
    assertEqual(tournament.results[tournament.results.length - 1]?.matchId, final.id);
  });


  test("Scenario KO + Platz 3: Finale und Bronze sind getrennte Pfade", () => {
    const tournament = createKoTournament(participantList(4, "TP"), {
      randomizeKoRound1: false,
      enableThirdPlaceMatch: true,
    });
    runKoDerivations(tournament);

    const semi1 = findMatch(tournament, "ko-r1-m1");
    const semi2 = findMatch(tournament, "ko-r1-m2");
    completeMatchByWinner(tournament, semi1, semi1.player1Id);
    completeMatchByWinner(tournament, semi2, semi2.player2Id);
    runKoDerivations(tournament);

    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    const final = koMatches.find((match) => Number(match?.meta?.bracket?.placementRank) === 1);
    const thirdPlace = koMatches.find((match) => normalizeText(match?.meta?.bracket?.matchRole || "") === "third_place");
    assert(Boolean(final), "Finale erwartet.");
    assert(Boolean(thirdPlace), "Spiel um Platz 3 erwartet.");
    assertEqual(final.player1Id, semi1.player1Id);
    assertEqual(final.player2Id, semi2.player2Id);
    assertEqual(thirdPlace.player1Id, semi1.player2Id);
    assertEqual(thirdPlace.player2Id, semi2.player1Id);

    completeMatchByWinner(tournament, final, final.player1Id);
    completeMatchByWinner(tournament, thirdPlace, thirdPlace.player2Id);
    runKoDerivations(tournament);

    assertEqual(final.status, STATUS_COMPLETED);
    assertEqual(thirdPlace.status, STATUS_COMPLETED);
    assertEqual(final.winnerId, final.player1Id);
    assertEqual(thirdPlace.winnerId, thirdPlace.player2Id);
    assertEqual(tournament.results.length, 4, "4er-KO mit Platz-3-Spiel muss 4 Ergebnisse liefern.");
  });


  test("Scenario League (DRA 6.16.1): volle Round-Robin-Wertung liefert erwartete Reihenfolge", () => {
    const tournament = createLeagueTournament(participantList(4, "L"), { bestOfLegs: 3 });
    const winnerByPair = new Map([
      ["L1|L2", "L1"],
      ["L1|L3", "L1"],
      ["L1|L4", "L1"],
      ["L2|L3", "L2"],
      ["L2|L4", "L2"],
      ["L3|L4", "L3"],
    ]);

    tournament.matches.forEach((match) => {
      const pairKey = [match.player1Id, match.player2Id].sort().join("|");
      const winnerId = winnerByPair.get(pairKey);
      assert(Boolean(winnerId), `Kein Sieger fuer Paarung ${pairKey} definiert.`);
      completeMatchByWinner(tournament, match, winnerId);
    });

    const rows = standingsForMatches(tournament, tournament.matches);
    const ranking = rows.map((row) => row.id);
    const points = rows.map((row) => row.points);

    assertDeepEqual(ranking, ["L1", "L2", "L3", "L4"]);
    assertDeepEqual(points, [6, 4, 2, 0]);
  });


  test("Scenario League Deadlock (DRA 6.16.1): unaufloesbarer Gleichstand markiert playoff_required", () => {
    const tournament = {
      id: "league-deadlock",
      name: "League Deadlock",
      mode: "league",
      ko: null,
      bestOfLegs: 3,
      startScore: 501,
      x01: buildPresetX01Settings(X01_PRESET_PDC_501_DOUBLE_OUT_BASIC),
      rules: normalizeTournamentRules({ tieBreakProfile: TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE }),
      participants: [{ id: "A", name: "A" }, { id: "B", name: "B" }, { id: "C", name: "C" }],
      groups: [],
      matches: [
        createMatch({ id: "m-ab", stage: MATCH_STAGE_LEAGUE, round: 1, number: 1, player1Id: "A", player2Id: "B", status: STATUS_COMPLETED, winnerId: "A", legs: { p1: 2, p2: 1 } }),
        createMatch({ id: "m-bc", stage: MATCH_STAGE_LEAGUE, round: 2, number: 1, player1Id: "B", player2Id: "C", status: STATUS_COMPLETED, winnerId: "B", legs: { p1: 2, p2: 1 } }),
        createMatch({ id: "m-ca", stage: MATCH_STAGE_LEAGUE, round: 3, number: 1, player1Id: "C", player2Id: "A", status: STATUS_COMPLETED, winnerId: "C", legs: { p1: 2, p2: 1 } }),
      ],
      results: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    const rows = standingsForMatches(tournament, tournament.matches, ["A", "B", "C"]);
    assert(rows.every((row) => row.tiebreakState === "playoff_required"), "Alle Zeilen muessen playoff_required markieren.");
  });


  test("Scenario Groups+KO (DRA mode mix): Gruppenaufloesung belegt Kreuz-Halbfinale und Finale korrekt", () => {
    const tournament = createTournament({
      name: "GroupsKO Happy Path",
      mode: "groups_ko",
      bestOfLegs: 3,
      startScore: 501,
      x01Preset: X01_PRESET_CUSTOM,
      x01InMode: "Straight",
      x01OutMode: "Double",
      x01BullMode: "25/50",
      x01MaxRounds: 50,
      x01BullOffMode: "Normal",
      lobbyVisibility: "private",
      randomizeKoRound1: false,
      participants: participantList(4, "G"),
    });

    const groupA = findMatch(tournament, "group-A-r1-m1");
    const groupB = findMatch(tournament, "group-B-r1-m1");
    completeMatchByWinner(tournament, groupA, "G1");
    completeMatchByWinner(tournament, groupB, "G4");
    runGroupsKoDerivations(tournament);

    const semi1 = findMatch(tournament, "ko-r1-m1");
    const semi2 = findMatch(tournament, "ko-r1-m2");
    assertDeepEqual([semi1.player1Id, semi1.player2Id], ["G1", "G2"]);
    assertDeepEqual([semi2.player1Id, semi2.player2Id], ["G4", "G3"]);

    completeMatchByWinner(tournament, semi1, "G1");
    completeMatchByWinner(tournament, semi2, "G4");
    runGroupsKoDerivations(tournament);

    const final = findMatch(tournament, "ko-r2-m1");
    assertDeepEqual([final.player1Id, final.player2Id], ["G1", "G4"]);
    completeMatchByWinner(tournament, final, "G1");
    runGroupsKoDerivations(tournament);

    assertEqual(final.status, STATUS_COMPLETED);
    assertEqual(final.winnerId, "G1");
    assertEqual(tournament.results[tournament.results.length - 1]?.matchId, "ko-r2-m1");
  });


  test("Scenario Groups+KO Deadlock: playoff_required blockiert KO-Belegung", () => {
    const tournament = createTournament({
      name: "GroupsKO Deadlock",
      mode: "groups_ko",
      bestOfLegs: 3,
      startScore: 501,
      x01Preset: X01_PRESET_CUSTOM,
      x01InMode: "Straight",
      x01OutMode: "Double",
      x01BullMode: "25/50",
      x01MaxRounds: 50,
      x01BullOffMode: "Normal",
      lobbyVisibility: "private",
      randomizeKoRound1: false,
      participants: participantList(6, "D"),
    });

    const winnerByPair = new Map([
      ["D1|D3", "D1"],
      ["D3|D5", "D3"],
      ["D1|D5", "D5"],
      ["D2|D4", "D2"],
      ["D2|D6", "D2"],
      ["D4|D6", "D4"],
    ]);

    tournament.matches
      .filter((match) => match.stage === MATCH_STAGE_GROUP)
      .forEach((match) => {
        const pairKey = [match.player1Id, match.player2Id].sort().join("|");
        const winnerId = winnerByPair.get(pairKey);
        assert(Boolean(winnerId), `Kein Sieger fuer Gruppenpaarung ${pairKey} definiert.`);
        completeMatchByWinner(tournament, match, winnerId);
      });

    runGroupsKoDerivations(tournament);
    const standings = groupStandingsMap(tournament);
    const groupAResolution = standings.get("A")?.groupResolution?.status;
    const semi1 = findMatch(tournament, "ko-r1-m1");
    const semi2 = findMatch(tournament, "ko-r1-m2");

    assertEqual(groupAResolution, "playoff_required");
    assertEqual(semi1.player1Id, null, "A1 darf bei Deadlock nicht in Halbfinale gesetzt werden.");
    assertEqual(semi2.player2Id, null, "A2 darf bei Deadlock nicht in Halbfinale gesetzt werden.");
  });


  test("Scenario Tie-Break lock (DRA 6.16.1): Profilwechsel nur vor erstem relevantem Ergebnis", () => {
    const tournament = createTournament({
      name: "TieBreak Lock Scenario",
      mode: "groups_ko",
      bestOfLegs: 3,
      startScore: 501,
      x01Preset: X01_PRESET_CUSTOM,
      x01InMode: "Straight",
      x01OutMode: "Double",
      x01BullMode: "25/50",
      x01MaxRounds: 50,
      x01BullOffMode: "Normal",
      lobbyVisibility: "private",
      randomizeKoRound1: false,
      participants: participantList(4, "T"),
    });

    const beforeResult = applyTournamentTieBreakProfile(tournament, TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF);
    assert(beforeResult.ok && beforeResult.changed, "Profilwechsel vor erstem Ergebnis muss erlaubt sein.");

    const firstGroupMatch = tournament.matches.find((match) => match.stage === MATCH_STAGE_GROUP);
    completeMatchByWinner(tournament, firstGroupMatch, firstGroupMatch.player1Id);
    runGroupsKoDerivations(tournament);

    const blocked = applyTournamentTieBreakProfile(tournament, TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE);
    assertEqual(blocked.ok, false);
    assertEqual(blocked.reasonCode, "tie_break_locked");
    assertEqual(tournament.rules.tieBreakProfile, TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF);
  });
