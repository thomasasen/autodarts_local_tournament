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
      const seededOpenRoundOne = seededRoundOne.filter((match) => match.player1Id && match.player2Id && !isByeMatchResult(match));
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
      const repeatedOpenDrawMatches = buildKoMatchesV2(ids, KO_DRAW_MODE_OPEN_DRAW);
      const toSignature = (matches) => matches
        .map((match) => `${match.id}:${match.player1Id || "-"}:${match.player2Id || "-"}:${isByeMatchResult(match) ? "bye" : "match"}`)
        .join("|");
      const deterministic = toSignature(openDrawMatches) === toSignature(repeatedOpenDrawMatches);
      const byeCount = openDrawMatches.filter((match) => isByeMatchResult(match)).length;
      record(
        "KO Open Draw: deterministisch mit expliziten Byes",
        deterministic && byeCount > 0,
        `matches=${openDrawMatches.length}, byes=${byeCount}, deterministic=${deterministic}`,
      );
    } catch (error) {
      record("KO Open Draw: deterministisch mit expliziten Byes", false, String(error?.message || error));
    }

    try {
      const participants = participantList(6, "K6");
      const structure = buildBracketStructure(participants, generateSeeds(participants, KO_DRAW_MODE_SEEDED));
      const matches = buildKoMatchesFromStructure(structure);
      const expectedTotalMatches = structure.rounds.reduce((sum, roundDef) => sum + roundDef.virtualMatches.length, 0);
      const byeCount = matches.filter((match) => isByeMatchResult(match)).length;
      record(
        "KO 6: vollständiger 8er-Baum mit 2 Byes",
        matches.length === expectedTotalMatches && expectedTotalMatches === 7 && byeCount === 2,
        `matches=${matches.length}, expected=${expectedTotalMatches}, byes=${byeCount}`,
      );
    } catch (error) {
      record("KO 6: vollständiger 8er-Baum mit 2 Byes", false, String(error?.message || error));
    }

    try {
      const participants = participantList(8, "K8");
      const structure = buildBracketStructure(participants, generateSeeds(participants, KO_DRAW_MODE_SEEDED));
      const matches = buildKoMatchesFromStructure(structure);
      const byeCount = matches.filter((match) => isByeMatchResult(match)).length;
      record(
        "KO 8: 7 Match-Knoten von Start an vorhanden",
        matches.length === 7 && byeCount === 0,
        `matches=${matches.length}, byes=${byeCount}`,
      );
    } catch (error) {
      record("KO 8: 7 Match-Knoten von Start an vorhanden", false, String(error?.message || error));
    }

    try {
      const compliant = isPdcCompliantMatchSetup({
        mode: "ko",
        bestOfLegs: 5,
        startScore: 501,
        x01InMode: "Straight",
        x01OutMode: "Double",
        x01BullMode: "25/50",
        x01MaxRounds: 50,
        x01BullOffMode: "Normal",
        lobbyVisibility: "private",
      });
      const notCompliantBestOfOne = isPdcCompliantMatchSetup({
        mode: "ko",
        bestOfLegs: 1,
        startScore: 501,
        x01InMode: "Straight",
        x01OutMode: "Double",
        x01BullMode: "25/50",
        x01MaxRounds: 50,
        x01BullOffMode: "Normal",
        lobbyVisibility: "private",
      });
      record(
        "PDC-Setup: KO + Best of >=3 + PDC-X01 erforderlich",
        compliant && !notCompliantBestOfOne,
        `compliant=${compliant}, bo1=${notCompliantBestOfOne}`,
      );
    } catch (error) {
      record("PDC-Setup: KO + Best of >=3 + PDC-X01 erforderlich", false, String(error?.message || error));
    }

    try {
      const tournament = createTournament({
        name: "PayloadMapping",
        mode: "league",
        bestOfLegs: 7,
        startScore: 701,
        x01Preset: X01_PRESET_CUSTOM,
        x01InMode: "Double",
        x01OutMode: "Master",
        x01BullMode: "50/50",
        x01MaxRounds: 20,
        x01BullOffMode: "Official",
        lobbyVisibility: "private",
        randomizeKoRound1: false,
        participants: participantList(2, "PM"),
      });
      const payload = buildLobbyCreatePayload(tournament);
      record(
        "Turnieranlage -> Matchstart-Payload übernimmt X01 + Best-of konsistent",
        payload?.variant === X01_VARIANT
          && payload?.isPrivate === true
          && payload?.legs === 4
          && payload?.settings?.baseScore === 701
          && payload?.settings?.inMode === "Double"
          && payload?.settings?.outMode === "Master"
          && payload?.settings?.maxRounds === 20
          && payload?.settings?.bullOffMode === "Official"
          && payload?.settings?.bullOff === "Official"
          && payload?.settings?.bullMode === "50/50",
        `legs=${payload?.legs}, settings=${JSON.stringify(payload?.settings || {})}`,
      );
    } catch (error) {
      record("Turnieranlage -> Matchstart-Payload übernimmt X01 + Best-of konsistent", false, String(error?.message || error));
    }

    try {
      const tournament = createTournament({
        name: "BullOffOff",
        mode: "league",
        bestOfLegs: 5,
        startScore: 501,
        x01Preset: X01_PRESET_CUSTOM,
        x01InMode: "Straight",
        x01OutMode: "Double",
        x01BullMode: "50/50",
        x01MaxRounds: 50,
        x01BullOffMode: "Off",
        lobbyVisibility: "private",
        randomizeKoRound1: false,
        participants: participantList(2, "BO"),
      });
      const payload = buildLobbyCreatePayload(tournament);
      const hasBullMode = Object.prototype.hasOwnProperty.call(payload?.settings || {}, "bullMode");
      record(
        "Bull-off Off: Matchstart-Payload führt beide Bull-off Keys + bullMode",
        payload?.settings?.bullOffMode === "Off"
          && payload?.settings?.bullOff === "Off"
          && hasBullMode,
        `bullOffMode=${payload?.settings?.bullOffMode || "-"}, bullOff=${payload?.settings?.bullOff || "-"}, hasBullMode=${hasBullMode}`,
      );
    } catch (error) {
      record("Bull-off Off: Matchstart-Payload führt beide Bull-off Keys + bullMode", false, String(error?.message || error));
    }

    try {
      const tournament = createTournament({
        name: "DrawLockOn",
        mode: "ko",
        bestOfLegs: 3,
        startScore: 501,
        x01Preset: X01_PRESET_PDC_STANDARD,
        x01InMode: "Straight",
        x01OutMode: "Double",
        x01BullMode: "25/50",
        x01MaxRounds: 50,
        x01BullOffMode: "Normal",
        lobbyVisibility: "private",
        randomizeKoRound1: false,
        koDrawLocked: true,
        participants: participantList(8, "DL"),
      });
      const before = JSON.stringify(tournament.ko?.rounds || []);
      tournament.participants = tournament.participants.slice().reverse();
      refreshDerivedMatches(tournament);
      const after = JSON.stringify(tournament.ko?.rounds || []);
      record(
        "Draw-Lock aktiv: KO-Struktur bleibt stabil",
        before === after,
        `stable=${before === after}`,
      );
    } catch (error) {
      record("Draw-Lock aktiv: KO-Struktur bleibt stabil", false, String(error?.message || error));
    }

    try {
      const tournament = createTournament({
        name: "DrawLockOff",
        mode: "ko",
        bestOfLegs: 3,
        startScore: 501,
        x01Preset: X01_PRESET_PDC_STANDARD,
        x01InMode: "Straight",
        x01OutMode: "Double",
        x01BullMode: "25/50",
        x01MaxRounds: 50,
        x01BullOffMode: "Normal",
        lobbyVisibility: "private",
        randomizeKoRound1: false,
        koDrawLocked: false,
        participants: participantList(8, "DU"),
      });
      const before = JSON.stringify(tournament.ko?.rounds || []);
      tournament.participants = tournament.participants.slice().reverse();
      refreshDerivedMatches(tournament);
      const after = JSON.stringify(tournament.ko?.rounds || []);
      record(
        "Draw-Lock aus: KO-Struktur kann neu aufgebaut werden",
        before !== after,
        `changed=${before !== after}`,
      );
    } catch (error) {
      record("Draw-Lock aus: KO-Struktur kann neu aufgebaut werden", false, String(error?.message || error));
    }

    try {
      const matches = [
        createMatch({ id: "m-ab", stage: MATCH_STAGE_LEAGUE, round: 1, number: 1, player1Id: "A", player2Id: "B", status: STATUS_COMPLETED, winnerId: "A", legs: { p1: 2, p2: 1 } }),
        createMatch({ id: "m-ac", stage: MATCH_STAGE_LEAGUE, round: 1, number: 2, player1Id: "A", player2Id: "C", status: STATUS_COMPLETED, winnerId: "A", legs: { p1: 2, p2: 1 } }),
        createMatch({ id: "m-ad", stage: MATCH_STAGE_LEAGUE, round: 1, number: 3, player1Id: "A", player2Id: "D", status: STATUS_COMPLETED, winnerId: "D", legs: { p1: 0, p2: 2 } }),
        createMatch({ id: "m-bc", stage: MATCH_STAGE_LEAGUE, round: 2, number: 1, player1Id: "B", player2Id: "C", status: STATUS_COMPLETED, winnerId: "B", legs: { p1: 2, p2: 0 } }),
        createMatch({ id: "m-bd", stage: MATCH_STAGE_LEAGUE, round: 2, number: 2, player1Id: "B", player2Id: "D", status: STATUS_COMPLETED, winnerId: "B", legs: { p1: 2, p2: 0 } }),
        createMatch({ id: "m-cd", stage: MATCH_STAGE_LEAGUE, round: 2, number: 3, player1Id: "C", player2Id: "D", status: STATUS_COMPLETED, winnerId: "C", legs: { p1: 2, p2: 1 } }),
      ];

      const h2hTournament = {
        id: "tb1",
        name: "TB1",
        mode: "league",
        ko: null,
        bestOfLegs: 3,
        startScore: 501,
        x01: buildPdcX01Settings(),
        rules: normalizeTournamentRules({ tieBreakProfile: TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE }),
        participants: [
          { id: "A", name: "A" },
          { id: "B", name: "B" },
          { id: "C", name: "C" },
          { id: "D", name: "D" },
        ],
        groups: [],
        matches: cloneSerializable(matches),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const pointsLegDiffTournament = {
        ...h2hTournament,
        id: "tb2",
        rules: normalizeTournamentRules({ tieBreakProfile: TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF }),
        matches: cloneSerializable(matches),
      };
      const h2hRows = standingsForMatches(h2hTournament, h2hTournament.matches);
      const legacyRows = standingsForMatches(pointsLegDiffTournament, pointsLegDiffTournament.matches);
      record(
        "Tie-Break-Profile: H2H und Punkte+LegDiff liefern unterschiedliche Reihenfolge",
        h2hRows[0]?.id === "A" && legacyRows[0]?.id === "B",
        `h2h=${h2hRows[0]?.id || "-"}, legacy=${legacyRows[0]?.id || "-"}`,
      );
    } catch (error) {
      record("Tie-Break-Profile: H2H und Punkte+LegDiff liefern unterschiedliche Reihenfolge", false, String(error?.message || error));
    }

    try {
      const tournament = createTournament({
        name: "GroupsKo",
        mode: "groups_ko",
        bestOfLegs: 3,
        startScore: 501,
        x01Preset: X01_PRESET_PDC_STANDARD,
        x01InMode: "Straight",
        x01OutMode: "Double",
        x01BullMode: "25/50",
        x01MaxRounds: 50,
        x01BullOffMode: "Normal",
        lobbyVisibility: "private",
        randomizeKoRound1: false,
        participants: participantList(4, "G"),
      });
      const groupA = findMatch(tournament, "group-A-r1-m1");
      const groupB = findMatch(tournament, "group-B-r1-m1");
      groupA.status = STATUS_COMPLETED;
      groupA.winnerId = groupA.player1Id;
      groupA.legs = { p1: 2, p2: 0 };
      groupB.status = STATUS_COMPLETED;
      groupB.winnerId = groupB.player1Id;
      groupB.legs = { p1: 2, p2: 1 };
      refreshDerivedMatches(tournament);

      const semi1 = findMatch(tournament, "ko-r1-m1");
      const semi2 = findMatch(tournament, "ko-r1-m2");
      semi1.status = STATUS_COMPLETED;
      semi1.winnerId = semi1.player1Id;
      semi1.legs = { p1: 2, p2: 0 };
      semi2.status = STATUS_COMPLETED;
      semi2.winnerId = semi2.player1Id;
      semi2.legs = { p1: 2, p2: 1 };
      refreshDerivedMatches(tournament);

      const final = findMatch(tournament, "ko-r2-m1");
      record(
        "Groups+KO Regression: Finale wird korrekt aus Semis belegt",
        Boolean(final?.player1Id && final?.player2Id),
        `final=${final?.player1Id || "-"}:${final?.player2Id || "-"}`,
      );
    } catch (error) {
      record("Groups+KO Regression: Finale wird korrekt aus Semis belegt", false, String(error?.message || error));
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
        rules: normalizeTournamentRules({ tieBreakProfile: TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE }),
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
        "Promoter H2H: Deadlock -> Playoff erforderlich",
        blocked === 3,
        rows.map((row) => `${row.id}:${row.tiebreakState}`).join(", "),
      );
    } catch (error) {
      record("Promoter H2H: Deadlock -> Playoff erforderlich", false, String(error?.message || error));
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
          rules: normalizeTournamentRules({ tieBreakProfile: TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE }),
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
          rules: normalizeTournamentRules({ tieBreakProfile: TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE }),
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
        "Migration: v2 -> v4 setzt Tie-Break-Profil",
        migrated.schemaVersion === 4
          && migrated.tournament?.rules?.tieBreakProfile === TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE
          && migrated.settings?.featureFlags?.koDrawLockDefault === true,
        `schema=${migrated.schemaVersion}, profile=${migrated.tournament?.rules?.tieBreakProfile}`,
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


