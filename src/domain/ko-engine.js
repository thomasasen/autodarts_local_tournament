// Auto-generated module split from dist source.
  function clearMatchResult(match) {
    match.status = STATUS_PENDING;
    match.winnerId = null;
    match.source = null;
    match.legs = { p1: 0, p2: 0 };
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


  function migrateKoTournamentToV2(tournament, defaultDrawMode = KO_DRAW_MODE_SEEDED) {
    if (!tournament || tournament.mode !== "ko") {
      return false;
    }

    const drawMode = normalizeKoDrawMode(tournament?.ko?.drawMode, defaultDrawMode);
    const engineVersion = normalizeKoEngineVersion(tournament?.ko?.engineVersion, 0);

    if (engineVersion >= KO_ENGINE_VERSION) {
      if (!tournament.ko || tournament.ko.drawMode !== drawMode || tournament.ko.engineVersion !== KO_ENGINE_VERSION) {
        tournament.ko = { drawMode, engineVersion: KO_ENGINE_VERSION };
        return true;
      }
      return false;
    }

    const backupSnapshot = cloneSerializable(tournament);
    if (backupSnapshot) {
      persistKoMigrationBackup(backupSnapshot, "ko-engine-v2-migration").catch((error) => {
        logWarn("storage", "KO migration backup write failed.", error);
      });
    }

    const participantIds = (tournament.participants || [])
      .map((participant) => normalizeText(participant?.id || ""))
      .filter(Boolean);

    const nonKoMatches = (tournament.matches || []).filter((match) => match.stage !== MATCH_STAGE_KO);
    const migratedKoMatches = buildKoMatchesV2(participantIds, drawMode);
    tournament.matches = nonKoMatches.concat(migratedKoMatches);
    tournament.ko = { drawMode, engineVersion: KO_ENGINE_VERSION };
    tournament.updatedAt = nowIso();

    logDebug("ko", "KO tournament migrated to engine v2.", {
      drawMode,
      participantCount: participantIds.length,
    });

    return true;
  }


  function autoCompleteByes(tournament) {
    if (!tournament || tournament.mode !== "ko") {
      return false;
    }

    let changed = false;
    const participantIndexes = buildParticipantIndexes(tournament);
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);

    function applyByeCompletion(match, winnerId) {
      let localChanged = false;
      if (match.status !== STATUS_COMPLETED) {
        match.status = STATUS_COMPLETED;
        localChanged = true;
      }
      if (match.winnerId !== winnerId) {
        match.winnerId = winnerId;
        localChanged = true;
      }
      if (match.source !== "auto") {
        match.source = "auto";
        localChanged = true;
      }
      if (clampInt(match.legs?.p1, 0, 0, 99) !== 0 || clampInt(match.legs?.p2, 0, 0, 99) !== 0) {
        match.legs = { p1: 0, p2: 0 };
        localChanged = true;
      }
      localChanged = setMatchResultKind(match, "bye") || localChanged;
      const auto = ensureMatchAutoMeta(match);
      if (auto.lobbyId || auto.status !== "idle" || auto.startedAt || auto.finishedAt || auto.lastSyncAt || auto.lastError) {
        resetMatchAutomationMeta(match);
        localChanged = true;
      }
      if (localChanged) {
        match.updatedAt = nowIso();
      }
      return localChanged;
    }

    koMatches.forEach((match) => {
      // Byes are only legitimate in round 1 seeding; later rounds with one empty slot
      // mean "winner not known yet", not an automatic win.
      if (match.round !== 1) {
        if (isByeMatchResult(match)) {
          const localChanged = setMatchResultKind(match, null);
          if (localChanged) {
            match.updatedAt = nowIso();
          }
          changed = localChanged || changed;
        }
        return;
      }
      const p1 = resolveParticipantSlotId(tournament, match.player1Id, participantIndexes);
      const p2 = resolveParticipantSlotId(tournament, match.player2Id, participantIndexes);
      changed = assignPlayerSlot(match, 1, p1) || changed;
      changed = assignPlayerSlot(match, 2, p2) || changed;

      if (p1 && p2) {
        if (isByeMatchResult(match)) {
          const localChanged = setMatchResultKind(match, null);
          if (localChanged) {
            match.updatedAt = nowIso();
          }
          changed = localChanged || changed;
        }
        return;
      }

      if (p1 && !p2) {
        changed = applyByeCompletion(match, p1) || changed;
      } else if (p2 && !p1) {
        changed = applyByeCompletion(match, p2) || changed;
      } else if (isByeMatchResult(match)) {
        const localChanged = setMatchResultKind(match, null);
        if (localChanged) {
          match.updatedAt = nowIso();
        }
        changed = localChanged || changed;
      }
    });
    return changed;
  }


  function isCompletedMatchResultValid(tournament, match) {
    if (!match || match.status !== STATUS_COMPLETED) {
      return true;
    }
    if (!match.player1Id || !match.player2Id) {
      const availablePlayerId = match.player1Id || match.player2Id;
      if (match.stage !== MATCH_STAGE_KO || match.round !== 1) {
        return false;
      }
      return Boolean(availablePlayerId && match.winnerId === availablePlayerId);
    }
    if (match.winnerId !== match.player1Id && match.winnerId !== match.player2Id) {
      return false;
    }

    const legsToWin = getLegsToWin(tournament?.bestOfLegs);
    const p1Legs = clampInt(match.legs?.p1, 0, 0, 99);
    const p2Legs = clampInt(match.legs?.p2, 0, 0, 99);
    if (p1Legs > legsToWin || p2Legs > legsToWin) {
      return false;
    }
    if (p1Legs === p2Legs) {
      return false;
    }

    const winnerLegs = match.winnerId === match.player1Id ? p1Legs : p2Legs;
    const loserLegs = match.winnerId === match.player1Id ? p2Legs : p1Legs;
    return winnerLegs === legsToWin && winnerLegs > loserLegs;
  }


  function normalizeCompletedMatchResults(tournament) {
    if (!tournament) {
      return false;
    }
    let changed = false;
    tournament.matches.forEach((match) => {
      if (match.status === STATUS_COMPLETED && !isCompletedMatchResultValid(tournament, match)) {
        clearMatchResult(match);
        changed = true;
      }
    });
    return changed;
  }


  function refreshDerivedMatches(tournament) {
    if (!tournament) {
      return false;
    }

    let changedAny = false;
    for (let i = 0; i < 8; i += 1) {
      let changed = false;
      changed = migrateKoTournamentToV2(tournament, KO_DRAW_MODE_SEEDED) || changed;
      changed = normalizeCompletedMatchResults(tournament) || changed;
      changed = resolveGroupsToKoAssignments(tournament) || changed;
      changed = autoCompleteByes(tournament) || changed;
      changed = advanceKoWinners(tournament) || changed;
      changedAny = changedAny || changed;
      if (!changed) {
        break;
      }
    }
    return changedAny;
  }


