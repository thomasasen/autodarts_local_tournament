// App layer: runtime orchestration, persistence scheduling and user feedback.

  function removeMatchReturnShortcut() {
    if (state.matchReturnShortcut.root instanceof HTMLElement) {
      state.matchReturnShortcut.root.remove();
    }
    state.matchReturnShortcut.root = null;
    state.matchReturnShortcut.syncing = false;
    state.matchReturnShortcut.inlineSyncingByLobby = {};
    state.matchReturnShortcut.inlineOutcomeByLobby = {};
  }


  function renderMatchReturnShortcut() {
    removeMatchReturnShortcut();
  }


  function cleanupRuntime() {
    if (state.saveTimer) {
      clearTimeout(state.saveTimer);
      state.saveTimer = null;
    }
    if (state.noticeTimer) {
      clearTimeout(state.noticeTimer);
      state.noticeTimer = null;
    }
    clearBracketFrameTimeout(state.bracket);
    removeMatchReturnShortcut();
    removeHistoryImportButton();
    while (state.cleanupStack.length) {
      const cleanup = state.cleanupStack.pop();
      try {
        cleanup();
      } catch (error) {
        logWarn("lifecycle", "Cleanup function failed.", error);
      }
    }
  }


  function initEventBridge() {
    addListener(window, TOGGLE_EVENT, () => {
      toggleDrawer();
    });
    addListener(window, "message", handleBracketMessage);
    addListener(window, "pagehide", cleanupRuntime, { once: true });
    addListener(window, "beforeunload", cleanupRuntime, { once: true });
  }

