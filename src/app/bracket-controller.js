// App layer: runtime orchestration, persistence scheduling and user feedback.

  function syncBracketFallbackVisibility() {
    const shadow = state.shadowRoot;
    if (!shadow || state.activeTab !== "view") {
      return;
    }
    const fallback = shadow.getElementById("ata-bracket-fallback");
    if (!(fallback instanceof HTMLElement)) {
      return;
    }
    fallback.setAttribute("data-visible", state.bracket.failed ? "1" : "0");
  }


  function queueBracketRender(forceReload = false) {
    const tournament = state.store.tournament;
    if (!tournament || (tournament.mode !== "ko" && tournament.mode !== "groups_ko")) {
      return;
    }
    const frame = resolveBracketFrameElement(state.shadowRoot);
    if (!(frame instanceof HTMLIFrameElement)) {
      return;
    }

    const payload = buildBracketPayload(tournament);
    if (!payload) {
      return;
    }

    if (forceReload || state.bracket.iframe !== frame) {
      state.bracket.iframe = frame;
      resetBracketFrameState(state.bracket, frame, buildBracketFrameSrcdoc());
      syncBracketFallbackVisibility();
    }

    clearBracketFrameTimeout(state.bracket);
    armBracketFrameTimeout(state.bracket, () => {
      state.bracket.failed = true;
      state.bracket.lastError = "Turnierbaum-Render-Timeout";
      syncBracketFallbackVisibility();
      setNotice("error", "CDN-Turnierbaum-Timeout, Fallback bleibt aktiv.", 3200);
      logWarn("bracket", "Iframe bracket render timeout.");
    }, 7000);

    if (state.bracket.ready) {
      postBracketRenderPayload(frame, payload);
    }
  }


  function handleBracketMessage(event) {
    const frame = state.bracket.iframe;
    const data = readBracketFrameMessage(event, frame);
    if (!data) {
      return;
    }

    if (data.type === "ata:bracket-frame-ready") {
      state.bracket.ready = true;
      const payload = buildBracketPayload(state.store.tournament);
      if (payload) {
        postBracketRenderPayload(frame, payload);
      }
      return;
    }

    if (data.type === "ata:bracket-frame-height") {
      applyBracketFrameHeight(frame, state.bracket, data.height);
      return;
    }

    if (data.type === "ata:bracket-rendered") {
      clearBracketFrameTimeout(state.bracket);
      state.bracket.failed = false;
      state.bracket.lastError = "";
      syncBracketFallbackVisibility();
      logDebug("bracket", "Bracket rendered successfully.");
      return;
    }

    if (data.type === "ata:bracket-error") {
      clearBracketFrameTimeout(state.bracket);
      state.bracket.failed = true;
      state.bracket.lastError = normalizeText(data.message || "Unbekannter Fehler");
      syncBracketFallbackVisibility();
      setNotice("error", `Turnierbaum-Fehler: ${state.bracket.lastError}. Fallback aktiv.`, 3600);
      logWarn("bracket", "Bracket render error.", data);
    }
  }

