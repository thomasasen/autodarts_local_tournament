// Auto-generated module split from dist source.
  async function init() {
    await loadPersistedStore();
    state.runtimeStatusSignature = runtimeStatusSignature();
    ensureHost();
    renderShell();
    renderMatchReturnShortcut();
    renderHistoryImportButton();

    initEventBridge();
    installRouteHooks();
    startAutoDetectionObserver();
    setupRuntimeApi();
    addInterval(() => {
      syncPendingApiMatches().catch((error) => {
        logWarn("api", "Background sync loop failed.", error);
      });
    }, API_SYNC_INTERVAL_MS);
    addInterval(() => {
      refreshRuntimeStatusUi();
      renderMatchReturnShortcut();
      renderHistoryImportButton();
    }, 1200);

    state.ready = true;
    window.dispatchEvent(new CustomEvent(READY_EVENT, {
      detail: {
        version: APP_VERSION,
      },
    }));
    logDebug("runtime", "ATA runtime initialized.");
  }

  init().catch((error) => {
    logError("runtime", "Initialization failed.", error);
  });
})();


