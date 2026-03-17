test("Tournament duration: default store uses normal profile", () => {
  const store = createDefaultStore();
  assertEqual(store.settings.tournamentTimeProfile, TOURNAMENT_TIME_PROFILE_NORMAL);
  assertEqual(store.ui.durationEstimateVisible, true);
});


test("Tournament duration: sanitize profile falls back to normal", () => {
  assertEqual(
    sanitizeTournamentTimeProfile("invalid-profile", TOURNAMENT_TIME_PROFILE_NORMAL),
    TOURNAMENT_TIME_PROFILE_NORMAL,
  );
});


test("Tournament duration: KO estimate uses n-1 matches", () => {
  const tournament = createKoTournament(participantList(16), {
    bestOfLegs: 5,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
  });
  const estimate = estimateTournamentDurationFromTournament(tournament, {
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
  });

  assert(estimate.ready, "Estimate should be ready for a valid KO setup.");
  assertEqual(estimate.matchCount, 15);
  assert(Math.abs(estimate.likelyMinutes - 266.5) < 0.2, `Unexpected likely minutes: ${estimate.likelyMinutes}`);
  assert(Math.abs(estimate.matchMinutes - 17.5) < 0.2, `Unexpected match minutes: ${estimate.matchMinutes}`);
});


test("Tournament duration: league estimate scales with round robin match count", () => {
  const tournament = createLeagueTournament(participantList(8), {
    bestOfLegs: 5,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
  });
  const estimate = estimateTournamentDurationFromTournament(tournament, {
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
  });

  assert(estimate.ready, "Estimate should be ready for a valid league setup.");
  assertEqual(estimate.matchCount, 28);
  assert(Math.abs(estimate.likelyMinutes - 489.1) < 0.2, `Unexpected likely minutes: ${estimate.likelyMinutes}`);
});


test("Tournament duration: groups + KO uses current two-group bracket logic", () => {
  const tournament = createTournament({
    name: "Groups",
    mode: "groups_ko",
    bestOfLegs: 5,
    startScore: 501,
    x01Preset: X01_PRESET_PDC_501_DOUBLE_OUT_BASIC,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01MaxRounds: 50,
    x01BullOffMode: "Normal",
    lobbyVisibility: "private",
    randomizeKoRound1: false,
    koDrawLocked: true,
    participants: participantList(12),
  });
  const estimate = estimateTournamentDurationFromTournament(tournament, {
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
  });

  assert(estimate.ready, "Estimate should be ready for groups + KO.");
  assertEqual(estimate.matchCount, 33);
  assert(Math.abs(estimate.likelyMinutes - 580.5) < 0.2, `Unexpected likely minutes: ${estimate.likelyMinutes}`);
});


test("Tournament duration: score and profile change the likely duration", () => {
  const fastEstimate = estimateTournamentDuration({
    mode: "ko",
    bestOfLegs: 5,
    startScore: 301,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
    participants: participantList(16),
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_FAST,
  });
  const slowEstimate = estimateTournamentDuration({
    mode: "ko",
    bestOfLegs: 5,
    startScore: 701,
    x01InMode: "Double",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Official",
    x01MaxRounds: 80,
    participants: participantList(16),
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_SLOW,
  });

  assert(fastEstimate.ready, "Fast estimate should be ready.");
  assert(slowEstimate.ready, "Slow estimate should be ready.");
  assert(fastEstimate.likelyMinutes < slowEstimate.likelyMinutes, "Harder setup should take longer.");
  assertEqual(fastEstimate.profile.id, TOURNAMENT_TIME_PROFILE_FAST);
  assertEqual(slowEstimate.profile.id, TOURNAMENT_TIME_PROFILE_SLOW);
});


test("Tournament duration: profile also changes transition overhead", () => {
  const fastEstimate = estimateTournamentDuration({
    mode: "ko",
    bestOfLegs: 5,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
    participants: participantList(16),
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_FAST,
  });
  const slowEstimate = estimateTournamentDuration({
    mode: "ko",
    bestOfLegs: 5,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
    participants: participantList(16),
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_SLOW,
  });

  assert(fastEstimate.matchTransitionMinutes < slowEstimate.matchTransitionMinutes, "Slow profile should add more between-match time.");
  assert(fastEstimate.matchOverheadMinutes < slowEstimate.matchOverheadMinutes, "Slow profile should increase match overhead.");
  assert(fastEstimate.phaseOverheadMinutes < slowEstimate.phaseOverheadMinutes, "Slow profile should also widen phase overhead.");
});


