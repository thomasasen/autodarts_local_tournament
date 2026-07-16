// Presentation for local tournament backups and recovery.
  function renderIOTab() {
    const tournament = state.store?.tournament;
    const participantCount = Array.isArray(tournament?.participants) ? tournament.participants.length : 0;
    const tournamentSummary = tournament
      ? `${normalizeText(tournament.name || "Unbenanntes Turnier")} · ${getModeParticipantLimits(tournament.mode).label} · ${participantCount} Teilnehmer`
      : "Noch kein aktives Turnier. Eine Sicherung enthält erst nach der Turnieranlage Daten.";
    return `
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Turnier sichern", [
          { href: ORGANIZER_GUIDE_DOC_URL, kind: "tech", label: "Anleitung zu Sicherung und Wiederherstellung öffnen", title: "Veranstalter-Handbuch: Sicherung" },
        ])}
        <p>Speichert das aktuelle Turnier mit Paarungen, Ergebnissen und Fortschritt als Datei.</p>
        <p class="ata-small"><strong>Aktueller Stand:</strong> ${escapeHtml(tournamentSummary)}</p>
        <div class="ata-actions">
          <button type="button" class="ata-btn ata-btn-primary" data-action="export-file" ${tournament ? "" : "disabled"}>Sicherungsdatei herunterladen</button>
          <button type="button" class="ata-btn" data-action="export-clipboard" ${tournament ? "" : "disabled"}>Sicherungsdaten kopieren</button>
        </div>
      </section>
      <section class="ata-card tournamentCard">
        <h3>Sicherung wiederherstellen</h3>
        <p>Eine Sicherungsdatei stellt ein früheres Turnier wieder her. Vor dem Ersetzen zeigt die Anwendung Name, Modus und Teilnehmerzahl zur Bestätigung an.</p>
        ${tournament ? `<p class="ata-io-warning"><strong>Achtung:</strong> Das aktuell aktive Turnier wird nach deiner Bestätigung ersetzt. Lade vorher eine Sicherung herunter, wenn du es behalten möchtest.</p>` : ""}
        <div class="ata-field">
          <label for="ata-import-file">Sicherungsdatei auswählen</label>
          <input id="ata-import-file" type="file" accept=".json,application/json">
        </div>
        <details class="ata-io-advanced">
          <summary>Erweitert: Sicherungsdaten als JSON einfügen</summary>
          <div class="ata-field">
            <label for="ata-import-text">JSON-Sicherungsdaten</label>
            <textarea id="ata-import-text" placeholder="{ ... }"></textarea>
          </div>
          <div class="ata-actions">
            <button type="button" class="ata-btn" data-action="import-text">Eingefügte Sicherung prüfen</button>
          </div>
        </details>
      </section>
    `;
  }

