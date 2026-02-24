// Auto-generated module split from dist source.
  function renderSettingsTab() {
    const debugEnabled = state.store.settings.debug ? "checked" : "";
    const autoLobbyEnabled = state.store.settings.featureFlags.autoLobbyStart ? "checked" : "";
    const randomizeKoEnabled = state.store.settings.featureFlags.randomizeKoRound1 ? "checked" : "";
    const modeLimitSummary = buildModeParticipantLimitSummary();
    const tieBreakMode = normalizeTieBreakMode(state.store?.tournament?.rules?.tieBreakMode, TIE_BREAK_MODE_DRA_STRICT);
    const tieBreakDisabledAttr = state.store?.tournament ? "" : "disabled";
    const apiSyncHelpLinks = renderInfoLinks([
      { href: README_API_AUTOMATION_URL, kind: "tech", label: "Erklärung zur API-Halbautomatik öffnen", title: "README: API-Halbautomatik" },
      { href: README_INFO_SYMBOLS_URL, kind: "tech", label: "Legende der Info-Symbole öffnen", title: "README: Info-Symbole" },
    ]);
    const koDrawHelpLinks = renderInfoLinks([
      { href: README_TOURNAMENT_MODES_URL, kind: "tech", label: "Erklärung zu Turniermodi öffnen", title: "README: Turniermodi und Open Draw" },
      { href: PDC_OPEN_DRAW_CONTEXT_URL, kind: "rule", label: "PDC-Kontext zu Open Draw öffnen", title: "PDC: Open Draw Kontext" },
    ]);

    return `
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Debug und Feature-Flags", [
          { href: README_SETTINGS_URL, kind: "tech", label: "Einstellungen-Dokumentation öffnen", title: "README: Einstellungen" },
          { href: README_INFO_SYMBOLS_URL, kind: "tech", label: "Legende der Info-Symbole öffnen", title: "README: Info-Symbole" },
        ])}
        <div class="ata-toggle">
          <div>
            <strong>Debug-Mode</strong>
            <div class="ata-small">Aktiviert detaillierte Logs in der Browser-Konsole.</div>
          </div>
          <input type="checkbox" id="ata-setting-debug" data-action="toggle-debug" ${debugEnabled}>
        </div>
        <div class="ata-toggle">
          <div>
            <strong>Automatischer Lobby-Start + API-Sync ${apiSyncHelpLinks}</strong>
            <div class="ata-small">Standard: AUS. Aktiviert Matchstart per Klick und automatische Ergebnisübernahme aus der Autodarts-API.</div>
          </div>
          <input type="checkbox" id="ata-setting-autolobby" data-action="toggle-autolobby" ${autoLobbyEnabled}>
        </div>
        <div class="ata-toggle">
          <div>
            <strong>KO-Erstrunde zufällig mischen (Standard) ${koDrawHelpLinks}</strong>
            <div class="ata-small">Standard: EIN. Neue KO-Turniere nutzen damit Open Draw (zufällige Reihenfolge, PDC-konforme Freilose).</div>
          </div>
          <input type="checkbox" id="ata-setting-randomize-ko" data-action="toggle-randomize-ko" ${randomizeKoEnabled}>
        </div>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("DRA Tie-Break", [
          { href: DRA_RULES_URL, kind: "rule", label: "Offizielle DRA-Rulebook-Seite öffnen", title: "DRA Rulebook (offiziell)" },
          { href: README_TIE_BREAK_URL, kind: "tech", label: "Erklärung DRA Strict und Legacy öffnen", title: "README: DRA Tie-Break" },
        ])}
        <div class="ata-field">
          <label for="ata-setting-tiebreak">Regelmodus pro Turnier ${renderInfoLinks([
            { href: DRA_RULES_URL, kind: "rule", label: "Offizielle Regelstelle öffnen", title: "DRA Rulebook (offiziell)" },
            { href: README_TIE_BREAK_URL, kind: "tech", label: "Regelstelle im Projektkontext öffnen", title: "README: DRA Tie-Break (mit Seiten-/Punktreferenzen)" },
          ])}</label>
          <select id="ata-setting-tiebreak" data-action="set-tiebreak-mode" ${tieBreakDisabledAttr}>
            <option value="${TIE_BREAK_MODE_DRA_STRICT}" ${tieBreakMode === TIE_BREAK_MODE_DRA_STRICT ? "selected" : ""}>DRA Strict (empfohlen)</option>
            <option value="${TIE_BREAK_MODE_LEGACY}" ${tieBreakMode === TIE_BREAK_MODE_LEGACY ? "selected" : ""}>Legacy</option>
          </select>
        </div>
        <p class="ata-small"><strong>DRA Strict:</strong> Punkte (2/1/0), danach Direktvergleich (2er-Gleichstand), Teilgruppen-Leg-Differenz (3+), Gesamt-Leg-Differenz, Legs gewonnen; verbleibender Gleichstand = „Playoff erforderlich“.</p>
        <p class="ata-small"><strong>Legacy:</strong> bisherige, vereinfachte Sortierung (Punkte, Gesamt-Leg-Differenz, Legs gewonnen). Dieser Modus ist für Rückwärtskompatibilität gedacht und nicht DRA-strict.</p>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Regelbasis und Limits", [
          { href: DRA_RULES_URL, kind: "rule", label: "Offizielle DRA-Rulebook-Seite öffnen", title: "DRA Rulebook (offiziell)" },
          { href: README_RULES_URL, kind: "tech", label: "Regelstellen mit Seiten-/Punktangaben öffnen", title: "README: Regelbasis und Limits" },
        ])}
        <p class="ata-small">Aktive Modus-Limits: ${escapeHtml(modeLimitSummary)}.</p>
        <p class="ata-small">Die DRA-Regeln setzen kein fixes globales Teilnehmermaximum. Die Grenzen oben sind bewusst für faire Turnierdauer und stabile Darstellung gesetzt.</p>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Storage", [
          { href: README_BASE_URL, kind: "tech", label: "Hinweise zu Storage und Import öffnen", title: "README: Import, Migration und Persistenz" },
        ])}
        <p class="ata-small"><code>${escapeHtml(STORAGE_KEY)}</code>, schemaVersion ${STORAGE_SCHEMA_VERSION}</p>
      </section>
    `;
  }
