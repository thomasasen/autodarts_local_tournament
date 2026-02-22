// ==UserScript==
// @name         Autodarts Tournament Assistant Loader
// @namespace    https://github.com/thomasasen/autodarts-tournament-assistant
// @version      0.1.0
// @description  Loads the latest Autodarts Tournament Assistant userscript with cache fallback.
// @author       Thomas Asen
// @license      MIT
// @match        *://play.autodarts.io/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @downloadURL  https://github.com/thomasasen/autodarts-tournament-assistant/raw/refs/heads/main/installer/Autodarts%20Tournament%20Assistant%20Loader.user.js
// @updateURL    https://github.com/thomasasen/autodarts-tournament-assistant/raw/refs/heads/main/installer/Autodarts%20Tournament%20Assistant%20Loader.user.js
// ==/UserScript==

(function () {
  "use strict";

  const EXEC_GUARD_KEY = "__ATA_LOADER_BOOTSTRAPPED";
  const RUNTIME_GUARD_KEY = "__ATA_RUNTIME_BOOTSTRAPPED";
  const CACHE_CODE_KEY = "ata:loader:cache:code:v1";
  const CACHE_META_KEY = "ata:loader:cache:meta:v1";
  const REQUEST_TIMEOUT_MS = 10_000;

  const REMOTE_SOURCE_URL = "https://raw.githubusercontent.com/thomasasen/autodarts-tournament-assistant/main/dist/autodarts-tournament-assistant.user.js";

  const MENU_ITEM_ID = "ata-loader-menu-item";
  const MENU_LABEL = "Turnier";
  const MENU_HINT_ROUTES = new Set(["/lobbies", "/boards", "/matches", "/tournaments"]);
  const prefix = "[ATA Loader]";

  if (window[EXEC_GUARD_KEY]) {
    return;
  }
  window[EXEC_GUARD_KEY] = true;

  let domObserver = null;
  let observerRoot = null;
  let pollTimer = null;
  let rafQueued = false;

  function log(message, ...args) {
    console.info(`${prefix} ${message}`, ...args);
  }

  function warn(message, ...args) {
    console.warn(`${prefix} ${message}`, ...args);
  }

  function error(message, ...args) {
    console.error(`${prefix} ${message}`, ...args);
  }

  function toPromise(value) {
    return value && typeof value.then === "function" ? value : Promise.resolve(value);
  }

  async function readStore(key, fallbackValue) {
    try {
      if (typeof GM_getValue === "function") {
        const value = await toPromise(GM_getValue(key, fallbackValue));
        if (value !== undefined) {
          return value;
        }
      }
    } catch (readError) {
      warn(`GM_getValue failed for ${key}, using localStorage fallback.`, readError);
    }

    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        return JSON.parse(raw);
      }
    } catch (_) {
      // Ignore localStorage parsing errors.
    }

    return fallbackValue;
  }

  async function writeStore(key, value) {
    try {
      if (typeof GM_setValue === "function") {
        await toPromise(GM_setValue(key, value));
      }
    } catch (writeError) {
      warn(`GM_setValue failed for ${key}, using localStorage fallback.`, writeError);
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      // Ignore localStorage write errors.
    }
  }

  function requestText(url) {
    if (typeof GM_xmlhttpRequest === "function") {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET",
          url,
          timeout: REQUEST_TIMEOUT_MS,
          headers: { Accept: "text/plain" },
          onload: (response) => {
            if (response.status >= 200 && response.status < 300) {
              resolve(String(response.responseText || ""));
              return;
            }
            reject(new Error(`HTTP ${response.status}`));
          },
          onerror: () => reject(new Error("network error")),
          ontimeout: () => reject(new Error("request timeout")),
        });
      });
    }

    return fetch(url, { cache: "no-store", credentials: "omit" }).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.text();
    });
  }

  function extractVersionHint(code) {
    const match = String(code || "").match(/\/\/\s*@version\s+([^\n\r]+)/i);
    return match ? String(match[1] || "").trim() : "";
  }

  function isValidMainScriptCode(code) {
    const text = String(code || "");
    if (!text) {
      return false;
    }

    const checks = [
      /\/\/\s*==UserScript==/i,
      /\/\/\s*@name\s+Autodarts Tournament Assistant\b/i,
      /__ATA_RUNTIME_BOOTSTRAPPED/,
    ];

    return checks.every((pattern) => pattern.test(text));
  }

  function executeCode(code, sourceLabel) {
    const payload = `${String(code || "")}\n//# sourceURL=${sourceLabel}`;
    (0, eval)(payload);
  }

  async function executeWithCacheFallback() {
    if (window[RUNTIME_GUARD_KEY]) {
      log("Runtime already active, skipping loader execution.");
      return;
    }

    let remoteError = null;

    try {
      const remoteCode = await requestText(REMOTE_SOURCE_URL);
      if (!isValidMainScriptCode(remoteCode)) {
        throw new Error("remote validation failed");
      }

      const meta = {
        fetchedAt: new Date().toISOString(),
        sourceUrl: REMOTE_SOURCE_URL,
        versionHint: extractVersionHint(remoteCode),
      };

      await writeStore(CACHE_CODE_KEY, remoteCode);
      await writeStore(CACHE_META_KEY, meta);
      executeCode(remoteCode, "autodarts-tournament-assistant/remote/main.user.js");
      log(`Remote script loaded${meta.versionHint ? ` (v${meta.versionHint})` : ""}.`);
      return;
    } catch (loadError) {
      remoteError = loadError;
      warn("Remote load failed, trying cache fallback.", loadError);
    }

    const cachedCode = await readStore(CACHE_CODE_KEY, "");
    const cachedMeta = await readStore(CACHE_META_KEY, null);

    if (!isValidMainScriptCode(cachedCode)) {
      error("No valid cached script is available.", remoteError);
      return;
    }

    try {
      executeCode(cachedCode, "autodarts-tournament-assistant/cache/main.user.js");
      const cachedVersion = cachedMeta && typeof cachedMeta === "object"
        ? String(cachedMeta.versionHint || "").trim()
        : "";
      const cachedDate = cachedMeta && typeof cachedMeta === "object"
        ? String(cachedMeta.fetchedAt || "").trim()
        : "";
      const details = [cachedVersion ? `v${cachedVersion}` : "", cachedDate ? `from ${cachedDate}` : ""]
        .filter(Boolean)
        .join(", ");
      log(`Cache fallback loaded${details ? ` (${details})` : ""}.`);
    } catch (cacheError) {
      error("Failed to execute cached script.", cacheError);
    }
  }

  function getAnchorRoutePath(anchor) {
    if (!(anchor instanceof HTMLAnchorElement)) {
      return "";
    }

    const href = anchor.getAttribute("href");
    if (!href) {
      return "";
    }

    if (href.startsWith("/")) {
      return href.split("?")[0].split("#")[0];
    }

    try {
      const parsed = new URL(href, location.origin);
      if (parsed.origin !== location.origin) {
        return "";
      }
      return parsed.pathname;
    } catch (_) {
      return "";
    }
  }

  function isLikelySidebar(node) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    const anchors = Array.from(node.querySelectorAll("a[href]"));
    if (!anchors.length) {
      return false;
    }
    return anchors.some((anchor) => MENU_HINT_ROUTES.has(getAnchorRoutePath(anchor)));
  }

  function getSidebarElement() {
    const candidates = [
      document.querySelector("#root aside nav"),
      document.querySelector("#root aside"),
      document.querySelector("aside nav"),
      document.querySelector("aside"),
      document.querySelector("nav"),
    ];

    for (const candidate of candidates) {
      if (isLikelySidebar(candidate)) {
        return candidate;
      }
    }

    const anySidebar = Array.from(document.querySelectorAll("aside, nav")).find((node) => isLikelySidebar(node));
    return anySidebar || null;
  }

  function buildMenuIconElement(template) {
    if (template instanceof HTMLElement) {
      const icon = template.querySelector("svg, img, [data-icon], .icon");
      if (icon) {
        return icon.cloneNode(true);
      }
    }

    const fallback = document.createElement("span");
    fallback.textContent = "T";
    fallback.style.display = "inline-flex";
    fallback.style.alignItems = "center";
    fallback.style.justifyContent = "center";
    fallback.style.fontWeight = "700";
    fallback.style.width = "1.4em";
    fallback.style.height = "1.4em";
    return fallback;
  }

  function triggerTournamentDrawer() {
    try {
      if (window.__ATA_RUNTIME && typeof window.__ATA_RUNTIME.toggleDrawer === "function") {
        window.__ATA_RUNTIME.toggleDrawer();
        return;
      }
      window.dispatchEvent(new CustomEvent("ata:toggle-request"));
    } catch (eventError) {
      warn("Failed to trigger drawer toggle.", eventError);
    }
  }

  function ensureMenuButton() {
    const sidebar = getSidebarElement();
    if (!sidebar) {
      return;
    }

    const sidebarLinks = Array.from(sidebar.querySelectorAll("a[href]"));
    const boardsButton = sidebarLinks.find((link) => getAnchorRoutePath(link) === "/boards") || null;
    const insertionAnchor = boardsButton
      || sidebarLinks.find((link) => MENU_HINT_ROUTES.has(getAnchorRoutePath(link)))
      || null;

    let item = document.getElementById(MENU_ITEM_ID);
    if (!item) {
      const template = insertionAnchor || sidebar.querySelector("a[href], button, [role='button']") || sidebar.lastElementChild;
      item = template ? template.cloneNode(true) : document.createElement("button");
      item.id = MENU_ITEM_ID;
      const icon = buildMenuIconElement(template);
      const label = document.createElement("span");
      label.className = "ata-loader-menu-label";
      label.textContent = MENU_LABEL;
      item.replaceChildren(icon, label);

      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.setAttribute("aria-label", MENU_LABEL);
      item.setAttribute("title", MENU_LABEL);
      item.style.cursor = "pointer";

      if (item.tagName.toLowerCase() === "a") {
        item.removeAttribute("href");
      }
      if (item.tagName.toLowerCase() === "button") {
        item.setAttribute("type", "button");
      }
    }

    if (item.dataset.ataBound !== "1") {
      item.dataset.ataBound = "1";
      item.addEventListener("click", (event) => {
        event.preventDefault();
        triggerTournamentDrawer();
      });
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          triggerTournamentDrawer();
        }
      });
    }

    if (!item.isConnected) {
      if (insertionAnchor && insertionAnchor.parentElement === sidebar) {
        insertionAnchor.insertAdjacentElement("afterend", item);
      } else {
        sidebar.appendChild(item);
      }
    }
  }

  function queueDomSync() {
    if (rafQueued) {
      return;
    }
    rafQueued = true;
    requestAnimationFrame(() => {
      rafQueued = false;
      ensureMenuButton();
    });
  }

  function hasExternalDomMutation(mutations) {
    return mutations.some((mutation) => {
      if (!(mutation.target instanceof Element)) {
        return true;
      }
      if (mutation.target.closest(`#${MENU_ITEM_ID}`)) {
        const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
        return nodes.some((node) => !(node instanceof Element && node.closest(`#${MENU_ITEM_ID}`)));
      }
      return true;
    });
  }

  function startDomObserver() {
    const root = document.getElementById("root");
    if (!root) {
      if (domObserver) {
        domObserver.disconnect();
        domObserver = null;
      }
      observerRoot = null;
      return;
    }

    if (domObserver && observerRoot === root && root.isConnected) {
      return;
    }

    if (domObserver) {
      domObserver.disconnect();
      domObserver = null;
    }

    observerRoot = root;
    domObserver = new MutationObserver((mutations) => {
      if (hasExternalDomMutation(mutations)) {
        queueDomSync();
      }
    });

    domObserver.observe(root, {
      childList: true,
      subtree: true,
    });
  }

  function cleanup() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }

    if (domObserver) {
      domObserver.disconnect();
      domObserver = null;
    }

    observerRoot = null;
  }

  function initUiSyncLoop() {
    queueDomSync();
    startDomObserver();

    pollTimer = window.setInterval(() => {
      startDomObserver();
      if (!document.getElementById(MENU_ITEM_ID)) {
        queueDomSync();
      }
    }, 1000);

    window.addEventListener("pagehide", cleanup, { once: true });
    window.addEventListener("beforeunload", cleanup, { once: true });
  }

  executeWithCacheFallback().catch((unexpectedError) => {
    error("Unexpected loader failure.", unexpectedError);
  });

  initUiSyncLoop();
})();

