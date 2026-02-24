// Auto-generated module split from dist source.
  function logDebug(category, message, ...args) {
    if (!state.store.settings.debug) {
      return;
    }
    console.info(`[ATA][${category}] ${message}`, ...args);
  }


  function logWarn(category, message, ...args) {
    console.warn(`[ATA][${category}] ${message}`, ...args);
  }


  function logError(category, message, ...args) {
    console.error(`[ATA][${category}] ${message}`, ...args);
  }

  // Data layer: persistence, migration and normalization.

