// Auto-generated module split from dist source.
  function renderGroupsKoOddParticipantPolicyFields(draft) {
    if (draft?.mode !== "groups_ko") {
      return "";
    }

    const participants = parseParticipantLines(draft.participantsText);
    const analysis = analyzeGroupsKoParticipantDistribution(participants.length);
    const policy = sanitizeGroupsKoOddParticipantPolicy(draft.groupsKoOddParticipantPolicy);
    const acknowledgementRequired = analysis.isOdd
      && policy === GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL;
    const analysisHtml = analysis.isOdd
      ? `
        <div class="ata-small ata-create-help" data-role="groups-ko-odd-analysis">
          <p><strong>Auswirkung der ungeraden Teilnehmerzahl:</strong></p>
          <p>Gruppe A: ${analysis.groupASize} Spieler, ${analysis.groupAMatchesPerPlayer} Spiele je Spieler, ${analysis.groupAQualifierCount} von ${analysis.groupASize} qualifizieren sich.</p>
          <p>Gruppe B: ${analysis.groupBSize} Spieler, ${analysis.groupBMatchesPerPlayer} Spiele je Spieler, ${analysis.groupBQualifierCount} von ${analysis.groupBSize} qualifizieren sich.</p>
        </div>
      `
      : "";
    const twoPlayerWarning = analysis.hasTwoPlayerGroup && participants.length >= MODE_PARTICIPANT_LIMITS.groups_ko.min
      ? `<p class="ata-small ata-create-help" data-role="groups-ko-two-player-warning"><strong>Hinweis:</strong> In einer Zweiergruppe qualifizieren sich bei Top 2 beide Spieler automatisch für die KO-Phase.</p>`
      : "";
    const acknowledgementHtml = acknowledgementRequired
      ? `
        <label class="ata-toggle ata-toggle-compact" data-role="groups-ko-odd-acknowledgement">
          <span>Ich bestätige, dass ungleiche Gruppengrößen und die daraus entstehenden unterschiedlichen Qualifikationsquoten der verwendeten Turnierordnung entsprechen.</span>
          <input id="ata-groups-ko-odd-acknowledgement" name="groupsKoOddParticipantAcknowledged" type="checkbox" ${draft.groupsKoOddParticipantAcknowledged ? "checked" : ""}>
        </label>
        ${renderCreateFieldValidation("groupsKoOddParticipantAcknowledged")}
      `
      : "";

    return `
      <section class="ata-field" data-role="groups-ko-odd-policy">
        <div class="ata-field-label-row">
          <label for="ata-groups-ko-odd-policy">Ungerade Teilnehmerzahl</label>
          ${renderCreateHelpTrigger("groupsKoOddParticipants", "Hilfe zu ungeraden Teilnehmerzahlen in Gruppenphase und KO öffnen")}
        </div>
        <select id="ata-groups-ko-odd-policy" name="groupsKoOddParticipantPolicy">
          <option value="${GROUPS_KO_ODD_PARTICIPANT_POLICY_REQUIRE_EVEN}" ${policy === GROUPS_KO_ODD_PARTICIPANT_POLICY_REQUIRE_EVEN ? "selected" : ""}>Nur gerade Teilnehmerzahl zulassen (empfohlen)</option>
          <option value="${GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL}" ${policy === GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL ? "selected" : ""}>Ungleiche Gruppengrößen zulassen (Veranstalterregel)</option>
        </select>
        ${renderCreateFieldValidation("groupsKoOddParticipantPolicy")}
        ${analysisHtml}
        ${twoPlayerWarning}
        ${acknowledgementHtml}
      </section>
    `;
  }


  function renderPreliminaryFinalFields(draft) {
    if (draft?.mode !== "preliminary_final") return "";
    const participants = parseParticipantLines(draft.participantsText);
    const participantIds = participants.map((participant) => participant.id);
    const analysis = analyzePreliminaryFinalConfiguration(
      participantIds,
      draft.preliminaryMatchesPerParticipant,
      draft.finalStageType,
      draft.finalStageQualifierCount,
    );
    const allowedText = analysis.allowedMatchCounts?.length ? analysis.allowedMatchCounts.join(" oder ") : "keine";
    const summary = analysis.ok
      ? `<div class="ata-meta-block" data-role="preliminary-live-summary">
          <div class="ata-meta-heading">Live-Zusammenfassung</div>
          <p>${analysis.participantCount} Teilnehmer</p>
          <p>${analysis.matchCount} Vorrundenspiele je Teilnehmer</p>
          <p>${analysis.totalMatches} Vorrundenmatches insgesamt</p>
          <p>Jeder Teilnehmer hat exakt ${analysis.matchCount} verschiedene Gegner</p>
          <p>Keine doppelte Paarung</p>
          <p>${analysis.scheduleRoundCount} Scheduling-Runden</p>
          <p>Top ${analysis.qualifierCount} qualifizieren sich f\u00fcr ${escapeHtml(analysis.finalStageLabel)}</p>
        </div>`
      : `<div class="ata-meta-block" data-role="preliminary-live-summary"><p><strong>Konfiguration nicht zul\u00e4ssig:</strong> ${escapeHtml(analysis.message)}</p><p>Zul\u00e4ssig innerhalb 4\u20138: ${escapeHtml(allowedText)}.</p></div>`;
    return `
      <section data-role="preliminary-final-fields">
        <div class="ata-field-label-row ata-preliminary-final-heading">
          <h5>Vorrunde und Finalphase</h5>
          ${renderCreateHelpTrigger("preliminaryFinal", "Hilfe zu Vorrunde und Finalphase öffnen")}
        </div>
        <div class="ata-grid-3 ata-grid-3-tight">
          <div class="ata-field">
            <label for="ata-preliminary-match-count">Vorrundenspiele je Teilnehmer</label>
            <input id="ata-preliminary-match-count" name="preliminaryMatchesPerParticipant" type="number" min="4" max="8" step="1" value="${draft.preliminaryMatchesPerParticipant}">
            ${renderCreateFieldValidation("preliminaryMatchesPerParticipant")}
            <p class="ata-small ata-create-help">Dies ist die Zahl real gespielter Matches je Teilnehmer, nicht die Zahl zeitlicher Scheduling-Runden.</p>
          </div>
          <div class="ata-field ata-field-span-3">
            <label>Vorrundenformat</label>
            <span class="ata-field-readonly">2 Legs fest \u2013 beide Legs werden gespielt, 1:1 m\u00f6glich</span>
          </div>
          <div class="ata-field"><label for="ata-preliminary-win-points">Punkte f\u00fcr Sieg</label><input id="ata-preliminary-win-points" name="preliminaryWinPoints" type="number" min="0" max="10" step="1" value="${draft.preliminaryWinPoints}">${renderCreateFieldValidation("preliminaryWinPoints")}</div>
          <div class="ata-field"><label for="ata-preliminary-draw-points">Punkte f\u00fcr Unentschieden</label><input id="ata-preliminary-draw-points" name="preliminaryDrawPoints" type="number" min="0" max="10" step="1" value="${draft.preliminaryDrawPoints}">${renderCreateFieldValidation("preliminaryDrawPoints")}</div>
          <div class="ata-field"><label for="ata-preliminary-loss-points">Punkte f\u00fcr Niederlage</label><input id="ata-preliminary-loss-points" name="preliminaryLossPoints" type="number" min="0" max="10" step="1" value="${draft.preliminaryLossPoints}">${renderCreateFieldValidation("preliminaryLossPoints")}</div>
          <div class="ata-field"><label for="ata-final-stage-type">Finalphase</label><select id="ata-final-stage-type" name="finalStageType"><option value="ko" ${draft.finalStageType === "ko" ? "selected" : ""}>KO</option><option value="double_ko" ${draft.finalStageType === "double_ko" ? "selected" : ""}>Doppel-KO</option></select>${renderCreateFieldValidation("finalStageType")}</div>
          <div class="ata-field"><label for="ata-final-stage-qualifiers">Anzahl Qualifikanten</label><input id="ata-final-stage-qualifiers" name="finalStageQualifierCount" type="number" min="2" max="${Math.max(2, participants.length)}" step="1" value="${draft.finalStageQualifierCount}">${renderCreateFieldValidation("finalStageQualifierCount")}</div>
          <div class="ata-field"><label for="ata-final-stage-bestof">Best of Legs der Finalphase</label><input id="ata-final-stage-bestof" name="finalStageBestOfLegs" type="number" min="1" max="21" step="2" value="${draft.finalStageBestOfLegs}">${renderCreateFieldValidation("finalStageBestOfLegs")}</div>
        </div>
        ${summary}
      </section>
    `;
  }


  function renderActiveGroupsKoPolicyNotice(tournament) {
    if (tournament?.mode !== "groups_ko") {
      return "";
    }
    const analysis = analyzeGroupsKoParticipantDistribution(
      tournament.participants.length,
      tournament.groups,
    );
    const policy = sanitizeGroupsKoOddParticipantPolicy(tournament?.rules?.groupsKoOddParticipantPolicy);
    const policyLabel = policy === GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL
      ? "Ungleiche Gruppengrößen zugelassen (Veranstalterregel)"
      : "Gerade Teilnehmerzahl erforderlich (sicherer Produktstandard)";
    const legacyWarning = analysis.hasUnequalGroupSizes
      && policy === GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL
      && tournament?.rules?.groupsKoOddParticipantAcknowledged !== true
      ? `<p class="ata-small ata-create-help" data-role="groups-ko-legacy-warning"><strong>Bestandshinweis:</strong> Dieses Turnier verwendet migriertes Verhalten mit ungleichen Gruppen, jedoch ohne gespeicherte Bestätigung der zugrunde liegenden Turnierordnung. Das laufende Turnier bleibt unverändert nutzbar.</p>`
      : "";
    return `
      <div class="ata-meta-block" data-role="groups-ko-active-policy">
        <div class="ata-meta-heading">Gruppenregel</div>
        <div class="ata-info-tag-cloud"><span class="ata-info-tag">${escapeHtml(policyLabel)}</span></div>
        ${legacyWarning}
        <p class="ata-small">Dieses Format bildet zwei Gruppen mit vollständigem Round Robin und Top 2 je Gruppe ab; die Auswahl behauptet keine allgemeine offizielle Regelkonformität.</p>
      </div>
    `;
  }


  function renderCreateFormSectionHeading(step, title, description, headingId, titleAdornmentHtml = "") {
    return `
      <header class="ata-create-section-head">
        <span class="ata-create-section-step" aria-hidden="true">${escapeHtml(String(step))}</span>
        <div class="ata-create-section-title">
          <div class="ata-create-section-title-row">
            <h4 id="${escapeHtml(headingId)}">${escapeHtml(title)}</h4>
            ${titleAdornmentHtml}
          </div>
          <p>${escapeHtml(description)}</p>
        </div>
      </header>
    `;
  }


  function getCreatePresetCardSummary(preset) {
    const apply = preset?.apply || {};
    const modeLabel = apply.mode === "ko" ? "KO" : normalizeText(apply.mode || "").toUpperCase();
    const scopeLabel = preset?.id === X01_PRESET_PDC_501_DOUBLE_OUT_BASIC
      ? "Empfohlen für lokale Turniere"
      : "Offizielles Profil für Runden 1 bis 4";
    return [
      scopeLabel,
      `setzt ${modeLabel}`,
      `Best of ${apply.bestOfLegs}`,
      apply.startScore,
      `${apply.x01InMode} In`,
      `${apply.x01OutMode} Out`,
    ].join(" · ");
  }


  function renderCreatePresetSelection(draft) {
    const activePresetId = getAppliedCreatePresetId(draft);
    const presetCards = getCreatePresetCatalog().map((preset) => ({
      id: preset.id,
      label: preset.label,
      summary: getCreatePresetCardSummary(preset),
    }));
    presetCards.push({
      id: X01_PRESET_CUSTOM,
      label: "Individuell / Manuell",
      summary: "Aktuelle Werte beibehalten und selbst konfigurieren",
    });
    const cardsHtml = presetCards.map((preset) => {
      const inputId = `ata-preset-${preset.id}`;
      const descriptionId = `${inputId}-description`;
      return `
        <label class="ata-preset-card" for="${escapeHtml(inputId)}" data-preset-id="${escapeHtml(preset.id)}">
          <input
            id="${escapeHtml(inputId)}"
            class="ata-preset-radio"
            type="radio"
            name="x01Preset"
            value="${escapeHtml(preset.id)}"
            aria-describedby="${escapeHtml(descriptionId)}"
            ${activePresetId === preset.id ? "checked" : ""}
          >
          <span class="ata-preset-card-body">
            <span class="ata-preset-card-heading">
              <strong>${escapeHtml(preset.label)}</strong>
              <span class="ata-preset-card-state" aria-hidden="true">Ausgewählt</span>
            </span>
            <span id="${escapeHtml(descriptionId)}" class="ata-preset-card-summary">${escapeHtml(preset.summary)}</span>
          </span>
        </label>
      `;
    }).join("");
    return `
      <fieldset class="ata-preset-fieldset ata-field-span-2" data-role="preset-selection">
        <legend>
          <span>Formatvorlage auswählen</span>
          ${renderCreateHelpTrigger("presetFormat", "Hilfe zu Presets und Formatprofilen öffnen")}
        </legend>
        <p class="ata-small ata-preset-intro">Eine Vorlage setzt auch Modus und Spielregeln. Mit &bdquo;Individuell / Manuell&ldquo; bleiben deine aktuellen Werte erhalten.</p>
        <div class="ata-preset-card-grid">${cardsHtml}</div>
        ${renderCreateFieldValidation("x01Preset")}
      </fieldset>
    `;
  }


  function getCreateModeQuickSummary(mode) {
    const summaries = {
      ko: "Eine Niederlage beendet das Turnier. Gut für einen schnellen, klaren Ablauf.",
      double_ko: "Erst nach der zweiten Niederlage scheidet eine Person aus. Fairer, aber deutlich mehr Matches.",
      league: "Alle spielen gegeneinander. Sehr aussagekräftig, bei großen Feldern jedoch zeitintensiv.",
      groups_ko: "Zuerst Gruppen, danach eine KO-Finalrunde. Verbindet mehrere Spiele pro Person mit einem Finale.",
      preliminary_final: "Eine planbare Vorrunde bestimmt die Qualifikation für eine frei wählbare Finalphase.",
    };
    return summaries[normalizeText(mode)] || summaries.ko;
  }


  function renderCreateTournamentFormatSection(draft) {
    return `
      <section class="ata-create-section" data-create-section="format" aria-labelledby="ata-create-format-heading">
        ${renderCreateFormSectionHeading(1, "Turnierformat", "Name und grundlegenden Turnierablauf festlegen.", "ata-create-format-heading")}
        <div class="ata-create-section-body ata-grid-2">
          <div class="ata-field ata-field-span-2">
            <label for="ata-name">Turniername</label>
            <input id="ata-name" name="name" type="text" placeholder="z. B. Freitagsturnier" value="${escapeHtml(draft.name)}" required>
            ${renderCreateFieldValidation("name")}
          </div>
          ${renderCreatePresetSelection(draft)}
          <div class="ata-field">
            <div class="ata-field-label-row">
              <label for="ata-mode">Modus</label>
              ${renderCreateHelpTrigger("tournamentMode", "Hilfe zum Turniermodus öffnen")}
            </div>
            <select id="ata-mode" name="mode">
              <option value="ko" ${draft.mode === "ko" ? "selected" : ""}>KO – schnell, eine Niederlage</option>
              <option value="double_ko" ${draft.mode === "double_ko" ? "selected" : ""}>Doppel-KO – zweite Chance</option>
              <option value="league" ${draft.mode === "league" ? "selected" : ""}>Liga – alle gegen alle</option>
              <option value="groups_ko" ${draft.mode === "groups_ko" ? "selected" : ""}>Gruppenphase + KO – Gruppen und Finale</option>
              <option value="preliminary_final" ${draft.mode === "preliminary_final" ? "selected" : ""}>Vorrunde + Finalphase – flexibel planbar</option>
            </select>
            <p class="ata-small ata-mode-quick-summary" data-role="mode-quick-summary">${escapeHtml(getCreateModeQuickSummary(draft.mode))}</p>
            ${renderCreateFieldValidation("mode")}
          </div>
        </div>
      </section>
    `;
  }


  function renderCreateParticipantsSection(draft, validationSnapshot) {
    const participantStatus = renderCreateParticipantStatus(validationSnapshot);
    return `
      <section class="ata-create-section" data-create-section="participants" aria-labelledby="ata-create-participants-heading">
        ${renderCreateFormSectionHeading(2, "Teilnehmer", "Eine Person pro Zeile; die Reihenfolge bleibt für gesetzte Draws erhalten.", "ata-create-participants-heading")}
        <div class="ata-create-section-body">
          <div class="ata-field">
            <div class="ata-field-label-row">
              <label for="ata-participants">Teilnehmer (eine Zeile pro Person)</label>
              ${renderCreateHelpTrigger("participants", "Hilfe zur Teilnehmerliste öffnen")}
            </div>
            <textarea id="ata-participants" name="participants" aria-describedby="ata-create-participant-status" placeholder="Max Mustermann&#10;Erika Musterfrau">${escapeHtml(draft.participantsText)}</textarea>
            <p id="ata-create-participant-status" class="ata-create-participant-status" data-validation-state="${participantStatus.state}" role="status" aria-live="polite" aria-atomic="true">${escapeHtml(participantStatus.text)}</p>
            ${renderCreateFieldValidation("participants")}
          </div>
          <div class="ata-create-section-actions">
            <button type="button" class="ata-btn ata-btn-sm" data-action="shuffle-participants">Teilnehmer mischen</button>
          </div>
        </div>
      </section>
    `;
  }


  function renderCreateAdditionalRulesSection(draft) {
    const randomizeChecked = draft.randomizeKoRound1 ? "checked" : "";
    const thirdPlaceChecked = draft.enableThirdPlaceMatch ? "checked" : "";
    const grandFinalResetMode = sanitizeGrandFinalResetMode(draft.grandFinalResetMode);
    return `
      <section class="ata-create-section" data-create-section="additional-rules" aria-labelledby="ata-create-additional-rules-heading">
        ${renderCreateFormSectionHeading(3, "Zusätzliche Turnierregeln", "Hier erscheinen die bereits unterstützten Zusatzregeln des gewählten Modus.", "ata-create-additional-rules-heading")}
        <div class="ata-create-section-body ata-create-rule-stack" data-role="mode-specific-rules">
          <div id="ata-groups-ko-odd-policy-host" data-mode-rule-group="groups_ko">
            ${renderGroupsKoOddParticipantPolicyFields(draft)}
          </div>
          <div id="ata-preliminary-final-fields-host" data-mode-rule-group="preliminary_final">${renderPreliminaryFinalFields(draft)}</div>
          <div class="ata-toggle ata-toggle-compact" data-role="ko-draw-field" data-mode-rule-group="ko_draw">
            <div>
              <div class="ata-field-label-row">
                <strong id="ata-randomize-ko-label">KO-Erstrunde zuf\u00e4llig mischen</strong>
                ${renderCreateHelpTrigger("koDraw", "Hilfe zur Auslosung der ersten KO-Runde öffnen")}
              </div>
              <div id="ata-randomize-ko-description" class="ata-small">Open Draw bei aktivem Schalter, sonst gesetzter Draw.</div>
            </div>
            <input id="ata-randomize-ko" name="randomizeKoRound1" type="checkbox" aria-labelledby="ata-randomize-ko-label" aria-describedby="ata-randomize-ko-description" ${randomizeChecked}>
          </div>
          <div class="ata-toggle ata-toggle-compact" data-role="third-place-field" data-mode-rule-group="third_place">
            <div>
              <div class="ata-field-label-row">
                <strong id="ata-enable-third-place-label">Spiel um Platz 3 (optional)</strong>
                ${renderCreateHelpTrigger("thirdPlace", "Hilfe zum Spiel um Platz 3 öffnen")}
              </div>
              <div id="ata-enable-third-place-description" class="ata-small">Nur im KO-Modus: Halbfinal-Verlierer spielen um Platz 3. Ohne Option bleibt klassischer Single-Elimination-Baum.</div>
            </div>
            <input id="ata-enable-third-place" name="enableThirdPlaceMatch" type="checkbox" aria-labelledby="ata-enable-third-place-label" aria-describedby="ata-enable-third-place-description" ${thirdPlaceChecked}>
          </div>
          <div class="ata-field" data-role="grand-final-field" data-mode-rule-group="grand_final">
            <div class="ata-field-label-row">
              <label for="ata-grand-final-reset-mode">Doppel-KO Grand Final</label>
              ${renderCreateHelpTrigger("grandFinal", "Hilfe zum Doppel-KO Grand Final öffnen")}
            </div>
            <select id="ata-grand-final-reset-mode" name="grandFinalResetMode">
              <option value="${GRAND_FINAL_RESET_IF_NEEDED}" ${grandFinalResetMode === GRAND_FINAL_RESET_IF_NEEDED ? "selected" : ""}>Reset-Finale falls nötig (empfohlen)</option>
              <option value="${GRAND_FINAL_RESET_SINGLE_MATCH}" ${grandFinalResetMode === GRAND_FINAL_RESET_SINGLE_MATCH ? "selected" : ""}>Ein einzelnes Grand Final</option>
            </select>
            ${renderCreateFieldValidation("grandFinalResetMode")}
          </div>
          <p class="ata-small ata-create-empty-rules" data-role="league-rules-empty" data-mode-rule-group="league_empty">Für den Ligamodus sind keine zusätzlichen Turnierregeln erforderlich.</p>
        </div>
      </section>
    `;
  }


  function renderCreateGameRulesSection(options) {
    const {
      draft,
      startScoreOptions,
      bullModeDisabledAttr,
      bullModeHiddenInput,
    } = options;
    const summary = buildCreateGameRulesSummary(draft);
    const expanded = state.createGameRulesExpanded === true;
    return `
      <section class="ata-create-section" data-create-section="game-rules" aria-labelledby="ata-create-game-rules-heading">
        ${renderCreateFormSectionHeading(
          4,
          "Spielregeln",
          "Matchlänge und X01-Einstellungen prüfen oder anpassen.",
          "ata-create-game-rules-heading",
          renderCreateHelpTrigger("gameRules", "Hilfe zu Spielregeln und X01 öffnen"),
        )}
        <div class="ata-create-section-body">
          <div class="ata-game-rules-summary" data-role="game-rules-summary">
            <p class="ata-game-rules-origin" data-role="game-rules-preset-origin"><strong>Format:</strong> ${escapeHtml(summary.presetLabel)}</p>
            <p class="ata-game-rules-plain" data-role="game-rules-plain-text">${escapeHtml(summary.plainText)}</p>
            <p class="ata-game-rules-summary-text" data-role="game-rules-summary-text">${escapeHtml(summary.text)}</p>
          </div>
          <div class="ata-game-rules-actions">
            <button
              id="ata-game-rules-editor-toggle"
              type="button"
              class="ata-btn ata-btn-sm"
              data-action="toggle-game-rules-editor"
              aria-expanded="${expanded ? "true" : "false"}"
              aria-controls="ata-game-rules-editor"
            >${expanded ? "Bearbeitung schließen" : "Spielregeln bearbeiten"}</button>
          </div>
          <div
            id="ata-game-rules-editor"
            class="ata-game-rules-editor"
            role="region"
            aria-labelledby="ata-create-game-rules-heading"
            ${expanded ? "" : "hidden"}
          >
            <div class="ata-grid-3 ata-grid-3-tight">
              <div class="ata-field" data-role="standard-bestof-field">
                <label for="ata-bestof">Best of Legs</label>
                <input id="ata-bestof" name="bestOfLegs" type="number" min="1" max="21" step="2" value="${draft.bestOfLegs}">
                ${renderCreateFieldValidation("bestOfLegs")}
              </div>
              <div class="ata-field">
                <label for="ata-startscore">Startpunkte</label>
                <select id="ata-startscore" name="startScore">${startScoreOptions}</select>
                ${renderCreateFieldValidation("startScore")}
              </div>
              <div class="ata-field">
                <label for="ata-x01-inmode">In-Modus</label>
                <select id="ata-x01-inmode" name="x01InMode">
                  <option value="Straight" ${draft.x01InMode === "Straight" ? "selected" : ""}>Straight</option>
                  <option value="Double" ${draft.x01InMode === "Double" ? "selected" : ""}>Double</option>
                  <option value="Master" ${draft.x01InMode === "Master" ? "selected" : ""}>Master</option>
                </select>
                ${renderCreateFieldValidation("x01InMode")}
              </div>
              <div class="ata-field">
                <label for="ata-x01-outmode">Out-Modus</label>
                <select id="ata-x01-outmode" name="x01OutMode">
                  <option value="Straight" ${draft.x01OutMode === "Straight" ? "selected" : ""}>Straight</option>
                  <option value="Double" ${draft.x01OutMode === "Double" ? "selected" : ""}>Double</option>
                  <option value="Master" ${draft.x01OutMode === "Master" ? "selected" : ""}>Master</option>
                </select>
                ${renderCreateFieldValidation("x01OutMode")}
              </div>
              <div class="ata-field">
                <label for="ata-x01-bulloff">Bull-off</label>
                <select id="ata-x01-bulloff" name="x01BullOffMode">
                  <option value="Off" ${draft.x01BullOffMode === "Off" ? "selected" : ""}>Off</option>
                  <option value="Normal" ${draft.x01BullOffMode === "Normal" ? "selected" : ""}>Normal</option>
                  <option value="Official" ${draft.x01BullOffMode === "Official" ? "selected" : ""}>Official</option>
                </select>
                ${renderCreateFieldValidation("x01BullOffMode")}
              </div>
              <div class="ata-field">
                <label for="ata-x01-bullmode">Bull-Modus</label>
                <select id="ata-x01-bullmode" name="x01BullMode" ${bullModeDisabledAttr}>
                  <option value="25/50" ${draft.x01BullMode === "25/50" ? "selected" : ""}>25/50</option>
                  <option value="50/50" ${draft.x01BullMode === "50/50" ? "selected" : ""}>50/50</option>
                </select>
                ${bullModeHiddenInput}
                ${renderCreateFieldValidation("x01BullMode")}
              </div>
              <div class="ata-field">
                <label for="ata-x01-maxrounds">Max Runden</label>
                <select id="ata-x01-maxrounds" name="x01MaxRounds">
                  <option value="15" ${draft.x01MaxRounds === 15 ? "selected" : ""}>15</option>
                  <option value="20" ${draft.x01MaxRounds === 20 ? "selected" : ""}>20</option>
                  <option value="50" ${draft.x01MaxRounds === 50 ? "selected" : ""}>50</option>
                  <option value="80" ${draft.x01MaxRounds === 80 ? "selected" : ""}>80</option>
                </select>
                ${renderCreateFieldValidation("x01MaxRounds")}
              </div>
            </div>
            <div class="ata-create-fixed-summary" data-role="fixed-match-setup" role="group" aria-label="Festes technisches Spiel-Setup">
              <span class="ata-create-fixed-summary-label">Festes Setup</span>
              <span>X01</span>
              <span>Legs · First to N aus Best of</span>
              <span>Private Lobby</span>
            </div>
            <p class="ata-small ata-create-help">Bull-off = Off deaktiviert den dann wirkungslosen Bull-Modus automatisch.</p>
          </div>
        </div>
      </section>
    `;
  }


  function renderCreateTournamentOverview(options) {
    const {
      draft,
      tournamentTimeProfileOptions,
      durationEstimate,
      durationEstimateVisible,
      modeLimitSummary,
      validationSnapshot,
    } = options;
    const helpActive = Boolean(state.activeCreateHelpTopic);
    return `
      <aside id="ata-create-overview" class="ata-create-overview" data-create-section="overview" aria-labelledby="ata-create-overview-heading" ${helpActive ? "hidden" : ""}>
        ${renderCreateFormSectionHeading(5, "Turnierübersicht", "Zeitbedarf prüfen und das Turnier anlegen.", "ata-create-overview-heading")}
        <div class="ata-create-overview-body">
          <div id="ata-create-overview-summary" class="ata-create-overview-summary" data-validation-state="${validationSnapshot.valid ? "valid" : "invalid"}">
            ${renderCreateValidationOverview(validationSnapshot)}
          </div>
          <div class="ata-grid-2 ata-create-overview-controls">
            <div class="ata-field">
              <div class="ata-field-label-row">
                <label for="ata-board-count">Gleichzeitig nutzbare Boards (nur Zeitplanung)</label>
                ${renderCreateHelpTrigger("boardCount", "Hilfe zu Boards für die Zeitprognose öffnen")}
              </div>
              <input id="ata-board-count" name="boardCount" type="number" min="1" max="${TOURNAMENT_DURATION_MAX_BOARD_COUNT}" step="1" value="${draft.boardCount}">
              <p class="ata-small">Legt keine AutoDarts-Boards oder Lobbys an, sondern verfeinert nur die Schätzung.</p>
              ${renderCreateFieldValidation("boardCount")}
            </div>
            <div class="ata-field">
              <div class="ata-field-label-row">
                <label for="ata-create-time-profile">Spieltempo für die Schätzung</label>
                ${renderCreateHelpTrigger("timeProfile", "Hilfe zum Zeitprofil öffnen")}
              </div>
              <select id="ata-create-time-profile" name="tournamentTimeProfile" data-action="set-duration-time-profile">${tournamentTimeProfileOptions}</select>
              ${renderCreateFieldValidation("tournamentTimeProfile")}
            </div>
          </div>
          <div id="ata-create-duration-estimate">${renderTournamentDurationEstimate(durationEstimate, { visible: durationEstimateVisible, showHelpLinks: false })}</div>
          <div class="ata-create-preflight" aria-label="Kontrolle vor der Turnieranlage">
            <strong>Vor dem Start kurz prüfen</strong>
            <ul>
              <li>${escapeHtml(String(validationSnapshot.summary.participantCount))} Teilnehmernamen · ${escapeHtml(validationSnapshot.summary.modeLabel)}</li>
              <li>${escapeHtml(validationSnapshot.summary.presetLabel)} · ${escapeHtml(buildCreateGameRulesSummary(draft).plainText)}</li>
              <li>${escapeHtml(String(draft.boardCount))} ${draft.boardCount === 1 ? "Board" : "Boards"} dienen nur der Zeitplanung; Haus- und Sonderregeln vorher ankündigen.</li>
            </ul>
          </div>
          <p class="ata-small">Modus-Limits: ${escapeHtml(modeLimitSummary)}.</p>
          <div class="ata-actions ata-create-primary-actions">
            <button type="submit" class="ata-btn ata-btn-primary" ${validationSnapshot.valid ? "" : "disabled"} aria-disabled="${validationSnapshot.valid ? "false" : "true"}" aria-describedby="ata-create-submit-status">Turnier anlegen</button>
          </div>
          <p id="ata-create-submit-status" class="ata-create-submit-status" data-validation-state="${validationSnapshot.valid ? "valid" : "invalid"}">${validationSnapshot.valid ? "Alle Pflichtangaben sind gültig." : `${validationSnapshot.issues.length} ${validationSnapshot.issues.length === 1 ? "Punkt" : "Punkte"} offen: ${escapeHtml(validationSnapshot.issues[0]?.message || "Konfiguration prüfen.")}`}</p>
        </div>
      </aside>
    `;
  }


  function renderTournamentTab() {
    const tournament = state.store.tournament;
    const durationEstimateVisible = state.store?.ui?.durationEstimateVisible !== false;
    const tournamentTimeProfile = sanitizeTournamentTimeProfile(
      state.store?.settings?.tournamentTimeProfile,
      TOURNAMENT_TIME_PROFILE_NORMAL,
    );
    const tournamentTimeProfileOptions = TOURNAMENT_TIME_PROFILES.map((profileId) => {
      const profileMeta = getTournamentTimeProfileMeta(profileId);
      const selectedAttr = tournamentTimeProfile === profileId ? "selected" : "";
      const label = profileId === TOURNAMENT_TIME_PROFILE_FAST
        ? `${profileMeta.label} – zügiger Ablauf`
        : profileId === TOURNAMENT_TIME_PROFILE_SLOW
          ? `${profileMeta.label} – längere Wechsel und Pausen`
          : `${profileMeta.label} – ausgewogener Standard (empfohlen)`;
      return `<option value="${profileMeta.id}" ${selectedAttr}>${escapeHtml(label)}</option>`;
    }).join("");
    if (!tournament) {
      const draft = normalizeCreateDraft(state.store?.ui?.createDraft, state.store?.settings);
      reconcileCreateHelpState(draft);
      const modeLimitSummary = buildModeParticipantLimitSummary();
      const startScoreOptions = X01_START_SCORE_OPTIONS.map((score) => (
        `<option value="${score}" ${draft.startScore === score ? "selected" : ""}>${score}</option>`
      )).join("");
      const validationSnapshot = validateCreateConfiguration({
        ...draft,
        tournamentTimeProfile,
      }, state.store.settings);
      state.createValidationSnapshot = validationSnapshot;
      const durationEstimate = validationSnapshot.summary.durationEstimate;
      const bullModeDisabled = draft.x01BullOffMode === "Off";
      const bullModeDisabledAttr = bullModeDisabled ? "disabled" : "";
      const bullModeHiddenInput = bullModeDisabled
        ? `<input type="hidden" id="ata-x01-bullmode-hidden" name="x01BullMode" value="${escapeHtml(draft.x01BullMode)}">`
        : "";
      return `
        <section class="ata-card tournamentCard ata-create-card">
          ${renderSectionHeading("Neues Turnier erstellen", [], {
            id: "ata-create-heading",
            programmaticFocus: true,
          })}
          <form id="ata-create-form" class="ata-create-form">
            <div id="ata-create-error-summary" class="ata-create-error-summary" tabindex="-1" hidden></div>
            <div class="ata-create-layout">
              <div class="ata-create-main">
                ${renderCreateTournamentFormatSection(draft)}
                ${renderCreateParticipantsSection(draft, validationSnapshot)}
                ${renderCreateAdditionalRulesSection(draft)}
                ${renderCreateGameRulesSection({
                  draft,
                  startScoreOptions,
                  bullModeDisabledAttr,
                  bullModeHiddenInput,
                })}
              </div>
              <div class="ata-create-side">
                ${renderCreateTournamentOverview({
                  draft,
                  tournamentTimeProfileOptions,
                  durationEstimate,
                  durationEstimateVisible,
                  modeLimitSummary,
                  validationSnapshot,
                })}
                ${renderCreateHelpPanel(draft)}
              </div>
            </div>
            <p class="ata-small ata-create-form-footnote">Bei Moduswechsel gelten die jeweiligen Grenzen sofort.</p>
          </form>
        </section>
      `;
    }

    const modeLabel = tournament.mode === "ko"
      ? "KO (Straight Knockout)"
      : tournament.mode === "double_ko"
        ? "Doppel-KO (Double Elimination)"
      : tournament.mode === "league"
        ? "Liga (Round Robin)"
        : tournament.mode === "groups_ko"
          ? "Gruppenphase + KO (Round Robin + Straight Knockout)"
          : "Vorrunde + Finalphase";

    const participantsHtml = tournament.participants.map((participant) => (
      `<span class="ata-player-chip">${escapeHtml(participant.name)}</span>`
    )).join("");
    const participantsCount = tournament.participants.length;
    const x01Settings = normalizeTournamentX01Settings(tournament?.x01, tournament?.startScore);
    const activePresetId = getAppliedCreatePresetId(tournament);
    const x01PresetLabel = getCreatePresetLabel(activePresetId);
    const x01BullModeLabel = x01Settings.bullOffMode === "Off"
      ? "Bull-Modus deaktiviert"
      : `Bull-Modus ${x01Settings.bullMode}`;
    const legsToWin = getLegsToWin(tournament.mode === "preliminary_final" ? tournament.finalStage.bestOfLegs : tournament.bestOfLegs);
    const drawMode = normalizeKoDrawMode(tournament?.ko?.drawMode, KO_DRAW_MODE_SEEDED);
    const drawModeLabel = drawMode === KO_DRAW_MODE_OPEN_DRAW ? "Open Draw" : "Gesetzter Draw";
    const drawLockLabel = tournament?.ko?.drawLocked !== false ? "Draw-Lock aktiv" : "Draw-Lock aus";
    const thirdPlaceLabel = tournament?.ko?.enableThirdPlaceMatch === true
      ? "Spiel um Platz 3: aktiv"
      : "Spiel um Platz 3: aus";
    const grandFinalResetLabel = sanitizeGrandFinalResetMode(tournament?.ko?.grandFinalResetMode) === GRAND_FINAL_RESET_IF_NEEDED
      ? "Grand Final: Reset falls nötig"
      : "Grand Final: Einzelmatch";
    const primaryTags = [
      ...(tournament.mode === "preliminary_final"
        ? [
          { text: `${tournament.preliminary.matchesPerParticipant} Vorrundenspiele je Teilnehmer`, cls: "ata-info-tag ata-info-tag-key" },
          { text: "2 Legs fest (1:1 m\u00f6glich)", cls: "ata-info-tag" },
          { text: `Top ${tournament.finalStage.qualifierCount} \u2192 ${tournament.finalStage.type === "double_ko" ? "Doppel-KO" : "KO"}`, cls: "ata-info-tag" },
          { text: `Finalphase Best of ${tournament.finalStage.bestOfLegs}`, cls: "ata-info-tag" },
        ]
        : [
          { text: `Best of ${tournament.bestOfLegs} Legs`, cls: "ata-info-tag ata-info-tag-key" },
          { text: `First to ${legsToWin} Legs`, cls: "ata-info-tag" },
        ]),
      { text: `Startpunkte ${tournament.startScore}`, cls: "ata-info-tag" },
      ...(tournament.mode === "ko" || tournament.mode === "double_ko"
        ? [
          { text: drawModeLabel, cls: "ata-info-tag ata-info-tag-accent" },
          { text: drawLockLabel, cls: "ata-info-tag" },
          ...(tournament.mode === "ko"
            ? [{ text: thirdPlaceLabel, cls: "ata-info-tag" }]
            : [{ text: grandFinalResetLabel, cls: "ata-info-tag" }]),
        ]
        : []),
    ];
    const x01Tags = [
      { text: `Preset ${x01PresetLabel}`, cls: "ata-info-tag ata-info-tag-key" },
      { text: `${x01Settings.inMode} In`, cls: "ata-info-tag" },
      { text: `${x01Settings.outMode} Out`, cls: "ata-info-tag" },
      { text: `Bull-off ${x01Settings.bullOffMode}`, cls: "ata-info-tag" },
      { text: x01BullModeLabel, cls: "ata-info-tag" },
      { text: `Max. Runden ${x01Settings.maxRounds}`, cls: "ata-info-tag" },
    ];
    const primaryTagsHtml = primaryTags.map((tag) => `<span class="${tag.cls}">${escapeHtml(tag.text)}</span>`).join("");
    const x01TagsHtml = x01Tags.map((tag) => `<span class="${tag.cls}">${escapeHtml(tag.text)}</span>`).join("");
    const activeTournamentHeadingLinks = [
      { href: README_TOURNAMENT_MODES_URL, kind: "tech", label: "Turniermodus-Erklärung öffnen", title: "README: Turniermodi" },
    ];
    const activeFormatHelpLinks = renderInfoLinks([
      { href: DRA_GUI_RULE_MODE_FORMATS_URL, kind: "rule", label: "DRA-Regelerklärung zu Modus und Format öffnen", title: "DRA-Regeln in der GUI: Modus und Format" },
    ]);
    const durationEstimate = estimateTournamentDurationFromTournament(tournament, state.store.settings);
    const durationProgress = estimateTournamentDurationProgressFromTournament(tournament, state.store.settings);
    const activeBoardCount = sanitizeTournamentBoardCount(
      tournament?.duration?.boardCount,
      TOURNAMENT_DURATION_DEFAULT_BOARD_COUNT,
    );

    return `
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Aktives Turnier", activeTournamentHeadingLinks)}
        <p class="ata-tournament-title">
          <b>${escapeHtml(tournament.name)}</b>
          <span class="ata-tournament-mode-pill">${escapeHtml(modeLabel)}</span>
        </p>
        <div class="ata-tournament-meta">
          <div class="ata-meta-block">
            <div class="ata-meta-heading">Format ${activeFormatHelpLinks}</div>
            <div class="ata-info-tag-cloud">${primaryTagsHtml}</div>
          </div>
          <div class="ata-meta-block">
            <div class="ata-meta-heading">Spiel-Setup (X01)</div>
            <div class="ata-info-tag-cloud">${x01TagsHtml}</div>
          </div>
          <div class="ata-meta-block">
            <div class="ata-meta-heading">Teilnehmerfeld <span class="ata-player-chip-count">(${participantsCount})</span></div>
            <div class="ata-player-chip-cloud">${participantsHtml}</div>
          </div>
          ${renderActiveGroupsKoPolicyNotice(tournament)}
        </div>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Turnierzeit-Prognose", [
          { href: README_TOURNAMENT_CREATE_URL, kind: "tech", label: "Erklärung zur Turnierzeit-Prognose öffnen", title: "README: Turnier anlegen" },
          { href: README_SETTINGS_URL, kind: "tech", label: "Einstellungen-Dokumentation öffnen", title: "README: Einstellungen" },
        ])}
        <div class="ata-grid-2">
          <div class="ata-field">
            <label for="ata-active-board-count">Boards für Prognose</label>
            <input id="ata-active-board-count" type="number" min="1" max="${TOURNAMENT_DURATION_MAX_BOARD_COUNT}" step="1" value="${activeBoardCount}" data-action="set-duration-board-count">
          </div>
          <div class="ata-field">
            <label for="ata-active-time-profile">Zeitprofil</label>
            <select id="ata-active-time-profile" data-action="set-duration-time-profile">
              ${tournamentTimeProfileOptions}
            </select>
          </div>
        </div>
        <p class="ata-small">Die Restzeit-Prognose wird bei gespeicherten Ergebnissen statisch neu berechnet.</p>
        ${renderTournamentDurationEstimate(durationEstimate, { visible: durationEstimateVisible })}
        ${renderTournamentDurationProgress(durationProgress, { visible: durationEstimateVisible })}
      </section>
      <section class="ata-card tournamentCard">
        <h3>Turnier zur\u00fccksetzen</h3>
        <p class="ata-small">Dieser Schritt l\u00f6scht alle Spielst\u00e4nde. Bitte vorher exportieren.</p>
        <div class="ata-actions">
          <button type="button" class="ata-btn ata-btn-danger" data-action="reset-tournament">Turnier l\u00f6schen</button>
        </div>
      </section>
    `;
  }


