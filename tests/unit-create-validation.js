  function createValidationParticipantText(count, prefix = "Spieler") {
    return Array.from({ length: count }, (_, index) => `${prefix} ${index + 1}`).join("\n");
  }


  function createValidValidationInput(mode = "ko", participantCount = null, overrides = {}) {
    const limits = getModeParticipantLimits(mode);
    const count = participantCount ?? limits.min;
    return {
      ...createDefaultCreateDraft(),
      name: "Validierungstest",
      mode,
      x01Preset: X01_PRESET_CUSTOM,
      participantsText: createValidationParticipantText(count),
      tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
      groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_REQUIRE_EVEN,
      groupsKoOddParticipantAcknowledged: false,
      preliminaryMatchesPerParticipant: 4,
      preliminaryWinPoints: 2,
      preliminaryDrawPoints: 1,
      preliminaryLossPoints: 0,
      finalStageType: FINAL_STAGE_TYPE_KO,
      finalStageQualifierCount: Math.min(4, count),
      finalStageBestOfLegs: 5,
      ...overrides,
    };
  }


  test("Create participants: empty input and blank lines are ignored", () => {
    const empty = analyzeCreateParticipantInput("");
    const blanks = analyzeCreateParticipantInput("  \n\t\n\r\n");
    assertEqual(empty.participantCount, 0);
    assertEqual(empty.nonEmptyEntries.length, 0);
    assertEqual(blanks.participantCount, 0);
    assertEqual(blanks.invalidEntries.length, 0);
  });


  test("Create participants: unique names retain normalized value and line number", () => {
    const analysis = analyzeCreateParticipantInput("  Ada Lovelace  \n\nBerta  Benz");
    assertEqual(analysis.participantCount, 2);
    assertDeepEqual(analysis.uniqueEntries.map((entry) => entry.normalizedName), ["Ada Lovelace", "Berta Benz"]);
    assertDeepEqual(analysis.uniqueEntries.map((entry) => entry.lineNumber), [1, 3]);
  });


  [
    ["Max\nMax", "same spelling"],
    ["Max\nMAX", "case"],
    ["Max  Mustermann\nMax Mustermann", "whitespace"],
    ["Jörg\nJorg", "diacritics"],
  ].forEach(([rawText, label]) => {
    test(`Create participants: duplicates use normalizeLookup (${label})`, () => {
      const analysis = analyzeCreateParticipantInput(rawText);
      assertEqual(analysis.nonEmptyEntries.length, 2);
      assertEqual(analysis.uniqueEntries.length, 1);
      assertEqual(analysis.duplicateGroups.length, 1);
      assertDeepEqual(analysis.duplicateGroups[0].lineNumbers, [1, 2]);
    });
  });


  test("Create participants: duplicate validation names both lines without deleting input", () => {
    const rawText = "Ada\nBerta\nADA";
    const validation = validateCreateConfiguration(createValidValidationInput("ko", 3, { participantsText: rawText }));
    const issue = validation.issues.find((entry) => entry.reasonCode === "participant_name_duplicate");
    assert(Boolean(issue));
    assert(issue.message.includes("Zeilen 1 und 3"));
    assertEqual(validation.participantAnalysis.lines.join("\n"), rawText);
    assertEqual(validation.participantAnalysis.nonEmptyEntries.length, 3);
  });


  test("Create participants: reserved bye placeholders are explicit blockers", () => {
    const validation = validateCreateConfiguration(createValidValidationInput("ko", 2, {
      participantsText: "Ada\nBYE",
    }));
    assert(validation.issues.some((entry) => entry.reasonCode === "participant_name_reserved"));
    assertEqual(validation.participantAnalysis.participantCount, 1);
    assertEqual(validation.participantAnalysis.invalidEntries[0].lineNumber, 2);
  });


  test("Create participants: participant-name fallback code maps safely without inventing character bans", () => {
    const issue = normalizeCreateValidationIssue({ reasonCode: "participant_name_invalid" });
    assertEqual(issue.fieldName, "participants");
    assertEqual(issue.section, "participants");
    assert(issue.message.includes("gültigen Teilnehmernamen"));
  });


  Object.entries(MODE_PARTICIPANT_LIMITS).forEach(([mode, limits]) => {
    [
      [limits.min - 1, false, "below minimum"],
      [limits.min, true, "minimum"],
      [Math.floor((limits.min + limits.max) / 2), true, "middle"],
      [limits.max, true, "maximum"],
      [limits.max + 1, false, "above maximum"],
    ].forEach(([count, expectedCountValid, label]) => {
      test(`Create validation limits: ${mode} ${label}`, () => {
        const overrides = mode === "groups_ko" && count % 2 === 1
          ? {
            groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL,
            groupsKoOddParticipantAcknowledged: true,
          }
          : {};
        const validation = validateCreateConfiguration(createValidValidationInput(mode, count, overrides));
        const hasCountIssue = validation.issues.some((entry) => entry.reasonCode === "participant_count_invalid");
        assertEqual(hasCountIssue, !expectedCountValid);
        assertEqual(validation.summary.participantLimits.min, limits.min);
        assertEqual(validation.summary.participantLimits.max, limits.max);
      });
    });
  });


  test("Create validation limits: mode switch reuses unchanged participant input", () => {
    const participantsText = createValidationParticipantText(17);
    const ko = validateCreateConfiguration(createValidValidationInput("ko", 17, { participantsText }));
    const league = validateCreateConfiguration(createValidValidationInput("league", 17, { participantsText }));
    assert(!ko.issues.some((entry) => entry.reasonCode === "participant_count_invalid"));
    assert(league.issues.some((entry) => entry.reasonCode === "participant_count_invalid"));
  });


  test("Create validation fields: tournament name is required", () => {
    const invalid = validateCreateConfiguration(createValidValidationInput("ko", 2, { name: "   " }));
    const valid = validateCreateConfiguration(createValidValidationInput("ko", 2, { name: "Freitag" }));
    assert(invalid.issues.some((entry) => entry.reasonCode === "tournament_name_required" && entry.fieldName === "name"));
    assert(!valid.issues.some((entry) => entry.reasonCode === "tournament_name_required"));
  });


  [0, 4, 22].forEach((bestOfLegs) => {
    test(`Create validation fields: raw Best of ${bestOfLegs} is not hidden by normalization`, () => {
      const validation = validateCreateConfiguration(createValidValidationInput("ko", 4, { bestOfLegs }));
      assert(validation.issues.some((entry) => entry.reasonCode === "best_of_invalid"));
      assert(validation.draft.bestOfLegs !== bestOfLegs);
    });
  });


  test("Create validation fields: X01 enums, board count and time profile use shipped sources", () => {
    const invalidCases = [
      ["startScore", 999, "start_score_invalid"],
      ["x01InMode", "Invalid", "x01_in_mode_invalid"],
      ["x01OutMode", "Invalid", "x01_out_mode_invalid"],
      ["x01BullOffMode", "Invalid", "x01_bull_off_mode_invalid"],
      ["x01BullMode", "Invalid", "x01_bull_mode_invalid"],
      ["x01MaxRounds", 33, "x01_max_rounds_invalid"],
      ["boardCount", 0, "board_count_invalid"],
      ["boardCount", TOURNAMENT_DURATION_MAX_BOARD_COUNT + 1, "board_count_invalid"],
      ["tournamentTimeProfile", "invalid", "tournament_time_profile_invalid"],
    ];
    invalidCases.forEach(([fieldName, value, reasonCode]) => {
      const validation = validateCreateConfiguration(createValidValidationInput("ko", 4, { [fieldName]: value }));
      assert(validation.issues.some((entry) => entry.reasonCode === reasonCode), `${fieldName} did not produce ${reasonCode}.`);
    });
  });


  test("Create validation fields: preset, mode and mode-specific enums expose stable raw-value codes", () => {
    const invalidCases = [
      [createValidValidationInput("ko", 4, { x01Preset: "unknown" }), "x01_preset_invalid", "x01Preset"],
      [createValidValidationInput("ko", 4, { mode: "unknown" }), "tournament_mode_invalid", "mode"],
      [createValidValidationInput("groups_ko", 8, { groupsKoOddParticipantPolicy: "unknown" }), "groups_ko_policy_invalid", "groupsKoOddParticipantPolicy"],
      [createValidValidationInput("double_ko", 8, { grandFinalResetMode: "unknown" }), "grand_final_reset_mode_invalid", "grandFinalResetMode"],
    ];
    invalidCases.forEach(([input, reasonCode, fieldName]) => {
      const issue = validateCreateConfiguration(input).issues.find((entry) => entry.reasonCode === reasonCode);
      assert(Boolean(issue), `${reasonCode} was not returned.`);
      assertEqual(issue.fieldName, fieldName);
    });
  });


  test("Create validation groups: even participants are valid", () => {
    const validation = validateCreateConfiguration(createValidValidationInput("groups_ko", 8));
    assert(validation.valid);
  });


  test("Create validation groups: odd require-even policy blocks", () => {
    const validation = validateCreateConfiguration(createValidValidationInput("groups_ko", 7));
    assert(validation.issues.some((entry) => entry.reasonCode === "groups_ko_odd_participants_blocked"));
  });


  test("Create validation groups: unequal policy requires and accepts acknowledgement", () => {
    const pending = validateCreateConfiguration(createValidValidationInput("groups_ko", 7, {
      groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL,
    }));
    const acknowledged = validateCreateConfiguration(createValidValidationInput("groups_ko", 7, {
      groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL,
      groupsKoOddParticipantAcknowledged: true,
    }));
    assert(pending.issues.some((entry) => entry.reasonCode === "groups_ko_unequal_groups_not_acknowledged"));
    assert(acknowledged.valid);
  });


  test("Create validation groups: two-player group remains a warning", () => {
    const validation = validateCreateConfiguration(createValidValidationInput("groups_ko", 4));
    assert(validation.valid);
    assert(validation.warnings.some((entry) => entry.reasonCode === "groups_ko_two_player_group" && entry.severity === "warning"));
  });


  test("Create validation preliminary: schedule, scoring, qualifier, type and final Best of stay authoritative", () => {
    const validKo = validateCreateConfiguration(createValidValidationInput("preliminary_final", 7));
    const invalidSchedule = validateCreateConfiguration(createValidValidationInput("preliminary_final", 7, { preliminaryMatchesPerParticipant: 5 }));
    const scheduleOutOfRange = validateCreateConfiguration(createValidValidationInput("preliminary_final", 8, { preliminaryMatchesPerParticipant: 9 }));
    const tooManyOpponents = validateCreateConfiguration(createValidValidationInput("preliminary_final", 5, { preliminaryMatchesPerParticipant: 5 }));
    const invalidScoring = validateCreateConfiguration(createValidValidationInput("preliminary_final", 7, { preliminaryWinPoints: 1 }));
    const invalidQualifierLow = validateCreateConfiguration(createValidValidationInput("preliminary_final", 7, { finalStageQualifierCount: 1 }));
    const invalidQualifier = validateCreateConfiguration(createValidValidationInput("preliminary_final", 7, { finalStageQualifierCount: 8 }));
    const validDouble = validateCreateConfiguration(createValidValidationInput("preliminary_final", 8, { finalStageType: FINAL_STAGE_TYPE_DOUBLE_KO }));
    const invalidType = validateCreateConfiguration(createValidValidationInput("preliminary_final", 8, { finalStageType: "invalid" }));
    const invalidBestOf = validateCreateConfiguration(createValidValidationInput("preliminary_final", 8, { finalStageBestOfLegs: 4 }));
    assert(validKo.valid);
    assert(invalidSchedule.issues.some((entry) => entry.reasonCode === "preliminary_equal_distribution_impossible"));
    assert(scheduleOutOfRange.issues.some((entry) => entry.reasonCode === "preliminary_match_count_out_of_range"));
    assert(tooManyOpponents.issues.some((entry) => entry.reasonCode === "preliminary_match_count_exceeds_unique_opponents"));
    assert(invalidScoring.issues.some((entry) => entry.reasonCode === "preliminary_scoring_invalid"));
    assert(invalidQualifierLow.issues.some((entry) => entry.reasonCode === "final_stage_qualifier_count_invalid"));
    assert(invalidQualifier.issues.some((entry) => entry.reasonCode === "final_stage_qualifier_count_invalid"));
    assert(validDouble.valid);
    assert(invalidType.issues.some((entry) => entry.reasonCode === "final_stage_type_invalid"));
    assert(invalidBestOf.issues.some((entry) => entry.reasonCode === "final_stage_best_of_invalid"));
  });


  test("Create validation overview: existing duration domain supplies match count and duration", () => {
    const koWithoutThird = validateCreateConfiguration(createValidValidationInput("ko", 4));
    const ko = validateCreateConfiguration(createValidValidationInput("ko", 4, { enableThirdPlaceMatch: true, boardCount: 2 }));
    const doubleKo = validateCreateConfiguration(createValidValidationInput("double_ko", 8, { grandFinalResetMode: GRAND_FINAL_RESET_IF_NEEDED }));
    const doubleKoSingle = validateCreateConfiguration(createValidValidationInput("double_ko", 8, { grandFinalResetMode: GRAND_FINAL_RESET_SINGLE_MATCH }));
    const groups = validateCreateConfiguration(createValidValidationInput("groups_ko", 8));
    const preliminary = validateCreateConfiguration(createValidValidationInput("preliminary_final", 8));
    assertEqual(koWithoutThird.summary.matchCount, 3);
    assertEqual(ko.summary.matchCount, 4);
    assertEqual(ko.summary.boardCount, 2);
    assert(ko.summary.durationEstimate.ready);
    assertEqual(doubleKo.summary.matchCount, 15);
    assertEqual(doubleKoSingle.summary.matchCount, 14);
    assertEqual(groups.summary.matchCount, 15);
    assertEqual(preliminary.summary.matchCount, 19);
    assertEqual(ko.summary.modeLabel, getModeParticipantLimits("ko").label);
    assertEqual(ko.summary.presetLabel, "Individuell / Manuell");
    assertEqual(ko.summary.participantCount, 4);
    assertEqual(ko.summary.participantLimits.min, MODE_PARTICIPANT_LIMITS.ko.min);
    assertEqual(ko.summary.openIssueCount, 0);
    assertEqual(ko.summary.valid, true);
  });


  test("Create validation overview: name does not hide calculation, participant errors do", () => {
    const missingName = validateCreateConfiguration(createValidValidationInput("ko", 4, { name: "" }));
    const tooFew = validateCreateConfiguration(createValidValidationInput("ko", 1));
    assertEqual(missingName.valid, false);
    assertEqual(missingName.summary.matchCount, 3);
    assertEqual(tooFew.summary.matchCount, null);
    assertEqual(tooFew.summary.durationEstimate.ready, false);
  });


  test("Create validation is pure and maps unknown reason codes safely", () => {
    const input = createValidValidationInput("ko", 4);
    const before = JSON.stringify(input);
    validateCreateConfiguration(input);
    assertEqual(JSON.stringify(input), before);
    const unknown = normalizeCreateValidationIssue({ reasonCode: "future_reason", message: "Zukünftiger Fehler" });
    assertEqual(unknown.fieldName, "form");
    assertEqual(unknown.section, "form");
    assertEqual(unknown.message, "Zukünftiger Fehler");
  });


  test("Create validation merges late known and unknown session failures into the same ordered structure", () => {
    const valid = validateCreateConfiguration(createValidValidationInput("ko", 4));
    const known = mergeCreateValidationFailure(valid, {
      reasonCode: "board_count_invalid",
      message: "Board-Konfiguration wurde nachträglich abgelehnt.",
    });
    const unknown = mergeCreateValidationFailure(valid, {
      reasonCode: "future_session_failure",
      message: "Spätere Domainprüfung fehlgeschlagen.",
    });
    assertEqual(known.valid, false);
    assertEqual(known.issues[0].fieldName, "boardCount");
    assertEqual(known.summary.openIssueCount, 1);
    assertEqual(unknown.issues[0].fieldName, "form");
    assertEqual(unknown.issues[0].message, "Spätere Domainprüfung fehlgeschlagen.");
  });
