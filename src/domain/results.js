// Auto-generated module split from dist source.
  function getOpenMatchByPlayers(tournament, player1Id, player2Id) {
    const key = new Set([player1Id, player2Id]);
    const candidates = tournament.matches.filter((match) => {
      if (match.status !== STATUS_PENDING) {
        return false;
      }
      if (!match.player1Id || !match.player2Id) {
        return false;
      }
      const set = new Set([match.player1Id, match.player2Id]);
      return key.size === set.size && [...key].every((id) => set.has(id));
    });
    return candidates.length === 1 ? candidates[0] : null;
  }


  function deriveWinnerIdFromLegInput(match, p1Legs, p2Legs, legsToWin) {
    if (!match?.player1Id || !match?.player2Id) {
      return null;
    }
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


  function applyFixedLegAggregateResult(tournament, match, winnerId, legs, source) {
    if (hasPreliminaryFinalStageStarted(tournament)) {
      return { ok: false, reasonCode: "final_stage_already_started", message: "Nach Beginn der Finalphase sind Vorrundenergebnisse gesperrt." };
    }
    const p1Legs = Number(legs?.p1);
    const p2Legs = Number(legs?.p2);
    const validScore = Number.isInteger(p1Legs) && Number.isInteger(p2Legs)
      && p1Legs >= 0 && p2Legs >= 0
      && p1Legs + p2Legs === PRELIMINARY_FIXED_LEG_COUNT;
    if (!validScore) {
      return { ok: false, reasonCode: "fixed_legs_result_invalid", message: "Zul\u00e4ssig sind nur 2:0, 1:1 oder 0:2 nach zwei fest gespielten Legs." };
    }
    const derivedWinnerId = p1Legs === p2Legs ? null : (p1Legs > p2Legs ? match.player1Id : match.player2Id);
    if (winnerId && winnerId !== derivedWinnerId) {
      return { ok: false, reasonCode: "fixed_legs_winner_invalid", message: "Gewinner und Leg-Ergebnis widersprechen sich." };
    }
    match.status = STATUS_COMPLETED;
    match.winnerId = derivedWinnerId;
    match.source = source === "auto" ? "auto" : "manual";
    match.legs = { p1: p1Legs, p2: p2Legs };
    setMatchResultKind(match, derivedWinnerId ? null : "draw");
    match.updatedAt = nowIso();
    return { ok: true, completed: true, resultKind: derivedWinnerId ? null : "draw" };
  }


  function applyFixedLegEntriesToTournament(tournament, matchId, rawEntries, source = "manual") {
    if (!tournament) return { ok: false, reasonCode: "tournament_missing", message: "Kein aktives Turnier vorhanden." };
    const match = findMatch(tournament, matchId);
    if (!match) return { ok: false, reasonCode: "match_not_found", message: "Match nicht gefunden." };
    if (!isFixedLegsPreliminaryMatch(tournament, match)) return { ok: false, reasonCode: "fixed_legs_format_required", message: "Dieses Match verwendet kein Fixed-Legs-Format." };
    if (hasPreliminaryFinalStageStarted(tournament)) return { ok: false, reasonCode: "final_stage_already_started", message: "Nach Beginn der Finalphase sind Vorrundenergebnisse gesperrt." };
    if (!match.player1Id || !match.player2Id) return { ok: false, reasonCode: "match_participants_missing", message: "Match hat noch keine zwei Teilnehmer." };
    const entries = (Array.isArray(rawEntries) ? rawEntries : []).map((entry) => ({ legIndex: Number(entry?.legIndex), winnerId: normalizeText(entry?.winnerId || "") }));
    const indexes = new Set();
    for (const entry of entries) {
      if (!Number.isInteger(entry.legIndex) || entry.legIndex < 1 || entry.legIndex > PRELIMINARY_FIXED_LEG_COUNT || indexes.has(entry.legIndex)) {
        return { ok: false, reasonCode: "fixed_leg_duplicate_or_invalid", message: "Jeder Leg-Index darf genau einmal erfasst werden." };
      }
      if (entry.winnerId !== match.player1Id && entry.winnerId !== match.player2Id) {
        return { ok: false, reasonCode: "fixed_leg_winner_invalid", message: "Leg-Sieger passt nicht zur Paarung." };
      }
      indexes.add(entry.legIndex);
    }
    entries.sort((left, right) => left.legIndex - right.legIndex);
    if (entries.length && entries[0].legIndex !== 1) {
      return { ok: false, reasonCode: "fixed_leg_sequence_invalid", message: "Leg 1 muss vor Leg 2 erfasst werden." };
    }
    const now = nowIso();
    const fixedLegs = {
      count: PRELIMINARY_FIXED_LEG_COUNT,
      entries: entries.map((entry) => ({ ...entry, source: source === "auto" ? "auto" : "manual", recordedAt: now })),
      syncStatus: "manual_only",
    };
    match.meta = normalizeMatchMeta({ ...(match.meta || {}), fixedLegs });
    const p1Legs = entries.filter((entry) => entry.winnerId === match.player1Id).length;
    const p2Legs = entries.filter((entry) => entry.winnerId === match.player2Id).length;
    match.legs = { p1: p1Legs, p2: p2Legs };
    match.source = entries.length ? "manual" : null;
    if (entries.length < PRELIMINARY_FIXED_LEG_COUNT) {
      match.status = STATUS_PENDING;
      match.winnerId = null;
      setMatchResultKind(match, null);
      match.updatedAt = now;
      return { ok: true, completed: false, legs: match.legs };
    }
    return applyFixedLegAggregateResult(tournament, match, null, match.legs, source);
  }


  function applyMatchResultToTournament(tournament, matchId, winnerId, legs, source, stats = null) {
    if (!tournament) {
      return { ok: false, message: "Kein aktives Turnier vorhanden." };
    }

    const match = findMatch(tournament, matchId);
    if (!match) {
      return { ok: false, message: "Match nicht gefunden." };
    }
    if (!match.player1Id || !match.player2Id) {
      return { ok: false, message: "Match hat noch keine zwei Teilnehmer." };
    }
    if (winnerId && winnerId !== match.player1Id && winnerId !== match.player2Id) {
      return { ok: false, message: "Gewinner passt nicht zum Match." };
    }

    if (isFixedLegsPreliminaryMatch(tournament, match)) {
      return applyFixedLegAggregateResult(tournament, match, winnerId, legs, source);
    }

    const matchBestOfLegs = getMatchBestOfLegs(tournament, match);
    const legsToWin = getLegsToWin(matchBestOfLegs);
    const p1Legs = clampInt(legs?.p1, 0, 0, 99);
    const p2Legs = clampInt(legs?.p2, 0, 0, 99);
    const derivedWinnerId = deriveWinnerIdFromLegInput(match, p1Legs, p2Legs, legsToWin);

    if (p1Legs > legsToWin || p2Legs > legsToWin) {
      return {
        ok: false,
        message: `Ung\u00fcltiges Ergebnis: Pro Spieler sind maximal ${legsToWin} Legs m\u00f6glich (Best-of ${matchBestOfLegs}).`,
      };
    }

    if (p1Legs === p2Legs) {
      return { ok: false, message: "Ung\u00fcltiges Ergebnis: Bei Best-of ist kein Gleichstand m\u00f6glich." };
    }

    if (!derivedWinnerId) {
      return {
        ok: false,
        message: `Ung\u00fcltiges Ergebnis: Ein Spieler muss genau ${legsToWin} Legs erreichen (Best-of ${matchBestOfLegs}).`,
      };
    }

    if (winnerId && winnerId !== derivedWinnerId) {
      return {
        ok: false,
        message: "Ung\u00fcltiges Ergebnis: Gewinner muss aus den Legs abgeleitet werden.",
      };
    }

    match.status = STATUS_COMPLETED;
    match.winnerId = derivedWinnerId;
    match.source = source === "auto" ? "auto" : "manual";
    match.legs = { p1: p1Legs, p2: p2Legs };
    match.stats = normalizeMatchStats(stats || match.stats);
    setMatchResultKind(match, null);
    const now = nowIso();
    const auto = ensureMatchAutoMeta(match);
    if (source === "auto") {
      auto.status = "completed";
      auto.finishedAt = now;
      auto.lastSyncAt = now;
      auto.lastError = null;
    } else if (auto.lobbyId || auto.status === "started" || auto.status === "error") {
      auto.status = "completed";
      auto.finishedAt = now;
      auto.lastSyncAt = now;
      auto.lastError = null;
    }
    match.updatedAt = now;
    return { ok: true };
  }


  function getKoBlockingSourceMatch(tournament, match) {
    if (!tournament || !match || match.stage !== MATCH_STAGE_KO || match.round <= 1) {
      return null;
    }

    const sourceMatchIds = new Set();
    const p1SourceType = normalizeText(match?.meta?.bracket?.p1Source?.type || "");
    const p2SourceType = normalizeText(match?.meta?.bracket?.p2Source?.type || "");
    const p1SourceMatchId = normalizeText(match?.meta?.bracket?.p1Source?.matchId || "");
    const p2SourceMatchId = normalizeText(match?.meta?.bracket?.p2Source?.matchId || "");
    if ((p1SourceType === "winner" || p1SourceType === "loser") && p1SourceMatchId) {
      sourceMatchIds.add(p1SourceMatchId);
    }
    if ((p2SourceType === "winner" || p2SourceType === "loser") && p2SourceMatchId) {
      sourceMatchIds.add(p2SourceMatchId);
    }
    if (sourceMatchIds.size) {
      const sourceMatches = getMatchesByStage(tournament, MATCH_STAGE_KO)
        .filter((item) => sourceMatchIds.has(normalizeText(item?.id || "")));
      return sourceMatches.find((item) => item.status !== STATUS_COMPLETED) || null;
    }

    const previousRound = match.round - 1;
    const sourceNumberA = ((match.number - 1) * 2) + 1;
    const sourceNumberB = sourceNumberA + 1;
    const sourceMatches = getMatchesByStage(tournament, MATCH_STAGE_KO)
      .filter((item) => (
        item.round === previousRound
        && (item.number === sourceNumberA || item.number === sourceNumberB)
      ))
      .sort((left, right) => left.number - right.number);

    if (!sourceMatches.length) {
      return null;
    }

    return sourceMatches.find((item) => item.status !== STATUS_COMPLETED) || null;
  }


  function getMatchEditability(tournament, match) {
    if (!tournament || !match) {
      return { editable: false, reason: "Match nicht verf\u00fcgbar." };
    }

    if (match.status === STATUS_COMPLETED) {
      return { editable: false, reason: "Match ist bereits abgeschlossen." };
    }

    if (!match.player1Id || !match.player2Id) {
      return { editable: false, reason: "Paarung steht noch nicht fest." };
    }

    if (match.stage === MATCH_STAGE_KO) {
      const blockingMatch = getKoBlockingSourceMatch(tournament, match);
      if (blockingMatch) {
        const koFinalRound = getMatchesByStage(tournament, MATCH_STAGE_KO).reduce((maxRound, koMatch) => {
          if (normalizeText(koMatch?.meta?.bracket?.matchRole || "") === "third_place") {
            return maxRound;
          }
          const roundNumber = clampInt(koMatch?.round, 0, 0, 64);
          return roundNumber > maxRound ? roundNumber : maxRound;
        }, 0);
        const blockingLabel = getKoRoundMatchLabel(
          blockingMatch.round,
          koFinalRound || blockingMatch.round,
          blockingMatch.number,
        );
        return {
          editable: false,
          reason: `Vorg\u00e4nger-Match ${blockingLabel} muss zuerst abgeschlossen werden.`,
        };
      }
    }

    return { editable: true, reason: "" };
  }


