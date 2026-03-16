// App layer: update-status orchestration for UI refresh and loader menu hint.

  function getUpdateStatusSignature(updateStatus) {
    return JSON.stringify({
      capable: Boolean(updateStatus?.capable),
      status: normalizeText(updateStatus?.status || ""),
      installedVersion: normalizeText(updateStatus?.installedVersion || ""),
      remoteVersion: normalizeText(updateStatus?.remoteVersion || ""),
      available: Boolean(updateStatus?.available),
      checkedAt: Number(updateStatus?.checkedAt || 0),
      sourceUrl: normalizeText(updateStatus?.sourceUrl || ""),
      error: normalizeText(updateStatus?.error || ""),
      stale: Boolean(updateStatus?.stale),
    });
  }


  function syncLoaderMenuUpdateIndicator() {
    const button = document.getElementById(LOADER_MENU_ITEM_ID);
    if (!(button instanceof HTMLElement)) {
      return;
    }

    const hasUpdate = Boolean(state.updateStatus?.available);
    const remoteVersion = normalizeText(state.updateStatus?.remoteVersion || "");
    const title = hasUpdate && remoteVersion
      ? `xLokales Turnier - Update verfügbar (${APP_VERSION} -> ${remoteVersion})`
      : "xLokales Turnier";

    button.setAttribute("data-update-state", normalizeText(state.updateStatus?.status || "idle"));
    button.setAttribute("title", title);
    button.setAttribute("aria-label", title);

    let dot = button.querySelector("[data-ata-loader-update-dot='1']");
    if (hasUpdate) {
      if (!(dot instanceof HTMLElement)) {
        dot = document.createElement("span");
        dot.setAttribute("data-ata-loader-update-dot", "1");
        dot.setAttribute("aria-hidden", "true");
        dot.style.position = "absolute";
        dot.style.top = "0.42rem";
        dot.style.right = "0.52rem";
        dot.style.width = "0.58rem";
        dot.style.height = "0.58rem";
        dot.style.borderRadius = "999px";
        dot.style.background = "#ff8370";
        dot.style.boxShadow = "0 0 0 2px rgba(12,22,54,.92), 0 0 0 4px rgba(255,131,112,.18)";
        dot.style.pointerEvents = "none";
        if (!button.style.position) {
          button.style.position = "relative";
        }
        button.appendChild(dot);
      }
    } else if (dot instanceof HTMLElement) {
      dot.remove();
    }
  }


  function setUpdateStatus(nextStatus = {}) {
    const mergedStatus = {
      ...state.updateStatus,
      ...nextStatus,
      installedVersion: APP_VERSION,
      downloadUrl: USERSCRIPT_DOWNLOAD_URL,
    };
    const nextSignature = getUpdateStatusSignature(mergedStatus);
    state.updateStatus = mergedStatus;

    if (nextSignature === state.updateStatusSignature) {
      syncLoaderMenuUpdateIndicator();
      return;
    }

    state.updateStatusSignature = nextSignature;
    syncLoaderMenuUpdateIndicator();
    if (state.shadowRoot) {
      renderShell();
    }
  }
