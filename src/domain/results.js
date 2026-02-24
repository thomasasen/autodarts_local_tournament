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


  function updateMatchResult(matchId, winnerId, legs, source) {
    const tournament = state.store.tournament;
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
    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      return { ok: false, message: "Gewinner passt nicht zum Match." };
    }

    const legsToWin = getLegsToWin(tournament.bestOfLegs);
    const p1Legs = clampInt(legs?.p1, 0, 0, 99);
    const p2Legs = clampInt(legs?.p2, 0, 0, 99);
    const winnerIsP1 = winnerId === match.player1Id;
    const winnerLegs = winnerIsP1 ? p1Legs : p2Legs;
    const loserLegs = winnerIsP1 ? p2Legs : p1Legs;

    if (p1Legs > legsToWin || p2Legs > legsToWin) {
      return {
        ok: false,
        message: `Ung\u00fcltiges Ergebnis: Pro Spieler sind maximal ${legsToWin} Legs m\u00f6glich (Best-of ${sanitizeBestOf(tournament.bestOfLegs)}).`,
      };
    }

    if (p1Legs === p2Legs) {
      return { ok: false, message: "Ung\u00fcltiges Ergebnis: Bei Best-of ist kein Gleichstand m\u00f6glich." };
    }

    if (winnerLegs <= loserLegs) {
      return { ok: false, message: "Ung\u00fcltiges Ergebnis: Der gew\u00e4hlte Gewinner muss mehr Legs als der Gegner haben." };
    }

    if (winnerLegs !== legsToWin) {
      return {
        ok: false,
        message: `Ung\u00fcltiges Ergebnis: Der Gewinner muss genau ${legsToWin} Legs erreichen (Best-of ${sanitizeBestOf(tournament.bestOfLegs)}).`,
      };
    }

    match.status = STATUS_COMPLETED;
    match.winnerId = winnerId;
    match.source = source === "auto" ? "auto" : "manual";
    match.legs = { p1: p1Legs, p2: p2Legs };
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

    refreshDerivedMatches(tournament);
    tournament.updatedAt = now;
    schedulePersist();
    renderShell();
    return { ok: true };
  }


  function getKoBlockingSourceMatch(tournament, match) {
    if (!tournament || !match || match.stage !== MATCH_STAGE_KO || match.round <= 1) {
      return null;
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
      if (isByeMatchResult(match)) {
        return { editable: false, reason: "Freilos wurde automatisch weitergeleitet." };
      }
      return { editable: false, reason: "Match ist bereits abgeschlossen." };
    }

    if (!match.player1Id || !match.player2Id) {
      return { editable: false, reason: "Paarung steht noch nicht fest." };
    }

    if (match.stage === MATCH_STAGE_KO) {
      const blockingMatch = getKoBlockingSourceMatch(tournament, match);
      if (blockingMatch) {
        return {
          editable: false,
          reason: `Vorg\u00e4nger-Match Runde ${blockingMatch.round} / Spiel ${blockingMatch.number} muss zuerst abgeschlossen werden.`,
        };
      }
    }

    return { editable: true, reason: "" };
  }


