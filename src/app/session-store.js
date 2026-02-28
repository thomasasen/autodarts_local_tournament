// App layer: runtime orchestration, persistence scheduling and user feedback.

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

