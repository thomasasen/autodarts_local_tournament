  test("Matchstart flow: bullMode fallback retries with 25/50 and completes", async () => {
    const createCalls = [];
    const addCalls = [];
    const startCalls = [];
    const debugSteps = [];

    const flow = await executeMatchStartApiFlow(
      {
        matchId: "m-fallback",
        token: "token-1",
        boardId: "board-1",
        participant1Name: "Alice",
        participant2Name: "Bob",
        lobbyPayload: {
          variant: X01_VARIANT,
          isPrivate: true,
          bullOffMode: "Normal",
          legs: 3,
          settings: {
            baseScore: 501,
            inMode: "Straight",
            outMode: "Double",
            maxRounds: 50,
            bullMode: "50/50",
          },
        },
      },
      {
        createLobby: async (payload) => {
          createCalls.push(cloneSerializable(payload));
          if (createCalls.length === 1) {
            const error = new Error("bull mode validation failed");
            error.status = 400;
            throw error;
          }
          return { id: "lobby-fallback-1" };
        },
        addLobbyPlayer: async (...args) => {
          addCalls.push(args);
          return {};
        },
        startLobby: async (...args) => {
          startCalls.push(args);
          return {};
        },
        deleteLobby: async () => {
          throw new Error("deleteLobby should not be called on success.");
        },
        extractErrorText: (error) => error?.message || "",
        onStep: (entry) => {
          debugSteps.push(entry);
        },
      },
    );

    assert(flow.ok, "Flow should succeed after bullMode fallback.");
    assertEqual(createCalls.length, 2, "createLobby should be retried once.");
    assertEqual(createCalls[0]?.settings?.bullMode, "50/50");
    assertEqual(createCalls[1]?.settings?.bullMode, "25/50");
    assertEqual(addCalls.length, 2, "Both players should be added.");
    assertEqual(startCalls.length, 1, "Lobby should be started exactly once.");
    assertEqual(flow.lobbyId, "lobby-fallback-1");
    assert(flow.usedBullModeFallback, "Fallback flag should be set.");
    assert(debugSteps.some((entry) => entry.step === "create_lobby_retry" && entry.status === "ok"));
  });


  test("Matchstart flow: deletes unstarted lobby when player add fails", async () => {
    const deleteCalls = [];
    const startCalls = [];

    const flow = await executeMatchStartApiFlow(
      {
        matchId: "m-cleanup",
        token: "token-2",
        boardId: "board-2",
        participant1Name: "Alice",
        participant2Name: "Bob",
        lobbyPayload: {
          variant: X01_VARIANT,
          isPrivate: true,
          bullOffMode: "Normal",
          legs: 3,
          settings: { bullMode: "25/50" },
        },
      },
      {
        createLobby: async () => ({ id: "lobby-cleanup-1" }),
        addLobbyPlayer: async (lobbyId, name) => {
          if (name === "Bob") {
            const error = new Error("Second player failed");
            error.status = 500;
            throw error;
          }
          return { lobbyId, name };
        },
        startLobby: async (...args) => {
          startCalls.push(args);
          return {};
        },
        deleteLobby: async (lobbyId, token) => {
          deleteCalls.push({ lobbyId, token });
          return {};
        },
        extractErrorText: (error) => error?.message || "",
      },
    );

    assert(!flow.ok, "Flow should fail if second player cannot be added.");
    assertEqual(flow.lobbyId, "lobby-cleanup-1");
    assertEqual(startCalls.length, 0, "startLobby must not run after add-player failure.");
    assert(flow.cleanup.attempted, "Cleanup should be attempted.");
    assert(flow.cleanup.ok, "Cleanup should succeed.");
    assertEqual(deleteCalls.length, 1, "deleteLobby should be called once.");
    assertEqual(deleteCalls[0]?.lobbyId, "lobby-cleanup-1");
  });


  test("Matchstart flow: skips cleanup after start request has been sent", async () => {
    const deleteCalls = [];

    const flow = await executeMatchStartApiFlow(
      {
        matchId: "m-no-cleanup",
        token: "token-3",
        boardId: "board-3",
        participant1Name: "Alice",
        participant2Name: "Bob",
        lobbyPayload: {
          variant: X01_VARIANT,
          isPrivate: true,
          bullOffMode: "Normal",
          legs: 3,
          settings: { bullMode: "25/50" },
        },
      },
      {
        createLobby: async () => ({ id: "lobby-start-error-1" }),
        addLobbyPlayer: async () => ({}),
        startLobby: async () => {
          const error = new Error("start request timed out");
          error.status = 504;
          throw error;
        },
        deleteLobby: async (lobbyId) => {
          deleteCalls.push(lobbyId);
          return {};
        },
        extractErrorText: (error) => error?.message || "",
      },
    );

    assert(!flow.ok, "Flow should fail on startLobby error.");
    assert(flow.startRequested, "startRequested should stay true after the request was sent.");
    assertEqual(deleteCalls.length, 0, "Cleanup must not delete a lobby after start request.");
    assertEqual(flow.cleanup.skippedReason, "start_already_requested");
  });


  test("Matchstart debug store: keeps newest sessions and supports clear/report", () => {
    const store = createDefaultStore();

    for (let index = 1; index <= MATCH_START_DEBUG_SESSION_LIMIT + 2; index += 1) {
      recordMatchStartDebugSession(
        store,
        finalizeMatchStartDebugSession(
          createMatchStartDebugSession({
            tournamentId: "t-debug",
            matchId: `m-${index}`,
          }),
          "success",
          {
            lobbyId: `l-${index}`,
            summary: { reasonCode: "started", seq: index },
          },
        ),
      );
    }

    const sessions = getMatchStartDebugSessions(store);
    const report = buildMatchStartDebugReport(store, { limit: 3 });

    assertEqual(sessions.length, MATCH_START_DEBUG_SESSION_LIMIT);
    assertEqual(sessions[0]?.matchId, "m-3");
    assertEqual(sessions[sessions.length - 1]?.matchId, `m-${MATCH_START_DEBUG_SESSION_LIMIT + 2}`);
    assertEqual(report.sessions.length, 3);
    assertEqual(report.sessions[0]?.matchId, `m-${MATCH_START_DEBUG_SESSION_LIMIT}`);
    assertEqual(report.sessions[2]?.matchId, `m-${MATCH_START_DEBUG_SESSION_LIMIT + 2}`);

    clearMatchStartDebugSessions(store);
    assertEqual(getMatchStartDebugSessions(store).length, 0);
  });
