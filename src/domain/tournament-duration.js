// Domain layer: deterministic single-board tournament duration estimation.

  const TOURNAMENT_DURATION_BASE_LEG_MINUTES = 3.75;
  const TOURNAMENT_DURATION_RESULT_ENTRY_MINUTES = 1.6;
  const TOURNAMENT_DURATION_LOW_FACTOR = 0.90;
  const TOURNAMENT_DURATION_HIGH_BASE_PADDING = 0.12;
  const TOURNAMENT_DURATION_SCORE_FACTORS = Object.freeze({
    121: 0.55,
    170: 0.63,
    301: 0.80,
    501: 1.00,
    701: 1.15,
    901: 1.28,
  });
  const TOURNAMENT_DURATION_IN_FACTORS = Object.freeze({
    Straight: 1.00,
    Double: 1.06,
    Master: 1.10,
  });
  const TOURNAMENT_DURATION_OUT_FACTORS = Object.freeze({
    Straight: 0.93,
    Double: 1.00,
    Master: 1.05,
  });
  const TOURNAMENT_DURATION_BULL_FACTORS = Object.freeze({
    "25/50": 1.00,
    "50/50": 0.98,
  });
  const TOURNAMENT_DURATION_BULL_OFF_OVERHEAD = Object.freeze({
    Off: 0.00,
    Normal: 0.40,
    Official: 0.65,
  });
  const TOURNAMENT_DURATION_MAX_ROUNDS_HIGH_PADDING = Object.freeze({
    15: 0.00,
    20: 0.02,
    50: 0.06,
    80: 0.09,
  });
  const TOURNAMENT_TIME_PROFILE_META = Object.freeze({
    [TOURNAMENT_TIME_PROFILE_FAST]: Object.freeze({
      id: TOURNAMENT_TIME_PROFILE_FAST,
      label: "Schnell",
      description: "F\u00fcr z\u00fcgige Felder mit wenig Verz\u00f6gerung zwischen den Matches.",
      legPaceMultiplier: 0.88,
      highPaddingExtra: 0.00,
    }),
    [TOURNAMENT_TIME_PROFILE_NORMAL]: Object.freeze({
      id: TOURNAMENT_TIME_PROFILE_NORMAL,
      label: "Normal",
      description: "Ausgewogener Standard f\u00fcr lokale Turniere.",
      legPaceMultiplier: 1.00,
      highPaddingExtra: 0.00,
    }),
    [TOURNAMENT_TIME_PROFILE_SLOW]: Object.freeze({
      id: TOURNAMENT_TIME_PROFILE_SLOW,
      label: "Langsam",
      description: "F\u00fcr gemischte Felder oder langsamere Board-Wechsel.",
      legPaceMultiplier: 1.15,
      highPaddingExtra: 0.02,
    }),
  });


  function getTournamentTimeProfileMeta(profileId = TOURNAMENT_TIME_PROFILE_NORMAL) {
    const normalized = sanitizeTournamentTimeProfile(profileId, TOURNAMENT_TIME_PROFILE_NORMAL);
    return TOURNAMENT_TIME_PROFILE_META[normalized] || TOURNAMENT_TIME_PROFILE_META[TOURNAMENT_TIME_PROFILE_NORMAL];
  }


  function getTournamentDurationCombination(n, k) {
    if (!Number.isFinite(n) || !Number.isFinite(k) || k < 0 || k > n) {
      return 0;
    }
    let normalizedK = k;
    if (normalizedK > n - normalizedK) {
      normalizedK = n - normalizedK;
    }
    let result = 1;
    for (let index = 1; index <= normalizedK; index += 1) {
      result = (result * (n - normalizedK + index)) / index;
    }
    return result;
  }


  function getExpectedLegsForBestOf(bestOfLegs) {
    const bestOf = sanitizeBestOf(bestOfLegs);
    const legsToWin = getLegsToWin(bestOf);
    let expectedLegs = 0;
    for (let totalLegs = legsToWin; totalLegs < legsToWin * 2; totalLegs += 1) {
      const probability = 2
        * getTournamentDurationCombination(totalLegs - 1, legsToWin - 1)
        * Math.pow(0.5, totalLegs);
      expectedLegs += totalLegs * probability;
    }
    return expectedLegs;
  }


  function getTournamentDurationMatchCount(mode, participantCount) {
    const count = clampInt(participantCount, 0, 0, TECHNICAL_PARTICIPANT_HARD_MAX);
    if (mode === "league") {
      return (count * (count - 1)) / 2;
    }
    if (mode === "groups_ko") {
      const groupA = Math.ceil(count / 2);
      const groupB = Math.floor(count / 2);
      return ((groupA * (groupA - 1)) / 2) + ((groupB * (groupB - 1)) / 2) + 3;
    }
    return Math.max(0, count - 1);
  }


  function getTournamentDurationPhaseOverheadMinutes(mode, participantCount) {
    const count = clampInt(participantCount, 0, 0, TECHNICAL_PARTICIPANT_HARD_MAX);
    if (mode === "groups_ko") {
      return 4;
    }
    if (mode !== "ko" || count < 2) {
      return 0;
    }
    const bracketSize = calculateBracketSize(count);
    const rounds = Math.log2(bracketSize);
    return Math.max(0, rounds - 1) * 1.5;
  }


  function getTournamentDurationDifficultyPadding(x01Settings) {
    let padding = 0;
    if (x01Settings.baseScore === 701) {
      padding += 0.03;
    } else if (x01Settings.baseScore === 901) {
      padding += 0.05;
    }
    if (x01Settings.inMode === "Double") {
      padding += 0.01;
    } else if (x01Settings.inMode === "Master") {
      padding += 0.02;
    }
    if (x01Settings.outMode === "Master") {
      padding += 0.01;
    }
    if (x01Settings.bullOffMode === "Official") {
      padding += 0.01;
    }
    return padding;
  }


  function estimateTournamentDuration(rawInput, settings = null) {
    const modeRaw = normalizeText(rawInput?.mode || "ko");
    const mode = ["ko", "league", "groups_ko"].includes(modeRaw) ? modeRaw : "ko";
    const participants = (Array.isArray(rawInput?.participants) ? rawInput.participants : [])
      .filter((entry) => normalizeText(entry?.id || entry?.name || entry || ""));
    const participantCount = participants.length;
    const participantLimits = getModeParticipantLimits(mode);
    const profile = getTournamentTimeProfileMeta(
      rawInput?.tournamentTimeProfile ?? settings?.tournamentTimeProfile,
    );
    const x01Settings = normalizeTournamentX01Settings({
      presetId: rawInput?.x01Preset,
      baseScore: rawInput?.startScore,
      inMode: rawInput?.x01InMode,
      outMode: rawInput?.x01OutMode,
      bullMode: rawInput?.x01BullMode,
      maxRounds: rawInput?.x01MaxRounds,
      bullOffMode: rawInput?.x01BullOffMode,
      lobbyVisibility: rawInput?.lobbyVisibility,
    }, rawInput?.startScore);
    const bestOfLegs = sanitizeBestOf(rawInput?.bestOfLegs);
    const estimate = {
      ready: false,
      reason: "",
      mode,
      participantCount,
      participantLimits,
      profile,
      bestOfLegs,
      legsToWin: getLegsToWin(bestOfLegs),
      x01: x01Settings,
      expectedLegs: 0,
      legMinutes: 0,
      matchMinutes: 0,
      matchCount: 0,
      phaseOverheadMinutes: 0,
      likelyMinutes: 0,
      lowMinutes: 0,
      highMinutes: 0,
      singleBoard: true,
    };

    if (participantCount < participantLimits.min || participantCount > participantLimits.max) {
      estimate.reason = getParticipantCountError(mode, participantCount);
      return estimate;
    }

    const expectedLegs = getExpectedLegsForBestOf(bestOfLegs);
    const bullModeFactor = x01Settings.bullOffMode === "Off"
      ? 1
      : (TOURNAMENT_DURATION_BULL_FACTORS[x01Settings.bullMode] || 1);
    const legMinutes = TOURNAMENT_DURATION_BASE_LEG_MINUTES
      * profile.legPaceMultiplier
      * (TOURNAMENT_DURATION_SCORE_FACTORS[x01Settings.baseScore] || 1)
      * (TOURNAMENT_DURATION_IN_FACTORS[x01Settings.inMode] || 1)
      * (TOURNAMENT_DURATION_OUT_FACTORS[x01Settings.outMode] || 1)
      * bullModeFactor;
    const matchMinutes = (expectedLegs * legMinutes)
      + TOURNAMENT_DURATION_RESULT_ENTRY_MINUTES
      + (TOURNAMENT_DURATION_BULL_OFF_OVERHEAD[x01Settings.bullOffMode] || 0);
    const matchCount = getTournamentDurationMatchCount(mode, participantCount);
    const phaseOverheadMinutes = getTournamentDurationPhaseOverheadMinutes(mode, participantCount);
    const likelyMinutes = (matchCount * matchMinutes) + phaseOverheadMinutes;
    const highPadding = TOURNAMENT_DURATION_HIGH_BASE_PADDING
      + (TOURNAMENT_DURATION_MAX_ROUNDS_HIGH_PADDING[x01Settings.maxRounds] || 0)
      + getTournamentDurationDifficultyPadding(x01Settings)
      + profile.highPaddingExtra;

    estimate.ready = true;
    estimate.expectedLegs = expectedLegs;
    estimate.legMinutes = legMinutes;
    estimate.matchMinutes = matchMinutes;
    estimate.matchCount = matchCount;
    estimate.phaseOverheadMinutes = phaseOverheadMinutes;
    estimate.likelyMinutes = likelyMinutes;
    estimate.lowMinutes = likelyMinutes * TOURNAMENT_DURATION_LOW_FACTOR;
    estimate.highMinutes = likelyMinutes * (1 + highPadding);
    return estimate;
  }


  function estimateTournamentDurationFromDraft(rawDraft, settings = null) {
    const draft = normalizeCreateDraft(rawDraft, settings);
    const participants = parseParticipantLines(draft.participantsText);
    return estimateTournamentDuration({
      mode: draft.mode,
      bestOfLegs: draft.bestOfLegs,
      startScore: draft.startScore,
      x01Preset: draft.x01Preset,
      x01InMode: draft.x01InMode,
      x01OutMode: draft.x01OutMode,
      x01BullMode: draft.x01BullMode,
      x01MaxRounds: draft.x01MaxRounds,
      x01BullOffMode: draft.x01BullOffMode,
      lobbyVisibility: draft.lobbyVisibility,
      participants,
      tournamentTimeProfile: settings?.tournamentTimeProfile,
    }, settings);
  }


  function estimateTournamentDurationFromTournament(tournament, settings = null) {
    if (!tournament) {
      return estimateTournamentDuration(null, settings);
    }
    const x01Settings = normalizeTournamentX01Settings(tournament?.x01, tournament?.startScore);
    return estimateTournamentDuration({
      mode: tournament.mode,
      bestOfLegs: tournament.bestOfLegs,
      startScore: x01Settings.baseScore,
      x01Preset: x01Settings.presetId,
      x01InMode: x01Settings.inMode,
      x01OutMode: x01Settings.outMode,
      x01BullMode: x01Settings.bullMode,
      x01MaxRounds: x01Settings.maxRounds,
      x01BullOffMode: x01Settings.bullOffMode,
      lobbyVisibility: x01Settings.lobbyVisibility,
      participants: tournament.participants,
      tournamentTimeProfile: settings?.tournamentTimeProfile,
    }, settings);
  }
