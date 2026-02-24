// Auto-generated module split from dist source.
  function createMatch({
    id,
    stage,
    round,
    number,
    groupId = null,
    player1Id = null,
    player2Id = null,
    meta = {},
  }) {
    return {
      id,
      stage,
      round,
      number,
      groupId,
      player1Id,
      player2Id,
      status: STATUS_PENDING,
      winnerId: null,
      source: null,
      legs: { p1: 0, p2: 0 },
      updatedAt: nowIso(),
      meta: normalizeMatchMeta(meta),
    };
  }


  function createRoundRobinPairings(participantIds) {
    const ids = participantIds.slice();
    if (ids.length % 2 === 1) {
      ids.push(null);
    }

    const rounds = [];
    const total = ids.length;
    const roundsCount = total - 1;
    let rotation = ids.slice();

    for (let roundIndex = 0; roundIndex < roundsCount; roundIndex += 1) {
      const roundPairs = [];
      for (let i = 0; i < total / 2; i += 1) {
        const left = rotation[i];
        const right = rotation[total - 1 - i];
        if (left && right) {
          roundPairs.push([left, right]);
        }
      }
      rounds.push(roundPairs);

      const fixed = rotation[0];
      const rest = rotation.slice(1);
      rest.unshift(rest.pop());
      rotation = [fixed].concat(rest);
    }

    return rounds;
  }


  function buildLeagueMatches(participantIds) {
    const rounds = createRoundRobinPairings(participantIds);
    const matches = [];
    rounds.forEach((pairs, roundIndex) => {
      pairs.forEach((pair, pairIndex) => {
        matches.push(createMatch({
          id: `league-r${roundIndex + 1}-m${pairIndex + 1}`,
          stage: MATCH_STAGE_LEAGUE,
          round: roundIndex + 1,
          number: pairIndex + 1,
          player1Id: pair[0],
          player2Id: pair[1],
        }));
      });
    });
    return matches;
  }


  function buildSeedPlacement(size) {
    if (!Number.isFinite(size) || size < 2 || size % 2 !== 0) {
      return [];
    }
    let placement = [1];
    while (placement.length < size) {
      const mirrorBase = (placement.length * 2) + 1;
      const next = [];
      placement.forEach((seedNumber) => {
        next.push(seedNumber, mirrorBase - seedNumber);
      });
      placement = next;
    }
    return placement;
  }


  function buildKoRound1Slots(participantIds, drawMode) {
    const ids = Array.isArray(participantIds) ? participantIds.slice() : [];
    if (!ids.length) {
      return [];
    }
    const size = nextPowerOfTwo(ids.length);
    const mode = normalizeKoDrawMode(drawMode, KO_DRAW_MODE_SEEDED);
    const seedOrderedParticipants = mode === KO_DRAW_MODE_OPEN_DRAW ? shuffleArray(ids) : ids;
    const placement = buildSeedPlacement(size);
    const seedToParticipant = new Map();
    seedOrderedParticipants.forEach((participantId, index) => {
      seedToParticipant.set(index + 1, participantId);
    });
    return placement.map((seedNumber) => seedToParticipant.get(seedNumber) || null);
  }


  function buildKoMatchesV2(participantIds, drawMode = KO_DRAW_MODE_SEEDED) {
    const roundOneSlots = buildKoRound1Slots(participantIds, drawMode);
    const size = roundOneSlots.length || nextPowerOfTwo(participantIds.length);

    const matches = [];
    const rounds = Math.log2(size);

    for (let round = 1; round <= rounds; round += 1) {
      const matchesInRound = size / (2 ** round);
      for (let number = 1; number <= matchesInRound; number += 1) {
        const idx = (number - 1) * 2;
        const player1Id = round === 1 ? roundOneSlots[idx] || null : null;
        const player2Id = round === 1 ? roundOneSlots[idx + 1] || null : null;
        matches.push(createMatch({
          id: `ko-r${round}-m${number}`,
          stage: MATCH_STAGE_KO,
          round,
          number,
          player1Id,
          player2Id,
        }));
      }
    }

    return matches;
  }


  function buildGroups(participantIds) {
    const groupA = [];
    const groupB = [];
    participantIds.forEach((participantId, index) => {
      if (index % 2 === 0) {
        groupA.push(participantId);
      } else {
        groupB.push(participantId);
      }
    });
    return [
      { id: "A", name: "Gruppe A", participantIds: groupA },
      { id: "B", name: "Gruppe B", participantIds: groupB },
    ];
  }


  function buildGroupMatches(groups) {
    const matches = [];
    groups.forEach((group) => {
      const rounds = createRoundRobinPairings(group.participantIds);
      rounds.forEach((pairs, roundIndex) => {
        pairs.forEach((pair, pairIndex) => {
          matches.push(createMatch({
            id: `group-${group.id}-r${roundIndex + 1}-m${pairIndex + 1}`,
            stage: MATCH_STAGE_GROUP,
            groupId: group.id,
            round: roundIndex + 1,
            number: pairIndex + 1,
            player1Id: pair[0],
            player2Id: pair[1],
          }));
        });
      });
    });
    return matches;
  }


  function buildGroupsKoMatches() {
    return [
      createMatch({
        id: "ko-r1-m1",
        stage: MATCH_STAGE_KO,
        round: 1,
        number: 1,
        meta: {
          from1: { type: "groupRank", groupId: "A", rank: 1 },
          from2: { type: "groupRank", groupId: "B", rank: 2 },
        },
      }),
      createMatch({
        id: "ko-r1-m2",
        stage: MATCH_STAGE_KO,
        round: 1,
        number: 2,
        meta: {
          from1: { type: "groupRank", groupId: "B", rank: 1 },
          from2: { type: "groupRank", groupId: "A", rank: 2 },
        },
      }),
      createMatch({
        id: "ko-r2-m1",
        stage: MATCH_STAGE_KO,
        round: 2,
        number: 1,
      }),
    ];
  }


  function validateCreateConfig(config) {
    const errors = [];

    if (!normalizeText(config.name)) {
      errors.push("Bitte einen Turniernamen eingeben.");
    }
    if (!["ko", "league", "groups_ko"].includes(config.mode)) {
      errors.push("Ung\u00fcltiger Modus.");
    }
    const participantCountError = getParticipantCountError(config.mode, config.participants.length);
    if (participantCountError) {
      errors.push(participantCountError);
    }

    return errors;
  }


  function createTournament(config) {
    const modeLimits = getModeParticipantLimits(config.mode);
    const participants = config.participants.slice(0, modeLimits.max);
    const participantIds = participants.map((participant) => participant.id);
    const koDrawMode = config.mode === "ko" && config.randomizeKoRound1
      ? KO_DRAW_MODE_OPEN_DRAW
      : KO_DRAW_MODE_SEEDED;
    const x01 = normalizeTournamentX01Settings({
      presetId: config.x01Preset,
      baseScore: config.startScore,
      inMode: config.x01InMode,
      outMode: config.x01OutMode,
      bullMode: config.x01BullMode,
      maxRounds: config.x01MaxRounds,
      bullOffMode: config.x01BullOffMode,
      lobbyVisibility: config.lobbyVisibility,
    }, config.startScore);

    let groups = [];
    let matches = [];

    if (config.mode === "league") {
      matches = buildLeagueMatches(participantIds);
    } else if (config.mode === "groups_ko") {
      groups = buildGroups(participantIds);
      matches = buildGroupMatches(groups).concat(buildGroupsKoMatches());
    } else {
      matches = buildKoMatchesV2(participantIds, koDrawMode);
    }

    const tournament = {
      id: uuid("tournament"),
      name: normalizeText(config.name),
      mode: config.mode,
      ko: config.mode === "ko" ? {
        drawMode: koDrawMode,
        engineVersion: KO_ENGINE_VERSION,
      } : null,
      bestOfLegs: sanitizeBestOf(config.bestOfLegs),
      startScore: x01.baseScore,
      x01,
      rules: normalizeTournamentRules({ tieBreakMode: TIE_BREAK_MODE_DRA_STRICT }),
      participants,
      groups,
      matches,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    refreshDerivedMatches(tournament);
    return tournament;
  }


  function getMatchesByStage(tournament, stage) {
    return tournament.matches
      .filter((match) => match.stage === stage)
      .sort((left, right) => left.round - right.round || left.number - right.number);
  }


  function findMatch(tournament, matchId) {
    return tournament.matches.find((match) => match.id === matchId) || null;
  }


