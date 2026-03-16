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
      const presetChecks = validateCreatePresetDefinitions();
      const europeanTourPreset = getCreatePresetDefinition(X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL);
      record(
        "Preset-Schema: European Tour + Basic vollständig validiert",
        presetChecks.every((entry) => entry.ok)
          && europeanTourPreset?.apply?.bestOfLegs === 11
          && europeanTourPreset?.apply?.startScore === 501,
        presetChecks.map((entry) => `${entry.id}:${entry.ok ? "ok" : entry.issues.join("/")}`).join(", "),
      );
    } catch (error) {
      record("Preset-Schema: European Tour + Basic vollständig validiert", false, String(error?.message || error));
    }

    try {
      const compliant = isEuropeanTourOfficialMatchSetup({
        mode: "ko",
        bestOfLegs: 11,
        startScore: 501,
        x01InMode: "Straight",
        x01OutMode: "Double",
        x01BullMode: "25/50",
        x01MaxRounds: 50,
        x01BullOffMode: "Normal",
        lobbyVisibility: "private",
      });
      const wrongBestOf = isEuropeanTourOfficialMatchSetup({
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
      record(
        "Preset-Setup: European Tour Official erfordert KO + Best of 11 + 501/SI/DO",
        compliant && !wrongBestOf,
        `official=${compliant}, wrongBestOf=${wrongBestOf}`,
      );
    } catch (error) {
      record("Preset-Setup: European Tour Official erfordert KO + Best of 11 + 501/SI/DO", false, String(error?.message || error));
    }

    {
      const previousTournament = state.store.tournament;
      const previousDraft = cloneSerializable(state.store.ui?.createDraft);
      try {
        state.store.tournament = null;
        state.store.ui.createDraft = createDefaultCreateDraft(state.store.settings);
        renderShell();
        const createForm = state.shadowRoot?.getElementById("ata-create-form");
        const presetSelect = createForm?.querySelector("#ata-preset-select");
        if (!(createForm instanceof HTMLFormElement) || !(presetSelect instanceof HTMLSelectElement)) {
          throw new Error("Create form or preset select missing.");
        }
        presetSelect.value = X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL;
        applySelectedPresetToCreateForm(createForm);
        const europeanTourDraft = normalizeCreateDraft(readCreateDraftInput(new FormData(createForm)), state.store.settings);

        presetSelect.value = X01_PRESET_PDC_501_DOUBLE_OUT_BASIC;
        applySelectedPresetToCreateForm(createForm);
        const basicDraft = normalizeCreateDraft(readCreateDraftInput(new FormData(createForm)), state.store.settings);

        record(
          "Preset-UI: Auswahl + Anwenden setzt alle Formularfelder konsistent",
          europeanTourDraft.x01Preset === X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL
            && europeanTourDraft.mode === "ko"
            && europeanTourDraft.bestOfLegs === 11
            && basicDraft.x01Preset === X01_PRESET_PDC_501_DOUBLE_OUT_BASIC
            && basicDraft.bestOfLegs === 5
            && basicDraft.startScore === 501
            && basicDraft.x01OutMode === "Double",
          `et=${europeanTourDraft.bestOfLegs}/${europeanTourDraft.x01Preset}, basic=${basicDraft.bestOfLegs}/${basicDraft.x01Preset}`,
        );
      } catch (error) {
        record("Preset-UI: Auswahl + Anwenden setzt alle Formularfelder konsistent", false, String(error?.message || error));
      } finally {
        state.store.tournament = previousTournament;
        state.store.ui.createDraft = previousDraft || createDefaultCreateDraft(state.store.settings);
        renderShell();
      }
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
          && payload?.bullOffMode === "Official"
          && payload?.legs === 4
          && payload?.settings?.baseScore === 701
          && payload?.settings?.inMode === "Double"
          && payload?.settings?.outMode === "Master"
          && payload?.settings?.maxRounds === 20
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
        "Bull-off Off: Matchstart-Payload setzt top-level bullOffMode + bullMode",
        payload?.bullOffMode === "Off"
          && hasBullMode,
        `bullOffMode=${payload?.bullOffMode || "-"}, hasBullMode=${hasBullMode}`,
      );
    } catch (error) {
      record("Bull-off Off: Matchstart-Payload setzt top-level bullOffMode + bullMode", false, String(error?.message || error));
    }

    try {
      const retry = shouldRetryLobbyCreateWithBullModeFallback(
        { status: 400, message: "bull mode validation failed" },
        { settings: { bullMode: "50/50" } },
      );
      const noRetry = shouldRetryLobbyCreateWithBullModeFallback(
        { status: 400, message: "different validation failed" },
        { settings: { bullMode: "50/50" } },
      );
      record(
        "Matchstart-Helfer: bullMode-Fallback wird nur bei passendem 400er aktiviert",
        retry === true && noRetry === false,
        `retry=${retry}, noRetry=${noRetry}`,
      );
    } catch (error) {
      record("Matchstart-Helfer: bullMode-Fallback wird nur bei passendem 400er aktiviert", false, String(error?.message || error));
    }

    try {
      const cleanupBeforeStart = shouldCleanupFailedMatchStartLobby("lobby-debug-1", false);
      const cleanupAfterStartRequest = shouldCleanupFailedMatchStartLobby("lobby-debug-1", true);
      record(
        "Matchstart-Helfer: Lobby-Cleanup nur vor Start-Request",
        cleanupBeforeStart === true && cleanupAfterStartRequest === false,
        `before=${cleanupBeforeStart}, after=${cleanupAfterStartRequest}`,
      );
    } catch (error) {
      record("Matchstart-Helfer: Lobby-Cleanup nur vor Start-Request", false, String(error?.message || error));
    }

    try {
      const store = createDefaultStore();
      recordMatchStartDebugSession(store, finalizeMatchStartDebugSession(
        createMatchStartDebugSession({
          tournamentId: "dbg-t-1",
          matchId: "dbg-m-1",
        }),
        "success",
        {
          lobbyId: "dbg-lobby-1",
          summary: { reasonCode: "started", message: "ok" },
        },
      ));
      const report = buildMatchStartDebugReport(store, { limit: 3 });
      record(
        "Debug-Report: Runtime API-Daten sind strukturiert und begrenzt",
        report?.sessionCount === 1
          && Array.isArray(report?.sessions)
          && report.sessions[0]?.matchId === "dbg-m-1"
          && report.sessions[0]?.lobbyId === "dbg-lobby-1",
        `count=${report?.sessionCount || 0}, first=${report?.sessions?.[0]?.matchId || "-"}`,
      );
    } catch (error) {
      record("Debug-Report: Runtime API-Daten sind strukturiert und begrenzt", false, String(error?.message || error));
    }

    try {
      const tournament = createTournament({
        name: "DrawLockOn",
        mode: "ko",
        bestOfLegs: 3,
        startScore: 501,
        x01Preset: X01_PRESET_CUSTOM,
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
        name: "DrawLockOverride",
        mode: "ko",
        bestOfLegs: 3,
        startScore: 501,
        x01Preset: X01_PRESET_CUSTOM,
        x01InMode: "Straight",
        x01OutMode: "Double",
        x01BullMode: "25/50",
        x01MaxRounds: 50,
        x01BullOffMode: "Normal",
        lobbyVisibility: "private",
        randomizeKoRound1: false,
        koDrawLocked: true,
        participants: participantList(8, "DO"),
      });
      const blocked = applyTournamentKoDrawLocked(tournament, false);
      const confirmed = applyTournamentKoDrawLocked(tournament, false, { allowUnlockOverride: true });
      record(
        "Draw-Lock: Entsperren erfordert Override, mit Override erlaubt",
        blocked?.ok === false
          && blocked?.reasonCode === "draw_unlock_requires_override"
          && Boolean(confirmed?.ok && confirmed?.changed)
          && tournament?.ko?.drawLocked === false,
        `blocked=${blocked?.reasonCode || "-"}, confirmed=${Boolean(confirmed?.ok)}`,
      );
    } catch (error) {
      record("Draw-Lock: Entsperren erfordert Override, mit Override erlaubt", false, String(error?.message || error));
    }

    try {
      const tournament = createTournament({
        name: "DrawLockOff",
        mode: "ko",
        bestOfLegs: 3,
        startScore: 501,
        x01Preset: X01_PRESET_CUSTOM,
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
        x01: buildPresetX01Settings(X01_PRESET_PDC_501_DOUBLE_OUT_BASIC),
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
        name: "TieBreakLocked",
        mode: "league",
        bestOfLegs: 3,
        startScore: 501,
        x01Preset: X01_PRESET_CUSTOM,
        x01InMode: "Straight",
        x01OutMode: "Double",
        x01BullMode: "25/50",
        x01MaxRounds: 50,
        x01BullOffMode: "Normal",
        lobbyVisibility: "private",
        randomizeKoRound1: false,
        participants: participantList(4, "TL"),
      });
      const firstLeagueMatch = tournament.matches.find((match) => match.stage === MATCH_STAGE_LEAGUE);
      firstLeagueMatch.status = STATUS_COMPLETED;
      firstLeagueMatch.winnerId = firstLeagueMatch.player1Id;
      firstLeagueMatch.legs = { p1: 2, p2: 0 };
      const result = applyTournamentTieBreakProfile(tournament, TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF);
      record(
        "Tie-Break-Profil: nach erstem Ergebnis gesperrt",
        result?.ok === false
          && result?.reasonCode === "tie_break_locked"
          && tournament.rules.tieBreakProfile === TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE,
        `ok=${Boolean(result?.ok)}, reason=${result?.reasonCode || "-"}`,
      );
    } catch (error) {
      record("Tie-Break-Profil: nach erstem Ergebnis gesperrt", false, String(error?.message || error));
    }

    try {
      const tournament = createTournament({
        name: "GroupsKo",
        mode: "groups_ko",
        bestOfLegs: 3,
        startScore: 501,
        x01Preset: X01_PRESET_CUSTOM,
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
      const tournament = createTournament({
        name: "GroupsKoTieBreakLock",
        mode: "groups_ko",
        bestOfLegs: 3,
        startScore: 501,
        x01Preset: X01_PRESET_CUSTOM,
        x01InMode: "Straight",
        x01OutMode: "Double",
        x01BullMode: "25/50",
        x01MaxRounds: 50,
        x01BullOffMode: "Normal",
        lobbyVisibility: "private",
        randomizeKoRound1: false,
        participants: participantList(4, "GL"),
      });
      const firstGroupMatch = tournament.matches.find((match) => match.stage === MATCH_STAGE_GROUP);
      firstGroupMatch.status = STATUS_COMPLETED;
      firstGroupMatch.winnerId = firstGroupMatch.player1Id;
      firstGroupMatch.legs = { p1: 2, p2: 0 };
      refreshDerivedMatches(tournament);
      const beforeSemiState = JSON.stringify([
        findMatch(tournament, "ko-r1-m1")?.player1Id || null,
        findMatch(tournament, "ko-r1-m1")?.player2Id || null,
        findMatch(tournament, "ko-r1-m2")?.player1Id || null,
        findMatch(tournament, "ko-r1-m2")?.player2Id || null,
      ]);
      const blocked = applyTournamentTieBreakProfile(tournament, TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF);
      refreshDerivedMatches(tournament);
      const afterSemiState = JSON.stringify([
        findMatch(tournament, "ko-r1-m1")?.player1Id || null,
        findMatch(tournament, "ko-r1-m1")?.player2Id || null,
        findMatch(tournament, "ko-r1-m2")?.player1Id || null,
        findMatch(tournament, "ko-r1-m2")?.player2Id || null,
      ]);
      record(
        "Groups+KO: Tie-Break-Lock verhindert nachtraegliche KO-Neuzuordnung",
        blocked?.ok === false
          && blocked?.reasonCode === "tie_break_locked"
          && beforeSemiState === afterSemiState,
        `reason=${blocked?.reasonCode || "-"}, stable=${beforeSemiState === afterSemiState}`,
      );
    } catch (error) {
      record("Groups+KO: Tie-Break-Lock verhindert nachtraegliche KO-Neuzuordnung", false, String(error?.message || error));
    }

    try {
      const tournament = {
        id: "t2",
        name: "T2",
        mode: "groups_ko",
        ko: null,
        bestOfLegs: 3,
        startScore: 501,
        x01: buildPresetX01Settings(X01_PRESET_PDC_501_DOUBLE_OUT_BASIC),
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
      record(
        "Auto-Detect: Route-Guard nur fuer /matches/{id} und /lobbies/{id}",
        isAutoDetectMatchRoute("/matches/abc123")
          && isAutoDetectMatchRoute("/lobbies/abc123")
          && !isAutoDetectMatchRoute("/history/matches/abc123")
          && !isAutoDetectMatchRoute("/settings"),
        `match=${isAutoDetectMatchRoute("/matches/abc123")}, lobby=${isAutoDetectMatchRoute("/lobbies/abc123")}, history=${isAutoDetectMatchRoute("/history/matches/abc123")}`,
      );
    } catch (error) {
      record("Auto-Detect: Route-Guard nur fuer /matches/{id} und /lobbies/{id}", false, String(error?.message || error));
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
          x01: buildPresetX01Settings(X01_PRESET_PDC_501_DOUBLE_OUT_BASIC),
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
        const outcome = importHistoryStatsTableResult("lobby-history-1", { table, reasonCode: "ok" });
        const confirmationSignature = normalizeText(outcome?.confirm?.signature || "");
        const confirmed = importHistoryStatsTableResult("lobby-history-1", {
          table,
          reasonCode: "ok",
        }, {
          confirmationSignature,
        });
        const updated = findMatch(tournament, "m-history-lobby");
        record(
          "History Import: Legs-Abweichung fordert Bestätigung und speichert danach",
          outcome?.reasonCode === "requires_confirmation"
            && Boolean(confirmationSignature)
            && confirmed?.reasonCode === "completed"
            && updated?.status === STATUS_COMPLETED
            && updated?.winnerId === "P1"
            && updated?.legs?.p1 === 2
            && updated?.legs?.p2 === 0,
          `first=${outcome?.reasonCode || "-"}, second=${confirmed?.reasonCode || "-"}, winner=${updated?.winnerId || "-"}, legs=${updated?.legs?.p1}:${updated?.legs?.p2}`,
        );
      } catch (error) {
        record("History Import: Legs-Abweichung fordert Bestätigung und speichert danach", false, String(error?.message || error));
      } finally {
        state.store.tournament = previousTournament;
      }
    }

    {
      const previousTournament = state.store.tournament;
      try {
        const tournament = {
          id: "history-test-confirm-invalid",
          name: "History",
          mode: "league",
          ko: null,
          bestOfLegs: 3,
          startScore: 501,
          x01: buildPresetX01Settings(X01_PRESET_PDC_501_DOUBLE_OUT_BASIC),
          rules: normalizeTournamentRules({ tieBreakProfile: TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE }),
          participants: [
            { id: "P1", name: "Alex" },
            { id: "P2", name: "Ben" },
          ],
          groups: [],
          matches: [
            createMatch({
              id: "m-history-confirm-invalid",
              stage: MATCH_STAGE_LEAGUE,
              round: 1,
              number: 1,
              player1Id: "P1",
              player2Id: "P2",
              meta: {
                auto: {
                  lobbyId: "lobby-history-confirm-invalid",
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
              <td><span class="ad-ext-player-name"><p>ALEX</p></span></td>
              <td><span class="ad-ext-player-name"><p>BEN</p></span><svg data-icon="trophy"></svg></td>
            </tr>
          </thead>
          <tbody>
            <tr><td>Gewonnene Legs</td><td>1</td><td>0</td></tr>
          </tbody>
        `;
        const needsConfirm = importHistoryStatsTableResult("lobby-history-confirm-invalid", { table, reasonCode: "ok" });
        const invalidConfirm = importHistoryStatsTableResult("lobby-history-confirm-invalid", {
          table,
          reasonCode: "ok",
        }, {
          confirmationSignature: "invalid-signature",
        });
        const pendingMap = state.matchReturnShortcut.pendingConfirmationByLobby || {};
        const pending = pendingMap["lobby-history-confirm-invalid"];
        if (pending) {
          pending.expiresAt = Date.now() - 1000;
        }
        const expiredConfirm = importHistoryStatsTableResult("lobby-history-confirm-invalid", {
          table,
          reasonCode: "ok",
        }, {
          confirmationSignature: normalizeText(needsConfirm?.confirm?.signature || ""),
        });
        record(
          "History Import: falsche oder abgelaufene Bestätigung wird abgelehnt",
          needsConfirm?.reasonCode === "requires_confirmation"
            && invalidConfirm?.reasonCode === "confirmation_invalid"
            && expiredConfirm?.reasonCode === "confirmation_expired",
          `first=${needsConfirm?.reasonCode || "-"}, invalid=${invalidConfirm?.reasonCode || "-"}, expired=${expiredConfirm?.reasonCode || "-"}`,
        );
      } catch (error) {
        record("History Import: falsche oder abgelaufene Bestätigung wird abgelehnt", false, String(error?.message || error));
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
          x01: buildPresetX01Settings(X01_PRESET_PDC_501_DOUBLE_OUT_BASIC),
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
      const hostSandbox = document.createElement("div");
      hostSandbox.setAttribute("data-ata-selftest-host-sandbox", "1");
      hostSandbox.innerHTML = `
        <section class="chakra-card">
          <a href="/history/matches/lobby-host-check">Lobby</a>
          <table><tbody><tr><td>a</td></tr></tbody></table>
        </section>
        <section class="chakra-card">
          <a href="/history/matches/lobby-host-check">Lobby</a>
          <table><tbody><tr><td>b</td></tr></tbody></table>
        </section>
        <section>
          <table id="unlinked-fallback-table"><tbody><tr><td>fallback</td></tr></tbody></table>
        </section>
      `;
      document.body.appendChild(hostSandbox);
      const ambiguousHost = findHistoryImportHost("lobby-host-check");
      const missingHost = findHistoryImportHost("lobby-no-link");
      hostSandbox.remove();
      record(
        "History Import: Host-Erkennung lehnt mehrdeutige oder routenfremde Tabellen ab",
        ambiguousHost?.reasonCode === "history_host_ambiguous"
          && missingHost?.reasonCode === "history_host_not_found",
        `ambiguous=${ambiguousHost?.reasonCode || "-"}, missing=${missingHost?.reasonCode || "-"}`,
      );
    } catch (error) {
      record("History Import: Host-Erkennung lehnt mehrdeutige oder routenfremde Tabellen ab", false, String(error?.message || error));
    }

    try {
      const comparisonsOk = compareVersions("0.3.4", "0.3.3") > 0
        && compareVersions("0.3.3", "0.3.3") === 0
        && compareVersions("0.3.3-beta", "0.3.3") < 0;
      const parsed = parseUserscriptVersion(`// @version ${APP_VERSION}\n`);
      record(
        "Update-Check: Versionsvergleich und Header-Parsing arbeiten konsistent",
        comparisonsOk && parsed === APP_VERSION,
        `parsed=${parsed}, gt=${compareVersions("0.3.4", "0.3.3")}`,
      );
    } catch (error) {
      record("Update-Check: Versionsvergleich und Header-Parsing arbeiten konsistent", false, String(error?.message || error));
    }

    try {
      const storageMap = {
        [UPDATE_STATUS_STORAGE_KEY]: JSON.stringify({
          remoteVersion: "9.9.9",
          checkedAt: 1_770_301_234_567,
          sourceUrl: USERSCRIPT_UPDATE_URL,
          validators: {
            [USERSCRIPT_UPDATE_URL]: {
              remoteVersion: "9.9.9",
              etag: "\"ata-update\"",
              lastModified: "Tue, 02 Jan 2024 00:00:00 GMT",
            },
          },
        }),
      };
      const fakeWindow = {
        localStorage: {
          getItem(key) {
            return Object.prototype.hasOwnProperty.call(storageMap, key) ? storageMap[key] : null;
          },
          setItem(key, value) {
            storageMap[key] = String(value);
          },
        },
        fetch() {},
      };
      const status = readStoredUpdateStatus({
        windowRef: fakeWindow,
        installedVersion: APP_VERSION,
      });
      const resolved = createResolvedUpdateStatus({
        capable: true,
        installedVersion: APP_VERSION,
        remoteVersion: "9.9.9",
        checkedAt: 1_770_301_234_567,
        sourceUrl: USERSCRIPT_UPDATE_URL,
        validators: status.validators,
      });
      const requestUrl = new URL(buildCacheBustedUrl(USERSCRIPT_UPDATE_URL, 1_770_301_234_567));
      record(
        "Update-Check: gecachter Status und Cache-Bust-URL werden konsistent abgeleitet",
        status.capable === true
          && resolved.available === true
          && resolved.remoteVersion === "9.9.9"
          && requestUrl?.searchParams?.get(UPDATE_CACHE_BUST_PARAM) === "1770301234567"
          && status.validators?.[USERSCRIPT_UPDATE_URL]?.etag === "\"ata-update\"",
        `available=${resolved.available}, remote=${resolved.remoteVersion}, source=${status.sourceUrl || "-"}`,
      );
    } catch (error) {
      record("Update-Check: gecachter Status und Cache-Bust-URL werden konsistent abgeleitet", false, String(error?.message || error));
    }

    try {
      const bearer = extractAuthTokenFromAuthorizationHeader("Bearer test.token.value");
      const plain = extractAuthTokenFromAuthorizationHeader("test.token.value");
      const invalidBasic = extractAuthTokenFromAuthorizationHeader("Basic test.token.value");
      const invalidOtherScheme = extractAuthTokenFromAuthorizationHeader("Token test.token.value");
      record(
        "API Auth: Authorization-Header-Parser akzeptiert Bearer/plain und lehnt fremde Schemes ab",
        bearer === "test.token.value"
          && plain === "test.token.value"
          && invalidBasic === ""
          && invalidOtherScheme === "",
        `bearer=${Boolean(bearer)}, plain=${Boolean(plain)}, basicRejected=${invalidBasic === ""}, otherRejected=${invalidOtherScheme === ""}`,
      );
    } catch (error) {
      record("API Auth: Authorization-Header-Parser akzeptiert Bearer/plain und lehnt fremde Schemes ab", false, String(error?.message || error));
    }

    try {
      const previousToken = state.apiAutomation.authToken;
      const previousSource = state.apiAutomation.authTokenSource;
      const previousExpiry = state.apiAutomation.authTokenExpiresAt;
      try {
        cacheResolvedAuthToken("", "");
        const ignored = captureAuthTokenFromRequestHeaders(
          { Authorization: "Bearer ignored.token" },
          { requestUrl: "https://example.com/test", source: "selftest:ignored" },
        );
        const captured = captureAuthTokenFromRequestHeaders(
          { Authorization: "Bearer captured.token" },
          { requestUrl: `${API_GS_BASE}/lobbies`, source: "selftest:xhr" },
        );
        const snapshot = getAuthStateSnapshot();
        record(
          "API Auth: Header-Capture übernimmt nur api.autodarts.io und setzt Cache-Quelle",
          ignored === ""
            && captured === "captured.token"
            && snapshot.hasCachedToken === true
            && state.apiAutomation.authTokenSource === "selftest:xhr",
          `ignored=${Boolean(ignored)}, captured=${Boolean(captured)}, hasCache=${snapshot.hasCachedToken}, source=${state.apiAutomation.authTokenSource || "-"}`,
        );
      } finally {
        state.apiAutomation.authToken = previousToken || "";
        state.apiAutomation.authTokenSource = previousSource || "";
        state.apiAutomation.authTokenExpiresAt = Number(previousExpiry || 0);
      }
    } catch (error) {
      record("API Auth: Header-Capture übernimmt nur api.autodarts.io und setzt Cache-Quelle", false, String(error?.message || error));
    }

    try {
      const previousToken = state.apiAutomation.authToken;
      const previousSource = state.apiAutomation.authTokenSource;
      const previousExpiry = state.apiAutomation.authTokenExpiresAt;
      try {
        cacheResolvedAuthToken("", "");
        installRuntimeAuthHeaderCapture();
        window.dispatchEvent(new CustomEvent("ata:auth-header-captured", {
          detail: {
            token: "bridge.token.capture",
            source: "selftest:bridge",
            requestUrl: `${API_GS_BASE}/lobbies`,
          },
        }));
        const snapshot = getAuthStateSnapshot();
        record(
          "API Auth: Page-Bridge-Event wird als Runtime-Token übernommen",
          snapshot.hasCachedToken === true
            && state.apiAutomation.authTokenSource === "selftest:bridge",
          `hasCache=${snapshot.hasCachedToken}, source=${state.apiAutomation.authTokenSource || "-"}`,
        );
      } finally {
        state.apiAutomation.authToken = previousToken || "";
        state.apiAutomation.authTokenSource = previousSource || "";
        state.apiAutomation.authTokenExpiresAt = Number(previousExpiry || 0);
      }
    } catch (error) {
      record("API Auth: Page-Bridge-Event wird als Runtime-Token übernommen", false, String(error?.message || error));
    }

    try {
      const previousRefreshToken = localStorage.getItem("autodarts_refresh_token");
      const previousCachedToken = state.apiAutomation.authToken;
      const previousCachedExpiry = state.apiAutomation.authTokenExpiresAt;
      const previousCachedSource = state.apiAutomation.authTokenSource;
      try {
        localStorage.setItem("autodarts_refresh_token", "selftest-refresh-token");
        cacheResolvedAuthToken("", "");
        const snapshotWithRefresh = getAuthStateSnapshot();

        cacheResolvedAuthToken("header.payload.signature", "selftest", Date.now() + 120000);
        const snapshotWithCache = getAuthStateSnapshot();

        record(
          "API Auth: Snapshot erkennt Refresh-Token- und Cache-Kontext",
          snapshotWithRefresh.hasRefreshToken === true
            && snapshotWithRefresh.hasAnyAuthContext === true
            && snapshotWithCache.hasCachedToken === true
            && snapshotWithCache.cachedTokenUsable === true,
          `refresh=${snapshotWithRefresh.hasRefreshToken}, cache=${snapshotWithCache.hasCachedToken}, usable=${snapshotWithCache.cachedTokenUsable}`,
        );
      } finally {
        if (previousRefreshToken) {
          localStorage.setItem("autodarts_refresh_token", previousRefreshToken);
        } else {
          localStorage.removeItem("autodarts_refresh_token");
        }
        state.apiAutomation.authToken = previousCachedToken || "";
        state.apiAutomation.authTokenExpiresAt = Number(previousCachedExpiry || 0);
        state.apiAutomation.authTokenSource = previousCachedSource || "";
      }
    } catch (error) {
      record("API Auth: Snapshot erkennt Refresh-Token- und Cache-Kontext", false, String(error?.message || error));
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
          x01: buildPresetX01Settings(X01_PRESET_PDC_501_DOUBLE_OUT_BASIC),
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
          && migrated.settings?.tournamentTimeProfile === TOURNAMENT_TIME_PROFILE_NORMAL
          && migrated.settings?.featureFlags?.koDrawLockDefault === true,
        `schema=${migrated.schemaVersion}, profile=${migrated.tournament?.rules?.tieBreakProfile}`,
      );
    } catch (error) {
      record("Migration: v2 -> v4 setzt Tie-Break-Profil", false, String(error?.message || error));
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