test("Tournament duration: start score scaling separates short and long x01 distances", () => {
  const shortDistance = estimateTournamentDuration({
    mode: "ko",
    bestOfLegs: 5,
    startScore: 301,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
    participants: participantList(16),
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
  });
  const standardDistance = estimateTournamentDuration({
    mode: "ko",
    bestOfLegs: 5,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
    participants: participantList(16),
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
  });
  const longDistance = estimateTournamentDuration({
    mode: "ko",
    bestOfLegs: 5,
    startScore: 701,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
    participants: participantList(16),
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
  });

  assert(shortDistance.legMinutes < standardDistance.legMinutes, "301 should be faster than 501.");
  assert(standardDistance.legMinutes < longDistance.legMinutes, "701 should be slower than 501.");
  assert(shortDistance.matchMinutes < standardDistance.matchMinutes, "301 should reduce match duration.");
  assert(standardDistance.matchMinutes < longDistance.matchMinutes, "701 should increase match duration.");
});


test("Tournament duration: invalid participant count stays pending", () => {
  const estimate = estimateTournamentDurationFromDraft({
    mode: "groups_ko",
    bestOfLegs: 5,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01MaxRounds: 50,
    x01BullOffMode: "Normal",
    participantsText: "A\nB\nC",
  }, {
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
  });

  assert(!estimate.ready, "Estimate should not be ready below mode minimum.");
  assertEqual(estimate.reason, "Gruppenphase + KO erfordert 4-16 Teilnehmer.");
});


test("Tournament duration: board count is sanitized and stored in estimate", () => {
  const estimate = estimateTournamentDuration({
    mode: "ko",
    bestOfLegs: 5,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
    participants: participantList(16),
    boardCount: 999,
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
  });

  assert(estimate.ready, "Estimate should be ready for valid KO setup.");
  assertEqual(estimate.boardCount, TOURNAMENT_DURATION_MAX_BOARD_COUNT);
  assert(!estimate.singleBoard, "Board count > 1 should disable single-board flag.");
});


test("Tournament duration: league board scaling respects player conflicts", () => {
  const oneBoard = estimateTournamentDuration({
    mode: "league",
    bestOfLegs: 5,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
    participants: participantList(8),
    boardCount: 1,
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
  });
  const manyBoards = estimateTournamentDuration({
    mode: "league",
    bestOfLegs: 5,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
    participants: participantList(8),
    boardCount: 8,
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
  });

  assert(manyBoards.ready, "Estimate should be ready.");
  assert(manyBoards.likelyMinutes < oneBoard.likelyMinutes, "More boards should reduce expected duration.");
  assertEqual(manyBoards.scheduleWaves, 7);
  assertEqual(manyBoards.peakParallelMatches, 4);
  assert(manyBoards.scheduleWaves > Math.ceil(manyBoards.matchCount / manyBoards.boardCount), "Conflicting player slots should block naive full-board usage.");
});


test("Tournament duration: KO dependencies block naive full-board parallelism", () => {
  const estimate = estimateTournamentDuration({
    mode: "ko",
    bestOfLegs: 5,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
    participants: participantList(16),
    boardCount: 8,
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
  });

  assert(estimate.ready, "Estimate should be ready.");
  assertEqual(estimate.scheduleWaves, 4);
  assertEqual(estimate.peakParallelMatches, 8);
  assert(estimate.scheduleWaves > Math.ceil(estimate.matchCount / estimate.boardCount), "KO round dependencies should require additional waves.");
});


test("Tournament duration: draft board count is used by the live estimate", () => {
  const estimate = estimateTournamentDurationFromDraft({
    mode: "ko",
    bestOfLegs: 5,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01MaxRounds: 50,
    x01BullOffMode: "Normal",
    boardCount: 3,
    participantsText: "A\nB\nC\nD",
  }, {
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
  });

  assert(estimate.ready, "Estimate should be ready for valid draft.");
  assertEqual(estimate.boardCount, 3);
  assertEqual(estimate.singleBoard, false);
});


