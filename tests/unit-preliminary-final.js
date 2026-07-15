  function createPreliminaryFinalTournament(participantCount, overrides = {}) {
    const participants = participantList(participantCount);
    return createTournament({
      name: "Vorrunde Test",
      mode: "preliminary_final",
      bestOfLegs: 5,
      startScore: 501,
      x01Preset: X01_PRESET_CUSTOM,
      x01InMode: "Straight",
      x01OutMode: "Double",
      x01BullMode: "25/50",
      x01MaxRounds: 50,
      x01BullOffMode: "Normal",
      lobbyVisibility: "private",
      boardCount: 1,
      preliminaryMatchesPerParticipant: overrides.matchesPerParticipant ?? 4,
      preliminaryWinPoints: overrides.winPoints ?? 2,
      preliminaryDrawPoints: overrides.drawPoints ?? 1,
      preliminaryLossPoints: overrides.lossPoints ?? 0,
      finalStageType: overrides.finalStageType ?? "ko",
      finalStageQualifierCount: overrides.qualifierCount ?? Math.min(4, participantCount),
      finalStageBestOfLegs: overrides.finalBestOf ?? 5,
      participants,
    });
  }

  [
    [5, 4, true, 10],
    [7, 4, true, 14],
    [7, 6, true, 21],
    [7, 5, false, 0],
    [8, 5, true, 20],
    [6, 6, false, 0],
  ].forEach(([participantCount, matchCount, expectedOk, expectedTotal]) => {
    test(`Preliminary schedule: ${participantCount}/${matchCount}`, () => {
      const ids = participantList(participantCount).map((participant) => participant.id);
      const result = buildBalancedRegularPairings(ids, matchCount);
      assertEqual(result.ok, expectedOk);
      assertEqual(result.totalMatches, expectedTotal);
      if (!expectedOk) return;
      assert(Object.values(result.degreeByParticipantId).every((degree) => degree === matchCount), "Jeder Teilnehmer muss Grad k haben.");
      const pairs = new Set();
      result.edges.forEach((edge) => {
        assert(edge.player1Id !== edge.player2Id, "Keine Selbstpaarung.");
        const key = [edge.player1Id, edge.player2Id].sort().join("|");
        assert(!pairs.has(key), "Keine doppelte Paarung.");
        pairs.add(key);
      });
      result.rounds.forEach((round) => {
        const used = new Set();
        round.forEach((edge) => {
          assert(!used.has(edge.player1Id) && !used.has(edge.player2Id), "Scheduling-Runde darf Teilnehmer nicht doppelt enthalten.");
          used.add(edge.player1Id); used.add(edge.player2Id);
        });
      });
      assertDeepEqual(result, buildBalancedRegularPairings(ids, matchCount), "Plan muss deterministisch sein.");
    });
  });

  test("Preliminary schedule: 7/4 uses five scheduling rounds", () => {
    assertEqual(buildBalancedRegularPairings(participantList(7).map((entry) => entry.id), 4).scheduleRoundCount, 5);
  });

  test("Preliminary schedule: all 5-16 participant / 4-8 match combinations obey feasibility rules", () => {
    for (let participantCount = 5; participantCount <= 16; participantCount += 1) {
      for (let matchCount = 4; matchCount <= 8; matchCount += 1) {
        const expectedOk = matchCount < participantCount && (participantCount * matchCount) % 2 === 0;
        const ids = participantList(participantCount, `E${participantCount}-`).map((entry) => entry.id);
        const result = buildBalancedRegularPairings(ids, matchCount);
        assertEqual(result.ok, expectedOk, `Unerwartete Machbarkeit für n=${participantCount}, k=${matchCount}`);
        if (!expectedOk) continue;
        assertEqual(result.totalMatches, (participantCount * matchCount) / 2);
        assert(Object.values(result.degreeByParticipantId).every((degree) => degree === matchCount));
        const scheduledPairs = new Set();
        result.rounds.forEach((round) => {
          const usedParticipants = new Set();
          round.forEach((edge) => {
            assert(!usedParticipants.has(edge.player1Id) && !usedParticipants.has(edge.player2Id));
            usedParticipants.add(edge.player1Id);
            usedParticipants.add(edge.player2Id);
            assert(!scheduledPairs.has(edge.key));
            scheduledPairs.add(edge.key);
          });
        });
        assertEqual(scheduledPairs.size, result.totalMatches);
      }
    }
  });

  test("Fixed legs: valid aggregates and draw semantics", () => {
    const tournament = createPreliminaryFinalTournament(5);
    const match = getPreliminaryMatches(tournament)[0];
    assert(applyMatchResultToTournament(tournament, match.id, match.player1Id, { p1: 2, p2: 0 }, "manual").ok);
    clearMatchResult(match);
    const draw = applyMatchResultToTournament(tournament, match.id, null, { p1: 1, p2: 1 }, "manual");
    assert(draw.ok);
    assertEqual(match.winnerId, null);
    assertEqual(match.meta.resultKind, "draw");
    clearMatchResult(match);
    assert(applyMatchResultToTournament(tournament, match.id, match.player2Id, { p1: 0, p2: 2 }, "manual").ok);
    [[2, 1], [1, 0], [3, 0]].forEach(([p1, p2]) => {
      clearMatchResult(match);
      assert(!applyMatchResultToTournament(tournament, match.id, null, { p1, p2 }, "manual").ok);
    });
  });

  test("Fixed legs: leg 1 survives JSON normalization and duplicate indexes are blocked", () => {
    const tournament = createPreliminaryFinalTournament(5);
    const match = getPreliminaryMatches(tournament)[0];
    const first = applyFixedLegEntriesToTournament(tournament, match.id, [{ legIndex: 1, winnerId: match.player1Id }]);
    assert(first.ok && !first.completed);
    const roundtrip = normalizeTournament(JSON.parse(JSON.stringify(tournament)));
    const restored = findMatch(roundtrip, match.id);
    assertEqual(restored.meta.fixedLegs.entries.length, 1);
    assertEqual(restored.legs.p1, 1);
    const duplicate = applyFixedLegEntriesToTournament(roundtrip, match.id, [
      { legIndex: 1, winnerId: match.player1Id },
      { legIndex: 1, winnerId: match.player2Id },
    ]);
    assertEqual(duplicate.reasonCode, "fixed_leg_duplicate_or_invalid");
    const draw = applyFixedLegEntriesToTournament(roundtrip, match.id, [
      { legIndex: 1, winnerId: match.player1Id },
      { legIndex: 2, winnerId: match.player2Id },
    ]);
    assert(draw.ok && draw.completed);
    assertEqual(findMatch(roundtrip, match.id).meta.resultKind, "draw");
  });

  test("Fixed legs: normal KO still rejects draws", () => {
    const tournament = createKoTournament(participantList(2), { bestOfLegs: 3 });
    const match = getMatchesByStage(tournament, MATCH_STAGE_KO).find((entry) => !isByeMatchResult(entry));
    assert(!applyMatchResultToTournament(tournament, match.id, null, { p1: 1, p2: 1 }, "manual").ok);
  });

  test("Preliminary standings: configurable points, leg difference and unresolved tie", () => {
    const tournament = createPreliminaryFinalTournament(5, { winPoints: 3, drawPoints: 1, lossPoints: 0 });
    const match = getPreliminaryMatches(tournament)[0];
    applyMatchResultToTournament(tournament, match.id, null, { p1: 1, p2: 1 }, "manual");
    const rows = buildPreliminaryStandings(tournament);
    const row1 = rows.find((row) => row.id === match.player1Id);
    assertEqual(row1.points, 1);
    assertEqual(row1.legDifference, 0);
    assert(rows.some((row) => row.tiebreakState === "playoff_required"));
  });

  test("Preliminary standings: win, draw and loss update the full row", () => {
    const tournament = createPreliminaryFinalTournament(5, { winPoints: 3, drawPoints: 1, lossPoints: 0 });
    const targetId = tournament.participants[0].id;
    const matches = getPreliminaryMatches(tournament).filter((match) => match.player1Id === targetId || match.player2Id === targetId).slice(0, 3);
    const scoresForTarget = [[2, 0], [1, 1], [0, 2]];
    matches.forEach((match, index) => {
      const [targetLegs, opponentLegs] = scoresForTarget[index];
      const targetIsP1 = match.player1Id === targetId;
      const p1 = targetIsP1 ? targetLegs : opponentLegs;
      const p2 = targetIsP1 ? opponentLegs : targetLegs;
      const winnerId = p1 === p2 ? null : (p1 > p2 ? match.player1Id : match.player2Id);
      assert(applyMatchResultToTournament(tournament, match.id, winnerId, { p1, p2 }, "manual").ok);
    });
    const row = buildPreliminaryStandings(tournament).find((entry) => entry.id === targetId);
    assertDeepEqual({
      played: row.played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      points: row.points,
      legsFor: row.legsFor,
      legsAgainst: row.legsAgainst,
      legDifference: row.legDifference,
    }, {
      played: 3,
      wins: 1,
      draws: 1,
      losses: 1,
      points: 4,
      legsFor: 3,
      legsAgainst: 3,
      legDifference: 0,
    });
  });

  function completePreliminaryAndResolve(tournament) {
    getPreliminaryMatches(tournament).forEach((match) => {
      applyMatchResultToTournament(tournament, match.id, match.player1Id, { p1: 2, p2: 0 }, "manual");
    });
    const analysis = analyzePreliminaryQualification(tournament);
    if (!analysis.ok) {
      const resolution = recordPreliminaryQualificationResolution(tournament, analysis.rows.map((row) => row.id), "Test-Entscheidung");
      assert(resolution.ok, resolution.message);
    }
  }

  test("Final stage: KO is generated from standings seeds only after completion", () => {
    const tournament = createPreliminaryFinalTournament(7, { qualifierCount: 4 });
    assertEqual(generatePreliminaryFinalStage(tournament).reasonCode, "preliminary_not_completed");
    completePreliminaryAndResolve(tournament);
    const result = generatePreliminaryFinalStage(tournament);
    assert(result.ok, result.message);
    assertEqual(tournament.finalStage.seeding.length, 4);
    assert(getMatchesByStage(tournament, MATCH_STAGE_KO).length > 0);
    assertEqual(tournament.finalStage.bestOfLegs, 5);
  });

  test("Final stage: unresolved cutoff is blocked without random decision", () => {
    const tournament = createPreliminaryFinalTournament(7, { qualifierCount: 4 });
    getPreliminaryMatches(tournament).forEach((match) => {
      applyMatchResultToTournament(tournament, match.id, match.player1Id, { p1: 2, p2: 0 }, "manual");
    });
    const result = generatePreliminaryFinalStage(tournament);
    assertEqual(result.reasonCode, "final_stage_qualification_unresolved");
    assertEqual(getMatchesByStage(tournament, MATCH_STAGE_KO).length, 0);
  });

  test("Preliminary validation: scoring and final configuration reject unsafe values", () => {
    const base = {
      name: "Invalid",
      mode: "preliminary_final",
      participants: participantList(7),
      preliminaryMatchesPerParticipant: 4,
      preliminaryWinPoints: 2,
      preliminaryDrawPoints: 1,
      preliminaryLossPoints: 0,
      finalStageType: "ko",
      finalStageQualifierCount: 4,
      finalStageBestOfLegs: 5,
    };
    assert(validateCreateConfigDetails({ ...base, preliminaryWinPoints: 1 }).some((entry) => entry.reasonCode === "preliminary_scoring_invalid"));
    assert(validateCreateConfigDetails({ ...base, finalStageType: "random" }).some((entry) => entry.reasonCode === "final_stage_type_invalid"));
    assert(validateCreateConfigDetails({ ...base, finalStageQualifierCount: 8 }).some((entry) => entry.reasonCode === "final_stage_qualifier_count_invalid"));
    assert(validateCreateConfigDetails({ ...base, finalStageBestOfLegs: 4 }).some((entry) => entry.reasonCode === "final_stage_best_of_invalid"));
  });

  test("Final stage: double KO reuses engine and locks preliminary correction after start", () => {
    const tournament = createPreliminaryFinalTournament(8, { qualifierCount: 4, finalStageType: "double_ko", finalBestOf: 7 });
    completePreliminaryAndResolve(tournament);
    assert(generatePreliminaryFinalStage(tournament).ok);
    synchronizeKoBracketState(tournament);
    const playable = getMatchesByStage(tournament, MATCH_STAGE_KO).find((match) => match.player1Id && match.player2Id && !isByeMatchResult(match));
    applyMatchResultToTournament(tournament, playable.id, playable.player1Id, { p1: 4, p2: 0 }, "manual");
    const preliminaryMatch = getPreliminaryMatches(tournament)[0];
    assertEqual(resetPreliminaryMatchForCorrection(tournament, preliminaryMatch.id).reasonCode, "final_stage_already_started");
    assertEqual(applyMatchResultToTournament(tournament, preliminaryMatch.id, preliminaryMatch.player1Id, { p1: 2, p2: 0 }, "manual").reasonCode, "final_stage_already_started");
  });

  test("Final stage: correction before start discards generated bracket explicitly", () => {
    const tournament = createPreliminaryFinalTournament(6, { qualifierCount: 4 });
    completePreliminaryAndResolve(tournament);
    assert(generatePreliminaryFinalStage(tournament).ok);
    const preliminaryMatch = getPreliminaryMatches(tournament)[0];
    const result = resetPreliminaryMatchForCorrection(tournament, preliminaryMatch.id);
    assert(result.ok);
    assertEqual(result.discardedFinalStage, true);
    assertEqual(getMatchesByStage(tournament, MATCH_STAGE_KO).length, 0);
    assertEqual(tournament.finalStage.status, "pending");
    assertEqual(tournament.finalStage.qualificationResolution, null);
  });

  test("Preliminary persistence: configuration and pending leg survive storage migration", () => {
    const tournament = createPreliminaryFinalTournament(8, {
      matchesPerParticipant: 5,
      winPoints: 3,
      drawPoints: 2,
      lossPoints: 1,
      finalStageType: "double_ko",
      qualifierCount: 6,
      finalBestOf: 7,
    });
    const match = getPreliminaryMatches(tournament)[0];
    assert(applyFixedLegEntriesToTournament(tournament, match.id, [{ legIndex: 1, winnerId: match.player2Id }]).ok);
    const migrated = migrateStorage({
      schemaVersion: 4,
      settings: createDefaultStore().settings,
      ui: createDefaultStore().ui,
      tournament: JSON.parse(JSON.stringify(tournament)),
    });
    assertEqual(migrated.schemaVersion, STORAGE_SCHEMA_VERSION);
    assertEqual(migrated.tournament.preliminary.matchesPerParticipant, 5);
    assertDeepEqual(migrated.tournament.preliminary.scoring, { winPoints: 3, drawPoints: 2, lossPoints: 1 });
    assertEqual(migrated.tournament.finalStage.type, "double_ko");
    assertEqual(migrated.tournament.finalStage.qualifierCount, 6);
    assertEqual(migrated.tournament.finalStage.bestOfLegs, 7);
    assertEqual(findMatch(migrated.tournament, match.id).meta.fixedLegs.entries.length, 1);
  });

  test("Tournament duration: preliminary and final phase are both represented", () => {
    const tournament = createPreliminaryFinalTournament(8, { matchesPerParticipant: 5, qualifierCount: 4, finalBestOf: 7 });
    const estimate = estimateTournamentDurationFromTournament(tournament, {
      tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
    });
    assert(estimate.ready, estimate.reason);
    assertEqual(estimate.matchCount, 23);
    assert(estimate.phaseOverheadMinutes > 0);
  });

  test("Create draft: unset preliminary-final numbers fall back field by field", () => {
    const defaults = {
      preliminaryMatchesPerParticipant: 4,
      preliminaryWinPoints: 2,
      preliminaryDrawPoints: 1,
      preliminaryLossPoints: 0,
      finalStageQualifierCount: 4,
      finalStageBestOfLegs: 5,
    };
    [null, undefined, "", "   ", NaN, Infinity, -Infinity].forEach((unsetValue) => {
      Object.entries(defaults).forEach(([fieldName, expected]) => {
        const draft = normalizeCreateDraft({ mode: "preliminary_final", [fieldName]: unsetValue });
        assertEqual(draft[fieldName], expected, `${fieldName} muss auf den fachlichen Default ${expected} fallen.`);
      });
    });
  });

  test("Create draft: preliminary-final field limits and legitimate zero are preserved", () => {
    const draft = normalizeCreateDraft({
      mode: "preliminary_final",
      preliminaryMatchesPerParticipant: 0,
      preliminaryWinPoints: -1,
      preliminaryDrawPoints: 11,
      preliminaryLossPoints: 0,
      finalStageQualifierCount: 0,
      finalStageBestOfLegs: 4,
    });
    assertEqual(draft.preliminaryMatchesPerParticipant, 4);
    assertEqual(draft.preliminaryWinPoints, 2);
    assertEqual(draft.preliminaryDrawPoints, 1);
    assertEqual(draft.preliminaryLossPoints, 0);
    assertEqual(draft.finalStageQualifierCount, 4);
    assertEqual(draft.finalStageBestOfLegs, 5);
  });

  test("Preliminary creation: 7/5 is blocked with an explicit feasibility reason", () => {
    const errors = validateCreateConfigDetails({
      name: "7 durch 5",
      mode: "preliminary_final",
      participants: participantList(7),
      preliminaryMatchesPerParticipant: 5,
      preliminaryWinPoints: 2,
      preliminaryDrawPoints: 1,
      preliminaryLossPoints: 0,
      finalStageType: "ko",
      finalStageQualifierCount: 4,
      finalStageBestOfLegs: 5,
    });
    const scheduleError = errors.find((entry) => entry.reasonCode === "preliminary_equal_distribution_impossible");
    assert(Boolean(scheduleError), "7/5 muss wegen unm\u00f6glicher Gleichverteilung blockiert werden.");
    assert(normalizeText(scheduleError.message).includes("gleiche Verteilung"));
  });

  function synchronizePreliminaryFinalTestState(tournament) {
    for (let attempt = 0; attempt < 16; attempt += 1) {
      let changed = false;
      changed = synchronizeKoBracketState(tournament) || changed;
      changed = normalizeCompletedMatchResults(tournament) || changed;
      changed = synchronizeKoBracketState(tournament) || changed;
      changed = refreshPreliminaryFinalStageStatus(tournament) || changed;
      changed = refreshTournamentResultsIndex(tournament) || changed;
      if (!changed) break;
    }
  }

  function resolveAllDrawPreliminary(tournament, reason = "Deterministische Testentscheidung") {
    const preliminaryMatches = getPreliminaryMatches(tournament);
    preliminaryMatches.forEach((match) => {
      const result = applyMatchResultToTournament(tournament, match.id, null, { p1: 1, p2: 1 }, "manual");
      assert(result.ok, result.message || `Vorrundenmatch ${match.id} konnte nicht abgeschlossen werden.`);
    });
    assert(isPreliminaryComplete(tournament), "Alle Vorrundenmatches m\u00fcssen abgeschlossen sein.");
    const rows = buildPreliminaryStandings(tournament);
    assertEqual(rows.length, tournament.participants.length);
    assert(rows.every((row) => row.played === tournament.preliminary.matchesPerParticipant));
    assert(rows.every((row) => row.draws === tournament.preliminary.matchesPerParticipant));
    const unresolved = analyzePreliminaryQualification(tournament);
    assertEqual(unresolved.reasonCode, "final_stage_qualification_unresolved");
    assertEqual(generatePreliminaryFinalStage(tournament).reasonCode, "final_stage_qualification_unresolved");
    const orderedParticipantIds = tournament.participants.map((participant) => participant.id);
    const resolution = recordPreliminaryQualificationResolution(tournament, orderedParticipantIds, reason);
    assert(resolution.ok, resolution.message || "Explizite Veranstalterentscheidung wurde nicht gespeichert.");
    const resolved = analyzePreliminaryQualification(tournament);
    assert(resolved.ok);
    assertDeepEqual(resolved.orderedParticipantIds, orderedParticipantIds);
    return { rows, orderedParticipantIds };
  }

  function completePlayableFinalMatches(tournament, selectWinner) {
    const completedIds = [];
    for (let attempt = 0; attempt < 64; attempt += 1) {
      synchronizePreliminaryFinalTestState(tournament);
      const playable = getMatchesByStage(tournament, MATCH_STAGE_KO).find((match) => (
        match.status !== STATUS_COMPLETED && Boolean(match.player1Id) && Boolean(match.player2Id)
      ));
      if (!playable) break;
      const winnerId = selectWinner(playable, completedIds.slice());
      const legsToWin = getLegsToWin(getMatchBestOfLegs(tournament, playable));
      const legs = winnerId === playable.player1Id ? { p1: legsToWin, p2: 0 } : { p1: 0, p2: legsToWin };
      const result = applyMatchResultToTournament(tournament, playable.id, winnerId, legs, "manual");
      assert(result.ok, result.message || `Finalphasenmatch ${playable.id} konnte nicht abgeschlossen werden.`);
      completedIds.push(playable.id);
    }
    synchronizePreliminaryFinalTestState(tournament);
    return completedIds;
  }

  function assertFinalStageFullyCompleted(tournament) {
    const matches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    assert(matches.length > 0, "Finalphasenmatches erwartet.");
    assert(matches.every((match) => match.status === STATUS_COMPLETED));
    assert(matches.every((match) => isCompletedMatchResultValid(tournament, match)));
    assertEqual(matches.some((match) => match.status !== STATUS_COMPLETED && match.player1Id && match.player2Id), false);
    assertEqual(tournament.finalStage.status, "completed");
  }

  test("Final stage E2E: preliminary draws, explicit resolution, seeded KO and champion", () => {
    const tournament = createPreliminaryFinalTournament(7, { qualifierCount: 4, finalStageType: "ko", finalBestOf: 5 });
    assertEqual(generatePreliminaryFinalStage(tournament).reasonCode, "preliminary_not_completed");
    const { rows, orderedParticipantIds } = resolveAllDrawPreliminary(tournament);
    const preliminarySnapshot = JSON.stringify(getPreliminaryMatches(tournament));
    const generated = generatePreliminaryFinalStage(tournament);
    assert(generated.ok, generated.message);
    assertDeepEqual(tournament.finalStage.seeding, orderedParticipantIds.slice(0, 4));
    assertDeepEqual(tournament.finalStage.ko.seeding.map((entry) => entry.participantId), orderedParticipantIds.slice(0, 4));
    assertEqual(tournament.finalStage.bestOfLegs, 5);
    assertEqual(rows.every((row) => row.points === 4), true);

    const completedIds = completePlayableFinalMatches(tournament, (match) => match.player1Id);
    assertEqual(completedIds.length, 3);
    assertFinalStageFullyCompleted(tournament);
    const final = getMatchesByStage(tournament, MATCH_STAGE_KO).find((match) => Number(match?.meta?.bracket?.placementRank) === 1);
    assert(Boolean(final?.winnerId), "Eindeutiger KO-Champion erwartet.");
    assertEqual(final.legs.p1 + final.legs.p2, 3, "Finalphase muss Best of 5 / First to 3 verwenden.");
    assertEqual(JSON.stringify(getPreliminaryMatches(tournament)), preliminarySnapshot, "Vorrundenergebnisse d\u00fcrfen nach Finalphasenstart nicht ver\u00e4ndert werden.");
  });

  test("Final stage E2E: seeded double KO routes two losses and completes with champion", () => {
    const tournament = createPreliminaryFinalTournament(7, { qualifierCount: 4, finalStageType: "double_ko", finalBestOf: 5 });
    const { orderedParticipantIds } = resolveAllDrawPreliminary(tournament, "Doppel-KO-Testsetzung");
    const preliminarySnapshot = JSON.stringify(getPreliminaryMatches(tournament));
    assert(generatePreliminaryFinalStage(tournament).ok);
    assertDeepEqual(tournament.finalStage.seeding, orderedParticipantIds.slice(0, 4));

    const completedIds = completePlayableFinalMatches(tournament, (match) => match.player1Id);
    assert(completedIds.some((id) => id.startsWith("wb-")), "Winners-Bracket-Pfad erwartet.");
    assert(completedIds.some((id) => id.startsWith("lb-")), "Losers-Bracket-Pfad erwartet.");
    assert(completedIds.includes("gf-r1-m1"), "Grand Final muss abgeschlossen sein.");
    assertFinalStageFullyCompleted(tournament);

    const winnersFinal = findMatch(tournament, "wb-r2-m1");
    const losersFinal = findMatch(tournament, "lb-r2-m1");
    const grandFinal = findMatch(tournament, "gf-r1-m1");
    assertEqual(grandFinal.player1Id, winnersFinal.winnerId);
    assertEqual(grandFinal.player2Id, losersFinal.winnerId);
    const championId = grandFinal.winnerId;
    assert(Boolean(championId), "Eindeutiger Doppel-KO-Champion erwartet.");

    const lossCountByParticipant = new Map(tournament.finalStage.seeding.map((id) => [id, 0]));
    getMatchesByStage(tournament, MATCH_STAGE_KO).filter((match) => match.status === STATUS_COMPLETED && !isByeMatchResult(match)).forEach((match) => {
      const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
      lossCountByParticipant.set(loserId, (lossCountByParticipant.get(loserId) || 0) + 1);
    });
    assertEqual(lossCountByParticipant.get(championId), 0);
    lossCountByParticipant.forEach((losses, participantId) => {
      if (participantId !== championId) assertEqual(losses, 2, `${participantId} muss nach der zweiten Niederlage ausgeschieden sein.`);
    });
    assertEqual(JSON.stringify(getPreliminaryMatches(tournament)), preliminarySnapshot);
  });

  test("Final stage E2E: double-KO Grand Final loss activates and completes reset final", () => {
    const tournament = createPreliminaryFinalTournament(7, { qualifierCount: 4, finalStageType: "double_ko", finalBestOf: 5 });
    resolveAllDrawPreliminary(tournament, "Reset-Finale-Testsetzung");
    assert(generatePreliminaryFinalStage(tournament).ok);

    completePlayableFinalMatches(tournament, (match) => {
      if (match.id === "gf-r1-m1") return match.player2Id;
      if (match.id === "gf-r2-m1") return match.player1Id;
      return match.player1Id;
    });

    const grandFinal = findMatch(tournament, "gf-r1-m1");
    const resetFinal = findMatch(tournament, "gf-r2-m1");
    assert(Boolean(grandFinal && resetFinal), "Grand Final und aktiviertes Reset-Finale erwartet.");
    assertEqual(grandFinal.winnerId, grandFinal.player2Id, "Winners-Bracket-Sieger muss das erste Grand Final verloren haben.");
    assertEqual(resetFinal.player1Id, grandFinal.player1Id);
    assertEqual(resetFinal.player2Id, grandFinal.player2Id);
    assert(Boolean(resetFinal.winnerId), "Das zweite Grand Final muss den Champion entscheiden.");
    assertFinalStageFullyCompleted(tournament);
  });
