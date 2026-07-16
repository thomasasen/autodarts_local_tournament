test("Preset definitions: schema self-check passes for all shipped presets", () => {
  const checks = validateCreatePresetDefinitions();
  assertEqual(checks.length, 2, "Expected two shipped presets.");
  checks.forEach((entry) => {
    assert(entry.ok, `Preset ${entry.id} invalid: ${entry.issues.join(", ")}`);
  });
});


test("Preset definitions: European Tour official stays pinned to the documented values", () => {
  const preset = getCreatePresetDefinition(X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL);
  assert(Boolean(preset), "European Tour preset should exist.");
  assertEqual(preset.label, "PDC European Tour - Runden 1 bis 4");
  assertDeepEqual(preset.apply, {
    mode: "ko",
    bestOfLegs: 11,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
    lobbyVisibility: "private",
  });
});


test("Preset defaults: new create draft starts with the local beginner profile", () => {
  const draft = createDefaultCreateDraft();
  assertEqual(draft.x01Preset, X01_PRESET_PDC_501_DOUBLE_OUT_BASIC);
  assertEqual(draft.mode, "ko");
  assertEqual(draft.bestOfLegs, 5);
  assertEqual(draft.startScore, 501);
  assertEqual(draft.x01InMode, "Straight");
  assertEqual(draft.x01OutMode, "Double");
  assertEqual(draft.x01BullMode, "25/50");
  assertEqual(draft.x01BullOffMode, "Normal");
  assertEqual(draft.x01MaxRounds, 50);
  assertEqual(draft.boardCount, TOURNAMENT_DURATION_DEFAULT_BOARD_COUNT);
  assertEqual(draft.enableThirdPlaceMatch, false);
  assertEqual(draft.grandFinalResetMode, GRAND_FINAL_RESET_IF_NEEDED);
});


test("Preset definitions: local beginner profile stays pinned and is not labeled official", () => {
  const preset = getCreatePresetDefinition(X01_PRESET_PDC_501_DOUBLE_OUT_BASIC);
  assert(Boolean(preset), "Basic compatibility preset should exist.");
  assertEqual(preset.label, "Lokaler Spieleabend - 501 / Best of 5");
  assert(!preset.label.includes("Official"), "Basic compatibility preset must not be presented as official.");
  assertDeepEqual(preset.apply, {
    mode: "ko",
    bestOfLegs: 5,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
    lobbyVisibility: "private",
  });
});


test("Preset normalization: legacy pdc_standard maps to the honest basic compatibility preset", () => {
  const draft = normalizeCreateDraft({
    x01Preset: X01_PRESET_LEGACY_PDC_STANDARD,
    mode: "ko",
    bestOfLegs: 5,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
  });
  assertEqual(draft.x01Preset, X01_PRESET_PDC_501_DOUBLE_OUT_BASIC);
  assertEqual(draft.bestOfLegs, 5);
});


test("Preset detection: European Tour badge only applies to the full KO + BO11 setup", () => {
  const officialPresetId = getAppliedCreatePresetId({
    mode: "ko",
    bestOfLegs: 11,
    x01Preset: X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
    lobbyVisibility: "private",
  });
  const downgradedPresetId = getAppliedCreatePresetId({
    mode: "ko",
    bestOfLegs: 5,
    x01Preset: X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
    lobbyVisibility: "private",
  });
  assertEqual(officialPresetId, X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL);
  assertEqual(downgradedPresetId, X01_PRESET_CUSTOM);
});


test("Preset migration: stored legacy tournament preset ids stay backward compatible", () => {
  const tournament = normalizeTournament({
    id: "legacy-preset",
    name: "Legacy PDC",
    mode: "ko",
    bestOfLegs: 5,
    startScore: 501,
    x01: {
      presetId: X01_PRESET_LEGACY_PDC_STANDARD,
      baseScore: 501,
      inMode: "Straight",
      outMode: "Double",
      bullMode: "25/50",
      maxRounds: 50,
      bullOffMode: "Normal",
      lobbyVisibility: "private",
    },
    participants: participantList(2, "LP"),
    groups: [],
    matches: [],
    results: [],
  }, true);
  assert(Boolean(tournament), "Normalized tournament should exist.");
  assertEqual(tournament.x01.presetId, X01_PRESET_PDC_501_DOUBLE_OUT_BASIC);
  assertEqual(tournament.bestOfLegs, 5);
});


