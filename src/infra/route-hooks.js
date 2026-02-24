// Auto-generated module split from dist source.
  function onRouteChange() {
    const current = routeKey();
    if (current === state.routeKey) {
      return;
    }
    state.routeKey = current;
    logDebug("route", `Route changed to ${current}`);
    ensureHost();
    renderShell();
    renderMatchReturnShortcut();
  }


  function installRouteHooks() {
    if (state.patchedHistory) {
      return;
    }

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function patchedPushState(...args) {
      const result = originalPushState.apply(this, args);
      onRouteChange();
      return result;
    };
    window.history.replaceState = function patchedReplaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      onRouteChange();
      return result;
    };

    state.patchedHistory = {
      pushState: originalPushState,
      replaceState: originalReplaceState,
    };

    addCleanup(() => {
      if (state.patchedHistory) {
        window.history.pushState = state.patchedHistory.pushState;
        window.history.replaceState = state.patchedHistory.replaceState;
        state.patchedHistory = null;
      }
    });

    addListener(window, "popstate", onRouteChange, { passive: true });
    addListener(window, "hashchange", onRouteChange, { passive: true });
    addInterval(() => {
      if (!document.getElementById(UI_HOST_ID)) {
        ensureHost();
      }
      onRouteChange();
    }, 1000);
  }


