// Auto-generated module split from dist source.
  function applyBracketFrameHeight(frame, bracketState, height) {
    if (!(frame instanceof HTMLIFrameElement)) {
      return;
    }
    const nextHeight = clampInt(height, 0, 420, 12000);
    if (!nextHeight || Math.abs(nextHeight - bracketState.frameHeight) < 2) {
      return;
    }
    bracketState.frameHeight = nextHeight;
    frame.style.height = `${nextHeight}px`;
  }


  function resolveBracketFrameElement(shadowRoot) {
    if (!shadowRoot) {
      return null;
    }
    const frame = shadowRoot.getElementById("ata-bracket-frame");
    return frame instanceof HTMLIFrameElement ? frame : null;
  }


  function resetBracketFrameState(bracketState, frame, srcdoc) {
    bracketState.ready = false;
    bracketState.failed = false;
    bracketState.frameHeight = 0;
    bracketState.lastError = "";
    frame.style.removeProperty("height");
    frame.srcdoc = srcdoc;
  }


  function clearBracketFrameTimeout(bracketState) {
    if (bracketState.timeoutHandle) {
      clearTimeout(bracketState.timeoutHandle);
      bracketState.timeoutHandle = null;
    }
  }


  function armBracketFrameTimeout(bracketState, onTimeout, timeoutMs) {
    bracketState.timeoutHandle = window.setTimeout(() => {
      bracketState.timeoutHandle = null;
      onTimeout();
    }, timeoutMs);
  }


  function postBracketRenderPayload(frame, payload) {
    if (frame instanceof HTMLIFrameElement && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: "ata:render-bracket", payload }, "*");
    }
  }


  function readBracketFrameMessage(event, frame) {
    if (!(frame instanceof HTMLIFrameElement) || event.source !== frame.contentWindow) {
      return null;
    }

    const data = event.data;
    if (!data || typeof data !== "object") {
      return null;
    }

    return data;
  }


