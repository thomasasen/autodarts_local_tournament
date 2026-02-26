// Auto-generated module split from dist source.
  function renderTournamentTab() {
    const pdcLogoAvailable = typeof ATA_PDC_LOGO_DATA_URI === "string" && ATA_PDC_LOGO_DATA_URI.startsWith("data:image/");
    const renderPdcBadge = (label) => {
      const title = "PDC-konform: KO, Best of mindestens 3 Legs, 501 Straight In, Double Out, Bull-off Normal, Bull 25/50, Max. Runden 50.";
      const safeLabel = escapeHtml(normalizeText(label || "PDC-konform") || "PDC-konform");
      if (!pdcLogoAvailable) {
        return `<span class="ata-pdc-pill" title="${escapeHtml(title)}">${safeLabel}</span>`;
      }
      return `
        <span class="ata-pdc-badge" title="${escapeHtml(title)}">
          <img class="ata-pdc-logo" src="${ATA_PDC_LOGO_DATA_URI}" alt="PDC Logo">
          <span>${safeLabel}</span>
        </span>
      `;
    };

    const tournament = state.store.tournament;
    if (!tournament) {
      const draft = normalizeCreateDraft(state.store?.ui?.createDraft, state.store?.settings);
      const randomizeChecked = draft.randomizeKoRound1 ? "checked" : "";
      const modeLimitSummary = buildModeParticipantLimitSummary();
      const startScoreOptions = X01_START_SCORE_OPTIONS.map((score) => (
        `<option value="${score}" ${draft.startScore === score ? "selected" : ""}>${score}</option>`
      )).join("");
      const pdcCompliantSetup = isPdcCompliantMatchSetup(draft);
      const pdcPresetActive = draft.x01Preset === X01_PRESET_PDC_STANDARD && pdcCompliantSetup;
      const presetStatusLabel = pdcPresetActive ? "Preset aktiv: PDC-Standard" : "Preset aktiv: Individuell";
      const pdcPresetHint = "PDC-Preset setzt KO, Best of 5, 501, Straight In, Double Out, Bull-off Normal, Bull 25/50 und Max. Runden 50.";
      const bullModeDisabled = draft.x01BullOffMode === "Off";
      const bullModeDisabledAttr = bullModeDisabled ? "disabled" : "";
      const bullModeHiddenInput = bullModeDisabled
        ? `<input type="hidden" id="ata-x01-bullmode-hidden" name="x01BullMode" value="${escapeHtml(draft.x01BullMode)}">`
        : "";
      const pdcBadgeHtml = pdcCompliantSetup ? renderPdcBadge("PDC-konform") : "";
      const createHeadingLinks = [
        { href: README_TOURNAMENT_CREATE_URL, kind: "tech", label: "Erklärung zur Turniererstellung öffnen", title: "README: Turnier anlegen" },
        { href: README_INFO_SYMBOLS_URL, kind: "tech", label: "Legende der Info-Symbole öffnen", title: "README: Info-Symbole" },
      ];
      const modeHelpLinks = renderInfoLinks([
        { href: README_TOURNAMENT_MODES_URL, kind: "tech", label: "Erklärung der Modi öffnen", title: "README: Turniermodi" },
        { href: DRA_GUI_RULE_MODE_FORMATS_URL, kind: "rule", label: "DRA-Regelerklärung zu Modus und Format öffnen", title: "DRA-Regeln in der GUI: Modus und Format" },
      ]);
      const drawHelpLinks = renderInfoLinks([
        { href: README_TOURNAMENT_MODES_URL, kind: "tech", label: "Open Draw und gesetzter Draw erklärt", title: "README: KO-Modus" },
        { href: DRA_GUI_RULE_OPEN_DRAW_URL, kind: "rule", label: "DRA-Regelerklärung zu Open Draw öffnen", title: "DRA-Regeln in der GUI: Open Draw" },
      ]);
      const modeLimitHelpLinks = renderInfoLinks([
        { href: DRA_GUI_RULE_PARTICIPANT_LIMITS_URL, kind: "rule", label: "DRA-Regelerklärung zu Limits öffnen", title: "DRA-Regeln in der GUI: Teilnehmerlimits" },
      ]);
      return `
        <section class="ata-card tournamentCard">
          ${renderSectionHeading("Neues Turnier erstellen", createHeadingLinks)}
          <form id="ata-create-form" class="ata-create-form">
            <input type="hidden" id="ata-x01-preset" name="x01Preset" value="${escapeHtml(draft.x01Preset)}">
            <div class="ata-create-layout">
              <div class="ata-create-main">
                <div class="ata-grid-3 ata-grid-3-tight">
                  <div class="ata-field">
                    <label for="ata-name">Turniername</label>
                    <input id="ata-name" name="name" type="text" placeholder="z. B. Freitagsturnier" value="${escapeHtml(draft.name)}" required>
                  </div>
                  <div class="ata-field">
                    <label for="ata-mode">Modus ${modeHelpLinks}</label>
                    <select id="ata-mode" name="mode">
                      <option value="ko" ${draft.mode === "ko" ? "selected" : ""}>KO</option>
                      <option value="league" ${draft.mode === "league" ? "selected" : ""}>Liga</option>
                      <option value="groups_ko" ${draft.mode === "groups_ko" ? "selected" : ""}>Gruppenphase + KO</option>
                    </select>
                  </div>
                  <div class="ata-field">
                    <label for="ata-bestof">Best of Legs</label>
                    <input id="ata-bestof" name="bestOfLegs" type="number" min="1" max="21" step="2" value="${draft.bestOfLegs}">
                  </div>
                  <div class="ata-field">
                    <label for="ata-startscore">Startpunkte</label>
                    <select id="ata-startscore" name="startScore">
                      ${startScoreOptions}
                    </select>
                  </div>
                  <div class="ata-field">
                    <label for="ata-x01-inmode">In-Modus</label>
                    <select id="ata-x01-inmode" name="x01InMode">
                      <option value="Straight" ${draft.x01InMode === "Straight" ? "selected" : ""}>Straight</option>
                      <option value="Double" ${draft.x01InMode === "Double" ? "selected" : ""}>Double</option>
                      <option value="Master" ${draft.x01InMode === "Master" ? "selected" : ""}>Master</option>
                    </select>
                  </div>
                  <div class="ata-field">
                    <label for="ata-x01-outmode">Out-Modus</label>
                    <select id="ata-x01-outmode" name="x01OutMode">
                      <option value="Straight" ${draft.x01OutMode === "Straight" ? "selected" : ""}>Straight</option>
                      <option value="Double" ${draft.x01OutMode === "Double" ? "selected" : ""}>Double</option>
                      <option value="Master" ${draft.x01OutMode === "Master" ? "selected" : ""}>Master</option>
                    </select>
                  </div>
                  <div class="ata-field">
                    <label for="ata-x01-bulloff">Bull-off</label>
                    <select id="ata-x01-bulloff" name="x01BullOffMode">
                      <option value="Off" ${draft.x01BullOffMode === "Off" ? "selected" : ""}>Off</option>
                      <option value="Normal" ${draft.x01BullOffMode === "Normal" ? "selected" : ""}>Normal</option>
                      <option value="Official" ${draft.x01BullOffMode === "Official" ? "selected" : ""}>Official</option>
                    </select>
                  </div>
                  <div class="ata-field">
                    <label for="ata-x01-bullmode">Bull-Modus</label>
                    <select id="ata-x01-bullmode" name="x01BullMode" ${bullModeDisabledAttr}>
                      <option value="25/50" ${draft.x01BullMode === "25/50" ? "selected" : ""}>25/50</option>
                      <option value="50/50" ${draft.x01BullMode === "50/50" ? "selected" : ""}>50/50</option>
                    </select>
                    ${bullModeHiddenInput}
                  </div>
                  <div class="ata-field">
                    <label for="ata-x01-maxrounds">Max Runden</label>
                    <select id="ata-x01-maxrounds" name="x01MaxRounds">
                      <option value="15" ${draft.x01MaxRounds === 15 ? "selected" : ""}>15</option>
                      <option value="20" ${draft.x01MaxRounds === 20 ? "selected" : ""}>20</option>
                      <option value="50" ${draft.x01MaxRounds === 50 ? "selected" : ""}>50</option>
                      <option value="80" ${draft.x01MaxRounds === 80 ? "selected" : ""}>80</option>
                    </select>
                  </div>
                  <div class="ata-field">
                    <label for="ata-match-mode">Spielmodus</label>
                    <span id="ata-match-mode" class="ata-field-readonly">Legs (First to N aus Best of)</span>
                  </div>
                  <div class="ata-field">
                    <label for="ata-lobby-fixed">Lobby</label>
                    <span id="ata-lobby-fixed" class="ata-field-readonly">Privat</span>
                  </div>
                  <div class="ata-field ata-field-span-3">
                    <label for="ata-apply-pdc-preset">Preset</label>
                    <div class="ata-form-inline-actions">
                      <button id="ata-apply-pdc-preset" type="button" class="ata-btn ata-btn-sm" data-action="apply-pdc-preset">PDC-Preset anwenden</button>
                      <span class="ata-preset-pill">${escapeHtml(presetStatusLabel)}</span>
                      ${pdcBadgeHtml}
                    </div>
                  </div>
                </div>
                <div class="ata-toggle ata-toggle-compact">
                  <div>
                    <strong>KO-Erstrunde zuf\u00e4llig mischen ${drawHelpLinks}</strong>
                    <div class="ata-small">Open Draw bei aktivem Schalter, sonst gesetzter Draw.</div>
                  </div>
                  <input id="ata-randomize-ko" name="randomizeKoRound1" type="checkbox" ${randomizeChecked}>
                </div>
                <p class="ata-small ata-create-help">${escapeHtml(pdcPresetHint)}</p>
                <p class="ata-small ata-create-help">Best of 1 ist kein PDC-Standardprofil; für das Badge gilt Best of mindestens 3 Legs.</p>
                <p class="ata-small ata-create-help">Bull-off = Off deaktiviert Bull-Modus automatisch (schreibgesch\u00fctzt).</p>
              </div>
              <aside class="ata-create-side">
                <div class="ata-field">
                  <label for="ata-participants">Teilnehmer (eine Zeile pro Person)</label>
                  <textarea id="ata-participants" name="participants" placeholder="Max Mustermann&#10;Erika Musterfrau">${escapeHtml(draft.participantsText)}</textarea>
                </div>
                <div class="ata-actions">
                  <button type="button" class="ata-btn ata-btn-sm" data-action="shuffle-participants">Teilnehmer mischen</button>
                  <button type="submit" class="ata-btn ata-btn-primary">Turnier anlegen</button>
                </div>
                <p class="ata-small">Modus-Limits ${modeLimitHelpLinks}: ${escapeHtml(modeLimitSummary)}.</p>
              </aside>
            </div>
            <p class="ata-small">Bei Moduswechsel gelten die jeweiligen Grenzen sofort.</p>
          </form>
        </section>
      `;
    }

    const modeLabel = tournament.mode === "ko"
      ? "KO (Straight Knockout)"
      : tournament.mode === "league"
        ? "Liga (Round Robin)"
        : "Gruppenphase + KO (Round Robin + Straight Knockout)";

    const participantsHtml = tournament.participants.map((participant) => (
      `<span class="ata-player-chip">${escapeHtml(participant.name)}</span>`
    )).join("");
    const participantsCount = tournament.participants.length;
    const x01Settings = normalizeTournamentX01Settings(tournament?.x01, tournament?.startScore);
    const x01PresetLabel = x01Settings.presetId === X01_PRESET_PDC_STANDARD ? "PDC-Standard" : "Individuell";
    const x01BullModeLabel = x01Settings.bullOffMode === "Off"
      ? "Bull-Modus deaktiviert"
      : `Bull-Modus ${x01Settings.bullMode}`;
    const pdcCompliantSetup = isPdcCompliantMatchSetup({
      mode: tournament.mode,
      bestOfLegs: tournament.bestOfLegs,
      x01: x01Settings,
    });
    const activePdcBadgeHtml = pdcCompliantSetup ? renderPdcBadge("PDC-konform gespielt") : "";
    const legsToWin = getLegsToWin(tournament.bestOfLegs);
    const drawMode = normalizeKoDrawMode(tournament?.ko?.drawMode, KO_DRAW_MODE_SEEDED);
    const drawModeLabel = drawMode === KO_DRAW_MODE_OPEN_DRAW ? "Open Draw" : "Gesetzter Draw";
    const drawLockLabel = tournament?.ko?.drawLocked !== false ? "Draw-Lock aktiv" : "Draw-Lock aus";
    const primaryTags = [
      { text: `Best of ${tournament.bestOfLegs} Legs`, cls: "ata-info-tag ata-info-tag-key" },
      { text: `First to ${legsToWin} Legs`, cls: "ata-info-tag" },
      { text: `Startpunkte ${tournament.startScore}`, cls: "ata-info-tag" },
      ...(tournament.mode === "ko"
        ? [
          { text: drawModeLabel, cls: "ata-info-tag ata-info-tag-accent" },
          { text: drawLockLabel, cls: "ata-info-tag" },
        ]
        : []),
    ];
    const x01Tags = [
      { text: `X01 ${x01PresetLabel}`, cls: "ata-info-tag ata-info-tag-key" },
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

    return `
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Aktives Turnier", activeTournamentHeadingLinks)}
        <p class="ata-tournament-title">
          <b>${escapeHtml(tournament.name)}</b>
          <span class="ata-tournament-mode-pill">${escapeHtml(modeLabel)}</span>
          ${activePdcBadgeHtml}
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
        </div>
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


