// Auto-generated module split from dist source.
  // Source of truth for shipped presets:
  // - "PDC European Tour (Official)" models the default round setup this project can represent honestly:
  //   KO, Best of 11 Legs, 501, Straight In, Double Out.
  // - PDC World Championship style set-play is intentionally not shipped as an "official" preset here,
  //   because the AutoDarts lobby payload only supports legs/first-to-N, not sets.
  function getCreatePresetDefinitions() {
    return Object.freeze({
      [X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL]: Object.freeze({
        id: X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL,
        label: "PDC European Tour (Official)",
        shortLabel: "PDC European Tour",
        description: "European Tour default round format: KO, Best of 11 Legs (First to 6), 501, Straight In, Double Out, Bull 25/50.",
        notes: Object.freeze([
          "Bull-off Normal is the AutoDarts mapping used by this preset.",
          "Max Runden 50 remains a technical AutoDarts limit and is not part of the PDC rule claim.",
        ]),
        apply: Object.freeze({
          mode: "ko",
          bestOfLegs: 11,
          startScore: 501,
          x01InMode: "Straight",
          x01OutMode: "Double",
          x01BullMode: "25/50",
          x01BullOffMode: "Normal",
          x01MaxRounds: 50,
          lobbyVisibility: "private",
        }),
      }),
      [X01_PRESET_PDC_501_DOUBLE_OUT_BASIC]: Object.freeze({
        id: X01_PRESET_PDC_501_DOUBLE_OUT_BASIC,
        label: "PDC 501 / Double Out (Basic)",
        shortLabel: "PDC 501 / DO Basic",
        description: "Compatibility preset for the former 'PDC-Standard': KO, Best of 5 Legs, 501, Straight In, Double Out, Bull 25/50.",
        notes: Object.freeze([
          "This is not an official PDC event format.",
          "Kept to preserve older saved drafts and tournaments without silently changing their match length.",
        ]),
        apply: Object.freeze({
          mode: "ko",
          bestOfLegs: 5,
          startScore: 501,
          x01InMode: "Straight",
          x01OutMode: "Double",
          x01BullMode: "25/50",
          x01BullOffMode: "Normal",
          x01MaxRounds: 50,
          lobbyVisibility: "private",
        }),
      }),
    });
  }


  function getCreatePresetOrder() {
    return Object.freeze([
      X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL,
      X01_PRESET_PDC_501_DOUBLE_OUT_BASIC,
    ]);
  }


  function getCreatePresetAliasMap() {
    return Object.freeze({
      [X01_PRESET_LEGACY_PDC_STANDARD]: X01_PRESET_PDC_501_DOUBLE_OUT_BASIC,
    });
  }


  function getDefaultCreatePresetId() {
    return X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL;
  }


  function getCreatePresetDefinition(presetId) {
    const presetDefinitions = getCreatePresetDefinitions();
    const normalizedPreset = normalizeText(presetId || "").toLowerCase();
    const canonicalPreset = getCreatePresetAliasMap()[normalizedPreset] || normalizedPreset;
    return presetDefinitions[canonicalPreset] || null;
  }


  function getCreatePresetCatalog() {
    const presetDefinitions = getCreatePresetDefinitions();
    return getCreatePresetOrder().map((presetId) => presetDefinitions[presetId]);
  }


  function getCreatePresetLabel(presetId) {
    return getCreatePresetDefinition(presetId)?.label || "Individuell";
  }


  function buildPresetX01Settings(presetId) {
    const preset = getCreatePresetDefinition(presetId);
    if (!preset) {
      return null;
    }
    const apply = preset.apply;
    return {
      presetId: preset.id,
      variant: X01_VARIANT,
      baseScore: apply.startScore,
      inMode: apply.x01InMode,
      outMode: apply.x01OutMode,
      bullMode: apply.x01BullMode,
      maxRounds: apply.x01MaxRounds,
      bullOffMode: apply.x01BullOffMode,
      lobbyVisibility: apply.lobbyVisibility,
    };
  }


  function buildExplicitX01Settings(rawInput, fallbackStartScore = 501) {
    const input = rawInput && typeof rawInput === "object" ? rawInput : {};
    return {
      presetId: X01_PRESET_CUSTOM,
      variant: X01_VARIANT,
      baseScore: sanitizeStartScore(input.baseScore ?? fallbackStartScore),
      inMode: sanitizeX01InMode(input.inMode),
      outMode: sanitizeX01OutMode(input.outMode),
      bullMode: sanitizeX01BullMode(input.bullMode),
      maxRounds: sanitizeX01MaxRounds(input.maxRounds),
      bullOffMode: sanitizeX01BullOffMode(input.bullOffMode || input.bullOff),
      lobbyVisibility: sanitizeLobbyVisibility(input.lobbyVisibility ?? input.isPrivate),
    };
  }


  function isSameX01Settings(left, right) {
    return Boolean(left && right)
      && left.baseScore === right.baseScore
      && left.inMode === right.inMode
      && left.outMode === right.outMode
      && left.bullMode === right.bullMode
      && left.maxRounds === right.maxRounds
      && left.bullOffMode === right.bullOffMode
      && left.lobbyVisibility === right.lobbyVisibility;
  }


  function matchesPresetX01Settings(input, presetId) {
    const presetX01 = buildPresetX01Settings(presetId);
    if (!presetX01) {
      return false;
    }
    const fallbackStartScore = input?.baseScore ?? input?.startScore ?? presetX01.baseScore;
    const normalized = buildExplicitX01Settings({
      baseScore: input?.baseScore ?? input?.startScore,
      inMode: input?.inMode ?? input?.x01InMode,
      outMode: input?.outMode ?? input?.x01OutMode,
      bullMode: input?.bullMode ?? input?.x01BullMode,
      maxRounds: input?.maxRounds ?? input?.x01MaxRounds,
      bullOffMode: input?.bullOffMode ?? input?.x01BullOffMode,
      lobbyVisibility: input?.lobbyVisibility,
    }, fallbackStartScore);
    return isSameX01Settings(normalized, presetX01);
  }


  function matchesCreatePresetSetup(input, presetId) {
    const preset = getCreatePresetDefinition(presetId);
    if (!preset) {
      return false;
    }
    const apply = preset.apply;
    const mode = normalizeText(input?.mode || "").toLowerCase();
    if (mode !== apply.mode) {
      return false;
    }
    if (sanitizeBestOf(input?.bestOfLegs) !== apply.bestOfLegs) {
      return false;
    }
    const x01Input = input?.x01 && typeof input.x01 === "object"
      ? input.x01
      : input;
    return matchesPresetX01Settings(x01Input, preset.id);
  }


  function validateCreatePresetDefinitions() {
    return getCreatePresetCatalog().map((preset) => {
      const apply = preset.apply || {};
      const issues = [];
      const normalizedX01 = buildExplicitX01Settings({
        baseScore: apply.startScore,
        inMode: apply.x01InMode,
        outMode: apply.x01OutMode,
        bullMode: apply.x01BullMode,
        maxRounds: apply.x01MaxRounds,
        bullOffMode: apply.x01BullOffMode,
        lobbyVisibility: apply.lobbyVisibility,
      }, apply.startScore);

      if (!normalizeText(preset.id)) {
        issues.push("missing id");
      }
      if (!normalizeText(preset.label)) {
        issues.push("missing label");
      }
      if (!normalizeText(preset.description)) {
        issues.push("missing description");
      }
      if (!Array.isArray(preset.notes) || !preset.notes.length) {
        issues.push("missing notes");
      }
      if (apply.mode !== "ko") {
        issues.push("mode must be ko");
      }
      if (sanitizeBestOf(apply.bestOfLegs) !== apply.bestOfLegs) {
        issues.push("invalid bestOfLegs");
      }
      if (normalizedX01.baseScore !== apply.startScore) {
        issues.push("invalid startScore");
      }
      if (normalizedX01.inMode !== apply.x01InMode) {
        issues.push("invalid in mode");
      }
      if (normalizedX01.outMode !== apply.x01OutMode) {
        issues.push("invalid out mode");
      }
      if (normalizedX01.bullMode !== apply.x01BullMode) {
        issues.push("invalid bull mode");
      }
      if (normalizedX01.maxRounds !== apply.x01MaxRounds) {
        issues.push("invalid max rounds");
      }
      if (normalizedX01.bullOffMode !== apply.x01BullOffMode) {
        issues.push("invalid bull-off mode");
      }
      if (normalizedX01.lobbyVisibility !== apply.lobbyVisibility) {
        issues.push("invalid lobby visibility");
      }
      if (!isSameX01Settings(buildPresetX01Settings(preset.id), normalizedX01)) {
        issues.push("preset x01 projection failed");
      }

      return {
        id: preset.id,
        ok: issues.length === 0,
        issues,
      };
    });
  }


  function createDefaultCreateDraft(settings = null) {
    const defaultRandomize = settings?.featureFlags?.randomizeKoRound1 !== false;
    const defaultPresetId = getDefaultCreatePresetId();
    const presetX01 = buildPresetX01Settings(defaultPresetId);
    const apply = getCreatePresetDefinition(defaultPresetId)?.apply || {};
    return {
      name: "",
      mode: apply.mode || "ko",
      bestOfLegs: apply.bestOfLegs || 11,
      startScore: presetX01?.baseScore || 501,
      x01Preset: defaultPresetId,
      x01InMode: presetX01?.inMode || "Straight",
      x01OutMode: presetX01?.outMode || "Double",
      x01BullMode: presetX01?.bullMode || "25/50",
      x01MaxRounds: presetX01?.maxRounds || 50,
      x01BullOffMode: presetX01?.bullOffMode || "Normal",
      lobbyVisibility: presetX01?.lobbyVisibility || "private",
      participantsText: "",
      randomizeKoRound1: Boolean(defaultRandomize),
    };
  }


  function normalizeCreateDraft(rawDraft, settings = null) {
    const base = createDefaultCreateDraft(settings);
    const hasDraftObject = rawDraft && typeof rawDraft === "object";
    const hasExplicitPreset = hasDraftObject && Object.prototype.hasOwnProperty.call(rawDraft, "x01Preset");
    const requestedPresetId = hasExplicitPreset
      ? sanitizeX01Preset(rawDraft?.x01Preset, X01_PRESET_CUSTOM)
      : (hasDraftObject ? X01_PRESET_CUSTOM : base.x01Preset);
    const requestedPreset = getCreatePresetDefinition(requestedPresetId);
    const presetApply = requestedPreset?.apply || null;
    const modeFallback = presetApply?.mode || base.mode;
    const modeRaw = normalizeText(rawDraft?.mode ?? modeFallback);
    const mode = ["ko", "league", "groups_ko"].includes(modeRaw) ? modeRaw : modeFallback;
    const bestOfFallback = presetApply?.bestOfLegs ?? base.bestOfLegs;
    const startScoreFallback = presetApply?.startScore ?? base.startScore;
    const x01Settings = normalizeTournamentX01Settings({
      presetId: X01_PRESET_CUSTOM,
      baseScore: rawDraft?.startScore ?? startScoreFallback,
      inMode: rawDraft?.x01InMode ?? presetApply?.x01InMode ?? base.x01InMode,
      outMode: rawDraft?.x01OutMode ?? presetApply?.x01OutMode ?? base.x01OutMode,
      bullMode: rawDraft?.x01BullMode ?? presetApply?.x01BullMode ?? base.x01BullMode,
      maxRounds: rawDraft?.x01MaxRounds ?? presetApply?.x01MaxRounds ?? base.x01MaxRounds,
      bullOffMode: rawDraft?.x01BullOffMode ?? presetApply?.x01BullOffMode ?? base.x01BullOffMode,
      lobbyVisibility: rawDraft?.lobbyVisibility ?? presetApply?.lobbyVisibility ?? base.lobbyVisibility,
    }, rawDraft?.startScore ?? startScoreFallback);
    const draft = {
      name: normalizeText(rawDraft?.name || base.name),
      mode,
      bestOfLegs: sanitizeBestOf(rawDraft?.bestOfLegs ?? bestOfFallback),
      startScore: x01Settings.baseScore,
      x01Preset: X01_PRESET_CUSTOM,
      x01InMode: x01Settings.inMode,
      x01OutMode: x01Settings.outMode,
      x01BullMode: x01Settings.bullMode,
      x01MaxRounds: x01Settings.maxRounds,
      x01BullOffMode: x01Settings.bullOffMode,
      lobbyVisibility: x01Settings.lobbyVisibility,
      participantsText: String(rawDraft?.participantsText ?? base.participantsText),
      randomizeKoRound1: typeof rawDraft?.randomizeKoRound1 === "boolean"
        ? rawDraft.randomizeKoRound1
        : base.randomizeKoRound1,
    };
    if (requestedPreset && matchesCreatePresetSetup(draft, requestedPreset.id)) {
      draft.x01Preset = requestedPreset.id;
    } else if (!hasDraftObject) {
      draft.x01Preset = base.x01Preset;
    }
    return draft;
  }


  function createDefaultStore() {
    const settings = {
      debug: false,
      tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
      featureFlags: {
        autoLobbyStart: false,
        randomizeKoRound1: true,
        koDrawLockDefault: true,
      },
    };
    return {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      settings,
      ui: {
        activeTab: "tournament",
        matchesSortMode: MATCH_SORT_MODE_READY_FIRST,
        createDraft: createDefaultCreateDraft(settings),
      },
      tournament: null,
    };
  }


  function normalizeKoDrawMode(value, fallback = KO_DRAW_MODE_SEEDED) {
    const mode = normalizeText(value || "").toLowerCase();
    if (mode === KO_DRAW_MODE_OPEN_DRAW || mode === KO_DRAW_MODE_SEEDED) {
      return mode;
    }
    return fallback;
  }


  function normalizeKoEngineVersion(value, fallback = 0) {
    const parsed = clampInt(value, fallback, 0, KO_ENGINE_VERSION);
    return parsed > KO_ENGINE_VERSION ? KO_ENGINE_VERSION : parsed;
  }


  function normalizeMatchResultKind(value) {
    const normalized = normalizeText(value || "").toLowerCase();
    return normalized === "bye" ? "bye" : null;
  }


  function isByePlaceholderValue(value) {
    const token = normalizeToken(value);
    return Boolean(token) && BYE_PLACEHOLDER_TOKENS.has(token);
  }


  function sanitizeBestOf(value) {
    let bestOf = clampInt(value, 5, 1, 21);
    if (bestOf % 2 === 0) {
      bestOf += 1;
    }
    return bestOf;
  }


  function sanitizeStartScore(value) {
    const allowed = new Set(X01_START_SCORE_OPTIONS);
    const score = clampInt(value, 501, 121, 901);
    return allowed.has(score) ? score : 501;
  }


  function getLegsToWin(bestOfLegs) {
    const bestOf = sanitizeBestOf(bestOfLegs);
    return Math.floor(bestOf / 2) + 1;
  }


  function sanitizeX01Preset(value, fallback = getDefaultCreatePresetId()) {
    const preset = normalizeText(value || "").toLowerCase();
    if (preset === X01_PRESET_CUSTOM) {
      return preset;
    }
    const canonicalPreset = getCreatePresetAliasMap()[preset] || preset;
    if (getCreatePresetDefinitions()[canonicalPreset]) {
      return canonicalPreset;
    }
    return fallback;
  }


  function sanitizeX01Mode(value, allowedModes, fallback) {
    const mode = normalizeText(value || "");
    return allowedModes.includes(mode) ? mode : fallback;
  }


  function sanitizeX01InMode(value) {
    return sanitizeX01Mode(value, X01_IN_MODES, "Straight");
  }


  function sanitizeX01OutMode(value) {
    return sanitizeX01Mode(value, X01_OUT_MODES, "Double");
  }


  function sanitizeX01BullMode(value) {
    return sanitizeX01Mode(value, X01_BULL_MODES, "25/50");
  }


  function sanitizeX01BullOffMode(value) {
    return sanitizeX01Mode(value, X01_BULL_OFF_MODES, "Normal");
  }


  function sanitizeX01MaxRounds(value) {
    const rounds = clampInt(value, 50, 15, 80);
    return X01_MAX_ROUNDS_OPTIONS.includes(rounds) ? rounds : 50;
  }


  function sanitizeTournamentTimeProfile(value, fallback = TOURNAMENT_TIME_PROFILE_NORMAL) {
    const profile = normalizeText(value || "").toLowerCase();
    return TOURNAMENT_TIME_PROFILES.includes(profile) ? profile : fallback;
  }


  function sanitizeMatchesSortMode(value, fallback = MATCH_SORT_MODE_READY_FIRST) {
    const mode = normalizeText(value || "").toLowerCase();
    return MATCH_SORT_MODES.includes(mode) ? mode : fallback;
  }


  function sanitizeLobbyVisibility(value) {
    void value;
    return "private";
  }


  function mapLegacyTieBreakModeToProfile(value, fallback = TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE) {
    const mode = normalizeText(value || "").toLowerCase();
    if (mode === LEGACY_TIE_BREAK_MODE_DRA_STRICT) {
      return TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE;
    }
    if (mode === LEGACY_TIE_BREAK_MODE_LEGACY) {
      return TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF;
    }
    return fallback;
  }


  function normalizeTieBreakProfile(value, fallback = TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE) {
    const profile = normalizeText(value || "").toLowerCase();
    if (TIE_BREAK_PROFILES.includes(profile)) {
      return profile;
    }
    return mapLegacyTieBreakModeToProfile(value, fallback);
  }


  function normalizeTournamentRules(rawRules) {
    const rules = rawRules && typeof rawRules === "object" ? rawRules : {};
    const tieBreakRaw = Object.prototype.hasOwnProperty.call(rules, "tieBreakProfile")
      ? rules.tieBreakProfile
      : rules.tieBreakMode;
    return {
      tieBreakProfile: normalizeTieBreakProfile(tieBreakRaw, TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE),
    };
  }


  function normalizeTournamentX01Settings(rawX01, fallbackStartScore = 501) {
    const hasRawObject = rawX01 && typeof rawX01 === "object";
    const input = hasRawObject ? rawX01 : {};
    const rawPreset = normalizeText(input.presetId || input.preset || "").toLowerCase();
    const hasExplicitPreset = Boolean(rawPreset);
    const presetId = hasExplicitPreset ? sanitizeX01Preset(rawPreset, X01_PRESET_CUSTOM) : X01_PRESET_CUSTOM;
    const presetX01 = buildPresetX01Settings(presetId);
    const normalized = buildExplicitX01Settings({
      baseScore: input.baseScore ?? presetX01?.baseScore ?? fallbackStartScore,
      inMode: input.inMode ?? presetX01?.inMode,
      outMode: input.outMode ?? presetX01?.outMode,
      bullMode: input.bullMode ?? presetX01?.bullMode,
      maxRounds: input.maxRounds ?? presetX01?.maxRounds,
      bullOffMode: input.bullOffMode || input.bullOff || presetX01?.bullOffMode,
      lobbyVisibility: input.lobbyVisibility ?? input.isPrivate ?? presetX01?.lobbyVisibility,
    }, input.baseScore ?? presetX01?.baseScore ?? fallbackStartScore);
    if (presetX01 && isSameX01Settings(normalized, presetX01)) {
      return {
        ...presetX01,
        presetId,
      };
    }
    return normalized;
  }


  function isEuropeanTourOfficialMatchSetup(input) {
    return matchesCreatePresetSetup(input, X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL);
  }


  function getAppliedCreatePresetId(input) {
    const requestedPresetId = sanitizeX01Preset(
      input?.x01Preset ?? input?.presetId ?? input?.x01?.presetId,
      X01_PRESET_CUSTOM,
    );
    const requestedPreset = getCreatePresetDefinition(requestedPresetId);
    if (!requestedPreset) {
      return X01_PRESET_CUSTOM;
    }
    return matchesCreatePresetSetup(input, requestedPreset.id)
      ? requestedPreset.id
      : X01_PRESET_CUSTOM;
  }


  function normalizeAutomationStatus(value, fallback = "idle") {
    return ["idle", "started", "completed", "error"].includes(value) ? value : fallback;
  }


  function normalizeAutomationMeta(rawAuto) {
    const auto = rawAuto && typeof rawAuto === "object" ? rawAuto : {};
    const lobbyId = normalizeText(auto.lobbyId || "");
    let status = normalizeAutomationStatus(normalizeText(auto.status || ""), lobbyId ? "started" : "idle");
    if (!lobbyId && status !== "error") {
      status = "idle";
    }
    return {
      provider: API_PROVIDER,
      lobbyId: lobbyId || null,
      status,
      startedAt: normalizeText(auto.startedAt || "") || null,
      finishedAt: normalizeText(auto.finishedAt || "") || null,
      lastSyncAt: normalizeText(auto.lastSyncAt || "") || null,
      lastError: normalizeText(auto.lastError || "") || null,
    };
  }


  function normalizeStoredMatchAverage(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const parsed = Number.parseFloat(String(value));
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 200) {
      return null;
    }
    return Math.round(parsed * 100) / 100;
  }


  function normalizeStoredMatchHighFinish(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const parsed = clampInt(value, null, 1, 170);
    return Number.isFinite(parsed) ? parsed : null;
  }


  function normalizeStoredPlayerStats(rawStats) {
    return {
      average: normalizeStoredMatchAverage(rawStats?.average),
      oneEighties: clampInt(rawStats?.oneEighties, 0, 0, 99),
      highFinish: normalizeStoredMatchHighFinish(rawStats?.highFinish),
    };
  }


  function normalizeStoredMatchStats(rawStats) {
    return {
      p1: normalizeStoredPlayerStats(rawStats?.p1),
      p2: normalizeStoredPlayerStats(rawStats?.p2),
    };
  }


  function resetMatchAutomationMeta(match) {
    const auto = ensureMatchAutoMeta(match);
    auto.lobbyId = null;
    auto.status = "idle";
    auto.startedAt = null;
    auto.finishedAt = null;
    auto.lastSyncAt = null;
    auto.lastError = null;
    return auto;
  }


  function normalizeMatchMeta(rawMeta) {
    const meta = rawMeta && typeof rawMeta === "object" ? rawMeta : {};
    const resultKind = normalizeMatchResultKind(meta.resultKind);
    return {
      ...meta,
      resultKind,
      auto: normalizeAutomationMeta(meta.auto),
    };
  }


  function ensureMatchMeta(match) {
    if (!match || typeof match !== "object") {
      return normalizeMatchMeta(null);
    }
    if (!match.meta || typeof match.meta !== "object") {
      match.meta = {};
    }
    match.meta = normalizeMatchMeta(match.meta);
    return match.meta;
  }


  function setMatchResultKind(match, resultKind) {
    const meta = ensureMatchMeta(match);
    const nextKind = normalizeMatchResultKind(resultKind);
    if (meta.resultKind === nextKind) {
      return false;
    }
    meta.resultKind = nextKind;
    return true;
  }


  function isByeMatchResult(match) {
    return normalizeMatchResultKind(match?.meta?.resultKind) === "bye";
  }


  function ensureMatchAutoMeta(match) {
    const meta = ensureMatchMeta(match);
    meta.auto = normalizeAutomationMeta(meta.auto);
    return meta.auto;
  }


  function normalizeKoVirtualMatch(rawMatch, roundFallback, indexFallback) {
    return {
      id: normalizeText(rawMatch?.id || `ko-r${roundFallback}-m${indexFallback}`),
      round: clampInt(rawMatch?.round, roundFallback, 1, 64),
      number: clampInt(rawMatch?.number, indexFallback, 1, 256),
      structuralBye: Boolean(rawMatch?.structuralBye),
      competitors: {
        p1: rawMatch?.competitors?.p1 || null,
        p2: rawMatch?.competitors?.p2 || null,
      },
    };
  }


  function normalizeKoRoundStructure(rawRound, roundFallback) {
    const virtualMatchesRaw = Array.isArray(rawRound?.virtualMatches) ? rawRound.virtualMatches : [];
    return {
      round: clampInt(rawRound?.round, roundFallback, 1, 64),
      label: normalizeText(rawRound?.label || `Round ${roundFallback}`),
      virtualMatches: virtualMatchesRaw.map((entry, index) => (
        normalizeKoVirtualMatch(entry, roundFallback, index + 1)
      )),
    };
  }


  function normalizeKoSeedEntry(rawSeed, indexFallback) {
    const participantId = normalizeText(rawSeed?.participantId || rawSeed?.id || "");
    if (!participantId) {
      return null;
    }
    return {
      participantId,
      participantName: normalizeText(rawSeed?.participantName || rawSeed?.name || participantId),
      seed: clampInt(rawSeed?.seed, indexFallback, 1, TECHNICAL_PARTICIPANT_HARD_MAX),
      hasBye: Boolean(rawSeed?.hasBye),
      entryRound: clampInt(rawSeed?.entryRound, rawSeed?.hasBye ? 2 : 1, 1, 64),
      slot: Number.isFinite(Number(rawSeed?.slot))
        ? clampInt(rawSeed?.slot, null, 1, TECHNICAL_PARTICIPANT_HARD_MAX)
        : null,
    };
  }


  function normalizeKoDrawLocked(value, fallback = true) {
    if (typeof value === "boolean") {
      return value;
    }
    return Boolean(fallback);
  }


  function normalizeKoPlacement(placementRaw, bracketSize) {
    const fallbackPlacement = buildSeedPlacement(bracketSize);
    if (!Array.isArray(placementRaw) || !placementRaw.length) {
      return fallbackPlacement;
    }
    const used = new Set();
    const normalized = placementRaw
      .map((entry) => clampInt(entry, null, 1, bracketSize))
      .filter((entry) => Number.isInteger(entry) && !used.has(entry) && used.add(entry));
    if (normalized.length !== bracketSize) {
      return fallbackPlacement;
    }
    return normalized;
  }


  function normalizeTournamentKoMeta(rawKo, fallbackDrawMode = KO_DRAW_MODE_SEEDED, fallbackDrawLocked = true) {
    const ko = rawKo && typeof rawKo === "object" ? rawKo : {};
    const drawMode = normalizeKoDrawMode(ko.drawMode, fallbackDrawMode);
    const drawLocked = normalizeKoDrawLocked(ko.drawLocked, fallbackDrawLocked);
    const engineVersion = normalizeKoEngineVersion(ko.engineVersion, 0);
    const seeding = (Array.isArray(ko.seeding) ? ko.seeding : [])
      .map((entry, index) => normalizeKoSeedEntry(entry, index + 1))
      .filter(Boolean);
    const rounds = (Array.isArray(ko.rounds) ? ko.rounds : [])
      .map((entry, index) => normalizeKoRoundStructure(entry, index + 1));
    const fallbackBracketSize = nextPowerOfTwo(Math.max(2, seeding.length));
    const bracketSize = nextPowerOfTwo(clampInt(
      ko.bracketSize,
      fallbackBracketSize,
      2,
      TECHNICAL_PARTICIPANT_HARD_MAX,
    ));
    const placement = normalizeKoPlacement(ko.placement, bracketSize);
    return {
      drawMode,
      drawLocked,
      engineVersion,
      bracketSize,
      placement,
      seeding,
      rounds,
    };
  }


  function normalizeTournamentResultEntry(rawResult, indexFallback) {
    return {
      matchId: normalizeText(rawResult?.matchId || rawResult?.id || `result-${indexFallback}`),
      stage: [MATCH_STAGE_KO, MATCH_STAGE_GROUP, MATCH_STAGE_LEAGUE].includes(rawResult?.stage)
        ? rawResult.stage
        : MATCH_STAGE_KO,
      round: clampInt(rawResult?.round, 1, 1, 64),
      number: clampInt(rawResult?.number, indexFallback, 1, 256),
      player1Id: rawResult?.player1Id ? normalizeText(rawResult.player1Id) : null,
      player2Id: rawResult?.player2Id ? normalizeText(rawResult.player2Id) : null,
      winnerId: rawResult?.winnerId ? normalizeText(rawResult.winnerId) : null,
      legs: {
        p1: clampInt(rawResult?.legs?.p1, 0, 0, 99),
        p2: clampInt(rawResult?.legs?.p2, 0, 0, 99),
      },
      stats: normalizeStoredMatchStats(rawResult?.stats),
      source: rawResult?.source === "auto" ? "auto" : "manual",
      updatedAt: normalizeText(rawResult?.updatedAt || nowIso()),
    };
  }


  function normalizeTournament(rawTournament, fallbackKoDrawLocked = true) {
    if (!rawTournament || typeof rawTournament !== "object") {
      return null;
    }

    const mode = ["ko", "league", "groups_ko"].includes(rawTournament.mode) ? rawTournament.mode : "ko";
    const modeLimits = getModeParticipantLimits(mode);
    const participantsRaw = Array.isArray(rawTournament.participants) ? rawTournament.participants : [];
    const participants = participantsRaw
      .map((entry, index) => {
        const name = normalizeText(entry?.name || entry || "");
        if (!name) {
          return null;
        }
        const id = normalizeText(entry?.id || `p-${index + 1}`);
        return { id, name };
      })
      .filter(Boolean)
      .slice(0, TECHNICAL_PARTICIPANT_HARD_MAX);

    if (participants.length < modeLimits.min) {
      return null;
    }

    const groupsRaw = Array.isArray(rawTournament.groups) ? rawTournament.groups : [];
    const groups = groupsRaw.map((group, index) => ({
      id: normalizeText(group?.id || `G${index + 1}`),
      name: normalizeText(group?.name || `Gruppe ${index + 1}`),
      participantIds: Array.isArray(group?.participantIds)
        ? group.participantIds.map((id) => normalizeText(id)).filter(Boolean)
        : [],
    }));

    const matchesRaw = Array.isArray(rawTournament.matches) ? rawTournament.matches : [];
    const matches = matchesRaw.map((match, index) => ({
      id: normalizeText(match?.id || `match-${index + 1}`),
      stage: [MATCH_STAGE_KO, MATCH_STAGE_GROUP, MATCH_STAGE_LEAGUE].includes(match?.stage) ? match.stage : MATCH_STAGE_KO,
      round: clampInt(match?.round, 1, 1, 64),
      number: clampInt(match?.number, index + 1, 1, 256),
      groupId: match?.groupId ? normalizeText(match.groupId) : null,
      player1Id: match?.player1Id ? normalizeText(match.player1Id) : null,
      player2Id: match?.player2Id ? normalizeText(match.player2Id) : null,
      status: match?.status === STATUS_COMPLETED ? STATUS_COMPLETED : STATUS_PENDING,
      winnerId: match?.winnerId ? normalizeText(match.winnerId) : null,
      source: match?.source === "auto" || match?.source === "manual" ? match.source : null,
      legs: {
        p1: clampInt(match?.legs?.p1, 0, 0, 50),
        p2: clampInt(match?.legs?.p2, 0, 0, 50),
      },
      stats: normalizeStoredMatchStats(match?.stats),
      updatedAt: normalizeText(match?.updatedAt || nowIso()),
      meta: normalizeMatchMeta(match?.meta),
    }));
    const resultsRaw = Array.isArray(rawTournament.results) ? rawTournament.results : [];
    const results = resultsRaw.map((entry, index) => normalizeTournamentResultEntry(entry, index + 1));

    const fallbackStartScore = sanitizeStartScore(rawTournament.startScore);
    const x01 = normalizeTournamentX01Settings(rawTournament.x01, fallbackStartScore);
    const rules = normalizeTournamentRules(rawTournament.rules);

    return {
      id: normalizeText(rawTournament.id || uuid("tournament")),
      name: normalizeText(rawTournament.name || "Lokales Turnier"),
      mode,
      ko: mode === "ko"
        ? normalizeTournamentKoMeta(rawTournament.ko, KO_DRAW_MODE_SEEDED, fallbackKoDrawLocked)
        : null,
      bestOfLegs: sanitizeBestOf(rawTournament.bestOfLegs),
      startScore: x01.baseScore,
      x01,
      rules,
      participants,
      groups,
      matches,
      results,
      createdAt: normalizeText(rawTournament.createdAt || nowIso()),
      updatedAt: normalizeText(rawTournament.updatedAt || nowIso()),
    };
  }


  function normalizeStoreShape(input) {
    const defaults = createDefaultStore();
    const defaultKoDrawLocked = input?.settings?.featureFlags?.koDrawLockDefault !== false;
    const settings = {
      debug: Boolean(input?.settings?.debug),
      tournamentTimeProfile: sanitizeTournamentTimeProfile(
        input?.settings?.tournamentTimeProfile,
        defaults.settings.tournamentTimeProfile,
      ),
      featureFlags: {
        autoLobbyStart: Boolean(input?.settings?.featureFlags?.autoLobbyStart),
        randomizeKoRound1: input?.settings?.featureFlags?.randomizeKoRound1 !== false,
        koDrawLockDefault: defaultKoDrawLocked,
      },
    };
    return {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      settings,
      ui: {
        activeTab: TAB_IDS.includes(input?.ui?.activeTab) ? input.ui.activeTab : defaults.ui.activeTab,
        matchesSortMode: sanitizeMatchesSortMode(input?.ui?.matchesSortMode, defaults.ui.matchesSortMode),
        createDraft: normalizeCreateDraft(input?.ui?.createDraft, settings),
      },
      tournament: normalizeTournament(input?.tournament, defaultKoDrawLocked),
    };
  }


  function participantById(tournament, participantId) {
    return tournament?.participants?.find((participant) => participant.id === participantId) || null;
  }


  function participantNameById(tournament, participantId) {
    if (!participantId) {
      return "\u2205 offen";
    }
    const participant = participantById(tournament, participantId);
    return participant ? participant.name : "\u2205 offen";
  }


  function buildParticipantIndexes(tournament) {
    const byId = new Map();
    const byName = new Map();
    (tournament?.participants || []).forEach((participant) => {
      const id = normalizeText(participant?.id || "");
      if (!id) {
        return;
      }
      byId.set(id, participant);
      const key = normalizeLookup(participant?.name || "");
      if (key && !byName.has(key)) {
        byName.set(key, id);
      }
    });
    return { byId, byName };
  }


  function resolveParticipantSlotId(tournament, rawValue, indexes = null) {
    const value = normalizeText(rawValue || "");
    if (!value || isByePlaceholderValue(value)) {
      return null;
    }

    const participantIndexes = indexes || buildParticipantIndexes(tournament);
    if (participantIndexes.byId.has(value)) {
      return value;
    }

    const mappedByName = participantIndexes.byName.get(normalizeLookup(value));
    return mappedByName || null;
  }

  // Logic layer: deterministic tournament and bracket calculations.

  function getModeParticipantLimits(mode) {
    return MODE_PARTICIPANT_LIMITS[mode] || MODE_PARTICIPANT_LIMITS.ko;
  }


  function buildModeParticipantLimitSummary() {
    return Object.entries(MODE_PARTICIPANT_LIMITS)
      .map(([, limits]) => `${limits.label}: ${limits.min}-${limits.max}`)
      .join(", ");
  }


  function getParticipantCountError(mode, count) {
    const limits = getModeParticipantLimits(mode);
    const participantCount = Number(count || 0);
    if (participantCount < limits.min || participantCount > limits.max) {
      return `${limits.label} erfordert ${limits.min}-${limits.max} Teilnehmer.`;
    }
    return "";
  }


