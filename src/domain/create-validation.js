// Pure create-form validation shared by live UI, submit and session creation.
  const CREATE_VALIDATION_FIELD_ORDER = Object.freeze([
    "name",
    "participants",
    "mode",
    "x01Preset",
    "groupsKoOddParticipantPolicy",
    "groupsKoOddParticipantAcknowledged",
    "grandFinalResetMode",
    "preliminaryMatchesPerParticipant",
    "preliminaryWinPoints",
    "preliminaryDrawPoints",
    "preliminaryLossPoints",
    "finalStageType",
    "finalStageQualifierCount",
    "finalStageBestOfLegs",
    "bestOfLegs",
    "startScore",
    "x01InMode",
    "x01OutMode",
    "x01BullOffMode",
    "x01BullMode",
    "x01MaxRounds",
    "boardCount",
    "tournamentTimeProfile",
    "form",
  ]);

  const CREATE_VALIDATION_REASON_MAP = Object.freeze({
    tournament_name_required: Object.freeze({ fieldName: "name", section: "format", message: "Bitte einen Turniernamen eingeben." }),
    tournament_mode_invalid: Object.freeze({ fieldName: "mode", section: "format", message: "Bitte einen gültigen Turniermodus wählen." }),
    x01_preset_invalid: Object.freeze({ fieldName: "x01Preset", section: "format", message: "Bitte ein gültiges Turnierformat wählen." }),
    participant_count_invalid: Object.freeze({ fieldName: "participants", section: "participants", message: "Die Teilnehmerzahl liegt außerhalb der Grenzen des gewählten Modus." }),
    participant_name_duplicate: Object.freeze({ fieldName: "participants", section: "participants", message: "Ein Teilnehmername steht mehrfach in der Liste." }),
    participant_name_reserved: Object.freeze({ fieldName: "participants", section: "participants", message: "Ein reservierter Freilos-Platzhalter kann nicht als Teilnehmer verwendet werden." }),
    participant_name_invalid: Object.freeze({ fieldName: "participants", section: "participants", message: "Ein Eintrag ergibt keinen gültigen Teilnehmernamen." }),
    groups_ko_policy_invalid: Object.freeze({ fieldName: "groupsKoOddParticipantPolicy", section: "additional-rules", message: "Bitte eine gültige Gruppenregel wählen." }),
    groups_ko_odd_participants_blocked: Object.freeze({ fieldName: "groupsKoOddParticipantPolicy", section: "additional-rules", message: "Für gleich große Gruppen ist eine gerade Teilnehmerzahl erforderlich." }),
    groups_ko_unequal_groups_not_acknowledged: Object.freeze({ fieldName: "groupsKoOddParticipantAcknowledged", section: "additional-rules", message: "Bitte die Veranstalterregel für ungleiche Gruppen ausdrücklich bestätigen." }),
    groups_ko_two_player_group: Object.freeze({ fieldName: "groupsKoOddParticipantPolicy", section: "additional-rules", message: "In einer Zweiergruppe qualifizieren sich bei Top 2 beide Teilnehmer." }),
    grand_final_reset_mode_invalid: Object.freeze({ fieldName: "grandFinalResetMode", section: "additional-rules", message: "Bitte eine gültige Grand-Final-Regel wählen." }),
    preliminary_match_count_out_of_range: Object.freeze({ fieldName: "preliminaryMatchesPerParticipant", section: "additional-rules", message: "Vorrundenspiele je Teilnehmer müssen als ganze Zahl zwischen 4 und 8 angegeben werden." }),
    preliminary_match_count_exceeds_unique_opponents: Object.freeze({ fieldName: "preliminaryMatchesPerParticipant", section: "additional-rules", message: "Die Zahl der Vorrundenspiele übersteigt die möglichen unterschiedlichen Gegner." }),
    preliminary_equal_distribution_impossible: Object.freeze({ fieldName: "preliminaryMatchesPerParticipant", section: "additional-rules", message: "Die Vorrundenmatches können mit dieser Teilnehmerzahl nicht gleich verteilt werden." }),
    preliminary_scoring_invalid: Object.freeze({ fieldName: "preliminaryWinPoints", section: "additional-rules", message: "Punkte müssen ganze Zahlen von 0 bis 10 sein; Sieg > Unentschieden ≥ Niederlage." }),
    final_stage_type_invalid: Object.freeze({ fieldName: "finalStageType", section: "additional-rules", message: "Finalphase muss KO oder Doppel-KO sein." }),
    final_stage_qualifier_count_invalid: Object.freeze({ fieldName: "finalStageQualifierCount", section: "additional-rules", message: "Die Qualifikantenzahl passt nicht zur Teilnehmerzahl." }),
    final_stage_best_of_invalid: Object.freeze({ fieldName: "finalStageBestOfLegs", section: "additional-rules", message: "Finalphasen-Best-of muss eine ungerade ganze Zahl zwischen 1 und 21 sein." }),
    best_of_invalid: Object.freeze({ fieldName: "bestOfLegs", section: "game-rules", message: "Best of Legs muss eine ungerade ganze Zahl zwischen 1 und 21 sein." }),
    start_score_invalid: Object.freeze({ fieldName: "startScore", section: "game-rules", message: "Bitte gültige Startpunkte wählen." }),
    x01_in_mode_invalid: Object.freeze({ fieldName: "x01InMode", section: "game-rules", message: "Bitte einen gültigen In-Modus wählen." }),
    x01_out_mode_invalid: Object.freeze({ fieldName: "x01OutMode", section: "game-rules", message: "Bitte einen gültigen Out-Modus wählen." }),
    x01_bull_off_mode_invalid: Object.freeze({ fieldName: "x01BullOffMode", section: "game-rules", message: "Bitte einen gültigen Bull-off-Modus wählen." }),
    x01_bull_mode_invalid: Object.freeze({ fieldName: "x01BullMode", section: "game-rules", message: "Bitte einen gültigen Bull-Modus wählen." }),
    x01_max_rounds_invalid: Object.freeze({ fieldName: "x01MaxRounds", section: "game-rules", message: "Bitte einen gültigen Wert für Max Runden wählen." }),
    board_count_invalid: Object.freeze({ fieldName: "boardCount", section: "overview", message: `Die Board-Anzahl muss eine ganze Zahl zwischen 1 und ${TOURNAMENT_DURATION_MAX_BOARD_COUNT} sein.` }),
    tournament_time_profile_invalid: Object.freeze({ fieldName: "tournamentTimeProfile", section: "overview", message: "Bitte ein gültiges Zeitprofil wählen." }),
    create_validation_unknown: Object.freeze({ fieldName: "form", section: "form", message: "Die Turnierkonfiguration konnte nicht validiert werden." }),
  });


  function getCreateValidationReasonMeta(reasonCode) {
    return CREATE_VALIDATION_REASON_MAP[normalizeText(reasonCode || "")]
      || CREATE_VALIDATION_REASON_MAP.create_validation_unknown;
  }


  function normalizeCreateValidationIssue(rawIssue, defaults = {}) {
    const source = rawIssue && typeof rawIssue === "object" ? rawIssue : {};
    const requestedReasonCode = normalizeText(source.reasonCode || defaults.reasonCode || "");
    const knownReasonCode = CREATE_VALIDATION_REASON_MAP[requestedReasonCode]
      ? requestedReasonCode
      : (requestedReasonCode || "create_validation_unknown");
    const meta = getCreateValidationReasonMeta(requestedReasonCode);
    return {
      ...source,
      reasonCode: knownReasonCode,
      fieldName: normalizeText(source.fieldName || defaults.fieldName || meta.fieldName) || "form",
      section: normalizeText(source.section || defaults.section || meta.section) || "form",
      severity: source.severity === "warning" || defaults.severity === "warning" ? "warning" : "error",
      message: normalizeText(source.message || defaults.message || meta.message),
      details: source.details && typeof source.details === "object" ? source.details : {},
    };
  }


  function dedupeCreateValidationIssues(rawIssues) {
    const seen = new Set();
    const issues = [];
    (Array.isArray(rawIssues) ? rawIssues : []).forEach((rawIssue, sourceIndex) => {
      const issue = normalizeCreateValidationIssue(rawIssue);
      const detailKey = issue.details?.lookupKey || issue.details?.lineNumber || "";
      const key = `${issue.severity}|${issue.reasonCode}|${issue.fieldName}|${detailKey}|${issue.message}`;
      if (seen.has(key)) return;
      seen.add(key);
      issues.push({ ...issue, sourceIndex });
    });
    const fieldOrder = new Map(CREATE_VALIDATION_FIELD_ORDER.map((fieldName, index) => [fieldName, index]));
    return issues
      .sort((left, right) => (
        (fieldOrder.get(left.fieldName) ?? CREATE_VALIDATION_FIELD_ORDER.length)
        - (fieldOrder.get(right.fieldName) ?? CREATE_VALIDATION_FIELD_ORDER.length)
        || left.sourceIndex - right.sourceIndex
      ))
      .map(({ sourceIndex, ...issue }) => issue);
  }


  function formatCreateValidationLineNumbers(lineNumbers) {
    const values = (Array.isArray(lineNumbers) ? lineNumbers : [])
      .filter((value) => Number.isInteger(value) && value > 0);
    if (!values.length) return "";
    if (values.length === 1) return `Zeile ${values[0]}`;
    if (values.length === 2) return `Zeilen ${values[0]} und ${values[1]}`;
    return `Zeilen ${values.slice(0, -1).join(", ")} und ${values[values.length - 1]}`;
  }


  function analyzeCreateConfigurationParticipants(rawInput) {
    if (Object.prototype.hasOwnProperty.call(rawInput || {}, "participantsText")) {
      return analyzeCreateParticipantInput(rawInput?.participantsText);
    }
    if (Array.isArray(rawInput?.participants)) {
      return analyzeCreateParticipantEntries(rawInput.participants.map((entry, index) => ({
        rawLine: entry?.name ?? entry ?? "",
        lineNumber: index + 1,
        sourceIndex: index,
      })));
    }
    return analyzeCreateParticipantInput("");
  }


  function buildCreateValidationConfig(rawInput, draft, participantAnalysis, settings = null) {
    const source = rawInput && typeof rawInput === "object" ? rawInput : {};
    const read = (fieldName) => Object.prototype.hasOwnProperty.call(source, fieldName)
      ? source[fieldName]
      : draft[fieldName];
    const participants = participantAnalysis.uniqueEntries.map((entry, index) => {
      const sourceParticipant = Array.isArray(source.participants)
        ? source.participants[entry.sourceIndex]
        : null;
      return {
        id: normalizeText(sourceParticipant?.id || `create-validation-p-${index + 1}`),
        name: entry.normalizedName,
      };
    });
    return scopeCreateConfigToMode({
      name: read("name"),
      mode: normalizeText(read("mode") || "").toLowerCase(),
      bestOfLegs: read("bestOfLegs"),
      startScore: read("startScore"),
      x01Preset: read("x01Preset"),
      x01InMode: read("x01InMode"),
      x01OutMode: read("x01OutMode"),
      x01BullMode: read("x01BullMode"),
      x01MaxRounds: read("x01MaxRounds"),
      x01BullOffMode: read("x01BullOffMode"),
      lobbyVisibility: "private",
      boardCount: read("boardCount"),
      tournamentTimeProfile: Object.prototype.hasOwnProperty.call(source, "tournamentTimeProfile")
        ? source.tournamentTimeProfile
        : settings?.tournamentTimeProfile,
      randomizeKoRound1: read("randomizeKoRound1") === true,
      enableThirdPlaceMatch: read("enableThirdPlaceMatch") === true,
      grandFinalResetMode: read("grandFinalResetMode"),
      groupsKoOddParticipantPolicy: read("groupsKoOddParticipantPolicy"),
      groupsKoOddParticipantAcknowledged: read("groupsKoOddParticipantAcknowledged") === true,
      preliminaryMatchesPerParticipant: read("preliminaryMatchesPerParticipant"),
      preliminaryWinPoints: read("preliminaryWinPoints"),
      preliminaryDrawPoints: read("preliminaryDrawPoints"),
      preliminaryLossPoints: read("preliminaryLossPoints"),
      finalStageType: read("finalStageType"),
      finalStageQualifierCount: read("finalStageQualifierCount"),
      finalStageBestOfLegs: read("finalStageBestOfLegs"),
      koDrawLocked: source.koDrawLocked,
      participants,
    });
  }


  function validateCreateRawFieldValues(rawInput, draft, config) {
    const source = rawInput && typeof rawInput === "object" ? rawInput : {};
    const issues = [];
    const read = (fieldName) => Object.prototype.hasOwnProperty.call(source, fieldName)
      ? source[fieldName]
      : draft[fieldName];
    const integerInRange = (value, min, max, odd = false) => {
      if (value === null || value === undefined || (typeof value === "string" && !value.trim())) return false;
      const parsed = Number(value);
      return Number.isInteger(parsed) && parsed >= min && parsed <= max && (!odd || parsed % 2 === 1);
    };

    const requestedPreset = normalizeText(read("x01Preset") || "").toLowerCase();
    if (requestedPreset !== X01_PRESET_CUSTOM && !getCreatePresetDefinition(requestedPreset)) {
      issues.push({ reasonCode: "x01_preset_invalid" });
    }
    if (config.mode !== "preliminary_final" && !integerInRange(read("bestOfLegs"), 1, 21, true)) {
      issues.push({ reasonCode: "best_of_invalid" });
    }
    if (!X01_START_SCORE_OPTIONS.includes(Number(read("startScore")))) {
      issues.push({ reasonCode: "start_score_invalid" });
    }
    if (!X01_IN_MODES.includes(read("x01InMode"))) {
      issues.push({ reasonCode: "x01_in_mode_invalid" });
    }
    if (!X01_OUT_MODES.includes(read("x01OutMode"))) {
      issues.push({ reasonCode: "x01_out_mode_invalid" });
    }
    if (!X01_BULL_OFF_MODES.includes(read("x01BullOffMode"))) {
      issues.push({ reasonCode: "x01_bull_off_mode_invalid" });
    }
    if (!X01_BULL_MODES.includes(read("x01BullMode"))) {
      issues.push({ reasonCode: "x01_bull_mode_invalid" });
    }
    if (!X01_MAX_ROUNDS_OPTIONS.includes(Number(read("x01MaxRounds")))) {
      issues.push({ reasonCode: "x01_max_rounds_invalid" });
    }
    if (!integerInRange(read("boardCount"), 1, TOURNAMENT_DURATION_MAX_BOARD_COUNT)) {
      issues.push({ reasonCode: "board_count_invalid" });
    }
    const timeProfile = normalizeText(
      Object.prototype.hasOwnProperty.call(source, "tournamentTimeProfile")
        ? source.tournamentTimeProfile
        : config.tournamentTimeProfile,
    ).toLowerCase();
    if (!TOURNAMENT_TIME_PROFILES.includes(timeProfile)) {
      issues.push({ reasonCode: "tournament_time_profile_invalid" });
    }
    if (
      config.mode === "groups_ko"
      && !GROUPS_KO_ODD_PARTICIPANT_POLICIES.includes(read("groupsKoOddParticipantPolicy"))
    ) {
      issues.push({ reasonCode: "groups_ko_policy_invalid" });
    }
    if (
      config.mode === "double_ko"
      && ![GRAND_FINAL_RESET_IF_NEEDED, GRAND_FINAL_RESET_SINGLE_MATCH].includes(read("grandFinalResetMode"))
    ) {
      issues.push({ reasonCode: "grand_final_reset_mode_invalid" });
    }
    if (config.mode === "preliminary_final") {
      ["preliminaryWinPoints", "preliminaryDrawPoints", "preliminaryLossPoints"].forEach((fieldName) => {
        if (!integerInRange(read(fieldName), 0, 10)) {
          issues.push({
            reasonCode: "preliminary_scoring_invalid",
            fieldName,
            section: "additional-rules",
            message: "Bitte eine ganze Punktzahl zwischen 0 und 10 eingeben.",
          });
        }
      });
    }
    return issues.map((issue) => normalizeCreateValidationIssue(issue));
  }


  function buildCreateValidationEstimate(config, draft, issues, settings = null) {
    const estimate = estimateTournamentDuration({
      ...config,
      bestOfLegs: draft.bestOfLegs,
      startScore: draft.startScore,
      x01Preset: draft.x01Preset,
      x01InMode: draft.x01InMode,
      x01OutMode: draft.x01OutMode,
      x01BullMode: draft.x01BullMode,
      x01MaxRounds: draft.x01MaxRounds,
      x01BullOffMode: draft.x01BullOffMode,
      boardCount: draft.boardCount,
      grandFinalResetMode: draft.grandFinalResetMode,
      enableThirdPlaceMatch: draft.enableThirdPlaceMatch,
      preliminaryMatchesPerParticipant: draft.preliminaryMatchesPerParticipant,
      finalStageQualifierCount: draft.finalStageQualifierCount,
      finalStageType: draft.finalStageType,
      finalStageBestOfLegs: draft.finalStageBestOfLegs,
      tournamentTimeProfile: config.tournamentTimeProfile,
    }, settings);
    const estimateIgnoredFields = new Set(["name", "x01Preset"]);
    const blockingIssue = issues.find((issue) => issue.severity === "error" && !estimateIgnoredFields.has(issue.fieldName));
    if (!blockingIssue) return estimate;
    return {
      ...estimate,
      ready: false,
      reason: blockingIssue.message,
      matchCount: 0,
      likelyMinutes: 0,
      lowMinutes: 0,
      highMinutes: 0,
    };
  }


  function validateCreateConfiguration(rawInput, settings = null) {
    const source = rawInput && typeof rawInput === "object" ? rawInput : {};
    const draft = normalizeCreateDraft(source, settings);
    const participantAnalysis = analyzeCreateConfigurationParticipants(source);
    const config = buildCreateValidationConfig(source, draft, participantAnalysis, settings);
    const participantIssues = [];
    participantAnalysis.duplicateGroups.forEach((group) => {
      const lineText = formatCreateValidationLineNumbers(group.lineNumbers);
      participantIssues.push(normalizeCreateValidationIssue({
        reasonCode: "participant_name_duplicate",
        message: `„${group.displayName}“ steht mehrfach in der Teilnehmerliste${lineText ? ` (${lineText})` : ""}.`,
        details: {
          lookupKey: group.lookupKey,
          lineNumbers: group.lineNumbers.slice(),
        },
      }));
    });
    participantAnalysis.invalidEntries.forEach((entry) => {
      participantIssues.push(normalizeCreateValidationIssue({
        reasonCode: entry.reasonCode,
        message: entry.message,
        details: {
          lookupKey: entry.lookupKey,
          lineNumber: entry.lineNumber,
        },
      }));
    });
    const domainIssues = validateCreateConfigDetails(config)
      .map((issue) => normalizeCreateValidationIssue(issue));
    const rawValueIssues = validateCreateRawFieldValues(source, draft, config);
    const issues = dedupeCreateValidationIssues([
      ...participantIssues,
      ...domainIssues,
      ...rawValueIssues,
    ]);
    const warnings = [];
    if (config.mode === "groups_ko") {
      const groupAnalysis = analyzeGroupsKoParticipantDistribution(participantAnalysis.participantCount);
      if (
        groupAnalysis.hasTwoPlayerGroup
        && participantAnalysis.participantCount >= getModeParticipantLimits(config.mode).min
      ) {
        warnings.push(normalizeCreateValidationIssue({
          reasonCode: "groups_ko_two_player_group",
          severity: "warning",
          details: { analysis: groupAnalysis },
        }));
      }
    }
    const durationEstimate = buildCreateValidationEstimate(config, draft, issues, settings);
    const limits = getModeParticipantLimits(config.mode);
    const modeLabel = limits.label;
    const activePresetId = getAppliedCreatePresetId(draft);
    const valid = issues.length === 0;
    return {
      valid,
      issues,
      warnings: dedupeCreateValidationIssues(warnings),
      participantAnalysis,
      draft,
      config,
      summary: {
        mode: config.mode,
        modeLabel,
        presetId: activePresetId,
        presetLabel: activePresetId === X01_PRESET_CUSTOM
          ? "Individuell / Manuell"
          : getCreatePresetLabel(activePresetId),
        participantCount: participantAnalysis.participantCount,
        participantLimits: limits,
        boardCount: Number.isInteger(Number(config.boardCount)) ? Number(config.boardCount) : draft.boardCount,
        durationEstimate,
        matchCount: durationEstimate.ready ? durationEstimate.matchCount : null,
        valid,
        openIssueCount: issues.length,
      },
    };
  }


  function mergeCreateValidationFailure(validation, result) {
    const base = validation && typeof validation === "object"
      ? validation
      : validateCreateConfiguration({});
    const details = Array.isArray(result?.validationDetails) && result.validationDetails.length
      ? result.validationDetails
      : [{
        reasonCode: result?.reasonCode || "create_validation_unknown",
        message: result?.message,
      }];
    const failureIssues = details.map((issue) => normalizeCreateValidationIssue(issue, {
      message: result?.message,
    }));
    const issues = dedupeCreateValidationIssues([...(base.issues || []), ...failureIssues]);
    return {
      ...base,
      valid: false,
      issues,
      summary: {
        ...(base.summary || {}),
        valid: false,
        openIssueCount: issues.length,
      },
    };
  }
