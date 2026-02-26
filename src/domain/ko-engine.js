// Auto-generated module split from dist source.
  function clearMatchResult(match) {
    match.status = STATUS_PENDING;
    match.winnerId = null;
    match.source = null;
    match.legs = { p1: 0, p2: 0 };
    match.stats = normalizeMatchStats(null);
    setMatchResultKind(match, null);
    resetMatchAutomationMeta(match);
    match.updatedAt = nowIso();
  }


  function assignPlayerSlot(match, slot, participantId) {
    const field = slot === 1 ? "player1Id" : "player2Id";
    const currentValue = match[field] || null;
    const nextValue = participantId || null;
    if (currentValue === nextValue) {
      return false;
    }
    match[field] = nextValue;
    const hasStoredResult = match.status === STATUS_COMPLETED
      || Boolean(match.winnerId || match.source || match.legs?.p1 || match.legs?.p2);
    if (hasStoredResult) {
      clearMatchResult(match);
    }
    match.updatedAt = nowIso();
    return true;
  }


  function findKoNextMatch(tournament, match) {
    const nextRound = match.round + 1;
    const nextNumber = Math.ceil(match.number / 2);
    return tournament.matches.find(
      (item) => item.stage === MATCH_STAGE_KO && item.round === nextRound && item.number === nextNumber,
    ) || null;
  }


  function advanceKoWinners(tournament) {
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    let changed = false;

    koMatches.forEach((match) => {
      if (match.status !== STATUS_COMPLETED || !match.winnerId) {
        return;
      }
      const nextMatch = findKoNextMatch(tournament, match);
      if (!nextMatch) {
        return;
      }
      if (match.number % 2 === 1) {
        changed = assignPlayerSlot(nextMatch, 1, match.winnerId) || changed;
      } else {
        changed = assignPlayerSlot(nextMatch, 2, match.winnerId) || changed;
      }
    });

    return changed;
  }


  function serializeComparable(value) {
    return JSON.stringify(value === undefined ? null : value);
  }


  function isSerializableEqual(left, right) {
    return serializeComparable(left) === serializeComparable(right);
  }


  function deriveWinnerIdFromLegs(tournament, match) {
    if (!match?.player1Id || !match?.player2Id) {
      return null;
    }
    const legsToWin = getLegsToWin(tournament?.bestOfLegs);
    const p1Legs = clampInt(match.legs?.p1, 0, 0, 99);
    const p2Legs = clampInt(match.legs?.p2, 0, 0, 99);
    if (p1Legs === p2Legs) {
      return null;
    }
    if (p1Legs > legsToWin || p2Legs > legsToWin) {
      return null;
    }
    if (p1Legs === legsToWin && p1Legs > p2Legs) {
      return match.player1Id;
    }
    if (p2Legs === legsToWin && p2Legs > p1Legs) {
      return match.player2Id;
    }
    return null;
  }


  function resolveVirtualCompetitorParticipantId(competitorRef, winnerByVirtualMatchId) {
    if (!competitorRef) {
      return null;
    }
    if (competitorRef.type === "participant") {
      return normalizeText(competitorRef.participantId || "") || null;
    }
    if (competitorRef.type === "winner") {
      return winnerByVirtualMatchId.get(normalizeText(competitorRef.matchId || "")) || null;
    }
    return null;
  }


  function buildKoMetaSnapshot(drawMode, structure) {
    const rounds = (Array.isArray(structure?.rounds) ? structure.rounds : []).map((roundDef) => ({
      round: clampInt(roundDef?.round, 1, 1, 64),
      label: normalizeText(roundDef?.label || ""),
      virtualMatches: (Array.isArray(roundDef?.virtualMatches) ? roundDef.virtualMatches : []).map((virtualMatch) => ({
        id: normalizeText(virtualMatch?.id || ""),
        round: clampInt(virtualMatch?.round, 1, 1, 64),
        number: clampInt(virtualMatch?.number, 1, 1, 256),
        structuralBye: Boolean(virtualMatch?.structuralBye),
        competitors: {
          p1: virtualMatch?.competitors?.p1 || null,
          p2: virtualMatch?.competitors?.p2 || null,
        },
      })),
    }));

    const seeding = (Array.isArray(structure?.seeding) ? structure.seeding : []).map((entry) => ({
      participantId: normalizeText(entry?.participantId || ""),
      participantName: normalizeText(entry?.participantName || entry?.participantId || ""),
      seed: clampInt(entry?.seed, 1, 1, TECHNICAL_PARTICIPANT_HARD_MAX),
      hasBye: Boolean(entry?.hasBye),
      entryRound: clampInt(entry?.entryRound, 1, 1, 64),
      slot: Number.isFinite(Number(entry?.slot)) ? clampInt(entry?.slot, 1, 1, TECHNICAL_PARTICIPANT_HARD_MAX) : null,
    })).filter((entry) => entry.participantId);

    return {
      drawMode: normalizeKoDrawMode(drawMode, KO_DRAW_MODE_SEEDED),
      engineVersion: KO_ENGINE_VERSION,
      bracketSize: clampInt(structure?.bracketSize, 2, 2, TECHNICAL_PARTICIPANT_HARD_MAX),
      seeding,
      rounds,
    };
  }


  function synchronizeKoBracketState(tournament) {
    if (!tournament || tournament.mode !== "ko") {
      return false;
    }

    let changed = false;
    const drawMode = normalizeKoDrawMode(tournament?.ko?.drawMode, KO_DRAW_MODE_SEEDED);
    const participants = (Array.isArray(tournament.participants) ? tournament.participants : [])
      .map((participant) => ({
        id: normalizeText(participant?.id || ""),
        name: normalizeText(participant?.name || participant?.id || ""),
        seed: participant?.seed,
      }))
      .filter((participant) => participant.id);

    const seeds = generateSeeds(participants, drawMode);
    const structure = buildBracketStructure(participants, seeds);
    const nextKoMeta = buildKoMetaSnapshot(drawMode, structure);
    if (!isSerializableEqual(tournament.ko, nextKoMeta)) {
      tournament.ko = nextKoMeta;
      changed = true;
    }

    const existingKoMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    const existingKoById = new Map(existingKoMatches.map((match) => [match.id, match]));
    const winnerByVirtualMatchId = new Map();
    const nextKoMatches = [];

    structure.rounds.forEach((roundDef) => {
      roundDef.virtualMatches.forEach((virtualMatch) => {
        const p1 = resolveVirtualCompetitorParticipantId(virtualMatch?.competitors?.p1, winnerByVirtualMatchId);
        const p2 = resolveVirtualCompetitorParticipantId(virtualMatch?.competitors?.p2, winnerByVirtualMatchId);

        if (virtualMatch.structuralBye) {
          const advancedParticipant = p1 || p2 || null;
          if (advancedParticipant) {
            winnerByVirtualMatchId.set(virtualMatch.id, advancedParticipant);
          }
          return;
        }

        if (!p1 || !p2) {
          return;
        }

        let match = existingKoById.get(virtualMatch.id) || null;
        if (!match) {
          match = createMatch({
            id: virtualMatch.id,
            stage: MATCH_STAGE_KO,
            round: virtualMatch.round,
            number: virtualMatch.number,
            player1Id: p1,
            player2Id: p2,
            meta: buildKoMatchMetaFromVirtualMatch(virtualMatch),
          });
          changed = true;
        } else {
          if (match.round !== virtualMatch.round || match.number !== virtualMatch.number) {
            match.round = virtualMatch.round;
            match.number = virtualMatch.number;
            match.updatedAt = nowIso();
            changed = true;
          }
          changed = assignPlayerSlot(match, 1, p1) || changed;
          changed = assignPlayerSlot(match, 2, p2) || changed;

          const normalizedMeta = normalizeMatchMeta({
            ...(match.meta || {}),
            ...buildKoMatchMetaFromVirtualMatch(virtualMatch),
          });
          if (!isSerializableEqual(match.meta, normalizedMeta)) {
            match.meta = normalizedMeta;
            match.updatedAt = nowIso();
            changed = true;
          }
        }

        if (isByeMatchResult(match)) {
          const localChanged = setMatchResultKind(match, null);
          if (localChanged) {
            match.updatedAt = nowIso();
          }
          changed = localChanged || changed;
        }

        const normalizedStats = normalizeMatchStats(match.stats);
        if (!isSerializableEqual(match.stats, normalizedStats)) {
          match.stats = normalizedStats;
          match.updatedAt = nowIso();
          changed = true;
        }

        nextKoMatches.push(match);

        if (match.status === STATUS_COMPLETED) {
          const derivedWinnerId = deriveWinnerIdFromLegs(tournament, match);
          if (derivedWinnerId && match.winnerId !== derivedWinnerId) {
            match.winnerId = derivedWinnerId;
            match.updatedAt = nowIso();
            changed = true;
          }
          if (isCompletedMatchResultValid(tournament, match)) {
            winnerByVirtualMatchId.set(match.id, match.winnerId);
          }
        }
      });
    });

    const nextKoMatchIdSet = new Set(nextKoMatches.map((match) => match.id));
    if (existingKoMatches.some((match) => !nextKoMatchIdSet.has(match.id))) {
      changed = true;
    }

    const nonKoMatches = (tournament.matches || []).filter((match) => match.stage !== MATCH_STAGE_KO);
    const mergedMatches = nonKoMatches.concat(nextKoMatches);
    const currentMatches = Array.isArray(tournament.matches) ? tournament.matches : [];
    if (currentMatches.length !== mergedMatches.length) {
      changed = true;
    } else {
      for (let i = 0; i < currentMatches.length; i += 1) {
        if (currentMatches[i]?.id !== mergedMatches[i]?.id) {
          changed = true;
          break;
        }
      }
    }
    tournament.matches = mergedMatches;

    return changed;
  }


  function migrateKoTournamentToV3(tournament, defaultDrawMode = KO_DRAW_MODE_SEEDED) {
    if (!tournament || tournament.mode !== "ko") {
      return false;
    }

    const drawMode = normalizeKoDrawMode(tournament?.ko?.drawMode, defaultDrawMode);
    const engineVersion = normalizeKoEngineVersion(tournament?.ko?.engineVersion, 0);
    const currentKo = tournament.ko && typeof tournament.ko === "object" ? tournament.ko : {};

    if (engineVersion >= KO_ENGINE_VERSION) {
      const nextKo = {
        ...currentKo,
        drawMode,
        engineVersion: KO_ENGINE_VERSION,
      };
      if (!isSerializableEqual(currentKo, nextKo)) {
        tournament.ko = nextKo;
        return true;
      }
      return false;
    }

    const backupSnapshot = cloneSerializable(tournament);
    if (backupSnapshot) {
      persistKoMigrationBackup(backupSnapshot, "ko-engine-v3-migration").catch((error) => {
        logWarn("storage", "KO migration backup write failed.", error);
      });
    }

    tournament.ko = {
      ...currentKo,
      drawMode,
      engineVersion: KO_ENGINE_VERSION,
    };
    tournament.updatedAt = nowIso();

    logDebug("ko", "KO tournament migrated to engine v3.", {
      drawMode,
      participantCount: Array.isArray(tournament.participants) ? tournament.participants.length : 0,
    });

    return true;
  }


  function isCompletedMatchResultValid(tournament, match) {
    if (!match || match.status !== STATUS_COMPLETED) {
      return true;
    }
    if (!match.player1Id || !match.player2Id) {
      return false;
    }

    const derivedWinnerId = deriveWinnerIdFromLegs(tournament, match);
    if (!derivedWinnerId) {
      return false;
    }
    if (!match.winnerId) {
      return false;
    }
    return match.winnerId === derivedWinnerId;
  }


  function normalizeCompletedMatchResults(tournament) {
    if (!tournament) {
      return false;
    }
    let changed = false;
    tournament.matches.forEach((match) => {
      if (isByeMatchResult(match)) {
        const localChanged = setMatchResultKind(match, null);
        if (localChanged) {
          match.updatedAt = nowIso();
        }
        changed = localChanged || changed;
      }

      const normalizedStats = normalizeMatchStats(match.stats);
      if (!isSerializableEqual(match.stats, normalizedStats)) {
        match.stats = normalizedStats;
        match.updatedAt = nowIso();
        changed = true;
      }

      if (match.status !== STATUS_COMPLETED) {
        return;
      }

      const derivedWinnerId = deriveWinnerIdFromLegs(tournament, match);
      if (!derivedWinnerId || !match.player1Id || !match.player2Id) {
        clearMatchResult(match);
        changed = true;
        return;
      }
      if (match.winnerId !== derivedWinnerId) {
        match.winnerId = derivedWinnerId;
        match.updatedAt = nowIso();
        changed = true;
      }
    });
    return changed;
  }


  function buildTournamentResults(tournament) {
    const stageOrder = new Map([
      [MATCH_STAGE_GROUP, 1],
      [MATCH_STAGE_LEAGUE, 2],
      [MATCH_STAGE_KO, 3],
    ]);

    return (Array.isArray(tournament?.matches) ? tournament.matches : [])
      .filter((match) => match?.status === STATUS_COMPLETED && isCompletedMatchResultValid(tournament, match))
      .map((match) => ({
        matchId: match.id,
        stage: match.stage,
        round: match.round,
        number: match.number,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        winnerId: match.winnerId,
        legs: {
          p1: clampInt(match.legs?.p1, 0, 0, 99),
          p2: clampInt(match.legs?.p2, 0, 0, 99),
        },
        stats: normalizeMatchStats(match.stats),
        source: match.source === "auto" ? "auto" : "manual",
        updatedAt: normalizeText(match.updatedAt || nowIso()),
      }))
      .sort((left, right) => (
        (stageOrder.get(left.stage) || 99) - (stageOrder.get(right.stage) || 99)
        || left.round - right.round
        || left.number - right.number
      ));
  }


  function refreshTournamentResultsIndex(tournament) {
    if (!tournament) {
      return false;
    }
    const nextResults = buildTournamentResults(tournament);
    if (isSerializableEqual(tournament.results, nextResults)) {
      return false;
    }
    tournament.results = nextResults;
    return true;
  }


  function refreshDerivedMatches(tournament) {
    if (!tournament) {
      return false;
    }

    let changedAny = false;
    for (let i = 0; i < 8; i += 1) {
      let changed = false;
      changed = migrateKoTournamentToV3(tournament, KO_DRAW_MODE_SEEDED) || changed;
      changed = resolveGroupsToKoAssignments(tournament) || changed;
      changed = synchronizeKoBracketState(tournament) || changed;
      changed = normalizeCompletedMatchResults(tournament) || changed;
      changed = synchronizeKoBracketState(tournament) || changed;
      if (tournament.mode === "groups_ko") {
        changed = advanceKoWinners(tournament) || changed;
      }
      changed = refreshTournamentResultsIndex(tournament) || changed;
      changedAny = changedAny || changed;
      if (!changed) {
        break;
      }
    }
    return changedAny;
  }

