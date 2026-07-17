  function fixedLegExpectedPlayers() {
    return [{ id: "p1", name: "Anna" }, { id: "p2", name: "Berta" }];
  }


  function fixedLegState(legs, overrides = {}) {
    return {
      players: [{ name: "Anna" }, { name: "Berta" }],
      scores: [{ legs: legs[0] }, { legs: legs[1] }],
      gameNumber: 1,
      gameFinished: false,
      finished: false,
      ...overrides,
    };
  }


  function resolveFixedTest(providerState, storedEntries = []) {
    return resolveFixedLegsMatchState({
      providerState,
      expectedPlayers: fixedLegExpectedPlayers(),
      storedEntries,
      allowPositionalFallback: true,
    });
  }


  test("Fixed-Legs resolver: phases require explicit next and finish confirmations", () => {
    assertEqual(resolveFixedTest(fixedLegState([0, 0])).phase, "playing_leg_1");
    const leg1P1 = resolveFixedTest(fixedLegState([1, 0], { gameFinished: true }));
    assertEqual(leg1P1.phase, "awaiting_leg_2_confirmation");
    assertEqual(leg1P1.leg1WinnerId, "p1");
    const leg1P2 = resolveFixedTest(fixedLegState([0, 1], { gameFinished: true }));
    assertEqual(leg1P2.leg1WinnerId, "p2");
    assertEqual(resolveFixedTest(fixedLegState([1, 0], { gameNumber: 2 })).phase, "playing_leg_2");
    assertEqual(resolveFixedTest(fixedLegState([2, 0], { gameFinished: true })).phase, "awaiting_finish_confirmation");
    assertEqual(resolveFixedTest(fixedLegState([1, 1], { gameFinished: true })).phase, "awaiting_finish_confirmation");
    assertEqual(resolveFixedTest(fixedLegState([0, 2], { matchFinished: true })).phase, "completed");
    assertEqual(resolveFixedTest(fixedLegState([1, 0], { finished: true, gameFinished: false })).phase, "awaiting_leg_2_confirmation");
    assertEqual(resolveFixedTest(fixedLegState([1, 1], { finished: true, gameFinished: false })).phase, "awaiting_finish_confirmation");
  });


  test("Fixed-Legs resolver: swapped provider order is mapped by unique names", () => {
    const resolved = resolveFixedTest(fixedLegState([0, 0], {
      players: [{ name: "Berta" }, { name: "Anna" }],
      scores: [{ legsWon: 1 }, { legsWon: 0 }],
      gameFinished: true,
    }));
    assert(resolved.ok);
    assertDeepEqual(resolved.legs, { p1: 0, p2: 1 });
    assertEqual(resolved.leg1WinnerId, "p2");
  });


  test("Fixed-Legs resolver: stats-shaped final draw needs no winner field", () => {
    const resolved = resolveFixedTest({
      players: [
        { player: { name: "Anna" }, legsWon: 1 },
        { player: { name: "Berta" }, legsWon: 1 },
      ],
      matchStats: [
        { player: { name: "Anna" }, legsWon: 1 },
        { player: { name: "Berta" }, legsWon: 1 },
      ],
      matchFinished: true,
    });
    assert(resolved.ok);
    assertEqual(resolved.phase, "completed");
    assertDeepEqual(resolved.legs, { p1: 1, p2: 1 });
  });


  test("Fixed-Legs resolver: ambiguous, invalid, stale and overrun states block explicitly", () => {
    assertEqual(resolveFixedTest(fixedLegState([0, 0], {
      players: [{ name: "Anna" }, { name: "Anna" }],
    })).reasonCode, "fixed_legs_player_mapping_ambiguous");
    assertEqual(resolveFixedTest(fixedLegState([0, 0], { players: [{}, {}] })).reasonCode, "fixed_legs_player_mapping_ambiguous");
    assertEqual(resolveFixedTest({ players: fixedLegExpectedPlayers() }).reasonCode, "fixed_legs_state_invalid");
    assertEqual(resolveFixedTest({ players: fixedLegExpectedPlayers(), scores: [501, 501] }).reasonCode, "fixed_legs_state_invalid");
    assertEqual(resolveFixedTest(fixedLegState([0, 0]), [{ legIndex: 1, winnerId: "p1" }]).reasonCode, "fixed_legs_state_conflict");
    assertEqual(resolveFixedTest(fixedLegState([2, 1], { gameNumber: 3, gameFinished: true })).reasonCode, "fixed_legs_overrun");
  });


  test("Fixed-Legs resolver: a started third leg exposes only explicit recovery", () => {
    const resolved = resolveFixedTest(fixedLegState([1, 1], { gameNumber: 3, gameFinished: false }));
    assertEqual(resolved.phase, "blocked");
    assertEqual(resolved.reasonCode, "fixed_legs_state_conflict");
    assertEqual(resolved.recoveryAvailable, true);
    const withoutGameNumber = resolveFixedTest(fixedLegState([1, 1], { gameNumber: undefined, gameFinished: false, finished: false }));
    assertEqual(withoutGameNumber.recoveryAvailable, true);
  });


  test("Fixed-Legs entry derivation is deterministic and does not duplicate Leg 1", () => {
    const expected = fixedLegExpectedPlayers();
    const leg1 = resolveFixedTest(fixedLegState([1, 0], { gameFinished: true }));
    assertDeepEqual(buildFixedLegEntriesFromResolvedState(leg1, expected), [{ legIndex: 1, winnerId: "p1" }]);
    assertDeepEqual(buildFixedLegEntriesFromResolvedState(leg1, expected, [{ legIndex: 1, winnerId: "p1" }]), [{ legIndex: 1, winnerId: "p1" }]);
    const draw = resolveFixedTest(fixedLegState([1, 1], { matchFinished: true }), [{ legIndex: 1, winnerId: "p1" }]);
    assertDeepEqual(buildFixedLegEntriesFromResolvedState(draw, expected, [{ legIndex: 1, winnerId: "p1" }]), [
      { legIndex: 1, winnerId: "p1" },
      { legIndex: 2, winnerId: "p2" },
    ]);
    const decisive = resolveFixedTest(fixedLegState([0, 2], { matchFinished: true }));
    assertDeepEqual(buildFixedLegEntriesFromResolvedState(decisive, expected), [
      { legIndex: 1, winnerId: "p2" },
      { legIndex: 2, winnerId: "p2" },
    ]);
  });


  test("Schema 5 to 6: legacy manual_only maps without changing match content", () => {
    const tournament = createTournament({
      name: "Migration",
      mode: "preliminary_final",
      participants: participantList(5),
      preliminaryMatchesPerParticipant: 4,
      preliminaryWinPoints: 2,
      preliminaryDrawPoints: 1,
      preliminaryLossPoints: 0,
      finalStageType: "ko",
      finalStageQualifierCount: 4,
      finalStageBestOfLegs: 5,
    });
    const pending = tournament.matches[0];
    pending.meta.fixedLegs.syncStatus = "manual_only";
    const linked = tournament.matches[1];
    linked.meta.fixedLegs.syncStatus = "manual_only";
    linked.meta.auto.lobbyId = "lobby-1";
    linked.meta.auto.status = "started";
    const completed = tournament.matches[2];
    applyMatchResultToTournament(tournament, completed.id, null, { p1: 1, p2: 1 }, "manual");
    completed.meta.fixedLegs.syncStatus = "manual_only";
    const snapshot = JSON.parse(JSON.stringify(tournament));
    const migrated = migrateStorage({ schemaVersion: 5, settings: createDefaultStore().settings, ui: createDefaultStore().ui, tournament: snapshot });
    assertEqual(migrated.schemaVersion, 6);
    assertEqual(findMatch(migrated.tournament, pending.id).meta.fixedLegs.syncStatus, "idle");
    assertEqual(findMatch(migrated.tournament, linked.id).meta.fixedLegs.syncStatus, "linked");
    assertEqual(findMatch(migrated.tournament, completed.id).meta.fixedLegs.syncStatus, "manual");
    assertDeepEqual(findMatch(migrated.tournament, completed.id).legs, { p1: 1, p2: 1 });
    assertEqual(findMatch(migrated.tournament, completed.id).meta.resultKind, "draw");
  });


  test("Schema 6 JSON roundtrip preserves every normalized Fixed-Legs sync status", () => {
    const tournament = createTournament({
      name: "Roundtrip",
      mode: "preliminary_final",
      participants: participantList(5),
      preliminaryMatchesPerParticipant: 4,
      finalStageType: "ko",
      finalStageQualifierCount: 4,
      finalStageBestOfLegs: 5,
    });
    FIXED_LEGS_SYNC_STATUSES.forEach((status, index) => {
      tournament.matches[index].meta.fixedLegs.syncStatus = status;
    });
    const restored = normalizeTournament(JSON.parse(JSON.stringify(tournament)));
    FIXED_LEGS_SYNC_STATUSES.forEach((status, index) => assertEqual(restored.matches[index].meta.fixedLegs.syncStatus, status));
  });


  test("Guided action: next is explicit, revalidated and idempotent", async () => {
    const awaiting = resolveFixedTest(fixedLegState([1, 0], { gameFinished: true }));
    const playing = resolveFixedTest(fixedLegState([1, 0], { gameFinished: false, gameNumber: 2 }));
    let loads = 0;
    let saves = 0;
    let nextCalls = 0;
    const success = await executeFixedLegsGuidedAction("next", {
      load: async () => { loads += 1; return awaiting; },
      saveLeg1: async () => { saves += 1; return { ok: true }; },
      next: async () => { nextCalls += 1; },
    });
    assert(success.ok);
    assertDeepEqual({ loads, saves, nextCalls }, { loads: 1, saves: 1, nextCalls: 1 });

    saves = 0; nextCalls = 0;
    const repeated = await executeFixedLegsGuidedAction("next", {
      load: async () => playing,
      saveLeg1: async () => { saves += 1; return { ok: true }; },
      next: async () => { nextCalls += 1; },
    });
    assert(repeated.ok && repeated.idempotent);
    assertDeepEqual({ saves, nextCalls }, { saves: 0, nextCalls: 0 });
  });


  test("Guided action: delayed next response cannot create a second transition", async () => {
    const awaiting = resolveFixedTest(fixedLegState([0, 1], { gameFinished: true }));
    const playing = resolveFixedTest(fixedLegState([0, 1], { gameFinished: false, gameNumber: 2 }));
    let loadCount = 0;
    const result = await executeFixedLegsGuidedAction("next", {
      load: async () => (++loadCount === 1 ? awaiting : playing),
      saveLeg1: async () => ({ ok: true }),
      next: async () => { throw Object.assign(new Error("timeout"), { status: 0 }); },
    });
    assert(result.ok && result.idempotent);
    assertEqual(loadCount, 2);
  });


  test("Guided action: finish accepts 2:0, 1:1 and 0:2 only after exactly two Legs", async () => {
    for (const score of [[2, 0], [1, 1], [0, 2]]) {
      const resolved = resolveFixedTest(fixedLegState(score, { gameFinished: true }));
      let finishCalls = 0;
      let savedScore = null;
      const result = await executeFixedLegsGuidedAction("finish", {
        load: async () => resolved,
        finish: async () => { finishCalls += 1; },
        saveResult: async (current) => { savedScore = current.legs; return { ok: true }; },
      });
      assert(result.ok);
      assertEqual(finishCalls, 1);
      assertDeepEqual(savedScore, { p1: score[0], p2: score[1] });
    }
    let finishCalls = 0;
    const tooEarly = await executeFixedLegsGuidedAction("finish", {
      load: async () => resolveFixedTest(fixedLegState([1, 0], { gameFinished: true })),
      finish: async () => { finishCalls += 1; },
      saveResult: async () => ({ ok: true }),
    });
    assert(!tooEarly.ok);
    assertEqual(tooEarly.reasonCode, "fixed_legs_result_not_ready");
    assertEqual(finishCalls, 0);
  });


  test("Guided action: API failures expose stable next, finish and auth reason codes", async () => {
    const awaiting = resolveFixedTest(fixedLegState([1, 0], { gameFinished: true }));
    const finishable = resolveFixedTest(fixedLegState([1, 1], { gameFinished: true }));
    const nextFailure = await executeFixedLegsGuidedAction("next", {
      load: async () => awaiting,
      saveLeg1: async () => ({ ok: true }),
      next: async () => { throw Object.assign(new Error("bad request"), { status: 400 }); },
    });
    assertEqual(nextFailure.reasonCode, "fixed_legs_next_failed");
    const finishFailure = await executeFixedLegsGuidedAction("finish", {
      load: async () => finishable,
      finish: async () => { throw Object.assign(new Error("network"), { status: 0 }); },
      saveResult: async () => ({ ok: true }),
    });
    assertEqual(finishFailure.reasonCode, "fixed_legs_finish_failed");
    const authFailure = await executeFixedLegsGuidedAction("finish", {
      load: async () => finishable,
      finish: async () => { throw Object.assign(new Error("forbidden"), { status: 403 }); },
      saveResult: async () => ({ ok: true }),
    });
    assertEqual(authFailure.reasonCode, "auth");
  });


  test("Guided action: native finish during a failed response is recognized and saved once", async () => {
    const finishable = resolveFixedTest(fixedLegState([2, 0], { gameFinished: true }));
    const completed = resolveFixedTest(fixedLegState([2, 0], { matchFinished: true }));
    let loadCount = 0;
    let saveCount = 0;
    const result = await executeFixedLegsGuidedAction("finish", {
      load: async () => (++loadCount === 1 ? finishable : completed),
      finish: async () => { throw Object.assign(new Error("late response"), { status: 0 }); },
      saveResult: async () => { saveCount += 1; return { ok: true }; },
    });
    assert(result.ok);
    assertEqual(loadCount, 2);
    assertEqual(saveCount, 1);
  });


  test("Guided action: started Leg 3 is finishable only through the recovery action", async () => {
    const recovery = resolveFixedTest(fixedLegState([1, 1], { gameNumber: 3, gameFinished: false }));
    let finishCalls = 0;
    const normalFinish = await executeFixedLegsGuidedAction("finish", {
      load: async () => recovery,
      finish: async () => { finishCalls += 1; },
      saveResult: async () => ({ ok: true }),
    });
    assert(!normalFinish.ok);
    assertEqual(finishCalls, 0);
    const recovered = await executeFixedLegsGuidedAction("recover", {
      load: async () => recovery,
      finish: async () => { finishCalls += 1; },
      saveResult: async () => ({ ok: true }),
    });
    assert(recovered.ok);
    assertEqual(finishCalls, 1);
  });
