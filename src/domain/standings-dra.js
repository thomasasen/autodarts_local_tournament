// Auto-generated module split from dist source.
  function standingsForMatches(tournament, matches, participantIds = null) {
    const allowedIds = Array.isArray(participantIds)
      ? new Set(participantIds.map((id) => normalizeText(id)).filter(Boolean))
      : null;

    const rows = (tournament?.participants || [])
      .filter((participant) => !allowedIds || allowedIds.has(participant.id))
      .map((participant) => ({
        id: participant.id,
        name: participant.name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        legsFor: 0,
        legsAgainst: 0,
        legDiff: 0,
        points: 0,
        rank: 0,
        tiebreakState: "resolved",
      }));

    const rowById = new Map(rows.map((row) => [row.id, row]));
    const completedMatches = (Array.isArray(matches) ? matches : []).filter((match) => match?.status === STATUS_COMPLETED);

    completedMatches.forEach((match) => {
      if (!match.player1Id || !match.player2Id) {
        return;
      }
      const row1 = rowById.get(match.player1Id);
      const row2 = rowById.get(match.player2Id);
      if (!row1 || !row2) {
        return;
      }

      row1.played += 1;
      row2.played += 1;

      const p1Legs = clampInt(match.legs?.p1, 0, 0, 50);
      const p2Legs = clampInt(match.legs?.p2, 0, 0, 50);
      row1.legsFor += p1Legs;
      row1.legsAgainst += p2Legs;
      row2.legsFor += p2Legs;
      row2.legsAgainst += p1Legs;

      if (match.winnerId === match.player1Id) {
        row1.wins += 1;
        row2.losses += 1;
        row1.points += 2;
        return;
      }
      if (match.winnerId === match.player2Id) {
        row2.wins += 1;
        row1.losses += 1;
        row2.points += 2;
        return;
      }
      row1.draws += 1;
      row2.draws += 1;
      row1.points += 1;
      row2.points += 1;
    });

    rows.forEach((row) => {
      row.legDiff = row.legsFor - row.legsAgainst;
    });

    const tieBreakMode = normalizeTieBreakMode(tournament?.rules?.tieBreakMode, TIE_BREAK_MODE_DRA_STRICT);
    const tiePrimaryById = new Map(rows.map((row) => [row.id, 0]));

    if (tieBreakMode === TIE_BREAK_MODE_DRA_STRICT) {
      const pointsBuckets = new Map();
      rows.forEach((row) => {
        if (!pointsBuckets.has(row.points)) {
          pointsBuckets.set(row.points, []);
        }
        pointsBuckets.get(row.points).push(row);
      });

      pointsBuckets.forEach((bucketRows) => {
        if (bucketRows.length < 2) {
          return;
        }
        const bucketIds = new Set(bucketRows.map((row) => row.id));
        const bucketMatches = completedMatches.filter((match) => (
          match.player1Id
          && match.player2Id
          && bucketIds.has(match.player1Id)
          && bucketIds.has(match.player2Id)
        ));

        if (bucketRows.length === 2) {
          const left = bucketRows[0];
          const right = bucketRows[1];
          let leftDirectScore = 0;
          let rightDirectScore = 0;
          bucketMatches.forEach((match) => {
            if (match.winnerId === left.id) {
              leftDirectScore += 1;
            } else if (match.winnerId === right.id) {
              rightDirectScore += 1;
            }
          });
          if (leftDirectScore !== rightDirectScore) {
            tiePrimaryById.set(left.id, leftDirectScore - rightDirectScore);
            tiePrimaryById.set(right.id, rightDirectScore - leftDirectScore);
          }
          return;
        }

        const miniLegDiffById = new Map(bucketRows.map((row) => [row.id, 0]));
        bucketMatches.forEach((match) => {
          const p1 = clampInt(match.legs?.p1, 0, 0, 50);
          const p2 = clampInt(match.legs?.p2, 0, 0, 50);
          miniLegDiffById.set(match.player1Id, (miniLegDiffById.get(match.player1Id) || 0) + (p1 - p2));
          miniLegDiffById.set(match.player2Id, (miniLegDiffById.get(match.player2Id) || 0) + (p2 - p1));
        });
        bucketRows.forEach((row) => {
          tiePrimaryById.set(row.id, miniLegDiffById.get(row.id) || 0);
        });
      });
    }

    rows.sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }

      if (tieBreakMode === TIE_BREAK_MODE_DRA_STRICT) {
        const rightPrimary = tiePrimaryById.get(right.id) || 0;
        const leftPrimary = tiePrimaryById.get(left.id) || 0;
        if (rightPrimary !== leftPrimary) {
          return rightPrimary - leftPrimary;
        }
      }

      if (right.legDiff !== left.legDiff) {
        return right.legDiff - left.legDiff;
      }
      if (right.legsFor !== left.legsFor) {
        return right.legsFor - left.legsFor;
      }
      return left.name.localeCompare(right.name, "de");
    });

    if (tieBreakMode === TIE_BREAK_MODE_DRA_STRICT) {
      const unresolvedBuckets = new Map();
      rows.forEach((row) => {
        const key = [
          row.points,
          tiePrimaryById.get(row.id) || 0,
          row.legDiff,
          row.legsFor,
        ].join("|");
        if (!unresolvedBuckets.has(key)) {
          unresolvedBuckets.set(key, []);
        }
        unresolvedBuckets.get(key).push(row);
      });
      unresolvedBuckets.forEach((bucketRows) => {
        if (bucketRows.length < 2) {
          return;
        }
        bucketRows.forEach((row) => {
          row.tiebreakState = "playoff_required";
        });
      });
    }

    rows.forEach((row, index) => {
      row.rank = index + 1;
    });

    return rows;
  }


