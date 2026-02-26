// Auto-generated module split from dist source.
  function runSelfTests() {
    const results = [];
    const record = (name, ok, details = "") => {
      results.push({ name, ok: Boolean(ok), details: normalizeText(details || "") });
    };
    const participantList = (count, prefix = "P") => {
      const list = [];
      for (let i = 1; i <= count; i += 1) {
        list.push({ id: `${prefix}${i}`, name: `${prefix}${i}` });
      }
      return list;
    };

    try {
      const participants = participantList(9, "S");
      const ids = participants.map((item) => item.id);
      const seededMatches = buildKoMatchesV2(ids, KO_DRAW_MODE_SEEDED);
      const seededRoundOne = seededMatches.filter((match) => match.round === 1);
      const seededOpenRoundOne = seededRoundOne.filter((match) => match.player1Id && match.player2Id);
      record(
        "KO Seeded: 9 Teilnehmer -> genau 1 offenes R1-Match",
        seededOpenRoundOne.length === 1,
        `offene R1-Matches: ${seededOpenRoundOne.length}`,
      );
    } catch (error) {
      record("KO Seeded: 9 Teilnehmer -> genau 1 offenes R1-Match", false, String(error?.message || error));
    }

    try {
      const participants = participantList(9, "O");
      const ids = participants.map((item) => item.id);
      const openDrawMatches = buildKoMatchesV2(ids, KO_DRAW_MODE_OPEN_DRAW);
      const roundOne = openDrawMatches.filter((match) => match.round === 1);
      const slottedPlayers = roundOne.reduce((sum, match) => sum + (match.player1Id ? 1 : 0) + (match.player2Id ? 1 : 0), 0);
      record(
        "KO Open Draw: alle Teilnehmer korrekt in R1-Slots",
        slottedPlayers === participants.length,
        `R1-Slots belegt: ${slottedPlayers}/${participants.length}`,
      );
    } catch (error) {
      record("KO Open Draw: alle Teilnehmer korrekt in R1-Slots", false, String(error?.message || error));
    }

    try {
      const tournament = {
        id: "t1",
        name: "T1",
        mode: "league",
        ko: null,
        bestOfLegs: 3,
        startScore: 501,
        x01: buildPdcX01Settings(),
        rules: normalizeTournamentRules({ tieBreakMode: TIE_BREAK_MODE_DRA_STRICT }),
        participants: [
          { id: "A", name: "A" },
          { id: "B", name: "B" },
        ],
        groups: [],
        matches: [
          createMatch({
            id: "m1",
            stage: MATCH_STAGE_LEAGUE,
            round: 1,
            number: 1,
            player1Id: "A",
            player2Id: "B",
            status: STATUS_COMPLETED,
            winnerId: "A",
            legs: { p1: 2, p2: 1 },
          }),
        ],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const rows = standingsForMatches(tournament, tournament.matches);
      record(
        "DRA Strict: Direktvergleich bei 2 punktgleichen Spielern",
        rows[0]?.id === "A" && rows[0]?.tiebreakState === "resolved",
        rows.map((row) => `${row.id}:${row.points}/${row.tiebreakState}`).join(", "),
      );
    } catch (error) {
      record("DRA Strict: Direktvergleich bei 2 punktgleichen Spielern", false, String(error?.message || error));
    }

    try {
      const tournament = {
        id: "t2",
        name: "T2",
        mode: "groups_ko",
        ko: null,
        bestOfLegs: 3,
        startScore: 501,
        x01: buildPdcX01Settings(),
        rules: normalizeTournamentRules({ tieBreakMode: TIE_BREAK_MODE_DRA_STRICT }),
        participants: [
          { id: "A", name: "A" },
          { id: "B", name: "B" },
          { id: "C", name: "C" },
        ],
        groups: [],
        matches: [
          createMatch({ id: "m1", stage: MATCH_STAGE_GROUP, groupId: "A", round: 1, number: 1, player1Id: "A", player2Id: "B", status: STATUS_COMPLETED, winnerId: "A", legs: { p1: 2, p2: 1 } }),
          createMatch({ id: "m2", stage: MATCH_STAGE_GROUP, groupId: "A", round: 2, number: 1, player1Id: "B", player2Id: "C", status: STATUS_COMPLETED, winnerId: "B", legs: { p1: 2, p2: 1 } }),
          createMatch({ id: "m3", stage: MATCH_STAGE_GROUP, groupId: "A", round: 3, number: 1, player1Id: "C", player2Id: "A", status: STATUS_COMPLETED, winnerId: "C", legs: { p1: 2, p2: 1 } }),
        ],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const rows = standingsForMatches(tournament, tournament.matches, ["A", "B", "C"]);
      const blocked = rows.filter((row) => row.tiebreakState === "playoff_required").length;
      record(
        "DRA Strict: Deadlock -> Playoff erforderlich",
        blocked === 3,
        rows.map((row) => `${row.id}:${row.tiebreakState}`).join(", "),
      );
    } catch (error) {
      record("DRA Strict: Deadlock -> Playoff erforderlich", false, String(error?.message || error));
    }

    try {
      const tournament = {
        participants: [
          { id: "P1", name: "Sabine" },
          { id: "P2", name: "Tanja" },
        ],
      };
      const match = {
        player1Id: "P1",
        player2Id: "P2",
      };
      const apiStats = {
        winner: 1,
        players: [
          { name: "Sabine" },
          { name: "Tanja" },
        ],
        matchStats: [
          { legsWon: 1 },
          { legsWon: 0 },
        ],
      };
      const candidates = getApiMatchLegCandidatesFromStats(tournament, match, apiStats, "P2");
      const best = candidates[0] || { p1: -1, p2: -1 };
      record(
        "API Sync: vertauschte Legs-Reihenfolge wird korrigiert",
        best.p1 === 0 && best.p2 === 1,
        `best=${best.p1}:${best.p2}`,
      );
    } catch (error) {
      record("API Sync: vertauschte Legs-Reihenfolge wird korrigiert", false, String(error?.message || error));
    }

    try {
      const tournament = {
        participants: [
          { id: "P1", name: "Sabine" },
          { id: "P2", name: "Tanja" },
        ],
      };
      const match = {
        player1Id: "P1",
        player2Id: "P2",
      };
      const apiStats = {
        winner: 0,
        players: [
          { name: "Sabine" },
          { name: "Tanja" },
        ],
        matchStats: [
          { legsWon: 1, player: { name: "Tanja" } },
          { legsWon: 0, player: { name: "Sabine" } },
        ],
      };
      const winners = resolveWinnerIdCandidatesFromApiStats(tournament, match, apiStats, 0);
      record(
        "API Sync: Winner-Index aus matchStats wird bevorzugt",
        winners[0] === "P2",
        `first=${winners[0] || "-"}`,
      );
    } catch (error) {
      record("API Sync: Winner-Index aus matchStats wird bevorzugt", false, String(error?.message || error));
    }

    try {
      const tournament = {
        participants: [
          { id: "P1", name: "Tommy" },
          { id: "P2", name: "Hans" },
        ],
        matches: [
          createMatch({ id: "m1", stage: MATCH_STAGE_GROUP, round: 1, number: 1, player1Id: "P1", player2Id: "P2", status: STATUS_PENDING }),
          createMatch({ id: "m2", stage: MATCH_STAGE_KO, round: 2, number: 1, player1Id: "P1", player2Id: "P2", status: STATUS_PENDING }),
        ],
      };
      const apiStats = {
        players: [
          { name: "Tommy" },
          { name: "Hans" },
        ],
        matchStats: [
          { player: { name: "Tommy" }, legsWon: 1 },
          { player: { name: "Hans" }, legsWon: 0 },
        ],
      };
      const recovered = findOpenMatchCandidatesByApiStats(tournament, apiStats);
      record(
        "API Sync: Recovery erkennt mehrdeutige Match-Zuordnung",
        recovered.length === 2,
        `candidates=${recovered.length}`,
      );
    } catch (error) {
      record("API Sync: Recovery erkennt mehrdeutige Match-Zuordnung", false, String(error?.message || error));
    }

    try {
      const tournament = {
        participants: [
          { id: "P1", name: "Tanja Mueller" },
          { id: "P2", name: "Simon Stark" },
        ],
      };
      const ids = participantIdsByName(tournament, "TANJA");
      record(
        "History Import: Namens-Matching erkennt Teilnamen",
        ids.includes("P1"),
        `ids=${ids.join(",")}`,
      );
    } catch (error) {
      record("History Import: Namens-Matching erkennt Teilnamen", false, String(error?.message || error));
    }

    {
      const previousTournament = state.store.tournament;
      try {
        const tournament = {
          id: "history-test-lobby",
          name: "History",
          mode: "league",
          ko: null,
          bestOfLegs: 3,
          startScore: 501,
          x01: buildPdcX01Settings(),
          rules: normalizeTournamentRules({ tieBreakMode: TIE_BREAK_MODE_DRA_STRICT }),
          participants: [
            { id: "P1", name: "Tanja Mueller" },
            { id: "P2", name: "Simon Stark" },
          ],
          groups: [],
          matches: [
            createMatch({
              id: "m-history-lobby",
              stage: MATCH_STAGE_LEAGUE,
              round: 1,
              number: 1,
              player1Id: "P1",
              player2Id: "P2",
              meta: {
                auto: {
                  lobbyId: "lobby-history-1",
                  status: "started",
                },
              },
            }),
          ],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        state.store.tournament = tournament;
        const table = document.createElement("table");
        table.innerHTML = `
          <thead>
            <tr>
              <th>Stats</th>
              <td><span class="ad-ext-player-name"><p>TANJA</p></span></td>
              <td><span class="ad-ext-player-name"><p>SIMON</p></span><svg data-icon="trophy"></svg></td>
            </tr>
          </thead>
          <tbody>
            <tr><td>Gewonnene Legs</td><td>1</td><td>0</td></tr>
          </tbody>
        `;
        const outcome = importHistoryStatsTableResult("lobby-history-1", { table });
        const updated = findMatch(tournament, "m-history-lobby");
        record(
          "History Import: Lobby-Mapping priorisiert + Legs normalisiert",
          Boolean(outcome?.ok)
            && outcome.reasonCode === "completed"
            && updated?.status === STATUS_COMPLETED
            && updated?.winnerId === "P1"
            && updated?.legs?.p1 === 2
            && updated?.legs?.p2 === 0,
          `reason=${outcome?.reasonCode || "-"}, winner=${updated?.winnerId || "-"}, legs=${updated?.legs?.p1}:${updated?.legs?.p2}`,
        );
      } catch (error) {
        record("History Import: Lobby-Mapping priorisiert + Legs normalisiert", false, String(error?.message || error));
      } finally {
        state.store.tournament = previousTournament;
      }
    }

    {
      const previousTournament = state.store.tournament;
      try {
        const tournament = {
          id: "history-test-ambiguous",
          name: "History",
          mode: "league",
          ko: null,
          bestOfLegs: 1,
          startScore: 501,
          x01: buildPdcX01Settings(),
          rules: normalizeTournamentRules({ tieBreakMode: TIE_BREAK_MODE_DRA_STRICT }),
          participants: [
            { id: "P1", name: "Tommy" },
            { id: "P2", name: "Hans" },
          ],
          groups: [],
          matches: [
            createMatch({
              id: "m-history-a",
              stage: MATCH_STAGE_LEAGUE,
              round: 1,
              number: 1,
              player1Id: "P1",
              player2Id: "P2",
            }),
            createMatch({
              id: "m-history-b",
              stage: MATCH_STAGE_KO,
              round: 2,
              number: 1,
              player1Id: "P1",
              player2Id: "P2",
              meta: {
                auto: {
                  lobbyId: "lobby-history-2",
                  status: "started",
                },
              },
            }),
          ],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        state.store.tournament = tournament;
        const table = document.createElement("table");
        table.innerHTML = `
          <thead>
            <tr>
              <th>Stats</th>
              <td><span class="ad-ext-player-name"><p>TOMMY</p></span></td>
              <td><span class="ad-ext-player-name"><p>HANS</p></span></td>
            </tr>
          </thead>
          <tbody>
            <tr><td>Gewonnene Legs</td><td>1</td><td>0</td></tr>
          </tbody>
        `;
        const outcome = importHistoryStatsTableResult("lobby-history-2", { table });
        const matchA = findMatch(tournament, "m-history-a");
        const matchB = findMatch(tournament, "m-history-b");
        record(
          "History Import: bei Mehrdeutigkeit gewinnt verknüpfte Lobby",
          Boolean(outcome?.ok)
            && matchA?.status === STATUS_PENDING
            && matchB?.status === STATUS_COMPLETED
            && matchB?.winnerId === "P1",
          `reason=${outcome?.reasonCode || "-"}, A=${matchA?.status || "-"}, B=${matchB?.status || "-"}:${matchB?.winnerId || "-"}`,
        );
      } catch (error) {
        record("History Import: bei Mehrdeutigkeit gewinnt verknüpfte Lobby", false, String(error?.message || error));
      } finally {
        state.store.tournament = previousTournament;
      }
    }

    try {
      const rawStoreV2 = {
        schemaVersion: 2,
        settings: { debug: false, featureFlags: { autoLobbyStart: false, randomizeKoRound1: true } },
        ui: { activeTab: "tournament", matchesSortMode: MATCH_SORT_MODE_READY_FIRST },
        tournament: {
          id: "legacy",
          name: "Legacy",
          mode: "league",
          bestOfLegs: 3,
          startScore: 501,
          x01: buildPdcX01Settings(),
          participants: [{ id: "A", name: "A" }, { id: "B", name: "B" }],
          groups: [],
          matches: [],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
      };
      const migrated = migrateStorage(rawStoreV2);
      record(
        "Migration: v2 -> v3 setzt Tie-Break-Regeln",
        migrated.schemaVersion === 3 && migrated.tournament?.rules?.tieBreakMode === TIE_BREAK_MODE_DRA_STRICT,
        `schema=${migrated.schemaVersion}, mode=${migrated.tournament?.rules?.tieBreakMode}`,
      );
    } catch (error) {
      record("Migration: v2 -> v3 setzt Tie-Break-Regeln", false, String(error?.message || error));
    }

    const passed = results.filter((entry) => entry.ok).length;
    const failed = results.length - passed;
    return {
      ok: failed === 0,
      passed,
      failed,
      results,
      generatedAt: nowIso(),
      version: APP_VERSION,
    };
  }


  function setupRuntimeApi() {
    window[RUNTIME_GLOBAL_KEY] = {
      version: APP_VERSION,
      isReady: () => state.ready,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      runSelfTests,
    };

    addCleanup(() => {
      if (window[RUNTIME_GLOBAL_KEY]) {
        delete window[RUNTIME_GLOBAL_KEY];
      }
    });
  }


