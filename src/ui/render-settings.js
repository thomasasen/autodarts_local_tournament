// Auto-generated module split from dist source.
  function renderSettingsTab() {
    const debugEnabled = state.store.settings.debug ? "checked" : "";
    const autoLobbyEnabled = state.store.settings.featureFlags.autoLobbyStart ? "checked" : "";
    const randomizeKoEnabled = state.store.settings.featureFlags.randomizeKoRound1 ? "checked" : "";
    const modeLimitSummary = buildModeParticipantLimitSummary();
    const tieBreakMode = normalizeTieBreakMode(state.store?.tournament?.rules?.tieBreakMode, TIE_BREAK_MODE_DRA_STRICT);
    const tieBreakDisabledAttr = state.store?.tournament ? "" : "disabled";
    return `
      <section class="ata-card tournamentCard">
        <h3>Debug und Feature-Flags</h3>
        <div class="ata-toggle">
          <div>
            <strong>Debug-Mode</strong>
            <div class="ata-small">Aktiviert detaillierte Logs in der Browser-Konsole.</div>
          </div>
          <input type="checkbox" id="ata-setting-debug" data-action="toggle-debug" ${debugEnabled}>
        </div>
        <div class="ata-toggle">
          <div>
            <strong>Automatischer Lobby-Start + API-Sync</strong>
            <div class="ata-small">Standard: AUS. Aktiviert Matchstart per Klick und automatische Ergebnis\u00fcbernahme aus der Autodarts-API.</div>
          </div>
          <input type="checkbox" id="ata-setting-autolobby" data-action="toggle-autolobby" ${autoLobbyEnabled}>
        </div>
        <div class="ata-toggle">
          <div>
            <strong>KO-Erstrunde zuf\u00e4llig mischen (Standard)</strong>
            <div class="ata-small">Standard: EIN. Neue KO-Turniere nutzen damit Open Draw (zuf\u00e4llige Reihenfolge, PDC-konforme Freilose).</div>
          </div>
          <input type="checkbox" id="ata-setting-randomize-ko" data-action="toggle-randomize-ko" ${randomizeKoEnabled}>
        </div>
      </section>
      <section class="ata-card tournamentCard">
        <h3>DRA Tie-Break</h3>
        <div class="ata-field">
          <label for="ata-setting-tiebreak">Regelmodus pro Turnier</label>
          <select id="ata-setting-tiebreak" data-action="set-tiebreak-mode" ${tieBreakDisabledAttr}>
            <option value="${TIE_BREAK_MODE_DRA_STRICT}" ${tieBreakMode === TIE_BREAK_MODE_DRA_STRICT ? "selected" : ""}>DRA Strict (empfohlen)</option>
            <option value="${TIE_BREAK_MODE_LEGACY}" ${tieBreakMode === TIE_BREAK_MODE_LEGACY ? "selected" : ""}>Legacy</option>
          </select>
        </div>
        <p class="ata-small">DRA Strict nutzt Direktvergleich/Teilgruppen-Logik und markiert unaufl\u00f6sbare Gleichst\u00e4nde als "Playoff erforderlich".</p>
      </section>
      <section class="ata-card tournamentCard">
        <h3>Regelbasis und Limits</h3>
        <p class="ata-small">Aktive Modus-Limits: ${escapeHtml(modeLimitSummary)}.</p>
        <p class="ata-small">Die DRA-Regeln setzen kein fixes globales Teilnehmermaximum. Die Grenzen oben sind bewusst f\u00fcr faire Turnierdauer und stabile Darstellung gesetzt. Details: <a href="${README_RULES_URL}" target="_blank" rel="noopener noreferrer">README - Regelbasis und Limits</a>.</p>
      </section>
      <section class="ata-card tournamentCard">
        <h3>Storage</h3>
        <p class="ata-small"><code>${escapeHtml(STORAGE_KEY)}</code>, schemaVersion ${STORAGE_SCHEMA_VERSION}</p>
      </section>
    `;
  }


