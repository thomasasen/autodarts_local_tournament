// Auto-generated module split from dist source.
  function createDefaultCreateDraft(settings = null) {
    const defaultRandomize = settings?.featureFlags?.randomizeKoRound1 !== false;
    const pdcSettings = buildPdcX01Settings();
    return {
      name: "",
      mode: "ko",
      bestOfLegs: 5,
      startScore: pdcSettings.baseScore,
      x01Preset: pdcSettings.presetId,
      x01InMode: pdcSettings.inMode,
      x01OutMode: pdcSettings.outMode,
      x01BullMode: pdcSettings.bullMode,
      x01MaxRounds: pdcSettings.maxRounds,
      x01BullOffMode: pdcSettings.bullOffMode,
      lobbyVisibility: pdcSettings.lobbyVisibility,
      participantsText: "",
      randomizeKoRound1: Boolean(defaultRandomize),
    };
  }


  function normalizeCreateDraft(rawDraft, settings = null) {
    const base = createDefaultCreateDraft(settings);
    const modeRaw = normalizeText(rawDraft?.mode || base.mode);
    const mode = ["ko", "league", "groups_ko"].includes(modeRaw) ? modeRaw : base.mode;
    const hasDraftObject = rawDraft && typeof rawDraft === "object";
    const hasExplicitPreset = hasDraftObject && Object.prototype.hasOwnProperty.call(rawDraft, "x01Preset");
    const rawPreset = hasExplicitPreset
      ? sanitizeX01Preset(rawDraft?.x01Preset, base.x01Preset)
      : (hasDraftObject ? X01_PRESET_CUSTOM : base.x01Preset);
    let x01Settings = normalizeTournamentX01Settings({
      presetId: rawPreset,
      baseScore: rawDraft?.startScore ?? base.startScore,
      inMode: rawDraft?.x01InMode ?? base.x01InMode,
      outMode: rawDraft?.x01OutMode ?? base.x01OutMode,
      bullMode: rawDraft?.x01BullMode ?? base.x01BullMode,
      maxRounds: rawDraft?.x01MaxRounds ?? base.x01MaxRounds,
      bullOffMode: rawDraft?.x01BullOffMode ?? base.x01BullOffMode,
      lobbyVisibility: rawDraft?.lobbyVisibility ?? base.lobbyVisibility,
    }, rawDraft?.startScore ?? base.startScore);
    if (rawPreset === X01_PRESET_PDC_STANDARD) {
      x01Settings = buildPdcX01Settings();
    }
    return {
      name: normalizeText(rawDraft?.name || base.name),
      mode,
      bestOfLegs: sanitizeBestOf(rawDraft?.bestOfLegs ?? base.bestOfLegs),
      startScore: x01Settings.baseScore,
      x01Preset: x01Settings.presetId,
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
  }


  function createDefaultStore() {
    const settings = {
      debug: false,
      featureFlags: {
        autoLobbyStart: false,
        randomizeKoRound1: true,
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


  function sanitizeX01Preset(value, fallback = X01_PRESET_PDC_STANDARD) {
    const preset = normalizeText(value || "").toLowerCase();
    if (preset === X01_PRESET_CUSTOM || preset === X01_PRESET_PDC_STANDARD) {
      return preset;
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


  function sanitizeMatchesSortMode(value, fallback = MATCH_SORT_MODE_READY_FIRST) {
    const mode = normalizeText(value || "").toLowerCase();
    return MATCH_SORT_MODES.includes(mode) ? mode : fallback;
  }


  function sanitizeLobbyVisibility(value) {
    void value;
    return "private";
  }


  function normalizeTieBreakMode(value, fallback = TIE_BREAK_MODE_DRA_STRICT) {
    const mode = normalizeText(value || "").toLowerCase();
    return TIE_BREAK_MODES.includes(mode) ? mode : fallback;
  }


  function normalizeTournamentRules(rawRules) {
    const rules = rawRules && typeof rawRules === "object" ? rawRules : {};
    return {
      tieBreakMode: normalizeTieBreakMode(rules.tieBreakMode, TIE_BREAK_MODE_DRA_STRICT),
    };
  }


  function buildPdcX01Settings() {
    return {
      presetId: X01_PRESET_PDC_STANDARD,
      variant: X01_VARIANT,
      baseScore: 501,
      inMode: "Straight",
      outMode: "Double",
      bullMode: "25/50",
      maxRounds: 50,
      bullOffMode: "Normal",
      lobbyVisibility: "private",
    };
  }


  function normalizeTournamentX01Settings(rawX01, fallbackStartScore = 501) {
    const hasRawObject = rawX01 && typeof rawX01 === "object";
    const input = hasRawObject ? rawX01 : {};
    const rawPreset = normalizeText(input.presetId || input.preset || "").toLowerCase();
    const hasExplicitPreset = Boolean(rawPreset);
    const presetId = hasExplicitPreset ? sanitizeX01Preset(rawPreset, X01_PRESET_CUSTOM) : X01_PRESET_CUSTOM;

    if (presetId === X01_PRESET_PDC_STANDARD) {
      return buildPdcX01Settings();
    }

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


  function normalizeTournamentKoMeta(rawKo, fallbackDrawMode = KO_DRAW_MODE_SEEDED) {
    const ko = rawKo && typeof rawKo === "object" ? rawKo : {};
    const drawMode = normalizeKoDrawMode(ko.drawMode, fallbackDrawMode);
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
    return {
      drawMode,
      engineVersion,
      bracketSize,
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


  function normalizeTournament(rawTournament) {
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
        ? normalizeTournamentKoMeta(rawTournament.ko, KO_DRAW_MODE_SEEDED)
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
    const settings = {
      debug: Boolean(input?.settings?.debug),
      featureFlags: {
        autoLobbyStart: Boolean(input?.settings?.featureFlags?.autoLobbyStart),
        randomizeKoRound1: input?.settings?.featureFlags?.randomizeKoRound1 !== false,
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
      tournament: normalizeTournament(input?.tournament),
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


