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