test("Tournament duration: tournament duration meta keeps board count for active forecast", () => {
  const tournament = createKoTournament(participantList(8), {
    bestOfLegs: 5,
    boardCount: 4,
    randomizeKoRound1: false,
  });
  const estimate = estimateTournamentDurationFromTournament(tournament, {
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
  });

  assert(estimate.ready, "Estimate should be ready.");
  assertEqual(estimate.boardCount, 4);
});


test("Tournament duration: running progress forecast shrinks remaining time after completed matches", () => {
  const tournament = createKoTournament(participantList(8), {
    bestOfLegs: 5,
    boardCount: 4,
    randomizeKoRound1: false,
  });
  const before = estimateTournamentDurationProgressFromTournament(tournament, {
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
  });

  const m1 = findMatch(tournament, "ko-r1-m1");
  const m2 = findMatch(tournament, "ko-r1-m2");
  assert(Boolean(m1) && Boolean(m2), "Expected first-round KO matches.");
  m1.status = STATUS_COMPLETED;
  m1.winnerId = m1.player1Id;
  m1.legs = { p1: 3, p2: 1 };
  m1.updatedAt = nowIso();
  m2.status = STATUS_COMPLETED;
  m2.winnerId = m2.player2Id;
  m2.legs = { p1: 1, p2: 3 };
  m2.updatedAt = nowIso();

  const after = estimateTournamentDurationProgressFromTournament(tournament, {
    tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
  });

  assert(before.ready && after.ready, "Progress forecast should be ready.");
  assert(after.completedMatches > before.completedMatches, "Completed count should increase.");
  assert(after.remainingMatches < before.remainingMatches, "Remaining matches should decrease.");
  assert(after.remainingLikelyMinutes < before.remainingLikelyMinutes, "Remaining estimate should shrink.");
  assertEqual(after.paceMultiplier, 1);
  assertEqual(after.projectedRemainingLikelyMinutes, after.remainingLikelyMinutes);
  assertEqual(after.projectedEndAtIso, "");
});


test("Tournament duration: running progress forecast is static against wall-clock time", () => {
  const tournament = createKoTournament(participantList(8), {
    bestOfLegs: 5,
    boardCount: 4,
    randomizeKoRound1: false,
  });

  const m1 = findMatch(tournament, "ko-r1-m1");
  assert(Boolean(m1), "Expected first-round KO match.");
  m1.status = STATUS_COMPLETED;
  m1.winnerId = m1.player1Id;
  m1.legs = { p1: 3, p2: 1 };
  m1.updatedAt = nowIso();

  const originalNow = Date.now;
  let earlySnapshot = null;
  let lateSnapshot = null;
  try {
    Date.now = () => 1000;
    earlySnapshot = estimateTournamentDurationProgressFromTournament(tournament, {
      tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
    });

    Date.now = () => 9_999_999_000;
    lateSnapshot = estimateTournamentDurationProgressFromTournament(tournament, {
      tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
    });
  } finally {
    Date.now = originalNow;
  }

  assert(earlySnapshot && lateSnapshot, "Expected static snapshots.");
  assertEqual(earlySnapshot.remainingLikelyMinutes, lateSnapshot.remainingLikelyMinutes);
  assertEqual(earlySnapshot.remainingLowMinutes, lateSnapshot.remainingLowMinutes);
  assertEqual(earlySnapshot.remainingHighMinutes, lateSnapshot.remainingHighMinutes);
  assertEqual(earlySnapshot.paceMultiplier, 1);
  assertEqual(lateSnapshot.paceMultiplier, 1);
  assertEqual(earlySnapshot.projectedRemainingLikelyMinutes, earlySnapshot.remainingLikelyMinutes);
  assertEqual(lateSnapshot.projectedRemainingLikelyMinutes, lateSnapshot.remainingLikelyMinutes);
  assertEqual(earlySnapshot.projectedEndAtIso, "");
  assertEqual(lateSnapshot.projectedEndAtIso, "");
});
