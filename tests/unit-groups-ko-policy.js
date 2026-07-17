  function groupsKoConfig(participantCount, overrides = {}) {
    return {
      name: "Groups KO Policy Test",
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
      enableThirdPlaceMatch: false,
      koDrawLocked: true,
      participants: participantList(participantCount, "GK"),
      groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_REQUIRE_EVEN,
      groupsKoOddParticipantAcknowledged: false,
      ...overrides,
    };
  }


  test("Groups KO analysis: 4 Teilnehmer ergeben zwei Zweiergruppen mit voller Qualifikation", () => {
    const analysis = analyzeGroupsKoParticipantDistribution(4);

    assertEqual(analysis.participantCount, 4);
    assertEqual(analysis.isOdd, false);
    assertEqual(analysis.groupASize, 2);
    assertEqual(analysis.groupBSize, 2);
    assertEqual(analysis.groupAMatchesPerPlayer, 1);
    assertEqual(analysis.groupBMatchesPerPlayer, 1);
    assertEqual(analysis.groupAQualificationRate, 1);
    assertEqual(analysis.groupBQualificationRate, 1);
    assertEqual(analysis.hasTwoPlayerGroup, true);
    assertEqual(analysis.hasFullyQualifiedGroup, true);
  });


  test("Groups KO analysis: 5 Teilnehmer zeigen 3/2-Verteilung und unterschiedliche Quoten", () => {
    const analysis = analyzeGroupsKoParticipantDistribution(5);

    assertEqual(analysis.groupASize, 3);
    assertEqual(analysis.groupBSize, 2);
    assertEqual(analysis.groupAMatchesPerPlayer, 2);
    assertEqual(analysis.groupBMatchesPerPlayer, 1);
    assertEqual(analysis.groupAQualificationRate, 2 / 3);
    assertEqual(analysis.groupBQualificationRate, 1);
    assertEqual(analysis.hasUnequalGroupSizes, true);
    assertEqual(analysis.hasUnequalQualificationRates, true);
    assertEqual(analysis.groupBAllQualify, true);
  });


  test("Groups KO analysis: 7 Teilnehmer zeigen unveraendert die deterministische 4/3-Verteilung", () => {
    const analysis = analyzeGroupsKoParticipantDistribution(7);

    assertEqual(analysis.groupASize, 4);
    assertEqual(analysis.groupBSize, 3);
    assertEqual(analysis.groupAMatchesPerPlayer, 3);
    assertEqual(analysis.groupBMatchesPerPlayer, 2);
    assertEqual(analysis.groupAQualificationRate, 1 / 2);
    assertEqual(analysis.groupBQualificationRate, 2 / 3);
    assertEqual(analysis.qualifiersPerGroup, 2);
  });


  test("Groups KO validation: gerade Teilnehmer sind mit Default-Policy erlaubt", () => {
    const config = groupsKoConfig(6);
    assertDeepEqual(validateCreateConfig(config), []);
    assertDeepEqual(validateCreateConfigDetails(config), []);
  });


  test("Groups KO validation: require_even blockiert ungerade Teilnehmer mit stabilem Code", () => {
    const details = validateCreateConfigDetails(groupsKoConfig(7));
    assertEqual(details.length, 1);
    assertEqual(details[0].reasonCode, "groups_ko_odd_participants_blocked");
    assert(validateCreateConfig(groupsKoConfig(7))[0].includes("gerade Teilnehmerzahl"));
  });


  test("Groups KO validation: allow_unequal erfordert bei ungerader Anzahl eine Bestaetigung", () => {
    const details = validateCreateConfigDetails(groupsKoConfig(7, {
      groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL,
    }));
    assertEqual(details.length, 1);
    assertEqual(details[0].reasonCode, "groups_ko_unequal_groups_not_acknowledged");
  });


  test("Groups KO validation: allow_unequal mit Bestaetigung erlaubt ungerade Teilnehmer", () => {
    const config = groupsKoConfig(7, {
      groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL,
      groupsKoOddParticipantAcknowledged: true,
    });
    assertDeepEqual(validateCreateConfigDetails(config), []);
    const tournament = createTournament(config);
    assertEqual(tournament.rules.groupsKoOddParticipantPolicy, GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL);
    assertEqual(tournament.rules.groupsKoOddParticipantAcknowledged, true);
  });


  test("Groups KO validation: andere Modi bleiben von der Policy unberuehrt", () => {
    const config = groupsKoConfig(5, {
      mode: "league",
      groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_REQUIRE_EVEN,
    });
    assertDeepEqual(validateCreateConfigDetails(config), []);
  });


  test("Groups KO creation: alternierende A/B-Zuordnung bleibt unveraendert", () => {
    const tournament = createTournament(groupsKoConfig(7, {
      groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL,
      groupsKoOddParticipantAcknowledged: true,
    }));
    assertDeepEqual(tournament.groups[0].participantIds, ["GK1", "GK3", "GK5", "GK7"]);
    assertDeepEqual(tournament.groups[1].participantIds, ["GK2", "GK4", "GK6"]);
  });


  test("Groups KO draft normalization: Default und ungueltige Policy werden sicher normalisiert", () => {
    const defaultDraft = normalizeCreateDraft(null);
    const invalidDraft = normalizeCreateDraft({
      mode: "groups_ko",
      groupsKoOddParticipantPolicy: "automatic",
      groupsKoOddParticipantAcknowledged: true,
    });
    assertEqual(defaultDraft.groupsKoOddParticipantPolicy, GROUPS_KO_ODD_PARTICIPANT_POLICY_REQUIRE_EVEN);
    assertEqual(defaultDraft.groupsKoOddParticipantAcknowledged, false);
    assertEqual(invalidDraft.groupsKoOddParticipantPolicy, GROUPS_KO_ODD_PARTICIPANT_POLICY_REQUIRE_EVEN);
    assertEqual(invalidDraft.groupsKoOddParticipantAcknowledged, true);
  });


  test("Groups KO migration: gerade Legacy-Turniere bleiben strukturell unveraendert", () => {
    const legacy = createTournament(groupsKoConfig(6));
    delete legacy.rules.groupsKoOddParticipantPolicy;
    delete legacy.rules.groupsKoOddParticipantAcknowledged;
    const groupsBefore = cloneSerializable(legacy.groups);
    const matchesBefore = cloneSerializable(legacy.matches);
    const normalized = normalizeTournament(cloneSerializable(legacy));

    assertEqual(normalized.rules.groupsKoOddParticipantPolicy, GROUPS_KO_ODD_PARTICIPANT_POLICY_REQUIRE_EVEN);
    assertEqual(normalized.rules.groupsKoOddParticipantAcknowledged, false);
    assertDeepEqual(normalized.groups, groupsBefore);
    assertDeepEqual(normalized.matches, matchesBefore);
  });


  test("Groups KO migration: ungerade Legacy-Turniere behalten Gruppen und Matches ohne erfundene Bestaetigung", () => {
    const legacy = createTournament(groupsKoConfig(7, {
      groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL,
      groupsKoOddParticipantAcknowledged: true,
    }));
    delete legacy.rules.groupsKoOddParticipantPolicy;
    delete legacy.rules.groupsKoOddParticipantAcknowledged;
    const groupsBefore = cloneSerializable(legacy.groups);
    const matchesBefore = cloneSerializable(legacy.matches);
    const normalized = normalizeTournament(cloneSerializable(legacy));

    assertEqual(normalized.rules.groupsKoOddParticipantPolicy, GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL);
    assertEqual(normalized.rules.groupsKoOddParticipantAcknowledged, false);
    assertDeepEqual(normalized.groups, groupsBefore);
    assertDeepEqual(normalized.matches, matchesBefore);
    assertEqual(getMatchesByStage(normalized, MATCH_STAGE_GROUP).length, 9);
  });


  test("Groups KO migration: gespeicherte ungleiche Gruppen sind auch bei gerader Gesamtzahl Legacy-Verhalten", () => {
    const legacy = createTournament(groupsKoConfig(6));
    legacy.groups[0].participantIds = ["GK1", "GK3", "GK5", "GK2"];
    legacy.groups[1].participantIds = ["GK4", "GK6"];
    delete legacy.rules.groupsKoOddParticipantPolicy;
    delete legacy.rules.groupsKoOddParticipantAcknowledged;
    const normalized = normalizeTournament(cloneSerializable(legacy));

    assertEqual(normalized.rules.groupsKoOddParticipantPolicy, GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL);
    assertEqual(normalized.rules.groupsKoOddParticipantAcknowledged, false);
    assertDeepEqual(normalized.groups, legacy.groups);
  });


  test("Groups KO persistence: Storage v5 und JSON-Roundtrip erhalten die Regeln", () => {
    const tournament = createTournament(groupsKoConfig(7, {
      groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL,
      groupsKoOddParticipantAcknowledged: true,
    }));
    const roundTripped = normalizeTournament(JSON.parse(JSON.stringify(tournament)));
    const migratedStore = migrateStorage({
      schemaVersion: 4,
      tournament: JSON.parse(JSON.stringify(tournament)),
    });

    assertEqual(roundTripped.rules.groupsKoOddParticipantPolicy, GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL);
    assertEqual(roundTripped.rules.groupsKoOddParticipantAcknowledged, true);
    assertEqual(migratedStore.schemaVersion, STORAGE_SCHEMA_VERSION);
    assertEqual(migratedStore.tournament.rules.groupsKoOddParticipantPolicy, GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL);
    assertEqual(migratedStore.tournament.rules.groupsKoOddParticipantAcknowledged, true);
  });
