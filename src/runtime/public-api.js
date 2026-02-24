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


