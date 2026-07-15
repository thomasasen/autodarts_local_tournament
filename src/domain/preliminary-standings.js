// Pure standings for the shortened preliminary stage.

  function normalizePreliminaryScoring(rawScoring) {
    const scoring = rawScoring && typeof rawScoring === "object" ? rawScoring : {};
    return { winPoints: Number(scoring.winPoints ?? 2), drawPoints: Number(scoring.drawPoints ?? 1), lossPoints: Number(scoring.lossPoints ?? 0) };
  }

  function validatePreliminaryScoring(rawScoring) {
    const scoring = normalizePreliminaryScoring(rawScoring);
    const values = [scoring.winPoints, scoring.drawPoints, scoring.lossPoints];
    const valid = values.every((value) => Number.isInteger(value) && value >= 0 && value <= 10)
      && scoring.winPoints > scoring.drawPoints && scoring.drawPoints >= scoring.lossPoints;
    return valid ? { ok: true, reasonCode: "", message: "", scoring } : { ok: false, reasonCode: "preliminary_scoring_invalid", message: "Punkte m\u00fcssen ganze Zahlen von 0 bis 10 sein; Sieg > Unentschieden >= Niederlage.", scoring };
  }

  function buildPreliminaryStandings(tournament) {
    const scoringValidation = validatePreliminaryScoring(tournament?.preliminary?.scoring);
    const scoring = scoringValidation.ok ? scoringValidation.scoring : normalizePreliminaryScoring(null);
    const rows = (tournament?.participants || []).map((participant, inputIndex) => ({ id: participant.id, name: participant.name, inputIndex, played: 0, wins: 0, draws: 0, losses: 0, points: 0, legsFor: 0, legsAgainst: 0, legDifference: 0, rank: 0, tiebreakState: "resolved" }));
    const rowById = new Map(rows.map((row) => [row.id, row]));
    getMatchesByStage(tournament, MATCH_STAGE_PRELIMINARY).filter((match) => match.status === STATUS_COMPLETED).forEach((match) => {
      const row1 = rowById.get(match.player1Id);
      const row2 = rowById.get(match.player2Id);
      if (!row1 || !row2) return;
      const p1Legs = clampInt(match.legs?.p1, 0, 0, PRELIMINARY_FIXED_LEG_COUNT);
      const p2Legs = clampInt(match.legs?.p2, 0, 0, PRELIMINARY_FIXED_LEG_COUNT);
      row1.played += 1; row2.played += 1;
      row1.legsFor += p1Legs; row1.legsAgainst += p2Legs;
      row2.legsFor += p2Legs; row2.legsAgainst += p1Legs;
      if (match.winnerId === match.player1Id) {
        row1.wins += 1; row2.losses += 1; row1.points += scoring.winPoints; row2.points += scoring.lossPoints;
      } else if (match.winnerId === match.player2Id) {
        row2.wins += 1; row1.losses += 1; row2.points += scoring.winPoints; row1.points += scoring.lossPoints;
      } else {
        row1.draws += 1; row2.draws += 1; row1.points += scoring.drawPoints; row2.points += scoring.drawPoints;
      }
    });
    rows.forEach((row) => { row.legDifference = row.legsFor - row.legsAgainst; });
    rows.sort((left, right) => right.points - left.points || right.legDifference - left.legDifference || right.legsFor - left.legsFor || left.inputIndex - right.inputIndex);
    const buckets = new Map();
    rows.forEach((row) => { const key = `${row.points}|${row.legDifference}|${row.legsFor}`; if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(row); });
    buckets.forEach((bucket) => { if (bucket.length > 1) bucket.forEach((row) => { row.tiebreakState = "playoff_required"; }); });
    rows.forEach((row, index) => { row.rank = index + 1; delete row.inputIndex; });
    return rows;
  }
