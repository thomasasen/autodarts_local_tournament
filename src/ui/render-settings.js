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
        ? `Installiert: v${installedVersion}. Auf GitHub liegt bereits v${remoteVersion}. Da der Loader aktiv ist, reicht ein Reload von play.autodarts.io.`
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
    const activeKoDrawLocked = state.store?.tournament?.mode === "ko"
      ? (state.store?.tournament?.ko?.drawLocked !== false ? "checked" : "")
      : "";
    const activeKoDrawLockDisabledAttr = state.store?.tournament?.mode === "ko" ? "" : "disabled";
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
        ${renderSectionHeading("Debug und Feature-Flags", [
          { href: README_SETTINGS_URL, kind: "tech", label: "Einstellungen-Dokumentation \u00f6ffnen", title: "README: Einstellungen" },
          { href: README_INFO_SYMBOLS_URL, kind: "tech", label: "Legende der Info-Symbole \u00f6ffnen", title: "README: Info-Symbole" },
        ])}
        <div class="ata-toggle">
          <div>
            <strong>Debug-Mode</strong>
            <div class="ata-small">Aktiviert detaillierte Logs in der Browser-Konsole sowie ein persistiertes Matchstart-Debug-Protokoll ohne Auth-Token.</div>
          </div>
          <input type="checkbox" id="ata-setting-debug" data-action="toggle-debug" ${debugEnabled}>
        </div>
        <div class="ata-actions ata-debug-actions">
          <button type="button" class="ata-btn ata-btn-sm" data-action="copy-matchstart-debug" ${debugActionDisabledAttr}>Matchstart-Debug kopieren</button>
          <button type="button" class="ata-btn ata-btn-sm" data-action="clear-matchstart-debug" ${debugActionDisabledAttr}>Matchstart-Debug leeren</button>
        </div>
        <p class="ata-small">Erfasst Vorprüfung, Lobby-Payload, API-Schritte, bullMode-Fallback, vorsichtiges Lobby-Cleanup und Fehlerdetails der letzten Matchstarts.</p>
        ${hasMatchStartDebugSessions
          ? `<pre class="ata-debug-log">${escapeHtml(debugReportText)}</pre>`
          : `<p class="ata-small">Noch keine Matchstart-Debugdaten vorhanden. Debug-Mode aktivieren, Match testen und das Protokoll danach hier kopieren.</p>`}
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
            <div class="ata-small">Standard: EIN. Neue KO-Turniere nutzen damit Open Draw (deterministische Auslosungsreihenfolge, PDC-konforme Freilose).</div>
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
        <p class="ata-small">Zeitprofil und Board-Anzahl werden direkt im Tab <code>Turnier</code> neben der Prognose gesetzt, damit die Planung ohne Tab-Wechsel angepasst werden kann.</p>
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
        <p class="ata-small">Nur f\u00fcr den Modus KO (Straight Knockout) verf\u00fcgbar. Entsperren erfordert einen expliziten Promoter-Override mit Best\u00e4tigung (DRA 6.12.1).</p>
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
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Storage", [
          { href: README_BASE_URL, kind: "tech", label: "Hinweise zu Storage und Import \u00f6ffnen", title: "README: Import, Migration und Persistenz" },
        ])}
        <p class="ata-small"><code>${escapeHtml(STORAGE_KEY)}</code>, schemaVersion ${STORAGE_SCHEMA_VERSION}</p>
      </section>
    `;
  }
