// Rendering helpers for create-tournament help triggers and the non-modal panel.
  const CREATE_HELP_PANEL_ID = "ata-create-help-panel";
  const CREATE_HELP_TITLE_ID = "ata-create-help-title";

  function getCreateHelpTriggerId(topicId) {
    const topic = getCreateHelpTopic(topicId);
    return topic ? `ata-create-help-trigger-${topic.id}` : "";
  }

  function renderCreateHelpTrigger(topicId, ariaLabel) {
    const topic = getCreateHelpTopic(topicId);
    if (!topic) return "";
    const triggerId = getCreateHelpTriggerId(topic.id);
    const expanded = state.activeCreateHelpTopic === topic.id;
    return `
      <button
        id="${escapeHtml(triggerId)}"
        type="button"
        class="ata-help-trigger"
        data-action="open-create-help"
        data-help-topic="${escapeHtml(topic.id)}"
        aria-label="${escapeHtml(ariaLabel)}"
        aria-controls="${CREATE_HELP_PANEL_ID}"
        aria-expanded="${expanded ? "true" : "false"}"
      ><span aria-hidden="true">?</span></button>
    `;
  }

  function renderCreateHelpTextSection(title, value, className = "") {
    const text = normalizeText(value || "");
    if (!text) return "";
    return `
      <section class="ata-create-help-section ${escapeHtml(className)}">
        <h5>${escapeHtml(title)}</h5>
        <p>${escapeHtml(text)}</p>
      </section>
    `;
  }

  function renderCreateHelpListSection(title, values, className = "") {
    const items = normalizeCreateHelpList(values);
    if (!items.length) return "";
    return `
      <section class="ata-create-help-section ${escapeHtml(className)}">
        <h5>${escapeHtml(title)}</h5>
        <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
    `;
  }

  function renderCreateHelpClassification(classification) {
    const label = normalizeText(classification?.label || "");
    const description = normalizeText(classification?.description || "");
    if (!label && !description) return "";
    return `
      <section class="ata-create-help-section ata-create-help-classification">
        <h5>Herkunft der Einstellung</h5>
        ${label ? `<p class="ata-create-help-classification-label">${escapeHtml(label)}</p>` : ""}
        ${description ? `<p>${escapeHtml(description)}</p>` : ""}
      </section>
    `;
  }

  function renderCreateHelpCompliance(compliance) {
    const normalized = normalizeCreateHelpCompliance(compliance);
    if (!normalized) return "";
    return `
      <section class="ata-create-help-section ata-create-help-compliance" data-compliance-status="${escapeHtml(normalized.status)}">
        <h5>Regelstatus und Konformität</h5>
        <p class="ata-create-help-compliance-label">${escapeHtml(normalized.label)}</p>
        ${normalized.description ? `<p>${escapeHtml(normalized.description)}</p>` : ""}
        ${normalized.scope ? `<p><strong>Geltungsbereich:</strong> ${escapeHtml(normalized.scope)}</p>` : ""}
        ${normalized.enforcement ? `<p><strong>Technische Durchsetzung:</strong> ${escapeHtml(normalized.enforcement)}</p>` : ""}
      </section>
    `;
  }


  function renderCreateHelpSources(sources) {
    const safeSources = (Array.isArray(sources) ? sources : []).filter((source) => (
      normalizeText(source?.label || "") && isCreateHelpSourceUrlAllowed(source?.href)
    ));
    if (!safeSources.length) return "";
    return `
      <section class="ata-create-help-section ata-create-help-sources">
        <h5>Quellen</h5>
        <ul>${safeSources.map((source) => `
          <li><a href="${escapeHtml(source.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a></li>
        `).join("")}</ul>
      </section>
    `;
  }

  function renderCreateHelpPanelBody(model) {
    if (!model) {
      return `<h4 id="${CREATE_HELP_TITLE_ID}" tabindex="-1">Kontextbezogene Hilfe</h4>`;
    }
    return `
      <div class="ata-create-help-panel-head">
        <h4 id="${CREATE_HELP_TITLE_ID}" tabindex="-1">${escapeHtml(model.title)}</h4>
        <button type="button" class="ata-btn ata-btn-sm" data-action="close-create-help">Hilfe schließen</button>
      </div>
      <div class="ata-create-help-panel-body">
        ${renderCreateHelpTextSection("Kurz erklärt", model.shortDescription)}
        ${renderCreateHelpTextSection("Aktuelle Auswahl", model.currentSelection, "ata-create-help-current")}
        ${renderCreateHelpListSection("Auswirkung auf dein Turnier", model.effects)}
        ${renderCreateHelpListSection("Beispiele", model.examples)}
        ${renderCreateHelpListSection("Tipps", model.tips, "ata-create-help-tips")}
        ${renderCreateHelpListSection("Abhängigkeiten", model.dependencies)}
        ${renderCreateHelpListSection("Einschränkungen", model.limitations)}
        ${renderCreateHelpClassification(model.classification)}
        ${renderCreateHelpCompliance(model.compliance)}
        ${renderCreateHelpSources(model.sources)}
      </div>
    `;
  }

  function renderCreateHelpPanel(draft) {
    const model = resolveCreateHelpTopic(
      state.activeCreateHelpTopic,
      draft,
      state.store?.settings,
    );
    return `
      <aside
        id="${CREATE_HELP_PANEL_ID}"
        class="ata-create-help-panel"
        aria-labelledby="${CREATE_HELP_TITLE_ID}"
        ${model ? "" : "hidden"}
      >${renderCreateHelpPanelBody(model)}</aside>
    `;
  }
