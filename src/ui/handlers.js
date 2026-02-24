// Auto-generated module split from dist source.
  function ensureHost() {
    let host = document.getElementById(UI_HOST_ID);
    if (!host) {
      host = document.createElement("div");
      host.id = UI_HOST_ID;
      document.documentElement.appendChild(host);
    }
    if (!(host instanceof HTMLElement)) {
      throw new Error("ATA host element not available.");
    }
    state.host = host;

    if (!host.shadowRoot) {
      host.attachShadow({ mode: "open" });
    }
    state.shadowRoot = host.shadowRoot;
  }


  function renderShell() {
    if (!state.shadowRoot) {
      return;
    }

    state.shadowRoot.innerHTML = buildShellHtml();
    bindUiHandlers();
    if (state.activeTab === "view") {
      queueBracketRender();
      syncBracketFallbackVisibility();
    }
  }


  function bindUiHandlers() {
    const shadow = state.shadowRoot;
    if (!shadow) {
      return;
    }

    shadow.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        const tabId = button.getAttribute("data-tab");
        if (!TAB_IDS.includes(tabId)) {
          return;
        }
        state.activeTab = tabId;
        state.store.ui.activeTab = tabId;
        schedulePersist();
        renderShell();
      });
    });

    shadow.querySelectorAll("[data-action='set-matches-sort']").forEach((button) => {
      button.addEventListener("click", () => {
        const sortMode = sanitizeMatchesSortMode(button.getAttribute("data-sort-mode"), MATCH_SORT_MODE_READY_FIRST);
        if (state.store.ui.matchesSortMode === sortMode) {
          return;
        }
        state.store.ui.matchesSortMode = sortMode;
        schedulePersist();
        renderShell();
      });
    });

    const createForm = shadow.getElementById("ata-create-form");
    if (createForm instanceof HTMLFormElement) {
      syncCreateFormDependencies(createForm);
      const handleDraftInputChange = (event) => {
        const target = event?.target;
        const fieldName = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement
          ? normalizeText(target.name || "")
          : "";
        if (isCreateDraftX01Field(fieldName)) {
          setCreateFormPresetValue(createForm, X01_PRESET_CUSTOM);
        }
        syncCreateFormDependencies(createForm);
        updateCreateDraftFromForm(createForm, true);
      };
      createForm.addEventListener("input", handleDraftInputChange);
      createForm.addEventListener("change", handleDraftInputChange);
      createForm.addEventListener("submit", (event) => {
        event.preventDefault();
        handleCreateTournament(createForm);
      });

      const applyPresetButton = createForm.querySelector("[data-action='apply-pdc-preset']");
      if (applyPresetButton instanceof HTMLButtonElement) {
        applyPresetButton.addEventListener("click", () => {
          applyPdcPresetToCreateForm(createForm);
        });
      }
    }

    const shuffleParticipantsButton = shadow.querySelector("[data-action='shuffle-participants']");
    if (shuffleParticipantsButton && createForm instanceof HTMLFormElement) {
      shuffleParticipantsButton.addEventListener("click", () => handleShuffleParticipants(createForm));
    }

    shadow.querySelectorAll("[data-action='close-drawer']").forEach((button) => {
      button.addEventListener("click", () => closeDrawer());
    });

    shadow.querySelectorAll("[data-action='save-match']").forEach((button) => {
      button.addEventListener("click", () => {
        const matchId = button.getAttribute("data-match-id");
        if (matchId) {
          handleSaveMatchResult(matchId);
        }
      });
    });

    shadow.querySelectorAll("[data-action='start-match']").forEach((button) => {
      button.addEventListener("click", () => {
        const matchId = button.getAttribute("data-match-id");
        if (!matchId) {
          return;
        }
        handleStartMatch(matchId).catch((error) => {
          logError("api", "Start-match handler failed unexpectedly.", error);
          setNotice("error", "Matchstart ist unerwartet fehlgeschlagen.");
        });
      });
    });

    const resetButton = shadow.querySelector("[data-action='reset-tournament']");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        handleResetTournament();
      });
    }

    const exportFileButton = shadow.querySelector("[data-action='export-file']");
    if (exportFileButton) {
      exportFileButton.addEventListener("click", () => handleExportFile());
    }

    const exportClipboardButton = shadow.querySelector("[data-action='export-clipboard']");
    if (exportClipboardButton) {
      exportClipboardButton.addEventListener("click", () => handleExportClipboard());
    }

    const importTextButton = shadow.querySelector("[data-action='import-text']");
    if (importTextButton) {
      importTextButton.addEventListener("click", () => handleImportFromTextarea());
    }

    const fileInput = shadow.getElementById("ata-import-file");
    if (fileInput instanceof HTMLInputElement) {
      fileInput.addEventListener("change", () => handleImportFromFile(fileInput));
    }

    const debugToggle = shadow.getElementById("ata-setting-debug");
    if (debugToggle instanceof HTMLInputElement) {
      debugToggle.addEventListener("change", () => {
        state.store.settings.debug = debugToggle.checked;
        schedulePersist();
        setNotice("success", `Debug-Mode ${debugToggle.checked ? "aktiviert" : "deaktiviert"}.`, 1800);
      });
    }

    const autoLobbyToggle = shadow.getElementById("ata-setting-autolobby");
    if (autoLobbyToggle instanceof HTMLInputElement) {
      autoLobbyToggle.addEventListener("change", () => {
        state.store.settings.featureFlags.autoLobbyStart = autoLobbyToggle.checked;
        if (!autoLobbyToggle.checked) {
          state.apiAutomation.authBackoffUntil = 0;
        }
        schedulePersist();
        setNotice("info", `Auto-Lobby + API-Sync: ${autoLobbyToggle.checked ? "ON" : "OFF"}.`, 2200);
        if (autoLobbyToggle.checked) {
          syncPendingApiMatches().catch((error) => {
            logWarn("api", "Immediate sync after toggle failed.", error);
          });
        }
      });
    }

    const randomizeKoToggle = shadow.getElementById("ata-setting-randomize-ko");
    if (randomizeKoToggle instanceof HTMLInputElement) {
      randomizeKoToggle.addEventListener("change", () => {
        state.store.settings.featureFlags.randomizeKoRound1 = randomizeKoToggle.checked;
        state.store.ui.createDraft = normalizeCreateDraft({
          ...state.store.ui.createDraft,
          randomizeKoRound1: randomizeKoToggle.checked,
        }, state.store.settings);
        schedulePersist();
        setNotice("info", `KO-Erstrunden-Mix: ${randomizeKoToggle.checked ? "ON" : "OFF"}.`, 2200);
        if (state.activeTab === "tournament" && !state.store.tournament) {
          renderShell();
        }
      });
    }

    const tieBreakSelect = shadow.getElementById("ata-setting-tiebreak");
    if (tieBreakSelect instanceof HTMLSelectElement) {
      tieBreakSelect.addEventListener("change", () => {
        const result = setTournamentTieBreakMode(tieBreakSelect.value);
        if (!result.ok) {
          setNotice("error", result.message || "Tie-Break-Modus konnte nicht gesetzt werden.");
          return;
        }
        if (result.changed) {
          setNotice("success", "Tie-Break-Modus aktualisiert.", 1800);
        }
      });
    }

    const retryBracketButton = shadow.querySelector("[data-action='retry-bracket']");
    if (retryBracketButton) {
      retryBracketButton.addEventListener("click", () => queueBracketRender(true));
    }

    const drawer = shadow.querySelector(".ata-drawer");
    if (drawer) {
      drawer.addEventListener("keydown", handleDrawerKeydown);
    }
  }


  function handleDrawerKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDrawer();
      return;
    }

    if (event.key !== "Tab" || !state.drawerOpen) {
      return;
    }

    const drawer = state.shadowRoot?.querySelector(".ata-drawer");
    if (!drawer) {
      return;
    }

    const focusables = Array.from(drawer.querySelectorAll(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    )).filter((element) => !element.hasAttribute("disabled"));

    if (!focusables.length) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const current = drawer.getRootNode().activeElement;

    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }


  function openDrawer() {
    state.lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    state.drawerOpen = true;
    renderShell();
    const firstInteractive = state.shadowRoot?.querySelector(".ata-drawer button, .ata-drawer input, .ata-drawer select, .ata-drawer textarea");
    if (firstInteractive instanceof HTMLElement) {
      firstInteractive.focus();
    }
  }


  function closeDrawer() {
    state.drawerOpen = false;
    renderShell();
    if (state.lastFocused instanceof HTMLElement) {
      state.lastFocused.focus();
    }
  }


  function toggleDrawer() {
    if (state.drawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }


  function isCreateDraftX01Field(fieldName) {
    return [
      "startScore",
      "x01InMode",
      "x01OutMode",
      "x01BullMode",
      "x01BullOffMode",
      "x01MaxRounds",
    ].includes(normalizeText(fieldName || ""));
  }


  function setCreateFormPresetValue(form, presetId) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const presetInput = form.querySelector("#ata-x01-preset");
    if (!(presetInput instanceof HTMLInputElement)) {
      return;
    }
    const normalizedPreset = sanitizeX01Preset(presetId, X01_PRESET_CUSTOM);
    presetInput.value = normalizedPreset;
  }


  function refreshCreateFormPresetBadge(form) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const presetInput = form.querySelector("#ata-x01-preset");
    const presetBadge = form.querySelector(".ata-preset-pill");
    if (!(presetInput instanceof HTMLInputElement) || !(presetBadge instanceof HTMLElement)) {
      return;
    }
    const presetId = sanitizeX01Preset(presetInput.value, X01_PRESET_CUSTOM);
    presetBadge.textContent = presetId === X01_PRESET_PDC_STANDARD
      ? "Preset aktiv: PDC-Standard"
      : "Preset aktiv: Individuell";
  }


  function syncCreateFormDependencies(form) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const bullOffSelect = form.querySelector("#ata-x01-bulloff");
    const bullModeSelect = form.querySelector("#ata-x01-bullmode");
    if (!(bullOffSelect instanceof HTMLSelectElement) || !(bullModeSelect instanceof HTMLSelectElement)) {
      refreshCreateFormPresetBadge(form);
      return;
    }

    const disableBullMode = normalizeText(bullOffSelect.value) === "Off";
    bullModeSelect.disabled = disableBullMode;
    bullModeSelect.title = disableBullMode
      ? "Bull-Modus ist bei Bull-off = Off ohne Wirkung und daher schreibgesch\u00fctzt."
      : "";

    let hiddenBullMode = form.querySelector("#ata-x01-bullmode-hidden");
    if (disableBullMode) {
      if (!(hiddenBullMode instanceof HTMLInputElement)) {
        hiddenBullMode = document.createElement("input");
        hiddenBullMode.type = "hidden";
        hiddenBullMode.id = "ata-x01-bullmode-hidden";
        hiddenBullMode.name = "x01BullMode";
        bullModeSelect.insertAdjacentElement("afterend", hiddenBullMode);
      }
      hiddenBullMode.value = sanitizeX01BullMode(bullModeSelect.value);
    } else if (hiddenBullMode instanceof HTMLElement) {
      hiddenBullMode.remove();
    }

    refreshCreateFormPresetBadge(form);
  }


  function applyPdcPresetToCreateForm(form) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const pdcSettings = buildPdcX01Settings();
    const assignments = [
      ["#ata-startscore", String(pdcSettings.baseScore)],
      ["#ata-x01-inmode", pdcSettings.inMode],
      ["#ata-x01-outmode", pdcSettings.outMode],
      ["#ata-x01-bullmode", pdcSettings.bullMode],
      ["#ata-x01-bulloff", pdcSettings.bullOffMode],
      ["#ata-x01-maxrounds", String(pdcSettings.maxRounds)],
    ];

    assignments.forEach(([selector, value]) => {
      const field = form.querySelector(selector);
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
        field.value = value;
      }
    });

    setCreateFormPresetValue(form, X01_PRESET_PDC_STANDARD);
    syncCreateFormDependencies(form);
    updateCreateDraftFromForm(form, true);
    setNotice("info", "PDC-Preset wurde auf die X01-Felder angewendet.", 2200);
  }


  function readCreateDraftInput(formData) {
    return {
      name: formData.get("name"),
      mode: formData.get("mode"),
      bestOfLegs: formData.get("bestOfLegs"),
      startScore: formData.get("startScore"),
      x01Preset: formData.get("x01Preset"),
      x01InMode: formData.get("x01InMode"),
      x01OutMode: formData.get("x01OutMode"),
      x01BullMode: formData.get("x01BullMode"),
      x01MaxRounds: formData.get("x01MaxRounds"),
      x01BullOffMode: formData.get("x01BullOffMode"),
      participantsText: String(formData.get("participants") || ""),
      randomizeKoRound1: formData.get("randomizeKoRound1") !== null,
    };
  }


  function updateCreateDraftFromForm(form, persist = true) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const formData = new FormData(form);
    const nextDraft = normalizeCreateDraft(readCreateDraftInput(formData), state.store.settings);
    const currentDraft = state.store.ui.createDraft || {};
    const changed = JSON.stringify(nextDraft) !== JSON.stringify(currentDraft);
    if (!changed) {
      return;
    }
    state.store.ui.createDraft = nextDraft;
    if (persist) {
      schedulePersist();
    }
  }


  function handleShuffleParticipants(form) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const participantField = form.querySelector("#ata-participants");
    if (!(participantField instanceof HTMLTextAreaElement)) {
      return;
    }
    const participants = parseParticipantLines(participantField.value);
    if (participants.length < 2) {
      setNotice("info", "Mindestens zwei Teilnehmer zum Mischen eingeben.", 2200);
      return;
    }
    const shuffledNames = shuffleArray(participants.map((participant) => participant.name));
    participantField.value = shuffledNames.join("\n");
    updateCreateDraftFromForm(form, true);
    setNotice("success", "Teilnehmer wurden zuf\u00e4llig gemischt.", 1800);
  }


  function handleCreateTournament(form) {
    syncCreateFormDependencies(form);
    const formData = new FormData(form);
    const draft = normalizeCreateDraft(readCreateDraftInput(formData), state.store.settings);
    state.store.ui.createDraft = draft;
    const participants = parseParticipantLines(formData.get("participants"));
    const config = {
      name: draft.name,
      mode: draft.mode,
      bestOfLegs: draft.bestOfLegs,
      startScore: draft.startScore,
      x01Preset: draft.x01Preset,
      x01InMode: draft.x01InMode,
      x01OutMode: draft.x01OutMode,
      x01BullMode: draft.x01BullMode,
      x01MaxRounds: draft.x01MaxRounds,
      x01BullOffMode: draft.x01BullOffMode,
      lobbyVisibility: "private",
      randomizeKoRound1: draft.randomizeKoRound1,
      participants,
    };

    const errors = validateCreateConfig(config);
    if (errors.length) {
      setNotice("error", errors.join(" "));
      return;
    }

    state.store.tournament = createTournament(config);
    schedulePersist();
    setNotice("success", "Turnier wurde erstellt.");
    state.activeTab = "matches";
    renderShell();
  }


  function getMatchFieldElement(shadow, fieldName, matchId) {
    const candidates = Array.from(shadow.querySelectorAll(`[data-field="${fieldName}"]`));
    return candidates.find((candidate) => candidate.getAttribute("data-match-id") === matchId) || null;
  }


  function handleSaveMatchResult(matchId) {
    const shadow = state.shadowRoot;
    if (!shadow) {
      return;
    }
    const tournament = state.store.tournament;
    if (!tournament) {
      return;
    }
    const match = findMatch(tournament, matchId);
    if (!match) {
      setNotice("error", "Match nicht gefunden.");
      return;
    }
    const editability = getMatchEditability(tournament, match);
    if (!editability.editable) {
      setNotice("error", editability.reason || "Match ist nicht freigeschaltet.");
      return;
    }
    const legsP1Input = getMatchFieldElement(shadow, "legs-p1", matchId);
    const legsP2Input = getMatchFieldElement(shadow, "legs-p2", matchId);

    if (!(legsP1Input instanceof HTMLInputElement) || !(legsP2Input instanceof HTMLInputElement)) {
      return;
    }

    const p1Legs = clampInt(legsP1Input.value, 0, 0, 99);
    const p2Legs = clampInt(legsP2Input.value, 0, 0, 99);
    if (p1Legs === p2Legs) {
      setNotice("error", "Ung\u00fcltiges Ergebnis: Bei Best-of ist kein Gleichstand m\u00f6glich.");
      return;
    }

    const winnerId = p1Legs > p2Legs ? match.player1Id : match.player2Id;

    const result = updateMatchResult(matchId, winnerId, {
      p1: p1Legs,
      p2: p2Legs,
    }, "manual");

    if (result.ok) {
      setNotice("success", "Match gespeichert.", 1800);
    } else {
      setNotice("error", result.message || "Match konnte nicht gespeichert werden.");
    }
  }


  function handleResetTournament() {
    const confirmed = window.confirm("Soll das Turnier wirklich gel\u00f6scht werden? Dieser Schritt kann nicht r\u00fcckg\u00e4ngig gemacht werden.");
    if (!confirmed) {
      return;
    }
    state.store.tournament = null;
    state.apiAutomation.startingMatchId = "";
    state.apiAutomation.authBackoffUntil = 0;
    schedulePersist();
    setNotice("success", "Turnier wurde gel\u00f6scht.");
    state.activeTab = "tournament";
    renderShell();
  }


  function exportDataPayload() {
    return {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      exportedAt: nowIso(),
      tournament: state.store.tournament,
    };
  }


  function handleExportFile() {
    const payload = exportDataPayload();
    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ata-export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setNotice("success", "JSON-Datei exportiert.", 2000);
  }


  async function handleExportClipboard() {
    try {
      const payload = exportDataPayload();
      const text = JSON.stringify(payload, null, 2);
      await navigator.clipboard.writeText(text);
      setNotice("success", "JSON in Zwischenablage kopiert.", 2000);
    } catch (error) {
      setNotice("error", "Kopieren in Zwischenablage fehlgeschlagen.");
      logWarn("io", "Clipboard write failed.", error);
    }
  }


  function importPayload(rawObject) {
    if (!rawObject || typeof rawObject !== "object") {
      return { ok: false, message: "JSON ist leer oder ung\u00fcltig." };
    }

    let tournament = rawObject.tournament || null;
    if (!tournament && rawObject.mode && rawObject.participants) {
      tournament = rawObject;
    }

    const normalizedTournament = normalizeTournament(tournament);
    if (!normalizedTournament) {
      return { ok: false, message: "Turnierdaten konnten nicht validiert werden." };
    }

    const participantCountError = getParticipantCountError(normalizedTournament.mode, normalizedTournament.participants.length);
    if (participantCountError) {
      return { ok: false, message: participantCountError };
    }

    refreshDerivedMatches(normalizedTournament);
    state.store.tournament = normalizedTournament;
    schedulePersist();
    renderShell();
    return { ok: true };
  }


  function handleImportFromTextarea() {
    const textarea = state.shadowRoot?.getElementById("ata-import-text");
    if (!(textarea instanceof HTMLTextAreaElement)) {
      return;
    }

    try {
      const parsed = JSON.parse(textarea.value);
      const result = importPayload(parsed);
      if (result.ok) {
        setNotice("success", "JSON erfolgreich importiert.");
        state.activeTab = "matches";
        renderShell();
      } else {
        setNotice("error", result.message || "Import fehlgeschlagen.");
      }
    } catch (error) {
      setNotice("error", "JSON konnte nicht geparst werden.");
      logWarn("io", "Import parse failed.", error);
    }
  }


  function handleImportFromFile(fileInput) {
    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const result = importPayload(parsed);
        if (result.ok) {
          setNotice("success", "Datei erfolgreich importiert.");
          state.activeTab = "matches";
          renderShell();
        } else {
          setNotice("error", result.message || "Datei konnte nicht importiert werden.");
        }
      } catch (error) {
        setNotice("error", "Datei enth\u00e4lt kein g\u00fcltiges JSON.");
        logWarn("io", "File import parse failed.", error);
      }
    };
    reader.onerror = () => {
      setNotice("error", "Datei konnte nicht gelesen werden.");
    };
    reader.readAsText(file);
  }


