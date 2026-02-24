// Auto-generated module split from dist source.
  function buildStyles() {
    return ATA_UI_MAIN_CSS;
  }

  function buildShellHtml() {
    const tabs = TAB_META.map((tab) => `
      <button type="button" class="ata-tab" data-tab="${tab.id}" data-active="${state.activeTab === tab.id ? "1" : "0"}">
        ${escapeHtml(tab.label)}
      </button>
    `).join("");

    const noticeHtml = state.notice.message
      ? `<div class="ata-notice ata-notice-${escapeHtml(state.notice.type)}">${escapeHtml(state.notice.message)}</div>`
      : "";
    const runtimeStatusHtml = renderRuntimeStatusBar();

    return `
      <style>${buildStyles()}</style>
      <div class="ata-root" data-open="${state.drawerOpen ? "1" : "0"}">
        <div class="ata-overlay" data-action="close-drawer"></div>
        <aside class="ata-drawer" role="dialog" aria-modal="true" aria-label="Autodarts Tournament Assistant" tabindex="-1">
          <header class="ata-header">
            <div class="ata-title-wrap">
              <h2>Turnier Assistent</h2>
              <p>Lokales Management f\u00fcr KO, Liga und Gruppenphase <span class="ata-version">v${escapeHtml(APP_VERSION)}</span></p>
            </div>
            <button type="button" class="ata-close-btn" data-action="close-drawer" aria-label="Schlie\u00dfen">Schlie\u00dfen</button>
          </header>
          <nav class="ata-tabs">${tabs}</nav>
          ${runtimeStatusHtml}
          <main class="ata-content" data-role="content">${noticeHtml}${renderActiveTab()}</main>
        </aside>
      </div>
    `;
  }



