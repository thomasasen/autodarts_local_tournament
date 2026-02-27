// ==UserScript==
// @name         Autodarts Tournament Assistant Loader
// @namespace    https://github.com/thomasasen/autodarts_local_tournament
// @version      0.1.3
// @description  Loads the latest Autodarts Tournament Assistant userscript with cache fallback.
// @author       Thomas Asen
// @license      MIT
// @match        *://play.autodarts.io/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @connect      api.autodarts.io
// @downloadURL  https://github.com/thomasasen/autodarts_local_tournament/raw/refs/heads/main/installer/Autodarts%20Tournament%20Assistant%20Loader.user.js
// @updateURL    https://github.com/thomasasen/autodarts_local_tournament/raw/refs/heads/main/installer/Autodarts%20Tournament%20Assistant%20Loader.user.js
// ==/UserScript==

(function () {
  "use strict";

  const EXEC_GUARD_KEY = "__ATA_LOADER_BOOTSTRAPPED";
  const RUNTIME_GUARD_KEY = "__ATA_RUNTIME_BOOTSTRAPPED";
  const CACHE_CODE_KEY = "ata:loader:cache:code:v1";
  const CACHE_META_KEY = "ata:loader:cache:meta:v1";
  const REQUEST_TIMEOUT_MS = 10_000;

  const REMOTE_SOURCE_URL = "https://raw.githubusercontent.com/thomasasen/autodarts_local_tournament/main/dist/autodarts-tournament-assistant.user.js";

  const MENU_ITEM_ID = "ata-loader-menu-item";
  const MENU_LABEL = "xLokales Turnier";
  const TOGGLE_EVENT = "ata:toggle-request";
  const READY_EVENT = "ata:ready";
  const MENU_LABEL_COLLAPSE_WIDTH = 120;
  const MENU_HINT_ROUTE_PATHS = Object.freeze(["/lobbies", "/boards", "/matches", "/tournaments", "/statistics", "/plus", "/settings"]);
  const MENU_HINT_ROUTES = new Set(MENU_HINT_ROUTE_PATHS);
  const prefix = "[ATA Loader]";

  if (window[EXEC_GUARD_KEY]) {
    return;
  }
  window[EXEC_GUARD_KEY] = true;

  let domObserver = null;
  let observerRoot = null;
  let pollTimer = null;
  let rafQueued = false;
  let menuButton = null;
  let toggleOnReadyQueued = false;

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
      executeCode(remoteCode, "autodarts_local_tournament/remote/main.user.js");
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
      executeCode(cachedCode, "autodarts_local_tournament/cache/main.user.js");
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

  function normalizeRoutePath(pathValue) {
    let normalized = String(pathValue || "").trim().toLowerCase();
    if (!normalized) {
      return "";
    }

    if (!normalized.startsWith("/")) {
      normalized = `/${normalized}`;
    }

    normalized = normalized.replace(/\/{2,}/g, "/").replace(/[?#].*$/, "");
    if (normalized.length > 1) {
      normalized = normalized.replace(/\/+$/, "");
    }
    return normalized;
  }

  function toRoutePathname(hrefValue) {
    const rawHref = String(hrefValue || "").trim();
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:")) {
      return "";
    }

    try {
      const parsed = new URL(rawHref, window.location.origin);
      if (parsed.origin !== window.location.origin) {
        return "";
      }
      return normalizeRoutePath(parsed.pathname);
    } catch (_) {
      return normalizeRoutePath(rawHref);
    }
  }

  function getAnchorRoutePath(anchor) {
    if (!(anchor instanceof HTMLAnchorElement)) {
      return "";
    }
    return toRoutePathname(anchor.getAttribute("href"));
  }

  function isSidebarRouteHint(pathValue) {
    const path = normalizeRoutePath(pathValue);
    if (!path) {
      return false;
    }

    if (MENU_HINT_ROUTES.has(path)) {
      return true;
    }

    return MENU_HINT_ROUTE_PATHS.some((hint) => path.startsWith(`${hint}/`));
  }

  function scoreSidebarCandidate(candidate) {
    if (!(candidate instanceof Element)) {
      return -1;
    }

    const anchors = Array.from(candidate.querySelectorAll("a[href]"));
    const routeHintMatches = anchors.reduce((count, anchor) => {
      return count + (isSidebarRouteHint(getAnchorRoutePath(anchor)) ? 1 : 0);
    }, 0);

    let score = 0;
    const width = candidate.getBoundingClientRect().width;
    const text = (candidate.textContent || "").toLowerCase();

    if (candidate.classList.contains("navigation")) {
      score += 24;
    }
    if (candidate.matches("nav") || candidate.getAttribute("role") === "navigation") {
      score += 18;
    }
    if (text.includes("lobb") || text.includes("spiel") || text.includes("board") || text.includes("stat")) {
      score += 6;
    }

    score += routeHintMatches * 20;
    score += Math.min(anchors.length, 10);

    if (width > 0 && width < 520) {
      score += 8;
    } else if (width > 680) {
      score -= 16;
    }
    if (routeHintMatches === 0 && anchors.length < 2) {
      score -= 12;
    }

    return score;
  }

  function getSidebarElement() {
    const root = document.getElementById("root");
    if (!root) {
      return null;
    }

    const preferred = [
      document.querySelector("#root > div > div > .chakra-stack.navigation"),
      document.querySelector("#root .navigation"),
      document.querySelector("#root nav[aria-label]"),
      document.querySelector("#root nav"),
      document.querySelector("#root [role='navigation']"),
    ].find((candidate) => candidate && scoreSidebarCandidate(candidate) >= 32);
    if (preferred) {
      return preferred;
    }

    const candidates = new Set(document.querySelectorAll("#root .navigation, #root nav, #root [role='navigation'], #root .chakra-stack, #root .chakra-vstack"));
    Array.from(document.querySelectorAll("#root a[href]")).forEach((anchor) => {
      const container = anchor.closest(".navigation, nav, [role='navigation'], .chakra-stack, .chakra-vstack");
      if (container) {
        candidates.add(container);
      }
    });

    let best = null;
    let bestScore = -1;
    candidates.forEach((candidate) => {
      const score = scoreSidebarCandidate(candidate);
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    });

    if (bestScore < 20) {
      return null;
    }
    return best;
  }

  function buildMenuIconElement(template) {
    if (template instanceof HTMLElement) {
      const iconContainer = template.querySelector(".chakra-button__icon, [class*='button__icon']");
      if (iconContainer instanceof HTMLElement) {
        const cloned = iconContainer.cloneNode(false);
        cloned.textContent = "🏆";
        cloned.setAttribute("aria-hidden", "true");
        return cloned;
      }
    }

    const fallback = document.createElement("span");
    fallback.textContent = "🏆";
    fallback.style.display = "inline-flex";
    fallback.style.alignItems = "center";
    fallback.style.justifyContent = "center";
    fallback.style.fontWeight = "700";
    fallback.style.width = "1.4em";
    fallback.style.height = "1.4em";
    return fallback;
  }

  function queueToggleWhenReady() {
    if (toggleOnReadyQueued) {
      return;
    }

    toggleOnReadyQueued = true;
    window.addEventListener(READY_EVENT, () => {
      toggleOnReadyQueued = false;
      window.dispatchEvent(new CustomEvent(TOGGLE_EVENT));
    }, { once: true });
  }

  function triggerTournamentDrawer() {
    try {
      if (window.__ATA_RUNTIME && typeof window.__ATA_RUNTIME.toggleDrawer === "function") {
        window.__ATA_RUNTIME.toggleDrawer();
        return;
      }

      window.dispatchEvent(new CustomEvent(TOGGLE_EVENT));
      if (!(window.__ATA_RUNTIME && typeof window.__ATA_RUNTIME.toggleDrawer === "function")) {
        queueToggleWhenReady();
      }
    } catch (eventError) {
      warn("Failed to trigger drawer toggle.", eventError);
    }
  }

  function getSidebarInteractiveElements(sidebar) {
    if (!(sidebar instanceof Element)) {
      return [];
    }

    return Array.from(sidebar.querySelectorAll("a[href], button, [role='button'], [role='link']"))
      .filter((entry) => entry.id !== MENU_ITEM_ID);
  }

  function getElementRoutePath(element) {
    if (!element || !(element instanceof Element)) {
      return "";
    }

    if (element instanceof HTMLAnchorElement) {
      return getAnchorRoutePath(element);
    }

    const href = element.getAttribute("href")
      || element.getAttribute("to")
      || element.getAttribute("data-to")
      || "";
    return toRoutePathname(href);
  }

  function getElementTextLabel(element) {
    return String(element?.textContent || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function isBoardsElement(element) {
    const routePath = getElementRoutePath(element);
    if (routePath === "/boards" || routePath.startsWith("/boards/")) {
      return true;
    }

    const text = getElementTextLabel(element);
    return text.includes("meine boards") || text === "boards" || text.endsWith(" boards");
  }

  function isOnlineTournamentsElement(element) {
    const routePath = getElementRoutePath(element);
    if (routePath === "/tournaments" || routePath.startsWith("/tournaments/")) {
      return true;
    }

    const text = getElementTextLabel(element);
    return text.includes("online turniere") || text === "tournaments";
  }

  function isMenuHintElement(element) {
    const routePath = getElementRoutePath(element);
    if (isSidebarRouteHint(routePath)) {
      return true;
    }

    const text = getElementTextLabel(element);
    return text.includes("lobbies")
      || text.includes("spiele")
      || text.includes("turniere")
      || text.includes("spielhistorie")
      || text.includes("statistiken")
      || text.includes("boards");
  }

  function syncMenuLabelForWidth() {
    const button = menuButton || document.getElementById(MENU_ITEM_ID);
    const sidebar = getSidebarElement();
    if (!button || !sidebar) {
      return;
    }

    const label = button.querySelector(".ata-loader-menu-label");
    if (!label) {
      return;
    }

    const width = sidebar.getBoundingClientRect().width;
    label.style.display = width < MENU_LABEL_COLLAPSE_WIDTH ? "none" : "inline";
  }

  function ensureMenuButton() {
    const sidebar = getSidebarElement();
    if (!sidebar) {
      return;
    }

    const sidebarEntries = getSidebarInteractiveElements(sidebar);
    const onlineTournamentsButton = sidebarEntries.find((entry) => isOnlineTournamentsElement(entry)) || null;
    const boardsButton = sidebarEntries.find((entry) => isBoardsElement(entry)) || null;
    const insertionAnchor = onlineTournamentsButton
      || boardsButton
      || sidebarEntries.find((entry) => isMenuHintElement(entry))
      || null;

    let item = document.getElementById(MENU_ITEM_ID);
    if (!item) {
      const template = insertionAnchor || sidebarEntries[0] || sidebar.lastElementChild;
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

    if (insertionAnchor && insertionAnchor.isConnected) {
      if (insertionAnchor.nextElementSibling !== item) {
        insertionAnchor.insertAdjacentElement("afterend", item);
      }
    } else {
      const profileSection = Array.from(sidebar.children).find((child) => {
        return child !== item && (
          child.querySelector(".chakra-avatar")
          || child.querySelector("img[src]")
          || child.querySelector("button[aria-label='notifications']")
        );
      });

      if (profileSection) {
        if (profileSection.previousElementSibling !== item) {
          sidebar.insertBefore(item, profileSection);
        }
      } else if (item.parentElement !== sidebar) {
        sidebar.appendChild(item);
      }
    }

    menuButton = item;
    syncMenuLabelForWidth();
  }

  function queueDomSync() {
    if (rafQueued) {
      return;
    }
    rafQueued = true;
    requestAnimationFrame(() => {
      rafQueued = false;
      ensureMenuButton();
      syncMenuLabelForWidth();
    });
  }

  function isManagedNode(node) {
    if (!(node instanceof Node)) {
      return false;
    }
    const element = node instanceof Element ? node : node.parentElement;
    if (!element) {
      return false;
    }
    return Boolean(element.closest(`#${MENU_ITEM_ID}`));
  }

  function hasExternalDomMutation(mutations) {
    return mutations.some((mutation) => {
      if (!isManagedNode(mutation.target)) {
        return true;
      }

      const touchedNodes = [...mutation.addedNodes, ...mutation.removedNodes];
      return touchedNodes.some((node) => !isManagedNode(node));
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

    window.removeEventListener("resize", syncMenuLabelForWidth);

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
      } else {
        syncMenuLabelForWidth();
      }
    }, 1000);

    window.addEventListener("resize", syncMenuLabelForWidth, { passive: true });
    window.addEventListener("pagehide", cleanup, { once: true });
    window.addEventListener("beforeunload", cleanup, { once: true });
  }

  executeWithCacheFallback().catch((unexpectedError) => {
    error("Unexpected loader failure.", unexpectedError);
  });

  initUiSyncLoop();
})();
