// Data model and dynamic value resolution for contextual create-tournament help.
  const CREATE_HELP_TOPIC_IDS = Object.freeze([
    "tournamentMode",
    "presetFormat",
    "participants",
    "koDraw",
    "thirdPlace",
    "grandFinal",
    "groupsKoOddParticipants",
    "preliminaryFinal",
    "gameRules",
    "boardCount",
    "timeProfile",
  ]);

  const CREATE_HELP_MODE_EFFECTS = Object.freeze({
    ko: "Erzeugt einen Single-Elimination-Baum; nach einer Niederlage scheidet eine Person aus.",
    double_ko: "Erzeugt Winners Bracket, Losers Bracket und Grand Final; ausgeschieden ist eine Person nach der zweiten Niederlage.",
    league: "Erzeugt einen vollständigen Round-Robin-Spielplan, in dem jede Person gegen jede andere spielt.",
    groups_ko: "Erzeugt zwei Round-Robin-Gruppen; die Top 2 jeder Gruppe erreichen die Kreuz-KO-Phase.",
    preliminary_final: "Erzeugt eine Vorrunde mit gleich vielen realen Matches je Person und danach eine gesetzte KO- oder Doppel-KO-Finalphase.",
  });

  function freezeCreateHelpTopic(topic) {
    return Object.freeze({
      ...topic,
      availableModes: Object.freeze([...(topic.availableModes || [])]),
      sources: Object.freeze((topic.sources || []).map((source) => Object.freeze({ ...source }))),
      classification: topic.classification ? Object.freeze({ ...topic.classification }) : null,
    });
  }

  const CREATE_HELP_TOPICS = Object.freeze({
    tournamentMode: freezeCreateHelpTopic({
      id: "tournamentMode",
      title: "Turniermodus",
      shortDescription: "Der Modus legt Turnierstruktur, Spielplan und Fortschrittslogik fest. Unterstützt werden KO, Doppel-KO, Liga, Gruppenphase + KO sowie Vorrunde + Finalphase; nicht jeder Modus ist dadurch automatisch ein offizielles PDC-Format.",
      resolveCurrentSelection: ({ draft }) => MODE_PARTICIPANT_LIMITS[draft.mode]?.label || "KO",
      resolveEffects: ({ draft }) => [CREATE_HELP_MODE_EFFECTS[draft.mode] || CREATE_HELP_MODE_EFFECTS.ko],
      classification: {
        label: "Formatentscheidung",
        description: "KO und Round Robin sind im DRA-Regelwerk beschrieben. Die konkrete Moduskonfiguration muss zusätzlich zur veröffentlichten Turnierordnung passen.",
      },
      sources: [
        { label: "README - Turniermodi", href: README_TOURNAMENT_MODES_URL },
        { label: "DRA-Regeln in der GUI - Modus und Format (DRA 6.8.1, 6.8.2 und 6.8.4)", href: DRA_GUI_RULE_MODE_FORMATS_URL },
      ],
    }),
    presetFormat: freezeCreateHelpTopic({
      id: "presetFormat",
      title: "Preset und Formatprofil",
      shortDescription: "European Tour wendet das dokumentierte offizielle Rundenprofil an. Basic ist ein rückwärtskompatibles 501-/Double-Out-Profil und kein offizielles PDC-Eventformat. Individuell / Manuell behält die aktuellen Werte bei.",
      resolveCurrentSelection: ({ draft }) => getCreatePresetLabel(getAppliedCreatePresetId(draft)),
      resolveEffects: ({ draft }) => {
        const presetId = getAppliedCreatePresetId(draft);
        if (presetId === X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL) {
          return ["Wendet KO, Best of 11, 501, Straight In, Double Out und die dokumentierten technischen Lobbywerte an."];
        }
        if (presetId === X01_PRESET_PDC_501_DOUBLE_OUT_BASIC) {
          return ["Wendet KO, Best of 5, 501, Straight In, Double Out und die kompatiblen technischen Lobbywerte an."];
        }
        return ["Ändert keine Sachwerte; Modus und X01-Werte bleiben in ihrer aktuellen manuellen Konfiguration erhalten."];
      },
      classification: {
        label: "Offizielles Formatprofil oder Kompatibilitätsprofil",
        description: "Nur European Tour ist hier als offizielles PDC-Formatprofil dokumentiert. Basic und Custom erheben diesen Anspruch nicht.",
      },
      sources: [
        { label: "README - Preset-Katalog", href: README_PRESET_CATALOG_URL },
        { label: "PDC/DRA Compliance-Mapping - Preset-Logik", href: PDC_DRA_COMPLIANCE_PRESET_URL },
      ],
    }),
    participants: freezeCreateHelpTopic({
      id: "participants",
      title: "Teilnehmerliste",
      shortDescription: "Trage eine Person pro Zeile ein. Die Eingabereihenfolge bleibt bei einem gesetzten Draw relevant; Teilnehmer mischen verändert genau diese Reihenfolge.",
      resolveCurrentSelection: ({ participants }) => `${participants.length} Teilnehmer erkannt`,
      resolveEffects: () => ["Die Liste bestimmt das Teilnehmerfeld. Bei einem gesetzten KO-Draw wird ihre Reihenfolge als Seed-Reihenfolge verwendet."],
      classification: {
        label: "Eingabe- und Setzreihenfolge",
        description: "Die Anwendung validiert die Teilnehmerzahl beim Anlegen; eine erweiterte Live-Validierung ist nicht Bestandteil dieses Releases.",
      },
      sources: [
        { label: "README - Turnier anlegen und Teilnehmer", href: README_TOURNAMENT_CREATE_URL },
        { label: "README - KO und Seed-Placement", href: README_TOURNAMENT_MODES_URL },
      ],
    }),
    koDraw: freezeCreateHelpTopic({
      id: "koDraw",
      title: "Auslosung der ersten KO-Runde",
      availableModes: ["ko", "double_ko"],
      shortDescription: "Open Draw mischt die Reihenfolge für die erste KO-Runde deterministisch. Beim gesetzten Draw bleibt die Eingabereihenfolge als Seed-Reihenfolge wirksam.",
      resolveCurrentSelection: ({ draft }) => draft.randomizeKoRound1 ? "Open Draw" : "Gesetzter Draw",
      resolveEffects: ({ draft }) => [draft.randomizeKoRound1
        ? "Die erste KO-Runde wird aus einer gemischten Seed-Reihenfolge aufgebaut."
        : "Die erste KO-Runde und die Bye-Verteilung folgen der eingegebenen Seed-Reihenfolge."],
      classification: {
        label: "Draw-Entscheidung",
        description: "Die Auswahl ist transparent und draw-stabil, behauptet aber für sich allein keine vollständige Konformität mit einer konkreten Eventordnung.",
      },
      sources: [
        { label: "README - KO und Doppel-KO Draw", href: README_TOURNAMENT_MODES_URL },
        { label: "DRA-Regeln in der GUI - Open Draw und Draw-Stabilität (DRA 6.12.1)", href: DRA_GUI_RULE_OPEN_DRAW_URL },
      ],
    }),
    thirdPlace: freezeCreateHelpTopic({
      id: "thirdPlace",
      title: "Spiel um Platz 3",
      availableModes: ["ko"],
      shortDescription: "Diese Option gibt es nur im Single-Elimination-KO. Sie ergänzt ein separates Match zwischen den beiden Halbfinalverlierern.",
      resolveCurrentSelection: ({ draft }) => draft.enableThirdPlaceMatch ? "Aktiv" : "Aus",
      resolveEffects: ({ draft }) => [draft.enableThirdPlaceMatch
        ? "Ein zusätzliches Platz-3-Match wird erzeugt; der Champion-Pfad des Hauptfinales bleibt unverändert."
        : "Es wird kein Platz-3-Match erzeugt; der KO-Baum endet mit dem Hauptfinale."],
      classification: {
        label: "Optionale Veranstalterentscheidung",
        description: "Das Platz-3-Spiel ist keine allgemeine PDC- oder DRA-Pflicht und muss zur konkreten Turnierordnung passen.",
      },
      sources: [
        { label: "README - KO und optionales Spiel um Platz 3", href: README_TOURNAMENT_MODES_URL },
        { label: "DRA-Regeln in der GUI - Spiel um Platz 3 (DRA 1.2, 6.8.1, 6.8.4 und 6.12.1)", href: DRA_GUI_RULE_THIRD_PLACE_URL },
      ],
    }),
    grandFinal: freezeCreateHelpTopic({
      id: "grandFinal",
      title: "Doppel-KO Grand Final",
      availableModes: ["double_ko"],
      shortDescription: "Beim Reset-Finale muss der Sieger des Losers Bracket den bis dahin ungeschlagenen Winners-Bracket-Sieger bei Bedarf zweimal besiegen. Die Einzelmatch-Variante verkürzt diesen Ablauf bewusst.",
      resolveCurrentSelection: ({ draft }) => sanitizeGrandFinalResetMode(draft.grandFinalResetMode) === GRAND_FINAL_RESET_IF_NEEDED
        ? "Reset-Finale falls nötig"
        : "Ein einzelnes Grand Final",
      resolveEffects: ({ draft }) => [sanitizeGrandFinalResetMode(draft.grandFinalResetMode) === GRAND_FINAL_RESET_IF_NEEDED
        ? "Verliert der Winners-Bracket-Sieger das erste Grand Final, wird ein zweites und entscheidendes Finale aktiviert."
        : "Das Turnier endet nach einem Grand Final; diese bewusst verkürzte Variante bildet kein vollständiges klassisches Doppel-KO ab."],
      classification: {
        label: "Veranstalterentscheidung im Doppel-KO",
        description: "Das Projekt dokumentiert beide Varianten und bezeichnet das Einzelmatch ausdrücklich als verkürzt.",
      },
      sources: [
        { label: "README - Doppel-KO und Grand-Final-Regel", href: README_TOURNAMENT_MODES_URL },
        { label: "PDC/DRA Compliance-Mapping - KO und Veranstalterregeln", href: PDC_DRA_COMPLIANCE_KO_URL },
      ],
    }),
    groupsKoOddParticipants: freezeCreateHelpTopic({
      id: "groupsKoOddParticipants",
      title: "Ungerade Teilnehmerzahl in Gruppenphase + KO",
      availableModes: ["groups_ko"],
      shortDescription: "Gerade Teilnehmerzahlen sind der sichere Produktstandard für zwei gleich große Gruppen. Ungleiche Gruppen sind nur als ausdrücklich gewählte Veranstalterregel zulässig.",
      resolveCurrentSelection: ({ draft }) => sanitizeGroupsKoOddParticipantPolicy(draft.groupsKoOddParticipantPolicy) === GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL
        ? "Ungleiche Gruppengrößen zulassen"
        : "Nur gerade Teilnehmerzahl zulassen",
      resolveEffects: ({ draft, participants }) => {
        const policy = sanitizeGroupsKoOddParticipantPolicy(draft.groupsKoOddParticipantPolicy);
        const analysis = analyzeGroupsKoParticipantDistribution(participants.length);
        const effects = [];
        if (participants.length > 0) {
          effects.push(`Die aktuelle Verteilung ergibt Gruppe A mit ${analysis.groupASize} und Gruppe B mit ${analysis.groupBSize} Personen.`);
        }
        effects.push(policy === GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL
          ? "Bei ungerader Teilnehmerzahl ist vor dem Anlegen eine ausdrückliche Bestätigung der verwendeten Turnierordnung erforderlich."
          : "Eine ungerade Teilnehmerzahl blockiert das Anlegen, damit keine ungleichen Gruppen still entstehen.");
        return effects;
      },
      classification: {
        label: "Produktstandard oder Veranstalterregel",
        description: "Das DRA-Regelwerk enthält hierfür keine universelle Gruppenpolicy. Die Auswahl begründet keine allgemeine Verbandskonformität.",
      },
      sources: [
        { label: "DRA-Regeln in der GUI - Gruppenphase und ungerade Teilnehmerzahl", href: DRA_GUI_RULE_MODE_FORMATS_URL },
        { label: "PDC/DRA Compliance-Mapping - Gruppenauflösung", href: PDC_DRA_COMPLIANCE_GROUPS_URL },
      ],
    }),
    preliminaryFinal: freezeCreateHelpTopic({
      id: "preliminaryFinal",
      title: "Vorrunde und Finalphase",
      availableModes: ["preliminary_final"],
      shortDescription: "Dieses Veranstalterprofil verteilt gleich viele reale Vorrundenmatches auf alle Personen und erzeugt danach eine nach Tabellenplatz gesetzte KO- oder Doppel-KO-Finalphase.",
      resolveCurrentSelection: ({ draft, participants }) => `${participants.length} Teilnehmer · ${draft.preliminaryMatchesPerParticipant} Vorrundenmatches je Person · 2 Legs fest · Top ${draft.finalStageQualifierCount} in ${draft.finalStageType === FINAL_STAGE_TYPE_DOUBLE_KO ? "Doppel-KO" : "KO"} · Finalphase Best of ${draft.finalStageBestOfLegs}`,
      resolveEffects: ({ draft }) => [
        "In jedem Vorrundenmatch werden genau zwei Legs gespielt; ein 1:1 ist möglich.",
        `Die Finalphase verwendet eine getrennte Matchlänge von Best of ${draft.finalStageBestOfLegs} Legs.`,
      ],
      classification: {
        label: "Veranstalterprofil",
        description: "Paarung, Wertung und Qualifikation sind deterministisch umgesetzt, werden aber nicht als allgemeines PDC-, DRA-, WDF- oder Verbandsformat bezeichnet.",
      },
      sources: [
        { label: "README - Vorrunde + Finalphase", href: README_TOURNAMENT_MODES_URL },
        { label: "PDC/DRA Compliance-Mapping - Vorrunde + Finalphase", href: PDC_DRA_COMPLIANCE_PRELIMINARY_FINAL_URL },
      ],
    }),
    gameRules: freezeCreateHelpTopic({
      id: "gameRules",
      title: "Spielregeln und X01",
      shortDescription: "Die kompakte Zusammenfassung zeigt die aktuell wirksame Matchlänge, Startpunkte, In-/Out-Modus, Bull-off, den wirksamen Bull-Modus und die technischen Maximalrunden.",
      resolveCurrentSelection: ({ draft }) => buildCreateGameRulesSummary(draft).text,
      resolveEffects: ({ draft }) => {
        const effectiveBestOf = draft.mode === "preliminary_final" ? draft.finalStageBestOfLegs : draft.bestOfLegs;
        return [
          `Best of ${effectiveBestOf} bedeutet First to ${getLegsToWin(effectiveBestOf)} Legs${draft.mode === "preliminary_final" ? " in der Finalphase" : ""}.`,
          "Diese Werte werden für die X01-Matchkonfiguration und die Zeitprognose verwendet.",
        ];
      },
      classification: {
        label: "Formatwerte und technische AutoDarts-Vorgaben",
        description: "501, Straight In und Double Out können Teil eines offiziellen Formats sein. Bull-off Normal und Max Runden 50 sind in den Presets technische Lobbywerte und nicht automatisch offizielle Formatregeln.",
      },
      sources: [
        { label: "README - Spielregeln und Feldinhalte", href: README_TOURNAMENT_CREATE_URL },
        { label: "PDC/DRA Compliance-Mapping - Preset-Logik und technische Abgrenzung", href: PDC_DRA_COMPLIANCE_PRESET_URL },
      ],
    }),
    boardCount: freezeCreateHelpTopic({
      id: "boardCount",
      title: "Boards für die Zeitprognose",
      shortDescription: "Die Board-Anzahl ist ausschließlich ein Kapazitätsparameter der deterministischen Turnierzeitprognose.",
      resolveCurrentSelection: ({ draft }) => `${sanitizeTournamentBoardCount(draft.boardCount, TOURNAMENT_DURATION_DEFAULT_BOARD_COUNT)} ${sanitizeTournamentBoardCount(draft.boardCount, TOURNAMENT_DURATION_DEFAULT_BOARD_COUNT) === 1 ? "Board" : "Boards"}`,
      resolveEffects: () => ["Die Prognose begrenzt damit die Zahl gleichzeitig planbarer Matches und berücksichtigt weiterhin Match-Abhängigkeiten sowie Spielerkonflikte."],
      classification: {
        label: "Planungsparameter",
        description: "Die Eingabe weist keine Boards zu, verwaltet keine parallelen Lobbys und aktiviert weder MultiBoard noch mehrere gleichzeitig gestartete Matches.",
      },
      sources: [
        { label: "Dokumentation - verwendete Turnierparameter der Prognose", href: TOURNAMENT_DURATION_PARAMETERS_URL },
        { label: "README - Voraussichtliche Turnierzeit", href: README_TOURNAMENT_CREATE_URL },
      ],
    }),
    timeProfile: freezeCreateHelpTopic({
      id: "timeProfile",
      title: "Zeitprofil",
      shortDescription: "Das Zeitprofil kalibriert die angenommene Leg-Geschwindigkeit sowie Übergangszeiten zwischen Matches und Turnierphasen.",
      resolveCurrentSelection: ({ settings }) => getTournamentTimeProfileMeta(settings.tournamentTimeProfile).label,
      resolveEffects: ({ settings }) => [getTournamentTimeProfileMeta(settings.tournamentTimeProfile).description, "Das Profil ändert keine Turnierregel und keine X01-Matchkonfiguration."],
      classification: {
        label: "Technischer Prognoseparameter",
        description: "Das Profil ist eine Planungsannahme für lokale Turniere und keine normative PDC- oder DRA-Zeitvorgabe.",
      },
      sources: [
        { label: "Dokumentation - Zeitprofile und Berechnungsgrundlage", href: TOURNAMENT_DURATION_TIME_PROFILES_URL },
      ],
    }),
  });

  function getCreateHelpTopic(topicId) {
    const id = normalizeText(topicId || "");
    return Object.prototype.hasOwnProperty.call(CREATE_HELP_TOPICS, id)
      ? CREATE_HELP_TOPICS[id]
      : null;
  }

  function isCreateHelpSourceUrlAllowed(href) {
    return /^https:\/\//i.test(normalizeText(href || ""));
  }

  function isCreateHelpTopicAvailable(topicId, rawDraft) {
    const topic = getCreateHelpTopic(topicId);
    if (!topic) return false;
    const draft = normalizeCreateDraft(rawDraft);
    return !topic.availableModes.length || topic.availableModes.includes(draft.mode);
  }

  function resolveCreateHelpValue(value, context, fallback) {
    const resolved = typeof value === "function" ? value(context) : value;
    return resolved == null ? fallback : resolved;
  }

  function normalizeCreateHelpList(value) {
    const values = Array.isArray(value) ? value : value == null ? [] : [value];
    return values.map((entry) => normalizeText(entry || "")).filter(Boolean);
  }

  function resolveCreateHelpTopic(topicId, rawDraft, rawSettings = {}) {
    const topic = getCreateHelpTopic(topicId);
    const draft = normalizeCreateDraft(rawDraft, rawSettings);
    if (!topic || !isCreateHelpTopicAvailable(topic.id, draft)) return null;
    const settings = {
      ...(rawSettings || {}),
      tournamentTimeProfile: sanitizeTournamentTimeProfile(
        rawSettings?.tournamentTimeProfile,
        TOURNAMENT_TIME_PROFILE_NORMAL,
      ),
    };
    const context = {
      draft,
      settings,
      participants: parseParticipantLines(draft.participantsText),
    };
    return {
      id: topic.id,
      title: normalizeText(topic.title),
      shortDescription: normalizeText(topic.shortDescription),
      currentSelection: normalizeText(resolveCreateHelpValue(topic.resolveCurrentSelection, context, "")),
      effects: normalizeCreateHelpList(resolveCreateHelpValue(topic.resolveEffects, context, [])),
      classification: topic.classification,
      examples: normalizeCreateHelpList(resolveCreateHelpValue(topic.examples, context, [])),
      tips: normalizeCreateHelpList(resolveCreateHelpValue(topic.tips, context, [])),
      dependencies: normalizeCreateHelpList(resolveCreateHelpValue(topic.dependencies, context, [])),
      limitations: normalizeCreateHelpList(resolveCreateHelpValue(topic.limitations, context, [])),
      compliance: resolveCreateHelpValue(topic.compliance, context, null),
      sources: topic.sources,
    };
  }

  function validateCreateHelpTopicCatalog() {
    const issues = [];
    const catalogIds = Object.keys(CREATE_HELP_TOPICS);
    CREATE_HELP_TOPIC_IDS.forEach((id) => {
      const topic = getCreateHelpTopic(id);
      if (!topic) {
        issues.push(`${id}: Thema fehlt.`);
        return;
      }
      if (topic.id !== id) issues.push(`${id}: Topic-ID stimmt nicht mit dem Katalogschlüssel überein.`);
      if (!normalizeText(topic.title)) issues.push(`${id}: Titel fehlt.`);
      if (!normalizeText(topic.shortDescription)) issues.push(`${id}: Kurzbeschreibung fehlt.`);
      if (typeof topic.resolveCurrentSelection !== "function") issues.push(`${id}: Resolver für aktuelle Auswahl fehlt.`);
      if (typeof topic.resolveEffects !== "function") issues.push(`${id}: Resolver für Auswirkungen fehlt.`);
      if (!topic.sources.length) issues.push(`${id}: Quelle fehlt.`);
      topic.sources.forEach((source) => {
        if (!normalizeText(source.label)) issues.push(`${id}: Quellenlink ohne Beschriftung.`);
        if (!isCreateHelpSourceUrlAllowed(source.href)) issues.push(`${id}: Unsichere oder ungültige Quellen-URL.`);
      });
    });
    if (new Set(catalogIds).size !== catalogIds.length) issues.push("Topic-IDs sind nicht eindeutig.");
    return { ok: issues.length === 0, issues, topicIds: catalogIds };
  }
