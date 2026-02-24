// Auto-generated module split from dist source.
  async function readStoreValue(key, fallbackValue) {
    try {
      if (typeof GM_getValue === "function") {
        const value = await toPromise(GM_getValue(key, fallbackValue));
        if (value !== undefined) {
          return value;
        }
      }
    } catch (error) {
      logWarn("storage", `GM_getValue failed for ${key}, fallback to localStorage.`, error);
    }

    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        return JSON.parse(raw);
      }
    } catch (error) {
      logWarn("storage", `localStorage read failed for ${key}.`, error);
    }
    return fallbackValue;
  }


  async function writeStoreValue(key, value) {
    try {
      if (typeof GM_setValue === "function") {
        await toPromise(GM_setValue(key, value));
      }
    } catch (error) {
      logWarn("storage", `GM_setValue failed for ${key}, fallback to localStorage.`, error);
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logWarn("storage", `localStorage write failed for ${key}.`, error);
    }
  }


  async function loadPersistedStore() {
    const raw = await readStoreValue(STORAGE_KEY, createDefaultStore());
    state.store = migrateStorage(raw);
    state.activeTab = state.store.ui.activeTab;
    const needsSchemaWriteback = Number(raw?.schemaVersion || 0) !== STORAGE_SCHEMA_VERSION;
    if (state.store.tournament) {
      const changed = refreshDerivedMatches(state.store.tournament);
      if (changed || needsSchemaWriteback) {
        state.store.tournament.updatedAt = nowIso();
        schedulePersist();
      }
    } else if (needsSchemaWriteback) {
      schedulePersist();
    }
    logDebug("storage", "Store loaded", state.store);
  }


  function schedulePersist() {
    if (state.saveTimer) {
      clearTimeout(state.saveTimer);
      state.saveTimer = null;
    }

    state.saveTimer = window.setTimeout(() => {
      state.saveTimer = null;
      persistStore().catch((error) => {
        logError("storage", "Persisting store failed.", error);
      });
    }, SAVE_DEBOUNCE_MS);
  }


  async function persistStore() {
    state.store.schemaVersion = STORAGE_SCHEMA_VERSION;
    state.store.ui.activeTab = state.activeTab;
    await writeStoreValue(STORAGE_KEY, state.store);
  }


  function setNotice(type, message, timeoutMs = 4500) {
    state.notice = { type, message: String(message || "") };
    renderShell();

    if (state.noticeTimer) {
      clearTimeout(state.noticeTimer);
      state.noticeTimer = null;
    }

    if (timeoutMs > 0 && state.notice.message) {
      state.noticeTimer = window.setTimeout(() => {
        state.notice = { type: "info", message: "" };
        renderShell();
      }, timeoutMs);
    }
  }


