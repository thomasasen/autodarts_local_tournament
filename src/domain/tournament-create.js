// Auto-generated module split from dist source.
  /**
   * @typedef {Object} KoSeed
   * @property {string} participantId
   * @property {string} participantName
   * @property {number} seed
   * @property {boolean} hasBye
   * @property {number} entryRound
   * @property {number|null} slot
   */

  /**
   * @typedef {Object} KoVirtualMatch
   * @property {string} id
   * @property {number} round
   * @property {number} number
   * @property {boolean} structuralBye
   * @property {Object} competitors
   * @property {Object|null} competitors.p1
   * @property {Object|null} competitors.p2
   */

  /**
   * @typedef {Object} KoBracketStructure
   * @property {number} bracketSize
   * @property {number} byeCount
   * @property {number[]} placement
   * @property {KoSeed[]} seeding
   * @property {Array<{round:number,label:string,virtualMatches:KoVirtualMatch[]}>} rounds
   */

  function sanitizeMatchAverage(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const parsed = Number.parseFloat(String(value));
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 200) {
      return null;
    }
    return Math.round(parsed * 100) / 100;
  }


  function sanitizeMatchHighFinish(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const parsed = clampInt(value, null, 1, 170);
    return Number.isFinite(parsed) ? parsed : null;
  }


  function normalizePlayerStats(rawStats) {
    return {
      average: sanitizeMatchAverage(rawStats?.average),
      oneEighties: clampInt(rawStats?.oneEighties, 0, 0, 99),
      highFinish: sanitizeMatchHighFinish(rawStats?.highFinish),
    };
  }


  function normalizeMatchStats(rawStats) {
    return {
      p1: normalizePlayerStats(rawStats?.p1),
      p2: normalizePlayerStats(rawStats?.p2),
    };
  }


  function createKoVirtualCompetitorRef(node) {
    if (!node) {
      return null;
    }
    if (node.kind === "participant") {
      return {
        type: "participant",
        participantId: node.participantId,
        seed: node.seed,
      };
    }
    if (node.kind === "winner") {
      return {
        type: "winner",
        matchId: node.sourceMatchId,
      };
    }
    return null;
  }


  function createMatch({
    id,
    stage,
    round,
    number,
    groupId = null,
    player1Id = null,
    player2Id = null,
    status = STATUS_PENDING,
    winnerId = null,
    source = null,
    legs = null,
    stats = null,
    meta = {},
  }) {
    const normalizedStatus = status === STATUS_COMPLETED ? STATUS_COMPLETED : STATUS_PENDING;
    const normalizedWinnerId = normalizedStatus === STATUS_COMPLETED
      ? normalizeText(winnerId || "") || null
      : null;
    const normalizedSource = source === "auto" || source === "manual" ? source : null;
    return {
      id,
      stage,
      round,
      number,
      groupId,
      player1Id,
      player2Id,
      status: normalizedStatus,
      winnerId: normalizedWinnerId,
      source: normalizedSource,
      legs: {
        p1: clampInt(legs?.p1, 0, 0, 99),
        p2: clampInt(legs?.p2, 0, 0, 99),
      },
      // Domain structure for required PDC match stats.
      stats: normalizeMatchStats(stats),
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


  function calculateBracketSize(participantCount) {
    const normalizedCount = clampInt(participantCount, 0, 0, TECHNICAL_PARTICIPANT_HARD_MAX);
    if (normalizedCount <= 2) {
      return 2;
    }
    return nextPowerOfTwo(normalizedCount);
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


  function buildDeterministicSeedHash(value) {
    const token = normalizeLookup(value || "");
    let hash = 5381;
    for (let i = 0; i < token.length; i += 1) {
      hash = ((hash << 5) + hash) + token.charCodeAt(i);
      hash >>>= 0;
    }
    return hash >>> 0;
  }


  function normalizeSeedParticipants(players) {
    const source = Array.isArray(players) ? players : [];
    const seen = new Set();
    const list = [];
    source.forEach((entry, index) => {
      const participantId = normalizeText(entry?.id || entry || "");
      if (!participantId || seen.has(participantId)) {
        return;
      }
      seen.add(participantId);
      const explicitSeed = Number.parseInt(String(entry?.seed ?? ""), 10);
      list.push({
        participantId,
        participantName: normalizeText(entry?.name || participantId),
        originalIndex: index,
        explicitSeed: Number.isFinite(explicitSeed) && explicitSeed > 0 ? explicitSeed : null,
      });
    });
    return list;
  }


  function generateSeeds(players, drawMode = KO_DRAW_MODE_SEEDED) {
    const participants = normalizeSeedParticipants(players);
    const mode = normalizeKoDrawMode(drawMode, KO_DRAW_MODE_SEEDED);
    const ordered = participants.slice();

    if (mode === KO_DRAW_MODE_OPEN_DRAW) {
      ordered.sort((left, right) => {
        const leftHash = buildDeterministicSeedHash(`${left.participantName}|${left.participantId}|${left.originalIndex}`);
        const rightHash = buildDeterministicSeedHash(`${right.participantName}|${right.participantId}|${right.originalIndex}`);
        if (leftHash !== rightHash) {
          return leftHash - rightHash;
        }
        return left.originalIndex - right.originalIndex;
      });
    } else {
      // Extension point: replace this comparator when external ranking-based seeding is added.
      ordered.sort((left, right) => {
        const leftSeed = Number.isFinite(left.explicitSeed) ? left.explicitSeed : Number.MAX_SAFE_INTEGER;
        const rightSeed = Number.isFinite(right.explicitSeed) ? right.explicitSeed : Number.MAX_SAFE_INTEGER;
        if (leftSeed !== rightSeed) {
          return leftSeed - rightSeed;
        }
        return left.originalIndex - right.originalIndex;
      });
    }

    return ordered.map((entry, index) => ({
      participantId: entry.participantId,
      participantName: entry.participantName,
      seed: index + 1,
    }));
  }


  function assignByes(players, bracketSize) {
    const seeds = Array.isArray(players) ? players.slice() : [];
    const size = calculateBracketSize(bracketSize || seeds.length);
    const byeCount = Math.max(0, size - seeds.length);
    const seededWithByes = seeds.map((seedEntry, index) => ({
      ...seedEntry,
      hasBye: index < byeCount,
      entryRound: index < byeCount ? 2 : 1,
    }));
    return {
      bracketSize: size,
      byeCount,
      seeds: seededWithByes,
    };
  }


  function buildBracketStructure(players, seeds) {
    const normalizedParticipants = normalizeSeedParticipants(players);
    const seeded = Array.isArray(seeds) && seeds.length
      ? seeds.slice()
      : generateSeeds(normalizedParticipants, KO_DRAW_MODE_SEEDED);
    const assignedByes = assignByes(seeded, normalizedParticipants.length);
    const placement = buildSeedPlacement(assignedByes.bracketSize);
    const seedByNumber = new Map(assignedByes.seeds.map((entry) => [entry.seed, entry]));

    const slotByParticipantId = new Map();
    const leafNodes = placement.map((seedNumber, slotIndex) => {
      const seedEntry = seedByNumber.get(seedNumber) || null;
      if (!seedEntry) {
        return null;
      }
      slotByParticipantId.set(seedEntry.participantId, slotIndex + 1);
      return {
        kind: "participant",
        participantId: seedEntry.participantId,
        seed: seedEntry.seed,
      };
    });

    const seeding = assignedByes.seeds.map((seedEntry) => ({
      ...seedEntry,
      slot: slotByParticipantId.get(seedEntry.participantId) || null,
    }));

    const rounds = [];
    let currentNodes = leafNodes;
    const totalRounds = Math.log2(assignedByes.bracketSize);
    for (let round = 1; round <= totalRounds; round += 1) {
      const matchesInRound = currentNodes.length / 2;
      const virtualMatches = [];
      const nextNodes = [];
      for (let number = 1; number <= matchesInRound; number += 1) {
        const idx = (number - 1) * 2;
        const leftNode = currentNodes[idx] || null;
        const rightNode = currentNodes[idx + 1] || null;
        const id = `ko-r${round}-m${number}`;
        const structuralBye = Boolean((leftNode && !rightNode) || (!leftNode && rightNode));

        virtualMatches.push({
          id,
          round,
          number,
          structuralBye,
          competitors: {
            p1: createKoVirtualCompetitorRef(leftNode),
            p2: createKoVirtualCompetitorRef(rightNode),
          },
        });

        if (!leftNode && !rightNode) {
          nextNodes.push(null);
        } else if (structuralBye) {
          nextNodes.push(leftNode || rightNode);
        } else {
          nextNodes.push({
            kind: "winner",
            sourceMatchId: id,
          });
        }
      }
      rounds.push({
        round,
        label: round === totalRounds ? "Final" : `Round ${round}`,
        virtualMatches,
      });
      currentNodes = nextNodes;
    }

    return {
      bracketSize: assignedByes.bracketSize,
      byeCount: assignedByes.byeCount,
      placement,
      seeding,
      rounds,
    };
  }


  function buildKoMatchMetaFromVirtualMatch(virtualMatch) {
    return {
      bracket: {
        p1Source: virtualMatch?.competitors?.p1 || null,
        p2Source: virtualMatch?.competitors?.p2 || null,
      },
    };
  }


  function resolveInitialVirtualParticipantId(competitorRef) {
    if (!competitorRef || competitorRef.type !== "participant") {
      return null;
    }
    return normalizeText(competitorRef.participantId || "") || null;
  }


  function buildKoMatchesFromStructure(bracketStructure) {
    const rounds = Array.isArray(bracketStructure?.rounds) ? bracketStructure.rounds : [];
    const matches = [];
    rounds.forEach((roundDef) => {
      roundDef.virtualMatches.forEach((virtualMatch) => {
        const p1 = resolveInitialVirtualParticipantId(virtualMatch?.competitors?.p1);
        const p2 = resolveInitialVirtualParticipantId(virtualMatch?.competitors?.p2);
        const structuralBye = Boolean(virtualMatch?.structuralBye);
        const advancedParticipantId = structuralBye ? (p1 || p2 || null) : null;
        const isBye = structuralBye && Boolean(advancedParticipantId);
        const baseMeta = buildKoMatchMetaFromVirtualMatch(virtualMatch);
        const meta = isBye
          ? { ...baseMeta, resultKind: "bye" }
          : baseMeta;

        matches.push(createMatch({
          id: virtualMatch.id,
          stage: MATCH_STAGE_KO,
          round: virtualMatch.round,
          number: virtualMatch.number,
          player1Id: p1,
          player2Id: p2,
          status: isBye ? STATUS_COMPLETED : STATUS_PENDING,
          winnerId: isBye ? advancedParticipantId : null,
          legs: isBye ? { p1: 0, p2: 0 } : { p1: 0, p2: 0 },
          meta,
        }));
      });
    });
    return matches;
  }


  function buildKoMatchesV2(participantIds, drawMode = KO_DRAW_MODE_SEEDED) {
    const participants = (Array.isArray(participantIds) ? participantIds : [])
      .map((entry) => ({
        id: normalizeText(entry?.id || entry || ""),
        name: normalizeText(entry?.name || entry?.id || entry || ""),
        seed: entry?.seed,
      }))
      .filter((entry) => entry.id);
    const seeds = generateSeeds(participants, drawMode);
    const structure = buildBracketStructure(participants, seeds);
    return buildKoMatchesFromStructure(structure);
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
      errors.push("Ungültiger Modus.");
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
    const koDrawLocked = config.mode === "ko"
      ? config.koDrawLocked !== false
      : false;
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
    let koMeta = null;

    if (config.mode === "league") {
      matches = buildLeagueMatches(participantIds);
    } else if (config.mode === "groups_ko") {
      groups = buildGroups(participantIds);
      matches = buildGroupMatches(groups).concat(buildGroupsKoMatches());
    } else {
      const koSeeds = generateSeeds(participants, koDrawMode);
      const koStructure = buildBracketStructure(participants, koSeeds);
      matches = buildKoMatchesFromStructure(koStructure);
      koMeta = {
        drawMode: koDrawMode,
        drawLocked: koDrawLocked,
        engineVersion: KO_ENGINE_VERSION,
        bracketSize: koStructure.bracketSize,
        placement: koStructure.placement,
        seeding: koStructure.seeding,
        rounds: koStructure.rounds,
      };
    }

    const tournament = {
      id: uuid("tournament"),
      name: normalizeText(config.name),
      mode: config.mode,
      ko: koMeta,
      bestOfLegs: sanitizeBestOf(config.bestOfLegs),
      startScore: x01.baseScore,
      x01,
      rules: normalizeTournamentRules({ tieBreakProfile: TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE }),
      participants,
      groups,
      matches,
      results: [],
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
