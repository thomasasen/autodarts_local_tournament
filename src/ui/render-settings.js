// Auto-generated module split from dist source.
  function renderSettingsTab() {
    const debugEnabled = state.store.settings.debug ? "checked" : "";
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
      { href: README_API_AUTOMATION_URL, kind: "tech", label: "Erklärung zur API-Halbautomatik öffnen", title: "README: API-Halbautomatik" },
      { href: README_INFO_SYMBOLS_URL, kind: "tech", label: "Legende der Info-Symbole öffnen", title: "README: Info-Symbole" },
    ]);
    const koDrawHelpLinks = renderInfoLinks([
      { href: README_TOURNAMENT_MODES_URL, kind: "tech", label: "Erklärung zu Turniermodi öffnen", title: "README: Turniermodi und Open Draw" },
      { href: DRA_RULEBOOK_FORMATS_URL, kind: "rule", label: "DRA-Referenz zu Turnierformaten öffnen", title: "DRA-RULE_BOOK.pdf, Seite 17, Punkte 6.8/6.10" },
      { href: PDC_OPEN_DRAW_CONTEXT_URL, kind: "rule", label: "PDC-Kontext zu Open Draw öffnen", title: "PDC: Open Draw Kontext" },
    ]);
    const koDrawLockHelpLinks = renderInfoLinks([
      { href: DRA_RULEBOOK_LIMITS_URL, kind: "rule", label: "DRA-Regelstelle 6.12.1 öffnen", title: "DRA-RULE_BOOK.pdf, Seite 18, Punkt 6.12.1" },
      { href: README_RULES_URL, kind: "tech", label: "Projekt-Regelbasis öffnen", title: "README: Regelbasis und Limits" },
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
        <div class="ata-toggle">
          <div>
            <strong>KO-Draw sperren (Standard) ${koDrawLockHelpLinks}</strong>
            <div class="ata-small">Standard: EIN. Neue KO-Turniere behalten den initialen Draw unverändert (DRA 6.12.1).</div>
          </div>
          <input type="checkbox" id="ata-setting-ko-draw-lock-default" data-action="toggle-ko-draw-lock-default" ${koDrawLockDefaultEnabled}>
        </div>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("KO Draw-Lock (aktives Turnier)", [
          { href: DRA_RULEBOOK_LIMITS_URL, kind: "rule", label: "DRA-Regelstelle 6.12.1 öffnen", title: "DRA-RULE_BOOK.pdf, Seite 18, Punkt 6.12.1" },
          { href: README_RULES_URL, kind: "tech", label: "Regelbasis im Projekt öffnen", title: "README: Regelbasis und Limits" },
        ])}
        <div class="ata-toggle">
          <div>
            <strong>Draw unveränderlich halten ${koDrawLockHelpLinks}</strong>
            <div class="ata-small">Wenn aktiv, bleibt die KO-Struktur dieses Turniers bestehen und wird nicht automatisch neu ausgelost.</div>
          </div>
          <input type="checkbox" id="ata-setting-ko-draw-locked" data-action="set-ko-draw-locked" ${activeKoDrawLocked} ${activeKoDrawLockDisabledAttr}>
        </div>
        <p class="ata-small">Nur für den Modus KO (Straight Knockout) verfügbar.</p>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Promoter Tie-Break-Profil", [
          { href: DRA_RULEBOOK_TIEBREAK_URL, kind: "rule", label: "DRA-Regelstelle 6.16 (Tie-Break) öffnen", title: "DRA-RULE_BOOK.pdf, Seite 20, Punkt 6.16" },
          { href: DRA_RULES_URL, kind: "rule", label: "Offizielle DRA-Rulebook-Seite öffnen", title: "DRA Rulebook (offiziell)" },
          { href: README_TIE_BREAK_URL, kind: "tech", label: "Tie-Break-Erklärung im Projekt öffnen", title: "README: DRA Tie-Break" },
        ])}
        <div class="ata-field">
          <label for="ata-setting-tiebreak">Profil pro Turnier ${renderInfoLinks([
            { href: DRA_RULEBOOK_TIEBREAK_URL, kind: "rule", label: "Regelstelle im DRA-RULE_BOOK.pdf öffnen", title: "DRA-RULE_BOOK.pdf, Seite 20, Punkt 6.16" },
            { href: README_TIE_BREAK_URL, kind: "tech", label: "Regelstelle im Projektkontext öffnen", title: "README: DRA Tie-Break (mit Seiten-/Punktreferenzen)" },
          ])}</label>
          <select id="ata-setting-tiebreak" data-action="set-tiebreak-mode" ${tieBreakDisabledAttr}>
            <option value="${TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE}" ${tieBreakProfile === TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE ? "selected" : ""}>Promoter H2H + Mini-Tabelle (empfohlen)</option>
            <option value="${TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF}" ${tieBreakProfile === TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF ? "selected" : ""}>Promoter Punkte + LegDiff</option>
          </select>
        </div>
        <p class="ata-small"><strong>Promoter H2H + Mini-Tabelle:</strong> Punkte (2/1/0), danach Direktvergleich (2er-Gleichstand), Teilgruppen-Leg-Differenz (3+), Gesamt-Leg-Differenz, Legs gewonnen; verbleibender Gleichstand = „Playoff erforderlich“.</p>
        <p class="ata-small"><strong>Promoter Punkte + LegDiff:</strong> vereinfachte Sortierung über Punkte, Gesamt-Leg-Differenz und Legs gewonnen (legacy-kompatibel).</p>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("DRA Checkliste (nicht automatisierbar)", [
          { href: DRA_RULES_URL, kind: "rule", label: "Offizielles DRA-Rulebook öffnen", title: "DRA Rulebook (offiziell)" },
          { href: DRA_RULEBOOK_BASICS_URL, kind: "rule", label: "Definitionen im DRA-RULE_BOOK.pdf öffnen", title: "DRA-RULE_BOOK.pdf, Seite 4" },
        ])}
        <ul class="ata-small">
          <li>Start-/Wurfreihenfolge und Bull-Off-Entscheidungen werden durch den Spielleiter vor Ort bestätigt.</li>
          <li>Practice/Anspielzeit und Board-Etikette werden organisatorisch durchgesetzt.</li>
          <li>Tie-Break-Entscheidungen bei verbleibendem Gleichstand erfolgen als Promoter-Entscheidung.</li>
          <li>Unklare Sonderfälle werden dokumentiert und manuell entschieden, bevor der Turnierfortschritt fortgesetzt wird.</li>
        </ul>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Regelbasis und Limits", [
          { href: DRA_RULEBOOK_FORMATS_URL, kind: "rule", label: "DRA-Regelstellen zu Formaten öffnen", title: "DRA-RULE_BOOK.pdf, Seite 17, Punkte 6.8/6.10" },
          { href: DRA_RULEBOOK_LIMITS_URL, kind: "rule", label: "DRA-Regelstellen zu Limits/Draw öffnen", title: "DRA-RULE_BOOK.pdf, Seite 18, Punkte 6.10.5.2/6.12.1" },
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

