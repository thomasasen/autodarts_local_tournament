test("Tournament duration: default store uses normal profile", () => {
  const store = createDefaultStore();
  assertEqual(store.settings.tournamentTimeProfile, TOURNAMENT_TIME_PROFILE_NORMAL);
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
    x01Preset: X01_PRESET_PDC_STANDARD,
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
