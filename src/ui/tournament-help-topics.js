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

  const CREATE_HELP_COMPLIANCE_STATUSES = Object.freeze({
    OFFICIAL_FORMAT_PROFILE: "official_format_profile",
    OFFICIAL_RULE_REFERENCE: "official_rule_reference",
    COMPATIBILITY_PROFILE: "compatibility_profile",
    ORGANIZER_RULE: "organizer_rule",
    PRODUCT_STANDARD: "product_standard",
    TECHNICAL_PARAMETER: "technical_parameter",
    ASSISTED_NOT_ENFORCED: "assisted_not_enforced",
    NO_GENERAL_CONFORMITY_CLAIM: "no_general_conformity_claim",
  });

  const CREATE_HELP_COMPLIANCE_STATUS_META = Object.freeze({
    [CREATE_HELP_COMPLIANCE_STATUSES.OFFICIAL_FORMAT_PROFILE]: Object.freeze({
      label: "Dokumentiertes offizielles Formatprofil",
    }),
    [CREATE_HELP_COMPLIANCE_STATUSES.OFFICIAL_RULE_REFERENCE]: Object.freeze({
      label: "Offizielle Regelreferenz",
    }),
    [CREATE_HELP_COMPLIANCE_STATUSES.COMPATIBILITY_PROFILE]: Object.freeze({
      label: "Kompatibilitätsprofil",
    }),
    [CREATE_HELP_COMPLIANCE_STATUSES.ORGANIZER_RULE]: Object.freeze({
      label: "Veranstalterentscheidung",
    }),
    [CREATE_HELP_COMPLIANCE_STATUSES.PRODUCT_STANDARD]: Object.freeze({
      label: "Produktstandard",
    }),
    [CREATE_HELP_COMPLIANCE_STATUSES.TECHNICAL_PARAMETER]: Object.freeze({
      label: "Technischer Parameter",
    }),
    [CREATE_HELP_COMPLIANCE_STATUSES.ASSISTED_NOT_ENFORCED]: Object.freeze({
      label: "Assistiert, nicht vollständig erzwungen",
    }),
    [CREATE_HELP_COMPLIANCE_STATUSES.NO_GENERAL_CONFORMITY_CLAIM]: Object.freeze({
      label: "Keine allgemeine Konformitätsbehauptung",
    }),
  });

  const CREATE_HELP_MODE_CONTENT = Object.freeze({
    ko: Object.freeze({
      effect: "Ein Single-Elimination-Baum wird erzeugt; nach einer Niederlage scheidet eine Person aus.",
      example: "Bei acht Personen führt der direkte KO-Baum über Viertelfinale und Halbfinale zum Finale.",
      tip: "Tipp: KO eignet sich, wenn ein kompakter Ablauf wichtiger ist als eine garantierte Mindestzahl an Matches pro Person.",
    }),
    double_ko: Object.freeze({
      effect: "Winners Bracket, Losers Bracket und Grand Final werden erzeugt; erst die zweite Niederlage beendet den Turnierlauf.",
      example: "Nach einer ersten Niederlage kann eine Person über das Losers Bracket noch das Grand Final erreichen.",
      tip: "Tipp: Doppel-KO bietet eine zweite Chance, benötigt aber mehr Zeit als ein gleich großes Single-KO.",
    }),
    league: Object.freeze({
      effect: "Ein vollständiger Round-Robin-Spielplan wird erzeugt, in dem jede Person gegen jede andere spielt.",
      example: "Bei sechs Personen entstehen 15 Ligamatches, bevor die Tabelle feststeht.",
      tip: "Tipp: Liga eignet sich für kleine Felder, wenn alle möglichst viele direkte Vergleiche spielen sollen.",
    }),
    groups_ko: Object.freeze({
      effect: "Zwei vollständige Round-Robin-Gruppen werden erzeugt; die Top 2 jeder Gruppe erreichen die Kreuz-KO-Phase.",
      example: "A1 spielt im Halbfinale gegen B2, B1 gegen A2; die Sieger erreichen das Finale.",
      tip: "Tipp: Eine gerade Teilnehmerzahl vermeidet unterschiedliche Gruppengrößen und Matchzahlen pro Person.",
    }),
    preliminary_final: Object.freeze({
      effect: "Eine begrenzte Vorrunde mit gleich vielen realen Matches je Person wird mit einer gesetzten KO- oder Doppel-KO-Finalphase kombiniert.",
      example: "Nach der Vorrundentabelle ziehen die bestplatzierten Personen in eine nach Tabellenplatz gesetzte Finalphase ein.",
      tip: "Tipp: Dieses Profil eignet sich, wenn ein vollständiges Round Robin zu lang wäre, aber alle gleich viele Vorrundenmatches erhalten sollen.",
    }),
  });

  function freezeCreateHelpTopic(topic) {
    const classification = topic.classification && typeof topic.classification === "object"
      ? Object.freeze({ ...topic.classification })
      : topic.classification || null;
    const compliance = topic.compliance && typeof topic.compliance === "object"
      ? Object.freeze({ ...topic.compliance })
      : topic.compliance || null;
    return Object.freeze({
      ...topic,
      availableModes: Object.freeze([...(topic.availableModes || [])]),
      sources: Object.freeze((topic.sources || []).map((source) => Object.freeze({ ...source }))),
      classification,
      compliance,
    });
  }

  function formatCreateHelpParticipantCount(count) {
    return String(Math.max(0, Number(count) || 0)) + " Teilnehmer erkannt";
  }

  function formatCreateHelpModeLimits(modeMeta) {
    const meta = modeMeta || MODE_PARTICIPANT_LIMITS.ko;
    return "zulässig " + meta.min + " bis " + meta.max;
  }

  function formatCreateHelpDurationEstimate(estimate) {
    return estimate?.ready
      ? "Prognose ca. " + formatDurationMinutes(estimate.likelyMinutes)
      : "Prognose noch nicht berechenbar";
  }

  function getCreateHelpDrawOrderText(draft) {
    if (draft.mode !== "ko" && draft.mode !== "double_ko") {
      return "Eingabereihenfolge ist in diesem Modus keine KO-Seed-Liste";
    }
    return draft.randomizeKoRound1
      ? "Open Draw erzeugt bei der Anlage eine gemischte Reihenfolge"
      : "Eingabereihenfolge ist aktuell die Seed-Reihenfolge";
  }

  function buildCreateHelpModeCompliance(draft) {
    if (draft.mode === "ko") {
      return {
        status: CREATE_HELP_COMPLIANCE_STATUSES.OFFICIAL_RULE_REFERENCE,
        label: "Straight Knockout mit offizieller Regelreferenz",
        description: "DRA 6.8.1 beschreibt Knockout als Grundprinzip. Zusatzregeln und konkrete Matchwerte müssen trotzdem zur veröffentlichten Turnierordnung passen.",
        scope: "Die Referenz trägt den KO-Grundmodus, nicht automatisch die gesamte lokale Konfiguration.",
        enforcement: "Die Anwendung erzeugt und führt den KO-Baum deterministisch; externe Veranstaltungsregeln werden nicht vollständig geprüft.",
      };
    }
    if (draft.mode === "league") {
      return {
        status: CREATE_HELP_COMPLIANCE_STATUSES.OFFICIAL_RULE_REFERENCE,
        label: "Round Robin mit offizieller Regelreferenz",
        description: "DRA 6.8.2 lässt Round Robin zu. Tie-Break, Matchlänge und weitere Veranstaltungsdetails bleiben gesonderte Entscheidungen.",
        scope: "Die Referenz trägt den Round-Robin-Grundmodus, nicht automatisch die gesamte lokale Konfiguration.",
        enforcement: "Die Anwendung erzeugt den vollständigen Spielplan; eine externe Turnierordnung wird nicht vollständig geprüft.",
      };
    }
    if (draft.mode === "double_ko") {
      return {
        status: CREATE_HELP_COMPLIANCE_STATUSES.ORGANIZER_RULE,
        description: "Doppel-KO ist hier ein dokumentiertes lokales Veranstalterformat und keine pauschal als PDC- oder DRA-Eventformat ausgewiesene Konfiguration.",
        scope: "Gilt für das aktuell konfigurierte lokale Turnier.",
        enforcement: "Winners Bracket, Losers Bracket und gewählte Grand-Final-Regel werden technisch umgesetzt.",
      };
    }
    if (draft.mode === "groups_ko") {
      return {
        status: CREATE_HELP_COMPLIANCE_STATUSES.ORGANIZER_RULE,
        description: "Die konkrete Kombination aus zwei Gruppen, Top 2 und Kreuz-KO liegt im dokumentierten Projektscope, nicht in einer allgemeinen Verbandszusage.",
        scope: "Unterstützt werden genau zwei vollständige Round-Robin-Gruppen mit Top 2 je Gruppe.",
        enforcement: "Gruppen und Kreuz-KO werden erzeugt; die externe Turnierordnung wird nicht vollständig geprüft.",
      };
    }
    return {
      status: CREATE_HELP_COMPLIANCE_STATUSES.ORGANIZER_RULE,
      description: "Vorrunde + Finalphase ist ein deterministisch implementiertes Veranstalterprofil ohne allgemeine PDC-, DRA-, WDF- oder Verbandskonformitätsbehauptung.",
      scope: "Gilt nur für den dokumentierten Vorrunden- und Finalphasenablauf dieses Projekts.",
      enforcement: "Paarung, Punkteprofil und Finalphasenparameter werden validiert; eine veröffentlichte Turnierordnung wird nicht ersetzt.",
    };
  }

  function buildCreateHelpPresetCompliance(draft) {
    const presetId = getAppliedCreatePresetId(draft);
    if (presetId === X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL) {
      return {
        status: CREATE_HELP_COMPLIANCE_STATUSES.OFFICIAL_FORMAT_PROFILE,
        label: "PDC-European-Tour-Rundenprofil",
        description: "Best of 11, 501, Straight In und Double Out bilden das dokumentierte European-Tour-Profil der ersten vier Runden ab.",
        scope: "Nicht umfasst sind die längeren Halbfinal- und Finaldistanzen sowie weitere Eventbedingungen.",
        enforcement: "Die Formatwerte werden angewendet. Bull-off Normal, Max Runden 50 und private Lobby bleiben technische AutoDarts-Werte.",
      };
    }
    if (presetId === X01_PRESET_PDC_501_DOUBLE_OUT_BASIC) {
      return {
        status: CREATE_HELP_COMPLIANCE_STATUSES.PRODUCT_STANDARD,
        label: "Empfohlenes lokales Produktprofil",
        description: "Die Vorlage ist für einen überschaubaren lokalen Spieleabend gedacht und kein offizielles PDC-Eventformat.",
        scope: "Gilt als lokale Einstiegsvorlage und erhält zugleich ältere gespeicherte Best-of-5-Konfigurationen kompatibel.",
        enforcement: "Die hinterlegten Werte werden vollständig angewendet; eine externe Formatkonformität wird nicht behauptet.",
      };
    }
    return {
      status: CREATE_HELP_COMPLIANCE_STATUSES.NO_GENERAL_CONFORMITY_CLAIM,
      label: "Individuelle Konfiguration ohne Konformitätsgarantie",
      description: "Custom behält manuell gewählte Werte bei und begründet keine automatische PDC-, DRA- oder Eventkonformität.",
      scope: "Maßgeblich ist die veröffentlichte Turnierordnung des konkreten Turniers.",
      enforcement: "Die Anwendung normalisiert und verwendet die Werte, prüft aber keine vollständige externe Formatordnung.",
    };
  }

  const CREATE_HELP_TOPICS = Object.freeze({
    tournamentMode: freezeCreateHelpTopic({
      id: "tournamentMode",
      title: "Turniermodus",
      shortDescription: "Der Modus legt Turnierstruktur, Spielplan, Ausscheidungslogik und die verfügbaren Zusatzregeln fest.",
      resolveCurrentSelection: ({ participants, modeMeta }) => (
        modeMeta.label + " · " + formatCreateHelpParticipantCount(participants.length) + " · " + formatCreateHelpModeLimits(modeMeta)
      ),
      resolveEffects: ({ draft }) => {
        const content = CREATE_HELP_MODE_CONTENT[draft.mode] || CREATE_HELP_MODE_CONTENT.ko;
        if (draft.mode === "ko") {
          return [
            content.effect,
            "Zusatzregeln: " + (draft.randomizeKoRound1 ? "Open Draw" : "gesetzter Draw")
              + " und Platz-3-Spiel " + (draft.enableThirdPlaceMatch ? "aktiv" : "aus") + ".",
          ];
        }
        if (draft.mode === "double_ko") {
          return [
            content.effect,
            "Zusatzregeln: " + (draft.randomizeKoRound1 ? "Open Draw" : "gesetzter Draw")
              + " und " + (sanitizeGrandFinalResetMode(draft.grandFinalResetMode) === GRAND_FINAL_RESET_IF_NEEDED
                ? "Reset-Finale falls nötig."
                : "ein einzelnes Grand Final."),
          ];
        }
        if (draft.mode === "groups_ko") {
          return [
            content.effect,
            sanitizeGroupsKoOddParticipantPolicy(draft.groupsKoOddParticipantPolicy) === GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL
              ? "Ungleiche Gruppen sind als Veranstalterregel zugelassen."
              : "Eine ungerade Teilnehmerzahl wird durch den Produktstandard blockiert.",
          ];
        }
        if (draft.mode === "preliminary_final") {
          return [
            content.effect,
            "Die Finalphase ist aktuell als " + (draft.finalStageType === FINAL_STAGE_TYPE_DOUBLE_KO ? "Doppel-KO" : "KO")
              + " mit Best of " + draft.finalStageBestOfLegs + " konfiguriert.",
          ];
        }
        return [content.effect, "Für Liga werden keine KO-spezifischen Zusatzregeln eingeblendet."];
      },
      examples: ({ draft }) => [(CREATE_HELP_MODE_CONTENT[draft.mode] || CREATE_HELP_MODE_CONTENT.ko).example],
      tips: ({ draft }) => [(CREATE_HELP_MODE_CONTENT[draft.mode] || CREATE_HELP_MODE_CONTENT.ko).tip],
      dependencies: [
        "Der Modus bestimmt Mindest- und Höchstzahl der Teilnehmer.",
        "Der Modus bestimmt die sichtbaren und wirksamen Zusatzregeln.",
        "Modus und Teilnehmerzahl beeinflussen Spielanzahl und Zeitprognose.",
        "Die Wahl eines fachlichen Presets kann den Modus ändern.",
      ],
      limitations: [
        "Die Modusbezeichnung allein bestätigt keine vollständige Konformität mit einer externen Turnierordnung.",
      ],
      classification: {
        label: "Turnierformat",
        description: "Die Einstellung wählt die grundlegende lokale Turnierstruktur.",
      },
      compliance: ({ draft }) => buildCreateHelpModeCompliance(draft),
      sources: [
        { label: "Einsteigerleitfaden - Turniermodi", href: README_TOURNAMENT_MODES_URL },
        { label: "DRA-Regeln in der GUI - KO, Round Robin und Veranstalterformate", href: DRA_GUI_RULE_MODE_FORMATS_URL },
      ],
    }),
    presetFormat: freezeCreateHelpTopic({
      id: "presetFormat",
      title: "Preset und Formatprofil",
      shortDescription: "Eine Formatvorlage setzt Turnierart, Matchlänge und wichtige X01-Regeln gemeinsam. Manuell behält deine aktuellen Werte bei.",
      resolveCurrentSelection: ({ draft, modeMeta }) => {
        const presetId = getAppliedCreatePresetId(draft);
        const bestOf = draft.mode === "preliminary_final" ? draft.finalStageBestOfLegs : draft.bestOfLegs;
        return getCreatePresetLabel(presetId) + " · " + modeMeta.label + " · Best of " + bestOf + " · "
          + draft.startScore + " · " + draft.x01InMode + " In · " + draft.x01OutMode + " Out";
      },
      resolveEffects: ({ draft }) => {
        const presetId = getAppliedCreatePresetId(draft);
        if (presetId === X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL) {
          return [
            "Diese Vorlage setzt KO, Best of 11, 501, Straight In, Double Out und die hinterlegten technischen Lobbywerte. Sie gilt nur für die European-Tour-Runden 1 bis 4.",
          ];
        }
        if (presetId === X01_PRESET_PDC_501_DOUBLE_OUT_BASIC) {
          return [
            "Die lokale Vorlage setzt KO, Best of 5, 501, Straight In und Double Out. Ein Match gewinnt, wer zuerst drei Legs gewinnt.",
          ];
        }
        return [
          "Custom setzt keine Sachwerte zurück; die aktuelle manuelle Konfiguration bleibt erhalten.",
        ];
      },
      examples: ({ draft }) => {
        const presetId = getAppliedCreatePresetId(draft);
        if (presetId === X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL) {
          return ["European Tour bildet Best of 11 als First to 6 Legs ab; Halbfinal- und Finaldistanzen des Events sind nicht Teil dieses Presets."];
        }
        if (presetId === X01_PRESET_PDC_501_DOUBLE_OUT_BASIC) {
          return ["Best of 5 bedeutet hier: Wer zuerst drei Legs gewinnt, gewinnt das Match. Gespielt wird 501 mit Double Out."];
        }
        return ["Custom kann zum Beispiel Best of " + draft.bestOfLegs + " mit " + draft.startScore + " Startpunkten beibehalten."];
      },
      tips: [
        "Tipp: Wähle zuerst das passende Preset und passe Sonderwerte danach an.",
        "Tipp: Eine manuelle Änderung an einem Preset-Wert aktiviert Custom; Custom setzt nichts zurück.",
      ],
      dependencies: [
        "Preset und Modus werden gemeinsam abgeglichen.",
        "Preset steuert Best of, Startpunkte sowie In- und Out-Modus.",
        "Preset steuert Bull-off, Bull-Modus und Max Runden als technische Lobbywerte.",
        "Eine manuelle Änderung an einem Preset-relevanten Wert aktiviert Custom.",
      ],
      limitations: [
        "Die lokale Best-of-5-Vorlage ist kein offizielles PDC-Eventformat.",
        "Custom besitzt keine automatische Konformitätsgarantie.",
        "European Tour bildet nur den ausdrücklich beschriebenen Runden-Scope ab.",
      ],
      classification: {
        label: "Format- oder Kompatibilitätsprofil",
        description: "Presets bündeln fachliche Formatwerte und technische AutoDarts-Werte, ohne beide gleichzusetzen.",
      },
      compliance: ({ draft }) => buildCreateHelpPresetCompliance(draft),
      sources: [
        { label: "Veranstalter-Handbuch - Formatvorlagen", href: README_PRESET_CATALOG_URL },
        { label: "Begriffe - Best of, First to und X01", href: GLOSSARY_DOC_URL },
        { label: "PDC/DRA Compliance-Mapping - Preset-Logik", href: PDC_DRA_COMPLIANCE_PRESET_URL },
        { label: "PDC Europe - European Darts Open 2026 Format", href: PDC_EUROPEAN_TOUR_FORMAT_URL },
      ],
    }),
    participants: freezeCreateHelpTopic({
      id: "participants",
      title: "Teilnehmerliste",
      shortDescription: "Eine Zeile entspricht einer erkannten Person. Anzahl und Reihenfolge wirken auf Moduslimits, Draw und Spielplan.",
      resolveCurrentSelection: ({ draft, participants, modeMeta }) => (
        formatCreateHelpParticipantCount(participants.length) + " · " + modeMeta.label + " erlaubt "
          + modeMeta.min + " bis " + modeMeta.max + " · " + getCreateHelpDrawOrderText(draft)
      ),
      resolveEffects: ({ draft }) => [
        "Die erkannten Zeilen bilden das Teilnehmerfeld für die Turnieranlage.",
        draft.mode === "ko" || draft.mode === "double_ko"
          ? (draft.randomizeKoRound1
            ? "Open Draw erzeugt aus dem Feld eine gemischte Erstrundenreihenfolge."
            : "Beim gesetzten Draw wird die sichtbare Eingabereihenfolge als Seed-Reihenfolge verwendet.")
          : "In diesem Modus wird die Eingabereihenfolge nicht als KO-Seed-Liste verwendet.",
        "Teilnehmer mischen verändert die sichtbare Reihenfolge vor der Anlage.",
      ],
      examples: ({ draft, participants }) => {
        const first = participants[0]?.name || "Anna";
        const second = participants[1]?.name || "Boris";
        return [draft.randomizeKoRound1
          ? first + " vor " + second + " ist nur die Eingabereihenfolge; Open Draw darf sie bei der Anlage neu ordnen."
          : first + " in Zeile 1 und " + second + " in Zeile 2 bedeutet im gesetzten KO-Draw Seed 1 und Seed 2."];
      },
      tips: [
        "Tipp: Verwende eindeutige und gut erkennbare Namen.",
        "Tipp: Prüfe die Reihenfolge bewusst, bevor du einen gesetzten Draw anlegst.",
        "Tipp: Mische nur, wenn eine zufällige sichtbare Reihenfolge gewünscht ist.",
      ],
      dependencies: [
        "Teilnehmerzahl und Modus bestimmen, ob die Grenzwerte eingehalten werden.",
        "Teilnehmerzahl beeinflusst Spielanzahl und Dauerprognose.",
        "Teilnehmerzahl bestimmt Gruppenverteilung und zulässige Vorrundenkonfigurationen.",
        "Eingabereihenfolge und Draw-Modus bestimmen die Seed-Wirkung.",
      ],
      limitations: [
        "Leere Zeilen werden ignoriert; doppelte oder reservierte Namen werden vor der Anlage sichtbar blockiert.",
        "Die Anwendung prüft keine vollständige externe Setz- oder Meldeordnung.",
      ],
      classification: {
        label: "Anwendungseingabe und mögliche Setzreihenfolge",
        description: "Die Liste ist lokale Eingabe; ihre fachliche Bedeutung hängt vom gewählten Modus und Draw ab.",
      },
      compliance: {
        status: CREATE_HELP_COMPLIANCE_STATUSES.ASSISTED_NOT_ENFORCED,
        description: "Teilnehmerfeld und Reihenfolge müssen zur veröffentlichten Turnierordnung passen.",
        scope: "Die Anwendung prüft Modusgrenzen beim Anlegen, aber keine vollständige externe Melde- oder Setzordnung.",
        enforcement: "Die erkannten Einträge und ihre Reihenfolge werden technisch verwendet; darüber hinaus bleibt die Turnierleitung verantwortlich.",
      },
      sources: [
        { label: "Einsteigerleitfaden - Turnier anlegen", href: README_TOURNAMENT_CREATE_URL },
        { label: "DRA-Regeln in der GUI - Teilnehmerlimits und Veranstalterermessen", href: DRA_GUI_RULE_PARTICIPANT_LIMITS_URL },
      ],
    }),
    koDraw: freezeCreateHelpTopic({
      id: "koDraw",
      title: "Auslosung der ersten KO-Runde",
      availableModes: ["ko", "double_ko"],
      shortDescription: "Open Draw erzeugt bei der Anlage eine gemischte Reihenfolge; beim gesetzten Draw bleibt die Eingabereihenfolge die Seed-Reihenfolge.",
      resolveCurrentSelection: ({ draft, participants }) => (
        (draft.randomizeKoRound1 ? "Open Draw" : "Gesetzter Draw") + " · "
          + participants.length + " Teilnehmer · " + getCreateHelpDrawOrderText(draft)
      ),
      resolveEffects: ({ draft, participants }) => [
        draft.randomizeKoRound1
          ? "Die erste KO-Runde wird aus einer bei der Anlage erzeugten Open-Draw-Reihenfolge aufgebaut."
          : "Erstrunde und Bye-Verteilung folgen dem projektinternen Seed-Placement auf Basis der Eingabereihenfolge.",
        participants.length > 0 && (participants.length & (participants.length - 1)) !== 0
          ? "Mit " + participants.length + " Teilnehmern enthält der nächste größere KO-Baum Freilose."
          : "Die aktuelle Teilnehmerzahl benötigt im vollständigen KO-Baum keine strukturellen Freilose.",
      ],
      examples: ({ draft, participants }) => {
        if (!draft.randomizeKoRound1 && participants.length === 9) {
          return ["Bei neun gesetzten Personen wird ein 16er-Baum verwendet; das projektinterne Seed-Placement verteilt sieben Freilose."];
        }
        return [draft.randomizeKoRound1
          ? "Bei acht Personen wird eine Open-Draw-Reihenfolge erzeugt; dies ist keine externe Live-Ziehung."
          : "Bei acht Personen bleibt Zeile 1 Seed 1, Zeile 2 Seed 2 und so weiter."];
      },
      tips: [
        "Tipp: Verwende den gesetzten Draw, wenn eine feste Setzliste vorliegt.",
        "Tipp: Verwende Open Draw, wenn die Startreihenfolge bewusst gemischt werden soll.",
        "Tipp: Prüfe die Teilnehmerliste unmittelbar vor der Anlage.",
      ],
      dependencies: [
        "Draw-Modus und Teilnehmerreihenfolge bestimmen die Erstrunden-Seed-Wirkung.",
        "Teilnehmer mischen verändert die Eingabereihenfolge.",
        "Teilnehmerzahl und Seed-Placement bestimmen strukturelle Freilose.",
        "Das Thema ist nur in KO und Doppel-KO verfügbar.",
      ],
      limitations: [
        "Open Draw ist keine externe oder öffentlich beobachtete Live-Ziehung.",
        "Die Auswahl allein garantiert keine vollständige Konformität mit einer Eventordnung.",
      ],
      classification: {
        label: "Draw-Konfiguration",
        description: "Die Einstellung wählt die technische Erzeugung der ersten KO-Reihenfolge.",
      },
      compliance: {
        status: CREATE_HELP_COMPLIANCE_STATUSES.ASSISTED_NOT_ENFORCED,
        description: "DRA 6.12.1 verlangt einen vom Veranstalter durchgeführten und anschließend stabilen Draw; die konkrete Open-Draw- oder Setzentscheidung bleibt Teil der Turnierordnung.",
        scope: "Die Anwendung dokumentiert die Auswahl und speichert den erzeugten Draw im lokalen Turnier.",
        enforcement: "Draw-Stabilität wird im implementierten Draw-Lock-Scope unterstützt; eine externe Ziehung oder vollständige Eventprüfung findet nicht statt.",
      },
      sources: [
        { label: "Einsteigerleitfaden - KO und Doppel-KO", href: README_TOURNAMENT_MODES_URL },
        { label: "DRA-Regeln in der GUI - Draw und Stabilität (DRA 6.12.1, Seite 19)", href: DRA_GUI_RULE_OPEN_DRAW_URL },
        { label: "DRA-Regeln in der GUI - Freilos und projektinternes Seed-Placement", href: DRA_GUI_RULE_BYE_URL },
      ],
    }),
    thirdPlace: freezeCreateHelpTopic({
      id: "thirdPlace",
      title: "Spiel um Platz 3",
      availableModes: ["ko"],
      shortDescription: "Diese optionale KO-Zusatzregel erzeugt ein separates Match zwischen den beiden Halbfinalverlierern.",
      resolveCurrentSelection: ({ draft, participants }) => (
        (draft.enableThirdPlaceMatch ? "Aktiv" : "Aus") + " · " + participants.length + " Teilnehmer · "
          + (draft.enableThirdPlaceMatch ? "ein zusätzliches Match vorgesehen" : "kein zusätzliches Match")
      ),
      resolveEffects: ({ draft }) => [
        draft.enableThirdPlaceMatch
          ? "Nach ausgespielten Halbfinals entsteht ein zusätzliches Platz-3-Match; das Hauptfinale bleibt unverändert."
          : "Der KO-Baum endet ohne separates Platzierungs-Match mit dem Hauptfinale.",
        "Die Option verändert Spielanzahl und Zeitprognose.",
      ],
      examples: ({ draft }) => [draft.enableThirdPlaceMatch
        ? "Ein Acht-Personen-KO umfasst sieben Hauptbaum-Matches plus ein Platz-3-Match."
        : "Ein Acht-Personen-KO umfasst ohne Platz-3-Spiel sieben Hauptbaum-Matches."],
      tips: [
        "Tipp: Aktiviere das Match nur, wenn die konkrete Turnierordnung eine Platzierung vorsieht.",
        "Tipp: Plane den zusätzlichen Zeitbedarf ein.",
      ],
      dependencies: [
        "Die Option ist nur im Modus KO verfügbar.",
        "Ein Platz-3-Match benötigt zwei ausgespielte Halbfinals.",
        "Die Option beeinflusst Spielanzahl und Dauerprognose.",
        "Ein Moduswechsel macht dieses Thema ungültig.",
      ],
      limitations: [
        "Das Platz-3-Spiel ist keine allgemeine PDC- oder DRA-Pflicht.",
      ],
      classification: {
        label: "Zusätzliche Turnierregel",
        description: "Die Einstellung ergänzt den KO-Hauptbaum um eine lokale Platzierungsentscheidung.",
      },
      compliance: {
        status: CREATE_HELP_COMPLIANCE_STATUSES.ORGANIZER_RULE,
        description: "Das Platz-3-Spiel ist eine optionale Veranstalterentscheidung und keine allgemeine PDC- oder DRA-Pflicht.",
        scope: "Gilt nur für das aktuell konfigurierte Single-Elimination-KO.",
        enforcement: "Die Anwendung erzeugt das Match und hält es vom Champion-Pfad getrennt; die externe Turnierordnung wird nicht geprüft.",
      },
      sources: [
        { label: "Einsteigerleitfaden - KO und Spiel um Platz 3", href: README_TOURNAMENT_MODES_URL },
        { label: "DRA-Regeln in der GUI - Platz 3 und separate Turnierregeln", href: DRA_GUI_RULE_THIRD_PLACE_URL },
      ],
    }),
    grandFinal: freezeCreateHelpTopic({
      id: "grandFinal",
      title: "Doppel-KO Grand Final",
      availableModes: ["double_ko"],
      shortDescription: "Die Reset-Variante kann ein zweites Finale erzeugen; die Einzelmatch-Variante beendet das Turnier nach einem Grand Final.",
      resolveCurrentSelection: ({ draft, participants }) => {
        const reset = sanitizeGrandFinalResetMode(draft.grandFinalResetMode) === GRAND_FINAL_RESET_IF_NEEDED;
        return (reset ? "Reset-Finale falls nötig" : "Ein einzelnes Grand Final") + " · "
          + participants.length + " Teilnehmer · " + (reset ? "bis zu 2 Finalmatches" : "1 Finalmatch");
      },
      resolveEffects: ({ draft }) => [
        sanitizeGrandFinalResetMode(draft.grandFinalResetMode) === GRAND_FINAL_RESET_IF_NEEDED
          ? "Gewinnt der Losers-Bracket-Sieger das erste Grand Final, wird ein zweites und entscheidendes Finale aktiviert."
          : "Das Turnier endet nach einem Grand Final; diese Variante verkürzt den klassischen Doppel-KO-Ablauf bewusst.",
        "Die Auswahl beeinflusst mögliche Spielanzahl und Dauerprognose.",
      ],
      examples: ({ draft }) => [sanitizeGrandFinalResetMode(draft.grandFinalResetMode) === GRAND_FINAL_RESET_IF_NEEDED
        ? "Der Losers-Bracket-Sieger gewinnt Finale 1: Ein Reset-Finale entscheidet anschließend den Turniersieg."
        : "Unabhängig vom Weg der Finalisten entscheidet genau ein Grand Final den Turniersieg."],
      tips: [
        "Tipp: Nutze Reset falls nötig für das klassische Doppel-KO-Verständnis.",
        "Tipp: Wähle das Einzelmatch nur als bewusst verkürzte Veranstaltervariante.",
        "Tipp: Berücksichtige das mögliche zweite Finale in der Zeitplanung.",
      ],
      dependencies: [
        "Die Grand-Final-Regel ist nur im Modus Doppel-KO verfügbar.",
        "Die Auswahl beeinflusst mögliche Spielanzahl und Dauerprognose.",
        "Ein Moduswechsel macht dieses Thema ungültig.",
      ],
      limitations: ({ draft }) => [
        sanitizeGrandFinalResetMode(draft.grandFinalResetMode) === GRAND_FINAL_RESET_SINGLE_MATCH
          ? "Ein einzelnes Grand Final ist ausdrücklich eine verkürzte Variante und kein vollständiges klassisches Doppel-KO."
          : "Die Reset-Regel allein begründet keine allgemeine PDC- oder DRA-Eventkonformität.",
      ],
      classification: {
        label: "Doppel-KO-Veranstalterregel",
        description: "Die Einstellung bestimmt den lokalen Abschluss des Doppel-KO-Baums.",
      },
      compliance: ({ draft }) => ({
        status: CREATE_HELP_COMPLIANCE_STATUSES.ORGANIZER_RULE,
        label: sanitizeGrandFinalResetMode(draft.grandFinalResetMode) === GRAND_FINAL_RESET_SINGLE_MATCH
          ? "Verkürzte Veranstaltervariante"
          : "Dokumentierte Doppel-KO-Veranstalterregel",
        description: "Die Auswahl besitzt keine pauschale PDC- oder DRA-Eventkonformität.",
        scope: "Gilt für den Abschluss des aktuell konfigurierten lokalen Doppel-KO.",
        enforcement: "Die Anwendung erzeugt ein Reset-Finale bedarfsgesteuert oder beendet das Turnier nach dem gewählten Einzelmatch.",
      }),
      sources: [
        { label: "Einsteigerleitfaden - Doppel-KO", href: README_TOURNAMENT_MODES_URL },
        { label: "PDC/DRA Compliance-Mapping - KO und Veranstalterregeln", href: PDC_DRA_COMPLIANCE_KO_URL },
      ],
    }),
    groupsKoOddParticipants: freezeCreateHelpTopic({
      id: "groupsKoOddParticipants",
      title: "Ungerade Teilnehmerzahl in Gruppenphase + KO",
      availableModes: ["groups_ko"],
      shortDescription: "Gerade Felder ergeben zwei gleich große Gruppen. Ungleiche Gruppen sind nur als ausdrücklich bestätigte Veranstalterregel zulässig.",
      resolveCurrentSelection: ({ draft, participants, groupAnalysis }) => {
        const policy = sanitizeGroupsKoOddParticipantPolicy(draft.groupsKoOddParticipantPolicy);
        const confirmation = !groupAnalysis.isOdd
          ? "keine Bestätigung erforderlich"
          : policy === GROUPS_KO_ODD_PARTICIPANT_POLICY_REQUIRE_EVEN
            ? "Anlage wird blockiert"
            : draft.groupsKoOddParticipantAcknowledged
              ? "Bestätigung erteilt"
              : "Bestätigung noch erforderlich";
        return participants.length + " Teilnehmer · Gruppe A: " + groupAnalysis.groupASize
          + ", Gruppe B: " + groupAnalysis.groupBSize + " · "
          + (policy === GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL
            ? "ungleiche Gruppen zugelassen"
            : "nur gerade Teilnehmerzahl") + " · " + confirmation;
      },
      resolveEffects: ({ draft, groupAnalysis }) => {
        const policy = sanitizeGroupsKoOddParticipantPolicy(draft.groupsKoOddParticipantPolicy);
        return [
          "Gruppe A: " + groupAnalysis.groupASize + " Personen, "
            + groupAnalysis.groupAMatchesPerPlayer + " Matches je Person, Top "
            + groupAnalysis.groupAQualifierCount + " qualifizieren sich.",
          "Gruppe B: " + groupAnalysis.groupBSize + " Personen, "
            + groupAnalysis.groupBMatchesPerPlayer + " Matches je Person, Top "
            + groupAnalysis.groupBQualifierCount + " qualifizieren sich.",
          groupAnalysis.isOdd && policy === GROUPS_KO_ODD_PARTICIPANT_POLICY_REQUIRE_EVEN
            ? "Die ungerade Teilnehmerzahl blockiert die Anlage."
            : groupAnalysis.isOdd && !draft.groupsKoOddParticipantAcknowledged
              ? "Die Anlage bleibt bis zur ausdrücklichen Bestätigung der Veranstalterregel blockiert."
              : "Die aktuelle Gruppenpolicy ist für die Anlage vollständig bestätigt.",
        ];
      },
      examples: [
        "Acht Personen ergeben Gruppe A und B mit je vier Personen; jede Person spielt drei Gruppenmatches.",
        "Neun Personen ergeben Gruppe A mit fünf und Gruppe B mit vier Personen; dadurch entstehen vier beziehungsweise drei Gruppenmatches je Person.",
      ],
      tips: [
        "Tipp: Bevorzuge eine gerade Teilnehmerzahl, wenn gleich große Gruppen gewünscht sind.",
        "Tipp: Erlaube ungleiche Gruppen nur mit passender veröffentlichter Turnierordnung.",
        "Tipp: Prüfe Matchzahlen und Qualifikationsquoten vor der Anlage.",
      ],
      dependencies: [
        "Teilnehmerzahl bestimmt Gruppengrößen und Matches je Person.",
        "Gruppenpolicy und ungerade Teilnehmerzahl bestimmen, ob eine Bestätigung erforderlich ist.",
        "Gruppengröße bestimmt die Qualifikationsquote bei Top 2.",
        "Das Thema ist nur in Gruppenphase + KO verfügbar.",
      ],
      limitations: [
        "Unterstützt werden genau zwei vollständige Round-Robin-Gruppen mit Top 2 und Kreuz-KO.",
        "Ungleiche Gruppen beseitigen unterschiedliche Matchzahlen und Qualifikationsquoten nicht.",
        "Die Auswahl begründet keine allgemeine Verbandskonformität.",
      ],
      classification: {
        label: "Produktstandard oder Veranstalterregel",
        description: "Gerade Felder sind der sichere Produktstandard; ungleiche Gruppen benötigen eine bewusste Veranstalterentscheidung.",
      },
      compliance: ({ draft, groupAnalysis }) => {
        const allowUnequal = sanitizeGroupsKoOddParticipantPolicy(draft.groupsKoOddParticipantPolicy)
          === GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL;
        return {
          status: allowUnequal
            ? CREATE_HELP_COMPLIANCE_STATUSES.ORGANIZER_RULE
            : CREATE_HELP_COMPLIANCE_STATUSES.PRODUCT_STANDARD,
          label: allowUnequal ? "Ausdrückliche Veranstalterregel" : "Sicherer Produktstandard",
          description: allowUnequal
            ? "Ungleiche Gruppen sind keine DRA-Universalregel und müssen zur konkreten Turnierordnung passen."
            : "Die Anwendung verlangt gleich große Gruppen; dies ist ein Produktstandard und keine allgemeine DRA-Pflicht.",
          scope: "Der unterstützte Scope umfasst zwei Gruppen mit Top 2 und anschließender Kreuz-KO-Phase.",
          enforcement: groupAnalysis.isOdd && allowUnequal
            ? "Die Anwendung erzwingt die ausdrückliche Bestätigung, prüft aber nicht die vollständige externe Turnierordnung."
            : "Die Anwendung blockiert ungerade Felder, solange der Produktstandard aktiv ist.",
        };
      },
      sources: [
        { label: "DRA-Regeln in der GUI - Gruppenphase und Veranstalterprofil", href: DRA_GUI_RULE_MODE_FORMATS_URL },
        { label: "PDC/DRA Compliance-Mapping - Gruppenauflösung", href: PDC_DRA_COMPLIANCE_GROUPS_URL },
      ],
    }),
    preliminaryFinal: freezeCreateHelpTopic({
      id: "preliminaryFinal",
      title: "Vorrunde und Finalphase",
      availableModes: ["preliminary_final"],
      shortDescription: "Dieses Veranstalterprofil kombiniert gleich viele reale Zwei-Leg-Vorrundenmatches je Person mit einer gesetzten KO- oder Doppel-KO-Finalphase.",
      resolveCurrentSelection: ({ draft, participants, preliminaryAnalysis }) => (
        participants.length + " Teilnehmer · " + draft.preliminaryMatchesPerParticipant
          + " Vorrundenmatches je Person · "
          + (preliminaryAnalysis.ok ? preliminaryAnalysis.totalMatches : "Gesamtzahl noch nicht berechenbar")
          + (preliminaryAnalysis.ok ? " Vorrundenmatches gesamt" : "") + " · Punkte "
          + draft.preliminaryWinPoints + "/" + draft.preliminaryDrawPoints + "/" + draft.preliminaryLossPoints
          + " · Top " + draft.finalStageQualifierCount + " in "
          + (draft.finalStageType === FINAL_STAGE_TYPE_DOUBLE_KO ? "Doppel-KO" : "KO")
          + " · Finalphase Best of " + draft.finalStageBestOfLegs
      ),
      resolveEffects: ({ draft, preliminaryAnalysis }) => [
        "Jedes Vorrundenmatch spielt genau zwei Legs; ein 1:1 ist möglich.",
        preliminaryAnalysis.ok
          ? "Jede Person spielt " + preliminaryAnalysis.matchCount + " reale Matches gegen verschiedene Gegner; insgesamt entstehen "
            + preliminaryAnalysis.totalMatches + " Vorrundenmatches."
          : "Die aktuelle Kombination ist noch nicht zulässig: " + preliminaryAnalysis.message,
        "Die Finalphase wird nach Tabellenplatz gesetzt und verwendet getrennt Best of " + draft.finalStageBestOfLegs + ".",
      ],
      examples: ({ draft, participants, preliminaryAnalysis }) => [
        preliminaryAnalysis.ok
          ? participants.length + " Teilnehmer mit " + draft.preliminaryMatchesPerParticipant
            + " Vorrundenmatches je Person ergeben " + preliminaryAnalysis.totalMatches
            + " Vorrundenmatches; Top " + draft.finalStageQualifierCount + " wechseln danach in "
            + (draft.finalStageType === FINAL_STAGE_TYPE_DOUBLE_KO ? "Doppel-KO" : "KO") + "."
          : (participants.length || 0) + " Teilnehmer mit " + draft.preliminaryMatchesPerParticipant
            + " Vorrundenmatches je Person sind noch kein gültiges Beispiel: " + preliminaryAnalysis.message,
      ],
      tips: [
        "Tipp: Passe die Vorrundenmatchzahl an die zulässigen Werte der Teilnehmerzahl an.",
        "Tipp: Lege Punkteprofil und Qualifikantenzahl vor Turnierstart bewusst fest.",
        "Tipp: Plane die eigene Matchlänge der Finalphase in der Gesamtdauer ein.",
      ],
      dependencies: [
        "Teilnehmerzahl bestimmt die zulässigen Vorrundenmatchzahlen und die Gesamtspielzahl.",
        "Punkteprofil bestimmt die Vorrundentabelle.",
        "Qualifikantenzahl und Finalphasentyp bestimmen den Finalbaum.",
        "Best of der Finalphase beeinflusst die Dauerprognose.",
        "Das Thema ist nur in Vorrunde + Finalphase verfügbar.",
      ],
      limitations: [
        "Das Profil ist keine allgemeine PDC-, DRA-, WDF- oder Verbandsregel.",
        "Technische Validierung ersetzt keine veröffentlichte Turnierordnung.",
        "Fixed-2-Legs-Vorrunden werden wegen der dokumentierten API-Grenze nicht automatisch als Lobby gestartet.",
      ],
      classification: {
        label: "Deterministisches Veranstalterprofil",
        description: "Paarung, Punkte, Qualifikation und Finalphase bilden eine gespeicherte lokale Turnierregel.",
      },
      compliance: {
        status: CREATE_HELP_COMPLIANCE_STATUSES.ORGANIZER_RULE,
        description: "Vorrunde + Finalphase besitzt keine allgemeine PDC-, DRA-, WDF- oder Verbandskonformität.",
        scope: "Gilt für den dokumentierten regulären Paarungsplan, Fixed-2-Legs und die gesetzte Finalphase.",
        enforcement: "Mathematische Verteilung und Parameter werden technisch validiert; die externe Turnierordnung bleibt Verantwortung der Turnierleitung.",
      },
      sources: [
        { label: "Einsteigerleitfaden - Vorrunde und Finalphase", href: README_TOURNAMENT_MODES_URL },
        { label: "PDC/DRA Compliance-Mapping - Vorrunde + Finalphase", href: PDC_DRA_COMPLIANCE_PRELIMINARY_FINAL_URL },
      ],
    }),
    gameRules: freezeCreateHelpTopic({
      id: "gameRules",
      title: "Spielregeln und X01",
      shortDescription: "Hier legst du fest, wie ein Match gewonnen, begonnen und beendet wird. Diese Werte beeinflussen außerdem die Zeitprognose.",
      resolveCurrentSelection: ({ gameRulesSummary }) => (
        gameRulesSummary.presetLabel + " · " + gameRulesSummary.text
      ),
      resolveEffects: ({ draft }) => {
        const effectiveBestOf = draft.mode === "preliminary_final" ? draft.finalStageBestOfLegs : draft.bestOfLegs;
        return [
          "Best of " + effectiveBestOf + " bedeutet First to " + getLegsToWin(effectiveBestOf)
            + " Legs" + (draft.mode === "preliminary_final" ? " in der Finalphase." : "."),
          "Startpunkte, In, Out, Bull-off, wirksamer Bull-Modus und Max Runden fließen in Lobby und Zeitprognose ein.",
          draft.x01BullOffMode === "Off"
            ? "Bull-off ist aus; der gespeicherte Bull-Modus ist deshalb nicht wirksam."
            : "Bull-off " + draft.x01BullOffMode + " aktiviert den Bull-Modus " + draft.x01BullMode + ".",
          "Eine manuelle Änderung an einem Preset-relevanten Wert aktiviert Custom.",
        ];
      },
      examples: ({ draft }) => {
        const effectiveBestOf = draft.mode === "preliminary_final" ? draft.finalStageBestOfLegs : draft.bestOfLegs;
        return [
          "Best of " + effectiveBestOf + " entspricht First to " + getLegsToWin(effectiveBestOf) + ".",
          draft.x01BullOffMode === "Off"
            ? "Bull-off Off bedeutet: Bull-Modus " + draft.x01BullMode + " bleibt gespeichert, ist aber nicht wirksam."
            : "Bull-off " + draft.x01BullOffMode + " verwendet aktuell Bull " + draft.x01BullMode + ".",
        ];
      },
      tips: [
        "Tipp: Wähle zuerst ein Preset und passe danach nur notwendige Sonderwerte an.",
        "Tipp: Stimme Matchlänge und Zeitprofil auf den verfügbaren Zeitraum ab.",
        "Tipp: Prüfe Double Out bewusst und verwechsle technische Lobbywerte nicht mit offiziellen Formatregeln.",
      ],
      dependencies: [
        "Preset und X01-Werte werden gemeinsam abgeglichen.",
        "Best of bestimmt First to und beeinflusst die Dauerprognose.",
        "Bull-off bestimmt, ob der Bull-Modus wirksam ist.",
        "Vorrunde + Finalphase verwendet ein getrenntes Finalphasen-Best-of.",
        "Manuelle Änderungen aktivieren Custom.",
      ],
      limitations: [
        "Bull-off Normal und Max Runden sind technische AutoDarts-Werte und keine automatische PDC-Formatregel.",
        "Custom besitzt keine automatische Konformitätsgarantie.",
      ],
      classification: {
        label: "Formatwerte und technische Lobbyparameter",
        description: "Startscore, In/Out und Matchlänge können Formatbestandteile sein; Bull-off-Mapping und Max Runden sind technische Produktwerte.",
      },
      compliance: ({ draft }) => buildCreateHelpPresetCompliance(draft),
      sources: [
        { label: "Einsteigerleitfaden - Spielregeln", href: README_TOURNAMENT_CREATE_URL },
        { label: "Begriffe - Legs, X01, In, Out und Bull-off", href: GLOSSARY_DOC_URL },
        { label: "PDC/DRA Compliance-Mapping - Preset-Logik und technische Abgrenzung", href: PDC_DRA_COMPLIANCE_PRESET_URL },
        { label: "PDC Europe - European Darts Open 2026 Format", href: PDC_EUROPEAN_TOUR_FORMAT_URL },
      ],
    }),
    boardCount: freezeCreateHelpTopic({
      id: "boardCount",
      title: "Boards für die Zeitprognose",
      shortDescription: "Die Board-Anzahl begrenzt ausschließlich die gleichzeitig planbaren Matches der deterministischen Zeitprognose.",
      resolveCurrentSelection: ({ draft, participants, modeMeta, durationEstimate }) => {
        const boards = sanitizeTournamentBoardCount(draft.boardCount, TOURNAMENT_DURATION_DEFAULT_BOARD_COUNT);
        return boards + (boards === 1 ? " Board" : " Boards") + " · " + participants.length
          + " Teilnehmer · " + modeMeta.label + " · " + formatCreateHelpDurationEstimate(durationEstimate);
      },
      resolveEffects: ({ draft, durationEstimate }) => {
        const boards = sanitizeTournamentBoardCount(draft.boardCount, TOURNAMENT_DURATION_DEFAULT_BOARD_COUNT);
        return [
          boards + (boards === 1 ? " Board begrenzt" : " Boards begrenzen")
            + " die Zahl gleichzeitig planbarer Matches auf höchstens " + boards + ".",
          "Bracket-Abhängigkeiten und Spielerkonflikte können die tatsächliche Parallelität weiter reduzieren.",
          durationEstimate?.ready
            ? "Aktuell plant das Modell " + durationEstimate.matchCount + " Matches in "
              + durationEstimate.scheduleWaves + " Match-Wellen."
            : "Die konkrete Prognose startet erst mit einer für den Modus gültigen Teilnehmerkonfiguration.",
        ];
      },
      examples: ({ draft }) => {
        const boards = sanitizeTournamentBoardCount(draft.boardCount, TOURNAMENT_DURATION_DEFAULT_BOARD_COUNT);
        return [boards + (boards === 1 ? " Board erlaubt" : " Boards erlauben")
          + " höchstens " + boards + " gleichzeitig planbare "
          + (boards === 1 ? "Match" : "Matches") + ", sofern Abhängigkeiten und Spielerkonflikte dies zulassen."];
      },
      tips: [
        "Tipp: Trage nur tatsächlich verfügbare Boards ein.",
        "Tipp: Verwende keine künstlich hohe Zahl, wenn Spieler oder Ablauf die Parallelität nicht tragen.",
        "Tipp: Behandle die Ausgabe als Planungswert.",
      ],
      dependencies: [
        "Board-Anzahl und Zeitprofil bestimmen die Dauerprognose gemeinsam.",
        "Modus und Bracket-Abhängigkeiten begrenzen die mögliche Parallelität.",
        "Teilnehmerzahl bestimmt die Spielanzahl.",
        "Best of und X01-Werte beeinflussen die angenommene Matchdauer.",
      ],
      limitations: [
        "Die Board-Anzahl aktiviert kein MultiBoard.",
        "Es gibt keine Board-Zuweisung, parallele Lobbyverwaltung oder mehrere gleichzeitig gestartete Matches.",
      ],
      classification: {
        label: "Technischer Planungsparameter",
        description: "Der Wert gehört ausschließlich zum Prognosemodell und nicht zu den Matchregeln.",
      },
      compliance: {
        status: CREATE_HELP_COMPLIANCE_STATUSES.TECHNICAL_PARAMETER,
        description: "Die Board-Anzahl ist keine PDC- oder DRA-Regel und besitzt keine eigene Konformitätsaussage.",
        scope: "Sie gilt nur als Kapazitätsgrenze der lokalen Zeitprognose.",
        enforcement: "Das Prognosemodell begrenzt parallele Planungswellen; reale Boards oder Lobbys werden nicht gesteuert.",
      },
      sources: [
        { label: "Dokumentation - verwendete Parameter der Turnierzeit-Prognose", href: TOURNAMENT_DURATION_PARAMETERS_URL },
        { label: "Einsteigerleitfaden - Zeitplanung", href: README_TOURNAMENT_CREATE_URL },
      ],
    }),
    timeProfile: freezeCreateHelpTopic({
      id: "timeProfile",
      title: "Zeitprofil",
      shortDescription: "Das Profil kalibriert angenommene Leg-Geschwindigkeit und Übergangszeiten, ohne Turnier- oder X01-Regeln zu verändern.",
      resolveCurrentSelection: ({ draft, settings, durationEstimate }) => {
        const profile = getTournamentTimeProfileMeta(settings.tournamentTimeProfile);
        const boards = sanitizeTournamentBoardCount(draft.boardCount, TOURNAMENT_DURATION_DEFAULT_BOARD_COUNT);
        return profile.label + " · " + profile.description + " · " + boards
          + (boards === 1 ? " Board" : " Boards") + " · " + formatCreateHelpDurationEstimate(durationEstimate);
      },
      resolveEffects: ({ settings }) => [
        getTournamentTimeProfileMeta(settings.tournamentTimeProfile).description,
        "Das Profil verändert angenommene Leg-Dauer, Matchwechsel und Phasenübergänge der Prognose.",
        "Das Profil ist keine Turnierregel; Turnierregeln und Lobbykonfiguration bleiben unverändert.",
      ],
      examples: [
        "Schnell steht für zügige Felder mit wenig Verzögerung.",
        "Normal ist der ausgewogene Standard für lokale Turniere.",
        "Langsam berücksichtigt gemischte Felder oder langsamere Board-Wechsel.",
      ],
      tips: [
        "Tipp: Wähle das Profil passend zur realen Spielgeschwindigkeit und zu den Wechselzeiten.",
        "Tipp: Verwende bei Unsicherheit Normal als empfohlenen Standard.",
        "Tipp: Behandle die Prognose als Planungswert, nicht als garantierte Endzeit.",
      ],
      dependencies: [
        "Zeitprofil und Board-Anzahl bestimmen die Dauerprognose gemeinsam.",
        "Best of und X01-Werte beeinflussen die angenommene Matchdauer.",
        "Modus und Teilnehmerzahl bestimmen Spielanzahl und Abhängigkeiten.",
      ],
      limitations: [
        "Das Profil ist keine normative PDC- oder DRA-Zeitvorgabe.",
        "Individuelle Spielerform und unplanbare Pausen werden nicht vorhergesagt.",
      ],
      classification: {
        label: "Technischer Prognoseparameter",
        description: "Das Profil ist eine lokale Planungsannahme und keine Turnierregel.",
      },
      compliance: {
        status: CREATE_HELP_COMPLIANCE_STATUSES.TECHNICAL_PARAMETER,
        description: "Das Zeitprofil besitzt keine normative PDC- oder DRA-Wirkung.",
        scope: "Es gilt ausschließlich für die lokale Dauerprognose.",
        enforcement: "Nur Rechenfaktoren der Prognose ändern sich; Matchregeln und Lobbywerte bleiben unberührt.",
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
    try {
      const resolved = typeof value === "function" ? value(context) : value;
      return resolved == null ? fallback : resolved;
    } catch (_error) {
      return fallback;
    }
  }

  function normalizeCreateHelpList(value) {
    const values = Array.isArray(value) ? value : value == null ? [] : [value];
    return values.map((entry) => normalizeText(entry || "")).filter(Boolean);
  }

  function normalizeCreateHelpClassification(value) {
    if (!value || typeof value !== "object") return null;
    const label = normalizeText(value.label || "");
    const description = normalizeText(value.description || "");
    return label || description ? { label, description } : null;
  }

  function normalizeCreateHelpCompliance(value) {
    if (!value || typeof value !== "object") return null;
    const requestedStatus = normalizeText(value.status || "").toLowerCase();
    const hasContent = Boolean(
      requestedStatus
      || normalizeText(value.label || "")
      || normalizeText(value.description || "")
      || normalizeText(value.scope || "")
      || normalizeText(value.enforcement || "")
    );
    if (!hasContent) return null;
    const status = Object.prototype.hasOwnProperty.call(CREATE_HELP_COMPLIANCE_STATUS_META, requestedStatus)
      ? requestedStatus
      : CREATE_HELP_COMPLIANCE_STATUSES.NO_GENERAL_CONFORMITY_CLAIM;
    return {
      status,
      label: normalizeText(value.label || "") || CREATE_HELP_COMPLIANCE_STATUS_META[status].label,
      description: normalizeText(value.description || ""),
      scope: normalizeText(value.scope || ""),
      enforcement: normalizeText(value.enforcement || ""),
    };
  }

  function resolveCreateHelpTopic(topicId, rawDraft, rawSettings = {}) {
    const topic = getCreateHelpTopic(topicId);
    const inputSettings = rawSettings && typeof rawSettings === "object" ? rawSettings : {};
    const draft = normalizeCreateDraft(rawDraft, inputSettings);
    if (!topic || !isCreateHelpTopicAvailable(topic.id, draft)) return null;
    const settings = {
      ...inputSettings,
      tournamentTimeProfile: sanitizeTournamentTimeProfile(
        inputSettings.tournamentTimeProfile,
        TOURNAMENT_TIME_PROFILE_NORMAL,
      ),
    };
    const participants = parseParticipantLines(draft.participantsText);
    const modeMeta = getModeParticipantLimits(draft.mode);
    const context = {
      draft,
      settings,
      participants,
      modeMeta,
      participantLimits: modeMeta,
      groupAnalysis: analyzeGroupsKoParticipantDistribution(participants.length),
      preliminaryAnalysis: analyzePreliminaryFinalConfiguration(
        participants.map((participant) => participant.id),
        draft.preliminaryMatchesPerParticipant,
        draft.finalStageType,
        draft.finalStageQualifierCount,
      ),
      gameRulesSummary: buildCreateGameRulesSummary(draft),
      durationEstimate: estimateTournamentDurationFromDraft(draft, settings),
    };
    return {
      id: topic.id,
      title: normalizeText(topic.title),
      shortDescription: normalizeText(topic.shortDescription),
      currentSelection: normalizeText(resolveCreateHelpValue(topic.resolveCurrentSelection, context, "")),
      effects: normalizeCreateHelpList(resolveCreateHelpValue(topic.resolveEffects, context, [])),
      examples: normalizeCreateHelpList(resolveCreateHelpValue(topic.examples, context, [])),
      tips: normalizeCreateHelpList(resolveCreateHelpValue(topic.tips, context, [])),
      dependencies: normalizeCreateHelpList(resolveCreateHelpValue(topic.dependencies, context, [])),
      limitations: normalizeCreateHelpList(resolveCreateHelpValue(topic.limitations, context, [])),
      classification: normalizeCreateHelpClassification(
        resolveCreateHelpValue(topic.classification, context, null),
      ),
      compliance: normalizeCreateHelpCompliance(
        resolveCreateHelpValue(topic.compliance, context, null),
      ),
      sources: topic.sources,
    };
  }

  function validateCreateHelpTopicCatalog() {
    const issues = [];
    const catalogIds = Object.keys(CREATE_HELP_TOPICS);
    CREATE_HELP_TOPIC_IDS.forEach((id) => {
      const topic = getCreateHelpTopic(id);
      if (!topic) {
        issues.push(id + ": Thema fehlt.");
        return;
      }
      if (topic.id !== id) issues.push(id + ": Topic-ID stimmt nicht mit dem Katalogschlüssel überein.");
      if (!normalizeText(topic.title)) issues.push(id + ": Titel fehlt.");
      if (!normalizeText(topic.shortDescription)) issues.push(id + ": Kurzbeschreibung fehlt.");
      if (typeof topic.resolveCurrentSelection !== "function") issues.push(id + ": Resolver für aktuelle Auswahl fehlt.");
      if (typeof topic.resolveEffects !== "function") issues.push(id + ": Resolver für Auswirkungen fehlt.");
      if (topic.examples == null) issues.push(id + ": Beispiele fehlen.");
      if (topic.tips == null) issues.push(id + ": Tipps fehlen.");
      if (topic.dependencies == null) issues.push(id + ": Abhängigkeiten fehlen.");
      if (topic.limitations == null) issues.push(id + ": Einschränkungen fehlen.");
      if (topic.classification == null) issues.push(id + ": Herkunft fehlt.");
      if (topic.compliance == null) issues.push(id + ": Compliance fehlt.");
      if (!topic.sources.length) issues.push(id + ": Quelle fehlt.");
      const sourceUrls = new Set();
      topic.sources.forEach((source) => {
        if (!normalizeText(source.label)) issues.push(id + ": Quellenlink ohne Beschriftung.");
        if (!isCreateHelpSourceUrlAllowed(source.href)) issues.push(id + ": Unsichere oder ungültige Quellen-URL.");
        if (sourceUrls.has(source.href)) issues.push(id + ": Doppelte Quelle ohne Mehrwert.");
        sourceUrls.add(source.href);
      });
    });
    if (new Set(catalogIds).size !== catalogIds.length) issues.push("Topic-IDs sind nicht eindeutig.");
    return { ok: issues.length === 0, issues, topicIds: catalogIds };
  }