test("Preset normalization: non-preset draft values survive exact preset recognition", () => {
  const draft = normalizeCreateDraft({
    name: "Erhaltstest",
    x01Preset: X01_PRESET_PDC_501_DOUBLE_OUT_BASIC,
    mode: "ko",
    bestOfLegs: 5,
    startScore: 501,
    x01InMode: "Straight",
    x01OutMode: "Double",
    x01BullMode: "25/50",
    x01BullOffMode: "Normal",
    x01MaxRounds: 50,
    boardCount: 4,
    participantsText: "Ada\nBerta\nClara",
    randomizeKoRound1: false,
    enableThirdPlaceMatch: true,
    grandFinalResetMode: GRAND_FINAL_RESET_SINGLE_MATCH,
    groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL,
    groupsKoOddParticipantAcknowledged: true,
    preliminaryMatchesPerParticipant: 6,
    preliminaryWinPoints: 3,
    preliminaryDrawPoints: 1,
    preliminaryLossPoints: 0,
    finalStageType: FINAL_STAGE_TYPE_DOUBLE_KO,
    finalStageQualifierCount: 6,
    finalStageBestOfLegs: 7,
  });
  assertEqual(draft.x01Preset, X01_PRESET_PDC_501_DOUBLE_OUT_BASIC);
  assertEqual(draft.name, "Erhaltstest");
  assertEqual(draft.boardCount, 4);
  assertEqual(draft.participantsText, "Ada\nBerta\nClara");
  assertEqual(draft.randomizeKoRound1, false);
  assertEqual(draft.enableThirdPlaceMatch, true);
  assertEqual(draft.grandFinalResetMode, GRAND_FINAL_RESET_SINGLE_MATCH);
  assertEqual(draft.groupsKoOddParticipantPolicy, GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL);
  assertEqual(draft.groupsKoOddParticipantAcknowledged, true);
  assertEqual(draft.preliminaryMatchesPerParticipant, 6);
  assertEqual(draft.preliminaryWinPoints, 3);
  assertEqual(draft.finalStageType, FINAL_STAGE_TYPE_DOUBLE_KO);
  assertEqual(draft.finalStageQualifierCount, 6);
  assertEqual(draft.finalStageBestOfLegs, 7);
});


test("Preset normalization: a deviating stored preset draft becomes Custom without rewriting facts", () => {
  const draft = normalizeCreateDraft({
    name: "Custom bleibt",
    x01Preset: X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL,
    mode: "ko",
    bestOfLegs: 7,
    startScore: 301,
    x01InMode: "Double",
    x01OutMode: "Master",
    x01BullMode: "50/50",
    x01BullOffMode: "Official",
    x01MaxRounds: 20,
    boardCount: 2,
    participantsText: "A\nB",
  });
  assertEqual(draft.x01Preset, X01_PRESET_CUSTOM);
  assertEqual(draft.bestOfLegs, 7);
  assertEqual(draft.startScore, 301);
  assertEqual(draft.x01InMode, "Double");
  assertEqual(draft.x01OutMode, "Master");
  assertEqual(draft.x01BullMode, "50/50");
  assertEqual(draft.x01BullOffMode, "Official");
  assertEqual(draft.x01MaxRounds, 20);
  assertEqual(draft.name, "Custom bleibt");
  assertEqual(draft.boardCount, 2);
  assertEqual(draft.participantsText, "A\nB");
});


test("Game-rules summary: European Tour and Basic expose preset origin plus First-to", () => {
  const european = buildCreateGameRulesSummary(normalizeCreateDraft({
    ...createDefaultCreateDraft(),
    x01Preset: X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL,
    bestOfLegs: 11,
  }));
  const basic = buildCreateGameRulesSummary(normalizeCreateDraft({
    ...createDefaultCreateDraft(),
    x01Preset: X01_PRESET_PDC_501_DOUBLE_OUT_BASIC,
    bestOfLegs: 5,
  }));

  assertEqual(european.presetLabel, "PDC European Tour - Runden 1 bis 4");
  assert(european.text.includes("501 · Best of 11 (First to 6)"));
  assert(european.text.includes("Straight In · Double Out"));
  assert(european.text.includes("Bull-off Normal · Bull 25/50"));
  assert(european.text.includes("Max. 50 Runden"));
  assertEqual(basic.presetLabel, "Lokaler Spieleabend - 501 / Best of 5");
  assert(basic.text.includes("Best of 5 (First to 3)"));
  assert(basic.plainText.includes("zuerst 3 Legs"));
});


test("Game-rules summary: Custom reflects all effective X01 values and suppresses stale bull mode", () => {
  const custom = buildCreateGameRulesSummary(normalizeCreateDraft({
    ...createDefaultCreateDraft(),
    mode: "league",
    bestOfLegs: 5,
    x01Preset: X01_PRESET_CUSTOM,
    startScore: 301,
    x01InMode: "Double",
    x01OutMode: "Master",
    x01BullOffMode: "Off",
    x01BullMode: "50/50",
    x01MaxRounds: 20,
  }));

  assertEqual(custom.presetLabel, "Individuell / Manuell");
  assert(custom.text.includes("301 · Best of 5 (First to 3)"));
  assert(custom.text.includes("Double In · Master Out"));
  assert(custom.text.includes("Bull-off aus"));
  assert(!custom.text.includes("Bull 50/50"), "Bull mode must not be shown while bull-off is disabled.");
  assert(custom.text.includes("Max. 20 Runden"));
});


test("Game-rules summary: active bull 50/50 stays visible", () => {
  const summary = buildCreateGameRulesSummary(normalizeCreateDraft({
    ...createDefaultCreateDraft(),
    x01Preset: X01_PRESET_CUSTOM,
    x01BullOffMode: "Official",
    x01BullMode: "50/50",
  }));
  assert(summary.text.includes("Bull-off Official · Bull 50/50"));
});


test("Game-rules summary: preliminary_final uses fixed preliminary legs and final-stage Best-of", () => {
  const summary = buildCreateGameRulesSummary(normalizeCreateDraft({
    ...createDefaultCreateDraft(),
    mode: "preliminary_final",
    bestOfLegs: 11,
    finalStageBestOfLegs: 5,
    x01Preset: X01_PRESET_CUSTOM,
  }));
  assert(summary.text.startsWith("Vorrunde: 2 feste Legs · Finalphase: Best of 5 (First to 3) · 501"));
  assert(!summary.text.includes("Best of 11"), "Ineffective general Best-of must not leak into the summary.");
});
