// Auto-generated module split from dist source.
  function buildBracketPayload(tournament) {
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    if (!koMatches.length) {
      return null;
    }

    const bracketSize = tournament.mode === "groups_ko" ? 4 : nextPowerOfTwo(tournament.participants.length);
    const participants = tournament.participants
      .map((participant) => {
        const participantId = normalizeText(participant?.id);
        if (!participantId) {
          return null;
        }
        return {
          id: participantId,
          tournament_id: 1,
          name: normalizeText(participant?.name) || participantId,
        };
      })
      .filter(Boolean);
    const participantIdSet = new Set(participants.map((participant) => participant.id));
    const participantIndexes = buildParticipantIndexes(tournament);
    const resolveBracketParticipantId = (slotId) => {
      const resolved = resolveParticipantSlotId(tournament, slotId, participantIndexes);
      if (!resolved) {
        return null;
      }
      const participantId = normalizeText(resolved);
      return participantIdSet.has(participantId) ? participantId : null;
    };

    const matches = koMatches.map((match) => {
      const player1Id = resolveBracketParticipantId(match.player1Id);
      const player2Id = resolveBracketParticipantId(match.player2Id);
      const winnerId = resolveBracketParticipantId(match.winnerId);
      const byeResult = isByeMatchResult(match);
      const completed = isCompletedMatchResultValid(tournament, match)
        && Boolean(winnerId && (winnerId === player1Id || winnerId === player2Id));
      const status = completed ? 4 : (player1Id && player2Id ? 2 : 1);
      const opponent1 = player1Id
        ? {
            id: player1Id,
            score: completed && !byeResult ? clampInt(match.legs?.p1, 0, 0, 99) : undefined,
            result: completed && winnerId ? (winnerId === player1Id ? "win" : "loss") : undefined,
          }
        : null;
      const opponent2 = player2Id
        ? {
            id: player2Id,
            score: completed && !byeResult ? clampInt(match.legs?.p2, 0, 0, 99) : undefined,
            result: completed && winnerId ? (winnerId === player2Id ? "win" : "loss") : undefined,
          }
        : null;
      return {
        id: match.id,
        stage_id: 1,
        group_id: 1,
        round_id: match.round,
        number: match.number,
        child_count: 0,
        status,
        opponent1,
        opponent2,
      };
    });

    return {
      stages: [{
        id: 1,
        tournament_id: 1,
        name: tournament.mode === "groups_ko" ? "KO-Phase" : "KO",
        type: "single_elimination",
        settings: { size: bracketSize },
        number: 1,
      }],
      matches,
      matchGames: [],
      participants,
    };
  }


