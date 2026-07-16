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
    host.tabIndex = -1;
    host.setAttribute("aria-label", "Autodarts Tournament Assistant");

    if (!host.shadowRoot) {
      host.attachShadow({ mode: "open" });
    }
    state.shadowRoot = host.shadowRoot;
  }


  function isElementAvailableForFocus(element) {
    if (!(element instanceof HTMLElement) || !element.isConnected) {
      return false;
    }
    if (element.hasAttribute("disabled") || element.getAttribute("aria-hidden") === "true") {
      return false;
    }
    if (element.closest("[hidden], [aria-hidden='true']")) {
      return false;
    }
    const style = typeof window.getComputedStyle === "function" ? window.getComputedStyle(element) : null;
    return !style || (style.display !== "none" && style.visibility !== "hidden");
  }


  function isElementProgrammaticallyFocusable(element) {
    return isElementAvailableForFocus(element) && element.matches(
      "a[href], button, input:not([type='hidden']), select, textarea, [tabindex], [contenteditable='true']",
    );
  }


  function focusElementWithoutScrolling(element) {
    if (!isElementProgrammaticallyFocusable(element)) {
      return false;
    }
    try {
      element.focus({ preventScroll: true });
    } catch (_error) {
      element.focus();
    }
    const root = element.getRootNode();
    return root?.activeElement === element || document.activeElement === element;
  }


  function getDrawerFocusableElements(drawer) {
    if (!(drawer instanceof HTMLElement)) {
      return [];
    }
    return Array.from(drawer.querySelectorAll(
      "a[href], button, input:not([type='hidden']), select, textarea, [tabindex]:not([tabindex='-1'])",
    )).filter((element) => isElementAvailableForFocus(element));
  }


  function createShellFocusSnapshot() {
    const shadow = state.shadowRoot;
    const activeElement = shadow?.activeElement;
    if (!(activeElement instanceof HTMLElement) || !shadow.contains(activeElement)) {
      return null;
    }
    const attributes = {};
    [
      "name",
      "data-tab",
      "data-action",
      "data-field",
      "data-match-id",
      "data-sort-mode",
      "data-participant-id",
      "data-help-topic",
      "data-role",
    ].forEach((name) => {
      if (activeElement.hasAttribute(name)) {
        attributes[name] = activeElement.getAttribute(name);
      }
    });
    const sameTag = Array.from(shadow.querySelectorAll(activeElement.tagName.toLowerCase()));
    const snapshot = {
      id: activeElement.id || "",
      tagName: activeElement.tagName,
      viewContext: normalizeText(shadow.querySelector(".ata-root")?.getAttribute("data-active-tab") || ""),
      attributes,
      ordinal: sameTag.indexOf(activeElement),
      selectionStart: null,
      selectionEnd: null,
    };
    try {
      snapshot.selectionStart = activeElement.selectionStart;
      snapshot.selectionEnd = activeElement.selectionEnd;
    } catch (_error) {
      // Selection APIs are not available for every input type.
    }
    return snapshot;
  }


  function hasShellFocusSnapshotContradiction(candidate, snapshot) {
    if (!(candidate instanceof HTMLElement) || !snapshot) {
      return true;
    }
    if (snapshot.id && candidate.id !== snapshot.id) {
      return true;
    }
    return Object.entries(snapshot.attributes).some(
      ([name, value]) => candidate.getAttribute(name) !== value,
    );
  }


  function findShellFocusTarget(snapshot, options = {}) {
    const shadow = state.shadowRoot;
    if (!shadow || !snapshot) {
      return null;
    }
    if (snapshot.id) {
      const byId = shadow.getElementById(snapshot.id);
      if (isElementProgrammaticallyFocusable(byId)) {
        return byId;
      }
    }
    const candidates = Array.from(shadow.querySelectorAll(snapshot.tagName.toLowerCase()));
    const stableAttributes = Object.entries(snapshot.attributes);
    const exactMatches = stableAttributes.length
      ? candidates.filter((candidate) => stableAttributes.every(
        ([name, value]) => candidate.getAttribute(name) === value,
      ))
      : [];
    const exact = exactMatches.length === 1 ? exactMatches[0] : null;
    if (isElementProgrammaticallyFocusable(exact)) {
      return exact;
    }
    const ordinal = candidates[snapshot.ordinal];
    const currentViewContext = normalizeText(
      shadow.querySelector(".ata-root")?.getAttribute("data-active-tab") || "",
    );
    const allowOrdinal = options.allowOrdinal !== false
      && Boolean(snapshot.viewContext)
      && snapshot.viewContext === currentViewContext
      && ordinal?.tagName === snapshot.tagName
      && !hasShellFocusSnapshotContradiction(ordinal, snapshot);
    return allowOrdinal && isElementProgrammaticallyFocusable(ordinal) ? ordinal : null;
  }


  function findExplicitShellFocusTarget(focusTarget) {
    const shadow = state.shadowRoot;
    if (!shadow || !focusTarget || typeof focusTarget !== "object") {
      return null;
    }
    const selectors = [focusTarget.selector, focusTarget.fallbackSelector]
      .map((selector) => normalizeText(selector || ""))
      .filter(Boolean);
    for (const selector of selectors) {
      try {
        const candidate = shadow.querySelector(selector);
        if (isElementProgrammaticallyFocusable(candidate)) {
          return candidate;
        }
      } catch (_error) {
        // Explicit selectors are controlled by the application; an invalid one fails safely.
      }
    }
    return null;
  }


  function captureShellScrollPositions() {
    const shadow = state.shadowRoot;
    if (!shadow) return [];
    return [".ata-content", ".ata-tabs", ".ata-table-wrap", ".ata-bracket-frame"].flatMap((selector) => (
      Array.from(shadow.querySelectorAll(selector)).map((element, index) => ({
        selector,
        index,
        scrollTop: element.scrollTop,
        scrollLeft: element.scrollLeft,
      }))
    ));
  }


  function restoreShellScrollPositions(positions) {
    const shadow = state.shadowRoot;
    if (!shadow || !Array.isArray(positions)) return;
    positions.forEach((position) => {
      const element = shadow.querySelectorAll(position.selector)[position.index];
      if (element instanceof HTMLElement) {
        element.scrollTop = position.scrollTop;
        element.scrollLeft = position.scrollLeft;
      }
    });
  }


  function renderShell(options = {}) {
    if (!state.shadowRoot) {
      return;
    }

    const hasExplicitFocusStrategy = Boolean(options.focusTarget && typeof options.focusTarget === "object");
    const preserveFocus = options.preserveFocus !== false && state.drawerOpen && !hasExplicitFocusStrategy;
    const preserveScroll = options.preserveScroll !== false && state.drawerOpen;
    const focusSnapshot = preserveFocus ? createShellFocusSnapshot() : null;
    const scrollPositions = preserveScroll ? captureShellScrollPositions() : [];
    state.shadowRoot.innerHTML = buildShellHtml();
    bindUiHandlers();
    syncLoaderMenuUpdateIndicator();
    if (state.activeTab === "view") {
      queueBracketRender();
      syncBracketFallbackVisibility();
    }
    restoreShellScrollPositions(scrollPositions);
    const focusTarget = hasExplicitFocusStrategy
      ? findExplicitShellFocusTarget(options.focusTarget)
      : findShellFocusTarget(focusSnapshot, { allowOrdinal: true });
    if (focusElementWithoutScrolling(focusTarget)) {
      try {
        if (
          focusSnapshot
          && Number.isInteger(focusSnapshot.selectionStart)
          && Number.isInteger(focusSnapshot.selectionEnd)
          && typeof focusTarget.setSelectionRange === "function"
        ) {
          focusTarget.setSelectionRange(focusSnapshot.selectionStart, focusSnapshot.selectionEnd);
        }
      } catch (_error) {
        // Selection restoration is best-effort for text controls.
      }
    }
  }


  async function hydrateStoredUpdateStatus() {
    setUpdateStatus(readStoredUpdateStatus({
      windowRef: window,
      installedVersion: APP_VERSION,
    }));
  }


  function refreshUpdateStatus(options = {}) {
    const force = Boolean(options.force);
    const announce = Boolean(options.announce);

    if (!state.updateStatus.capable) {
      return Promise.resolve(state.updateStatus);
    }
    if (state.updateCheckPromise) {
      return state.updateCheckPromise;
    }
    if (!force && !shouldRefreshUpdateStatus(state.updateStatus)) {
      return Promise.resolve(state.updateStatus);
    }

    setUpdateStatus({
      status: "checking",
      error: "",
      stale: Boolean(state.updateStatus.stale && state.updateStatus.checkedAt > 0),
    });

    const updatePromise = resolveLatestUpdateStatus({
      windowRef: window,
      installedVersion: APP_VERSION,
      force,
    }).then((nextStatus) => {
      setUpdateStatus(nextStatus);
      if (announce) {
        if (nextStatus.status === "available") {
          const actionText = isLoaderRuntimeActive()
            ? `Neue Version gefunden: ${APP_VERSION} -> ${nextStatus.remoteVersion}. Ein Reload reicht, da der Loader aktiv ist.`
            : `Neue Version gefunden: ${APP_VERSION} -> ${nextStatus.remoteVersion}.`;
          setNotice("info", actionText, 4200);
        } else if (nextStatus.status === "current") {
          setNotice("success", `Kein neueres Update gefunden. Aktuell installiert: ${APP_VERSION}.`, 2800);
        } else if (nextStatus.status === "error" || nextStatus.error) {
          setNotice("error", nextStatus.error || "Update-Prüfung fehlgeschlagen.", 4200);
        }
      }
      return nextStatus;
    }).finally(() => {
      state.updateCheckPromise = null;
    });

    state.updateCheckPromise = updatePromise;
    return updatePromise;
  }


  function installAvailableUpdate() {
    if (!state.updateStatus?.available) {
      return false;
    }
    if (isLoaderRuntimeActive()) {
      return reloadForLoaderUpdate(window);
    }
    return openUserscriptInstall(window);
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
        renderShell({
          preserveFocus: false,
          preserveScroll: false,
          focusTarget: { selector: `[data-tab="${tabId}"]` },
        });
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
      refreshCreateFormGroupsKoPolicy(createForm);
      refreshCreateFormPreliminaryFinal(createForm);
      refreshCreateGameRulesSummary(createForm);
      refreshCreateValidationUi(createForm);
      refreshCreateHelpUi(createForm);
      const handleDraftInputChange = (event) => {
        const target = event?.target;
        const fieldName = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement
          ? normalizeText(target.name || "")
          : "";
        markCreateValidationFieldTouched(fieldName);
        if (fieldName === "tournamentTimeProfile" && target instanceof HTMLSelectElement) {
          const profileId = sanitizeTournamentTimeProfile(
            target.value,
            TOURNAMENT_TIME_PROFILE_NORMAL,
          );
          if (state.store.settings.tournamentTimeProfile !== profileId) {
            state.store.settings.tournamentTimeProfile = profileId;
            schedulePersist();
          }
        }
        if (fieldName === "x01Preset") {
          if (
            event.type === "change"
            && target instanceof HTMLInputElement
            && target.type === "radio"
            && target.checked
          ) {
            applySelectedPresetToCreateForm(createForm, target.value);
            refreshCreateHelpUi(createForm);
          }
          return;
        }
        if (isCreateDraftPresetField(fieldName)) {
          setCreateFormPresetValue(createForm, X01_PRESET_CUSTOM);
        }
        resetGroupsKoOddParticipantAcknowledgementIfBasisChanged(createForm);
        syncCreateFormDependencies(createForm);
        updateCreateDraftFromForm(createForm, true);
        refreshCreateGameRulesSummary(createForm);
        refreshCreateFormGroupsKoPolicy(createForm);
        const preliminarySummaryFields = [
          "preliminaryMatchesPerParticipant",
          "finalStageType",
          "finalStageQualifierCount",
        ];
        if (
          fieldName === "mode"
          || fieldName === "participants"
          || (event.type === "change" && preliminarySummaryFields.includes(fieldName))
        ) {
          refreshCreateFormPreliminaryFinal(createForm);
        }
        refreshCreateValidationUi(createForm);
        refreshCreateHelpUi(createForm);
      };
      createForm.addEventListener("input", handleDraftInputChange);
      createForm.addEventListener("change", handleDraftInputChange);
      createForm.addEventListener("focusout", (event) => {
        const target = event?.target;
        const fieldName = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement
          ? normalizeText(target.name || "")
          : "";
        if (markCreateValidationFieldTouched(fieldName)) refreshCreateValidationUi(createForm);
      });
      createForm.addEventListener("submit", (event) => {
        event.preventDefault();
        handleCreateTournament(createForm);
      });
      createForm.addEventListener("click", (event) => {
        const target = event.target instanceof Element ? event.target.closest("button[data-action]") : null;
        if (!(target instanceof HTMLButtonElement) || !createForm.contains(target)) return;
        const action = target.getAttribute("data-action");
        if (action === "open-create-help") {
          handleOpenCreateHelp(target, createForm);
        } else if (action === "close-create-help") {
          closeCreateHelpPanel(createForm, { returnFocus: true });
        } else if (action === "toggle-duration-estimate-visibility") {
          state.store.ui.durationEstimateVisible = state.store.ui.durationEstimateVisible === false;
          schedulePersist();
          refreshCreateValidationUi(createForm);
        }
      });

      const gameRulesToggle = createForm.querySelector("[data-action='toggle-game-rules-editor']");
      if (gameRulesToggle instanceof HTMLButtonElement) {
        gameRulesToggle.addEventListener("click", () => {
          setCreateGameRulesExpanded(createForm, state.createGameRulesExpanded !== true);
        });
      }

    }

    shadow.querySelectorAll("[data-action='set-duration-time-profile']").forEach((select) => {
      if (!(select instanceof HTMLSelectElement)) {
        return;
      }
      if (select.closest("#ata-create-form")) {
        return;
      }
      select.addEventListener("change", () => {
        const profileId = sanitizeTournamentTimeProfile(
          select.value,
          TOURNAMENT_TIME_PROFILE_NORMAL,
        );
        if (state.store.settings.tournamentTimeProfile === profileId) {
          return;
        }
        state.store.settings.tournamentTimeProfile = profileId;
        schedulePersist();
        renderShell();
        setNotice("info", `Turnierzeit-Profil: ${getTournamentTimeProfileMeta(profileId).label}.`, 2200);
      });
    });

    shadow.querySelectorAll("[data-action='set-duration-board-count']").forEach((field) => {
      if (!(field instanceof HTMLInputElement)) {
        return;
      }
      field.addEventListener("change", () => {
        const tournament = state.store.tournament;
        if (!tournament) {
          return;
        }
        const nextBoardCount = sanitizeTournamentBoardCount(
          field.value,
          tournament?.duration?.boardCount,
        );
        if (!tournament.duration || typeof tournament.duration !== "object") {
          tournament.duration = { boardCount: nextBoardCount };
        } else if (tournament.duration.boardCount === nextBoardCount) {
          return;
        } else {
          tournament.duration.boardCount = nextBoardCount;
        }
        tournament.updatedAt = nowIso();
        schedulePersist();
        renderShell();
      });
    });

    shadow.querySelectorAll("[data-action='toggle-duration-estimate-visibility']").forEach((button) => {
      if (button.closest("#ata-create-form")) {
        return;
      }
      button.addEventListener("click", () => {
        state.store.ui.durationEstimateVisible = state.store.ui.durationEstimateVisible === false;
        schedulePersist();
        renderShell();
      });
    });

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
    shadow.querySelectorAll("[data-action='save-fixed-match']").forEach((button) => {
      button.addEventListener("click", () => { const matchId = button.getAttribute("data-match-id"); if (matchId) handleSaveFixedLegResult(matchId); });
    });
    shadow.querySelectorAll("[data-action='correct-preliminary-match']").forEach((button) => {
      button.addEventListener("click", () => { const matchId = button.getAttribute("data-match-id"); if (matchId) handleCorrectPreliminaryMatch(matchId); });
    });
    const generateFinalStageButton = shadow.querySelector("[data-action='generate-final-stage']");
    if (generateFinalStageButton) generateFinalStageButton.addEventListener("click", handleGenerateFinalStage);
    const saveQualificationButton = shadow.querySelector("[data-action='save-qualification-resolution']");
    if (saveQualificationButton) saveQualificationButton.addEventListener("click", handleSaveQualificationResolution);

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

    const copyMatchStartDebugButton = shadow.querySelector("[data-action='copy-matchstart-debug']");
    if (copyMatchStartDebugButton instanceof HTMLButtonElement) {
      copyMatchStartDebugButton.addEventListener("click", async () => {
        try {
          const report = buildMatchStartDebugReport(state.store);
          await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
          setNotice("success", "Matchstart-Debug in Zwischenablage kopiert.", 2200);
        } catch (error) {
          setNotice("error", "Matchstart-Debug konnte nicht kopiert werden.");
          logWarn("debug", "Clipboard write for matchstart debug failed.", error);
        }
      });
    }

    const clearMatchStartDebugButton = shadow.querySelector("[data-action='clear-matchstart-debug']");
    if (clearMatchStartDebugButton instanceof HTMLButtonElement) {
      clearMatchStartDebugButton.addEventListener("click", () => {
        clearMatchStartDebugSessions(state.store);
        schedulePersist();
        renderShell();
        setNotice("success", "Matchstart-Debug wurde geleert.", 1800);
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

    const koDrawLockDefaultToggle = shadow.getElementById("ata-setting-ko-draw-lock-default");
    if (koDrawLockDefaultToggle instanceof HTMLInputElement) {
      koDrawLockDefaultToggle.addEventListener("change", () => {
        state.store.settings.featureFlags.koDrawLockDefault = koDrawLockDefaultToggle.checked;
        schedulePersist();
        setNotice("info", `KO Draw-Lock (Standard): ${koDrawLockDefaultToggle.checked ? "ON" : "OFF"}.`, 2200);
      });
    }

    const koDrawLockedToggle = shadow.getElementById("ata-setting-ko-draw-locked");
    if (koDrawLockedToggle instanceof HTMLInputElement) {
      koDrawLockedToggle.addEventListener("change", () => {
        const targetDrawLocked = koDrawLockedToggle.checked;
        let result = null;
        if (!targetDrawLocked) {
          const pendingOverride = getPendingDrawUnlockOverrideForTournament(state.store?.tournament?.id);
          if (pendingOverride?.token) {
            const confirmed = window.confirm(
              "DRA 6.12.1 Hinweis: Das Entsperren des Draw-Lock darf nur als bewusster Promoter-Override erfolgen. Möchten Sie jetzt ausdrücklich entsperren?",
            );
            if (!confirmed) {
              setNotice("info", "KO Draw-Lock bleibt aktiv. Entsperren wurde nicht bestätigt.", 2600);
              renderShell();
              return;
            }
            result = setTournamentKoDrawLocked(false, {
              confirmOverrideToken: pendingOverride.token,
            });
          } else {
            result = setTournamentKoDrawLocked(false);
          }
        } else {
          result = setTournamentKoDrawLocked(true);
        }

        if (!result.ok) {
          const reasonCode = normalizeText(result.reasonCode || "");
          if (reasonCode === "draw_unlock_requires_override") {
            setNotice(
              "info",
              "Entsperren blockiert. Bitte den Schalter erneut auf AUS stellen und den Promoter-Override explizit bestätigen (DRA 6.12.1).",
              5200,
            );
          } else {
            setNotice("error", result.message || "KO Draw-Lock konnte nicht gesetzt werden.");
          }
          return;
        }
        if (result.changed) {
          setNotice("success", `KO Draw-Lock ${targetDrawLocked ? "aktiviert" : "deaktiviert"}.`, 1800);
        }
      });
    }

    const tieBreakSelect = shadow.getElementById("ata-setting-tiebreak");
    if (tieBreakSelect instanceof HTMLSelectElement) {
      tieBreakSelect.addEventListener("change", () => {
        const result = setTournamentTieBreakProfile(tieBreakSelect.value);
        if (!result.ok) {
          const reasonCode = normalizeText(result.reasonCode || "");
          if (reasonCode === "tie_break_locked") {
            setNotice("info", result.message || "Tie-Break-Profil ist nach dem ersten relevanten Ergebnis gesperrt.", 5200);
          } else {
            setNotice("error", result.message || "Tie-Break-Profil konnte nicht gesetzt werden.");
          }
          return;
        }
        if (result.changed) {
          setNotice("success", "Tie-Break-Profil aktualisiert.", 1800);
        }
      });
    }

    const checkUpdateButton = shadow.querySelector("[data-action='check-update']");
    if (checkUpdateButton instanceof HTMLButtonElement) {
      checkUpdateButton.addEventListener("click", () => {
        refreshUpdateStatus({
          force: true,
          announce: true,
        }).catch((error) => {
          logWarn("update", "Manual update check failed unexpectedly.", error);
          setNotice("error", "Update-Prüfung ist fehlgeschlagen.", 4200);
        });
      });
    }

    const installUpdateButton = shadow.querySelector("[data-action='install-update']");
    if (installUpdateButton instanceof HTMLButtonElement) {
      installUpdateButton.addEventListener("click", () => {
        const opened = installAvailableUpdate();
        if (!opened) {
          setNotice("error", "Update konnte nicht geöffnet werden.", 4200);
          return;
        }
        setNotice("info", "Userscript-Quelle wurde zum Update geöffnet.", 3200);
      });
    }

    const reloadUpdateButton = shadow.querySelector("[data-action='reload-update']");
    if (reloadUpdateButton instanceof HTMLButtonElement) {
      reloadUpdateButton.addEventListener("click", () => {
        const reloaded = installAvailableUpdate();
        if (!reloaded) {
          setNotice("error", "Reload für Loader-Update konnte nicht ausgelöst werden.", 4200);
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
      event.stopPropagation();
      if (state.activeCreateHelpTopic) {
        const createForm = state.shadowRoot?.getElementById("ata-create-form");
        if (createForm instanceof HTMLFormElement) {
          closeCreateHelpPanel(createForm, { returnFocus: true });
          return;
        }
      }
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

    const focusables = getDrawerFocusableElements(drawer);

    if (!focusables.length) {
      event.preventDefault();
      focusElementWithoutScrolling(drawer);
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const current = drawer.getRootNode().activeElement;

    if (!focusables.includes(current)) {
      event.preventDefault();
      focusElementWithoutScrolling(event.shiftKey ? last : first);
      return;
    }

    if (event.shiftKey && current === first) {
      event.preventDefault();
      focusElementWithoutScrolling(last);
      return;
    }

    if (!event.shiftKey && current === last) {
      event.preventDefault();
      focusElementWithoutScrolling(first);
    }
  }


  function openDrawer() {
    if (state.drawerOpen) {
      const drawer = state.shadowRoot?.querySelector(".ata-drawer");
      const activeElement = state.shadowRoot?.activeElement;
      if (!(activeElement instanceof HTMLElement) || !drawer?.contains(activeElement)) {
        const closeButton = state.shadowRoot?.querySelector(".ata-close-btn");
        if (!focusElementWithoutScrolling(closeButton)) focusElementWithoutScrolling(drawer);
      }
      return;
    }
    const activeElement = document.activeElement;
    state.lastFocused = activeElement instanceof HTMLElement && activeElement !== state.host
      ? activeElement
      : null;
    state.drawerOpen = true;
    renderShell({ preserveFocus: false, preserveScroll: false });
    const closeButton = state.shadowRoot?.querySelector(".ata-close-btn");
    const drawer = state.shadowRoot?.querySelector(".ata-drawer");
    if (!focusElementWithoutScrolling(closeButton)) focusElementWithoutScrolling(drawer);
  }


  function closeDrawer() {
    if (!state.drawerOpen) {
      return;
    }
    const returnFocusTarget = state.lastFocused;
    state.lastFocused = null;
    state.drawerOpen = false;
    state.createGameRulesExpanded = false;
    resetCreateHelpState();
    resetCreateValidationState();
    renderShell({ preserveFocus: false, preserveScroll: false });
    if (!focusElementWithoutScrolling(returnFocusTarget)) {
      focusElementWithoutScrolling(state.host);
    }
  }


  function toggleDrawer() {
    if (state.drawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }


  function isCreateDraftPresetField(fieldName) {
    return [
      "mode",
      "bestOfLegs",
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
    const presetRadios = Array.from(form.querySelectorAll("input[type='radio'][name='x01Preset']"));
    if (!presetRadios.length) {
      return;
    }
    const normalizedPreset = sanitizeX01Preset(presetId, X01_PRESET_CUSTOM);
    presetRadios.forEach((radio) => {
      if (radio instanceof HTMLInputElement) {
        radio.checked = radio.value === normalizedPreset;
      }
    });
  }


  function refreshCreateFormPresetSelection(form) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const draft = normalizeCreateDraft(readCreateDraftInput(form), state.store.settings);
    const presetId = getAppliedCreatePresetId(draft);
    setCreateFormPresetValue(form, presetId);
  }


  function syncCreateFormDependencies(form) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const bullOffSelect = form.querySelector("#ata-x01-bulloff");
    const bullModeSelect = form.querySelector("#ata-x01-bullmode");
    const modeSelect = form.querySelector("#ata-mode");
    const mode = modeSelect instanceof HTMLSelectElement ? normalizeText(modeSelect.value) : "ko";
    const activeRuleGroups = new Set(CREATE_MODE_RULE_GROUPS[mode] || []);
    form.querySelectorAll("[data-mode-rule-group]").forEach((group) => {
      if (!(group instanceof HTMLElement)) return;
      const groupId = normalizeText(group.getAttribute("data-mode-rule-group") || "");
      const active = activeRuleGroups.has(groupId);
      group.hidden = !active;
      group.querySelectorAll("input, select, textarea, button").forEach((control) => {
        if (
          control instanceof HTMLInputElement
          || control instanceof HTMLSelectElement
          || control instanceof HTMLTextAreaElement
          || control instanceof HTMLButtonElement
        ) {
          control.disabled = !active;
        }
      });
    });
    const standardBestOfField = form.querySelector("[data-role='standard-bestof-field']");
    if (standardBestOfField instanceof HTMLElement) {
      const active = mode !== "preliminary_final";
      standardBestOfField.hidden = !active;
      const bestOfInput = standardBestOfField.querySelector("#ata-bestof");
      if (bestOfInput instanceof HTMLInputElement) bestOfInput.disabled = !active;
    }
    if (!(bullOffSelect instanceof HTMLSelectElement) || !(bullModeSelect instanceof HTMLSelectElement)) {
      refreshCreateFormPresetSelection(form);
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

    refreshCreateFormPresetSelection(form);
  }


  function resetGroupsKoOddParticipantAcknowledgementIfBasisChanged(form) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const currentDraft = normalizeCreateDraft(state.store?.ui?.createDraft, state.store.settings);
    const nextDraft = normalizeCreateDraft(readCreateDraftInput(form), state.store.settings);
    const currentParticipantCount = parseParticipantLines(currentDraft.participantsText).length;
    const nextParticipantCount = parseParticipantLines(nextDraft.participantsText).length;
    const basisChanged = currentDraft.mode !== nextDraft.mode
      || currentDraft.groupsKoOddParticipantPolicy !== nextDraft.groupsKoOddParticipantPolicy
      || currentParticipantCount !== nextParticipantCount;
    if (!basisChanged) {
      return;
    }
    state.store.ui.createDraft = normalizeCreateDraft({
      ...currentDraft,
      groupsKoOddParticipantAcknowledged: false,
    }, state.store.settings);
    const acknowledgement = form.elements.namedItem("groupsKoOddParticipantAcknowledged");
    if (acknowledgement instanceof HTMLInputElement) {
      acknowledgement.checked = false;
    }
  }


  function replaceCreateDynamicHostContent(host, html) {
    if (!(host instanceof HTMLElement)) return;
    const nextHtml = String(html || "");
    if (host.innerHTML === nextHtml) return;
    const activeElement = state.shadowRoot?.activeElement || document.activeElement;
    const restoreFocus = activeElement instanceof HTMLElement && host.contains(activeElement);
    const activeId = restoreFocus ? normalizeText(activeElement.id || "") : "";
    const activeName = restoreFocus
      && (activeElement instanceof HTMLInputElement
        || activeElement instanceof HTMLSelectElement
        || activeElement instanceof HTMLTextAreaElement)
      ? normalizeText(activeElement.name || "")
      : "";
    const selectionStart = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement
      ? activeElement.selectionStart
      : null;
    const selectionEnd = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement
      ? activeElement.selectionEnd
      : null;

    host.innerHTML = nextHtml;
    if (!restoreFocus) return;
    const replacement = (activeId ? host.querySelector(`#${activeId}`) : null)
      || Array.from(host.querySelectorAll("input, select, textarea, button")).find((control) => (
        activeName && normalizeText(control.name || "") === activeName
      ));
    if (!(replacement instanceof HTMLElement)) return;
    replacement.focus({ preventScroll: true });
    if (
      (replacement instanceof HTMLInputElement || replacement instanceof HTMLTextAreaElement)
      && Number.isInteger(selectionStart)
      && Number.isInteger(selectionEnd)
    ) {
      replacement.setSelectionRange(selectionStart, selectionEnd);
    }
  }


  function refreshCreateFormGroupsKoPolicy(form) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const host = form.querySelector("#ata-groups-ko-odd-policy-host");
    if (!(host instanceof HTMLElement)) {
      return;
    }
    const draft = normalizeCreateDraft(readCreateDraftInput(form), state.store.settings);
    replaceCreateDynamicHostContent(host, renderGroupsKoOddParticipantPolicyFields(draft));
  }


  function refreshCreateFormPreliminaryFinal(form) {
    if (!(form instanceof HTMLFormElement)) return;
    const host = form.querySelector("#ata-preliminary-final-fields-host");
    if (!(host instanceof HTMLElement)) return;
    const rawInput = readCreateDraftInput(form);
    const normalizedDraft = normalizeCreateDraft(rawInput, state.store.settings);
    const draft = {
      ...normalizedDraft,
      preliminaryMatchesPerParticipant: rawInput.preliminaryMatchesPerParticipant,
      preliminaryWinPoints: rawInput.preliminaryWinPoints,
      preliminaryDrawPoints: rawInput.preliminaryDrawPoints,
      preliminaryLossPoints: rawInput.preliminaryLossPoints,
      finalStageType: rawInput.finalStageType,
      finalStageQualifierCount: rawInput.finalStageQualifierCount,
      finalStageBestOfLegs: rawInput.finalStageBestOfLegs,
    };
    replaceCreateDynamicHostContent(host, renderPreliminaryFinalFields(draft));
  }


  function refreshCreateHelpUi(form, options = {}) {
    if (!(form instanceof HTMLFormElement)) return null;
    const draft = normalizeCreateDraft(readCreateDraftInput(form), state.store.settings);
    reconcileCreateHelpState(draft);
    const model = resolveCreateHelpTopic(
      state.activeCreateHelpTopic,
      draft,
      state.store?.settings,
    );
    const panel = form.querySelector(`#${CREATE_HELP_PANEL_ID}`);
    const overview = form.querySelector("#ata-create-overview");
    if (panel instanceof HTMLElement) {
      panel.innerHTML = renderCreateHelpPanelBody(model);
      panel.hidden = !model;
    }
    if (overview instanceof HTMLElement) {
      overview.hidden = Boolean(model);
    }
    form.querySelectorAll("[data-action='open-create-help'][data-help-topic]").forEach((trigger) => {
      trigger.setAttribute(
        "aria-expanded",
        model && trigger.getAttribute("data-help-topic") === model.id ? "true" : "false",
      );
    });
    if (model && options.focusTitle === true) {
      const title = panel?.querySelector(`#${CREATE_HELP_TITLE_ID}`);
      if (title instanceof HTMLElement) title.focus();
    }
    return model;
  }


  function handleOpenCreateHelp(trigger, form) {
    if (!(trigger instanceof HTMLButtonElement) || !(form instanceof HTMLFormElement)) return false;
    updateCreateDraftFromForm(form, true);
    const topicId = trigger.getAttribute("data-help-topic");
    const draft = normalizeCreateDraft(readCreateDraftInput(form), state.store.settings);
    const activated = activateCreateHelpTopic(topicId, trigger.id, draft);
    if (!activated) return false;
    refreshCreateHelpUi(form, { focusTitle: true });
    return true;
  }


  function closeCreateHelpPanel(form, options = {}) {
    if (!(form instanceof HTMLFormElement)) return false;
    const triggerId = normalizeText(state.lastCreateHelpTriggerId || "");
    const hadActiveTopic = Boolean(state.activeCreateHelpTopic);
    resetCreateHelpState();
    refreshCreateHelpUi(form);
    if (options.returnFocus === true) {
      const preferredTrigger = triggerId ? state.shadowRoot?.getElementById(triggerId) : null;
      const fallbackTrigger = state.shadowRoot?.getElementById(getCreateHelpTriggerId("tournamentMode"));
      const returnTarget = preferredTrigger instanceof HTMLButtonElement
        && !preferredTrigger.disabled
        && !preferredTrigger.closest("[hidden]")
        ? preferredTrigger
        : fallbackTrigger;
      if (returnTarget instanceof HTMLElement) returnTarget.focus();
    }
    return hadActiveTopic;
  }


  function applySelectedPresetToCreateForm(form, selectedPresetId = null) {
    if (!(form instanceof HTMLFormElement)) {
      return false;
    }
    const requestedPresetId = selectedPresetId ?? new FormData(form).get("x01Preset");
    const presetId = sanitizeX01Preset(requestedPresetId, X01_PRESET_CUSTOM);
    const preset = getCreatePresetDefinition(presetId);
    const storedDraft = normalizeCreateDraft(state.store?.ui?.createDraft, state.store.settings);
    if (!preset) {
      if (storedDraft.x01Preset === X01_PRESET_CUSTOM) {
        setCreateFormPresetValue(form, X01_PRESET_CUSTOM);
        return false;
      }
      setCreateFormPresetValue(form, X01_PRESET_CUSTOM);
      syncCreateFormDependencies(form);
      updateCreateDraftFromForm(form, true);
      refreshCreateGameRulesSummary(form);
      refreshCreateValidationUi(form);
      return true;
    }
    if (storedDraft.x01Preset === preset.id && matchesCreatePresetSetup(storedDraft, preset.id)) {
      setCreateFormPresetValue(form, preset.id);
      return false;
    }
    const apply = preset.apply;
    const assignments = [
      ["#ata-mode", apply.mode],
      ["#ata-bestof", String(apply.bestOfLegs)],
      ["#ata-startscore", String(apply.startScore)],
      ["#ata-x01-inmode", apply.x01InMode],
      ["#ata-x01-outmode", apply.x01OutMode],
      ["#ata-x01-bullmode", apply.x01BullMode],
      ["#ata-x01-bulloff", apply.x01BullOffMode],
      ["#ata-x01-maxrounds", String(apply.x01MaxRounds)],
    ];

    assignments.forEach(([selector, value]) => {
      const field = form.querySelector(selector);
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
        field.value = value;
      }
    });

    setCreateFormPresetValue(form, preset.id);
    resetGroupsKoOddParticipantAcknowledgementIfBasisChanged(form);
    syncCreateFormDependencies(form);
    updateCreateDraftFromForm(form, true);
    refreshCreateGameRulesSummary(form);
    refreshCreateFormGroupsKoPolicy(form);
    refreshCreateFormPreliminaryFinal(form);
    refreshCreateValidationUi(form);
    return true;
  }


  function readCreateDraftInput(formOrData, preservedDraft = null) {
    const form = formOrData instanceof HTMLFormElement ? formOrData : null;
    const formData = formOrData instanceof FormData ? formOrData : new FormData(formOrData);
    const preserved = normalizeCreateDraft(
      preservedDraft || state.store?.ui?.createDraft,
      state.store?.settings,
    );
    const modeValue = normalizeText(formData.get("mode") || preserved.mode);
    const mode = Object.prototype.hasOwnProperty.call(CREATE_MODE_RULE_FIELDS, modeValue)
      ? modeValue
      : preserved.mode;
    const activeModeFields = new Set(CREATE_MODE_RULE_FIELDS[mode] || []);
    const hasEnabledControl = (fieldName) => {
      if (!(form instanceof HTMLFormElement)) return true;
      return Array.from(form.elements).some((control) => (
        (control instanceof HTMLInputElement
          || control instanceof HTMLSelectElement
          || control instanceof HTMLTextAreaElement)
        && control.name === fieldName
        && !control.disabled
      ));
    };
    const readModeValue = (fieldName) => {
      if (!activeModeFields.has(fieldName) || !hasEnabledControl(fieldName)) {
        return preserved[fieldName];
      }
      return formData.has(fieldName) ? formData.get(fieldName) : preserved[fieldName];
    };
    const readModeCheckbox = (fieldName) => {
      if (!activeModeFields.has(fieldName) || !hasEnabledControl(fieldName)) {
        return preserved[fieldName] === true;
      }
      return formData.has(fieldName);
    };
    const standardBestOf = mode === "preliminary_final" || !hasEnabledControl("bestOfLegs")
      ? preserved.bestOfLegs
      : formData.get("bestOfLegs");
    return {
      name: formData.get("name") ?? preserved.name,
      mode,
      bestOfLegs: standardBestOf,
      startScore: formData.get("startScore") ?? preserved.startScore,
      x01Preset: formData.get("x01Preset") ?? preserved.x01Preset,
      x01InMode: formData.get("x01InMode") ?? preserved.x01InMode,
      x01OutMode: formData.get("x01OutMode") ?? preserved.x01OutMode,
      x01BullMode: formData.get("x01BullMode") ?? preserved.x01BullMode,
      x01MaxRounds: formData.get("x01MaxRounds") ?? preserved.x01MaxRounds,
      x01BullOffMode: formData.get("x01BullOffMode") ?? preserved.x01BullOffMode,
      boardCount: formData.get("boardCount") ?? preserved.boardCount,
      tournamentTimeProfile: formData.get("tournamentTimeProfile") ?? state.store?.settings?.tournamentTimeProfile,
      participantsText: String(formData.get("participants") ?? preserved.participantsText),
      randomizeKoRound1: readModeCheckbox("randomizeKoRound1"),
      enableThirdPlaceMatch: readModeCheckbox("enableThirdPlaceMatch"),
      grandFinalResetMode: readModeValue("grandFinalResetMode"),
      groupsKoOddParticipantPolicy: readModeValue("groupsKoOddParticipantPolicy"),
      groupsKoOddParticipantAcknowledged: readModeCheckbox("groupsKoOddParticipantAcknowledged"),
      preliminaryMatchesPerParticipant: readModeValue("preliminaryMatchesPerParticipant"),
      preliminaryWinPoints: readModeValue("preliminaryWinPoints"),
      preliminaryDrawPoints: readModeValue("preliminaryDrawPoints"),
      preliminaryLossPoints: readModeValue("preliminaryLossPoints"),
      finalStageType: readModeValue("finalStageType"),
      finalStageQualifierCount: readModeValue("finalStageQualifierCount"),
      finalStageBestOfLegs: readModeValue("finalStageBestOfLegs"),
    };
  }


  function updateCreateDraftFromForm(form, persist = true) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const nextDraft = normalizeCreateDraft(readCreateDraftInput(form), state.store.settings);
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


  function refreshCreateGameRulesSummary(form) {
    if (!(form instanceof HTMLFormElement)) return;
    const summaryHost = form.querySelector("[data-role='game-rules-summary-text']");
    const presetHost = form.querySelector("[data-role='game-rules-preset-origin']");
    if (!(summaryHost instanceof HTMLElement) || !(presetHost instanceof HTMLElement)) return;
    const rawInput = readCreateDraftInput(form);
    const validation = validateCreateConfiguration(rawInput, state.store.settings);
    const summary = buildCreateGameRulesSummary(state.store?.ui?.createDraft);
    const gameRulesInvalid = validation.issues.some((issue) => issue.section === "game-rules");
    summaryHost.textContent = gameRulesInvalid ? "Spielregeln prüfen – ungültige Eingabe" : summary.text;
    presetHost.innerHTML = `<strong>Format:</strong> ${escapeHtml(summary.presetLabel)}`;
  }


  function setCreateGameRulesExpanded(form, expanded) {
    if (!(form instanceof HTMLFormElement)) return;
    const button = form.querySelector("#ata-game-rules-editor-toggle");
    const editor = form.querySelector("#ata-game-rules-editor");
    if (!(button instanceof HTMLButtonElement) || !(editor instanceof HTMLElement)) return;
    const nextExpanded = expanded === true;
    const activeElement = state.shadowRoot?.activeElement || document.activeElement;
    const returnFocus = !nextExpanded
      && activeElement instanceof HTMLElement
      && editor.contains(activeElement);
    state.createGameRulesExpanded = nextExpanded;
    button.setAttribute("aria-expanded", nextExpanded ? "true" : "false");
    button.textContent = nextExpanded ? "Bearbeitung schließen" : "Spielregeln bearbeiten";
    editor.hidden = !nextExpanded;
    if (returnFocus) button.focus();
  }


  function handleShuffleParticipants(form) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const participantField = form.querySelector("#ata-participants");
    if (!(participantField instanceof HTMLTextAreaElement)) {
      return;
    }
    const participantAnalysis = analyzeCreateParticipantInput(participantField.value);
    if (participantAnalysis.nonEmptyEntries.length < 2) {
      setNotice("info", "Mindestens zwei Teilnehmer zum Mischen eingeben.", 2200);
      return;
    }
    const shuffledNames = shuffleArray(participantAnalysis.nonEmptyEntries.map((entry) => entry.normalizedName));
    participantField.value = shuffledNames.join("\n");
    markCreateValidationFieldTouched("participants");
    updateCreateDraftFromForm(form, true);
    refreshCreateGameRulesSummary(form);
    refreshCreateFormGroupsKoPolicy(form);
    refreshCreateFormPreliminaryFinal(form);
    refreshCreateValidationUi(form);
    refreshCreateHelpUi(form);
    setNotice("success", "Teilnehmer wurden zuf\u00e4llig gemischt.", 1800);
  }


  function handleCreateTournament(form) {
    syncCreateFormDependencies(form);
    const rawInput = readCreateDraftInput(form);
    const draft = normalizeCreateDraft(rawInput, state.store.settings);
    state.store.ui.createDraft = draft;
    state.createValidationSubmitAttempted = true;
    let validation = refreshCreateValidationUi(form, { announceSubmitFailure: true });
    if (!validation?.valid) {
      focusFirstCreateValidationIssue(form, validation);
      return;
    }

    const participants = parseParticipantLines(rawInput.participantsText);
    const config = scopeCreateConfigToMode({
      ...validation.config,
      koDrawLocked: state.store.settings.featureFlags.koDrawLockDefault !== false,
      participants,
    });

    const result = createTournamentSession(config);
    if (!result.ok) {
      if (result.reasonCode || (Array.isArray(result.validationDetails) && result.validationDetails.length)) {
        validation = mergeCreateValidationFailure(validation, result);
        state.createValidationSnapshot = validation;
        refreshCreateValidationUi(form, { snapshot: validation, announceSubmitFailure: true });
        focusFirstCreateValidationIssue(form, validation);
      } else {
        setNotice("error", result.message || "Turnier konnte nicht erstellt werden.");
      }
      return;
    }
    setNotice("success", "Turnier wurde erstellt.");
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


  function handleSaveFixedLegResult(matchId) {
    const shadow = state.shadowRoot;
    const leg1 = getMatchFieldElement(shadow, "fixed-leg-1", matchId);
    const leg2 = getMatchFieldElement(shadow, "fixed-leg-2", matchId);
    if (!(leg1 instanceof HTMLSelectElement) || !(leg2 instanceof HTMLSelectElement)) return;
    const entries = [];
    if (normalizeText(leg1.value)) entries.push({ legIndex: 1, winnerId: leg1.value });
    if (normalizeText(leg2.value)) entries.push({ legIndex: 2, winnerId: leg2.value });
    const result = updateFixedLegMatchResult(matchId, entries);
    if (result.ok) setNotice("success", result.completed ? "Vorrundenmatch abgeschlossen." : "Zwischenstand nach Leg 1 gespeichert.", 2200);
    else setNotice("error", result.message || "Fixed-Legs-Ergebnis konnte nicht gespeichert werden.");
  }


  function handleCorrectPreliminaryMatch(matchId) {
    const tournament = state.store.tournament;
    const hasGeneratedFinal = getMatchesByStage(tournament, MATCH_STAGE_KO).length > 0;
    const message = hasGeneratedFinal
      ? "Die erzeugte Finalphase wird verworfen und muss nach der Korrektur explizit regeneriert werden. Fortfahren?"
      : "Vorrundenergebnis zur Korrektur wieder \u00f6ffnen?";
    if (!window.confirm(message)) return;
    const result = resetActivePreliminaryMatchForCorrection(matchId);
    if (result.ok) setNotice("success", result.discardedFinalStage ? "Ergebnis ge\u00f6ffnet; Finalphase wurde kontrolliert verworfen." : "Ergebnis zur Korrektur ge\u00f6ffnet.");
    else setNotice("error", result.message || "Korrektur wurde blockiert.");
  }


  function handleGenerateFinalStage() {
    if (!window.confirm("Finalphase jetzt aus der gespeicherten Tabellenreihenfolge erzeugen?")) return;
    const result = generateActivePreliminaryFinalStage();
    if (result.ok) setNotice("success", "Finalphase wurde aus den Tabellen-Seeds erzeugt.");
    else setNotice("error", result.message || "Finalphase konnte nicht erzeugt werden.");
  }


  function handleSaveQualificationResolution() {
    const shadow = state.shadowRoot;
    if (!shadow) return;
    const orderEntries = Array.from(shadow.querySelectorAll("[data-field='qualification-order']")).map((input) => ({
      participantId: input.getAttribute("data-participant-id"),
      order: Number(input.value),
    }));
    const orders = orderEntries.map((entry) => entry.order);
    if (orders.some((order) => !Number.isInteger(order)) || new Set(orders).size !== orders.length) {
      setNotice("error", "Jede Reihenfolgeposition muss eine eindeutige ganze Zahl sein.");
      return;
    }
    orderEntries.sort((left, right) => left.order - right.order);
    const reasonInput = shadow.getElementById("ata-qualification-reason");
    const reason = reasonInput instanceof HTMLInputElement ? reasonInput.value : "";
    if (!window.confirm("Diese Veranstalterentscheidung sichtbar speichern? Sie ist nach Start der Finalphase gesperrt.")) return;
    const result = saveActiveQualificationResolution(orderEntries.map((entry) => entry.participantId), reason);
    if (result.ok) setNotice("success", "Veranstalterentscheidung gespeichert. Die Finalphase kann jetzt erzeugt werden.");
    else setNotice("error", result.message || "Reihenfolge konnte nicht gespeichert werden.");
  }


  function handleResetTournament() {
    const confirmed = window.confirm("Soll das Turnier wirklich gel\u00f6scht werden? Dieser Schritt kann nicht r\u00fcckg\u00e4ngig gemacht werden.");
    if (!confirmed) {
      return;
    }

    resetTournamentSession();
    setNotice("success", "Turnier wurde gel\u00f6scht.");
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


  function handleImportFromTextarea() {
    const textarea = state.shadowRoot?.getElementById("ata-import-text");
    if (!(textarea instanceof HTMLTextAreaElement)) {
      return;
    }

    try {
      const parsed = JSON.parse(textarea.value);
      const result = importTournamentPayload(parsed);
      if (result.ok) {
        setNotice("success", "JSON erfolgreich importiert.");
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
        const result = importTournamentPayload(parsed);
        if (result.ok) {
          setNotice("success", "Datei erfolgreich importiert.");
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


