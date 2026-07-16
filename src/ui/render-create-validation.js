// Targeted rendering and focus behavior for create validation.
  const CREATE_VALIDATION_FIELD_TARGETS = Object.freeze({
    name: Object.freeze({ controlId: "ata-name", section: "format" }),
    mode: Object.freeze({ controlId: "ata-mode", section: "format" }),
    x01Preset: Object.freeze({ selector: "input[name='x01Preset']", section: "format" }),
    participants: Object.freeze({ controlId: "ata-participants", section: "participants" }),
    groupsKoOddParticipantPolicy: Object.freeze({ controlId: "ata-groups-ko-odd-policy", section: "additional-rules" }),
    groupsKoOddParticipantAcknowledged: Object.freeze({ controlId: "ata-groups-ko-odd-acknowledgement", section: "additional-rules" }),
    grandFinalResetMode: Object.freeze({ controlId: "ata-grand-final-reset-mode", section: "additional-rules" }),
    preliminaryMatchesPerParticipant: Object.freeze({ controlId: "ata-preliminary-match-count", section: "additional-rules" }),
    preliminaryWinPoints: Object.freeze({ controlId: "ata-preliminary-win-points", section: "additional-rules" }),
    preliminaryDrawPoints: Object.freeze({ controlId: "ata-preliminary-draw-points", section: "additional-rules" }),
    preliminaryLossPoints: Object.freeze({ controlId: "ata-preliminary-loss-points", section: "additional-rules" }),
    finalStageType: Object.freeze({ controlId: "ata-final-stage-type", section: "additional-rules" }),
    finalStageQualifierCount: Object.freeze({ controlId: "ata-final-stage-qualifiers", section: "additional-rules" }),
    finalStageBestOfLegs: Object.freeze({ controlId: "ata-final-stage-bestof", section: "additional-rules" }),
    bestOfLegs: Object.freeze({ controlId: "ata-bestof", section: "game-rules" }),
    startScore: Object.freeze({ controlId: "ata-startscore", section: "game-rules" }),
    x01InMode: Object.freeze({ controlId: "ata-x01-inmode", section: "game-rules" }),
    x01OutMode: Object.freeze({ controlId: "ata-x01-outmode", section: "game-rules" }),
    x01BullOffMode: Object.freeze({ controlId: "ata-x01-bulloff", section: "game-rules" }),
    x01BullMode: Object.freeze({ controlId: "ata-x01-bullmode", section: "game-rules" }),
    x01MaxRounds: Object.freeze({ controlId: "ata-x01-maxrounds", section: "game-rules" }),
    boardCount: Object.freeze({ controlId: "ata-board-count", section: "overview" }),
    tournamentTimeProfile: Object.freeze({ controlId: "ata-create-time-profile", section: "overview" }),
    form: Object.freeze({ controlId: "ata-create-error-summary", section: "form" }),
  });


  function getCreateValidationErrorId(fieldName) {
    return `ata-create-error-${normalizeText(fieldName || "form").replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  }


  function renderCreateFieldValidation(fieldName) {
    return `<div id="${escapeHtml(getCreateValidationErrorId(fieldName))}" class="ata-create-field-error" data-validation-error-for="${escapeHtml(fieldName)}" hidden></div>`;
  }


  function renderCreateValidationOverview(snapshot) {
    const summary = snapshot?.summary || {};
    const limits = summary.participantLimits || getModeParticipantLimits(summary.mode);
    const participantText = `${summary.participantCount || 0} · erlaubt ${limits.min}–${limits.max}`;
    const matchText = Number.isInteger(summary.matchCount) ? String(summary.matchCount) : "noch nicht berechenbar";
    const estimate = summary.durationEstimate;
    const durationText = estimate?.ready ? `ca. ${formatDurationMinutes(estimate.likelyMinutes)}` : "noch nicht berechenbar";
    const statusText = snapshot?.valid
      ? "Bereit zum Anlegen"
      : `Noch nicht bereit · ${snapshot?.issues?.length || 0} ${snapshot?.issues?.length === 1 ? "Punkt" : "Punkte"} offen`;
    const compactIssues = (snapshot?.issues || []).slice(0, 3);
    const compactIssuesHtml = compactIssues.length
      ? `<ul class="ata-create-overview-open-items">${compactIssues.map((issue) => `<li>${escapeHtml(issue.message)}</li>`).join("")}</ul>`
      : "";
    return `
      <dl class="ata-create-overview-summary-list">
        <div><dt>Modus</dt><dd>${escapeHtml(summary.modeLabel || "KO")}</dd></div>
        <div><dt>Format</dt><dd>${escapeHtml(summary.presetLabel || "Individuell / Manuell")}</dd></div>
        <div><dt>Teilnehmer</dt><dd>${escapeHtml(participantText)}</dd></div>
        <div><dt>Spiele</dt><dd>${escapeHtml(matchText)}</dd></div>
        <div><dt>Boards</dt><dd>${escapeHtml(String(summary.boardCount || TOURNAMENT_DURATION_DEFAULT_BOARD_COUNT))}</dd></div>
        <div><dt>Prognose</dt><dd>${escapeHtml(durationText)}</dd></div>
        <div><dt>Status</dt><dd>${escapeHtml(statusText)}</dd></div>
      </dl>
      ${compactIssuesHtml}
    `;
  }


  function renderCreateParticipantStatus(snapshot) {
    const analysis = snapshot?.participantAnalysis || { participantCount: 0, duplicateGroups: [], invalidEntries: [] };
    const summary = snapshot?.summary || {};
    const limits = summary.participantLimits || getModeParticipantLimits(summary.mode);
    const participantCount = analysis.participantCount || 0;
    const participantIssues = (snapshot?.issues || []).filter((issue) => issue.fieldName === "participants");
    let statusText = "bereit";
    if (analysis.duplicateGroups?.length) {
      statusText = `${analysis.duplicateGroups.length} ${analysis.duplicateGroups.length === 1 ? "Duplikat" : "Duplikate"} gefunden`;
    } else if (analysis.invalidEntries?.length) {
      statusText = `${analysis.invalidEntries.length} ${analysis.invalidEntries.length === 1 ? "ungültiger Eintrag" : "ungültige Einträge"}`;
    } else if (participantCount < limits.min) {
      const missing = limits.min - participantCount;
      statusText = `mindestens ${missing} ${missing === 1 ? "Teilnehmer fehlt" : "Teilnehmer fehlen"}`;
    } else if (participantCount > limits.max) {
      const excess = participantCount - limits.max;
      statusText = `${excess} ${excess === 1 ? "Teilnehmer zu viel" : "Teilnehmer zu viel"}`;
    }
    return {
      text: `${participantCount} ${participantCount === 1 ? "Teilnehmer" : "Teilnehmer"} erkannt · erlaubt: ${limits.min}–${limits.max} für ${summary.modeLabel || limits.label} · ${statusText}`,
      state: participantIssues.length ? "invalid" : (participantCount ? "valid" : "pending"),
    };
  }


  function getCreateValidationControls(form, fieldName) {
    const target = CREATE_VALIDATION_FIELD_TARGETS[fieldName];
    if (!(form instanceof HTMLFormElement) || !target) return [];
    if (target.controlId) {
      const control = form.querySelector(`#${target.controlId}`);
      return control instanceof HTMLElement ? [control] : [];
    }
    return Array.from(form.querySelectorAll(target.selector || "")).filter((control) => control instanceof HTMLElement);
  }


  function setCreateValidationDescribedBy(control, errorId, active) {
    if (!(control instanceof HTMLElement)) return;
    const values = normalizeText(control.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
    const next = values.filter((value) => value !== errorId);
    if (active) next.push(errorId);
    if (next.length) control.setAttribute("aria-describedby", Array.from(new Set(next)).join(" "));
    else control.removeAttribute("aria-describedby");
  }


  function refreshCreateValidationUi(form, options = {}) {
    if (!(form instanceof HTMLFormElement)) return null;
    const rawInput = readCreateDraftInput(form);
    const timeProfileControl = form.querySelector("#ata-create-time-profile");
    rawInput.tournamentTimeProfile = timeProfileControl instanceof HTMLSelectElement
      ? timeProfileControl.value
      : state.store?.settings?.tournamentTimeProfile;
    const previousSnapshot = state.createValidationSnapshot;
    const snapshot = options.snapshot || validateCreateConfiguration(rawInput, state.store?.settings);
    if (!options.snapshot) revealNewDependentCreateValidationIssues(previousSnapshot, snapshot);
    state.createValidationSnapshot = snapshot;

    Object.keys(CREATE_VALIDATION_FIELD_TARGETS).forEach((fieldName) => {
      if (fieldName === "form") return;
      const fieldIssues = (snapshot.issues || []).filter((issue) => issue.fieldName === fieldName);
      const visible = fieldIssues.length > 0 && shouldShowCreateValidationFieldIssue(fieldName);
      const errorId = getCreateValidationErrorId(fieldName);
      const errorHost = form.querySelector(`#${errorId}`);
      if (errorHost instanceof HTMLElement) {
        errorHost.hidden = !visible;
        errorHost.innerHTML = visible
          ? (fieldIssues.length === 1
            ? escapeHtml(fieldIssues[0].message)
            : `<ul>${fieldIssues.map((issue) => `<li>${escapeHtml(issue.message)}</li>`).join("")}</ul>`)
          : "";
      }
      getCreateValidationControls(form, fieldName).forEach((control) => {
        if (visible) control.setAttribute("aria-invalid", "true");
        else control.removeAttribute("aria-invalid");
        setCreateValidationDescribedBy(control, errorId, visible);
      });
    });

    const participantStatus = renderCreateParticipantStatus(snapshot);
    const participantStatusHost = form.querySelector("#ata-create-participant-status");
    if (participantStatusHost instanceof HTMLElement) {
      if (participantStatusHost.textContent !== participantStatus.text) {
        participantStatusHost.textContent = participantStatus.text;
      }
      participantStatusHost.setAttribute("data-validation-state", participantStatus.state);
    }

    const overviewSummary = form.querySelector("#ata-create-overview-summary");
    if (overviewSummary instanceof HTMLElement) {
      overviewSummary.innerHTML = renderCreateValidationOverview(snapshot);
      overviewSummary.setAttribute("data-validation-state", snapshot.valid ? "valid" : "invalid");
    }

    const estimateHost = form.querySelector("#ata-create-duration-estimate");
    if (estimateHost instanceof HTMLElement) {
      estimateHost.innerHTML = renderTournamentDurationEstimate(snapshot.summary.durationEstimate, {
        visible: state.store?.ui?.durationEstimateVisible !== false,
        showHelpLinks: false,
      });
    }

    const submitButton = form.querySelector("button[type='submit']");
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = !snapshot.valid;
      submitButton.setAttribute("aria-disabled", snapshot.valid ? "false" : "true");
    }
    const submitStatus = form.querySelector("#ata-create-submit-status");
    if (submitStatus instanceof HTMLElement) {
      submitStatus.textContent = snapshot.valid
        ? "Alle Pflichtangaben sind gültig."
        : `${snapshot.issues.length} ${snapshot.issues.length === 1 ? "Punkt" : "Punkte"} offen: ${snapshot.issues[0]?.message || "Konfiguration prüfen."}`;
      submitStatus.setAttribute("data-validation-state", snapshot.valid ? "valid" : "invalid");
    }

    const summaryHost = form.querySelector("#ata-create-error-summary");
    const showSubmitSummary = state.createValidationSubmitAttempted === true && !snapshot.valid;
    if (summaryHost instanceof HTMLElement) {
      summaryHost.hidden = !showSubmitSummary;
      if (showSubmitSummary) {
        if (options.announceSubmitFailure === true) summaryHost.setAttribute("role", "alert");
        else summaryHost.removeAttribute("role");
        summaryHost.innerHTML = `
          <strong>Turnier kann noch nicht angelegt werden</strong>
          <ul>${snapshot.issues.map((issue) => `<li>${escapeHtml(issue.message)}</li>`).join("")}</ul>
        `;
      } else {
        summaryHost.removeAttribute("role");
        summaryHost.innerHTML = "";
      }
    }
    return snapshot;
  }


  function focusFirstCreateValidationIssue(form, snapshot) {
    if (!(form instanceof HTMLFormElement) || !snapshot || snapshot.valid) return false;
    for (const issue of snapshot.issues || []) {
      const targetMeta = CREATE_VALIDATION_FIELD_TARGETS[issue.fieldName] || CREATE_VALIDATION_FIELD_TARGETS.form;
      if (targetMeta.section === "game-rules") {
        setCreateGameRulesExpanded(form, true);
      }
      if (targetMeta.section === "overview" && state.activeCreateHelpTopic) {
        closeCreateHelpPanel(form, { returnFocus: false });
      }
      const controls = getCreateValidationControls(form, issue.fieldName);
      const target = controls.find((control) => (
        !control.hasAttribute("disabled")
        && !control.closest("[hidden]")
      ));
      if (target instanceof HTMLElement) {
        target.focus({ preventScroll: true });
        const reduceMotion = typeof window.matchMedia === "function"
          && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (typeof target.scrollIntoView === "function") {
          target.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
        }
        return true;
      }
    }
    const summaryHost = form.querySelector("#ata-create-error-summary");
    if (summaryHost instanceof HTMLElement && !summaryHost.hidden) {
      summaryHost.focus({ preventScroll: true });
      return true;
    }
    return false;
  }
