// Auto-generated module split from dist source.
  function renderIOTab() {
    return `
      <section class="ata-card tournamentCard">
        <h3>Export</h3>
        <div class="ata-actions">
          <button type="button" class="ata-btn ata-btn-primary" data-action="export-file">JSON herunterladen</button>
          <button type="button" class="ata-btn" data-action="export-clipboard">JSON in Zwischenablage</button>
        </div>
      </section>
      <section class="ata-card tournamentCard">
        <h3>Import</h3>
        <div class="ata-field">
          <label for="ata-import-file">Datei importieren</label>
          <input id="ata-import-file" type="file" accept=".json,application/json">
        </div>
        <div class="ata-field" style="margin-top: 10px;">
          <label for="ata-import-text">JSON einf\u00fcgen</label>
          <textarea id="ata-import-text" placeholder="{ ... }"></textarea>
        </div>
        <div class="ata-actions" style="margin-top: 10px;">
          <button type="button" class="ata-btn" data-action="import-text">Eingef\u00fcgtes JSON importieren</button>
        </div>
      </section>
    `;
  }


