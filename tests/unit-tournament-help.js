  test("Create-Hilfe: alle Pflicht-Themen sind vollständig und verwenden sichere Quellen", () => {
    const validation = validateCreateHelpTopicCatalog();
    assert(validation.ok, validation.issues.join(" | "));
    assertDeepEqual(validation.topicIds, CREATE_HELP_TOPIC_IDS);
    assertEqual(new Set(validation.topicIds).size, CREATE_HELP_TOPIC_IDS.length);
  });

  test("Create-Hilfe: Pflicht-Themen lösen aktuelle Auswahl und direkte Auswirkungen auf", () => {
    const base = normalizeCreateDraft({
      mode: "ko",
      participantsText: "Ada\nBerta\nClara",
      randomizeKoRound1: false,
      enableThirdPlaceMatch: true,
      bestOfLegs: 5,
      boardCount: 2,
    });
    CREATE_HELP_TOPIC_IDS.forEach((topicId) => {
      let draft = base;
      if (topicId === "grandFinal") draft = normalizeCreateDraft({ ...base, mode: "double_ko" });
      if (topicId === "groupsKoOddParticipants") draft = normalizeCreateDraft({ ...base, mode: "groups_ko" });
      if (topicId === "preliminaryFinal") draft = normalizeCreateDraft({ ...base, mode: "preliminary_final" });
      const model = resolveCreateHelpTopic(topicId, draft, { tournamentTimeProfile: "normal" });
      assert(Boolean(model), `${topicId}: Modell fehlt.`);
      assert(Boolean(model.currentSelection), `${topicId}: aktuelle Auswahl fehlt.`);
      assert(model.effects.length > 0, `${topicId}: Auswirkungen fehlen.`);
      assert(model.sources.length > 0, `${topicId}: Quellen fehlen.`);
    });
  });

  test("Create-Hilfe: unbekannte und im Modus nicht verfügbare Themen liefern keinen Inhalt", () => {
    const leagueDraft = normalizeCreateDraft({ mode: "league" });
    assertEqual(resolveCreateHelpTopic("unknown", leagueDraft), null);
    assertEqual(resolveCreateHelpTopic("thirdPlace", leagueDraft), null);
    assertEqual(resolveCreateHelpTopic("grandFinal", leagueDraft), null);
    assertEqual(resolveCreateHelpTopic("groupsKoOddParticipants", leagueDraft), null);
  });

  test("Create-Hilfe: dynamische Grundwerte bleiben beim selben Thema aktuell", () => {
    const before = resolveCreateHelpTopic("koDraw", normalizeCreateDraft({ mode: "ko", randomizeKoRound1: false }));
    const after = resolveCreateHelpTopic("koDraw", normalizeCreateDraft({ mode: "ko", randomizeKoRound1: true }));
    assertEqual(before.id, after.id);
    assertEqual(before.currentSelection, "Gesetzter Draw");
    assertEqual(after.currentSelection, "Open Draw");

    const participants = resolveCreateHelpTopic("participants", normalizeCreateDraft({ participantsText: "A\nB\nC" }));
    assert(participants.currentSelection.includes("3 Teilnehmer"));

    const gameRules = resolveCreateHelpTopic("gameRules", normalizeCreateDraft({ bestOfLegs: 7 }));
    assert(gameRules.currentSelection.includes("Best of 7 (First to 4)"));
  });

  test("Create-Hilfe: Pflichtabschnitte und sichere Links werden gerendert, leere optionale Abschnitte nicht", () => {
    const model = resolveCreateHelpTopic("tournamentMode", normalizeCreateDraft({ mode: "ko" }));
    const html = renderCreateHelpPanelBody(model);
    assert(html.includes("Kurz erklärt"));
    assert(html.includes("Aktuelle Auswahl"));
    assert(html.includes("Auswirkung auf dein Turnier"));
    assert(html.includes("Quellen"));
    assert(html.includes('target="_blank"'));
    assert(html.includes('rel="noopener noreferrer"'));
    assert(!html.includes(">Beispiele<"));
    assert(!html.includes(">Tipps<"));
    assert(!html.includes(">Abhängigkeiten<"));
    assert(!html.includes(">Einschränkungen<"));

    const emptyHtml = renderCreateHelpPanelBody(null);
    assert(emptyHtml.includes("Kontextbezogene Hilfe"));
    assert(!emptyHtml.includes(">Quellen<"));
  });
