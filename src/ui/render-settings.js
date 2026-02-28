// Auto-generated module split from dist source.
  function renderSettingsTab() {
    const debugEnabled = state.store.settings.debug ? "checked" : "";
    const tournamentTimeProfile = sanitizeTournamentTimeProfile(
      state.store.settings.tournamentTimeProfile,
      TOURNAMENT_TIME_PROFILE_NORMAL,
    );
    const tournamentTimeProfileOptions = TOURNAMENT_TIME_PROFILES.map((profileId) => {
      const profileMeta = getTournamentTimeProfileMeta(profileId);
      const selectedAttr = tournamentTimeProfile === profileId ? "selected" : "";
      const label = profileId === TOURNAMENT_TIME_PROFILE_NORMAL
        ? `${profileMeta.label} (empfohlen)`
        : profileMeta.label;
      return `<option value="${profileMeta.id}" ${selectedAttr}>${escapeHtml(label)}</option>`;
    }).join("");
    const autoLobbyEnabled = state.store.settings.featureFlags.autoLobbyStart ? "checked" : "";
    const randomizeKoEnabled = state.store.settings.featureFlags.randomizeKoRound1 ? "checked" : "";
    const koDrawLockDefaultEnabled = state.store.settings.featureFlags.koDrawLockDefault !== false ? "checked" : "";
    const activeKoDrawLocked = state.store?.tournament?.mode === "ko"
      ? (state.store?.tournament?.ko?.drawLocked !== false ? "checked" : "")
      : "";
    const activeKoDrawLockDisabledAttr = state.store?.tournament?.mode === "ko" ? "" : "disabled";
    const modeLimitSummary = buildModeParticipantLimitSummary();
    const tieBreakProfile = normalizeTieBreakProfile(
      state.store?.tournament?.rules?.tieBreakProfile,
      TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE,
    );
    const tieBreakDisabledAttr = state.store?.tournament ? "" : "disabled";
    const apiSyncHelpLinks = renderInfoLinks([
      { href: README_API_AUTOMATION_URL, kind: "tech", label: "Erkl\u00e4rung zur API-Halbautomatik \u00f6ffnen", title: "README: API-Halbautomatik" },
      { href: README_INFO_SYMBOLS_URL, kind: "tech", label: "Legende der Info-Symbole \u00f6ffnen", title: "README: Info-Symbole" },
    ]);
    const koDrawHelpLinks = renderInfoLinks([
      { href: README_TOURNAMENT_MODES_URL, kind: "tech", label: "Erkl\u00e4rung zu Turniermodi \u00f6ffnen", title: "README: Turniermodi und Open Draw" },
      { href: DRA_GUI_RULE_OPEN_DRAW_URL, kind: "rule", label: "DRA-Regelerkl\u00e4rung zu Open Draw \u00f6ffnen", title: "DRA-Regeln in der GUI: Open Draw" },
    ]);
    const koDrawLockHelpLinks = renderInfoLinks([
      { href: DRA_GUI_RULE_DRAW_LOCK_URL, kind: "rule", label: "DRA-Regelerkl\u00e4rung zu Draw-Lock \u00f6ffnen", title: "DRA-Regeln in der GUI: Draw-Lock" },
    ]);

    return `
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Debug und Feature-Flags", [
          { href: README_SETTINGS_URL, kind: "tech", label: "Einstellungen-Dokumentation \u00f6ffnen", title: "README: Einstellungen" },
          { href: README_INFO_SYMBOLS_URL, kind: "tech", label: "Legende der Info-Symbole \u00f6ffnen", title: "README: Info-Symbole" },
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
            <div class="ata-small">Standard: AUS. Aktiviert Matchstart per Klick und automatische Ergebnis\u00fcbernahme aus der Autodarts-API.</div>
          </div>
          <input type="checkbox" id="ata-setting-autolobby" data-action="toggle-autolobby" ${autoLobbyEnabled}>
        </div>
        <div class="ata-toggle">
          <div>
            <strong>KO-Erstrunde zuf\u00e4llig mischen (Standard) ${koDrawHelpLinks}</strong>
            <div class="ata-small">Standard: EIN. Neue KO-Turniere nutzen damit Open Draw (zuf\u00e4llige Reihenfolge, PDC-konforme Freilose).</div>
          </div>
          <input type="checkbox" id="ata-setting-randomize-ko" data-action="toggle-randomize-ko" ${randomizeKoEnabled}>
        </div>
        <div class="ata-toggle">
          <div>
            <strong>KO-Draw sperren (Standard) ${koDrawLockHelpLinks}</strong>
            <div class="ata-small">Standard: EIN. Neue KO-Turniere behalten den initialen Draw unver\u00e4ndert.</div>
          </div>
          <input type="checkbox" id="ata-setting-ko-draw-lock-default" data-action="toggle-ko-draw-lock-default" ${koDrawLockDefaultEnabled}>
        </div>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Turnierzeit-Prognose", [
          { href: README_TOURNAMENT_CREATE_URL, kind: "tech", label: "Erkl\u00e4rung zur Turnierzeit-Prognose \u00f6ffnen", title: "README: Turnier anlegen" },
          { href: README_SETTINGS_URL, kind: "tech", label: "Einstellungen-Dokumentation \u00f6ffnen", title: "README: Einstellungen" },
        ])}
        <div class="ata-field">
          <label for="ata-setting-tournament-time-profile">Zeitprofil</label>
          <select id="ata-setting-tournament-time-profile" data-action="set-tournament-time-profile">
            ${tournamentTimeProfileOptions}
          </select>
        </div>
        <p class="ata-small">Die Sch\u00e4tzung im Tab <code>Turnier</code> rechnet immer mit Startscore, Best of, In/Out, Bull-off, Bull-Modus und diesem globalen Zeitprofil.</p>
        <p class="ata-small"><strong>Schnell:</strong> z\u00fcgige Abl\u00e4ufe. <strong>Normal:</strong> ausgewogener Standard. <strong>Langsam:</strong> konservativer f\u00fcr gemischte Felder und l\u00e4ngere Wechselzeiten.</p>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("KO Draw-Lock (aktives Turnier)", [
          { href: DRA_GUI_RULE_DRAW_LOCK_URL, kind: "rule", label: "DRA-Regelerkl\u00e4rung zu Draw-Lock \u00f6ffnen", title: "DRA-Regeln in der GUI: Draw-Lock" },
        ])}
        <div class="ata-toggle">
          <div>
            <strong>Draw unver\u00e4nderlich halten</strong>
            <div class="ata-small">Wenn aktiv, bleibt die KO-Struktur dieses Turniers bestehen und wird nicht automatisch neu ausgelost.</div>
          </div>
          <input type="checkbox" id="ata-setting-ko-draw-locked" data-action="set-ko-draw-locked" ${activeKoDrawLocked} ${activeKoDrawLockDisabledAttr}>
        </div>
        <p class="ata-small">Nur f\u00fcr den Modus KO (Straight Knockout) verf\u00fcgbar.</p>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Promoter Tie-Break-Profil", [
          { href: DRA_GUI_RULE_TIE_BREAK_URL, kind: "rule", label: "DRA-Regelerkl\u00e4rung zum Tie-Break \u00f6ffnen", title: "DRA-Regeln in der GUI: Tie-Break" },
        ])}
        <div class="ata-field">
          <label for="ata-setting-tiebreak">Profil pro Turnier</label>
          <select id="ata-setting-tiebreak" data-action="set-tiebreak-mode" ${tieBreakDisabledAttr}>
            <option value="${TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE}" ${tieBreakProfile === TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE ? "selected" : ""}>Promoter H2H + Mini-Tabelle (empfohlen)</option>
            <option value="${TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF}" ${tieBreakProfile === TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF ? "selected" : ""}>Promoter Punkte + LegDiff</option>
          </select>
        </div>
        <p class="ata-small"><strong>Promoter H2H + Mini-Tabelle:</strong> Punkte (2/1/0), danach Direktvergleich (2er-Gleichstand), Teilgruppen-Leg-Differenz (3+), Gesamt-Leg-Differenz, Legs gewonnen; verbleibender Gleichstand = &bdquo;Playoff erforderlich&ldquo;.</p>
        <p class="ata-small"><strong>Promoter Punkte + LegDiff:</strong> vereinfachte Sortierung \u00fcber Punkte, Gesamt-Leg-Differenz und Legs gewonnen (legacy-kompatibel).</p>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("DRA Checkliste (nicht automatisierbar)", [
          { href: DRA_GUI_RULE_CHECKLIST_URL, kind: "rule", label: "DRA-Regelerkl\u00e4rung zur Checkliste \u00f6ffnen", title: "DRA-Regeln in der GUI: Checkliste" },
        ])}
        <ul class="ata-small">
          <li>Start-/Wurfreihenfolge und Bull-Off-Entscheidungen werden durch den Spielleiter vor Ort best\u00e4tigt.</li>
          <li>Practice/Anspielzeit und Board-Etikette werden organisatorisch durchgesetzt.</li>
          <li>Tie-Break-Entscheidungen bei verbleibendem Gleichstand erfolgen als Promoter-Entscheidung.</li>
          <li>Unklare Sonderf\u00e4lle werden dokumentiert und manuell entschieden, bevor der Turnierfortschritt fortgesetzt wird.</li>
        </ul>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Regelbasis und Limits", [
          { href: DRA_GUI_RULE_PARTICIPANT_LIMITS_URL, kind: "rule", label: "DRA-Regelerkl\u00e4rung zu Limits \u00f6ffnen", title: "DRA-Regeln in der GUI: Teilnehmerlimits" },
        ])}
        <p class="ata-small">Aktive Modus-Limits: ${escapeHtml(modeLimitSummary)}.</p>
        <p class="ata-small">Die DRA-Regeln setzen kein fixes globales Teilnehmermaximum. Die Grenzen oben sind bewusst f\u00fcr faire Turnierdauer und stabile Darstellung gesetzt.</p>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Storage", [
          { href: README_BASE_URL, kind: "tech", label: "Hinweise zu Storage und Import \u00f6ffnen", title: "README: Import, Migration und Persistenz" },
        ])}
        <p class="ata-small"><code>${escapeHtml(STORAGE_KEY)}</code>, schemaVersion ${STORAGE_SCHEMA_VERSION}</p>
      </section>
    `;
  }
