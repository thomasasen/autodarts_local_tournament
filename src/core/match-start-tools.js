// Auto-generated module split from dist source.
  const MATCH_START_DEBUG_SESSION_LIMIT = 12;
  const MATCH_START_DEBUG_STEP_LIMIT = 48;
  const MATCH_START_DEBUG_REPORT_SESSION_LIMIT = 5;


  function createDefaultDebugData() {
    return {
      matchStartSessions: [],
    };
  }


  function cloneDebugValue(value, fallbackValue = null) {
    const cloned = cloneSerializable(value);
    if (cloned === null && value !== null && value !== undefined) {
      return fallbackValue;
    }
    return cloned;
  }


  function normalizeMatchStartCleanup(rawCleanup) {
    const cleanup = rawCleanup && typeof rawCleanup === "object" ? rawCleanup : {};
    return {
      attempted: Boolean(cleanup.attempted),
      ok: Boolean(cleanup.ok),
      skippedReason: normalizeText(cleanup.skippedReason || ""),
      message: normalizeText(cleanup.message || ""),
      error: cloneDebugValue(cleanup.error, null),
    };
  }


  function normalizeMatchStartDebugStep(rawStep) {
    const step = rawStep && typeof rawStep === "object" ? rawStep : {};
    return {
      at: normalizeText(step.at || nowIso()) || nowIso(),
      step: normalizeText(step.step || "unknown") || "unknown",
      status: normalizeText(step.status || "info") || "info",
      details: cloneDebugValue(step.details, {}),
    };
  }


  function normalizeMatchStartDebugSession(rawSession) {
    const session = rawSession && typeof rawSession === "object" ? rawSession : {};
    const steps = Array.isArray(session.steps)
      ? session.steps.map((entry) => normalizeMatchStartDebugStep(entry)).slice(-MATCH_START_DEBUG_STEP_LIMIT)
      : [];
    return {
      id: normalizeText(session.id || uuid("matchstart-debug")) || uuid("matchstart-debug"),
      kind: "match_start",
      startedAt: normalizeText(session.startedAt || nowIso()) || nowIso(),
      finishedAt: normalizeText(session.finishedAt || "") || null,
      outcome: normalizeText(session.outcome || "running") || "running",
      matchId: normalizeText(session.matchId || ""),
      tournamentId: normalizeText(session.tournamentId || ""),
      lobbyId: normalizeText(session.lobbyId || "") || null,
      context: cloneDebugValue(session.context, {}) || {},
      summary: cloneDebugValue(session.summary, {}) || {},
      payload: cloneDebugValue(session.payload, null),
      cleanup: normalizeMatchStartCleanup(session.cleanup),
      steps,
    };
  }


  function normalizeDebugData(rawDebugData) {
    const debugData = rawDebugData && typeof rawDebugData === "object" ? rawDebugData : {};
    const matchStartSessions = Array.isArray(debugData.matchStartSessions)
      ? debugData.matchStartSessions.map((entry) => normalizeMatchStartDebugSession(entry)).slice(-MATCH_START_DEBUG_SESSION_LIMIT)
      : [];
    return {
      matchStartSessions,
    };
  }


  function createMatchStartDebugSession(context = {}) {
    return normalizeMatchStartDebugSession({
      id: uuid("matchstart-debug"),
      startedAt: nowIso(),
      finishedAt: null,
      outcome: "running",
      matchId: normalizeText(context.matchId || ""),
      tournamentId: normalizeText(context.tournamentId || ""),
      lobbyId: normalizeText(context.lobbyId || "") || null,
      context: cloneDebugValue(context, {}) || {},
      summary: {},
      payload: null,
      cleanup: normalizeMatchStartCleanup(null),
      steps: [],
    });
  }


  function appendMatchStartDebugStep(session, step, status, details = null) {
    if (!session || typeof session !== "object") {
      return session;
    }
    if (!Array.isArray(session.steps)) {
      session.steps = [];
    }
    session.steps.push(normalizeMatchStartDebugStep({
      at: nowIso(),
      step,
      status,
      details,
    }));
    if (session.steps.length > MATCH_START_DEBUG_STEP_LIMIT) {
      session.steps = session.steps.slice(-MATCH_START_DEBUG_STEP_LIMIT);
    }
    return session;
  }


  function finalizeMatchStartDebugSession(session, outcome, details = {}) {
    if (!session || typeof session !== "object") {
      return normalizeMatchStartDebugSession({
        outcome,
        summary: cloneDebugValue(details, {}),
      });
    }

    session.finishedAt = nowIso();
    session.outcome = normalizeText(outcome || session.outcome || "completed") || "completed";
    if (Object.prototype.hasOwnProperty.call(details, "lobbyId")) {
      session.lobbyId = normalizeText(details.lobbyId || "") || null;
    }
    if (Object.prototype.hasOwnProperty.call(details, "payload")) {
      session.payload = cloneDebugValue(details.payload, null);
    }
    if (Object.prototype.hasOwnProperty.call(details, "summary")) {
      session.summary = cloneDebugValue(details.summary, {}) || {};
    }
    if (Object.prototype.hasOwnProperty.call(details, "cleanup")) {
      session.cleanup = normalizeMatchStartCleanup(details.cleanup);
    }
    return normalizeMatchStartDebugSession(session);
  }


  function recordMatchStartDebugSession(store, session) {
    if (!store || typeof store !== "object" || !session) {
      return null;
    }
    const debugData = normalizeDebugData(store.debugData);
    const normalizedSession = normalizeMatchStartDebugSession(session);
    debugData.matchStartSessions.push(normalizedSession);
    debugData.matchStartSessions = debugData.matchStartSessions.slice(-MATCH_START_DEBUG_SESSION_LIMIT);
    store.debugData = debugData;
    return normalizedSession;
  }


  function clearMatchStartDebugSessions(store) {
    if (!store || typeof store !== "object") {
      return;
    }
    store.debugData = createDefaultDebugData();
  }


  function getMatchStartDebugSessions(store) {
    return normalizeDebugData(store?.debugData).matchStartSessions;
  }


  function buildMatchStartDebugReport(store, options = {}) {
    const limit = clampInt(
      options.limit,
      MATCH_START_DEBUG_REPORT_SESSION_LIMIT,
      1,
      MATCH_START_DEBUG_SESSION_LIMIT,
    );
    const sessions = getMatchStartDebugSessions(store);
    return {
      appVersion: APP_VERSION,
      generatedAt: nowIso(),
      debugEnabled: Boolean(store?.settings?.debug),
      sessionCount: sessions.length,
      tournament: store?.tournament
        ? {
          id: normalizeText(store.tournament.id || ""),
          name: normalizeText(store.tournament.name || ""),
          mode: normalizeText(store.tournament.mode || ""),
          bestOfLegs: Number(store.tournament.bestOfLegs || 0),
          startScore: Number(store.tournament.startScore || 0),
          matchCount: Array.isArray(store.tournament.matches) ? store.tournament.matches.length : 0,
        }
        : null,
      sessions: cloneDebugValue(sessions.slice(-limit), []) || [],
    };
  }


  function serializeMatchStartError(error, extractErrorText = null) {
    const fallbackText = typeof extractErrorText === "function"
      ? normalizeText(extractErrorText(error))
      : "";
    const message = normalizeText(error?.message || fallbackText || "Unbekannter API-Fehler.") || "Unbekannter API-Fehler.";
    return {
      name: normalizeText(error?.name || ""),
      status: Number(error?.status || 0),
      message,
      body: cloneDebugValue(error?.body, null),
    };
  }


  function shouldRetryLobbyCreateWithBullModeFallback(error, payload, extractErrorText = null) {
    const status = Number(error?.status || 0);
    const fallbackText = typeof extractErrorText === "function"
      ? extractErrorText(error)
      : normalizeText(error?.message || "");
    const errorText = normalizeLookup(fallbackText || error?.message || "");
    const selectedBullMode = normalizeText(payload?.settings?.bullMode || "");
    return status === 400 && errorText.includes("bull mode") && selectedBullMode !== "25/50";
  }


  function shouldCleanupFailedMatchStartLobby(lobbyId, startRequested) {
    return Boolean(normalizeText(lobbyId || "")) && !Boolean(startRequested);
  }


  async function createLobbyWithBullModeFallback(lobbyPayload, token, deps = {}) {
    const createLobbyFn = typeof deps.createLobby === "function" ? deps.createLobby : null;
    if (!createLobbyFn) {
      throw new Error("createLobby fehlt.");
    }
    const extractErrorText = typeof deps.extractErrorText === "function"
      ? deps.extractErrorText
      : ((error) => normalizeText(error?.message || ""));
    const emitStep = typeof deps.onStep === "function" ? deps.onStep : null;
    let effectivePayload = cloneDebugValue(lobbyPayload, {}) || {};

    try {
      emitStep?.({
        step: "create_lobby",
        status: "pending",
        details: { payload: effectivePayload },
      });
      const lobby = await createLobbyFn(effectivePayload, token);
      emitStep?.({
        step: "create_lobby",
        status: "ok",
        details: { payload: effectivePayload },
      });
      return {
        lobby,
        payload: effectivePayload,
        usedBullModeFallback: false,
      };
    } catch (error) {
      const errorInfo = serializeMatchStartError(error, extractErrorText);
      const shouldRetry = shouldRetryLobbyCreateWithBullModeFallback(error, effectivePayload, extractErrorText);
      emitStep?.({
        step: "create_lobby",
        status: "error",
        details: {
          error: errorInfo,
          retryingBullModeFallback: shouldRetry,
        },
      });
      if (!shouldRetry) {
        throw error;
      }

      effectivePayload = cloneDebugValue(effectivePayload, {}) || {};
      if (!effectivePayload.settings || typeof effectivePayload.settings !== "object") {
        effectivePayload.settings = {};
      }
      effectivePayload.settings.bullMode = "25/50";
      emitStep?.({
        step: "create_lobby_retry",
        status: "pending",
        details: { payload: effectivePayload, reason: "bull_mode_fallback_25_50" },
      });
      const lobby = await createLobbyFn(effectivePayload, token);
      emitStep?.({
        step: "create_lobby_retry",
        status: "ok",
        details: { payload: effectivePayload, reason: "bull_mode_fallback_25_50" },
      });
      return {
        lobby,
        payload: effectivePayload,
        usedBullModeFallback: true,
      };
    }
  }


  async function executeMatchStartApiFlow(input, deps = {}) {
    const createLobbyFn = typeof deps.createLobby === "function" ? deps.createLobby : null;
    const addLobbyPlayerFn = typeof deps.addLobbyPlayer === "function" ? deps.addLobbyPlayer : null;
    const startLobbyFn = typeof deps.startLobby === "function" ? deps.startLobby : null;
    if (!createLobbyFn || !addLobbyPlayerFn || !startLobbyFn) {
      throw new Error("Matchstart-Flow benötigt createLobby, addLobbyPlayer und startLobby.");
    }

    const deleteLobbyFn = typeof deps.deleteLobby === "function" ? deps.deleteLobby : null;
    const extractErrorText = typeof deps.extractErrorText === "function"
      ? deps.extractErrorText
      : ((error) => normalizeText(error?.message || ""));
    const emitStep = typeof deps.onStep === "function" ? deps.onStep : null;
    const boardId = normalizeText(input?.boardId || "");
    const token = normalizeText(input?.token || "");
    const player1Name = normalizeText(input?.participant1Name || "");
    const player2Name = normalizeText(input?.participant2Name || "");
    let createdLobbyId = "";
    let startRequested = false;
    let usedBullModeFallback = false;
    let effectivePayload = cloneDebugValue(input?.lobbyPayload, {}) || {};

    emitStep?.({
      step: "request_init",
      status: "info",
      details: {
        matchId: normalizeText(input?.matchId || ""),
        boardId,
        participant1Name: player1Name,
        participant2Name: player2Name,
        payload: effectivePayload,
      },
    });

    try {
      const createOutcome = await createLobbyWithBullModeFallback(effectivePayload, token, {
        createLobby: createLobbyFn,
        extractErrorText,
        onStep: emitStep,
      });
      effectivePayload = cloneDebugValue(createOutcome.payload, {}) || {};
      usedBullModeFallback = Boolean(createOutcome.usedBullModeFallback);
      createdLobbyId = normalizeText(createOutcome?.lobby?.id || createOutcome?.lobby?.uuid || "");
      if (!createdLobbyId) {
        throw new Error("Lobby konnte nicht erstellt werden (keine Lobby-ID).");
      }

      emitStep?.({
        step: "lobby_created",
        status: "ok",
        details: {
          lobbyId: createdLobbyId,
          usedBullModeFallback,
        },
      });

      emitStep?.({
        step: "add_player_1",
        status: "pending",
        details: {
          lobbyId: createdLobbyId,
          name: player1Name,
          boardId,
        },
      });
      await addLobbyPlayerFn(createdLobbyId, player1Name, boardId, token);
      emitStep?.({
        step: "add_player_1",
        status: "ok",
        details: {
          lobbyId: createdLobbyId,
          name: player1Name,
          boardId,
        },
      });

      emitStep?.({
        step: "add_player_2",
        status: "pending",
        details: {
          lobbyId: createdLobbyId,
          name: player2Name,
          boardId,
        },
      });
      await addLobbyPlayerFn(createdLobbyId, player2Name, boardId, token);
      emitStep?.({
        step: "add_player_2",
        status: "ok",
        details: {
          lobbyId: createdLobbyId,
          name: player2Name,
          boardId,
        },
      });

      emitStep?.({
        step: "start_lobby",
        status: "pending",
        details: { lobbyId: createdLobbyId },
      });
      startRequested = true;
      await startLobbyFn(createdLobbyId, token);
      emitStep?.({
        step: "start_lobby",
        status: "ok",
        details: { lobbyId: createdLobbyId },
      });

      return {
        ok: true,
        lobbyId: createdLobbyId,
        effectivePayload,
        usedBullModeFallback,
        startRequested: true,
        cleanup: normalizeMatchStartCleanup(null),
        error: null,
      };
    } catch (error) {
      const cleanup = normalizeMatchStartCleanup(null);
      if (shouldCleanupFailedMatchStartLobby(createdLobbyId, startRequested) && deleteLobbyFn) {
        cleanup.attempted = true;
        emitStep?.({
          step: "cleanup_lobby",
          status: "pending",
          details: { lobbyId: createdLobbyId },
        });
        try {
          await deleteLobbyFn(createdLobbyId, token);
          cleanup.ok = true;
          cleanup.message = "Ungestartete Lobby wurde bereinigt.";
          emitStep?.({
            step: "cleanup_lobby",
            status: "ok",
            details: {
              lobbyId: createdLobbyId,
              message: cleanup.message,
            },
          });
        } catch (cleanupError) {
          cleanup.ok = false;
          cleanup.message = normalizeText(extractErrorText(cleanupError) || cleanupError?.message || "Lobby-Cleanup fehlgeschlagen.")
            || "Lobby-Cleanup fehlgeschlagen.";
          cleanup.error = serializeMatchStartError(cleanupError, extractErrorText);
          emitStep?.({
            step: "cleanup_lobby",
            status: "error",
            details: {
              lobbyId: createdLobbyId,
              error: cleanup.error,
            },
          });
        }
      } else {
        cleanup.skippedReason = !createdLobbyId
          ? "no_lobby_created"
          : (startRequested ? "start_already_requested" : "delete_lobby_unavailable");
        emitStep?.({
          step: "cleanup_lobby",
          status: "skipped",
          details: {
            lobbyId: createdLobbyId || null,
            skippedReason: cleanup.skippedReason,
          },
        });
      }

      emitStep?.({
        step: "flow_error",
        status: "error",
        details: {
          lobbyId: createdLobbyId || null,
          error: serializeMatchStartError(error, extractErrorText),
          cleanup,
        },
      });

      return {
        ok: false,
        lobbyId: createdLobbyId || null,
        effectivePayload,
        usedBullModeFallback,
        startRequested,
        cleanup,
        error,
      };
    }
  }
