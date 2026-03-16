// Auto-generated module split from dist source.
  async function init() {
    await loadPersistedStore();
    await hydrateStoredUpdateStatus();
    state.runtimeStatusSignature = runtimeStatusSignature();
    ensureHost();
    renderShell();
    removeMatchReturnShortcut();
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
      syncLoaderMenuUpdateIndicator();
      renderHistoryImportButton();
    }, 1200);
    addInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }
      refreshUpdateStatus({
        force: false,
        announce: false,
      }).catch((error) => {
        logWarn("update", "Background update check failed.", error);
      });
    }, UPDATE_AUTO_CHECK_INTERVAL_MS);
    addListener(document, "visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      refreshUpdateStatus({
        force: false,
        announce: false,
      }).catch((error) => {
        logWarn("update", "Visibility-triggered update check failed.", error);
      });
    });
    refreshUpdateStatus({
      force: false,
      announce: false,
    }).catch((error) => {
      logWarn("update", "Initial update check failed.", error);
    });

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


