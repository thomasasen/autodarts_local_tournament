// Auto-generated module split from dist source.
  function nowIso() {
    return new Date().toISOString();
  }


  function routeKey() {
    return `${location.pathname}${location.search}${location.hash}`;
  }


  function normalizeText(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ");
  }


  function normalizeLookup(value) {
    return normalizeText(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "");
  }


  function normalizeToken(value) {
    return normalizeLookup(value).replace(/[^a-z0-9]+/g, "");
  }


  function cloneSerializable(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return null;
    }
  }


  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }


  function toPromise(value) {
    return value && typeof value.then === "function" ? value : Promise.resolve(value);
  }


  function clampInt(value, fallback, min, max) {
    const num = Number.parseInt(String(value || ""), 10);
    if (!Number.isFinite(num)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, num));
  }


  function uuid(prefix) {
    const random = Math.random().toString(36).slice(2, 8);
    const timestamp = Date.now().toString(36);
    return `${prefix}-${timestamp}-${random}`;
  }


  function nextPowerOfTwo(value) {
    let size = 1;
    while (size < value) {
      size *= 2;
    }
    return size;
  }


  function parseParticipantLines(rawLines) {
    const lines = String(rawLines || "").split(/\r?\n/);
    const seen = new Set();
    const participants = [];

    lines.forEach((line) => {
      const name = normalizeText(line);
      if (!name) {
        return;
      }
      const key = normalizeLookup(name);
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      participants.push({ id: uuid("p"), name });
    });

    return participants;
  }


  function randomInt(maxExclusive) {
    const max = Number(maxExclusive);
    if (!Number.isFinite(max) || max <= 0) {
      return 0;
    }
    const cryptoApi = window.crypto || window.msCrypto;
    if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
      const buffer = new Uint32Array(1);
      const maxUnbiased = Math.floor(0x100000000 / max) * max;
      let value = 0;
      do {
        cryptoApi.getRandomValues(buffer);
        value = buffer[0];
      } while (value >= maxUnbiased);
      return value % max;
    }
    return Math.floor(Math.random() * max);
  }


  function shuffleArray(values) {
    const shuffled = Array.isArray(values) ? values.slice() : [];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInt(index + 1);
      const current = shuffled[index];
      shuffled[index] = shuffled[swapIndex];
      shuffled[swapIndex] = current;
    }
    return shuffled;
  }


