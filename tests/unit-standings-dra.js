  test("Standings DRA: H2H- und Legacy-Profil liefern unterschiedliche Rangfolge", () => {
    const matches = [
      createMatch({ id: "m-ab", stage: MATCH_STAGE_LEAGUE, round: 1, number: 1, player1Id: "A", player2Id: "B", status: STATUS_COMPLETED, winnerId: "A", legs: { p1: 2, p2: 1 } }),
      createMatch({ id: "m-ac", stage: MATCH_STAGE_LEAGUE, round: 1, number: 2, player1Id: "A", player2Id: "C", status: STATUS_COMPLETED, winnerId: "A", legs: { p1: 2, p2: 1 } }),
      createMatch({ id: "m-ad", stage: MATCH_STAGE_LEAGUE, round: 1, number: 3, player1Id: "A", player2Id: "D", status: STATUS_COMPLETED, winnerId: "D", legs: { p1: 0, p2: 2 } }),
      createMatch({ id: "m-bc", stage: MATCH_STAGE_LEAGUE, round: 2, number: 1, player1Id: "B", player2Id: "C", status: STATUS_COMPLETED, winnerId: "B", legs: { p1: 2, p2: 0 } }),
      createMatch({ id: "m-bd", stage: MATCH_STAGE_LEAGUE, round: 2, number: 2, player1Id: "B", player2Id: "D", status: STATUS_COMPLETED, winnerId: "B", legs: { p1: 2, p2: 0 } }),
      createMatch({ id: "m-cd", stage: MATCH_STAGE_LEAGUE, round: 2, number: 3, player1Id: "C", player2Id: "D", status: STATUS_COMPLETED, winnerId: "C", legs: { p1: 2, p2: 1 } }),
    ];

    const h2hTournament = {
      id: "tb-h2h",
      name: "TB H2H",
      mode: "league",
      ko: null,
      bestOfLegs: 3,
      startScore: 501,
      x01: buildPresetX01Settings(X01_PRESET_PDC_501_DOUBLE_OUT_BASIC),
      rules: normalizeTournamentRules({ tieBreakProfile: TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE }),
      participants: participantList(4, "").map((entry, index) => ({ id: ["A", "B", "C", "D"][index], name: ["A", "B", "C", "D"][index] })),
      groups: [],
      matches: cloneSerializable(matches),
      results: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const legacyTournament = {
      ...h2hTournament,
      id: "tb-legacy",
      rules: normalizeTournamentRules({ tieBreakProfile: TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF }),
      matches: cloneSerializable(matches),
    };

    const h2hRows = standingsForMatches(h2hTournament, h2hTournament.matches);
    const legacyRows = standingsForMatches(legacyTournament, legacyTournament.matches);

    assertEqual(h2hRows[0].id, "A");
    assertEqual(legacyRows[0].id, "B");
  });


  test("Standings DRA: Deadlock wird als playoff_required markiert", () => {
    const tournament = {
      id: "deadlock",
      name: "Deadlock",
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
      results: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    const rows = standingsForMatches(tournament, tournament.matches, ["A", "B", "C"]);
    const blocked = rows.filter((row) => row.tiebreakState === "playoff_required");
    assertEqual(blocked.length, 3);
  });
