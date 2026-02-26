// Auto-generated module split from dist source.
  const state = {
    ready: false,
    drawerOpen: false,
    activeTab: "tournament",
    lastFocused: null,
    notice: { type: "info", message: "" },
    noticeTimer: null,
    saveTimer: null,
    host: null,
    shadowRoot: null,
    patchedHistory: null,
    routeKey: routeKey(),
    store: createDefaultStore(),
    bracket: {
      iframe: null,
      ready: false,
      failed: false,
      timeoutHandle: null,
      frameHeight: 0,
      lastError: "",
    },
    autoDetect: {
      observer: null,
      queued: false,
      lastScanAt: 0,
      lastFingerprint: "",
    },
    apiAutomation: {
      syncing: false,
      startingMatchId: "",
      authBackoffUntil: 0,
      lastAuthNoticeAt: 0,
    },
    matchReturnShortcut: {
      root: null,
      syncing: false,
      inlineSyncingByLobby: {},
    },
    runtimeStatusSignature: "",
    cleanupStack: [],
  };


