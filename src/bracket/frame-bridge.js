// Auto-generated module split from dist source.
  function applyBracketFrameHeight(height) {
    const frame = state.bracket.iframe;
    if (!(frame instanceof HTMLIFrameElement)) {
      return;
    }
    const nextHeight = clampInt(height, 0, 420, 12000);
    if (!nextHeight || Math.abs(nextHeight - state.bracket.frameHeight) < 2) {
      return;
    }
    state.bracket.frameHeight = nextHeight;
    frame.style.height = `${nextHeight}px`;
  }


  function queueBracketRender(forceReload = false) {
    const tournament = state.store.tournament;
    if (!tournament || (tournament.mode !== "ko" && tournament.mode !== "groups_ko")) {
      return;
    }
    const shadow = state.shadowRoot;
    if (!shadow) {
      return;
    }
    const frame = shadow.getElementById("ata-bracket-frame");
    if (!(frame instanceof HTMLIFrameElement)) {
      return;
    }

    const payload = buildBracketPayload(tournament);
    if (!payload) {
      return;
    }

    if (forceReload || state.bracket.iframe !== frame) {
      state.bracket.iframe = frame;
      state.bracket.ready = false;
      state.bracket.failed = false;
      state.bracket.frameHeight = 0;
      state.bracket.lastError = "";
      frame.style.removeProperty("height");
      syncBracketFallbackVisibility();
      frame.srcdoc = buildBracketFrameSrcdoc();
    }

    if (state.bracket.timeoutHandle) {
      clearTimeout(state.bracket.timeoutHandle);
      state.bracket.timeoutHandle = null;
    }

    state.bracket.timeoutHandle = window.setTimeout(() => {
      state.bracket.failed = true;
      state.bracket.lastError = "Turnierbaum-Render-Timeout";
      syncBracketFallbackVisibility();
      setNotice("error", "CDN-Turnierbaum-Timeout, Fallback bleibt aktiv.", 3200);
      logWarn("bracket", "Iframe bracket render timeout.");
    }, 7000);

    if (state.bracket.ready && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: "ata:render-bracket", payload }, "*");
    }
  }


  function handleBracketMessage(event) {
    const frame = state.bracket.iframe;
    if (!frame || event.source !== frame.contentWindow) {
      return;
    }

    const data = event.data;
    if (!data || typeof data !== "object") {
      return;
    }

    if (data.type === "ata:bracket-frame-ready") {
      state.bracket.ready = true;
      const payload = buildBracketPayload(state.store.tournament);
      if (payload && frame.contentWindow) {
        frame.contentWindow.postMessage({ type: "ata:render-bracket", payload }, "*");
      }
      return;
    }

    if (data.type === "ata:bracket-frame-height") {
      applyBracketFrameHeight(data.height);
      return;
    }

    if (data.type === "ata:bracket-rendered") {
      if (state.bracket.timeoutHandle) {
        clearTimeout(state.bracket.timeoutHandle);
        state.bracket.timeoutHandle = null;
      }
      state.bracket.failed = false;
      state.bracket.lastError = "";
      syncBracketFallbackVisibility();
      logDebug("bracket", "Bracket rendered successfully.");
      return;
    }

    if (data.type === "ata:bracket-error") {
      if (state.bracket.timeoutHandle) {
        clearTimeout(state.bracket.timeoutHandle);
        state.bracket.timeoutHandle = null;
      }
      state.bracket.failed = true;
      state.bracket.lastError = normalizeText(data.message || "Unbekannter Fehler");
      syncBracketFallbackVisibility();
      setNotice("error", `Turnierbaum-Fehler: ${state.bracket.lastError}. Fallback aktiv.`, 3600);
      logWarn("bracket", "Bracket render error.", data);
    }
  }


