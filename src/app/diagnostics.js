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
        state.store.ui.createDraft = normalizeCreateDraft({
          ...createDefaultCreateDraft(state.store.settings),
          name: "Preset-Erhalt",
          mode: "league",
          bestOfLegs: 7,
          x01Preset: X01_PRESET_CUSTOM,
          boardCount: 3,
          participantsText: "Ada\nBerta\nClara",
          randomizeKoRound1: false,
          enableThirdPlaceMatch: true,
          grandFinalResetMode: GRAND_FINAL_RESET_SINGLE_MATCH,
        }, state.store.settings);
        renderShell();
        const createForm = state.shadowRoot?.getElementById("ata-create-form");
        const presetRadios = createForm
          ? Array.from(createForm.querySelectorAll("input[type='radio'][name='x01Preset']"))
          : [];
        if (!(createForm instanceof HTMLFormElement) || presetRadios.length !== 3) {
          throw new Error("Create form or preset radio group missing.");
        }
        const durationBeforePreset = createForm.querySelector("#ata-create-duration-estimate")?.innerHTML || "";
        const selectPreset = (presetId) => {
          const radio = presetRadios.find((entry) => entry instanceof HTMLInputElement && entry.value === presetId);
          if (!(radio instanceof HTMLInputElement)) {
            throw new Error(`Preset radio missing: ${presetId}`);
          }
          radio.checked = true;
          radio.dispatchEvent(new Event("input", { bubbles: true }));
          radio.dispatchEvent(new Event("change", { bubbles: true }));
        };

        selectPreset(X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL);
        const europeanTourDraft = normalizeCreateDraft(readCreateDraftInput(createForm), state.store.settings);
        const europeanDurationHtml = createForm.querySelector("#ata-create-duration-estimate")?.innerHTML || "";
        const europeanPersisted = state.store.ui.createDraft.x01Preset === X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL;
        const europeanTourState = JSON.stringify(state.store.ui.createDraft);
        const repeatedApplyChanged = applySelectedPresetToCreateForm(
          createForm,
          X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL,
        );
        const repeatedApplyStable = repeatedApplyChanged === false
          && JSON.stringify(state.store.ui.createDraft) === europeanTourState;

        selectPreset(X01_PRESET_PDC_501_DOUBLE_OUT_BASIC);
        const basicDraft = normalizeCreateDraft(readCreateDraftInput(createForm), state.store.settings);
        const basicDurationHtml = createForm.querySelector("#ata-create-duration-estimate")?.innerHTML || "";
        const basicPersisted = state.store.ui.createDraft.x01Preset === X01_PRESET_PDC_501_DOUBLE_OUT_BASIC;
        const preservedFields = basicDraft.name === "Preset-Erhalt"
          && basicDraft.participantsText === "Ada\nBerta\nClara"
          && basicDraft.boardCount === 3
          && basicDraft.randomizeKoRound1 === false
          && basicDraft.enableThirdPlaceMatch === true
          && basicDraft.grandFinalResetMode === GRAND_FINAL_RESET_SINGLE_MATCH;
        const durationUpdated = Boolean(europeanDurationHtml && basicDurationHtml)
          && durationBeforePreset !== europeanDurationHtml
          && europeanDurationHtml !== basicDurationHtml;

        record(
          "Preset-UI: Radio-Auswahl wendet European Tour und Basic direkt und vollständig an",
          europeanTourDraft.x01Preset === X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL
            && europeanTourDraft.mode === "ko"
            && europeanTourDraft.bestOfLegs === 11
            && europeanTourDraft.startScore === 501
            && europeanTourDraft.x01InMode === "Straight"
            && europeanTourDraft.x01OutMode === "Double"
            && europeanTourDraft.x01BullMode === "25/50"
            && europeanTourDraft.x01BullOffMode === "Normal"
            && europeanTourDraft.x01MaxRounds === 50
            && europeanPersisted
            && basicDraft.x01Preset === X01_PRESET_PDC_501_DOUBLE_OUT_BASIC
            && basicDraft.bestOfLegs === 5
            && basicDraft.startScore === 501
            && basicDraft.x01OutMode === "Double"
            && basicPersisted
            && repeatedApplyStable
            && preservedFields
            && durationUpdated,
          `et=${europeanTourDraft.bestOfLegs}/${europeanTourDraft.x01Preset}, basic=${basicDraft.bestOfLegs}/${basicDraft.x01Preset}, repeat=${repeatedApplyStable}, preserved=${preservedFields}, forecast=${durationUpdated}`,
        );

        const manualFieldCases = [
          ["#ata-mode", "league"],
          ["#ata-bestof", "7"],
          ["#ata-startscore", "301"],
          ["#ata-x01-inmode", "Double"],
          ["#ata-x01-outmode", "Master"],
          ["#ata-x01-bullmode", "50/50"],
          ["#ata-x01-bulloff", "Official"],
          ["#ata-x01-maxrounds", "20"],
        ];
        const manualResults = manualFieldCases.map(([selector, value]) => {
          applySelectedPresetToCreateForm(createForm, X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL);
          const field = createForm.querySelector(selector);
          if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLSelectElement)) {
            return false;
          }
          field.value = value;
          field.dispatchEvent(new Event("change", { bubbles: true }));
          const customRadio = createForm.querySelector(`input[name='x01Preset'][value='${X01_PRESET_CUSTOM}']`);
          return state.store.ui.createDraft.x01Preset === X01_PRESET_CUSTOM
            && customRadio instanceof HTMLInputElement
            && customRadio.checked;
        });
        record(
          "Preset-UI: jede manuelle preset-relevante Änderung aktiviert Individuell / Manuell",
          manualResults.every(Boolean),
          manualResults.map((ok, index) => `${manualFieldCases[index][0]}:${ok}`).join(", "),
        );

        applySelectedPresetToCreateForm(createForm, X01_PRESET_PDC_501_DOUBLE_OUT_BASIC);
        const valuesBeforeCustom = JSON.stringify(readCreateDraftInput(createForm));
        selectPreset(X01_PRESET_CUSTOM);
        const valuesAfterCustom = JSON.stringify(readCreateDraftInput(createForm));
        const customOnlyChangesStatus = valuesBeforeCustom.replace(
          X01_PRESET_PDC_501_DOUBLE_OUT_BASIC,
          X01_PRESET_CUSTOM,
        ) === valuesAfterCustom;
        renderShell();
        const rerenderedCustom = state.shadowRoot?.querySelector(
          `#ata-create-form input[name='x01Preset'][value='${X01_PRESET_CUSTOM}']`,
        );
        record(
          "Preset-UI: bewusste Custom-Auswahl erhält Sachwerte und bleibt nach Rerender aktiv",
          customOnlyChangesStatus
            && state.store.ui.createDraft.x01Preset === X01_PRESET_CUSTOM
            && rerenderedCustom instanceof HTMLInputElement
            && rerenderedCustom.checked,
          `values=${customOnlyChangesStatus}, persisted=${state.store.ui.createDraft.x01Preset}`,
        );
      } catch (error) {
        record("Preset-UI: direkte Radio-Auswahl und Custom-Verhalten", false, String(error?.message || error));
      } finally {
        state.store.tournament = previousTournament;
        state.store.ui.createDraft = previousDraft || createDefaultCreateDraft(state.store.settings);
        renderShell();
      }
    }

    {
      const previousTournament = state.store.tournament;
      const previousDraft = cloneSerializable(state.store.ui?.createDraft);
      const previousActiveTab = state.activeTab;
      const previousStoredActiveTab = state.store.ui.activeTab;
      const previousGameRulesExpanded = state.createGameRulesExpanded;
      const previousDrawerOpen = state.drawerOpen;
      const previousHelpTopic = state.activeCreateHelpTopic;
      const previousHelpTriggerId = state.lastCreateHelpTriggerId;
      const previousTimeProfile = state.store.settings.tournamentTimeProfile;
      try {
        state.store.tournament = null;
        state.drawerOpen = true;
        state.activeTab = "tournament";
        state.store.ui.activeTab = "tournament";
        state.createGameRulesExpanded = false;
        resetCreateHelpState();
        state.store.ui.createDraft = normalizeCreateDraft({
          ...createDefaultCreateDraft(state.store.settings),
          name: "Release 4 Regelhilfe",
          mode: "ko",
          participantsText: "A\nB\nC\nD\nE\nF\nG\nH",
          x01Preset: X01_PRESET_CUSTOM,
          bestOfLegs: 5,
          randomizeKoRound1: false,
          enableThirdPlaceMatch: true,
        }, state.store.settings);
        renderShell();

        const createForm = state.shadowRoot?.getElementById("ata-create-form");
        const drawer = state.shadowRoot?.querySelector(".ata-drawer");
        const modeSelect = createForm?.querySelector("#ata-mode");
        if (!(createForm instanceof HTMLFormElement)
          || !(drawer instanceof HTMLElement)
          || !(modeSelect instanceof HTMLSelectElement)) {
          throw new Error("Create form, drawer or mode select missing.");
        }
        const catalogValidation = validateCreateHelpTopicCatalog();
        const initialPanel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        const initialOverview = createForm.querySelector("#ata-create-overview");
        const formHelpLinks = createForm.querySelectorAll(".ata-help-links");
        const expectedInitialTopics = [
          "tournamentMode",
          "presetFormat",
          "participants",
          "koDraw",
          "thirdPlace",
          "grandFinal",
          "gameRules",
          "boardCount",
          "timeProfile",
        ];
        const initialTriggersOk = expectedInitialTopics.every((topicId) => {
          const trigger = createForm.querySelector(`#${getCreateHelpTriggerId(topicId)}`);
          return trigger instanceof HTMLButtonElement
            && trigger.getAttribute("aria-controls") === CREATE_HELP_PANEL_ID
            && trigger.getAttribute("aria-expanded") === "false"
            && normalizeText(trigger.getAttribute("aria-label")).startsWith("Hilfe")
            && normalizeText(trigger.textContent) === "?";
        });
        const forbiddenHelpChromeAbsent = !normalizeText(createForm.textContent).includes("💡")
          && createForm.querySelector("[data-action='toggle-create-help'], [data-action='toggle-rule-help'], .ata-rule-types-legend") === null;
        record(
          "Create-UI Release 4: Katalog, echte Fragezeichen-Buttons und geschlossener Ausgangszustand",
          catalogValidation.ok
            && catalogValidation.topicIds.length === 11
            && initialTriggersOk
            && initialPanel instanceof HTMLElement
            && initialPanel.hidden
            && initialOverview instanceof HTMLElement
            && !initialOverview.hidden
            && formHelpLinks.length === 0
            && forbiddenHelpChromeAbsent,
          `topics=${catalogValidation.topicIds.length}, issues=${catalogValidation.issues.join("/") || "-"}, triggers=${initialTriggersOk}, oldLinks=${formHelpLinks.length}, forbidden=${!forbiddenHelpChromeAbsent}`,
        );

        const modeTrigger = createForm.querySelector(`#${getCreateHelpTriggerId("tournamentMode")}`);
        if (!(modeTrigger instanceof HTMLButtonElement)) throw new Error("Mode help trigger missing.");
        modeTrigger.click();
        let panel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        let overview = createForm.querySelector("#ata-create-overview");
        let title = panel?.querySelector(`#${CREATE_HELP_TITLE_ID}`);
        const expandedTriggers = Array.from(createForm.querySelectorAll("[data-action='open-create-help'][aria-expanded='true']"));
        const hiddenControlsRemainSubmittable = new FormData(createForm).has("boardCount")
          && new FormData(createForm).has("tournamentTimeProfile");
        const sources = Array.from(panel?.querySelectorAll(".ata-create-help-sources a") || []);
        record(
          "Create-UI Release 4: explizites Öffnen ersetzt die Übersicht nicht-modal und fokussiert den Titel",
          state.activeCreateHelpTopic === "tournamentMode"
            && panel instanceof HTMLElement
            && !panel.hidden
            && overview instanceof HTMLElement
            && overview.hidden
            && title instanceof HTMLElement
            && state.shadowRoot?.activeElement === title
            && expandedTriggers.length === 1
            && expandedTriggers[0] === modeTrigger
            && hiddenControlsRemainSubmittable
            && sources.length >= 1
            && sources.every((link) => link.target === "_blank" && link.rel.includes("noopener") && link.rel.includes("noreferrer")),
          `topic=${state.activeCreateHelpTopic || "-"}, panel=${panel instanceof HTMLElement && !panel.hidden}, focus=${state.shadowRoot?.activeElement?.id || "-"}, expanded=${expandedTriggers.length}, sources=${sources.length}`,
        );

        const presetTrigger = createForm.querySelector(`#${getCreateHelpTriggerId("presetFormat")}`);
        const basicPreset = createForm.querySelector(`input[name='x01Preset'][value='${X01_PRESET_PDC_501_DOUBLE_OUT_BASIC}']`);
        if (!(presetTrigger instanceof HTMLButtonElement) || !(basicPreset instanceof HTMLInputElement)) {
          throw new Error("Preset help controls missing.");
        }
        presetTrigger.click();
        presetTrigger.click();
        const sameTriggerStable = state.activeCreateHelpTopic === "presetFormat"
          && createForm.querySelectorAll("[data-action='open-create-help'][aria-expanded='true']").length === 1;
        modeSelect.focus();
        modeSelect.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        const focusAndHoverStable = state.activeCreateHelpTopic === "presetFormat";
        basicPreset.focus();
        basicPreset.checked = true;
        basicPreset.dispatchEvent(new Event("change", { bubbles: true }));
        panel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        const presetText = normalizeText(panel?.textContent || "");
        record(
          "Create-UI Release 4: expliziter Preset-Wechsel ist stabil; Fokus, Hover und Presetwert wechseln kein Thema",
          sameTriggerStable
            && focusAndHoverStable
            && state.activeCreateHelpTopic === "presetFormat"
            && presetText.includes("PDC 501 / Double Out (Basic)")
            && presetText.includes("kein offizielles PDC-Eventformat")
            && state.shadowRoot?.activeElement === basicPreset,
          `same=${sameTriggerStable}, passive=${focusAndHoverStable}, topic=${state.activeCreateHelpTopic || "-"}, basic=${presetText.includes("Basic")}, focus=${state.shadowRoot?.activeElement?.id || "-"}`,
        );

        const drawTrigger = createForm.querySelector(`#${getCreateHelpTriggerId("koDraw")}`);
        const drawInput = createForm.querySelector("#ata-randomize-ko");
        if (!(drawTrigger instanceof HTMLButtonElement) || !(drawInput instanceof HTMLInputElement)) {
          throw new Error("KO draw help controls missing.");
        }
        drawTrigger.click();
        drawInput.focus();
        drawInput.checked = true;
        drawInput.dispatchEvent(new Event("change", { bubbles: true }));
        panel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        const liveDrawText = normalizeText(panel?.textContent || "");
        record(
          "Create-UI Release 4: aktives Thema aktualisiert Sachwerte live ohne automatischen Themenwechsel",
          state.activeCreateHelpTopic === "koDraw"
            && liveDrawText.includes("Aktuelle Auswahl Open Draw")
            && state.shadowRoot?.activeElement === drawInput
            && createForm.querySelectorAll("[data-action='open-create-help'][aria-expanded='true']").length === 1,
          `topic=${state.activeCreateHelpTopic || "-"}, openDraw=${liveDrawText.includes("Open Draw")}, focus=${state.shadowRoot?.activeElement?.id || "-"}`,
        );

        const gameRulesTrigger = createForm.querySelector(`#${getCreateHelpTriggerId("gameRules")}`);
        const gameRulesToggle = createForm.querySelector("#ata-game-rules-editor-toggle");
        const bestOf = createForm.querySelector("#ata-bestof");
        if (!(gameRulesTrigger instanceof HTMLButtonElement)
          || !(gameRulesToggle instanceof HTMLButtonElement)
          || !(bestOf instanceof HTMLInputElement)) {
          throw new Error("Game-rules help controls missing.");
        }
        gameRulesTrigger.click();
        gameRulesToggle.click();
        bestOf.focus();
        bestOf.value = "7";
        bestOf.dispatchEvent(new Event("change", { bubbles: true }));
        panel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        const liveRulesText = normalizeText(panel?.textContent || "");
        const closeButton = panel?.querySelector("[data-action='close-create-help']");
        if (!(closeButton instanceof HTMLButtonElement)) throw new Error("Help close button missing.");
        closeButton.click();
        overview = createForm.querySelector("#ata-create-overview");
        const explicitCloseOk = !state.activeCreateHelpTopic
          && panel instanceof HTMLElement
          && panel.hidden
          && overview instanceof HTMLElement
          && !overview.hidden
          && state.shadowRoot?.activeElement === gameRulesTrigger;
        record(
          "Create-UI Release 4: Spielregelhilfe bleibt live; Schließen stellt Übersicht und Trigger-Fokus wieder her",
          liveRulesText.includes("Best of 7 (First to 4)") && explicitCloseOk,
          `rules=${liveRulesText.includes("Best of 7")}, closed=${explicitCloseOk}, focus=${state.shadowRoot?.activeElement?.id || "-"}`,
        );

        gameRulesTrigger.click();
        modeSelect.focus();
        modeSelect.value = "preliminary_final";
        modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        panel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        const preliminaryRulesText = normalizeText(panel?.textContent || "");
        const gameRulesModeUpdateOk = state.activeCreateHelpTopic === "gameRules"
          && preliminaryRulesText.includes("Vorrunde: 2 feste Legs")
          && preliminaryRulesText.includes("Finalphase: Best of")
          && state.shadowRoot?.activeElement === modeSelect;
        panel?.querySelector("[data-action='close-create-help']")?.click();
        modeSelect.value = "ko";
        modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        record(
          "Create-UI Release 4: Spielregelthema bleibt bei Moduswechsel aktiv und zeigt die wirksame Vorrundenkonfiguration",
          gameRulesModeUpdateOk,
          `topic=${state.activeCreateHelpTopic || "closed"}, preliminary=${preliminaryRulesText.includes("Vorrunde: 2 feste Legs")}, focus=${state.shadowRoot?.activeElement?.id || "-"}`,
        );

        const boardTrigger = createForm.querySelector(`#${getCreateHelpTriggerId("boardCount")}`);
        const boardInput = createForm.querySelector("#ata-board-count");
        const timeTrigger = createForm.querySelector(`#${getCreateHelpTriggerId("timeProfile")}`);
        const timeSelect = createForm.querySelector("#ata-create-time-profile");
        if (!(boardTrigger instanceof HTMLButtonElement)
          || !(boardInput instanceof HTMLInputElement)
          || !(timeTrigger instanceof HTMLButtonElement)
          || !(timeSelect instanceof HTMLSelectElement)) {
          throw new Error("Duration help controls missing.");
        }
        boardTrigger.click();
        modeSelect.focus();
        boardInput.value = "3";
        boardInput.dispatchEvent(new Event("change", { bubbles: true }));
        panel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        const boardText = normalizeText(panel?.textContent || "");
        const boardLiveOk = state.activeCreateHelpTopic === "boardCount"
          && boardText.includes("Aktuelle Auswahl 3 Boards")
          && state.shadowRoot?.activeElement === modeSelect;
        panel?.querySelector("[data-action='close-create-help']")?.click();
        timeTrigger.click();
        modeSelect.focus();
        timeSelect.value = TOURNAMENT_TIME_PROFILE_SLOW;
        timeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        panel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        const timeText = normalizeText(panel?.textContent || "");
        const timeLiveOk = state.activeCreateHelpTopic === "timeProfile"
          && timeText.includes("Aktuelle Auswahl Langsam")
          && timeText.includes("keine Turnierregel")
          && state.shadowRoot?.activeElement === modeSelect;
        panel?.querySelector("[data-action='close-create-help']")?.click();
        record(
          "Create-UI Release 4: Board-Anzahl und Zeitprofil aktualisieren ihr aktives Thema ohne Fokuswechsel",
          boardLiveOk && timeLiveOk,
          `board=${boardLiveOk}, time=${timeLiveOk}, profile=${state.store.settings.tournamentTimeProfile}, focus=${state.shadowRoot?.activeElement?.id || "-"}`,
        );

        const participantsTrigger = createForm.querySelector(`#${getCreateHelpTriggerId("participants")}`);
        const participantField = createForm.querySelector("#ata-participants");
        const thirdPlaceInput = createForm.querySelector("#ata-enable-third-place");
        if (!(participantsTrigger instanceof HTMLButtonElement)
          || !(participantField instanceof HTMLTextAreaElement)
          || !(thirdPlaceInput instanceof HTMLInputElement)) {
          throw new Error("Dependent help controls missing.");
        }
        participantsTrigger.click();
        participantField.focus();
        participantField.value = "Zora\nYara\nXenia\nWanda\nVera\nUte\nTina\nSara";
        participantField.dispatchEvent(new Event("input", { bubbles: true }));
        panel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        const participantsText = normalizeText(panel?.textContent || "");
        const participantsLiveOk = state.activeCreateHelpTopic === "participants"
          && participantsText.includes("8 Teilnehmer erkannt")
          && participantsText.includes("Zora vor Yara")
          && state.shadowRoot?.activeElement === participantField;

        const thirdPlaceLiveTrigger = createForm.querySelector(`#${getCreateHelpTriggerId("thirdPlace")}`);
        if (!(thirdPlaceLiveTrigger instanceof HTMLButtonElement)) throw new Error("Third-place live trigger missing.");
        thirdPlaceLiveTrigger.click();
        thirdPlaceInput.focus();
        thirdPlaceInput.checked = false;
        thirdPlaceInput.dispatchEvent(new Event("change", { bubbles: true }));
        panel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        const thirdPlaceText = normalizeText(panel?.textContent || "");
        const thirdPlaceLiveOk = state.activeCreateHelpTopic === "thirdPlace"
          && thirdPlaceText.includes("Aktuelle Auswahl Aus · 8 Teilnehmer · kein zusätzliches Match")
          && state.shadowRoot?.activeElement === thirdPlaceInput;

        modeSelect.value = "double_ko";
        modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        const grandFinalLiveTrigger = createForm.querySelector(`#${getCreateHelpTriggerId("grandFinal")}`);
        const grandFinalSelect = createForm.querySelector("#ata-grand-final-reset-mode");
        if (!(grandFinalLiveTrigger instanceof HTMLButtonElement) || !(grandFinalSelect instanceof HTMLSelectElement)) {
          throw new Error("Grand-final live controls missing.");
        }
        grandFinalLiveTrigger.click();
        grandFinalSelect.focus();
        grandFinalSelect.value = GRAND_FINAL_RESET_SINGLE_MATCH;
        grandFinalSelect.dispatchEvent(new Event("change", { bubbles: true }));
        panel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        const grandFinalText = normalizeText(panel?.textContent || "");
        const grandFinalLiveOk = state.activeCreateHelpTopic === "grandFinal"
          && grandFinalText.includes("Ein einzelnes Grand Final")
          && grandFinalText.includes("verkürzte Variante")
          && state.shadowRoot?.activeElement === grandFinalSelect;

        modeSelect.value = "groups_ko";
        modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        participantField.value = "A\nB\nC\nD\nE\nF\nG\nH\nI";
        participantField.dispatchEvent(new Event("input", { bubbles: true }));
        const groupsLiveTrigger = createForm.querySelector(`#${getCreateHelpTriggerId("groupsKoOddParticipants")}`);
        let groupsPolicy = createForm.querySelector("#ata-groups-ko-odd-policy");
        if (!(groupsLiveTrigger instanceof HTMLButtonElement) || !(groupsPolicy instanceof HTMLSelectElement)) {
          throw new Error("Groups live controls missing.");
        }
        groupsLiveTrigger.click();
        groupsPolicy.focus();
        groupsPolicy.value = GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL;
        groupsPolicy.dispatchEvent(new Event("change", { bubbles: true }));
        groupsPolicy = createForm.querySelector("#ata-groups-ko-odd-policy");
        panel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        const groupsPendingText = normalizeText(panel?.textContent || "");
        const groupsPolicyFocusOk = groupsPolicy instanceof HTMLSelectElement
          && state.shadowRoot?.activeElement === groupsPolicy;
        let groupsAcknowledgement = createForm.querySelector("input[name='groupsKoOddParticipantAcknowledged']");
        if (!(groupsAcknowledgement instanceof HTMLInputElement)) throw new Error("Groups acknowledgement missing.");
        groupsAcknowledgement.focus();
        groupsAcknowledgement.checked = true;
        groupsAcknowledgement.dispatchEvent(new Event("change", { bubbles: true }));
        groupsAcknowledgement = createForm.querySelector("input[name='groupsKoOddParticipantAcknowledged']");
        panel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        const groupsAcknowledgedText = normalizeText(panel?.textContent || "");
        const groupsLiveOk = state.activeCreateHelpTopic === "groupsKoOddParticipants"
          && groupsPendingText.includes("Bestätigung noch erforderlich")
          && groupsAcknowledgedText.includes("Bestätigung erteilt")
          && groupsPolicyFocusOk
          && groupsAcknowledgement instanceof HTMLInputElement
          && state.shadowRoot?.activeElement === groupsAcknowledgement;

        modeSelect.value = "preliminary_final";
        modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        participantField.value = "A\nB\nC\nD\nE\nF\nG\nH";
        participantField.dispatchEvent(new Event("input", { bubbles: true }));
        const preliminaryLiveTrigger = createForm.querySelector(`#${getCreateHelpTriggerId("preliminaryFinal")}`);
        let preliminaryMatchCount = createForm.querySelector("#ata-preliminary-match-count");
        if (!(preliminaryLiveTrigger instanceof HTMLButtonElement) || !(preliminaryMatchCount instanceof HTMLInputElement)) {
          throw new Error("Preliminary live controls missing.");
        }
        preliminaryLiveTrigger.click();
        preliminaryMatchCount.focus();
        preliminaryMatchCount.value = "6";
        preliminaryMatchCount.dispatchEvent(new Event("change", { bubbles: true }));
        preliminaryMatchCount = createForm.querySelector("#ata-preliminary-match-count");
        panel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        const preliminaryText = normalizeText(panel?.textContent || "");
        const preliminaryLiveOk = state.activeCreateHelpTopic === "preliminaryFinal"
          && preliminaryText.includes("24 Vorrundenmatches gesamt")
          && preliminaryMatchCount instanceof HTMLInputElement
          && state.shadowRoot?.activeElement === preliminaryMatchCount;
        record(
          "Create-UI Release 5: Teilnehmer, Platz 3, Grand Final, Gruppen und Vorrunde aktualisieren Hilfe und erhalten Feldfokus",
          participantsLiveOk && thirdPlaceLiveOk && grandFinalLiveOk && groupsLiveOk && preliminaryLiveOk,
          `participants=${participantsLiveOk}, third=${thirdPlaceLiveOk}, grand=${grandFinalLiveOk}, groups=${groupsLiveOk}, preliminary=${preliminaryLiveOk}, focus=${state.shadowRoot?.activeElement?.id || "-"}`,
        );

        modeTrigger.click();
        modeSelect.focus();
        modeSelect.value = "double_ko";
        modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        panel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        const liveModeText = normalizeText(panel?.textContent || "");
        const liveModeOk = state.activeCreateHelpTopic === "tournamentMode"
          && liveModeText.includes("Aktuelle Auswahl Doppel-KO")
          && state.shadowRoot?.activeElement === modeSelect;
        title = createForm.querySelector(`#${CREATE_HELP_TITLE_ID}`);
        title?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        panel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        const escapeOk = state.drawerOpen
          && !state.activeCreateHelpTopic
          && panel instanceof HTMLElement
          && panel.hidden
          && state.shadowRoot?.activeElement === modeTrigger;

        modeSelect.value = "ko";
        modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        const thirdPlaceTrigger = createForm.querySelector(`#${getCreateHelpTriggerId("thirdPlace")}`);
        if (!(thirdPlaceTrigger instanceof HTMLButtonElement)) throw new Error("Third-place help trigger missing.");
        thirdPlaceTrigger.click();
        modeSelect.focus();
        modeSelect.value = "league";
        modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        panel = createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`);
        overview = createForm.querySelector("#ata-create-overview");
        const invalidationOk = !state.activeCreateHelpTopic
          && panel instanceof HTMLElement
          && panel.hidden
          && overview instanceof HTMLElement
          && !overview.hidden
          && state.shadowRoot?.activeElement === modeSelect;

        modeSelect.value = "double_ko";
        modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        const grandFinalTrigger = createForm.querySelector(`#${getCreateHelpTriggerId("grandFinal")}`);
        if (!(grandFinalTrigger instanceof HTMLButtonElement)) throw new Error("Grand-final help trigger missing.");
        grandFinalTrigger.click();
        modeSelect.focus();
        modeSelect.value = "ko";
        modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        const grandFinalInvalidationOk = !state.activeCreateHelpTopic
          && createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`)?.hidden
          && state.shadowRoot?.activeElement === modeSelect;

        modeSelect.value = "groups_ko";
        modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        const groupsTrigger = createForm.querySelector(`#${getCreateHelpTriggerId("groupsKoOddParticipants")}`);
        if (!(groupsTrigger instanceof HTMLButtonElement)) throw new Error("Groups help trigger missing.");
        groupsTrigger.click();
        modeSelect.focus();
        modeSelect.value = "league";
        modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        const groupsInvalidationOk = !state.activeCreateHelpTopic
          && createForm.querySelector(`#${CREATE_HELP_PANEL_ID}`)?.hidden
          && state.shadowRoot?.activeElement === modeSelect;

        const fallbackActivated = activateCreateHelpTopic(
          "presetFormat",
          "ata-create-help-trigger-does-not-exist",
          readCreateDraftInput(createForm),
        );
        refreshCreateHelpUi(createForm);
        const fallbackClosed = closeCreateHelpPanel(createForm, { returnFocus: true });
        const fallbackOk = fallbackActivated
          && fallbackClosed
          && state.shadowRoot?.activeElement === modeTrigger;
        record(
          "Create-UI Release 4: Escape, Modus-Liveupdate, drei Invalidierungen und Fokus-Fallback sind sicher",
          liveModeOk
            && escapeOk
            && invalidationOk
            && grandFinalInvalidationOk
            && groupsInvalidationOk
            && fallbackOk,
          `mode=${liveModeOk}, escape=${escapeOk}, third=${invalidationOk}, grand=${grandFinalInvalidationOk}, groups=${groupsInvalidationOk}, fallback=${fallbackOk}, drawer=${state.drawerOpen}`,
        );
      } catch (error) {
        record("Create-UI Release 4: kontextbezogene Regelhilfe", false, String(error?.message || error));
      } finally {
        state.store.tournament = previousTournament;
        state.store.ui.createDraft = previousDraft || createDefaultCreateDraft(state.store.settings);
        state.activeTab = previousActiveTab;
        state.store.ui.activeTab = previousStoredActiveTab;
        state.createGameRulesExpanded = previousGameRulesExpanded;
        state.drawerOpen = previousDrawerOpen;
        state.activeCreateHelpTopic = previousHelpTopic;
        state.lastCreateHelpTriggerId = previousHelpTriggerId;
        state.store.settings.tournamentTimeProfile = previousTimeProfile;
        renderShell();
      }
    }

    {
      const previousTournament = state.store.tournament;
      const previousDraft = cloneSerializable(state.store.ui?.createDraft);
      const previousActiveTab = state.activeTab;
      const previousStoredActiveTab = state.store.ui.activeTab;
      const previousGameRulesExpanded = state.createGameRulesExpanded;
      const previousDrawerOpen = state.drawerOpen;
      try {
        state.store.tournament = null;
        state.drawerOpen = true;
        state.activeTab = "tournament";
        state.store.ui.activeTab = "tournament";
        state.createGameRulesExpanded = false;
        state.store.ui.createDraft = normalizeCreateDraft({
          ...createDefaultCreateDraft(state.store.settings),
          name: "Release 3 UI",
          mode: "ko",
          participantsText: "A\nB\nC\nD\nE\nF\nG",
          x01Preset: X01_PRESET_CUSTOM,
          bestOfLegs: 11,
          enableThirdPlaceMatch: true,
          grandFinalResetMode: GRAND_FINAL_RESET_SINGLE_MATCH,
          groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL,
          groupsKoOddParticipantAcknowledged: true,
          preliminaryMatchesPerParticipant: 4,
          finalStageType: FINAL_STAGE_TYPE_DOUBLE_KO,
          finalStageQualifierCount: 4,
          finalStageBestOfLegs: 5,
        }, state.store.settings);
        renderShell();
        const createForm = state.shadowRoot?.getElementById("ata-create-form");
        const modeSelect = createForm?.querySelector("#ata-mode");
        if (!(createForm instanceof HTMLFormElement) || !(modeSelect instanceof HTMLSelectElement)) {
          throw new Error("Create form or mode select missing.");
        }
        const switchMode = (mode) => {
          modeSelect.value = mode;
          modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
          return Array.from(createForm.querySelectorAll("[data-mode-rule-group]"))
            .filter((group) => group instanceof HTMLElement && !group.hidden)
            .map((group) => group.getAttribute("data-mode-rule-group"));
        };
        const inactiveControlsDisabled = () => Array.from(createForm.querySelectorAll("[data-mode-rule-group][hidden] input, [data-mode-rule-group][hidden] select, [data-mode-rule-group][hidden] textarea, [data-mode-rule-group][hidden] button"))
          .every((control) => control.disabled === true);

        const koGroups = switchMode("ko");
        const leagueGroups = switchMode("league");
        const leagueEmptyText = normalizeText(createForm.querySelector("[data-role='league-rules-empty']")?.textContent || "");
        const thirdPlaceExcludedFromLeague = !new FormData(createForm).has("enableThirdPlaceMatch");
        const doubleKoGroups = switchMode("double_ko");
        const grandFinalSelect = createForm.querySelector("#ata-grand-final-reset-mode");
        const grandFinalRestored = grandFinalSelect instanceof HTMLSelectElement
          && grandFinalSelect.value === GRAND_FINAL_RESET_SINGLE_MATCH;
        const groupsKoGroups = switchMode("groups_ko");
        const groupPolicy = createForm.querySelector("#ata-groups-ko-odd-policy");
        const groupPolicyRestored = groupPolicy instanceof HTMLSelectElement
          && groupPolicy.value === GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL;
        const preliminaryGroups = switchMode("preliminary_final");
        const groupAcknowledgementReset = state.store.ui.createDraft.groupsKoOddParticipantAcknowledged === false;
        const standardBestOf = createForm.querySelector("#ata-bestof");
        const finalBestOf = createForm.querySelector("#ata-final-stage-bestof");
        const preliminaryComplete = standardBestOf instanceof HTMLInputElement
          && standardBestOf.disabled
          && standardBestOf.closest("[data-role='standard-bestof-field']")?.hidden === true
          && finalBestOf instanceof HTMLInputElement
          && finalBestOf.value === "5";
        switchMode("ko");
        const thirdPlace = createForm.querySelector("#ata-enable-third-place");
        const thirdPlaceRestored = thirdPlace instanceof HTMLInputElement && thirdPlace.checked;
        const visibilityOk = JSON.stringify(koGroups) === JSON.stringify(["ko_draw", "third_place"])
          && JSON.stringify(doubleKoGroups) === JSON.stringify(["ko_draw", "grand_final"])
          && JSON.stringify(leagueGroups) === JSON.stringify(["league_empty"])
          && JSON.stringify(groupsKoGroups) === JSON.stringify(["groups_ko"])
          && JSON.stringify(preliminaryGroups) === JSON.stringify(["preliminary_final"])
          && leagueEmptyText === "Für den Ligamodus sind keine zusätzlichen Turnierregeln erforderlich."
          && thirdPlaceExcludedFromLeague
          && inactiveControlsDisabled()
          && grandFinalRestored
          && groupPolicyRestored
          && groupAcknowledgementReset
          && preliminaryComplete
          && thirdPlaceRestored;
        record(
          "Create-UI Release 3: nur aktive Modusregeln sind sichtbar, bedienbar und in FormData",
          visibilityOk,
          `ko=${koGroups.join("/")}, double=${doubleKoGroups.join("/")}, league=${leagueGroups.join("/")}, groups=${groupsKoGroups.join("/")}, preliminary=${preliminaryGroups.join("/")}, preserved=${grandFinalRestored && groupPolicyRestored && thirdPlaceRestored}, ackReset=${groupAcknowledgementReset}`,
        );

        const toggle = createForm.querySelector("#ata-game-rules-editor-toggle");
        const editor = createForm.querySelector("#ata-game-rules-editor");
        if (!(toggle instanceof HTMLButtonElement) || !(editor instanceof HTMLElement)) {
          throw new Error("Game-rules disclosure missing.");
        }
        const initiallyClosed = editor.hidden
          && toggle.getAttribute("aria-expanded") === "false"
          && toggle.getAttribute("aria-controls") === editor.id
          && normalizeText(toggle.textContent) === "Spielregeln bearbeiten";
        toggle.click();
        const opened = !editor.hidden
          && toggle.getAttribute("aria-expanded") === "true"
          && state.createGameRulesExpanded === true;
        const bestOf = createForm.querySelector("#ata-bestof");
        if (!(bestOf instanceof HTMLInputElement)) throw new Error("Best-of input missing.");
        bestOf.focus();
        toggle.click();
        const focusReturned = editor.hidden
          && state.shadowRoot?.activeElement === toggle
          && toggle.getAttribute("aria-expanded") === "false";
        record(
          "Create-UI Release 3: Inline-Disclosure ist geschlossen, zugänglich und gibt Fokus zurück",
          initiallyClosed && opened && focusReturned,
          `closed=${initiallyClosed}, opened=${opened}, focus=${focusReturned}, hidden=${editor.hidden}, aria=${toggle.getAttribute("aria-expanded")}, active=${state.shadowRoot?.activeElement?.id || state.shadowRoot?.activeElement?.tagName || "-"}`,
        );

        toggle.click();
        bestOf.value = "5";
        bestOf.dispatchEvent(new Event("change", { bubbles: true }));
        const customSummary = normalizeText(createForm.querySelector("[data-role='game-rules-summary-text']")?.textContent || "");
        const customOrigin = normalizeText(createForm.querySelector("[data-role='game-rules-preset-origin']")?.textContent || "");
        const basicRadio = createForm.querySelector(`input[name='x01Preset'][value='${X01_PRESET_PDC_501_DOUBLE_OUT_BASIC}']`);
        if (!(basicRadio instanceof HTMLInputElement)) throw new Error("Basic preset radio missing.");
        basicRadio.checked = true;
        basicRadio.dispatchEvent(new Event("change", { bubbles: true }));
        const basicSummary = normalizeText(createForm.querySelector("[data-role='game-rules-summary-text']")?.textContent || "");
        const basicOrigin = normalizeText(createForm.querySelector("[data-role='game-rules-preset-origin']")?.textContent || "");
        const liveSummaryOk = customSummary.includes("Best of 5 (First to 3)")
          && customOrigin.includes("Individuell / Manuell")
          && basicSummary.includes("501 · Best of 5 (First to 3)")
          && basicOrigin.includes("PDC 501 / Double Out (Basic)")
          && state.createGameRulesExpanded === true
          && !editor.hidden;
        record(
          "Create-UI Release 3: Zusammenfassung, Preset-Herkunft und offener Editor bleiben synchron",
          liveSummaryOk,
          `custom=${customOrigin}, basic=${basicOrigin}, expanded=${state.createGameRulesExpanded}`,
        );
      } catch (error) {
        record("Create-UI Release 3: Modusregeln und Spielregel-Disclosure", false, String(error?.message || error));
      } finally {
        state.store.tournament = previousTournament;
        state.store.ui.createDraft = previousDraft || createDefaultCreateDraft(state.store.settings);
        state.activeTab = previousActiveTab;
        state.store.ui.activeTab = previousStoredActiveTab;
        state.createGameRulesExpanded = previousGameRulesExpanded;
        state.drawerOpen = previousDrawerOpen;
        renderShell();
      }
    }

    {
      const previousTournament = state.store.tournament;
      const previousDraft = cloneSerializable(state.store.ui?.createDraft);
      const previousActiveTab = state.activeTab;
      const previousStoredActiveTab = state.store.ui.activeTab;
      try {
        state.store.tournament = null;
        state.activeTab = "tournament";
        state.store.ui.activeTab = "tournament";
        state.store.ui.createDraft = createDefaultCreateDraft(state.store.settings);
        renderShell();

        const createForm = state.shadowRoot?.getElementById("ata-create-form");
        if (!(createForm instanceof HTMLFormElement)) {
          throw new Error("Create form missing.");
        }
        const sectionOrder = Array.from(createForm.querySelectorAll("[data-create-section]"))
          .map((section) => section.getAttribute("data-create-section"));
        const expectedSectionOrder = ["format", "participants", "additional-rules", "game-rules", "overview"];
        const sectionHeadings = Array.from(createForm.querySelectorAll("[data-create-section] > .ata-create-section-head h4"))
          .map((heading) => normalizeText(heading.textContent));
        const expectedHeadings = [
          "Turnierformat",
          "Teilnehmer",
          "Zusätzliche Turnierregeln",
          "Spielregeln",
          "Turnierübersicht",
        ];
        const requiredSelectors = [
          "#ata-name",
          "#ata-mode",
          "#ata-bestof",
          "#ata-startscore",
          "#ata-x01-inmode",
          "#ata-x01-outmode",
          "#ata-x01-bulloff",
          "#ata-x01-bullmode",
          "#ata-x01-maxrounds",
          "[data-role='game-rules-summary']",
          "#ata-game-rules-editor-toggle",
          "#ata-game-rules-editor",
          "[data-role='preset-selection']",
          `input[name='x01Preset'][value='${X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL}']`,
          `input[name='x01Preset'][value='${X01_PRESET_PDC_501_DOUBLE_OUT_BASIC}']`,
          `input[name='x01Preset'][value='${X01_PRESET_CUSTOM}']`,
          "#ata-participants",
          "#ata-randomize-ko",
          "#ata-enable-third-place",
          "#ata-grand-final-reset-mode",
          "#ata-board-count",
          "#ata-create-time-profile",
          "#ata-create-duration-estimate",
          "button[type='submit']",
          "[data-action='shuffle-participants']",
        ];
        const hooksPreserved = requiredSelectors.every((selector) => createForm.querySelectorAll(selector).length === 1);
        const modeValues = Array.from(createForm.querySelectorAll("#ata-mode option")).map((option) => option.value);
        const fixedSummary = createForm.querySelector("[data-role='fixed-match-setup']");
        const fixedSummaryText = normalizeText(fixedSummary?.textContent || "");
        const fixedSummaryOk = fixedSummary instanceof HTMLElement
          && fixedSummary.querySelector("input, select, textarea, button") === null
          && fixedSummaryText.includes("X01")
          && fixedSummaryText.includes("Legs")
          && fixedSummaryText.includes("Private Lobby");
        const presetFieldset = createForm.querySelector("fieldset[data-role='preset-selection']");
        const presetRadios = Array.from(createForm.querySelectorAll("input[name='x01Preset']"));
        const presetMarkupOk = presetFieldset instanceof HTMLFieldSetElement
          && normalizeText(presetFieldset.querySelector("legend")?.textContent).startsWith("Turnierformat auswählen")
          && presetRadios.length === 3
          && presetRadios.every((radio) => radio instanceof HTMLInputElement
            && radio.type === "radio"
            && Boolean(radio.labels?.length)
            && Boolean(radio.getAttribute("aria-describedby"))
            && Boolean(createForm.querySelector(`#${radio.getAttribute("aria-describedby")}`)))
          && presetRadios.filter((radio) => radio instanceof HTMLInputElement && radio.checked).length === 1
          && new FormData(createForm).get("x01Preset") === presetRadios.find(
            (radio) => radio instanceof HTMLInputElement && radio.checked,
          )?.value
          && createForm.querySelector("#ata-x01-preset, #ata-preset-select, #ata-apply-preset, [data-action='apply-selected-preset'], .ata-preset-pill") === null;
        const structureOk = JSON.stringify(sectionOrder) === JSON.stringify(expectedSectionOrder)
          && JSON.stringify(sectionHeadings) === JSON.stringify(expectedHeadings)
          && hooksPreserved
          && JSON.stringify(modeValues) === JSON.stringify(["ko", "double_ko", "league", "groups_ko", "preliminary_final"])
          && createForm.querySelector("#ata-match-mode") === null
          && createForm.querySelector("#ata-lobby-fixed") === null
          && fixedSummaryOk
          && presetMarkupOk;
        record(
          "Create-UI: fünf klar benannte Bereiche und kompaktes festes Setup",
          structureOk,
          `sections=${sectionOrder.join("/")}, hooks=${hooksPreserved}, modes=${modeValues.join("/")}, fixed=${fixedSummaryOk}, presets=${presetMarkupOk}`,
        );

        const participantsField = createForm.querySelector("#ata-participants");
        const shuffleButton = createForm.querySelector("[data-action='shuffle-participants']");
        if (!(participantsField instanceof HTMLTextAreaElement) || !(shuffleButton instanceof HTMLButtonElement)) {
          throw new Error("Participant shuffle controls missing.");
        }
        participantsField.value = "Ada\nBerta\nClara\nDora";
        participantsField.dispatchEvent(new Event("input", { bubbles: true }));
        shuffleButton.click();
        const shuffledDraft = normalizeCreateDraft(state.store.ui.createDraft, state.store.settings);
        const shuffledNames = parseParticipantLines(shuffledDraft.participantsText).map((participant) => participant.name).sort();
        const shuffleOk = JSON.stringify(shuffledNames) === JSON.stringify(["Ada", "Berta", "Clara", "Dora"])
          && state.shadowRoot?.querySelector("#ata-create-duration-estimate") instanceof HTMLElement;
        record(
          "Create-UI: Teilnehmer-Mischen erhält das Teilnehmerfeld und aktualisiert den Draft",
          shuffleOk,
          `participants=${shuffledNames.join("/")}, forecast=${Boolean(state.shadowRoot?.querySelector("#ata-create-duration-estimate"))}`,
        );
      } catch (error) {
        record("Create-UI: Struktur- und Shuffle-Vertrag", false, String(error?.message || error));
      } finally {
        state.store.tournament = previousTournament;
        state.store.ui.createDraft = previousDraft || createDefaultCreateDraft(state.store.settings);
        state.activeTab = previousActiveTab;
        state.store.ui.activeTab = previousStoredActiveTab;
        renderShell();
      }
    }

    {
      const previousTournament = state.store.tournament;
      const previousDraft = cloneSerializable(state.store.ui?.createDraft);
      const previousActiveTab = state.activeTab;
      const previousStoredActiveTab = state.store.ui.activeTab;
      const participantNames = Array.from({ length: 7 }, (_, index) => `UI Spieler ${index + 1}`).join("\n");
      try {
        ["ko", "double_ko", "league", "groups_ko"].forEach((sourceMode) => {
          state.store.tournament = null;
          state.activeTab = "tournament";
          state.store.ui.activeTab = "tournament";
          state.store.ui.createDraft = normalizeCreateDraft({
            ...createDefaultCreateDraft(state.store.settings),
            name: `UI Default ${sourceMode}`,
            mode: sourceMode,
            participantsText: participantNames,
          }, state.store.settings);
          renderShell();
          const createForm = state.shadowRoot?.getElementById("ata-create-form");
          const modeSelect = createForm?.querySelector("#ata-mode");
          if (!(createForm instanceof HTMLFormElement) || !(modeSelect instanceof HTMLSelectElement)) {
            throw new Error(`Create form fehlt f\u00fcr ${sourceMode}.`);
          }
          modeSelect.value = "preliminary_final";
          modeSelect.dispatchEvent(new Event("change", { bubbles: true }));

          const draft = normalizeCreateDraft(readCreateDraftInput(createForm), state.store.settings);
          const summaryText = normalizeText(createForm.querySelector("[data-role='preliminary-live-summary']")?.textContent || "");
          const defaultsOk = draft.mode === "preliminary_final"
            && draft.preliminaryMatchesPerParticipant === 4
            && draft.preliminaryWinPoints === 2
            && draft.preliminaryDrawPoints === 1
            && draft.preliminaryLossPoints === 0
            && draft.finalStageType === "ko"
            && draft.finalStageQualifierCount === 4
            && draft.finalStageBestOfLegs === 5;
          const summaryOk = summaryText.includes("7 Teilnehmer")
            && summaryText.includes("4 Vorrundenspiele je Teilnehmer")
            && summaryText.includes("14 Vorrundenmatches insgesamt")
            && summaryText.includes("exakt 4 verschiedene Gegner")
            && summaryText.includes("Keine doppelte Paarung")
            && summaryText.includes("Top 4 qualifizieren sich f\u00fcr KO");

          createForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
          const created = state.store.tournament;
          const preliminaryMatches = getPreliminaryMatches(created);
          const opponentsByParticipant = new Map((created?.participants || []).map((participant) => [participant.id, new Set()]));
          preliminaryMatches.forEach((match) => {
            opponentsByParticipant.get(match.player1Id)?.add(match.player2Id);
            opponentsByParticipant.get(match.player2Id)?.add(match.player1Id);
          });
          const creationOk = created?.mode === "preliminary_final"
            && preliminaryMatches.length === 14
            && Array.from(opponentsByParticipant.values()).every((opponents) => opponents.size === 4)
            && created?.finalStage?.qualifierCount === 4;
          record(
            `Preliminary UI defaults: ${sourceMode} -> preliminary_final`,
            defaultsOk && summaryOk && creationOk,
            `defaults=${defaultsOk}, summary=${summaryOk}, created=${creationOk}, matches=${preliminaryMatches.length}`,
          );
        });

        state.store.tournament = null;
        state.activeTab = "tournament";
        state.store.ui.activeTab = "tournament";
        state.store.ui.createDraft = normalizeCreateDraft({
          ...createDefaultCreateDraft(state.store.settings),
          name: "UI 7 durch 5",
          mode: "preliminary_final",
          participantsText: participantNames,
          preliminaryMatchesPerParticipant: 5,
        }, state.store.settings);
        renderShell();
        const invalidForm = state.shadowRoot?.getElementById("ata-create-form");
        if (!(invalidForm instanceof HTMLFormElement)) throw new Error("Create form f\u00fcr 7/5 fehlt.");
        const invalidSummary = normalizeText(invalidForm.querySelector("[data-role='preliminary-live-summary']")?.textContent || "");
        invalidForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        record(
          "Preliminary UI validation: 7 Teilnehmer / 5 Spiele wird blockiert",
          state.store.tournament === null && invalidSummary.includes("gleiche Verteilung"),
          `blocked=${state.store.tournament === null}, summary=${invalidSummary}`,
        );
      } catch (error) {
        record("Preliminary UI defaults: realer Moduswechsel- und Anlageflow", false, String(error?.message || error));
      } finally {
        state.store.tournament = previousTournament;
        state.store.ui.createDraft = previousDraft || createDefaultCreateDraft(state.store.settings);
        state.activeTab = previousActiveTab;
        state.store.ui.activeTab = previousStoredActiveTab;
        renderShell();
      }
    }

    {
      const previousTournament = state.store.tournament;
      const previousDraft = cloneSerializable(state.store.ui?.createDraft);
      const previousActiveTab = state.activeTab;
      const previousStoredActiveTab = state.store.ui.activeTab;
      const previousDrawerOpen = state.drawerOpen;
      const previousExpanded = state.createGameRulesExpanded;
      const previousHelpTopic = state.activeCreateHelpTopic;
      const previousHelpTrigger = state.lastCreateHelpTriggerId;
      const previousTouched = { ...(state.createValidationTouchedFields || {}) };
      const previousRevealed = { ...(state.createValidationRevealedFields || {}) };
      const previousSubmitAttempted = state.createValidationSubmitAttempted;
      const previousSnapshot = state.createValidationSnapshot;
      try {
        state.store.tournament = null;
        state.activeTab = "tournament";
        state.store.ui.activeTab = "tournament";
        state.drawerOpen = true;
        state.createGameRulesExpanded = false;
        resetCreateHelpState();
        resetCreateValidationState();
        state.store.ui.createDraft = createDefaultCreateDraft(state.store.settings);
        renderShell();
        const form = state.shadowRoot?.getElementById("ata-create-form");
        if (!(form instanceof HTMLFormElement)) throw new Error("Release-6-Create-Formular fehlt.");
        let submitButton = form.querySelector("button[type='submit']");
        const name = form.querySelector("#ata-name");
        const participants = form.querySelector("#ata-participants");
        const initialOverviewText = normalizeText(form.querySelector("#ata-create-overview-summary")?.textContent || "");
        const initialNameError = form.querySelector(`#${getCreateValidationErrorId("name")}`);
        const initialParticipantError = form.querySelector(`#${getCreateValidationErrorId("participants")}`);
        const initialNeutral = submitButton instanceof HTMLButtonElement
          && submitButton.disabled
          && submitButton.getAttribute("aria-disabled") === "true"
          && initialOverviewText.includes("Noch nicht bereit")
          && initialOverviewText.includes("Turniername")
          && initialOverviewText.includes("KO erfordert 2-128 Teilnehmer")
          && initialNameError instanceof HTMLElement
          && initialNameError.hidden
          && initialParticipantError instanceof HTMLElement
          && initialParticipantError.hidden
          && form.querySelector("[role='alert']") === null;
        record(
          "Create-UI Release 6: leerer Initialzustand ist neutral, konkret und nativ deaktiviert",
          initialNeutral,
          `disabled=${submitButton instanceof HTMLButtonElement && submitButton.disabled}, overview=${initialOverviewText.includes("Noch nicht bereit")}, errorsHidden=${initialNameError?.hidden && initialParticipantError?.hidden}`,
        );

        if (!(submitButton instanceof HTMLButtonElement)
          || !(name instanceof HTMLInputElement)
          || !(participants instanceof HTMLTextAreaElement)) {
          throw new Error("Release-6-Pflichtcontrols fehlen.");
        }
        submitButton.disabled = false;
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        const invalidSubmitSummary = form.querySelector("#ata-create-error-summary");
        const nameSubmitFocusOk = state.shadowRoot?.activeElement === name
          && invalidSubmitSummary instanceof HTMLElement
          && !invalidSubmitSummary.hidden
          && invalidSubmitSummary.getAttribute("role") === "alert"
          && name.getAttribute("aria-invalid") === "true";

        name.value = "Release 6 Live";
        name.dispatchEvent(new Event("input", { bubbles: true }));
        participants.focus();
        participants.value = "Ada\nBerta\nClara\nDora";
        participants.dispatchEvent(new Event("input", { bubbles: true }));
        submitButton = form.querySelector("button[type='submit']");
        const readyOverviewText = normalizeText(form.querySelector("#ata-create-overview-summary")?.textContent || "");
        const validLive = submitButton instanceof HTMLButtonElement
          && !submitButton.disabled
          && state.createValidationSnapshot?.valid === true
          && readyOverviewText.includes("Bereit zum Anlegen")
          && readyOverviewText.includes("3")
          && state.shadowRoot?.activeElement === participants
          && form.querySelector("#ata-create-error-summary")?.hidden;

        const modeForLimits = form.querySelector("#ata-mode");
        if (!(modeForLimits instanceof HTMLSelectElement)) throw new Error("Mode-Control fehlt.");
        modeForLimits.focus();
        modeForLimits.value = "preliminary_final";
        modeForLimits.dispatchEvent(new Event("change", { bubbles: true }));
        const modeSwitchInvalid = form.querySelector("button[type='submit']")?.disabled === true
          && normalizeText(form.querySelector("#ata-create-participant-status")?.textContent || "").includes("5–16")
          && state.shadowRoot?.activeElement === modeForLimits;
        modeForLimits.value = "ko";
        modeForLimits.dispatchEvent(new Event("change", { bubbles: true }));
        const modeSwitchCorrected = form.querySelector("button[type='submit']")?.disabled === false
          && state.shadowRoot?.activeElement === modeForLimits;

        participants.focus();
        participants.value = "Ada\nBerta\nClara\nADA";
        participants.dispatchEvent(new Event("input", { bubbles: true }));
        const participantError = form.querySelector(`#${getCreateValidationErrorId("participants")}`);
        const duplicateBlocked = form.querySelector("button[type='submit']")?.disabled === true
          && participants.getAttribute("aria-invalid") === "true"
          && normalizeText(participants.getAttribute("aria-describedby") || "").split(" ").includes(getCreateValidationErrorId("participants"))
          && participantError instanceof HTMLElement
          && !participantError.hidden
          && normalizeText(participantError.textContent).includes("Zeilen 1 und 4")
          && state.shadowRoot?.activeElement === participants
          && form.querySelector("[role='alert']") === null;
        participants.value = "Ada\nBerta\nClara\nDora";
        participants.dispatchEvent(new Event("input", { bubbles: true }));
        const duplicateCorrected = form.querySelector("button[type='submit']")?.disabled === false
          && participants.getAttribute("aria-invalid") === null;
        record(
          "Create-UI Release 6: Live-Übersicht, Duplikatblocker, Korrektur und Fokus bleiben synchron",
          nameSubmitFocusOk && validLive && modeSwitchInvalid && modeSwitchCorrected && duplicateBlocked && duplicateCorrected,
          `nameFocus=${nameSubmitFocusOk}, ready=${validLive}, modeSwitch=${modeSwitchInvalid}/${modeSwitchCorrected}, duplicate=${duplicateBlocked}, corrected=${duplicateCorrected}`,
        );

        const bestOf = form.querySelector("#ata-bestof");
        if (!(bestOf instanceof HTMLInputElement)) throw new Error("Best-of-Control fehlt.");
        bestOf.value = "4";
        bestOf.dispatchEvent(new Event("change", { bubbles: true }));
        state.createGameRulesExpanded = false;
        setCreateGameRulesExpanded(form, false);
        submitButton = form.querySelector("button[type='submit']");
        if (!(submitButton instanceof HTMLButtonElement)) throw new Error("Submit-Control fehlt.");
        submitButton.disabled = false;
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        const gameEditor = form.querySelector("#ata-game-rules-editor");
        const rawBestOfBlocked = state.store.tournament === null
          && state.createValidationSnapshot?.issues?.some((issue) => issue.reasonCode === "best_of_invalid")
          && gameEditor instanceof HTMLElement
          && !gameEditor.hidden
          && state.shadowRoot?.activeElement === bestOf;
        bestOf.value = "5";
        bestOf.dispatchEvent(new Event("change", { bubbles: true }));

        const boardHelp = form.querySelector(`#${getCreateHelpTriggerId("boardCount")}`);
        const board = form.querySelector("#ata-board-count");
        if (!(boardHelp instanceof HTMLButtonElement) || !(board instanceof HTMLInputElement)) throw new Error("Board-Controls fehlen.");
        boardHelp.click();
        board.value = "0";
        board.dispatchEvent(new Event("change", { bubbles: true }));
        const helpStayedOpenDuringValidation = Boolean(state.activeCreateHelpTopic)
          && !form.querySelector(`#${CREATE_HELP_PANEL_ID}`)?.hidden
          && form.querySelector("#ata-create-overview")?.hidden
          && normalizeText(form.querySelector("#ata-create-overview-summary")?.textContent || "").includes("Noch nicht bereit");
        submitButton = form.querySelector("button[type='submit']");
        if (!(submitButton instanceof HTMLButtonElement)) throw new Error("Submit-Control fehlt nach Board-Änderung.");
        submitButton.disabled = false;
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        const overviewFocusOk = !state.activeCreateHelpTopic
          && form.querySelector(`#${CREATE_HELP_PANEL_ID}`)?.hidden
          && !form.querySelector("#ata-create-overview")?.hidden
          && state.shadowRoot?.activeElement === board;
        record(
          "Create-UI Release 6: autoritativer Submit öffnet Spielregeln und behandelt verdeckte Übersicht sicher",
          rawBestOfBlocked && helpStayedOpenDuringValidation && overviewFocusOk,
          `bestOf=${rawBestOfBlocked}, helpStable=${helpStayedOpenDuringValidation}, overview=${overviewFocusOk}, focus=${state.shadowRoot?.activeElement?.id || "-"}`,
        );

        board.value = "1";
        board.dispatchEvent(new Event("change", { bubbles: true }));
        const mode = form.querySelector("#ata-mode");
        if (!(mode instanceof HTMLSelectElement)) throw new Error("Mode-Control fehlt.");
        mode.value = "groups_ko";
        mode.dispatchEvent(new Event("change", { bubbles: true }));
        participants.value = "A\nB\nC\nD\nE\nF\nG";
        participants.dispatchEvent(new Event("input", { bubbles: true }));
        let groupPolicy = form.querySelector("#ata-groups-ko-odd-policy");
        if (!(groupPolicy instanceof HTMLSelectElement)) throw new Error("Gruppenpolicy fehlt.");
        groupPolicy.value = GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL;
        groupPolicy.dispatchEvent(new Event("change", { bubbles: true }));
        const acknowledgement = form.querySelector("#ata-groups-ko-odd-acknowledgement");
        submitButton = form.querySelector("button[type='submit']");
        if (!(acknowledgement instanceof HTMLInputElement) || !(submitButton instanceof HTMLButtonElement)) throw new Error("Gruppenbestätigung fehlt.");
        submitButton.disabled = false;
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        const groupFocusOk = state.shadowRoot?.activeElement === acknowledgement
          && acknowledgement.getAttribute("aria-invalid") === "true";
        acknowledgement.checked = true;
        acknowledgement.dispatchEvent(new Event("change", { bubbles: true }));
        const groupCorrected = form.querySelector("button[type='submit']")?.disabled === false;
        record(
          "Create-UI Release 6: Gruppenbestätigung ist feldnah, fokussierbar und korrigierbar",
          groupFocusOk && groupCorrected,
          `focus=${groupFocusOk}, corrected=${groupCorrected}`,
        );
      } catch (error) {
        record("Create-UI Release 6: Live-Validierung und Fokusfluss", false, String(error?.message || error));
      } finally {
        state.store.tournament = previousTournament;
        state.store.ui.createDraft = previousDraft || createDefaultCreateDraft(state.store.settings);
        state.activeTab = previousActiveTab;
        state.store.ui.activeTab = previousStoredActiveTab;
        state.drawerOpen = previousDrawerOpen;
        state.createGameRulesExpanded = previousExpanded;
        state.activeCreateHelpTopic = previousHelpTopic;
        state.lastCreateHelpTriggerId = previousHelpTrigger;
        state.createValidationTouchedFields = previousTouched;
        state.createValidationRevealedFields = previousRevealed;
        state.createValidationSubmitAttempted = previousSubmitAttempted;
        state.createValidationSnapshot = previousSnapshot;
        renderShell();
      }
    }

    {
      const previousTournament = state.store.tournament;
      const previousDraft = cloneSerializable(state.store.ui?.createDraft);
      const previousActiveTab = state.activeTab;
      const previousStoredActiveTab = state.store.ui.activeTab;
      const previousDrawerOpen = state.drawerOpen;
      const previousExpanded = state.createGameRulesExpanded;
      const previousHelpTopic = state.activeCreateHelpTopic;
      const previousHelpTrigger = state.lastCreateHelpTriggerId;
      const previousTouched = { ...(state.createValidationTouchedFields || {}) };
      const previousRevealed = { ...(state.createValidationRevealedFields || {}) };
      const previousSubmitAttempted = state.createValidationSubmitAttempted;
      const previousSnapshot = state.createValidationSnapshot;
      const previousLastFocused = state.lastFocused;
      const previousNotice = { ...(state.notice || {}) };
      let externalTrigger = null;
      try {
        state.store.tournament = null;
        state.store.ui.createDraft = createDefaultCreateDraft(state.store.settings);
        state.activeTab = "tournament";
        state.store.ui.activeTab = "tournament";
        state.drawerOpen = true;
        state.createGameRulesExpanded = false;
        resetCreateHelpState();
        resetCreateValidationState();
        state.notice.type = "info";
        state.notice.message = "";
        renderShell({ preserveFocus: false, preserveScroll: false });

        let drawer = state.shadowRoot?.querySelector(".ata-drawer");
        let nav = state.shadowRoot?.querySelector("nav.ata-tabs");
        let currentNav = nav?.querySelectorAll("[aria-current='page']") || [];
        const navSemanticsOk = nav instanceof HTMLElement
          && nav.getAttribute("aria-label") === "Assistant-Bereiche"
          && currentNav.length === 1
          && currentNav[0].getAttribute("data-tab") === "tournament"
          && nav.querySelector("[role='tab'], [role='tablist']") === null;
        const settingsTab = nav?.querySelector("[data-tab='settings']");
        if (!(settingsTab instanceof HTMLButtonElement)) throw new Error("Settings-Navigation fehlt.");
        settingsTab.focus();
        settingsTab.click();
        nav = state.shadowRoot?.querySelector("nav.ata-tabs");
        const restoredSettingsTab = nav?.querySelector("[data-tab='settings']");
        const navFocusOk = restoredSettingsTab instanceof HTMLButtonElement
          && restoredSettingsTab.getAttribute("aria-current") === "page"
          && state.shadowRoot?.activeElement === restoredSettingsTab;
        record(
          "Accessibility Release 7: Navigation nutzt aktuelle Seite und erhält Fokus beim Re-Render",
          navSemanticsOk && navFocusOk,
          `semantics=${navSemanticsOk}, focus=${navFocusOk}`,
        );

        const debugCheckbox = state.shadowRoot?.getElementById("ata-setting-debug");
        if (!(debugCheckbox instanceof HTMLInputElement)) throw new Error("Debug-Schalter fehlt.");
        debugCheckbox.focus();
        renderShell();
        const restoredDebugCheckbox = state.shadowRoot?.getElementById("ata-setting-debug");
        const settingsLabelOk = restoredDebugCheckbox instanceof HTMLInputElement
          && restoredDebugCheckbox.getAttribute("aria-labelledby") === "ata-setting-debug-label"
          && restoredDebugCheckbox.getAttribute("aria-describedby") === "ata-setting-debug-description"
          && state.shadowRoot?.activeElement === restoredDebugCheckbox;

        const tournamentTab = state.shadowRoot?.querySelector("[data-tab='tournament']");
        if (!(tournamentTab instanceof HTMLButtonElement)) throw new Error("Turnier-Navigation fehlt.");
        tournamentTab.focus();
        tournamentTab.click();
        let form = state.shadowRoot?.getElementById("ata-create-form");
        if (!(form instanceof HTMLFormElement)) throw new Error("Release-7-Create-Formular fehlt.");
        const controls = Array.from(form.querySelectorAll("input:not([type='hidden']), select, textarea"))
          .filter((control) => !control.closest("[hidden]"));
        const controlsNamed = controls.every((control) => (
          (control.labels?.length || 0) > 0
          || Boolean(normalizeText(control.getAttribute("aria-label") || ""))
          || Boolean(normalizeText(control.getAttribute("aria-labelledby") || ""))
        ));
        const ids = Array.from(state.shadowRoot.querySelectorAll("[id]")).map((element) => element.id);
        const liveRegions = Array.from(form.querySelectorAll("[aria-live]"));
        const semanticControlsOk = settingsLabelOk
          && controlsNamed
          && ids.length === new Set(ids).size
          && liveRegions.length === 1
          && liveRegions[0].id === "ata-create-participant-status"
          && liveRegions[0].getAttribute("aria-atomic") === "true"
          && form.querySelector("[role='alert']") === null;
        record(
          "Accessibility Release 7: Formfelder sind benannt, IDs eindeutig und Live-Regionen sparsam",
          semanticControlsOk,
          `settings=${settingsLabelOk}, named=${controlsNamed}, ids=${ids.length}/${new Set(ids).size}, live=${liveRegions.length}`,
        );

        const participants = form.querySelector("#ata-participants");
        const content = state.shadowRoot?.querySelector(".ata-content");
        if (!(participants instanceof HTMLTextAreaElement) || !(content instanceof HTMLElement)) {
          throw new Error("Fokus-/Scroll-Testfelder fehlen.");
        }
        participants.value = "Ada\nBerta\nClara\nDora";
        participants.dispatchEvent(new Event("input", { bubbles: true }));
        participants.focus();
        participants.setSelectionRange(1, 3);
        content.scrollTop = 120;
        renderShell();
        const restoredParticipants = state.shadowRoot?.getElementById("ata-participants");
        const restoredContent = state.shadowRoot?.querySelector(".ata-content");
        const rerenderFocusOk = restoredParticipants instanceof HTMLTextAreaElement
          && state.shadowRoot?.activeElement === restoredParticipants
          && restoredParticipants.selectionStart === 1
          && restoredParticipants.selectionEnd === 3
          && restoredContent?.scrollTop === 120;
        record(
          "Accessibility Release 7: Fokus, Textauswahl und Scrollposition überleben Shell-Re-Render",
          rerenderFocusOk,
          `focus=${state.shadowRoot?.activeElement?.id || "-"}, selection=${restoredParticipants?.selectionStart || 0}-${restoredParticipants?.selectionEnd || 0}, scroll=${restoredContent?.scrollTop || 0}`,
        );

        const anonymousFocusButton = document.createElement("button");
        anonymousFocusButton.type = "button";
        anonymousFocusButton.textContent = "Temporäres Fokusziel";
        restoredContent?.prepend(anonymousFocusButton);
        anonymousFocusButton.focus();
        state.activeTab = "settings";
        state.store.ui.activeTab = "settings";
        renderShell();
        const noCrossViewOrdinalFallback = !(state.shadowRoot?.activeElement instanceof HTMLElement);
        record(
          "Fokusstrategie 0.12.1: Ordinal-Fallback greift nicht über Ansichtsgrenzen",
          noCrossViewOrdinalFallback,
          `focus=${state.shadowRoot?.activeElement?.id || state.shadowRoot?.activeElement?.tagName || "none"}`,
        );

        state.store.tournament = null;
        state.activeTab = "tournament";
        state.store.ui.activeTab = "tournament";
        renderShell({
          preserveFocus: false,
          preserveScroll: false,
          focusTarget: { selector: "#ata-create-heading" },
        });

        const focusCreateInput = {
          ...createDefaultCreateDraft(state.store.settings),
          name: "Fokusstrategie 0.12.1",
          mode: "ko",
          x01Preset: X01_PRESET_CUSTOM,
          participantsText: "Ada\nBerta\nClara\nDora",
          tournamentTimeProfile: state.store.settings.tournamentTimeProfile,
        };
        const focusCreateValidation = validateCreateConfiguration(focusCreateInput, state.store.settings);
        const focusCreateResult = focusCreateValidation.valid
          ? createTournamentSession({
            ...focusCreateValidation.config,
            participants: parseParticipantLines(focusCreateInput.participantsText),
          })
          : { ok: false };
        const createdTournamentPayload = focusCreateResult.ok
          ? { schemaVersion: STORAGE_SCHEMA_VERSION, tournament: cloneSerializable(focusCreateResult.tournament) }
          : null;
        const createFocusHeading = state.shadowRoot?.getElementById("ata-matches-heading");
        const createFocusOk = focusCreateResult.ok
          && createFocusHeading instanceof HTMLElement
          && createFocusHeading.getAttribute("tabindex") === "-1"
          && state.shadowRoot?.activeElement === createFocusHeading;
        record(
          "Fokusstrategie 0.12.1: erfolgreiche Turnieranlage fokussiert die Spieleansicht",
          createFocusOk,
          `created=${focusCreateResult.ok}, focus=${state.shadowRoot?.activeElement?.id || "-"}`,
        );

        const resetFocusResult = resetTournamentSession();
        const resetFocusHeading = state.shadowRoot?.getElementById("ata-create-heading");
        const resetFocusOk = resetFocusResult.ok
          && resetFocusHeading instanceof HTMLElement
          && resetFocusHeading.getAttribute("tabindex") === "-1"
          && state.shadowRoot?.activeElement === resetFocusHeading;
        record(
          "Fokusstrategie 0.12.1: Turnier-Reset fokussiert die Turniererstellung",
          resetFocusOk,
          `reset=${resetFocusResult.ok}, focus=${state.shadowRoot?.activeElement?.id || "-"}`,
        );

        const importFocusResult = importTournamentPayload(createdTournamentPayload);
        const importFocusHeading = state.shadowRoot?.getElementById("ata-matches-heading");
        const importFocusOk = importFocusResult.ok
          && importFocusHeading instanceof HTMLElement
          && state.shadowRoot?.activeElement === importFocusHeading;
        record(
          "Fokusstrategie 0.12.1: Import fokussiert die resultierende Spieleansicht",
          importFocusOk,
          `import=${importFocusResult.ok}, focus=${state.shadowRoot?.activeElement?.id || "-"}`,
        );

        resetTournamentSession();
        form = state.shadowRoot?.getElementById("ata-create-form");
        if (!(form instanceof HTMLFormElement)) throw new Error("Create-Formular nach Fokusstrategie-Test fehlt.");

        drawer = state.shadowRoot?.querySelector(".ata-drawer");
        if (!(drawer instanceof HTMLElement)) throw new Error("Drawer fehlt.");
        const hiddenEditor = state.shadowRoot?.getElementById("ata-game-rules-editor");
        let focusables = getDrawerFocusableElements(drawer);
        const hiddenControlsExcluded = hiddenEditor instanceof HTMLElement
          && hiddenEditor.hidden
          && !focusables.some((element) => hiddenEditor.contains(element));
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const focusBoundaryIdentity = (element) => [
          element?.id || "",
          element?.getAttribute?.("data-action") || "",
          element?.getAttribute?.("data-tab") || "",
          element?.getAttribute?.("name") || "",
        ].join("|");
        last?.focus();
        handleDrawerKeydown({ key: "Tab", shiftKey: false, preventDefault() {}, stopPropagation() {} });
        const forwardWrapped = focusBoundaryIdentity(state.shadowRoot?.activeElement) === focusBoundaryIdentity(first);
        first?.focus();
        handleDrawerKeydown({ key: "Tab", shiftKey: true, preventDefault() {}, stopPropagation() {} });
        const backwardWrapped = focusBoundaryIdentity(state.shadowRoot?.activeElement) === focusBoundaryIdentity(last);
        record(
          "Accessibility Release 7: Fokusfalle umfasst nur sichtbare Controls und schließt in beide Richtungen",
          hiddenControlsExcluded && forwardWrapped && backwardWrapped,
          `hidden=${hiddenControlsExcluded}, forward=${forwardWrapped}, backward=${backwardWrapped}, count=${focusables.length}, first=${first?.id || first?.getAttribute("data-action") || "-"}, last=${last?.id || last?.getAttribute("data-action") || "-"}, active=${state.shadowRoot?.activeElement?.id || state.shadowRoot?.activeElement?.getAttribute?.("data-action") || "-"}`,
        );

        externalTrigger = document.createElement("button");
        externalTrigger.type = "button";
        externalTrigger.textContent = "Release-7-Testtrigger";
        document.body.appendChild(externalTrigger);
        closeDrawer();
        externalTrigger.focus();
        openDrawer();
        const initialFocusOk = state.shadowRoot?.activeElement?.classList?.contains("ata-close-btn") === true;
        form = state.shadowRoot?.getElementById("ata-create-form");
        const modeHelp = form?.querySelector(`#${getCreateHelpTriggerId("tournamentMode")}`);
        const gameRulesToggle = form?.querySelector("#ata-game-rules-editor-toggle");
        if (
          !(form instanceof HTMLFormElement)
          || !(modeHelp instanceof HTMLButtonElement)
          || !(gameRulesToggle instanceof HTMLButtonElement)
        ) {
          throw new Error("Kontexthilfe für Escape-Test fehlt.");
        }
        gameRulesToggle.click();
        modeHelp.click();
        const helpTitle = form.querySelector("#ata-create-help-title");
        helpTitle?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        const gameRulesEditor = form.querySelector("#ata-game-rules-editor");
        const helpEscapedFirst = state.drawerOpen
          && !state.activeCreateHelpTopic
          && state.shadowRoot?.activeElement === modeHelp
          && state.createGameRulesExpanded === true
          && gameRulesEditor instanceof HTMLElement
          && !gameRulesEditor.hidden;
        modeHelp.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        const drawerEscapedSecond = !state.drawerOpen && document.activeElement === externalTrigger;

        externalTrigger.focus();
        openDrawer();
        externalTrigger.remove();
        closeDrawer();
        const removedTriggerFallbackOk = document.activeElement === state.host;
        externalTrigger = null;
        record(
          "Accessibility Release 7: Öffnen, Escape-Priorität und Fokus-Rückgabe sind robust",
          initialFocusOk && helpEscapedFirst && drawerEscapedSecond,
          `initial=${initialFocusOk}, helpFirst=${helpEscapedFirst}, drawerSecond=${drawerEscapedSecond}`,
        );
        record(
          "Fokusstrategie 0.12.1: entfernter Drawer-Auslöser nutzt den sicheren Host-Fallback",
          removedTriggerFallbackOk,
          `fallback=${removedTriggerFallbackOk}, focus=${document.activeElement?.id || "-"}`,
        );

        state.drawerOpen = true;
        state.notice.type = "error";
        state.notice.message = "Release-7-Fehler";
        renderShell({ preserveFocus: false });
        const errorNotice = state.shadowRoot?.querySelector(".ata-notice-error");
        state.notice.type = "success";
        state.notice.message = "Release-7-Erfolg";
        renderShell({ preserveFocus: false });
        const successNotice = state.shadowRoot?.querySelector(".ata-notice-success");
        const noticeSemanticsOk = errorNotice?.getAttribute("role") === "alert"
          && errorNotice?.getAttribute("aria-live") === "assertive"
          && successNotice?.getAttribute("role") === "status"
          && successNotice?.getAttribute("aria-live") === "polite";
        record(
          "Accessibility Release 7: globale Hinweise und Fehler nutzen passende Live-Semantik",
          noticeSemanticsOk,
          `error=${errorNotice?.getAttribute("role") || "-"}, success=${successNotice?.getAttribute("role") || "-"}`,
        );
      } catch (error) {
        record("Accessibility Release 7: Drawer- und Formularvertrag", false, String(error?.message || error));
      } finally {
        externalTrigger?.remove();
        state.store.tournament = previousTournament;
        state.store.ui.createDraft = previousDraft || createDefaultCreateDraft(state.store.settings);
        state.activeTab = previousActiveTab;
        state.store.ui.activeTab = previousStoredActiveTab;
        state.drawerOpen = previousDrawerOpen;
        state.createGameRulesExpanded = previousExpanded;
        state.activeCreateHelpTopic = previousHelpTopic;
        state.lastCreateHelpTriggerId = previousHelpTrigger;
        state.createValidationTouchedFields = previousTouched;
        state.createValidationRevealedFields = previousRevealed;
        state.createValidationSubmitAttempted = previousSubmitAttempted;
        state.createValidationSnapshot = previousSnapshot;
        state.lastFocused = previousLastFocused;
        state.notice.type = previousNotice.type || "info";
        state.notice.message = previousNotice.message || "";
        renderShell({ preserveFocus: false, preserveScroll: false });
      }
    }

    {
      const previousTournament = state.store.tournament;
      const previousActiveTab = state.activeTab;
      const previousStoredActiveTab = state.store.ui.activeTab;
      try {
        const creationResults = [
          ["ko", 8, {}],
          ["double_ko", 8, {}],
          ["league", 6, {}],
          ["groups_ko", 8, {}],
          ["preliminary_final", 8, { finalStageQualifierCount: 4 }],
        ].map(([mode, count, overrides]) => {
          state.store.tournament = null;
          const input = {
            ...createDefaultCreateDraft(state.store.settings),
            name: `Release 6 ${mode}`,
            mode,
            x01Preset: X01_PRESET_CUSTOM,
            participantsText: Array.from({ length: count }, (_, index) => `${mode} ${index + 1}`).join("\n"),
            tournamentTimeProfile: state.store.settings.tournamentTimeProfile,
            ...overrides,
          };
          const validation = validateCreateConfiguration(input, state.store.settings);
          const result = validation.valid
            ? createTournamentSession({
              ...validation.config,
              participants: parseParticipantLines(input.participantsText),
            })
            : { ok: false };
          return result.ok && result.tournament?.mode === mode;
        });
        state.store.tournament = null;
        const duplicateConfig = {
          ...createDefaultCreateDraft(state.store.settings),
          name: "Duplicate Session",
          mode: "ko",
          x01Preset: X01_PRESET_CUSTOM,
          participants: [
            { id: "A", name: "Max" },
            { id: "B", name: "MAX" },
          ],
        };
        delete duplicateConfig.participantsText;
        const duplicateSession = createTournamentSession(duplicateConfig);
        record(
          "Create-Session Release 6: alle fünf Modi nutzen zentrale Validation und Duplikate bleiben blockiert",
          creationResults.every(Boolean)
            && duplicateSession?.ok === false
            && duplicateSession?.reasonCode === "participant_name_duplicate",
          `modes=${creationResults.join("/")}, duplicate=${duplicateSession?.reasonCode || "-"}`,
        );
      } catch (error) {
        record("Create-Session Release 6: zentrale Validation", false, String(error?.message || error));
      } finally {
        state.store.tournament = previousTournament;
        state.activeTab = previousActiveTab;
        state.store.ui.activeTab = previousStoredActiveTab;
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
      const tournament = createTournament({
        name: "FixedLegsSafety",
        mode: "preliminary_final",
        preliminaryMatchesPerParticipant: 4,
        preliminaryScoring: { win: 2, draw: 1, loss: 0 },
        finalStageType: "ko",
        finalStageQualifierCount: 4,
        finalStageBestOfLegs: 5,
        participants: participantList(5, "FL"),
      });
      const match = tournament.matches.find((entry) => entry.stage === MATCH_STAGE_PRELIMINARY);
      let reasonCode = "";
      try {
        buildLobbyCreatePayload(tournament, match);
      } catch (error) {
        reasonCode = normalizeText(error?.reasonCode);
      }
      record(
        "Fixed 2 Legs: API-Start wird ohne exakte Abbildung explizit gesperrt",
        reasonCode === "fixed_legs_api_unsupported",
        `reasonCode=${reasonCode || "-"}`,
      );
    } catch (error) {
      record("Fixed 2 Legs: API-Start wird ohne exakte Abbildung explizit gesperrt", false, String(error?.message || error));
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
      const baseDraft = normalizeCreateDraft({
        mode: "groups_ko",
        participantsText: "A\nB\nC\nD\nE\nF\nG",
        groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_REQUIRE_EVEN,
      });
      const requireEvenHtml = renderGroupsKoOddParticipantPolicyFields(baseDraft);
      const allowUnequalHtml = renderGroupsKoOddParticipantPolicyFields({
        ...baseDraft,
        groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL,
      });
      const otherModeHtml = renderGroupsKoOddParticipantPolicyFields({ ...baseDraft, mode: "league" });
      record(
        "Groups+KO odd UI: Policy, Live-Analyse und Bestaetigung sind kontextabhaengig",
        requireEvenHtml.includes('name="groupsKoOddParticipantPolicy"')
          && requireEvenHtml.includes("Gruppe A: 4 Spieler, 3 Spiele je Spieler, 2 von 4 qualifizieren sich.")
          && requireEvenHtml.includes("Gruppe B: 3 Spieler, 2 Spiele je Spieler, 2 von 3 qualifizieren sich.")
          && !requireEvenHtml.includes('name="groupsKoOddParticipantAcknowledged"')
          && allowUnequalHtml.includes('name="groupsKoOddParticipantAcknowledged"')
          && allowUnequalHtml.includes('data-help-topic="groupsKoOddParticipants"')
          && otherModeHtml === "",
        `require=${requireEvenHtml.length}, allow=${allowUnequalHtml.length}, other=${otherModeHtml.length}`,
      );
    } catch (error) {
      record("Groups+KO odd UI: Policy, Live-Analyse und Bestaetigung sind kontextabhaengig", false, String(error?.message || error));
    }

    try {
      const tournamentBefore = state.store.tournament;
      const blocked = createTournamentSession({
        name: "GroupsKoBlocked",
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
        groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_REQUIRE_EVEN,
        groupsKoOddParticipantAcknowledged: false,
        participants: participantList(5, "BL"),
      });
      record(
        "Groups+KO odd start: blockierter Start liefert stabilen Code und klare Meldung",
        blocked?.ok === false
          && blocked?.reasonCode === "groups_ko_odd_participants_blocked"
          && normalizeText(blocked?.message).includes("gerade Teilnehmerzahl")
          && state.store.tournament === tournamentBefore,
        `reason=${blocked?.reasonCode || "-"}, stable=${state.store.tournament === tournamentBefore}`,
      );
    } catch (error) {
      record("Groups+KO odd start: blockierter Start liefert stabilen Code und klare Meldung", false, String(error?.message || error));
    }

    try {
      const legacy = createTournament({
        name: "GroupsKoLegacyUi",
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
        participants: participantList(5, "LU"),
      });
      delete legacy.rules.groupsKoOddParticipantPolicy;
      delete legacy.rules.groupsKoOddParticipantAcknowledged;
      const normalized = normalizeTournament(legacy);
      const noticeHtml = renderActiveGroupsKoPolicyNotice(normalized);
      record(
        "Groups+KO Legacy UI: fehlende historische Bestaetigung bleibt sichtbar und nutzbar",
        normalized.rules.groupsKoOddParticipantPolicy === GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL
          && normalized.rules.groupsKoOddParticipantAcknowledged === false
          && noticeHtml.includes("Bestandshinweis")
          && noticeHtml.includes("bleibt unverändert nutzbar")
          && noticeHtml.includes("keine allgemeine offizielle Regelkonformität"),
        `policy=${normalized.rules.groupsKoOddParticipantPolicy}, ack=${normalized.rules.groupsKoOddParticipantAcknowledged}`,
      );
    } catch (error) {
      record("Groups+KO Legacy UI: fehlende historische Bestaetigung bleibt sichtbar und nutzbar", false, String(error?.message || error));
    }

    {
      const previousDraft = state.store.ui.createDraft;
      try {
        const form = document.createElement("form");
        state.store.ui.createDraft = normalizeCreateDraft({
          mode: "groups_ko",
          participantsText: "A\nB\nC\nD\nE",
          groupsKoOddParticipantPolicy: GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL,
          groupsKoOddParticipantAcknowledged: true,
        }, state.store.settings);
        form.innerHTML = `
          <select name="mode"><option value="groups_ko" selected>groups_ko</option></select>
          <textarea name="participants">A\nB\nC\nD\nE\nF\nG</textarea>
          <select name="groupsKoOddParticipantPolicy"><option value="allow_unequal" selected>allow_unequal</option></select>
          <input name="groupsKoOddParticipantAcknowledged" type="checkbox" checked>
        `;
        resetGroupsKoOddParticipantAcknowledgementIfBasisChanged(form);
        const acknowledgement = form.elements.namedItem("groupsKoOddParticipantAcknowledged");
        record(
          "Groups+KO odd UI: Bestaetigung wird bei geaenderter Teilnehmerzahl zurueckgesetzt",
          acknowledgement instanceof HTMLInputElement && acknowledgement.checked === false,
          `checked=${acknowledgement instanceof HTMLInputElement ? acknowledgement.checked : "missing"}`,
        );
      } catch (error) {
        record("Groups+KO odd UI: Bestaetigung wird bei geaenderter Teilnehmerzahl zurueckgesetzt", false, String(error?.message || error));
      } finally {
        state.store.ui.createDraft = previousDraft;
      }
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
        "Migration: v2 -> v5 setzt Tie-Break-Profil",
        migrated.schemaVersion === 5
          && migrated.tournament?.rules?.tieBreakProfile === TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE
          && migrated.settings?.tournamentTimeProfile === TOURNAMENT_TIME_PROFILE_NORMAL
          && migrated.settings?.featureFlags?.koDrawLockDefault === true,
        `schema=${migrated.schemaVersion}, profile=${migrated.tournament?.rules?.tieBreakProfile}`,
      );
    } catch (error) {
      record("Migration: v2 -> v5 setzt Tie-Break-Profil", false, String(error?.message || error));
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
