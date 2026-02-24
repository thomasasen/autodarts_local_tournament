// Auto-generated module split from dist source.
  function groupStandingsMap(tournament) {
    const map = new Map();
    (tournament.groups || []).forEach((group) => {
      const groupMatches = tournament.matches.filter((match) => match.stage === MATCH_STAGE_GROUP && match.groupId === group.id);
      const rows = standingsForMatches(tournament, groupMatches, group.participantIds);
      const complete = groupMatches.length > 0 && groupMatches.every((match) => match.status === STATUS_COMPLETED);
      const groupResolution = complete && rows.some((row) => row.tiebreakState === "playoff_required")
        ? {
          status: "playoff_required",
          reason: "Playoff erforderlich: Gleichstand nach DRA-Tie-Break.",
        }
        : {
          status: "resolved",
          reason: "",
        };
      map.set(group.id, {
        group,
        rows,
        complete,
        groupResolution,
      });
    });
    return map;
  }


  function resolveGroupsToKoAssignments(tournament) {
    if (tournament.mode !== "groups_ko") {
      return false;
    }

    let changed = false;
    const standingMap = groupStandingsMap(tournament);
    const semifinals = getMatchesByStage(tournament, MATCH_STAGE_KO).filter((match) => match.round === 1);

    semifinals.forEach((match) => {
      const from1 = match.meta?.from1;
      const from2 = match.meta?.from2;
      if (!from1 || !from2) {
        return;
      }

      const group1 = standingMap.get(from1.groupId);
      const group2 = standingMap.get(from2.groupId);
      const p1 = group1 && group1.complete && group1.groupResolution?.status === "resolved"
        ? group1.rows[from1.rank - 1]?.id || null
        : null;
      const p2 = group2 && group2.complete && group2.groupResolution?.status === "resolved"
        ? group2.rows[from2.rank - 1]?.id || null
        : null;
      changed = assignPlayerSlot(match, 1, p1) || changed;
      changed = assignPlayerSlot(match, 2, p2) || changed;
    });

    return changed;
  }


