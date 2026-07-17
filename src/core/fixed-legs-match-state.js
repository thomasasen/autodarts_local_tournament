// Pure helpers for the guided two-leg AutoDarts match flow.

  function getFixedLegsProviderPlayerRef(player) {
    const candidate = player && typeof player === "object" ? player : {};
    const nested = candidate.player && typeof candidate.player === "object" ? candidate.player : {};
    return {
      id: normalizeText(candidate.id || candidate.playerId || candidate.userId || nested.id || nested.playerId || ""),
      name: normalizeText(candidate.name || candidate.displayName || candidate.username || nested.name || nested.displayName || nested.username || ""),
    };
  }


  function getFixedLegsProviderPlayers(providerState) {
    const candidates = [providerState?.players, providerState?.match?.players, providerState?.game?.players];
    const source = candidates.find((entry) => Array.isArray(entry) && entry.length === 2) || [];
    return source.map(getFixedLegsProviderPlayerRef);
  }


  function getFixedLegsScoreArray(providerState) {
    const candidates = [
      { value: providerState?.legs, allowNumeric: true },
      { value: providerState?.legsWon, allowNumeric: true },
      { value: providerState?.score?.legs, allowNumeric: true },
      { value: providerState?.scores, allowNumeric: false },
      { value: providerState?.matchStats, allowNumeric: false },
      { value: providerState?.match?.scores, allowNumeric: false },
    ];
    for (const candidate of candidates) {
      if (!Array.isArray(candidate.value) || candidate.value.length < 2) continue;
      const values = candidate.value.slice(0, 2).map((entry) => {
        if (candidate.allowNumeric && Number.isInteger(Number(entry))) return Number(entry);
        const source = entry && typeof entry === "object" ? entry : {};
        const value = source.legsWon ?? source.legs ?? source.legWins ?? source.score?.legs;
        return Number.isInteger(Number(value)) ? Number(value) : NaN;
      });
      if (values.every((value) => Number.isInteger(value) && value >= 0)) return values;
    }
    return null;
  }


  function mapFixedLegsProviderPlayers(expectedPlayers, providerPlayers, options = {}) {
    const expected = (Array.isArray(expectedPlayers) ? expectedPlayers : []).slice(0, 2).map((player) => ({
      id: normalizeText(player?.id || ""),
      name: normalizeText(player?.name || ""),
    }));
    if (expected.length !== 2 || expected.some((player) => !player.id || !player.name)) {
      return { ok: false, reasonCode: "fixed_legs_player_mapping_ambiguous" };
    }
    const expectedNames = expected.map((player) => normalizeLookup(player.name));
    if (!expectedNames[0] || expectedNames[0] === expectedNames[1]) {
      return { ok: false, reasonCode: "fixed_legs_player_mapping_ambiguous" };
    }
    if (!Array.isArray(providerPlayers) || providerPlayers.length !== 2) {
      return { ok: false, reasonCode: "fixed_legs_player_mapping_ambiguous" };
    }

    const mapped = providerPlayers.map((provider) => {
      const providerId = normalizeText(provider?.id || "");
      const providerName = normalizeLookup(provider?.name || "");
      const matches = expected.map((player, index) => (
        (providerId && providerId === player.id) || (providerName && providerName === expectedNames[index])
          ? index
          : -1
      )).filter((index) => index >= 0);
      return matches.length === 1 ? matches[0] : -1;
    });
    if (mapped[0] >= 0 && mapped[1] >= 0 && mapped[0] !== mapped[1]) {
      return { ok: true, providerToExpected: mapped, fallback: false };
    }

    const validatedPositionIds = Array.isArray(options.validatedPositionIds) ? options.validatedPositionIds.map((id) => normalizeText(id || "")) : [];
    if (options.allowPositionalFallback === true
      && validatedPositionIds.length === 2
      && validatedPositionIds[0] === expected[0].id
      && validatedPositionIds[1] === expected[1].id) {
      return { ok: true, providerToExpected: [0, 1], fallback: true };
    }
    return { ok: false, reasonCode: "fixed_legs_player_mapping_ambiguous" };
  }


  function getFixedLegsGameProgress(providerState) {
    const rawNumber = providerState?.game?.number
      ?? providerState?.gameNumber
      ?? providerState?.currentGameNumber
      ?? (Number.isInteger(Number(providerState?.gameIndex)) ? Number(providerState.gameIndex) + 1 : null);
    const gameNumber = Number.isInteger(Number(rawNumber)) ? Number(rawNumber) : 0;
    const games = Array.isArray(providerState?.games) ? providerState.games : [];
    const startedGames = Math.max(gameNumber, games.length);
    const gameFinished = providerState?.gameFinished === true
      || providerState?.currentGameFinished === true
      || providerState?.game?.finished === true;
    const matchFinished = providerState?.matchFinished === true
      || normalizeLookup(providerState?.status || "") === "finished"
      || normalizeLookup(providerState?.status || "") === "completed";
    const finishReady = providerState?.finished === true;
    return { startedGames, gameFinished, matchFinished, finishReady };
  }


  function resolveFixedLegsMatchState(input) {
    const providerState = input?.providerState;
    if (!providerState || typeof providerState !== "object") {
      return { ok: false, phase: "blocked", reasonCode: "fixed_legs_state_invalid" };
    }
    const scoreByProvider = getFixedLegsScoreArray(providerState);
    if (!scoreByProvider) {
      return { ok: false, phase: "blocked", reasonCode: "fixed_legs_state_invalid" };
    }
    const mapping = mapFixedLegsProviderPlayers(
      input?.expectedPlayers,
      getFixedLegsProviderPlayers(providerState),
      {
        allowPositionalFallback: input?.allowPositionalFallback === true,
        validatedPositionIds: input?.validatedPositionIds,
      },
    );
    if (!mapping.ok) {
      return { ok: false, phase: "blocked", reasonCode: mapping.reasonCode };
    }
    const score = [0, 0];
    mapping.providerToExpected.forEach((expectedIndex, providerIndex) => {
      score[expectedIndex] = scoreByProvider[providerIndex];
    });
    const legs = { p1: score[0], p2: score[1] };
    const completedLegs = legs.p1 + legs.p2;
    const storedEntries = Array.isArray(input?.storedEntries) ? input.storedEntries : [];
    const storedP1 = storedEntries.filter((entry) => normalizeText(entry?.winnerId || "") === normalizeText(input?.expectedPlayers?.[0]?.id || "")).length;
    const storedP2 = storedEntries.filter((entry) => normalizeText(entry?.winnerId || "") === normalizeText(input?.expectedPlayers?.[1]?.id || "")).length;
    if (storedEntries.length > completedLegs || storedP1 > legs.p1 || storedP2 > legs.p2) {
      return { ok: false, phase: "blocked", reasonCode: "fixed_legs_state_conflict", legs, completedLegs };
    }
    if (completedLegs > PRELIMINARY_FIXED_LEG_COUNT) {
      return { ok: false, phase: "blocked", reasonCode: "fixed_legs_overrun", legs, completedLegs };
    }
    const progress = getFixedLegsGameProgress(providerState);
    if (completedLegs === 0) {
      if (progress.gameFinished || progress.matchFinished || progress.finishReady) {
        return { ok: false, phase: "blocked", reasonCode: "fixed_legs_state_invalid", legs, completedLegs };
      }
      return { ok: true, phase: "playing_leg_1", syncStatus: "linked", legs, completedLegs, mappingFallback: mapping.fallback };
    }
    if (completedLegs === 1) {
      const leg1WinnerId = legs.p1 === 1 ? input.expectedPlayers[0].id : input.expectedPlayers[1].id;
      if (progress.matchFinished) {
        return { ok: false, phase: "blocked", reasonCode: "fixed_legs_state_invalid", legs, completedLegs };
      }
      if (!progress.gameFinished && !progress.finishReady) {
        return { ok: true, phase: "playing_leg_2", syncStatus: "playing_leg_2", legs, completedLegs, leg1WinnerId, mappingFallback: mapping.fallback };
      }
      return { ok: true, phase: "awaiting_leg_2_confirmation", syncStatus: "awaiting_leg_2", legs, completedLegs, leg1WinnerId, mappingFallback: mapping.fallback };
    }
    const thirdGameInProgress = !progress.matchFinished && !progress.gameFinished && !progress.finishReady;
    if ((progress.startedGames >= 3 || thirdGameInProgress) && !progress.matchFinished) {
      if (progress.gameFinished) {
        return { ok: false, phase: "blocked", reasonCode: "fixed_legs_overrun", legs, completedLegs };
      }
      return {
        ok: false,
        phase: "blocked",
        reasonCode: "fixed_legs_state_conflict",
        recoveryAvailable: true,
        legs,
        completedLegs,
      };
    }
    if (progress.matchFinished) {
      return { ok: true, phase: "completed", syncStatus: "completed", legs, completedLegs, mappingFallback: mapping.fallback };
    }
    return { ok: true, phase: "awaiting_finish_confirmation", syncStatus: "awaiting_finish", legs, completedLegs, mappingFallback: mapping.fallback };
  }


  function buildFixedLegEntriesFromResolvedState(resolved, expectedPlayers, storedEntries = []) {
    if (!resolved?.ok || resolved.completedLegs < 1) return [];
    const existing = (Array.isArray(storedEntries) ? storedEntries : []).map((entry) => ({
      legIndex: Number(entry?.legIndex),
      winnerId: normalizeText(entry?.winnerId || ""),
    })).filter((entry) => entry.legIndex === 1 || entry.legIndex === 2);
    if (!existing.some((entry) => entry.legIndex === 1) && resolved.leg1WinnerId) {
      existing.push({ legIndex: 1, winnerId: resolved.leg1WinnerId });
    }
    if (resolved.completedLegs === 2 && !existing.length && (resolved.legs?.p1 === 2 || resolved.legs?.p2 === 2)) {
      const winnerId = resolved.legs.p1 === 2
        ? normalizeText(expectedPlayers?.[0]?.id || "")
        : normalizeText(expectedPlayers?.[1]?.id || "");
      if (winnerId) existing.push({ legIndex: 1, winnerId }, { legIndex: 2, winnerId });
    }
    if (resolved.completedLegs === 2 && existing.some((entry) => entry.legIndex === 1) && !existing.some((entry) => entry.legIndex === 2)) {
      const firstWinner = existing.find((entry) => entry.legIndex === 1)?.winnerId;
      const p1Id = normalizeText(expectedPlayers?.[0]?.id || "");
      const p2Id = normalizeText(expectedPlayers?.[1]?.id || "");
      const totals = new Map([[p1Id, Number(resolved.legs?.p1 || 0)], [p2Id, Number(resolved.legs?.p2 || 0)]]);
      totals.set(firstWinner, Math.max(0, (totals.get(firstWinner) || 0) - 1));
      const secondWinner = [...totals.entries()].find(([, count]) => count === 1)?.[0] || "";
      if (secondWinner) existing.push({ legIndex: 2, winnerId: secondWinner });
    }
    return existing.sort((left, right) => left.legIndex - right.legIndex);
  }


  function getFixedLegsActionFailureReason(actionId, error, fallback) {
    const status = Number(error?.status || 0);
    if (status === 401 || status === 403) return "auth";
    if (normalizeText(error?.reasonCode || "")) return normalizeText(error.reasonCode);
    if (fallback) return fallback;
    return actionId === "next" ? "fixed_legs_next_failed" : "fixed_legs_finish_failed";
  }


  async function executeFixedLegsGuidedAction(actionId, deps = {}) {
    const load = typeof deps.load === "function" ? deps.load : null;
    if (!load) return { ok: false, reasonCode: "fixed_legs_state_invalid" };
    let resolved;
    try {
      resolved = await load();
    } catch (error) {
      const status = Number(error?.status || 0);
      return {
        ok: false,
        reasonCode: status === 401 || status === 403
          ? "auth"
          : (status === 404 ? "fixed_legs_result_not_ready" : "fixed_legs_state_invalid"),
        error,
      };
    }

    if (actionId === "next") {
      if (resolved?.phase === "playing_leg_2") return { ok: true, idempotent: true, resolved };
      if (!resolved?.ok || resolved.phase !== "awaiting_leg_2_confirmation") {
        return { ok: false, reasonCode: resolved?.reasonCode || "fixed_legs_state_conflict", resolved };
      }
      const saveLeg1 = typeof deps.saveLeg1 === "function" ? deps.saveLeg1 : null;
      const next = typeof deps.next === "function" ? deps.next : null;
      if (!saveLeg1 || !next) return { ok: false, reasonCode: "fixed_legs_state_invalid", resolved };
      const saved = await saveLeg1(resolved);
      if (saved?.ok === false) return { ok: false, reasonCode: saved.reasonCode || "fixed_legs_state_conflict", message: saved.message, resolved };
      try {
        await next();
      } catch (error) {
        const afterFailure = await load().catch(() => null);
        if (afterFailure?.phase === "playing_leg_2") return { ok: true, idempotent: true, resolved: afterFailure };
        return { ok: false, reasonCode: getFixedLegsActionFailureReason(actionId, error, "fixed_legs_next_failed"), error, resolved: afterFailure || resolved };
      }
      return { ok: true, resolved };
    }

    if (actionId === "finish" || actionId === "recover" || actionId === "adopt") {
      const recoveryAllowed = actionId === "recover" && resolved?.recoveryAvailable;
      const canFinish = resolved?.phase === "awaiting_finish_confirmation" || recoveryAllowed;
      if (resolved?.phase !== "completed" && !canFinish) {
        return { ok: false, reasonCode: resolved?.reasonCode || "fixed_legs_result_not_ready", resolved };
      }
      if (resolved.phase !== "completed" && actionId !== "adopt") {
        const finish = typeof deps.finish === "function" ? deps.finish : null;
        if (!finish) return { ok: false, reasonCode: "fixed_legs_state_invalid", resolved };
        try {
          await finish();
        } catch (error) {
          const afterFailure = await load().catch(() => null);
          if (afterFailure?.phase !== "completed") {
            return { ok: false, reasonCode: getFixedLegsActionFailureReason(actionId, error, "fixed_legs_finish_failed"), error, resolved: afterFailure || resolved };
          }
          resolved = afterFailure;
        }
      }
      const saveResult = typeof deps.saveResult === "function" ? deps.saveResult : null;
      if (!saveResult) return { ok: false, reasonCode: "fixed_legs_state_invalid", resolved };
      const saved = await saveResult(resolved);
      if (saved?.ok === false) return { ok: false, reasonCode: saved.reasonCode || "fixed_legs_result_not_ready", message: saved.message, resolved };
      return { ok: true, idempotent: resolved.phase === "completed", resolved };
    }

    return { ok: false, reasonCode: "fixed_legs_state_invalid", resolved };
  }
