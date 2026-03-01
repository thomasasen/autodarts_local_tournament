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
  assertEqual(preset.label, "PDC European Tour (Official)");
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


test("Preset defaults: new create draft starts with European Tour official", () => {
  const draft = createDefaultCreateDraft();
  assertEqual(draft.x01Preset, X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL);
  assertEqual(draft.mode, "ko");
  assertEqual(draft.bestOfLegs, 11);
  assertEqual(draft.startScore, 501);
  assertEqual(draft.x01InMode, "Straight");
  assertEqual(draft.x01OutMode, "Double");
  assertEqual(draft.x01BullMode, "25/50");
  assertEqual(draft.x01BullOffMode, "Normal");
  assertEqual(draft.x01MaxRounds, 50);
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
