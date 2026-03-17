// Presentation layer: UI rendering and interaction wiring.
  function getReadmeStatusMessageDoc(message) {
    const text = normalizeText(message || "");
    if (!text) {
      return null;
    }

    const exact = (value) => text === value;
    const prefix = (value) => text.startsWith(value);
    const statusDocs = [
      { anchor: "statusmeldung-api-auth-fehlt", match: () => exact("API Auth fehlt") || exact("Kein Autodarts-Token gefunden. Bitte einloggen und Seite neu laden.") || exact("Kein Auth-Token gefunden. Bitte neu einloggen.") || exact("Auto-Sync pausiert: kein Auth-Token gefunden. Bitte neu einloggen.") },
      { anchor: "statusmeldung-api-auth-abgelaufen", match: () => exact("API Auth abgelaufen") || exact("Auth abgelaufen.") || exact("Auth abgelaufen. Bitte neu einloggen.") || exact("Auto-Sync pausiert: Auth abgelaufen. Bitte neu einloggen.") },
      { anchor: "statusmeldung-api-auth-bereit", match: () => exact("API Auth bereit") },
      { anchor: "statusmeldung-board-aktiv", match: () => prefix("Board aktiv (") },
      { anchor: "statusmeldung-board-id-ungueltig", match: () => prefix("Board-ID ungültig (") || prefix("Board-ID ist ungültig (") },
      { anchor: "statusmeldung-kein-aktives-board", match: () => exact("Kein aktives Board") || exact("Board-ID fehlt. Bitte einmal manuell eine Lobby öffnen und Board auswählen.") },
      { anchor: "statusmeldung-auto-lobby-on", match: () => exact("Auto-Lobby ON") },
      { anchor: "statusmeldung-auto-lobby-off", match: () => exact("Auto-Lobby OFF") || exact("Auto-Lobby ist deaktiviert.") || exact("Auto-Lobby ist deaktiviert. Bitte im Tab Einstellungen aktivieren.") || exact("Auto-Lobby ist deaktiviert. Aktivieren Sie die Funktion im Tab Einstellungen.") },
      { anchor: "statusmeldung-runtime-hinweis-api-voraussetzungen", match: () => exact("Hinweis: Für API-Halbautomatik werden Auth-Token und aktives Board benötigt.") },
      { anchor: "statusmeldung-freilos-bye-kein-api-sync-erforderlich", match: () => exact("Freilos (Bye): kein API-Sync erforderlich") },
      { anchor: "statusmeldung-api-sync-abgeschlossen", match: () => exact("API-Sync: abgeschlossen") },
      { anchor: "statusmeldung-api-sync-aktiv", match: () => prefix("API-Sync: aktiv (Lobby ") },
      { anchor: "statusmeldung-api-sync-fehler", match: () => prefix("API-Sync: Fehler") || prefix("Auto-Sync Fehler bei ") || prefix("Matchstart fehlgeschlagen: ") || prefix("Letzter Sync-Fehler: ") || exact("Match ist im Fehlerstatus.") || exact("Gewinner konnte nicht eindeutig zugeordnet werden.") || exact("Auto-Sync konnte Ergebnis nicht speichern.") },
      { anchor: "statusmeldung-api-sync-nicht-gestartet", match: () => exact("API-Sync: nicht gestartet") },
      { anchor: "statusmeldung-match-nicht-verfuegbar", match: () => exact("Match nicht verfügbar.") },
      { anchor: "statusmeldung-match-bereits-abgeschlossen", match: () => exact("Match ist bereits abgeschlossen.") },
      { anchor: "statusmeldung-paarung-steht-noch-nicht-fest", match: () => exact("Paarung steht noch nicht fest.") },
      { anchor: "statusmeldung-vorgaenger-match-muss-zuerst-abgeschlossen-werden", match: () => prefix("Vorgänger-Match Runde ") },
      { anchor: "statusmeldung-ergebnis-bereits-im-turnier-gespeichert", match: () => exact("Ergebnis bereits im Turnier gespeichert.") || exact("Ergebnis war bereits übernommen.") },
      { anchor: "statusmeldung-kein-eindeutiger-statistik-host", match: () => exact("Kein eindeutiger Statistik-Host für diese Lobby auf der History-Seite gefunden.") },
      { anchor: "statusmeldung-statistik-host-konnte-nicht-zugeordnet-werden", match: () => exact("Statistik-Host konnte nicht auf einen Kartenbereich zugeordnet werden.") },
      { anchor: "statusmeldung-mehrdeutiger-statistik-host", match: () => exact("Mehrdeutiger Statistik-Host: Mehrere passende Bereiche auf der Seite gefunden.") || exact("Statistik-Bereich ist nicht eindeutig. Import ist gesperrt.") },
      { anchor: "statusmeldung-keine-eindeutige-statistik-tabelle", match: () => exact("Im erkannten Statistik-Bereich wurde keine eindeutige Tabelle gefunden.") },
      { anchor: "statusmeldung-mehrere-statistik-tabellen", match: () => exact("Im Statistik-Bereich wurden mehrere Tabellen gefunden. Import wurde aus Sicherheitsgründen gestoppt.") },
      { anchor: "statusmeldung-leg-abweichung-bestaetigung-erforderlich", match: () => prefix("Leg-Abweichung erkannt: Statistik ") || prefix("Leg-Abweichung erkannt. Bitte Übernahme ") || exact("Explizite Bestätigung erforderlich.") },
      { anchor: "statusmeldung-bestaetigung-abgelaufen", match: () => exact("Bestätigung ist abgelaufen. Bitte den Import erneut starten.") },
      { anchor: "statusmeldung-bestaetigung-ungueltig", match: () => exact("Bestätigung ist ungültig. Bitte den Import erneut starten.") || exact("Bestätigung passt nicht mehr zur aktuellen Statistik. Bitte erneut bestätigen.") },
      { anchor: "statusmeldung-statistik-api-fallback", match: () => exact("Statistik konnte nicht vollständig gelesen werden. Beim Klick wird API-Fallback genutzt.") },
      { anchor: "statusmeldung-import-bereit-sieger-laut-statistik", match: () => prefix("Import bereit. Sieger laut Statistik: ") },
      { anchor: "statusmeldung-match-verknuepft-ergebnis-kann-jetzt-gespeichert-werden", match: () => exact("Match verknüpft. Ergebnis kann jetzt übernommen werden.") },
      { anchor: "statusmeldung-kein-direkt-verknuepftes-match-gefunden", match: () => exact("Kein direkt verknüpftes Match gefunden. Ergebnisübernahme versucht Zuordnung über die Statistik.") },
      { anchor: "statusmeldung-keine-lobby-id-erkannt", match: () => exact("Keine Lobby-ID erkannt.") || exact("Keine Lobby-ID vorhanden.") },
      { anchor: "statusmeldung-mehrdeutige-zuordnung-lobby", match: () => exact("Mehrdeutige Zuordnung: mehrere offene Turnier-Matches passen zur Lobby. Bitte in der Ergebnisführung manuell speichern.") },
      { anchor: "statusmeldung-kein-offenes-turnier-match-fuer-diese-lobby-gefunden", match: () => exact("Kein offenes Turnier-Match für diese Lobby gefunden.") },
      { anchor: "statusmeldung-kein-offenes-turnier-match-aus-lobby-id-oder-statistik-spielern-gefunden", match: () => exact("Kein offenes Turnier-Match aus Lobby-ID oder Statistik-Spielern gefunden.") },
      { anchor: "statusmeldung-api-ergebnis-noch-nicht-final-verfuegbar", match: () => exact("API-Ergebnis ist noch nicht final verfügbar.") || exact("Match-Stats noch nicht verfügbar.") || exact("Noch kein finales Ergebnis verfügbar. Match läuft ggf. noch.") },
      { anchor: "statusmeldung-ergebnis-importiert", match: () => exact("Ergebnis übernommen.") || exact("Ergebnis wurde aus der Match-Statistik übernommen.") || prefix("Ergebnis übernommen. Legs wurden nach bestätigter Abweichung auf First to ") || exact("Ergebnis wurde in xLokales Turnier übernommen.") },
      { anchor: "statusmeldung-mehrdeutige-zuordnung-statistik-spieler", match: () => exact("Mehrdeutige Zuordnung: mehrere offene Turnier-Matches passen zu diesen Spielern.") },
      { anchor: "statusmeldung-sieger-konnte-aus-der-statistik-nicht-eindeutig-bestimmt-werden", match: () => exact("Sieger konnte aus der Statistik nicht eindeutig bestimmt werden.") },
      { anchor: "statusmeldung-ergebnis-konnte-nicht-aus-der-statistik-gespeichert-werden", match: () => exact("Ergebnis konnte nicht aus der Statistik gespeichert werden.") },
    ];

    const match = statusDocs.find((entry) => entry.match());
    if (!match) {
      return null;
    }

    return {
      href: `${README_BASE_URL}#${match.anchor}`,
      title: `README: ${text}`,
    };
  }


  function renderDocLinkableMessage(message, options = {}) {
    const text = normalizeText(message || "");
    if (!text) {
      return "";
    }

    const tagName = normalizeToken(options.tagName || "span") || "span";
    const className = normalizeText(options.className || "");
    const attributes = normalizeText(options.attributes || "");
    const fallbackTitle = normalizeText(options.title || "");
    const doc = getReadmeStatusMessageDoc(text);
    const attributeHtml = attributes ? ` ${attributes}` : "";
    const classHtml = className ? ` class="${escapeHtml(className)}"` : "";
    const titleText = doc ? (doc.title || fallbackTitle) : fallbackTitle;
    const titleHtml = titleText ? ` title="${escapeHtml(titleText)}"` : "";

    if (!doc) {
      return `<${tagName}${classHtml}${titleHtml}${attributeHtml}>${escapeHtml(text)}</${tagName}>`;
    }

    const linkClassName = normalizeText(`${className} ata-doc-linkable`);
    return `<a class="${escapeHtml(linkClassName)}" href="${escapeHtml(doc.href)}" target="_blank" rel="noopener noreferrer" data-doc-link="1"${titleHtml}${attributeHtml}>${escapeHtml(text)}</a>`;
  }

  function renderInfoLinks(links) {
    if (!Array.isArray(links) || !links.length) {
      return "";
    }

    const linksHtml = links
      .map((entry) => {
        const href = String(entry?.href || "").trim();
        if (!href) {
          return "";
        }
        const kind = normalizeToken(entry?.kind || "tech");
        const isRuleLink = kind === "rule" || kind === "rules" || kind === "regel";
        const symbol = isRuleLink ? "§" : "ⓘ";
        const className = isRuleLink
          ? "ata-help-link ata-help-link-rule"
          : "ata-help-link ata-help-link-tech";
        const label = normalizeText(entry?.label) || "Mehr Informationen";
        const title = normalizeText(entry?.title) || label;
        return `
          <a
            class="${className}"
            href="${escapeHtml(href)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${escapeHtml(label)}"
            title="${escapeHtml(title)}"
          >${symbol}</a>
        `;
      })
      .filter(Boolean)
      .join("");

    if (!linksHtml) {
      return "";
    }

    return `<span class="ata-help-links">${linksHtml}</span>`;
  }


  function renderSectionHeading(title, links = []) {
    return `
      <div class="ata-heading-row">
        <h3>${escapeHtml(title)}</h3>
        ${renderInfoLinks(links)}
      </div>
    `;
  }


  function formatDurationMinutes(value) {
    const totalMinutes = Math.max(0, Math.round(Number(value) || 0));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours <= 0) {
      return `${minutes}m`;
    }
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  }


  function formatDurationDecimal(value, digits = 1) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return `0,${"0".repeat(Math.max(0, digits))}`;
    }
    return numeric.toFixed(digits).replace(".", ",");
  }


  function renderTournamentDurationEstimate(estimate, options = {}) {
    const visible = options?.visible !== false;
    const helpLinks = renderInfoLinks([
      { href: README_TOURNAMENT_CREATE_URL, kind: "tech", label: "Erkl\u00e4rung zur Turnierzeit-Prognose \u00f6ffnen", title: "README: Turnier anlegen" },
      { href: README_SETTINGS_URL, kind: "tech", label: "Einstellungen f\u00fcr das Zeitprofil \u00f6ffnen", title: "README: Einstellungen" },
    ]);
    const visibilityButtonLabel = visible ? "Ausblenden" : "Einblenden";
    const visibilityToggleButton = `<button type="button" class="ata-btn ata-btn-sm" data-action="toggle-duration-estimate-visibility">${visibilityButtonLabel}</button>`;
    const estimateReason = normalizeText(estimate?.reason || "");
    const boardCount = sanitizeTournamentBoardCount(
      estimate?.boardCount,
      TOURNAMENT_DURATION_DEFAULT_BOARD_COUNT,
    );
    const boardLabel = boardCount === 1 ? "Board" : "Boards";

    if (!estimate?.ready) {
      return `
        <section class="ata-estimate-card ata-estimate-card-pending">
          <div class="ata-estimate-head">
            <strong>Voraussichtliche Turnierzeit</strong>
            <span class="ata-form-inline-actions">
              ${visibilityToggleButton}
              ${helpLinks}
            </span>
          </div>
          ${!visible ? `<p class="ata-small">Prognose ist ausgeblendet.</p>` : `
          <div class="ata-estimate-value ata-estimate-value-pending">Noch nicht berechenbar</div>
          <p class="ata-small">${escapeHtml(estimateReason || "Die Sch\u00e4tzung startet, sobald die Konfiguration f\u00fcr den gew\u00e4hlten Modus g\u00fcltig ist.")}</p>
          <p class="ata-small">Annahme: Planung mit ${escapeHtml(String(boardCount))} ${escapeHtml(boardLabel)} und abh\u00e4ngigkeitsbasierter Parallelisierung.</p>
          `}
        </section>
      `;
    }

    if (!visible) {
      return `
        <section class="ata-estimate-card">
          <div class="ata-estimate-head">
            <strong>Voraussichtliche Turnierzeit</strong>
            <span class="ata-form-inline-actions">
              ${visibilityToggleButton}
              ${helpLinks}
            </span>
          </div>
          <div class="ata-estimate-value">ca. ${escapeHtml(formatDurationMinutes(estimate.likelyMinutes))}</div>
          <p class="ata-small">Prognose und Parameter sind ausgeblendet.</p>
        </section>
      `;
    }

    const averageParallelMatches = Math.max(1, Number(estimate.averageParallelMatches || 1));
    const peakParallelMatches = clampInt(estimate.peakParallelMatches, 1, 1, boardCount);
    const boardUtilization = Math.max(0, Math.min(1, Number(estimate.boardUtilization || 0)));
    const utilizationPercent = Math.round(boardUtilization * 100);
    const setupSummary = `${estimate.x01.baseScore}, ${estimate.x01.inMode} In, ${estimate.x01.outMode} Out, Bull-off ${estimate.x01.bullOffMode}, Best of ${estimate.bestOfLegs}`;

    return `
      <section class="ata-estimate-card">
        <div class="ata-estimate-head">
          <strong>Voraussichtliche Turnierzeit</strong>
          <span class="ata-form-inline-actions">
            ${visibilityToggleButton}
            ${helpLinks}
          </span>
        </div>
        <div class="ata-estimate-value">ca. ${escapeHtml(formatDurationMinutes(estimate.likelyMinutes))}</div>
        <div class="ata-estimate-meta">
          <span>${escapeHtml(String(estimate.participantCount))} Teilnehmer</span>
          <span>${escapeHtml(String(estimate.matchCount))} Spiele</span>
          <span>${escapeHtml(String(boardCount))} ${escapeHtml(boardLabel)}</span>
          <span>${escapeHtml(String(estimate.scheduleWaves))} Match-Wellen</span>
          <span>\u00d8 ${escapeHtml(formatDurationDecimal(averageParallelMatches, 2))} Spiele parallel</span>
          <span>Peak ${escapeHtml(String(peakParallelMatches))}/${escapeHtml(String(boardCount))} Boards</span>
          <span>Auslastung ${escapeHtml(String(utilizationPercent))}%</span>
          <span>Durchschnitt ${escapeHtml(formatDurationDecimal(estimate.matchMinutes))} min/Spiel</span>
          <span>Profil ${escapeHtml(estimate.profile.label)}</span>
        </div>
        <div class="ata-estimate-range">
          Realistisch: ${escapeHtml(formatDurationMinutes(estimate.lowMinutes))} - ${escapeHtml(formatDurationMinutes(estimate.highMinutes))}
        </div>
        <p class="ata-small">${escapeHtml(estimate.profile.description)}</p>
        <p class="ata-small">Parallelisierung ber\u00fccksichtigt Match-Abh\u00e4ngigkeiten und blockierte Spieler-Slots.</p>
        <p class="ata-small">Basis: ${escapeHtml(setupSummary)}.</p>
      </section>
    `;
  }


  function renderTournamentDurationProgress(progress, options = {}) {
    const visible = options?.visible !== false;
    if (!progress?.ready || !visible) {
      return "";
    }

    const completed = clampInt(progress.completedMatches, 0, 0, 9999);
    if (completed <= 0) {
      return `
        <section class="ata-estimate-card ata-estimate-card-progress">
          <div class="ata-estimate-head">
            <strong>Laufende Restzeit-Prognose</strong>
          </div>
          <p class="ata-small">Startet automatisch nach dem ersten gespeicherten Ergebnis.</p>
        </section>
      `;
    }
    const remaining = clampInt(progress.remainingMatches, 0, 0, 9999);
    const progressPercent = Math.round(Math.max(0, Math.min(1, Number(progress.progressRatio || 0))) * 100);
    return `
      <section class="ata-estimate-card ata-estimate-card-progress">
        <div class="ata-estimate-head">
          <strong>Laufende Restzeit-Prognose</strong>
        </div>
        <div class="ata-estimate-value">Rest ca. ${escapeHtml(formatDurationMinutes(progress.remainingLikelyMinutes))}</div>
        <div class="ata-estimate-meta">
          <span>Fortschritt ${escapeHtml(String(completed))}/${escapeHtml(String(completed + remaining))} (${escapeHtml(String(progressPercent))}%)</span>
          <span>Offene Match-Wellen ${escapeHtml(String(progress.remainingScheduleWaves))}</span>
        </div>
        <div class="ata-estimate-range">
          Rest realistisch: ${escapeHtml(formatDurationMinutes(progress.remainingLowMinutes))} - ${escapeHtml(formatDurationMinutes(progress.remainingHighMinutes))}
        </div>
        <p class="ata-small">Die Restzeit wird aus offenem Matchplan und gespeichertem Turnierfortschritt statisch neu berechnet.</p>
      </section>
    `;
  }
