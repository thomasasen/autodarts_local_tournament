  test("Bracket payload: Platz-3-Spiel setzt consolationFinal und getrennte Gruppen", () => {
    const tournament = createKoTournament(participantList(4, "BP"), { enableThirdPlaceMatch: true });
    const semifinals = getMatchesByStage(tournament, MATCH_STAGE_KO).filter((match) => match.round === 1);
    const res1 = applyMatchResultToTournament(tournament, semifinals[0].id, semifinals[0].player1Id, { p1: 2, p2: 0 }, "manual");
    const res2 = applyMatchResultToTournament(tournament, semifinals[1].id, semifinals[1].player2Id, { p1: 1, p2: 2 }, "manual");
    assert(res1.ok, res1.message || "Semi 1 konnte nicht gespeichert werden.");
    assert(res2.ok, res2.message || "Semi 2 konnte nicht gespeichert werden.");
    synchronizeKoBracketState(tournament);

    const thirdPlace = getMatchesByStage(tournament, MATCH_STAGE_KO)
      .find((match) => normalizeText(match?.meta?.bracket?.matchRole || "") === "third_place");
    const final = getMatchesByStage(tournament, MATCH_STAGE_KO)
      .find((match) => Number(match?.meta?.bracket?.placementRank) === 1);
    assert(Boolean(thirdPlace), "Spiel um Platz 3 erwartet.");
    assert(Boolean(final), "Finale erwartet.");

    const payload = buildBracketPayload(tournament);
    assert(Boolean(payload), "Bracket-Payload erwartet.");
    assertEqual(payload.stages?.[0]?.settings?.consolationFinal, true);

    const payloadFinal = payload.matches.find((match) => match.id === final.id);
    const payloadThirdPlace = payload.matches.find((match) => match.id === thirdPlace.id);
    assert(Boolean(payloadFinal), "Finale im Payload erwartet.");
    assert(Boolean(payloadThirdPlace), "Platz-3-Spiel im Payload erwartet.");
    assertEqual(payloadFinal.group_id, 1);
    assertEqual(payloadThirdPlace.group_id, 2);
  });


  test("Bracket payload: klassisches KO bleibt ohne consolationFinal", () => {
    const tournament = createKoTournament(participantList(4, "BN"));
    const payload = buildBracketPayload(tournament);
    assert(Boolean(payload), "Bracket-Payload erwartet.");
    assertEqual(payload.stages?.[0]?.settings?.consolationFinal, false);
    assert(payload.matches.every((match) => match.group_id === 1), "Klassisches KO darf keine Zusatzgruppen enthalten.");
  });

