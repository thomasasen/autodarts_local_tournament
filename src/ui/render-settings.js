// Auto-generated module split from dist source.
  function formatUpdateCheckedAt(timestamp) {
    const value = Number(timestamp || 0);
    if (value <= 0) {
      return "";
    }

    try {
      return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value));
    } catch (_) {
      return "";
    }
  }


  function getUpdatePanelState(updateStatus) {
    if (!updateStatus?.capable) {
      return "";
    }

    const normalizedStatus = normalizeText(updateStatus.status || "").toLowerCase();
    if (["available", "current", "checking", "error"].includes(normalizedStatus)) {
      return normalizedStatus;
    }
    return normalizeText(updateStatus.remoteVersion || "") ? "current" : "checking";
  }


  function renderUpdatePanel() {
    const updateStatus = state.updateStatus;
    if (!updateStatus?.capable) {
      return `
        <section class="ata-card tournamentCard">
          ${renderSectionHeading("Script-Update", [
            { href: README_BASE_URL, kind: "tech", label: "README zur Installation öffnen", title: "README: Schnellstart" },
          ])}
          <p class="ata-small">Die Update-Prüfung ist in diesem Kontext nicht verfügbar, weil keine Browser-Fetch-API bereitsteht.</p>
        </section>
      `;
    }

    const panelState = getUpdatePanelState(updateStatus);
    const installedVersion = normalizeText(updateStatus.installedVersion || APP_VERSION) || APP_VERSION;
    const remoteVersion = normalizeText(updateStatus.remoteVersion || "");
    const checkedAtText = formatUpdateCheckedAt(updateStatus.checkedAt);
    const loaderActive = isLoaderRuntimeActive();
    let titleText = "GitHub-Version wird geprüft";
    let copyText = "Die Versionsprüfung läuft oder es liegt noch kein erfolgreicher GitHub-Abgleich vor.";

    if (panelState === "available") {
      titleText = loaderActive ? "Neue Version bereit" : "Update verfügbar";
      copyText = loaderActive
        ? `Installiert: v${installedVersion}. Auf GitHub liegt bereits v${remoteVersion}. Da der Loader aktiv ist, reicht ein Reload von play.autodarts.com.`
        : `Installiert: v${installedVersion}. Auf GitHub liegt bereits v${remoteVersion}.`;
    } else if (panelState === "current") {
      titleText = "Version ist aktuell";
      copyText = remoteVersion
        ? `Installiert ist bereits die aktuelle GitHub-Version v${remoteVersion}.`
        : `Installierte Version: v${installedVersion}.`;
    } else if (panelState === "error") {
      titleText = "Update-Prüfung fehlgeschlagen";
      copyText = normalizeText(updateStatus.error || "Die GitHub-Version konnte nicht gelesen werden.");
    }

    if (checkedAtText) {
      copyText = `${copyText} ${updateStatus.stale ? "Letzter erfolgreicher Stand" : "Geprüft"}: ${checkedAtText}.`;
    }

    return `
      <section class="ata-card tournamentCard ata-update-panel ata-update-panel-${escapeHtml(panelState || "checking")}">
        ${renderSectionHeading("Script-Update", [
          { href: README_BASE_URL, kind: "tech", label: "README zur Installation öffnen", title: "README: Schnellstart" },
        ])}
        <div class="ata-update-head">
          <div class="ata-update-summary">
            <div class="ata-update-title-row">
              <span class="ata-update-dot" aria-hidden="true"></span>
              <strong class="ata-update-title">${escapeHtml(titleText)}</strong>
            </div>
            <p class="ata-small ata-update-copy">${escapeHtml(copyText)}</p>
          </div>
          <div class="ata-actions ata-update-actions">
            <button type="button" class="ata-btn ata-btn-sm" data-action="check-update" ${panelState === "checking" ? "disabled" : ""}>${panelState === "checking" ? "Prüfe..." : "Neu prüfen"}</button>
            ${panelState === "available"
              ? (loaderActive
                ? `<button type="button" class="ata-btn ata-btn-sm ata-btn-primary" data-action="reload-update">Neu laden</button>`
                : `<button type="button" class="ata-btn ata-btn-sm ata-btn-primary" data-action="install-update">Update installieren</button>`)
              : ""}
          </div>
        </div>
        <p class="ata-small">Direkt-Install: <a href="${escapeHtml(USERSCRIPT_DOWNLOAD_URL)}" target="_blank" rel="noopener noreferrer">Runtime Userscript</a> · Empfohlen: <a href="${escapeHtml(USERSCRIPT_LOADER_URL)}" target="_blank" rel="noopener noreferrer">Loader</a></p>
      </section>
    `;
  }


  function renderSettingsTab() {
    const debugEnabled = state.store.settings.debug ? "checked" : "";
    const debugReport = buildMatchStartDebugReport(state.store);
    const debugReportText = JSON.stringify(debugReport, null, 2);
    const hasMatchStartDebugSessions = debugReport.sessionCount > 0;
    const debugActionDisabledAttr = hasMatchStartDebugSessions ? "" : "disabled";
    const autoLobbyEnabled = state.store.settings.featureFlags.autoLobbyStart ? "checked" : "";
    const randomizeKoEnabled = state.store.settings.featureFlags.randomizeKoRound1 ? "checked" : "";
    const koDrawLockDefaultEnabled = state.store.settings.featureFlags.koDrawLockDefault !== false ? "checked" : "";
    const activeKoDrawLocked = state.store?.tournament?.mode === "ko" || state.store?.tournament?.mode === "double_ko"
      ? (state.store?.tournament?.ko?.drawLocked !== false ? "checked" : "")
      : "";
    const activeKoDrawLockDisabledAttr = state.store?.tournament?.mode === "ko" || state.store?.tournament?.mode === "double_ko" ? "" : "disabled";
    const modeLimitSummary = buildModeParticipantLimitSummary();
    const tieBreakProfile = normalizeTieBreakProfile(
      state.store?.tournament?.rules?.tieBreakProfile,
      TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE,
    );
    const tieBreakLocked = hasRelevantCompletedTieBreakMatch(state.store?.tournament);
    const tieBreakDisabledAttr = state.store?.tournament && !tieBreakLocked ? "" : "disabled";
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
      ${renderUpdatePanel()}
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Turnierablauf und Automatik", [
          { href: README_SETTINGS_URL, kind: "tech", label: "Einstellungen-Dokumentation \u00f6ffnen", title: "README: Einstellungen" },
          { href: README_INFO_SYMBOLS_URL, kind: "tech", label: "Legende der Info-Symbole \u00f6ffnen", title: "README: Info-Symbole" },
        ])}
        <div class="ata-toggle">
          <div>
            <strong><span id="ata-setting-autolobby-label">AutoDarts-Automatik f\u00fcr Matchstart und Ergebnis</span> ${apiSyncHelpLinks}</strong>
            <div id="ata-setting-autolobby-description" class="ata-small">Standard: AUS. Ohne Automatik tr\u00e4gst du gewonnene Legs im Tab <code>Spiele</code> selbst ein. Mit Automatik werden Lobby und Ergebnis \u00fcber die AutoDarts-API verkn\u00fcpft.</div>
          </div>
          <input type="checkbox" id="ata-setting-autolobby" data-action="toggle-autolobby" aria-labelledby="ata-setting-autolobby-label" aria-describedby="ata-setting-autolobby-description" ${autoLobbyEnabled}>
        </div>
        <div class="ata-toggle">
          <div>
            <strong><span id="ata-setting-randomize-ko-label">KO-Erstrunde zuf\u00e4llig auslosen</span> ${koDrawHelpLinks}</strong>
            <div id="ata-setting-randomize-ko-description" class="ata-small">Standard: EIN. Bei AUS entspricht die Reihenfolge der Teilnehmerliste der Setzreihenfolge. Freilose werden nachvollziehbar verteilt.</div>
          </div>
          <input type="checkbox" id="ata-setting-randomize-ko" data-action="toggle-randomize-ko" aria-labelledby="ata-setting-randomize-ko-label" aria-describedby="ata-setting-randomize-ko-description" ${randomizeKoEnabled}>
        </div>
        <div class="ata-toggle">
          <div>
            <strong><span id="ata-setting-ko-draw-lock-default-label">Auslosung nach Turnierstart sperren</span> ${koDrawLockHelpLinks}</strong>
            <div id="ata-setting-ko-draw-lock-default-description" class="ata-small">Standard: EIN. Neue KO- und Doppel-KO-Turniere behalten ihren erzeugten Turnierbaum unver\u00e4ndert.</div>
          </div>
          <input type="checkbox" id="ata-setting-ko-draw-lock-default" data-action="toggle-ko-draw-lock-default" aria-labelledby="ata-setting-ko-draw-lock-default-label" aria-describedby="ata-setting-ko-draw-lock-default-description" ${koDrawLockDefaultEnabled}>
        </div>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Turnierzeit-Prognose", [
          { href: README_TOURNAMENT_CREATE_URL, kind: "tech", label: "Erkl\u00e4rung zur Turnierzeit-Prognose \u00f6ffnen", title: "README: Turnier anlegen" },
          { href: README_SETTINGS_URL, kind: "tech", label: "Einstellungen-Dokumentation \u00f6ffnen", title: "README: Einstellungen" },
        ])}
        <p class="ata-small">Zeitprofil und Board-Anzahl werden direkt im Tab <code>Turnier</code> neben der Prognose gesetzt. Die Board-Anzahl ist ausschließlich ein Kapazitätsparameter der Zeitprognose und keine Board- oder Lobbyverwaltung.</p>
        <p class="ata-small"><strong>Schnell:</strong> z\u00fcgige Abl\u00e4ufe. <strong>Normal:</strong> ausgewogener Standard. <strong>Langsam:</strong> konservativer f\u00fcr gemischte Felder und l\u00e4ngere Wechselzeiten.</p>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Auslosung des aktiven Turniers", [
          { href: DRA_GUI_RULE_DRAW_LOCK_URL, kind: "rule", label: "DRA-Regelerkl\u00e4rung zu Draw-Lock \u00f6ffnen", title: "DRA-Regeln in der GUI: Draw-Lock" },
        ])}
        <div class="ata-toggle">
          <div>
            <strong id="ata-setting-ko-draw-locked-label">Draw unver\u00e4nderlich halten</strong>
            <div id="ata-setting-ko-draw-locked-description" class="ata-small">Wenn aktiv, bleibt die KO-Struktur dieses Turniers bestehen und wird nicht automatisch neu ausgelost.</div>
          </div>
          <input type="checkbox" id="ata-setting-ko-draw-locked" data-action="set-ko-draw-locked" aria-labelledby="ata-setting-ko-draw-locked-label" aria-describedby="ata-setting-ko-draw-locked-description" ${activeKoDrawLocked} ${activeKoDrawLockDisabledAttr}>
        </div>
        <p class="ata-small">F\u00fcr KO und Doppel-KO verf\u00fcgbar. Das Entsperren ist eine bewusste Entscheidung der Turnierleitung und muss best\u00e4tigt werden (DRA 6.12.1).</p>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Tabellenwertung bei Gleichstand", [
          { href: DRA_GUI_RULE_TIE_BREAK_URL, kind: "rule", label: "DRA-Regelerkl\u00e4rung zum Tie-Break \u00f6ffnen", title: "DRA-Regeln in der GUI: Tie-Break" },
        ])}
        <div class="ata-field">
          <label for="ata-setting-tiebreak">Reihenfolge der Entscheidungskriterien</label>
          <select id="ata-setting-tiebreak" data-action="set-tiebreak-mode" ${tieBreakDisabledAttr}>
            <option value="${TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE}" ${tieBreakProfile === TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE ? "selected" : ""}>Direktvergleich und Minitabelle (empfohlen)</option>
            <option value="${TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF}" ${tieBreakProfile === TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF ? "selected" : ""}>Punkte und Leg-Differenz (vereinfacht)</option>
          </select>
        </div>
        <p class="ata-small"><strong>Direktvergleich und Minitabelle:</strong> Punkte (2/1/0), danach Direktvergleich (2er-Gleichstand), Teilgruppen-Leg-Differenz (3+), Gesamt-Leg-Differenz, Legs gewonnen; verbleibender Gleichstand = &bdquo;Playoff erforderlich&ldquo;.</p>
        <p class="ata-small"><strong>Punkte und Leg-Differenz:</strong> vereinfachte Sortierung \u00fcber Punkte, Gesamt-Leg-Differenz und Legs gewonnen (legacy-kompatibel).</p>
        <p class="ata-small">DRA 6.16.1 schreibt keine universelle Reihenfolge vor. Deshalb legt die Turnierleitung dieses Profil vor dem ersten Gruppen- oder Ligaergebnis fest.</p>
        ${tieBreakLocked ? `<p class="ata-small">Profil gesperrt: Nach dem ersten abgeschlossenen Gruppen-/Liga-Ergebnis ist keine Profil\u00e4nderung mehr zul\u00e4ssig (DRA 6.16.1).</p>` : ""}
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
      <details class="ata-card tournamentCard ata-advanced-settings">
        <summary>Erweitert: Diagnose, Debug und Speicher</summary>
        <div class="ata-advanced-settings-body">
          <section>
            ${renderSectionHeading("Diagnose für technische Fehler")}
            <div class="ata-toggle">
              <div>
                <strong id="ata-setting-debug-label">Detailliertes Fehlerprotokoll aktivieren</strong>
                <div id="ata-setting-debug-description" class="ata-small">Nur bei der Fehlersuche nötig. Erfasst technische Matchstart-Schritte ohne Auth-Token.</div>
              </div>
              <input type="checkbox" id="ata-setting-debug" data-action="toggle-debug" aria-labelledby="ata-setting-debug-label" aria-describedby="ata-setting-debug-description" ${debugEnabled}>
            </div>
            <div class="ata-actions ata-debug-actions">
              <button type="button" class="ata-btn ata-btn-sm" data-action="copy-matchstart-debug" ${debugActionDisabledAttr}>Fehlerprotokoll kopieren</button>
              <button type="button" class="ata-btn ata-btn-sm" data-action="clear-matchstart-debug" ${debugActionDisabledAttr}>Fehlerprotokoll leeren</button>
            </div>
            ${hasMatchStartDebugSessions
              ? `<pre class="ata-debug-log">${escapeHtml(debugReportText)}</pre>`
              : `<p class="ata-small">Noch keine Diagnosedaten vorhanden. Erst aktivieren, dann den fehlerhaften Matchstart erneut testen.</p>`}
          </section>
          <section>
            ${renderSectionHeading("Lokaler Speicher", [
              { href: ORGANIZER_GUIDE_DOC_URL, kind: "tech", label: "Hinweise zu Sicherung und Speicher öffnen", title: "Veranstalter-Handbuch: Sicherung und Speicher" },
            ])}
            <p class="ata-small">Technischer Speicher: <code>${escapeHtml(STORAGE_KEY)}</code> · Datenformat ${STORAGE_SCHEMA_VERSION}. Sicherungen erstellst du im Tab <code>Sichern</code>.</p>
          </section>
        </div>
      </details>
    `;
  }
