  function createHelpParticipantText(count, prefix = "P") {
    return Array.from({ length: count }, (_, index) => prefix + (index + 1)).join("\n");
  }


  function assertCreateHelpTopicComplete(model, topicId) {
    assert(Boolean(model), topicId + ": Modell fehlt.");
    assert(Boolean(model.currentSelection), topicId + ": aktuelle Auswahl fehlt.");
    assert(model.effects.length > 0, topicId + ": Auswirkungen fehlen.");
    assert(model.examples.length > 0, topicId + ": Beispiele fehlen.");
    assert(model.tips.length > 0, topicId + ": Tipps fehlen.");
    assert(model.dependencies.length > 0, topicId + ": Abhängigkeiten fehlen.");
    assert(model.limitations.length > 0, topicId + ": Einschränkungen fehlen.");
    assert(Boolean(model.classification?.label), topicId + ": Herkunft fehlt.");
    assert(Boolean(model.compliance?.status), topicId + ": Compliance-Status fehlt.");
    assert(Boolean(model.compliance?.label), topicId + ": Compliance-Label fehlt.");
    assert(Boolean(model.compliance?.description), topicId + ": Compliance-Beschreibung fehlt.");
    assert(model.sources.length > 0, topicId + ": Quellen fehlen.");
  }


  test("Create-Hilfe Release 5: Katalog enthält elf vollständige Themen und sichere eindeutige Quellen", () => {
    const validation = validateCreateHelpTopicCatalog();
    assert(validation.ok, validation.issues.join(" | "));
    assertDeepEqual(validation.topicIds, CREATE_HELP_TOPIC_IDS);
    assertEqual(new Set(validation.topicIds).size, CREATE_HELP_TOPIC_IDS.length);

    Object.values(CREATE_HELP_TOPICS).forEach((topic) => {
      const urls = topic.sources.map((source) => source.href);
      assertEqual(new Set(urls).size, urls.length, topic.id + ": Quellen doppelt.");
      topic.sources.forEach((source) => {
        assert(isCreateHelpSourceUrlAllowed(source.href), topic.id + ": unsichere Quelle.");
        assert(Boolean(normalizeText(source.label)), topic.id + ": leeres Quellenlabel.");
        assert(!source.href.includes("undefined"), topic.id + ": instabiler Quellenanker.");
      });
    });
  });


  test("Create-Hilfe Release 5: alle Themen liefern Pflichtinhalte auch aus normalisierten Teil-Drafts", () => {
    const variants = {
      tournamentMode: { mode: "ko" },
      presetFormat: { mode: "ko" },
      participants: { mode: "league" },
      koDraw: { mode: "ko" },
      thirdPlace: { mode: "ko" },
      grandFinal: { mode: "double_ko" },
      groupsKoOddParticipants: { mode: "groups_ko" },
      preliminaryFinal: { mode: "preliminary_final" },
      gameRules: { mode: "ko" },
      boardCount: { mode: "ko" },
      timeProfile: { mode: "ko" },
    };
    CREATE_HELP_TOPIC_IDS.forEach((topicId) => {
      const model = resolveCreateHelpTopic(topicId, variants[topicId], null);
      assertCreateHelpTopicComplete(model, topicId);
    });
  });


  test("Create-Hilfe Release 5: Turniermodus zeigt reale Limits, Teilnehmer und modusspezifische Inhalte", () => {
    const cases = [
      ["ko", "KO", "2 bis 128", "direkte KO-Baum"],
      ["double_ko", "Doppel-KO", "2 bis 32", "Losers Bracket"],
      ["league", "Liga", "2 bis 16", "15 Ligamatches"],
      ["groups_ko", "Gruppenphase + KO", "4 bis 16", "A1"],
      ["preliminary_final", "Vorrunde + Finalphase", "5 bis 16", "Vorrundentabelle"],
    ];
    cases.forEach(([mode, label, limits, exampleFragment]) => {
      const model = resolveCreateHelpTopic("tournamentMode", {
        mode,
        participantsText: createHelpParticipantText(mode === "preliminary_final" ? 8 : 6),
      });
      assert(model.currentSelection.includes(label), mode + ": Moduslabel fehlt.");
      assert(model.currentSelection.includes(limits), mode + ": Limits fehlen.");
      assert(model.currentSelection.includes("Teilnehmer erkannt"), mode + ": Teilnehmerzahl fehlt.");
      assert(model.examples.join(" ").includes(exampleFragment), mode + ": Modusbeispiel fehlt.");
      assertEqual(model.examples.length, 1, mode + ": es darf nur das aktive Modusbeispiel erscheinen.");
    });
  });


  test("Create-Hilfe Release 5: Preset-Resolver trennt European Tour, Basic und Custom", () => {
    const official = resolveCreateHelpTopic("presetFormat", {
      x01Preset: X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL,
      participantsText: createHelpParticipantText(8),
    });
    const basic = resolveCreateHelpTopic("presetFormat", {
      x01Preset: X01_PRESET_PDC_501_DOUBLE_OUT_BASIC,
      participantsText: createHelpParticipantText(8),
    });
    const custom = resolveCreateHelpTopic("presetFormat", {
      x01Preset: X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL,
      mode: "ko",
      bestOfLegs: 7,
      startScore: 501,
      x01InMode: "Straight",
      x01OutMode: "Double",
      x01BullMode: "25/50",
      x01BullOffMode: "Normal",
      x01MaxRounds: 50,
      lobbyVisibility: "private",
    });

    assert(official.currentSelection.includes("PDC European Tour - Runden 1 bis 4"));
    assert(official.currentSelection.includes("Best of 11"));
    assertEqual(official.compliance.status, CREATE_HELP_COMPLIANCE_STATUSES.OFFICIAL_FORMAT_PROFILE);
    assert(official.compliance.scope.includes("Halbfinal"));

    assert(basic.currentSelection.includes("Lokaler Spieleabend - 501 / Best of 5"));
    assertEqual(basic.compliance.status, CREATE_HELP_COMPLIANCE_STATUSES.PRODUCT_STANDARD);
    assert(basic.compliance.description.includes("kein offizielles PDC-Eventformat"));

    assert(custom.currentSelection.includes("Individuell"));
    assertEqual(custom.compliance.status, CREATE_HELP_COMPLIANCE_STATUSES.NO_GENERAL_CONFORMITY_CLAIM);
    assert(custom.compliance.description.includes("keine automatische"));
  });


  test("Create-Hilfe Release 5: Teilnehmer und Draw erklären Seed-Wirkung, Open Draw und Freilose", () => {
    const seededDraft = {
      mode: "ko",
      participantsText: createHelpParticipantText(9),
      randomizeKoRound1: false,
    };
    const seededParticipants = resolveCreateHelpTopic("participants", seededDraft);
    const seededDraw = resolveCreateHelpTopic("koDraw", seededDraft);
    const openDraw = resolveCreateHelpTopic("koDraw", {
      ...seededDraft,
      randomizeKoRound1: true,
    });

    assert(seededParticipants.currentSelection.includes("9 Teilnehmer erkannt"));
    assert(seededParticipants.currentSelection.includes("Seed-Reihenfolge"));
    assert(seededDraw.currentSelection.includes("Gesetzter Draw"));
    assert(seededDraw.effects.join(" ").includes("Freilose"));
    assert(seededDraw.examples.join(" ").includes("sieben Freilose"));
    assert(openDraw.currentSelection.includes("Open Draw"));
    assert(openDraw.currentSelection.includes("gemischte Reihenfolge"));
    assert(openDraw.limitations.join(" ").includes("keine externe"));
  });


  test("Create-Hilfe Release 5: Platz 3 und Grand Final aktualisieren Matchwirkung und Compliance", () => {
    const thirdOff = resolveCreateHelpTopic("thirdPlace", {
      mode: "ko",
      participantsText: createHelpParticipantText(8),
      enableThirdPlaceMatch: false,
    });
    const thirdOn = resolveCreateHelpTopic("thirdPlace", {
      mode: "ko",
      participantsText: createHelpParticipantText(8),
      enableThirdPlaceMatch: true,
    });
    const reset = resolveCreateHelpTopic("grandFinal", {
      mode: "double_ko",
      participantsText: createHelpParticipantText(8),
      grandFinalResetMode: GRAND_FINAL_RESET_IF_NEEDED,
    });
    const single = resolveCreateHelpTopic("grandFinal", {
      mode: "double_ko",
      participantsText: createHelpParticipantText(8),
      grandFinalResetMode: GRAND_FINAL_RESET_SINGLE_MATCH,
    });

    assert(thirdOff.currentSelection.includes("kein zusätzliches Match"));
    assert(thirdOn.currentSelection.includes("ein zusätzliches Match"));
    assertEqual(thirdOn.compliance.status, CREATE_HELP_COMPLIANCE_STATUSES.ORGANIZER_RULE);
    assert(thirdOn.compliance.description.includes("keine allgemeine"));

    assert(reset.currentSelection.includes("bis zu 2 Finalmatches"));
    assert(single.currentSelection.includes("1 Finalmatch"));
    assert(single.limitations.join(" ").includes("verkürzte Variante"));
    assert(single.compliance.label.includes("Verkürzte"));
  });


  test("Create-Hilfe Release 5: Gruppenanalyse zeigt gerade, ungerade, Policies und Bestätigung", () => {
    const even = resolveCreateHelpTopic("groupsKoOddParticipants", {
      mode: "groups_ko",
      participantsText: createHelpParticipantText(8),
      groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_REQUIRE_EVEN,
    });
    const blocked = resolveCreateHelpTopic("groupsKoOddParticipants", {
      mode: "groups_ko",
      participantsText: createHelpParticipantText(9),
      groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_REQUIRE_EVEN,
    });
    const pending = resolveCreateHelpTopic("groupsKoOddParticipants", {
      mode: "groups_ko",
      participantsText: createHelpParticipantText(9),
      groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL,
      groupsKoOddParticipantAcknowledged: false,
    });
    const acknowledged = resolveCreateHelpTopic("groupsKoOddParticipants", {
      mode: "groups_ko",
      participantsText: createHelpParticipantText(9),
      groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL,
      groupsKoOddParticipantAcknowledged: true,
    });

    assert(even.currentSelection.includes("Gruppe A: 4, Gruppe B: 4"));
    assert(even.currentSelection.includes("keine Bestätigung erforderlich"));
    assertEqual(even.compliance.status, CREATE_HELP_COMPLIANCE_STATUSES.PRODUCT_STANDARD);

    assert(blocked.currentSelection.includes("Anlage wird blockiert"));
    assert(pending.currentSelection.includes("Gruppe A: 5, Gruppe B: 4"));
    assert(pending.currentSelection.includes("Bestätigung noch erforderlich"));
    assert(pending.effects.join(" ").includes("4 Matches je Person"));
    assert(pending.effects.join(" ").includes("3 Matches je Person"));
    assertEqual(pending.compliance.status, CREATE_HELP_COMPLIANCE_STATUSES.ORGANIZER_RULE);
    assert(acknowledged.currentSelection.includes("Bestätigung erteilt"));
  });


  test("Create-Hilfe Release 5: Vorrundenanalyse zeigt Gesamtmatches, Punkte und beide Finalphasentypen", () => {
    const ko = resolveCreateHelpTopic("preliminaryFinal", {
      mode: "preliminary_final",
      participantsText: createHelpParticipantText(8),
      preliminaryMatchesPerParticipant: 4,
      preliminaryWinPoints: 3,
      preliminaryDrawPoints: 1,
      preliminaryLossPoints: 0,
      finalStageType: FINAL_STAGE_TYPE_KO,
      finalStageQualifierCount: 4,
      finalStageBestOfLegs: 5,
    });
    const doubleKo = resolveCreateHelpTopic("preliminaryFinal", {
      mode: "preliminary_final",
      participantsText: createHelpParticipantText(7),
      preliminaryMatchesPerParticipant: 4,
      finalStageType: FINAL_STAGE_TYPE_DOUBLE_KO,
      finalStageQualifierCount: 6,
      finalStageBestOfLegs: 7,
    });

    assert(ko.currentSelection.includes("16 Vorrundenmatches gesamt"));
    assert(ko.currentSelection.includes("Punkte 3/1/0"));
    assert(ko.currentSelection.includes("Top 4 in KO"));
    assert(doubleKo.currentSelection.includes("14 Vorrundenmatches gesamt"));
    assert(doubleKo.currentSelection.includes("Top 6 in Doppel-KO"));
    assert(doubleKo.currentSelection.includes("Finalphase Best of 7"));
    assert(doubleKo.compliance.description.includes("keine allgemeine"));
  });


  test("Create-Hilfe Release 5: Spielregeln erklären First to und Bull-off/Bull-Modus dynamisch", () => {
    const bestOf5 = resolveCreateHelpTopic("gameRules", {
      mode: "ko",
      bestOfLegs: 5,
      x01Preset: X01_PRESET_CUSTOM,
      x01BullOffMode: "Off",
      x01BullMode: "50/50",
    });
    const bestOf11 = resolveCreateHelpTopic("gameRules", {
      mode: "ko",
      bestOfLegs: 11,
      x01Preset: X01_PRESET_CUSTOM,
      x01BullOffMode: "Normal",
      x01BullMode: "25/50",
    });
    const preliminary = resolveCreateHelpTopic("gameRules", {
      mode: "preliminary_final",
      finalStageBestOfLegs: 7,
      x01Preset: X01_PRESET_CUSTOM,
      x01BullOffMode: "Normal",
      x01BullMode: "50/50",
    });

    assert(bestOf5.effects.join(" ").includes("First to 3"));
    assert(bestOf5.effects.join(" ").includes("nicht wirksam"));
    assert(!bestOf5.currentSelection.includes("Bull 50/50"));
    assert(bestOf11.effects.join(" ").includes("First to 6"));
    assert(bestOf11.effects.join(" ").includes("Bull-Modus 25/50"));
    assert(preliminary.currentSelection.includes("Vorrunde: 2 feste Legs"));
    assert(preliminary.currentSelection.includes("Finalphase: Best of 7 (First to 4)"));
    assert(preliminary.effects.join(" ").includes("First to 4"));
  });


  test("Create-Hilfe Release 5: Board und Zeitprofil nutzen die reine Prognose ohne MultiBoard- oder Regelclaim", () => {
    const base = {
      mode: "ko",
      participantsText: createHelpParticipantText(8),
      bestOfLegs: 5,
      x01Preset: X01_PRESET_CUSTOM,
    };
    const oneBoard = resolveCreateHelpTopic("boardCount", { ...base, boardCount: 1 }, {
      tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
    });
    const threeBoards = resolveCreateHelpTopic("boardCount", { ...base, boardCount: 3 }, {
      tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_NORMAL,
    });
    const fast = resolveCreateHelpTopic("timeProfile", { ...base, boardCount: 2 }, {
      tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_FAST,
    });
    const slow = resolveCreateHelpTopic("timeProfile", { ...base, boardCount: 2 }, {
      tournamentTimeProfile: TOURNAMENT_TIME_PROFILE_SLOW,
    });

    assert(oneBoard.currentSelection.includes("1 Board"));
    assert(threeBoards.currentSelection.includes("3 Boards"));
    assert(oneBoard.currentSelection.includes("Prognose ca."));
    assert(threeBoards.effects.join(" ").includes("Match-Wellen"));
    assert(threeBoards.limitations.join(" ").includes("kein MultiBoard"));
    assertEqual(threeBoards.compliance.status, CREATE_HELP_COMPLIANCE_STATUSES.TECHNICAL_PARAMETER);
    assert(fast.currentSelection.includes("Schnell"));
    assert(slow.currentSelection.includes("Langsam"));
    assert(fast.currentSelection !== slow.currentSelection);
    assert(slow.compliance.description.includes("keine normative"));
  });


  test("Create-Hilfe Release 5: Classification und Compliance werden separat und in definierter Reihenfolge gerendert", () => {
    const model = resolveCreateHelpTopic("gameRules", normalizeCreateDraft({
      mode: "ko",
      participantsText: createHelpParticipantText(8),
      bestOfLegs: 11,
      x01Preset: X01_PRESET_CUSTOM,
    }));
    const html = renderCreateHelpPanelBody(model);
    const basicHeadings = [
      "Kurz erklärt",
      "Aktuelle Auswahl",
      "Auswirkung auf dein Turnier",
    ];
    let previousIndex = -1;
    basicHeadings.forEach((heading) => {
      const index = html.indexOf(heading);
      assert(index > previousIndex, "Basisabschnitt fehlt oder Reihenfolge falsch: " + heading);
      previousIndex = index;
    });
    assert(html.includes("Mehr Beispiele und Hinweise"));
    assert(html.includes("Regelstatus und Quellen für die Turnierleitung"));
    const detailedHeadings = [
      "Beispiele",
      "Tipps",
      "Abhängigkeiten",
      "Einschränkungen",
      "Herkunft der Einstellung",
    ];
    previousIndex = -1;
    detailedHeadings.forEach((heading) => {
      const index = html.indexOf(heading);
      assert(index > previousIndex, "Detailabschnitt fehlt oder Reihenfolge falsch: " + heading);
      previousIndex = index;
    });
    assert(html.indexOf("Regelstatus und Konformität") < html.indexOf("ata-create-help-sources"));
    assertEqual((html.match(/<details/g) || []).length, 2);
    assert(html.includes("ata-create-help-classification"));
    assert(html.includes("ata-create-help-compliance"));
    assert(html.includes("Geltungsbereich:"));
    assert(html.includes("Technische Durchsetzung:"));
    assert(html.includes('target="_blank"'));
    assert(html.includes('rel="noopener noreferrer"'));
  });


  test("Create-Hilfe Release 5: unbekannte Compliance-Statuswerte und leere Abschnitte sind sicher", () => {
    const unknown = normalizeCreateHelpCompliance({
      status: "future_unknown_status",
      description: "Vorsichtiger Fallback.",
    });
    assertEqual(unknown.status, CREATE_HELP_COMPLIANCE_STATUSES.NO_GENERAL_CONFORMITY_CLAIM);
    assert(Boolean(unknown.label));
    const complianceHtml = renderCreateHelpCompliance(unknown);
    assert(complianceHtml.includes("Keine allgemeine Konformitätsbehauptung"));
    assertEqual(renderCreateHelpCompliance({}), "");
    assertEqual(renderCreateHelpListSection("Leer", []), "");
    assertEqual(renderCreateHelpTextSection("Leer", ""), "");
    const emptyHtml = renderCreateHelpPanelBody(null);
    assert(emptyHtml.includes("Kontextbezogene Hilfe"));
    assert(!emptyHtml.includes(">Quellen<"));
  });


  test("Create-Hilfe Release 5: jedes Thema ändert Inhalte ohne Topic-Wechsel", () => {
    const cases = [
      ["tournamentMode", { mode: "ko", participantsText: createHelpParticipantText(2) }, { mode: "ko", participantsText: createHelpParticipantText(3) }, {}, {}],
      ["presetFormat", { x01Preset: X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL }, { x01Preset: X01_PRESET_PDC_501_DOUBLE_OUT_BASIC }, {}, {}],
      ["participants", { mode: "ko", participantsText: createHelpParticipantText(2) }, { mode: "ko", participantsText: createHelpParticipantText(4) }, {}, {}],
      ["koDraw", { mode: "ko", randomizeKoRound1: false }, { mode: "ko", randomizeKoRound1: true }, {}, {}],
      ["thirdPlace", { mode: "ko", enableThirdPlaceMatch: false }, { mode: "ko", enableThirdPlaceMatch: true }, {}, {}],
      ["grandFinal", { mode: "double_ko", grandFinalResetMode: GRAND_FINAL_RESET_IF_NEEDED }, { mode: "double_ko", grandFinalResetMode: GRAND_FINAL_RESET_SINGLE_MATCH }, {}, {}],
      ["groupsKoOddParticipants", { mode: "groups_ko", participantsText: createHelpParticipantText(9) }, { mode: "groups_ko", participantsText: createHelpParticipantText(9), groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL }, {}, {}],
      ["preliminaryFinal", { mode: "preliminary_final", participantsText: createHelpParticipantText(8), preliminaryMatchesPerParticipant: 4 }, { mode: "preliminary_final", participantsText: createHelpParticipantText(8), preliminaryMatchesPerParticipant: 6 }, {}, {}],
      ["gameRules", { mode: "ko", bestOfLegs: 5 }, { mode: "ko", bestOfLegs: 11 }, {}, {}],
      ["boardCount", { mode: "ko", participantsText: createHelpParticipantText(8), boardCount: 1 }, { mode: "ko", participantsText: createHelpParticipantText(8), boardCount: 2 }, {}, {}],
      ["timeProfile", { mode: "ko", participantsText: createHelpParticipantText(8) }, { mode: "ko", participantsText: createHelpParticipantText(8) }, { tournamentTimeProfile: "fast" }, { tournamentTimeProfile: "slow" }],
    ];
    cases.forEach(([topicId, beforeDraft, afterDraft, beforeSettings, afterSettings]) => {
      const before = resolveCreateHelpTopic(topicId, beforeDraft, beforeSettings);
      const after = resolveCreateHelpTopic(topicId, afterDraft, afterSettings);
      assertEqual(before.id, topicId, topicId + ": Ausgangs-ID falsch.");
      assertEqual(after.id, topicId, topicId + ": ID hat gewechselt.");
      const beforeContent = JSON.stringify(before);
      const afterContent = JSON.stringify(after);
      assert(beforeContent !== afterContent, topicId + ": relevanter Wert aktualisiert den Inhalt nicht.");
    });
  });


  test("Create-Hilfe Release 5: kritische Compliance-Aussagen bleiben vorsichtig und technisch abgegrenzt", () => {
    const basic = resolveCreateHelpTopic("presetFormat", { x01Preset: X01_PRESET_PDC_501_DOUBLE_OUT_BASIC });
    const custom = resolveCreateHelpTopic("presetFormat", { x01Preset: X01_PRESET_CUSTOM });
    const third = resolveCreateHelpTopic("thirdPlace", { mode: "ko" });
    const single = resolveCreateHelpTopic("grandFinal", {
      mode: "double_ko",
      grandFinalResetMode: GRAND_FINAL_RESET_SINGLE_MATCH,
    });
    const groups = resolveCreateHelpTopic("groupsKoOddParticipants", {
      mode: "groups_ko",
      participantsText: createHelpParticipantText(9),
      groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL,
    });
    const preliminary = resolveCreateHelpTopic("preliminaryFinal", { mode: "preliminary_final" });
    const board = resolveCreateHelpTopic("boardCount", { mode: "ko" });
    const time = resolveCreateHelpTopic("timeProfile", { mode: "ko" });
    const rules = resolveCreateHelpTopic("gameRules", { mode: "ko", x01Preset: X01_PRESET_CUSTOM });

    assert(basic.compliance.description.includes("kein offizielles PDC-Eventformat"));
    assert(custom.compliance.description.includes("keine automatische"));
    assert(third.compliance.label.includes("Veranstalter"));
    assert(single.compliance.label.includes("Verkürzte"));
    assertEqual(groups.compliance.status, CREATE_HELP_COMPLIANCE_STATUSES.ORGANIZER_RULE);
    assert(preliminary.compliance.description.includes("keine allgemeine"));
    assert(board.limitations.join(" ").includes("kein MultiBoard"));
    assert(time.compliance.description.includes("keine normative"));
    assert(rules.classification.description.includes("technische Produktwerte"));
  });


  test("Create-Hilfe: unbekannte und im Modus nicht verfügbare Themen liefern keinen Inhalt", () => {
    const leagueDraft = normalizeCreateDraft({ mode: "league" });
    assertEqual(resolveCreateHelpTopic("unknown", leagueDraft), null);
    assertEqual(resolveCreateHelpTopic("thirdPlace", leagueDraft), null);
    assertEqual(resolveCreateHelpTopic("grandFinal", leagueDraft), null);
    assertEqual(resolveCreateHelpTopic("groupsKoOddParticipants", leagueDraft), null);
    assertEqual(resolveCreateHelpTopic("preliminaryFinal", leagueDraft), null);
  });
