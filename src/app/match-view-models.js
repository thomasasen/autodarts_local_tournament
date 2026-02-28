// App layer: runtime orchestration, persistence scheduling and user feedback.

  function compareMatchesByRound(left, right) {
    const stageOrder = { group: 1, league: 2, ko: 3 };
    const leftOrder = stageOrder[left.stage] || 99;
    const rightOrder = stageOrder[right.stage] || 99;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return left.round - right.round || left.number - right.number;
  }


  function getMatchPriorityReadyFirst(tournament, match) {
    const auto = ensureMatchAutoMeta(match);
    const playability = getMatchEditability(tournament, match);
    if (match.status === STATUS_PENDING && auto.status === "started" && auto.lobbyId) {
      return 0;
    }
    if (match.status === STATUS_PENDING && playability.editable) {
      return 1;
    }
    if (match.status === STATUS_COMPLETED && !isByeMatchResult(match)) {
      return 2;
    }
    if (match.status === STATUS_COMPLETED && isByeMatchResult(match)) {
      return 3;
    }
    return 4;
  }


  function getMatchPriorityStatus(tournament, match) {
    const playability = getMatchEditability(tournament, match);
    if (match.status === STATUS_PENDING && playability.editable) {
      return 0;
    }
    if (match.status === STATUS_PENDING) {
      return 1;
    }
    if (isByeMatchResult(match)) {
      return 3;
    }
    return 2;
  }


  function sortMatchesForDisplay(tournament, sortMode) {
    const mode = sanitizeMatchesSortMode(sortMode, MATCH_SORT_MODE_READY_FIRST);
    const source = Array.isArray(tournament?.matches) ? tournament.matches.slice() : [];
    if (mode === MATCH_SORT_MODE_ROUND) {
      return source.sort(compareMatchesByRound);
    }
    if (mode === MATCH_SORT_MODE_STATUS) {
      return source.sort((left, right) => {
        const leftPriority = getMatchPriorityStatus(tournament, left);
        const rightPriority = getMatchPriorityStatus(tournament, right);
        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }
        return compareMatchesByRound(left, right);
      });
    }
    return source.sort((left, right) => {
      const leftPriority = getMatchPriorityReadyFirst(tournament, left);
      const rightPriority = getMatchPriorityReadyFirst(tournament, right);
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return compareMatchesByRound(left, right);
    });
  }


  function findSuggestedNextMatch(tournament) {
    const source = Array.isArray(tournament?.matches) ? tournament.matches.slice() : [];
    const candidates = source
      .filter((match) => {
        if (!match || match.status !== STATUS_PENDING) {
          return false;
        }
        const playability = getMatchEditability(tournament, match);
        if (!playability.editable) {
          return false;
        }
        const auto = ensureMatchAutoMeta(match);
        return !(auto.status === "started" && auto.lobbyId);
      })
      .sort(compareMatchesByRound);
    return candidates[0] || null;
  }

