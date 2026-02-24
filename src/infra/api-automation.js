// Auto-generated module split from dist source.
  async function syncApiMatchResult(tournament, match, token, options = {}) {
    const notifyErrors = Boolean(options.notifyErrors);
    const notifyNotReady = Boolean(options.notifyNotReady);
    const includeErrorRetry = options.includeErrorRetry !== false;
    const auto = ensureMatchAutoMeta(match);
    const lobbyId = normalizeText(auto.lobbyId || "");
    if (!lobbyId) {
      return { ok: false, updated: false, completed: false, pending: true, message: "Keine Lobby-ID vorhanden." };
    }
    if (!includeErrorRetry && auto.status === "error") {
      return { ok: false, updated: false, completed: false, pending: true, message: "Match ist im Fehlerstatus." };
    }

    let updated = false;
    if (auto.status === "error") {
      auto.status = "started";
      auto.lastSyncAt = nowIso();
      match.updatedAt = nowIso();
      updated = true;
    }

    try {
      const stats = await fetchMatchStats(lobbyId, token);
      const syncTimestamp = nowIso();
      if (auto.lastError) {
        auto.lastError = null;
        auto.lastSyncAt = syncTimestamp;
        match.updatedAt = syncTimestamp;
        updated = true;
      } else if (!auto.lastSyncAt) {
        auto.lastSyncAt = syncTimestamp;
        match.updatedAt = syncTimestamp;
        updated = true;
      }

      const winnerIndex = Number(stats?.winner);
      if (!Number.isInteger(winnerIndex) || winnerIndex < 0) {
        auto.status = "started";
        if (!auto.lastSyncAt) {
          auto.lastSyncAt = syncTimestamp;
        }
        if (notifyNotReady) {
          setNotice("info", "API-Ergebnis ist noch nicht final verf\u00fcgbar.", 2200);
        }
        return {
          ok: true,
          updated,
          completed: false,
          pending: true,
          recoverable: true,
          message: "API-Ergebnis ist noch nicht final verf\u00fcgbar.",
        };
      }

      const winnerName = normalizeText(stats?.players?.[winnerIndex]?.name || "");
      const winnerId = resolveWinnerIdFromApiName(tournament, match, winnerName);
      if (!winnerId) {
        const mappingError = "Gewinner konnte nicht eindeutig zugeordnet werden.";
        const changedError = auto.lastError !== mappingError || auto.status !== "error";
        auto.status = "error";
        auto.lastError = mappingError;
        auto.lastSyncAt = syncTimestamp;
        match.updatedAt = syncTimestamp;
        updated = true;
        if (notifyErrors && changedError) {
          setNotice("error", `Auto-Sync Fehler bei ${match.id}: Gewinner nicht zuordenbar.`);
        }
        return { ok: false, updated, completed: false, pending: true, recoverable: false, message: mappingError };
      }

      const legCandidates = getApiMatchLegCandidatesFromStats(tournament, match, stats, winnerId);
      let result = { ok: false, message: "Auto-Sync konnte Ergebnis nicht speichern." };
      for (const legs of legCandidates) {
        result = updateMatchResult(match.id, winnerId, legs, "auto");
        if (result.ok) {
          break;
        }
      }
      if (!result.ok) {
        const saveError = result.message || "Auto-Sync konnte Ergebnis nicht speichern.";
        const changedError = auto.lastError !== saveError || auto.status !== "error";
        auto.status = "error";
        auto.lastError = saveError;
        auto.lastSyncAt = syncTimestamp;
        match.updatedAt = syncTimestamp;
        updated = true;
        if (notifyErrors && changedError) {
          setNotice("error", `Auto-Sync Fehler bei ${match.id}: ${saveError}`);
        }
        return { ok: false, updated, completed: false, pending: true, recoverable: false, message: saveError };
      }

      const updatedMatch = findMatch(tournament, match.id);
      if (updatedMatch) {
        const updatedAuto = ensureMatchAutoMeta(updatedMatch);
        const finishedAt = nowIso();
        updatedAuto.provider = API_PROVIDER;
        updatedAuto.status = "completed";
        updatedAuto.finishedAt = finishedAt;
        updatedAuto.lastSyncAt = finishedAt;
        updatedAuto.lastError = null;
        updatedMatch.updatedAt = finishedAt;
      }

      return { ok: true, updated: true, completed: true, pending: false, message: "Ergebnis \u00fcbernommen." };
    } catch (error) {
      const status = Number(error?.status || 0);
      if (status === 401 || status === 403) {
        return { ok: false, updated, completed: false, pending: true, authError: true, message: "Auth abgelaufen." };
      }
      if (status === 404) {
        return {
          ok: false,
          updated,
          completed: false,
          pending: true,
          recoverable: true,
          message: "Match-Stats noch nicht verf\u00fcgbar.",
        };
      }

      const errorMessage = normalizeText(error?.message || "API-Sync fehlgeschlagen.") || "API-Sync fehlgeschlagen.";
      const lastSyncAtMs = auto.lastSyncAt ? Date.parse(auto.lastSyncAt) : 0;
      const shouldPersistError = auto.lastError !== errorMessage
        || !Number.isFinite(lastSyncAtMs)
        || (Date.now() - lastSyncAtMs > API_AUTH_NOTICE_THROTTLE_MS);
      if (shouldPersistError) {
        auto.status = "error";
        auto.lastError = errorMessage;
        auto.lastSyncAt = nowIso();
        match.updatedAt = nowIso();
        updated = true;
      }
      if (notifyErrors && shouldPersistError) {
        setNotice("error", `Auto-Sync Fehler bei ${match.id}: ${errorMessage}`);
      }
      return { ok: false, updated, completed: false, pending: true, recoverable: false, message: errorMessage };
    }
  }


  async function syncResultForLobbyId(lobbyId, options = {}) {
    const targetLobbyId = normalizeText(lobbyId || "");
    const tournament = state.store.tournament;
    if (!targetLobbyId) {
      return { ok: false, message: "Keine Lobby-ID erkannt." };
    }
    if (!tournament) {
      return { ok: false, message: "Kein aktives Turnier vorhanden." };
    }
    if (!state.store.settings.featureFlags.autoLobbyStart) {
      return { ok: false, message: "Auto-Lobby ist deaktiviert." };
    }

    const openMatch = findTournamentMatchByLobbyId(tournament, targetLobbyId, false);
    const completedMatch = openMatch ? null : findTournamentMatchByLobbyId(tournament, targetLobbyId, true);
    if (!openMatch && completedMatch?.status === STATUS_COMPLETED) {
      return { ok: true, completed: true, message: "Ergebnis war bereits \u00fcbernommen." };
    }
    if (!openMatch) {
      return { ok: false, message: "Kein offenes Turnier-Match f\u00fcr diese Lobby gefunden." };
    }

    const token = getAuthTokenFromCookie();
    if (!token) {
      return { ok: false, message: "Kein Auth-Token gefunden. Bitte neu einloggen." };
    }

    const syncOutcome = await syncApiMatchResult(tournament, openMatch, token, {
      notifyErrors: Boolean(options.notifyErrors),
      notifyNotReady: Boolean(options.notifyNotReady),
      includeErrorRetry: true,
    });

    if (syncOutcome.authError) {
      state.apiAutomation.authBackoffUntil = Date.now() + API_AUTH_NOTICE_THROTTLE_MS;
      return { ok: false, message: "Auth abgelaufen. Bitte neu einloggen." };
    }

    if (syncOutcome.updated) {
      if (state.store.tournament) {
        state.store.tournament.updatedAt = nowIso();
      }
      schedulePersist();
      renderShell();
    }

    return syncOutcome;
  }


  function getDuplicateParticipantNames(tournament) {
    const seen = new Map();
    const duplicates = [];
    (tournament?.participants || []).forEach((participant) => {
      const key = normalizeLookup(participant?.name || "");
      if (!key) {
        return;
      }
      if (seen.has(key)) {
        duplicates.push(participant.name);
        return;
      }
      seen.set(key, participant.name);
    });
    return duplicates;
  }


  function findActiveStartedMatch(tournament, excludeMatchId = "") {
    if (!tournament) {
      return null;
    }
    return tournament.matches.find((match) => {
      if (excludeMatchId && match.id === excludeMatchId) {
        return false;
      }
      if (match.status !== STATUS_PENDING) {
        return false;
      }
      const auto = ensureMatchAutoMeta(match);
      return Boolean(auto.lobbyId && auto.status === "started");
    }) || null;
  }


  function buildLobbyCreatePayload(tournament) {
    const legsToWin = getLegsToWin(tournament.bestOfLegs);
    const x01Settings = normalizeTournamentX01Settings(tournament?.x01, tournament?.startScore);
    const settings = {
      baseScore: x01Settings.baseScore,
      inMode: x01Settings.inMode,
      outMode: x01Settings.outMode,
      maxRounds: x01Settings.maxRounds,
      bullOffMode: x01Settings.bullOffMode,
      // API expects a valid bullMode even when bull-off is "Off".
      bullMode: sanitizeX01BullMode(x01Settings.bullMode),
    };
    return {
      variant: x01Settings.variant,
      isPrivate: true,
      legs: legsToWin,
      settings,
    };
  }


  function openMatchPage(lobbyId) {
    if (!normalizeText(lobbyId)) {
      return;
    }
    window.location.href = `${window.location.origin}/matches/${encodeURIComponent(lobbyId)}`;
  }


  function resolveWinnerIdFromApiName(tournament, match, winnerName) {
    const normalizedWinner = normalizeLookup(winnerName);
    if (!normalizedWinner || !match?.player1Id || !match?.player2Id) {
      return "";
    }

    const p1 = participantById(tournament, match.player1Id);
    const p2 = participantById(tournament, match.player2Id);
    const p1Name = normalizeLookup(p1?.name || "");
    const p2Name = normalizeLookup(p2?.name || "");
    if (!p1Name || !p2Name || p1Name === p2Name) {
      return "";
    }
    if (p1Name === normalizedWinner) {
      return match.player1Id;
    }
    if (p2Name === normalizedWinner) {
      return match.player2Id;
    }
    return "";
  }


  function addApiLegCandidate(candidates, seenKeys, legs) {
    if (!legs || typeof legs !== "object") {
      return;
    }
    const p1 = clampInt(legs.p1, 0, 0, 50);
    const p2 = clampInt(legs.p2, 0, 0, 50);
    const key = `${p1}:${p2}`;
    if (seenKeys.has(key)) {
      return;
    }
    seenKeys.add(key);
    candidates.push({ p1, p2 });
  }


  function doesLegsSupportWinner(match, winnerId, legs) {
    if (!match || !legs) {
      return false;
    }
    const winnerIsP1 = winnerId === match.player1Id;
    const winnerIsP2 = winnerId === match.player2Id;
    if (!winnerIsP1 && !winnerIsP2) {
      return false;
    }
    const winnerLegs = winnerIsP1 ? legs.p1 : legs.p2;
    const loserLegs = winnerIsP1 ? legs.p2 : legs.p1;
    return winnerLegs > loserLegs;
  }


  function getApiNameToLegsLookup(data) {
    const lookup = new Map();
    const players = Array.isArray(data?.players) ? data.players : [];
    const matchStats = Array.isArray(data?.matchStats) ? data.matchStats : [];
    const count = Math.max(players.length, matchStats.length);
    for (let index = 0; index < count; index += 1) {
      const statEntry = matchStats[index];
      const legs = clampInt(statEntry?.legsWon, 0, 0, 50);
      const playerName = normalizeLookup(players[index]?.name || "");
      const statName = normalizeLookup(
        statEntry?.name
        || statEntry?.playerName
        || statEntry?.player?.name
        || statEntry?.player?.username
        || "",
      );
      if (playerName && !lookup.has(playerName)) {
        lookup.set(playerName, legs);
      }
      if (statName && !lookup.has(statName)) {
        lookup.set(statName, legs);
      }
    }
    return lookup;
  }


  function getApiMatchLegCandidatesFromStats(tournament, match, data, winnerId) {
    const candidates = [];
    const seen = new Set();
    const positional = {
      p1: clampInt(data?.matchStats?.[0]?.legsWon, 0, 0, 50),
      p2: clampInt(data?.matchStats?.[1]?.legsWon, 0, 0, 50),
    };
    addApiLegCandidate(candidates, seen, positional);
    addApiLegCandidate(candidates, seen, { p1: positional.p2, p2: positional.p1 });

    const p1 = participantById(tournament, match?.player1Id);
    const p2 = participantById(tournament, match?.player2Id);
    const p1Name = normalizeLookup(p1?.name || "");
    const p2Name = normalizeLookup(p2?.name || "");
    if (p1Name && p2Name && p1Name !== p2Name) {
      const nameToLegs = getApiNameToLegsLookup(data);
      if (nameToLegs.has(p1Name) && nameToLegs.has(p2Name)) {
        addApiLegCandidate(candidates, seen, {
          p1: nameToLegs.get(p1Name),
          p2: nameToLegs.get(p2Name),
        });
      }
    }

    const winnerIndex = Number(data?.winner);
    if (Number.isInteger(winnerIndex) && winnerIndex >= 0) {
      const winnerLegs = clampInt(data?.matchStats?.[winnerIndex]?.legsWon, 0, 0, 50);
      const loserIndex = winnerIndex === 0 ? 1 : 0;
      const loserLegs = clampInt(data?.matchStats?.[loserIndex]?.legsWon, 0, 0, 50);
      if (winnerId === match?.player1Id) {
        addApiLegCandidate(candidates, seen, { p1: winnerLegs, p2: loserLegs });
      } else if (winnerId === match?.player2Id) {
        addApiLegCandidate(candidates, seen, { p1: loserLegs, p2: winnerLegs });
      }
    }

    if (!candidates.length) {
      return [positional];
    }

    const preferred = [];
    const fallback = [];
    candidates.forEach((candidate) => {
      if (doesLegsSupportWinner(match, winnerId, candidate)) {
        preferred.push(candidate);
      } else {
        fallback.push(candidate);
      }
    });
    return preferred.concat(fallback);
  }


  function getApiMatchStartUi(tournament, match, activeStartedMatch) {
    const auto = ensureMatchAutoMeta(match);
    if (auto.lobbyId) {
      return {
        label: "Zum Match",
        disabled: false,
        title: "\u00d6ffnet das bereits gestartete Match.",
      };
    }

    if (!state.store.settings.featureFlags.autoLobbyStart) {
      return {
        label: "Match starten",
        disabled: true,
        title: "Feature-Flag in Einstellungen aktivieren.",
      };
    }

    const editability = getMatchEditability(tournament, match);
    if (!editability.editable) {
      return {
        label: "Match starten",
        disabled: true,
        title: editability.reason || "Match kann aktuell nicht gestartet werden.",
      };
    }

    if (!getAuthTokenFromCookie()) {
      return {
        label: "Match starten",
        disabled: true,
        title: "Kein Auth-Token vorhanden. Bitte einloggen.",
      };
    }

    const boardId = getBoardId();
    if (!isValidBoardId(boardId)) {
      return {
        label: "Match starten",
        disabled: true,
        title: boardId
          ? `Board-ID ung\u00fcltig (${boardId}). Bitte Board in einer manuellen Lobby w\u00e4hlen.`
          : "Kein Board aktiv. Bitte einmal manuell eine Lobby \u00f6ffnen und Board w\u00e4hlen.",
      };
    }

    if (activeStartedMatch && activeStartedMatch.id !== match.id) {
      return {
        label: "Match starten",
        disabled: true,
        title: "Es l\u00e4uft bereits ein aktives Match.",
      };
    }

    if (state.apiAutomation.startingMatchId && state.apiAutomation.startingMatchId !== match.id) {
      return {
        label: "Match starten",
        disabled: true,
        title: "Ein anderer Matchstart l\u00e4uft bereits.",
      };
    }

    if (state.apiAutomation.startingMatchId === match.id) {
      return {
        label: "Startet...",
        disabled: true,
        title: "Lobby wird erstellt.",
      };
    }

    return {
      label: "Match starten",
      disabled: false,
      title: "Erstellt Lobby, f\u00fcgt Spieler hinzu und startet automatisch.",
    };
  }


  function getApiMatchStatusText(match) {
    if (isByeMatchResult(match)) {
      return "Freilos (Bye): kein API-Sync erforderlich";
    }
    const auto = ensureMatchAutoMeta(match);
    if (auto.status === "completed") {
      return "API-Sync: abgeschlossen";
    }
    if (auto.status === "started" && auto.lobbyId) {
      return `API-Sync: aktiv (Lobby ${auto.lobbyId})`;
    }
    if (auto.status === "error") {
      return `API-Sync: Fehler${auto.lastError ? ` (${auto.lastError})` : ""}`;
    }
    return "API-Sync: nicht gestartet";
  }


  async function handleStartMatch(matchId) {
    const tournament = state.store.tournament;
    if (!tournament) {
      return;
    }

    const match = findMatch(tournament, matchId);
    if (!match) {
      setNotice("error", "Match nicht gefunden.");
      return;
    }

    const auto = ensureMatchAutoMeta(match);
    if (auto.lobbyId) {
      openMatchPage(auto.lobbyId);
      return;
    }

    if (!state.store.settings.featureFlags.autoLobbyStart) {
      setNotice("info", "Auto-Lobby ist deaktiviert. Bitte im Tab Einstellungen aktivieren.");
      return;
    }

    const editability = getMatchEditability(tournament, match);
    if (!editability.editable) {
      setNotice("error", editability.reason || "Match kann aktuell nicht gestartet werden.");
      return;
    }

    const duplicates = getDuplicateParticipantNames(tournament);
    if (duplicates.length) {
      setNotice("error", "F\u00fcr Auto-Sync m\u00fcssen Teilnehmernamen eindeutig sein.");
      return;
    }

    const activeMatch = findActiveStartedMatch(tournament, match.id);
    if (activeMatch) {
      const activeAuto = ensureMatchAutoMeta(activeMatch);
      setNotice("info", "Es l\u00e4uft bereits ein aktives Match. Weiterleitung dorthin.");
      if (activeAuto.lobbyId) {
        openMatchPage(activeAuto.lobbyId);
      }
      return;
    }

    const token = getAuthTokenFromCookie();
    if (!token) {
      setNotice("error", "Kein Autodarts-Token gefunden. Bitte einloggen und Seite neu laden.");
      return;
    }

    const boardId = getBoardId();
    if (!boardId) {
      setNotice("error", "Board-ID fehlt. Bitte einmal manuell eine Lobby \u00f6ffnen und Board ausw\u00e4hlen.");
      return;
    }
    if (!isValidBoardId(boardId)) {
      setNotice("error", `Board-ID ist ung\u00fcltig (${boardId}). Bitte in einer manuellen Lobby ein echtes Board ausw\u00e4hlen.`);
      return;
    }

    const participant1 = participantById(tournament, match.player1Id);
    const participant2 = participantById(tournament, match.player2Id);
    if (!participant1 || !participant2) {
      setNotice("error", "Teilnehmerzuordnung im Match ist unvollst\u00e4ndig.");
      return;
    }

    let createdLobbyId = "";
    state.apiAutomation.startingMatchId = match.id;
    renderShell();

    try {
      const lobby = await createLobby(buildLobbyCreatePayload(tournament), token);
      createdLobbyId = normalizeText(lobby?.id || lobby?.uuid || "");
      if (!createdLobbyId) {
        throw createApiError(0, "Lobby konnte nicht erstellt werden (keine Lobby-ID).", lobby);
      }

      await addLobbyPlayer(createdLobbyId, participant1.name, boardId, token);
      await addLobbyPlayer(createdLobbyId, participant2.name, boardId, token);
      await startLobby(createdLobbyId, token);

      const now = nowIso();
      auto.provider = API_PROVIDER;
      auto.lobbyId = createdLobbyId;
      auto.status = "started";
      auto.startedAt = auto.startedAt || now;
      auto.finishedAt = null;
      auto.lastSyncAt = now;
      auto.lastError = null;
      match.updatedAt = now;
      tournament.updatedAt = now;

      try {
        await persistStore();
      } catch (persistError) {
        schedulePersist();
        logWarn("storage", "Immediate persist before match redirect failed; scheduled retry.", persistError);
      }
      renderShell();
      setNotice("success", "Match gestartet. Weiterleitung ins Match.");
      openMatchPage(createdLobbyId);
    } catch (error) {
      const message = normalizeText(error?.message || apiBodyToErrorText(error?.body) || "Unbekannter API-Fehler.") || "Unbekannter API-Fehler.";
      const now = nowIso();
      auto.provider = API_PROVIDER;
      auto.lobbyId = createdLobbyId || auto.lobbyId || null;
      auto.status = "error";
      auto.lastError = message;
      auto.lastSyncAt = now;
      match.updatedAt = now;
      tournament.updatedAt = now;
      schedulePersist();
      renderShell();
      setNotice("error", `Matchstart fehlgeschlagen: ${message}`);
      logWarn("api", "Match start failed.", error);
    } finally {
      state.apiAutomation.startingMatchId = "";
      renderShell();
    }
  }


  async function syncPendingApiMatches() {
    if (state.apiAutomation.syncing) {
      return;
    }
    if (!state.store.settings.featureFlags.autoLobbyStart) {
      return;
    }
    if (Date.now() < state.apiAutomation.authBackoffUntil) {
      return;
    }

    const tournament = state.store.tournament;
    if (!tournament) {
      return;
    }

    const syncTargets = tournament.matches.filter((match) => {
      return isApiSyncCandidateMatch(match, true);
    });

    if (!syncTargets.length) {
      return;
    }

    const token = getAuthTokenFromCookie();
    if (!token) {
      state.apiAutomation.authBackoffUntil = Date.now() + API_AUTH_NOTICE_THROTTLE_MS;
      if (shouldShowAuthNotice()) {
        setNotice("error", "Auto-Sync pausiert: kein Auth-Token gefunden. Bitte neu einloggen.");
      }
      return;
    }

    state.apiAutomation.syncing = true;
    let hasMetaUpdates = false;

    try {
      for (const match of syncTargets) {
        const syncOutcome = await syncApiMatchResult(tournament, match, token, {
          notifyErrors: false,
          notifyNotReady: false,
          includeErrorRetry: true,
        });

        if (syncOutcome.authError) {
          state.apiAutomation.authBackoffUntil = Date.now() + API_AUTH_NOTICE_THROTTLE_MS;
          if (shouldShowAuthNotice()) {
            setNotice("error", "Auto-Sync pausiert: Auth abgelaufen. Bitte neu einloggen.");
          }
          logWarn("api", "Auto-sync auth error.");
          return;
        }

        if (syncOutcome.updated) {
          hasMetaUpdates = true;
        }

        if (!syncOutcome.ok && syncOutcome.message && !syncOutcome.recoverable) {
          logWarn("api", `Auto-sync failed for ${match.id}: ${syncOutcome.message}`);
        }
      }
    } finally {
      state.apiAutomation.syncing = false;
      if (hasMetaUpdates) {
        if (state.store.tournament) {
          state.store.tournament.updatedAt = nowIso();
        }
        schedulePersist();
        renderShell();
      }
    }
  }

  // Presentation layer: UI rendering and interaction wiring.

