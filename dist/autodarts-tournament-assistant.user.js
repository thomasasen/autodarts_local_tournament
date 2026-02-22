// ==UserScript==
// @name         Autodarts Tournament Assistant
// @namespace    https://github.com/thomasasen/autodarts_local_tournament
// @version      0.2.0
// @description  Local tournament manager for play.autodarts.io (KO, Liga, Gruppen + KO)
// @author       Thomas Asen
// @license      MIT
// @match        *://play.autodarts.io/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      cdn.jsdelivr.net
// @connect      api.autodarts.io
// @downloadURL  https://github.com/thomasasen/autodarts_local_tournament/raw/refs/heads/main/dist/autodarts-tournament-assistant.user.js
// @updateURL    https://github.com/thomasasen/autodarts_local_tournament/raw/refs/heads/main/dist/autodarts-tournament-assistant.user.js
// ==/UserScript==

(function () {
  "use strict";

  const RUNTIME_GUARD_KEY = "__ATA_RUNTIME_BOOTSTRAPPED";
  const RUNTIME_GLOBAL_KEY = "__ATA_RUNTIME";
  const APP_VERSION = "0.2.0";
  const STORAGE_KEY = "ata:tournament:v1";
  const STORAGE_SCHEMA_VERSION = 1;
  const SAVE_DEBOUNCE_MS = 150;
  const UI_HOST_ID = "ata-ui-host";
  const TOGGLE_EVENT = "ata:toggle-request";
  const READY_EVENT = "ata:ready";
  const API_PROVIDER = "api.autodarts.io";
  const API_GS_BASE = `https://${API_PROVIDER}/gs/v0`;
  const API_AS_BASE = `https://${API_PROVIDER}/as/v0`;
  const API_SYNC_INTERVAL_MS = 2500;
  const API_AUTH_NOTICE_THROTTLE_MS = 15000;
  const API_REQUEST_TIMEOUT_MS = 12000;

  const BRACKET_VIEWER_JS = "https://cdn.jsdelivr.net/npm/brackets-viewer@1.9.0/dist/brackets-viewer.min.js";
  const BRACKET_VIEWER_CSS = "https://cdn.jsdelivr.net/npm/brackets-viewer@1.9.0/dist/brackets-viewer.min.css";
  const I18NEXT_UMD_JS = "https://cdn.jsdelivr.net/npm/i18next@23.16.8/dist/umd/i18next.min.js";

  const STATUS_COMPLETED = "completed";
  const STATUS_PENDING = "pending";
  const MATCH_STAGE_KO = "ko";
  const MATCH_STAGE_GROUP = "group";
  const MATCH_STAGE_LEAGUE = "league";

  const TAB_IDS = Object.freeze(["tournament", "matches", "view", "io", "settings"]);
  const TAB_META = Object.freeze([
    { id: "tournament", label: "Turnier" },
    { id: "matches", label: "Spiele" },
    { id: "view", label: "Ansicht" },
    { id: "io", label: "Import/Export" },
    { id: "settings", label: "Einstellungen" },
  ]);

  const PLAYER_LIMIT_MIN = 2;
  const PLAYER_LIMIT_MAX = 8;
  const GROUP_MODE_MIN = 5;

  if (window[RUNTIME_GUARD_KEY]) {
    return;
  }
  window[RUNTIME_GUARD_KEY] = true;

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
    cleanupStack: [],
  };

  function createDefaultStore() {
    return {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      settings: {
        debug: false,
        featureFlags: {
          autoLobbyStart: false,
        },
      },
      ui: {
        activeTab: "tournament",
      },
      tournament: null,
    };
  }

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

  function addCleanup(fn) {
    state.cleanupStack.push(fn);
    return fn;
  }

  function addListener(target, eventName, handler, options) {
    target.addEventListener(eventName, handler, options);
    addCleanup(() => target.removeEventListener(eventName, handler, options));
  }

  function addInterval(handler, ms) {
    const handle = window.setInterval(handler, ms);
    addCleanup(() => clearInterval(handle));
    return handle;
  }

  function addObserver(observer) {
    addCleanup(() => observer.disconnect());
    return observer;
  }

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

  function sanitizeBestOf(value) {
    let bestOf = clampInt(value, 5, 1, 21);
    if (bestOf % 2 === 0) {
      bestOf += 1;
    }
    return bestOf;
  }

  function sanitizeStartScore(value) {
    const allowed = new Set([101, 201, 301, 501, 701]);
    const score = clampInt(value, 501, 101, 701);
    return allowed.has(score) ? score : 501;
  }

  function normalizeAutomationStatus(value, fallback = "idle") {
    return ["idle", "started", "completed", "error"].includes(value) ? value : fallback;
  }

  function normalizeAutomationMeta(rawAuto) {
    const auto = rawAuto && typeof rawAuto === "object" ? rawAuto : {};
    const lobbyId = normalizeText(auto.lobbyId || "");
    let status = normalizeAutomationStatus(normalizeText(auto.status || ""), lobbyId ? "started" : "idle");
    if (!lobbyId && status !== "error") {
      status = "idle";
    }
    return {
      provider: API_PROVIDER,
      lobbyId: lobbyId || null,
      status,
      startedAt: normalizeText(auto.startedAt || "") || null,
      finishedAt: normalizeText(auto.finishedAt || "") || null,
      lastSyncAt: normalizeText(auto.lastSyncAt || "") || null,
      lastError: normalizeText(auto.lastError || "") || null,
    };
  }

  function normalizeMatchMeta(rawMeta) {
    const meta = rawMeta && typeof rawMeta === "object" ? rawMeta : {};
    return {
      ...meta,
      auto: normalizeAutomationMeta(meta.auto),
    };
  }

  function ensureMatchAutoMeta(match) {
    if (!match || typeof match !== "object") {
      return normalizeAutomationMeta(null);
    }
    if (!match.meta || typeof match.meta !== "object") {
      match.meta = {};
    }
    match.meta.auto = normalizeAutomationMeta(match.meta.auto);
    return match.meta.auto;
  }

  function normalizeTournament(rawTournament) {
    if (!rawTournament || typeof rawTournament !== "object") {
      return null;
    }

    const mode = ["ko", "league", "groups_ko"].includes(rawTournament.mode) ? rawTournament.mode : "ko";
    const participantsRaw = Array.isArray(rawTournament.participants) ? rawTournament.participants : [];
    const participants = participantsRaw
      .map((entry, index) => {
        const name = normalizeText(entry?.name || entry || "");
        if (!name) {
          return null;
        }
        const id = normalizeText(entry?.id || `p-${index + 1}`);
        return { id, name };
      })
      .filter(Boolean)
      .slice(0, PLAYER_LIMIT_MAX);

    if (participants.length < PLAYER_LIMIT_MIN) {
      return null;
    }

    const groupsRaw = Array.isArray(rawTournament.groups) ? rawTournament.groups : [];
    const groups = groupsRaw.map((group, index) => ({
      id: normalizeText(group?.id || `G${index + 1}`),
      name: normalizeText(group?.name || `Gruppe ${index + 1}`),
      participantIds: Array.isArray(group?.participantIds)
        ? group.participantIds.map((id) => normalizeText(id)).filter(Boolean)
        : [],
    }));

    const matchesRaw = Array.isArray(rawTournament.matches) ? rawTournament.matches : [];
    const matches = matchesRaw.map((match, index) => ({
      id: normalizeText(match?.id || `match-${index + 1}`),
      stage: [MATCH_STAGE_KO, MATCH_STAGE_GROUP, MATCH_STAGE_LEAGUE].includes(match?.stage) ? match.stage : MATCH_STAGE_KO,
      round: clampInt(match?.round, 1, 1, 64),
      number: clampInt(match?.number, index + 1, 1, 256),
      groupId: match?.groupId ? normalizeText(match.groupId) : null,
      player1Id: match?.player1Id ? normalizeText(match.player1Id) : null,
      player2Id: match?.player2Id ? normalizeText(match.player2Id) : null,
      status: match?.status === STATUS_COMPLETED ? STATUS_COMPLETED : STATUS_PENDING,
      winnerId: match?.winnerId ? normalizeText(match.winnerId) : null,
      source: match?.source === "auto" || match?.source === "manual" ? match.source : null,
      legs: {
        p1: clampInt(match?.legs?.p1, 0, 0, 50),
        p2: clampInt(match?.legs?.p2, 0, 0, 50),
      },
      updatedAt: normalizeText(match?.updatedAt || nowIso()),
      meta: normalizeMatchMeta(match?.meta),
    }));

    return {
      id: normalizeText(rawTournament.id || uuid("tournament")),
      name: normalizeText(rawTournament.name || "Lokales Turnier"),
      mode,
      bestOfLegs: sanitizeBestOf(rawTournament.bestOfLegs),
      startScore: sanitizeStartScore(rawTournament.startScore),
      participants,
      groups,
      matches,
      createdAt: normalizeText(rawTournament.createdAt || nowIso()),
      updatedAt: normalizeText(rawTournament.updatedAt || nowIso()),
    };
  }

  function normalizeStoreShape(input) {
    const defaults = createDefaultStore();
    return {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      settings: {
        debug: Boolean(input?.settings?.debug),
        featureFlags: {
          autoLobbyStart: Boolean(input?.settings?.featureFlags?.autoLobbyStart),
        },
      },
      ui: {
        activeTab: TAB_IDS.includes(input?.ui?.activeTab) ? input.ui.activeTab : defaults.ui.activeTab,
      },
      tournament: normalizeTournament(input?.tournament),
    };
  }

  function migrateStorage(rawValue) {
    if (!rawValue || typeof rawValue !== "object") {
      return createDefaultStore();
    }

    const version = Number(rawValue.schemaVersion || 0);
    switch (version) {
      case 1:
        return normalizeStoreShape(rawValue);
      default:
        return createDefaultStore();
    }
  }

  async function loadPersistedStore() {
    const raw = await readStoreValue(STORAGE_KEY, createDefaultStore());
    state.store = migrateStorage(raw);
    state.activeTab = state.store.ui.activeTab;
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

  function participantById(tournament, participantId) {
    return tournament?.participants?.find((participant) => participant.id === participantId) || null;
  }

  function participantNameById(tournament, participantId) {
    if (!participantId) {
      return "TBD";
    }
    const participant = participantById(tournament, participantId);
    return participant ? participant.name : "TBD";
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

  function createMatch({
    id,
    stage,
    round,
    number,
    groupId = null,
    player1Id = null,
    player2Id = null,
    meta = {},
  }) {
    return {
      id,
      stage,
      round,
      number,
      groupId,
      player1Id,
      player2Id,
      status: STATUS_PENDING,
      winnerId: null,
      source: null,
      legs: { p1: 0, p2: 0 },
      updatedAt: nowIso(),
      meta: normalizeMatchMeta(meta),
    };
  }

  function createRoundRobinPairings(participantIds) {
    const ids = participantIds.slice();
    if (ids.length % 2 === 1) {
      ids.push(null);
    }

    const rounds = [];
    const total = ids.length;
    const roundsCount = total - 1;
    let rotation = ids.slice();

    for (let roundIndex = 0; roundIndex < roundsCount; roundIndex += 1) {
      const roundPairs = [];
      for (let i = 0; i < total / 2; i += 1) {
        const left = rotation[i];
        const right = rotation[total - 1 - i];
        if (left && right) {
          roundPairs.push([left, right]);
        }
      }
      rounds.push(roundPairs);

      const fixed = rotation[0];
      const rest = rotation.slice(1);
      rest.unshift(rest.pop());
      rotation = [fixed].concat(rest);
    }

    return rounds;
  }

  function buildLeagueMatches(participantIds) {
    const rounds = createRoundRobinPairings(participantIds);
    const matches = [];
    rounds.forEach((pairs, roundIndex) => {
      pairs.forEach((pair, pairIndex) => {
        matches.push(createMatch({
          id: `league-r${roundIndex + 1}-m${pairIndex + 1}`,
          stage: MATCH_STAGE_LEAGUE,
          round: roundIndex + 1,
          number: pairIndex + 1,
          player1Id: pair[0],
          player2Id: pair[1],
        }));
      });
    });
    return matches;
  }

  function buildKoMatches(participantIds) {
    const size = nextPowerOfTwo(participantIds.length);
    const seeded = participantIds.slice();
    while (seeded.length < size) {
      seeded.push(null);
    }

    const matches = [];
    const rounds = Math.log2(size);

    for (let round = 1; round <= rounds; round += 1) {
      const matchesInRound = size / (2 ** round);
      for (let number = 1; number <= matchesInRound; number += 1) {
        const idx = (number - 1) * 2;
        const player1Id = round === 1 ? seeded[idx] : null;
        const player2Id = round === 1 ? seeded[idx + 1] : null;
        matches.push(createMatch({
          id: `ko-r${round}-m${number}`,
          stage: MATCH_STAGE_KO,
          round,
          number,
          player1Id,
          player2Id,
        }));
      }
    }

    return matches;
  }

  function buildGroups(participantIds) {
    const groupA = [];
    const groupB = [];
    participantIds.forEach((participantId, index) => {
      if (index % 2 === 0) {
        groupA.push(participantId);
      } else {
        groupB.push(participantId);
      }
    });
    return [
      { id: "A", name: "Gruppe A", participantIds: groupA },
      { id: "B", name: "Gruppe B", participantIds: groupB },
    ];
  }

  function buildGroupMatches(groups) {
    const matches = [];
    groups.forEach((group) => {
      const rounds = createRoundRobinPairings(group.participantIds);
      rounds.forEach((pairs, roundIndex) => {
        pairs.forEach((pair, pairIndex) => {
          matches.push(createMatch({
            id: `group-${group.id}-r${roundIndex + 1}-m${pairIndex + 1}`,
            stage: MATCH_STAGE_GROUP,
            groupId: group.id,
            round: roundIndex + 1,
            number: pairIndex + 1,
            player1Id: pair[0],
            player2Id: pair[1],
          }));
        });
      });
    });
    return matches;
  }

  function buildGroupsKoMatches() {
    return [
      createMatch({
        id: "ko-r1-m1",
        stage: MATCH_STAGE_KO,
        round: 1,
        number: 1,
        meta: {
          from1: { type: "groupRank", groupId: "A", rank: 1 },
          from2: { type: "groupRank", groupId: "B", rank: 2 },
        },
      }),
      createMatch({
        id: "ko-r1-m2",
        stage: MATCH_STAGE_KO,
        round: 1,
        number: 2,
        meta: {
          from1: { type: "groupRank", groupId: "B", rank: 1 },
          from2: { type: "groupRank", groupId: "A", rank: 2 },
        },
      }),
      createMatch({
        id: "ko-r2-m1",
        stage: MATCH_STAGE_KO,
        round: 2,
        number: 1,
      }),
    ];
  }

  function validateCreateConfig(config) {
    const errors = [];

    if (!normalizeText(config.name)) {
      errors.push("Bitte einen Turniernamen eingeben.");
    }
    if (!["ko", "league", "groups_ko"].includes(config.mode)) {
      errors.push("Ungultiger Modus.");
    }
    if (config.participants.length < PLAYER_LIMIT_MIN || config.participants.length > PLAYER_LIMIT_MAX) {
      errors.push(`Teilnehmerzahl muss zwischen ${PLAYER_LIMIT_MIN} und ${PLAYER_LIMIT_MAX} liegen.`);
    }
    if (config.mode === "groups_ko" && config.participants.length < GROUP_MODE_MIN) {
      errors.push("Gruppenphase + KO benotigt mindestens 5 Teilnehmer.");
    }

    return errors;
  }

  function createTournament(config) {
    const participants = config.participants.slice(0, PLAYER_LIMIT_MAX);
    const participantIds = participants.map((participant) => participant.id);

    let groups = [];
    let matches = [];

    if (config.mode === "league") {
      matches = buildLeagueMatches(participantIds);
    } else if (config.mode === "groups_ko") {
      groups = buildGroups(participantIds);
      matches = buildGroupMatches(groups).concat(buildGroupsKoMatches());
    } else {
      matches = buildKoMatches(participantIds);
    }

    const tournament = {
      id: uuid("tournament"),
      name: normalizeText(config.name),
      mode: config.mode,
      bestOfLegs: sanitizeBestOf(config.bestOfLegs),
      startScore: sanitizeStartScore(config.startScore),
      participants,
      groups,
      matches,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    refreshDerivedMatches(tournament);
    return tournament;
  }

  function getMatchesByStage(tournament, stage) {
    return tournament.matches
      .filter((match) => match.stage === stage)
      .sort((left, right) => left.round - right.round || left.number - right.number);
  }

  function findMatch(tournament, matchId) {
    return tournament.matches.find((match) => match.id === matchId) || null;
  }

  function standingsForMatches(tournament, matches) {
    const rows = tournament.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      played: 0,
      wins: 0,
      losses: 0,
      legsFor: 0,
      legsAgainst: 0,
      legDiff: 0,
      points: 0,
      rank: 0,
    }));

    const rowById = new Map(rows.map((row) => [row.id, row]));

    matches.forEach((match) => {
      if (match.status !== STATUS_COMPLETED) {
        return;
      }
      if (!match.player1Id || !match.player2Id || !match.winnerId) {
        return;
      }

      const row1 = rowById.get(match.player1Id);
      const row2 = rowById.get(match.player2Id);
      if (!row1 || !row2) {
        return;
      }

      row1.played += 1;
      row2.played += 1;

      const p1Legs = clampInt(match.legs?.p1, 0, 0, 50);
      const p2Legs = clampInt(match.legs?.p2, 0, 0, 50);
      row1.legsFor += p1Legs;
      row1.legsAgainst += p2Legs;
      row2.legsFor += p2Legs;
      row2.legsAgainst += p1Legs;

      if (match.winnerId === match.player1Id) {
        row1.wins += 1;
        row2.losses += 1;
        row1.points += 2;
      } else if (match.winnerId === match.player2Id) {
        row2.wins += 1;
        row1.losses += 1;
        row2.points += 2;
      }
    });

    rows.forEach((row) => {
      row.legDiff = row.legsFor - row.legsAgainst;
    });

    rows.sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }
      if (right.legDiff !== left.legDiff) {
        return right.legDiff - left.legDiff;
      }
      if (right.legsFor !== left.legsFor) {
        return right.legsFor - left.legsFor;
      }
      return left.name.localeCompare(right.name, "de");
    });

    rows.forEach((row, index) => {
      row.rank = index + 1;
    });

    return rows;
  }

  function groupStandingsMap(tournament) {
    const map = new Map();
    (tournament.groups || []).forEach((group) => {
      const groupMatches = tournament.matches.filter((match) => match.stage === MATCH_STAGE_GROUP && match.groupId === group.id);
      const rows = standingsForMatches(tournament, groupMatches).filter((row) => group.participantIds.includes(row.id));
      map.set(group.id, {
        group,
        rows,
        complete: groupMatches.length > 0 && groupMatches.every((match) => match.status === STATUS_COMPLETED),
      });
    });
    return map;
  }

  function clearMatchResult(match) {
    match.status = STATUS_PENDING;
    match.winnerId = null;
    match.source = null;
    match.legs = { p1: 0, p2: 0 };
    const auto = ensureMatchAutoMeta(match);
    auto.lobbyId = null;
    auto.status = "idle";
    auto.startedAt = null;
    auto.finishedAt = null;
    auto.lastSyncAt = null;
    auto.lastError = null;
    match.updatedAt = nowIso();
  }

  function assignPlayerSlot(match, slot, participantId) {
    const field = slot === 1 ? "player1Id" : "player2Id";
    const currentValue = match[field] || null;
    const nextValue = participantId || null;
    if (currentValue === nextValue) {
      return false;
    }
    match[field] = nextValue;
    if (match.status === STATUS_COMPLETED) {
      const validWinner = match.winnerId && (match.winnerId === match.player1Id || match.winnerId === match.player2Id);
      if (!validWinner) {
        clearMatchResult(match);
      }
    }
    match.updatedAt = nowIso();
    return true;
  }

  function resolveGroupsToKoAssignments(tournament) {
    if (tournament.mode !== "groups_ko") {
      return false;
    }

    let changed = false;
    const standingMap = groupStandingsMap(tournament);
    const semifinals = getMatchesByStage(tournament, MATCH_STAGE_KO).filter((match) => match.round === 1);

    semifinals.forEach((match) => {
      const from1 = match.meta?.from1;
      const from2 = match.meta?.from2;
      if (!from1 || !from2) {
        return;
      }

      const group1 = standingMap.get(from1.groupId);
      const group2 = standingMap.get(from2.groupId);
      const p1 = group1 && group1.complete ? group1.rows[from1.rank - 1]?.id || null : null;
      const p2 = group2 && group2.complete ? group2.rows[from2.rank - 1]?.id || null : null;
      changed = assignPlayerSlot(match, 1, p1) || changed;
      changed = assignPlayerSlot(match, 2, p2) || changed;
    });

    return changed;
  }

  function findKoNextMatch(tournament, match) {
    const nextRound = match.round + 1;
    const nextNumber = Math.ceil(match.number / 2);
    return tournament.matches.find(
      (item) => item.stage === MATCH_STAGE_KO && item.round === nextRound && item.number === nextNumber,
    ) || null;
  }

  function advanceKoWinners(tournament) {
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    let changed = false;

    koMatches.forEach((match) => {
      if (match.status !== STATUS_COMPLETED || !match.winnerId) {
        return;
      }
      const nextMatch = findKoNextMatch(tournament, match);
      if (!nextMatch) {
        return;
      }
      if (match.number % 2 === 1) {
        changed = assignPlayerSlot(nextMatch, 1, match.winnerId) || changed;
      } else {
        changed = assignPlayerSlot(nextMatch, 2, match.winnerId) || changed;
      }
    });

    return changed;
  }

  function autoCompleteByes(tournament) {
    let changed = false;
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    koMatches.forEach((match) => {
      if (match.status !== STATUS_PENDING) {
        return;
      }
      const p1 = match.player1Id;
      const p2 = match.player2Id;
      if (p1 && !p2) {
        match.status = STATUS_COMPLETED;
        match.winnerId = p1;
        match.source = "auto";
        match.updatedAt = nowIso();
        changed = true;
      } else if (p2 && !p1) {
        match.status = STATUS_COMPLETED;
        match.winnerId = p2;
        match.source = "auto";
        match.updatedAt = nowIso();
        changed = true;
      }
    });
    return changed;
  }

  function refreshDerivedMatches(tournament) {
    if (!tournament) {
      return;
    }

    for (let i = 0; i < 8; i += 1) {
      let changed = false;
      changed = resolveGroupsToKoAssignments(tournament) || changed;
      changed = autoCompleteByes(tournament) || changed;
      changed = advanceKoWinners(tournament) || changed;
      if (!changed) {
        break;
      }
    }
  }

  function getOpenMatchByPlayers(tournament, player1Id, player2Id) {
    const key = new Set([player1Id, player2Id]);
    const candidates = tournament.matches.filter((match) => {
      if (match.status !== STATUS_PENDING) {
        return false;
      }
      if (!match.player1Id || !match.player2Id) {
        return false;
      }
      const set = new Set([match.player1Id, match.player2Id]);
      return key.size === set.size && [...key].every((id) => set.has(id));
    });
    return candidates.length === 1 ? candidates[0] : null;
  }

  function updateMatchResult(matchId, winnerId, legs, source) {
    const tournament = state.store.tournament;
    if (!tournament) {
      return { ok: false, message: "Kein aktives Turnier vorhanden." };
    }

    const match = findMatch(tournament, matchId);
    if (!match) {
      return { ok: false, message: "Match nicht gefunden." };
    }
    if (!match.player1Id || !match.player2Id) {
      return { ok: false, message: "Match hat noch keine zwei Teilnehmer." };
    }
    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      return { ok: false, message: "Gewinner passt nicht zum Match." };
    }

    const p1Legs = clampInt(legs?.p1, 0, 0, 50);
    const p2Legs = clampInt(legs?.p2, 0, 0, 50);

    match.status = STATUS_COMPLETED;
    match.winnerId = winnerId;
    match.source = source === "auto" ? "auto" : "manual";
    match.legs = { p1: p1Legs, p2: p2Legs };
    const now = nowIso();
    const auto = ensureMatchAutoMeta(match);
    if (source === "auto") {
      auto.status = "completed";
      auto.finishedAt = now;
      auto.lastSyncAt = now;
      auto.lastError = null;
    } else if (auto.lobbyId || auto.status === "started" || auto.status === "error") {
      auto.status = "completed";
      auto.finishedAt = now;
      auto.lastSyncAt = now;
      auto.lastError = null;
    }
    match.updatedAt = now;

    refreshDerivedMatches(tournament);
    tournament.updatedAt = now;
    schedulePersist();
    renderShell();
    return { ok: true };
  }

  function shouldShowAuthNotice() {
    const now = Date.now();
    if (now - state.apiAutomation.lastAuthNoticeAt < API_AUTH_NOTICE_THROTTLE_MS) {
      return false;
    }
    state.apiAutomation.lastAuthNoticeAt = now;
    return true;
  }

  function getAuthTokenFromCookie() {
    try {
      const value = `; ${document.cookie || ""}`;
      const parts = value.split("; Authorization=");
      if (parts.length !== 2) {
        return "";
      }
      let token = parts.pop().split(";").shift() || "";
      try {
        token = decodeURIComponent(token);
      } catch (_) {
        // Keep raw token if decoding fails.
      }
      token = String(token).trim().replace(/^Bearer\s+/i, "");
      return token;
    } catch (_) {
      return "";
    }
  }

  function getBoardId() {
    try {
      let boardId = localStorage.getItem("autodarts-board");
      if (!boardId) {
        return "";
      }
      try {
        const parsed = JSON.parse(boardId);
        if (typeof parsed === "string") {
          boardId = parsed;
        }
      } catch (_) {
        // Keep raw value when localStorage entry is not JSON encoded.
      }
      return normalizeText(String(boardId || "").replace(/^"+|"+$/g, ""));
    } catch (_) {
      return "";
    }
  }

  function createApiError(status, message, body) {
    const error = new Error(String(message || "API request failed."));
    error.status = Number(status || 0);
    error.body = body;
    return error;
  }

  function extractApiErrorMessage(status, body) {
    if (typeof body === "string" && normalizeText(body)) {
      return `HTTP ${status}: ${normalizeText(body)}`;
    }
    if (body && typeof body === "object") {
      const candidate = normalizeText(body.message || body.error || body.detail || body.title || "");
      if (candidate) {
        return `HTTP ${status}: ${candidate}`;
      }
    }
    return `HTTP ${status}`;
  }

  function parseJsonOrText(rawText) {
    const text = String(rawText || "");
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch (_) {
      return text;
    }
  }

  async function requestJsonViaGm(method, url, payload, headers) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method,
        url,
        timeout: API_REQUEST_TIMEOUT_MS,
        headers,
        data: payload ? JSON.stringify(payload) : undefined,
        onload: (response) => {
          const status = Number(response?.status || 0);
          const body = parseJsonOrText(response?.responseText || "");
          if (status >= 200 && status < 300) {
            resolve(body || {});
            return;
          }
          reject(createApiError(status, extractApiErrorMessage(status, body), body));
        },
        onerror: () => {
          reject(createApiError(0, "Netzwerkfehler bei API-Anfrage.", null));
        },
        ontimeout: () => {
          reject(createApiError(0, "API-Anfrage Timeout.", null));
        },
      });
    });
  }

  async function requestJsonViaFetch(method, url, payload, headers) {
    const response = await fetch(url, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
      cache: "no-store",
      credentials: "omit",
    });
    const text = await response.text();
    const body = parseJsonOrText(text);
    if (!response.ok) {
      throw createApiError(response.status, extractApiErrorMessage(response.status, body), body);
    }
    return body || {};
  }

  async function apiRequestJson(method, url, payload, token) {
    const headers = { Accept: "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (payload) {
      headers["Content-Type"] = "application/json";
    }

    if (typeof GM_xmlhttpRequest === "function") {
      try {
        return await requestJsonViaGm(method, url, payload, headers);
      } catch (error) {
        const status = Number(error?.status || 0);
        if (status > 0) {
          throw error;
        }
        logWarn("api", "GM_xmlhttpRequest failed, falling back to fetch().", error);
      }
    }

    return requestJsonViaFetch(method, url, payload, headers);
  }

  async function createLobby(payload, token) {
    return apiRequestJson("POST", `${API_GS_BASE}/lobbies`, payload, token);
  }

  async function addLobbyPlayer(lobbyId, name, boardId, token) {
    return apiRequestJson("POST", `${API_GS_BASE}/lobbies/${encodeURIComponent(lobbyId)}/players`, { name, boardId }, token);
  }

  async function startLobby(lobbyId, token) {
    return apiRequestJson("POST", `${API_GS_BASE}/lobbies/${encodeURIComponent(lobbyId)}/start`, null, token);
  }

  async function fetchMatchStats(lobbyId, token) {
    return apiRequestJson("GET", `${API_AS_BASE}/matches/${encodeURIComponent(lobbyId)}/stats`, null, token);
  }

  function getDuplicateParticipantNames(tournament) {
    const seen = new Map();
    const duplicates = [];
    (tournament?.participants || []).forEach((participant) => {
      const key = normalizeLookup(participant?.name || "");
      if (!key) {
        return;
      }
      if (seen.has(key)) {
        duplicates.push(participant.name);
        return;
      }
      seen.set(key, participant.name);
    });
    return duplicates;
  }

  function findActiveStartedMatch(tournament, excludeMatchId = "") {
    if (!tournament) {
      return null;
    }
    return tournament.matches.find((match) => {
      if (excludeMatchId && match.id === excludeMatchId) {
        return false;
      }
      if (match.status !== STATUS_PENDING) {
        return false;
      }
      const auto = ensureMatchAutoMeta(match);
      return Boolean(auto.lobbyId && auto.status === "started");
    }) || null;
  }

  function buildLobbyCreatePayload(tournament) {
    const legsToWin = Math.floor(sanitizeBestOf(tournament.bestOfLegs) / 2) + 1;
    return {
      variant: "X01",
      isPrivate: true,
      legs: legsToWin,
      settings: {
        baseScore: sanitizeStartScore(tournament.startScore),
        inMode: "Straight",
        outMode: "Double",
        bullMode: "25/50",
        maxRounds: 50,
        bullOffMode: "Normal",
      },
    };
  }

  function openMatchPage(lobbyId) {
    if (!normalizeText(lobbyId)) {
      return;
    }
    window.location.href = `${window.location.origin}/matches/${encodeURIComponent(lobbyId)}`;
  }

  function resolveWinnerIdFromApiName(tournament, match, winnerName) {
    const normalizedWinner = normalizeLookup(winnerName);
    if (!normalizedWinner || !match?.player1Id || !match?.player2Id) {
      return "";
    }

    const p1 = participantById(tournament, match.player1Id);
    const p2 = participantById(tournament, match.player2Id);
    const p1Name = normalizeLookup(p1?.name || "");
    const p2Name = normalizeLookup(p2?.name || "");
    if (!p1Name || !p2Name || p1Name === p2Name) {
      return "";
    }
    if (p1Name === normalizedWinner) {
      return match.player1Id;
    }
    if (p2Name === normalizedWinner) {
      return match.player2Id;
    }
    return "";
  }

  function getApiMatchLegsFromStats(data) {
    return {
      p1: clampInt(data?.matchStats?.[0]?.legsWon, 0, 0, 50),
      p2: clampInt(data?.matchStats?.[1]?.legsWon, 0, 0, 50),
    };
  }

  function getApiMatchStartUi(match, activeStartedMatch) {
    const auto = ensureMatchAutoMeta(match);
    if (auto.lobbyId) {
      return {
        label: "Zum Match",
        disabled: false,
        title: "Oeffnet das bereits gestartete Match.",
      };
    }

    if (!state.store.settings.featureFlags.autoLobbyStart) {
      return {
        label: "Match starten",
        disabled: true,
        title: "Feature-Flag in Einstellungen aktivieren.",
      };
    }

    if (match.status !== STATUS_PENDING) {
      return {
        label: "Match starten",
        disabled: true,
        title: "Match ist bereits abgeschlossen.",
      };
    }

    if (!match.player1Id || !match.player2Id) {
      return {
        label: "Match starten",
        disabled: true,
        title: "Match ist noch nicht vollstaendig gesetzt.",
      };
    }

    if (activeStartedMatch && activeStartedMatch.id !== match.id) {
      return {
        label: "Match starten",
        disabled: true,
        title: "Es laeuft bereits ein aktives Match.",
      };
    }

    if (state.apiAutomation.startingMatchId && state.apiAutomation.startingMatchId !== match.id) {
      return {
        label: "Match starten",
        disabled: true,
        title: "Ein anderer Matchstart laeuft bereits.",
      };
    }

    if (state.apiAutomation.startingMatchId === match.id) {
      return {
        label: "Startet...",
        disabled: true,
        title: "Lobby wird erstellt.",
      };
    }

    return {
      label: "Match starten",
      disabled: false,
      title: "Erstellt Lobby, fuegt Spieler hinzu und startet automatisch.",
    };
  }

  function getApiMatchStatusText(match) {
    const auto = ensureMatchAutoMeta(match);
    if (auto.status === "completed") {
      return "API-Sync: abgeschlossen";
    }
    if (auto.status === "started" && auto.lobbyId) {
      return `API-Sync: aktiv (Lobby ${auto.lobbyId})`;
    }
    if (auto.status === "error") {
      return `API-Sync: Fehler${auto.lastError ? ` (${auto.lastError})` : ""}`;
    }
    return "API-Sync: nicht gestartet";
  }

  async function handleStartMatch(matchId) {
    const tournament = state.store.tournament;
    if (!tournament) {
      return;
    }

    const match = findMatch(tournament, matchId);
    if (!match) {
      setNotice("error", "Match nicht gefunden.");
      return;
    }

    const auto = ensureMatchAutoMeta(match);
    if (auto.lobbyId) {
      openMatchPage(auto.lobbyId);
      return;
    }

    if (!state.store.settings.featureFlags.autoLobbyStart) {
      setNotice("info", "Auto-Lobby ist deaktiviert. Bitte im Tab Einstellungen aktivieren.");
      return;
    }

    if (match.status !== STATUS_PENDING || !match.player1Id || !match.player2Id) {
      setNotice("error", "Match kann aktuell nicht gestartet werden.");
      return;
    }

    const duplicates = getDuplicateParticipantNames(tournament);
    if (duplicates.length) {
      setNotice("error", "Fuer Auto-Sync muessen Teilnehmernamen eindeutig sein.");
      return;
    }

    const activeMatch = findActiveStartedMatch(tournament, match.id);
    if (activeMatch) {
      const activeAuto = ensureMatchAutoMeta(activeMatch);
      setNotice("info", "Es laeuft bereits ein aktives Match. Weiterleitung dorthin.");
      if (activeAuto.lobbyId) {
        openMatchPage(activeAuto.lobbyId);
      }
      return;
    }

    const token = getAuthTokenFromCookie();
    if (!token) {
      setNotice("error", "Kein Autodarts-Token gefunden. Bitte einloggen und Seite neu laden.");
      return;
    }

    const boardId = getBoardId();
    if (!boardId) {
      setNotice("error", "Board-ID fehlt. Bitte einmal manuell eine Lobby oeffnen und Board auswaehlen.");
      return;
    }

    const participant1 = participantById(tournament, match.player1Id);
    const participant2 = participantById(tournament, match.player2Id);
    if (!participant1 || !participant2) {
      setNotice("error", "Teilnehmerzuordnung im Match ist unvollstaendig.");
      return;
    }

    let createdLobbyId = "";
    state.apiAutomation.startingMatchId = match.id;
    renderShell();

    try {
      const lobby = await createLobby(buildLobbyCreatePayload(tournament), token);
      createdLobbyId = normalizeText(lobby?.id || lobby?.uuid || "");
      if (!createdLobbyId) {
        throw createApiError(0, "Lobby konnte nicht erstellt werden (keine Lobby-ID).", lobby);
      }

      await addLobbyPlayer(createdLobbyId, participant1.name, boardId, token);
      await addLobbyPlayer(createdLobbyId, participant2.name, boardId, token);
      await startLobby(createdLobbyId, token);

      const now = nowIso();
      auto.provider = API_PROVIDER;
      auto.lobbyId = createdLobbyId;
      auto.status = "started";
      auto.startedAt = auto.startedAt || now;
      auto.finishedAt = null;
      auto.lastSyncAt = now;
      auto.lastError = null;
      match.updatedAt = now;
      tournament.updatedAt = now;

      schedulePersist();
      renderShell();
      setNotice("success", "Match gestartet. Weiterleitung ins Match.");
      openMatchPage(createdLobbyId);
    } catch (error) {
      const message = normalizeText(error?.message || "Unbekannter API-Fehler.") || "Unbekannter API-Fehler.";
      const now = nowIso();
      auto.provider = API_PROVIDER;
      auto.lobbyId = createdLobbyId || auto.lobbyId || null;
      auto.status = "error";
      auto.lastError = message;
      auto.lastSyncAt = now;
      match.updatedAt = now;
      tournament.updatedAt = now;
      schedulePersist();
      renderShell();
      setNotice("error", `Matchstart fehlgeschlagen: ${message}`);
      logWarn("api", "Match start failed.", error);
    } finally {
      state.apiAutomation.startingMatchId = "";
      renderShell();
    }
  }

  async function syncPendingApiMatches() {
    if (state.apiAutomation.syncing) {
      return;
    }
    if (!state.store.settings.featureFlags.autoLobbyStart) {
      return;
    }
    if (Date.now() < state.apiAutomation.authBackoffUntil) {
      return;
    }

    const tournament = state.store.tournament;
    if (!tournament) {
      return;
    }

    const syncTargets = tournament.matches.filter((match) => {
      if (match.status !== STATUS_PENDING) {
        return false;
      }
      const auto = ensureMatchAutoMeta(match);
      return Boolean(auto.lobbyId && auto.status === "started");
    });

    if (!syncTargets.length) {
      return;
    }

    const token = getAuthTokenFromCookie();
    if (!token) {
      state.apiAutomation.authBackoffUntil = Date.now() + API_AUTH_NOTICE_THROTTLE_MS;
      if (shouldShowAuthNotice()) {
        setNotice("error", "Auto-Sync pausiert: kein Auth-Token gefunden. Bitte neu einloggen.");
      }
      return;
    }

    state.apiAutomation.syncing = true;
    let hasMetaUpdates = false;

    try {
      for (const match of syncTargets) {
        const auto = ensureMatchAutoMeta(match);
        if (!auto.lobbyId) {
          continue;
        }

        try {
          const stats = await fetchMatchStats(auto.lobbyId, token);
          if (auto.lastError) {
            auto.lastSyncAt = nowIso();
            auto.lastError = null;
            hasMetaUpdates = true;
          }

          const winnerIndex = Number(stats?.winner);
          if (!Number.isInteger(winnerIndex) || winnerIndex < 0) {
            continue;
          }

          const winnerName = normalizeText(stats?.players?.[winnerIndex]?.name || "");
          const winnerId = resolveWinnerIdFromApiName(tournament, match, winnerName);
          if (!winnerId) {
            auto.status = "error";
            auto.lastError = "Gewinner konnte nicht eindeutig zugeordnet werden.";
            match.updatedAt = nowIso();
            hasMetaUpdates = true;
            setNotice("error", `Auto-Sync Fehler bei ${match.id}: Gewinner nicht zuordenbar.`);
            continue;
          }

          const legs = getApiMatchLegsFromStats(stats);
          const result = updateMatchResult(match.id, winnerId, legs, "auto");
          if (!result.ok) {
            auto.lastError = result.message || "Auto-Sync konnte Ergebnis nicht speichern.";
            match.updatedAt = nowIso();
            hasMetaUpdates = true;
            continue;
          }

          const updatedMatch = findMatch(tournament, match.id);
          if (updatedMatch) {
            const updatedAuto = ensureMatchAutoMeta(updatedMatch);
            updatedAuto.provider = API_PROVIDER;
            updatedAuto.status = "completed";
            updatedAuto.finishedAt = nowIso();
            updatedAuto.lastSyncAt = nowIso();
            updatedAuto.lastError = null;
            updatedMatch.updatedAt = nowIso();
            hasMetaUpdates = true;
          }
        } catch (error) {
          const status = Number(error?.status || 0);
          if (status === 401 || status === 403) {
            state.apiAutomation.authBackoffUntil = Date.now() + API_AUTH_NOTICE_THROTTLE_MS;
            if (shouldShowAuthNotice()) {
              setNotice("error", "Auto-Sync pausiert: Auth abgelaufen. Bitte neu einloggen.");
            }
            logWarn("api", "Auto-sync auth error.", error);
            return;
          }
          if (status === 404) {
            continue;
          }
          const errorMessage = normalizeText(error?.message || "API-Sync fehlgeschlagen.") || "API-Sync fehlgeschlagen.";
          const lastSyncAtMs = auto.lastSyncAt ? Date.parse(auto.lastSyncAt) : 0;
          const shouldPersistError = auto.lastError !== errorMessage || !Number.isFinite(lastSyncAtMs) || (Date.now() - lastSyncAtMs > API_AUTH_NOTICE_THROTTLE_MS);
          if (shouldPersistError) {
            auto.lastError = errorMessage;
            auto.lastSyncAt = nowIso();
            match.updatedAt = nowIso();
            hasMetaUpdates = true;
          }
          logWarn("api", `Auto-sync failed for ${match.id}.`, error);
        }
      }
    } finally {
      state.apiAutomation.syncing = false;
      if (hasMetaUpdates) {
        if (state.store.tournament) {
          state.store.tournament.updatedAt = nowIso();
        }
        schedulePersist();
        renderShell();
      }
    }
  }

  function buildStyles() {
    return `
      :host {
        --ata-space-1: 4px;
        --ata-space-2: 8px;
        --ata-space-3: 12px;
        --ata-space-4: 16px;
        --ata-space-5: 20px;
        --ata-space-6: 24px;
        --ata-radius-sm: 6px;
        --ata-radius-md: 10px;
        --ata-radius-lg: 16px;
        --ata-shadow-lg: 0 18px 52px rgba(3, 8, 23, 0.52);
        --ata-font-body: "Open Sans", "Segoe UI", Tahoma, sans-serif;
        --ata-font-head: "Audiowide", "Open Sans", "Segoe UI", Tahoma, sans-serif;
        --ata-color-bg: #162d56;
        --ata-color-bg-panel: #2c326d;
        --ata-color-bg-panel-2: #1f3f71;
        --ata-color-bg-soft: rgba(255, 255, 255, 0.1);
        --ata-color-text: #f4f7ff;
        --ata-color-muted: rgba(232, 237, 255, 0.74);
        --ata-color-border: rgba(255, 255, 255, 0.2);
        --ata-color-accent: #5ad299;
        --ata-color-danger: #fc8181;
        --ata-color-focus: #ffd34f;
        --ata-z-overlay: 2147483000;
        color: var(--ata-color-text);
        font-family: var(--ata-font-body);
        font-size: 14px;
        line-height: 1.4;
        color-scheme: dark;
      }

      .ata-root {
        position: fixed;
        inset: 0;
        z-index: var(--ata-z-overlay);
        pointer-events: none;
      }

      .ata-overlay {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 15% 12%, rgba(114, 121, 224, 0.22), transparent 50%),
          radial-gradient(circle at 78% 8%, rgba(90, 210, 153, 0.12), transparent 48%),
          linear-gradient(120deg, rgba(7, 11, 25, 0.54), rgba(7, 11, 25, 0.76));
        opacity: 0;
        transition: opacity 180ms ease;
      }

      .ata-drawer {
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        width: min(760px, 94vw);
        display: grid;
        grid-template-rows: auto auto 1fr;
        transform: translateX(100%);
        transition: transform 220ms ease;
        background: linear-gradient(180deg, var(--ata-color-bg-panel), var(--ata-color-bg-panel-2) 42%, var(--ata-color-bg));
        box-shadow: var(--ata-shadow-lg);
        border-left: 1px solid var(--ata-color-border);
        pointer-events: auto;
      }

      .ata-root[data-open="1"] {
        pointer-events: auto;
      }

      .ata-root[data-open="1"] .ata-overlay {
        opacity: 1;
      }

      .ata-root[data-open="1"] .ata-drawer {
        transform: translateX(0);
      }

      .ata-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--ata-space-4);
        padding: var(--ata-space-5);
        border-bottom: 1px solid var(--ata-color-border);
        background: rgba(255, 255, 255, 0.03);
      }

      .ata-title-wrap h2 {
        margin: 0;
        font-family: var(--ata-font-head);
        letter-spacing: 0.6px;
        font-size: 28px;
        line-height: 1;
        text-transform: uppercase;
      }

      .ata-title-wrap p {
        margin: var(--ata-space-2) 0 0 0;
        color: var(--ata-color-muted);
      }

      .ata-version {
        color: #ffd34f;
      }

      .ata-close-btn {
        border: 1px solid var(--ata-color-border);
        background: rgba(255, 255, 255, 0.12);
        color: var(--ata-color-text);
        border-radius: var(--ata-radius-sm);
        padding: var(--ata-space-2) var(--ata-space-3);
        cursor: pointer;
        transition: background 120ms ease, border-color 120ms ease;
      }

      .ata-close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.36);
      }

      .ata-tabs {
        display: flex;
        gap: var(--ata-space-2);
        overflow-x: auto;
        padding: var(--ata-space-3) var(--ata-space-5);
        border-bottom: 1px solid var(--ata-color-border);
        background: rgba(255, 255, 255, 0.02);
      }

      .ata-tab {
        border: 1px solid var(--ata-color-border);
        background: rgba(255, 255, 255, 0.06);
        color: var(--ata-color-text);
        border-radius: 999px;
        padding: 7px 14px;
        cursor: pointer;
        white-space: nowrap;
        transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
      }

      .ata-tab:hover {
        background: rgba(255, 255, 255, 0.16);
        border-color: rgba(255, 255, 255, 0.34);
      }

      .ata-tab[data-active="1"] {
        background: #fff;
        border-color: #fff;
        color: #1e2d56;
        font-weight: 700;
      }

      .ata-content {
        overflow: auto;
        padding: var(--ata-space-5);
      }

      .ata-content::-webkit-scrollbar {
        width: 10px;
      }

      .ata-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.24);
        border-radius: 999px;
      }

      .ata-notice {
        margin-bottom: var(--ata-space-4);
        padding: var(--ata-space-3) var(--ata-space-4);
        border-radius: var(--ata-radius-md);
        border: 1px solid transparent;
      }

      .ata-notice-info {
        background: rgba(114, 121, 224, 0.18);
        border-color: rgba(153, 160, 245, 0.36);
      }

      .ata-notice-error {
        background: rgba(252, 129, 129, 0.18);
        border-color: rgba(252, 129, 129, 0.36);
      }

      .ata-notice-success {
        background: rgba(90, 210, 153, 0.18);
        border-color: rgba(90, 210, 153, 0.38);
      }

      .ata-card,
      .tournamentCard {
        border: 1px solid var(--ata-color-border);
        background: rgba(255, 255, 255, 0.08);
        border-radius: var(--ata-radius-lg);
        padding: var(--ata-space-4);
        margin-bottom: var(--ata-space-4);
        transition: background 150ms ease, border-color 150ms ease;
      }

      .ata-card:hover,
      .tournamentCard:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.34);
      }

      .ata-card h3 {
        margin: 0 0 var(--ata-space-3) 0;
        font-size: 18px;
        font-family: var(--ata-font-body);
        font-weight: 700;
      }

      .ata-grid-2 {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--ata-space-3);
      }

      .ata-field {
        display: grid;
        gap: var(--ata-space-1);
      }

      .ata-field label {
        color: var(--ata-color-muted);
        font-size: 12px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }

      .ata-field input,
      .ata-field select,
      .ata-field textarea {
        width: 100%;
        border-radius: var(--ata-radius-sm);
        border: 1px solid var(--ata-color-border);
        background: rgba(255, 255, 255, 0.1);
        color: var(--ata-color-text);
        padding: 9px 10px;
        box-sizing: border-box;
        transition: border-color 120ms ease, box-shadow 120ms ease, background 120ms ease;
      }

      .ata-field input:focus,
      .ata-field select:focus,
      .ata-field textarea:focus {
        outline: none;
        border-color: var(--ata-color-focus);
        box-shadow: 0 0 0 2px rgba(255, 211, 79, 0.26);
        background: rgba(255, 255, 255, 0.14);
      }

      .ata-field textarea {
        min-height: 130px;
        resize: vertical;
      }

      .ata-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ata-space-2);
      }

      .ata-btn {
        border: 1px solid var(--ata-color-border);
        background: rgba(255, 255, 255, 0.12);
        color: var(--ata-color-text);
        border-radius: var(--ata-radius-sm);
        padding: 9px 12px;
        cursor: pointer;
        transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
      }

      .ata-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.36);
      }

      .ata-btn:active {
        transform: translateY(1px);
      }

      .ata-btn[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .ata-btn-primary {
        background: var(--ata-color-accent);
        color: #071611;
        border-color: var(--ata-color-accent);
        font-weight: 700;
      }

      .ata-btn-primary:hover {
        background: #77dfae;
        border-color: #77dfae;
      }

      .ata-btn-danger {
        border-color: rgba(252, 129, 129, 0.55);
        background: rgba(252, 129, 129, 0.2);
      }

      .ata-pill {
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--ata-color-border);
        border-radius: 999px;
        padding: 3px 10px;
        margin-right: 8px;
        margin-bottom: 8px;
        font-size: 12px;
      }

      .ata-table-wrap {
        overflow-x: auto;
        border: 1px solid var(--ata-color-border);
        border-radius: var(--ata-radius-md);
        background: rgba(255, 255, 255, 0.04);
      }

      table.ata-table,
      table.tournamentRanking {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }

      .ata-table th,
      .ata-table td {
        text-align: left;
        border-bottom: 1px solid rgba(157, 180, 197, 0.16);
        padding: 8px 10px;
        vertical-align: middle;
      }

      .ata-table th {
        color: var(--ata-color-muted);
        font-weight: 600;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.4px;
      }

      .ata-table tbody tr:nth-of-type(odd) {
        background: #ffffff0d;
      }

      .ata-table tbody tr:hover {
        background: #ffd9262b;
      }

      .ata-score-grid {
        display: grid;
        grid-template-columns: minmax(150px, 1fr) 78px 78px auto auto;
        gap: var(--ata-space-2);
        min-width: 420px;
        align-items: center;
      }

      .ata-score-grid .ata-small {
        grid-column: 1 / -1;
      }

      .ata-small {
        font-size: 12px;
        color: var(--ata-color-muted);
      }

      .ata-group-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: var(--ata-space-3);
      }

      .ata-bracket-shell {
        border: 1px solid var(--ata-color-border);
        border-radius: var(--ata-radius-md);
        overflow: hidden;
        background: rgba(255, 255, 255, 0.04);
      }

      .ata-bracket-frame {
        width: 100%;
        min-height: 420px;
        border: 0;
        background: #fff;
      }

      .ata-bracket-fallback {
        padding: var(--ata-space-3);
        background: rgba(255, 255, 255, 0.05);
        border-top: 1px solid var(--ata-color-border);
      }

      .ata-bracket-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--ata-space-2);
      }

      .ata-bracket-round {
        border: 1px solid var(--ata-color-border);
        border-radius: var(--ata-radius-sm);
        padding: var(--ata-space-2);
      }

      .ata-bracket-match {
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 6px;
        margin-top: 8px;
        background: #ffffff0d;
      }

      .ata-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--ata-space-3);
        border: 1px solid var(--ata-color-border);
        border-radius: var(--ata-radius-sm);
        padding: 10px 12px;
        margin-bottom: var(--ata-space-2);
        background: rgba(255, 255, 255, 0.06);
      }

      .ata-toggle input {
        width: 18px;
        height: 18px;
        accent-color: var(--ata-color-accent);
      }

      @media (max-width: 820px) {
        .ata-grid-2 {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  function buildShellHtml() {
    const tabs = TAB_META.map((tab) => `
      <button type="button" class="ata-tab" data-tab="${tab.id}" data-active="${state.activeTab === tab.id ? "1" : "0"}">
        ${escapeHtml(tab.label)}
      </button>
    `).join("");

    const noticeHtml = state.notice.message
      ? `<div class="ata-notice ata-notice-${escapeHtml(state.notice.type)}">${escapeHtml(state.notice.message)}</div>`
      : "";

    return `
      <style>${buildStyles()}</style>
      <div class="ata-root" data-open="${state.drawerOpen ? "1" : "0"}">
        <div class="ata-overlay" data-action="close-drawer"></div>
        <aside class="ata-drawer" role="dialog" aria-modal="true" aria-label="Autodarts Tournament Assistant" tabindex="-1">
          <header class="ata-header">
            <div class="ata-title-wrap">
              <h2>Turnier Assistent</h2>
              <p>Lokales Management fur KO, Liga und Gruppenphase <span class="ata-version">v${escapeHtml(APP_VERSION)}</span></p>
            </div>
            <button type="button" class="ata-close-btn" data-action="close-drawer" aria-label="Schliessen">Schliessen</button>
          </header>
          <nav class="ata-tabs">${tabs}</nav>
          <main class="ata-content" data-role="content">${noticeHtml}${renderActiveTab()}</main>
        </aside>
      </div>
    `;
  }

  function renderActiveTab() {
    switch (state.activeTab) {
      case "matches":
        return renderMatchesTab();
      case "view":
        return renderViewTab();
      case "io":
        return renderIOTab();
      case "settings":
        return renderSettingsTab();
      case "tournament":
      default:
        return renderTournamentTab();
    }
  }

  function renderTournamentTab() {
    const tournament = state.store.tournament;
    if (!tournament) {
      return `
        <section class="ata-card tournamentCard">
          <h3>Neues Turnier erstellen</h3>
          <form id="ata-create-form">
            <div class="ata-grid-2">
              <div class="ata-field">
                <label for="ata-name">Turniername</label>
                <input id="ata-name" name="name" type="text" placeholder="z. B. Freitagsturnier" required>
              </div>
              <div class="ata-field">
                <label for="ata-mode">Modus</label>
                <select id="ata-mode" name="mode">
                  <option value="ko">KO</option>
                  <option value="league">Liga</option>
                  <option value="groups_ko">Gruppenphase + KO</option>
                </select>
              </div>
              <div class="ata-field">
                <label for="ata-bestof">Best-of Legs</label>
                <input id="ata-bestof" name="bestOfLegs" type="number" min="1" max="21" step="2" value="5">
              </div>
              <div class="ata-field">
                <label for="ata-startscore">Startscore</label>
                <select id="ata-startscore" name="startScore">
                  <option value="101">101</option>
                  <option value="201">201</option>
                  <option value="301">301</option>
                  <option value="501" selected>501</option>
                  <option value="701">701</option>
                </select>
              </div>
            </div>
            <div class="ata-field" style="margin-top: 12px;">
              <label for="ata-participants">Teilnehmer (eine Zeile pro Person)</label>
              <textarea id="ata-participants" name="participants" placeholder="Max Mustermann&#10;Erika Musterfrau"></textarea>
            </div>
            <div class="ata-actions" style="margin-top: 14px;">
              <button type="submit" class="ata-btn ata-btn-primary">Turnier anlegen</button>
            </div>
            <p class="ata-small" style="margin-top: 10px;">Limit: 2-8 Teilnehmer. Gruppen + KO ab 5 Teilnehmern.</p>
          </form>
        </section>
      `;
    }

    const modeLabel = tournament.mode === "ko"
      ? "KO"
      : tournament.mode === "league"
        ? "Liga"
        : "Gruppenphase + KO";

    const participantsHtml = tournament.participants.map((participant) => (
      `<span class="ata-pill">${escapeHtml(participant.name)}</span>`
    )).join("");

    return `
      <section class="ata-card tournamentCard">
        <h3>Aktives Turnier</h3>
        <p><b>${escapeHtml(tournament.name)}</b> (${escapeHtml(modeLabel)})</p>
        <p class="ata-small">Best-of ${tournament.bestOfLegs} Legs, Startscore ${tournament.startScore}</p>
        <div>${participantsHtml}</div>
      </section>
      <section class="ata-card tournamentCard">
        <h3>Turnier zurucksetzen</h3>
        <p class="ata-small">Dieser Schritt loescht alle Spielstaende. Bitte vorher exportieren.</p>
        <div class="ata-actions">
          <button type="button" class="ata-btn ata-btn-danger" data-action="reset-tournament">Turnier loeschen</button>
        </div>
      </section>
    `;
  }

  function renderMatchesTab() {
    const tournament = state.store.tournament;
    if (!tournament) {
      return `<section class="ata-card tournamentCard"><h3>Keine Turnierdaten</h3><p>Bitte zuerst ein Turnier erstellen.</p></section>`;
    }

    const activeStartedMatch = findActiveStartedMatch(tournament);

    const matches = tournament.matches.slice().sort((left, right) => {
      const stageOrder = { group: 1, league: 2, ko: 3 };
      const leftOrder = stageOrder[left.stage] || 99;
      const rightOrder = stageOrder[right.stage] || 99;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      return left.round - right.round || left.number - right.number;
    });

    const rows = matches.map((match) => {
      const player1 = participantNameById(tournament, match.player1Id);
      const player2 = participantNameById(tournament, match.player2Id);
      const winner = participantNameById(tournament, match.winnerId);
      const editable = Boolean(match.player1Id && match.player2Id);
      const stageLabel = match.stage === MATCH_STAGE_GROUP
        ? `Gruppe ${match.groupId || "?"}`
        : match.stage === MATCH_STAGE_LEAGUE
          ? "Liga"
          : "KO";
      const startUi = getApiMatchStartUi(match, activeStartedMatch);
      const startDisabledAttr = startUi.disabled ? "disabled" : "";
      const startTitleAttr = startUi.title ? `title="${escapeHtml(startUi.title)}"` : "";
      const autoStatus = getApiMatchStatusText(match);

      const winnerOptions = editable
        ? `
          <option value="">Gewinner</option>
          <option value="${escapeHtml(match.player1Id)}" ${match.winnerId === match.player1Id ? "selected" : ""}>${escapeHtml(player1)}</option>
          <option value="${escapeHtml(match.player2Id)}" ${match.winnerId === match.player2Id ? "selected" : ""}>${escapeHtml(player2)}</option>
        `
        : `<option value="">TBD</option>`;

      return `
        <tr>
          <td>${escapeHtml(stageLabel)}</td>
          <td>R${match.round} M${match.number}</td>
          <td>${escapeHtml(player1)} vs ${escapeHtml(player2)}</td>
          <td>${match.status === STATUS_COMPLETED ? "Abgeschlossen" : "Offen"}</td>
          <td>${match.status === STATUS_COMPLETED ? escapeHtml(winner) : "-"}</td>
          <td>${match.status === STATUS_COMPLETED ? `${match.legs.p1}:${match.legs.p2}` : "-"}</td>
          <td>
            <div class="ata-score-grid">
              <select data-field="winner" data-match-id="${escapeHtml(match.id)}" ${editable ? "" : "disabled"}>
                ${winnerOptions}
              </select>
              <input type="number" min="0" max="50" data-field="legs-p1" data-match-id="${escapeHtml(match.id)}" value="${match.legs.p1}" ${editable ? "" : "disabled"}>
              <input type="number" min="0" max="50" data-field="legs-p2" data-match-id="${escapeHtml(match.id)}" value="${match.legs.p2}" ${editable ? "" : "disabled"}>
              <button type="button" class="ata-btn" data-action="save-match" data-match-id="${escapeHtml(match.id)}" ${editable ? "" : "disabled"}>Speichern</button>
              <button type="button" class="ata-btn ata-btn-primary" data-action="start-match" data-match-id="${escapeHtml(match.id)}" ${startDisabledAttr} ${startTitleAttr}>${escapeHtml(startUi.label)}</button>
              <div class="ata-small">${escapeHtml(autoStatus)}</div>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    return `
      <section class="ata-card tournamentCard">
        <h3>Ergebnisfuehrung</h3>
        <p class="ata-small">API-Halbautomatik: Match per Klick starten, Ergebnis wird automatisch synchronisiert. Manuelle Eingabe bleibt als Fallback aktiv.</p>
        <div class="ata-table-wrap">
          <table class="ata-table tournamentRanking">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Match</th>
                <th>Paarung</th>
                <th>Status</th>
                <th>Winner</th>
                <th>Legs</th>
                <th>Eingabe</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderStandingsTable(rows, headline) {
    const bodyRows = rows.map((row) => `
      <tr>
        <td>${row.rank}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${row.played}</td>
        <td>${row.wins}</td>
        <td>${row.losses}</td>
        <td>${row.points}</td>
        <td>${row.legDiff}</td>
        <td>${row.legsFor}</td>
      </tr>
    `).join("");

    return `
      <div class="ata-card">
        <h3>${escapeHtml(headline)}</h3>
        <div class="ata-table-wrap">
          <table class="ata-table tournamentRanking">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Sp</th>
                <th>S</th>
                <th>N</th>
                <th>Pkt</th>
                <th>LegDiff</th>
                <th>Legs+</th>
              </tr>
            </thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderLeagueSchedule(tournament) {
    const matches = getMatchesByStage(tournament, MATCH_STAGE_LEAGUE);
    if (!matches.length) {
      return "";
    }
    const rows = matches.map((match) => `
      <tr>
        <td>R${match.round}</td>
        <td>${escapeHtml(participantNameById(tournament, match.player1Id))}</td>
        <td>${escapeHtml(participantNameById(tournament, match.player2Id))}</td>
        <td>${match.status === STATUS_COMPLETED ? escapeHtml(participantNameById(tournament, match.winnerId)) : "-"}</td>
        <td>${match.status === STATUS_COMPLETED ? `${match.legs.p1}:${match.legs.p2}` : "-"}</td>
      </tr>
    `).join("");

    return `
      <div class="ata-card">
        <h3>Liga-Spielplan</h3>
        <div class="ata-table-wrap">
          <table class="ata-table tournamentRanking">
            <thead>
              <tr>
                <th>Runde</th>
                <th>Spieler 1</th>
                <th>Spieler 2</th>
                <th>Winner</th>
                <th>Legs</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderStaticBracketFallback(tournament) {
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    if (!koMatches.length) {
      return `<p class="ata-small">Kein KO-Bracket vorhanden.</p>`;
    }

    const rounds = new Map();
    koMatches.forEach((match) => {
      if (!rounds.has(match.round)) {
        rounds.set(match.round, []);
      }
      rounds.get(match.round).push(match);
    });

    const roundHtml = [...rounds.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([roundNumber, matches]) => {
        const matchesHtml = matches
          .sort((a, b) => a.number - b.number)
          .map((match) => `
            <div class="ata-bracket-match">
              <div>${escapeHtml(participantNameById(tournament, match.player1Id))}</div>
              <div>${escapeHtml(participantNameById(tournament, match.player2Id))}</div>
              <div class="ata-small">${match.status === STATUS_COMPLETED ? `Winner: ${escapeHtml(participantNameById(tournament, match.winnerId))}` : "offen"}</div>
            </div>
          `).join("");

        return `
          <div class="ata-bracket-round">
            <strong>Runde ${roundNumber}</strong>
            ${matchesHtml}
          </div>
        `;
      }).join("");

    return `<div class="ata-bracket-grid">${roundHtml}</div>`;
  }

  function renderViewTab() {
    const tournament = state.store.tournament;
    if (!tournament) {
      return `<section class="ata-card tournamentCard"><h3>Keine Turnierdaten</h3><p>Bitte zuerst ein Turnier erstellen.</p></section>`;
    }

    let html = "";

    if (tournament.mode === "league") {
      const standings = standingsForMatches(tournament, getMatchesByStage(tournament, MATCH_STAGE_LEAGUE));
      html += renderStandingsTable(standings, "Liga-Tabelle");
      html += renderLeagueSchedule(tournament);
    } else if (tournament.mode === "groups_ko") {
      const standingsMap = groupStandingsMap(tournament);
      const groupCards = [];
      standingsMap.forEach((entry) => {
        groupCards.push(renderStandingsTable(entry.rows, `Tabelle ${entry.group.name}`));
      });
      html += `<div class="ata-group-grid">${groupCards.join("")}</div>`;
    }

    if (tournament.mode === "ko" || tournament.mode === "groups_ko") {
      html += `
        <section class="ata-card tournamentCard">
          <h3>KO-Bracket</h3>
          <div class="ata-bracket-shell">
            <iframe id="ata-bracket-frame" class="ata-bracket-frame" title="Turnierbaum" sandbox="allow-scripts allow-same-origin"></iframe>
            <div class="ata-bracket-fallback" id="ata-bracket-fallback">
              ${renderStaticBracketFallback(tournament)}
            </div>
          </div>
          <div class="ata-actions" style="margin-top: 10px;">
            <button type="button" class="ata-btn" data-action="retry-bracket">Bracket neu laden</button>
          </div>
          <p class="ata-small">CDN-Render aktiv, Fallback darunter sichtbar fuer robuste Anzeige.</p>
        </section>
      `;
    }

    return html || `<section class="ata-card tournamentCard"><h3>Ansicht</h3><p>Keine Daten.</p></section>`;
  }

  function renderIOTab() {
    return `
      <section class="ata-card tournamentCard">
        <h3>Export</h3>
        <div class="ata-actions">
          <button type="button" class="ata-btn ata-btn-primary" data-action="export-file">JSON herunterladen</button>
          <button type="button" class="ata-btn" data-action="export-clipboard">JSON in Zwischenablage</button>
        </div>
      </section>
      <section class="ata-card tournamentCard">
        <h3>Import</h3>
        <div class="ata-field">
          <label for="ata-import-file">Datei importieren</label>
          <input id="ata-import-file" type="file" accept=".json,application/json">
        </div>
        <div class="ata-field" style="margin-top: 10px;">
          <label for="ata-import-text">JSON einfugen</label>
          <textarea id="ata-import-text" placeholder="{ ... }"></textarea>
        </div>
        <div class="ata-actions" style="margin-top: 10px;">
          <button type="button" class="ata-btn" data-action="import-text">Eingefugtes JSON importieren</button>
        </div>
      </section>
    `;
  }

  function renderSettingsTab() {
    const debugEnabled = state.store.settings.debug ? "checked" : "";
    const autoLobbyEnabled = state.store.settings.featureFlags.autoLobbyStart ? "checked" : "";
    return `
      <section class="ata-card tournamentCard">
        <h3>Debug und Feature-Flags</h3>
        <div class="ata-toggle">
          <div>
            <strong>Debug-Mode</strong>
            <div class="ata-small">Aktiviert detaillierte Logs in der Browser-Konsole.</div>
          </div>
          <input type="checkbox" id="ata-setting-debug" data-action="toggle-debug" ${debugEnabled}>
        </div>
        <div class="ata-toggle">
          <div>
            <strong>Automatischer Lobby-Start + API-Sync</strong>
            <div class="ata-small">Default OFF. Aktiviert Matchstart per Klick und automatische Ergebnisuebernahme aus der Autodarts-API.</div>
          </div>
          <input type="checkbox" id="ata-setting-autolobby" data-action="toggle-autolobby" ${autoLobbyEnabled}>
        </div>
      </section>
      <section class="ata-card tournamentCard">
        <h3>Storage</h3>
        <p class="ata-small"><code>${escapeHtml(STORAGE_KEY)}</code>, schemaVersion ${STORAGE_SCHEMA_VERSION}</p>
      </section>
    `;
  }

  function ensureHost() {
    let host = document.getElementById(UI_HOST_ID);
    if (!host) {
      host = document.createElement("div");
      host.id = UI_HOST_ID;
      document.documentElement.appendChild(host);
    }
    if (!(host instanceof HTMLElement)) {
      throw new Error("ATA host element not available.");
    }
    state.host = host;

    if (!host.shadowRoot) {
      host.attachShadow({ mode: "open" });
    }
    state.shadowRoot = host.shadowRoot;
  }

  function renderShell() {
    if (!state.shadowRoot) {
      return;
    }

    state.shadowRoot.innerHTML = buildShellHtml();
    bindUiHandlers();
    if (state.activeTab === "view") {
      queueBracketRender();
    }
  }

  function bindUiHandlers() {
    const shadow = state.shadowRoot;
    if (!shadow) {
      return;
    }

    shadow.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        const tabId = button.getAttribute("data-tab");
        if (!TAB_IDS.includes(tabId)) {
          return;
        }
        state.activeTab = tabId;
        state.store.ui.activeTab = tabId;
        schedulePersist();
        renderShell();
      });
    });

    const createForm = shadow.getElementById("ata-create-form");
    if (createForm instanceof HTMLFormElement) {
      createForm.addEventListener("submit", (event) => {
        event.preventDefault();
        handleCreateTournament(createForm);
      });
    }

    shadow.querySelectorAll("[data-action='close-drawer']").forEach((button) => {
      button.addEventListener("click", () => closeDrawer());
    });

    shadow.querySelectorAll("[data-action='save-match']").forEach((button) => {
      button.addEventListener("click", () => {
        const matchId = button.getAttribute("data-match-id");
        if (matchId) {
          handleSaveMatchResult(matchId);
        }
      });
    });

    shadow.querySelectorAll("[data-action='start-match']").forEach((button) => {
      button.addEventListener("click", () => {
        const matchId = button.getAttribute("data-match-id");
        if (!matchId) {
          return;
        }
        handleStartMatch(matchId).catch((error) => {
          logError("api", "Start-match handler failed unexpectedly.", error);
          setNotice("error", "Matchstart ist unerwartet fehlgeschlagen.");
        });
      });
    });

    const resetButton = shadow.querySelector("[data-action='reset-tournament']");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        handleResetTournament();
      });
    }

    const exportFileButton = shadow.querySelector("[data-action='export-file']");
    if (exportFileButton) {
      exportFileButton.addEventListener("click", () => handleExportFile());
    }

    const exportClipboardButton = shadow.querySelector("[data-action='export-clipboard']");
    if (exportClipboardButton) {
      exportClipboardButton.addEventListener("click", () => handleExportClipboard());
    }

    const importTextButton = shadow.querySelector("[data-action='import-text']");
    if (importTextButton) {
      importTextButton.addEventListener("click", () => handleImportFromTextarea());
    }

    const fileInput = shadow.getElementById("ata-import-file");
    if (fileInput instanceof HTMLInputElement) {
      fileInput.addEventListener("change", () => handleImportFromFile(fileInput));
    }

    const debugToggle = shadow.getElementById("ata-setting-debug");
    if (debugToggle instanceof HTMLInputElement) {
      debugToggle.addEventListener("change", () => {
        state.store.settings.debug = debugToggle.checked;
        schedulePersist();
        setNotice("success", `Debug-Mode ${debugToggle.checked ? "aktiviert" : "deaktiviert"}.`, 1800);
      });
    }

    const autoLobbyToggle = shadow.getElementById("ata-setting-autolobby");
    if (autoLobbyToggle instanceof HTMLInputElement) {
      autoLobbyToggle.addEventListener("change", () => {
        state.store.settings.featureFlags.autoLobbyStart = autoLobbyToggle.checked;
        if (!autoLobbyToggle.checked) {
          state.apiAutomation.authBackoffUntil = 0;
        }
        schedulePersist();
        setNotice("info", `Auto-Lobby + API-Sync: ${autoLobbyToggle.checked ? "ON" : "OFF"}.`, 2200);
        if (autoLobbyToggle.checked) {
          syncPendingApiMatches().catch((error) => {
            logWarn("api", "Immediate sync after toggle failed.", error);
          });
        }
      });
    }

    const retryBracketButton = shadow.querySelector("[data-action='retry-bracket']");
    if (retryBracketButton) {
      retryBracketButton.addEventListener("click", () => queueBracketRender(true));
    }

    const drawer = shadow.querySelector(".ata-drawer");
    if (drawer) {
      drawer.addEventListener("keydown", handleDrawerKeydown);
    }
  }

  function handleDrawerKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDrawer();
      return;
    }

    if (event.key !== "Tab" || !state.drawerOpen) {
      return;
    }

    const drawer = state.shadowRoot?.querySelector(".ata-drawer");
    if (!drawer) {
      return;
    }

    const focusables = Array.from(drawer.querySelectorAll(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    )).filter((element) => !element.hasAttribute("disabled"));

    if (!focusables.length) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const current = drawer.getRootNode().activeElement;

    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openDrawer() {
    state.lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    state.drawerOpen = true;
    renderShell();
    const firstInteractive = state.shadowRoot?.querySelector(".ata-drawer button, .ata-drawer input, .ata-drawer select, .ata-drawer textarea");
    if (firstInteractive instanceof HTMLElement) {
      firstInteractive.focus();
    }
  }

  function closeDrawer() {
    state.drawerOpen = false;
    renderShell();
    if (state.lastFocused instanceof HTMLElement) {
      state.lastFocused.focus();
    }
  }

  function toggleDrawer() {
    if (state.drawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  function handleCreateTournament(form) {
    const formData = new FormData(form);
    const participants = parseParticipantLines(formData.get("participants"));
    const config = {
      name: normalizeText(formData.get("name")),
      mode: normalizeText(formData.get("mode")),
      bestOfLegs: sanitizeBestOf(formData.get("bestOfLegs")),
      startScore: sanitizeStartScore(formData.get("startScore")),
      participants,
    };

    const errors = validateCreateConfig(config);
    if (errors.length) {
      setNotice("error", errors.join(" "));
      return;
    }

    state.store.tournament = createTournament(config);
    schedulePersist();
    setNotice("success", "Turnier wurde erstellt.");
    state.activeTab = "matches";
    renderShell();
  }

  function getMatchFieldElement(shadow, fieldName, matchId) {
    const candidates = Array.from(shadow.querySelectorAll(`[data-field="${fieldName}"]`));
    return candidates.find((candidate) => candidate.getAttribute("data-match-id") === matchId) || null;
  }

  function handleSaveMatchResult(matchId) {
    const shadow = state.shadowRoot;
    if (!shadow) {
      return;
    }
    const winnerSelect = getMatchFieldElement(shadow, "winner", matchId);
    const legsP1Input = getMatchFieldElement(shadow, "legs-p1", matchId);
    const legsP2Input = getMatchFieldElement(shadow, "legs-p2", matchId);

    if (!(winnerSelect instanceof HTMLSelectElement) || !(legsP1Input instanceof HTMLInputElement) || !(legsP2Input instanceof HTMLInputElement)) {
      return;
    }

    const winnerId = normalizeText(winnerSelect.value);
    if (!winnerId) {
      setNotice("error", "Bitte Gewinner auswahlen.");
      return;
    }

    const result = updateMatchResult(matchId, winnerId, {
      p1: legsP1Input.value,
      p2: legsP2Input.value,
    }, "manual");

    if (result.ok) {
      setNotice("success", "Match gespeichert.", 1800);
    } else {
      setNotice("error", result.message || "Match konnte nicht gespeichert werden.");
    }
  }

  function handleResetTournament() {
    const confirmed = window.confirm("Soll das Turnier wirklich geloescht werden? Dieser Schritt kann nicht rueckgaengig gemacht werden.");
    if (!confirmed) {
      return;
    }
    state.store.tournament = null;
    state.apiAutomation.startingMatchId = "";
    state.apiAutomation.authBackoffUntil = 0;
    schedulePersist();
    setNotice("success", "Turnier wurde geloescht.");
    state.activeTab = "tournament";
    renderShell();
  }

  function exportDataPayload() {
    return {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      exportedAt: nowIso(),
      tournament: state.store.tournament,
    };
  }

  function handleExportFile() {
    const payload = exportDataPayload();
    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ata-export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setNotice("success", "JSON-Datei exportiert.", 2000);
  }

  async function handleExportClipboard() {
    try {
      const payload = exportDataPayload();
      const text = JSON.stringify(payload, null, 2);
      await navigator.clipboard.writeText(text);
      setNotice("success", "JSON in Zwischenablage kopiert.", 2000);
    } catch (error) {
      setNotice("error", "Kopieren in Zwischenablage fehlgeschlagen.");
      logWarn("io", "Clipboard write failed.", error);
    }
  }

  function importPayload(rawObject) {
    if (!rawObject || typeof rawObject !== "object") {
      return { ok: false, message: "JSON ist leer oder ungueltig." };
    }

    let tournament = rawObject.tournament || null;
    if (!tournament && rawObject.mode && rawObject.participants) {
      tournament = rawObject;
    }

    const normalizedTournament = normalizeTournament(tournament);
    if (!normalizedTournament) {
      return { ok: false, message: "Turnierdaten konnten nicht validiert werden." };
    }

    if (normalizedTournament.participants.length < PLAYER_LIMIT_MIN || normalizedTournament.participants.length > PLAYER_LIMIT_MAX) {
      return { ok: false, message: `Teilnehmerzahl muss zwischen ${PLAYER_LIMIT_MIN} und ${PLAYER_LIMIT_MAX} liegen.` };
    }
    if (normalizedTournament.mode === "groups_ko" && normalizedTournament.participants.length < GROUP_MODE_MIN) {
      return { ok: false, message: "Gruppenphase + KO erfordert mindestens 5 Teilnehmer." };
    }

    refreshDerivedMatches(normalizedTournament);
    state.store.tournament = normalizedTournament;
    schedulePersist();
    renderShell();
    return { ok: true };
  }

  function handleImportFromTextarea() {
    const textarea = state.shadowRoot?.getElementById("ata-import-text");
    if (!(textarea instanceof HTMLTextAreaElement)) {
      return;
    }

    try {
      const parsed = JSON.parse(textarea.value);
      const result = importPayload(parsed);
      if (result.ok) {
        setNotice("success", "JSON erfolgreich importiert.");
        state.activeTab = "matches";
        renderShell();
      } else {
        setNotice("error", result.message || "Import fehlgeschlagen.");
      }
    } catch (error) {
      setNotice("error", "JSON konnte nicht geparst werden.");
      logWarn("io", "Import parse failed.", error);
    }
  }

  function handleImportFromFile(fileInput) {
    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const result = importPayload(parsed);
        if (result.ok) {
          setNotice("success", "Datei erfolgreich importiert.");
          state.activeTab = "matches";
          renderShell();
        } else {
          setNotice("error", result.message || "Datei konnte nicht importiert werden.");
        }
      } catch (error) {
        setNotice("error", "Datei enthaelt kein gueltiges JSON.");
        logWarn("io", "File import parse failed.", error);
      }
    };
    reader.onerror = () => {
      setNotice("error", "Datei konnte nicht gelesen werden.");
    };
    reader.readAsText(file);
  }

  function buildBracketPayload(tournament) {
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    if (!koMatches.length) {
      return null;
    }

    const bracketSize = tournament.mode === "groups_ko" ? 4 : nextPowerOfTwo(tournament.participants.length);
    const participants = tournament.participants.map((participant) => ({
      id: participant.id,
      tournament_id: 1,
      name: participant.name,
    }));

    const matches = koMatches.map((match) => {
      const completed = match.status === STATUS_COMPLETED;
      const status = completed ? 4 : (match.player1Id && match.player2Id ? 2 : 1);
      const opponent1 = match.player1Id
        ? {
            id: match.player1Id,
            score: clampInt(match.legs?.p1, 0, 0, 50),
            result: completed && match.winnerId ? (match.winnerId === match.player1Id ? "win" : "loss") : undefined,
          }
        : null;
      const opponent2 = match.player2Id
        ? {
            id: match.player2Id,
            score: clampInt(match.legs?.p2, 0, 0, 50),
            result: completed && match.winnerId ? (match.winnerId === match.player2Id ? "win" : "loss") : undefined,
          }
        : null;
      return {
        id: match.id,
        stage_id: 1,
        group_id: 1,
        round_id: match.round,
        number: match.number,
        child_count: 0,
        status,
        opponent1,
        opponent2,
      };
    });

    return {
      stages: [{
        id: 1,
        tournament_id: 1,
        name: tournament.mode === "groups_ko" ? "KO-Phase" : "KO",
        type: "single_elimination",
        settings: { size: bracketSize },
        number: 1,
      }],
      matches,
      matchGames: [],
      participants,
    };
  }

  function buildBracketFrameSrcdoc() {
    return `
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="${BRACKET_VIEWER_CSS}">
  <style>
    html, body { margin: 0; padding: 0; background: #f6f8fa; font-family: Arial, sans-serif; }
    #brackets-root { padding: 12px; min-height: 380px; }
    #msg { padding: 12px; font-size: 13px; color: #444; }
  </style>
</head>
<body>
  <div id="msg">Bracket wird geladen ...</div>
  <div id="brackets-root" class="brackets-viewer"></div>
  <script src="${I18NEXT_UMD_JS}"></script>
  <script src="${BRACKET_VIEWER_JS}"></script>
  <script>
    (function () {
      var msgEl = document.getElementById("msg");
      function post(data) { window.parent.postMessage(data, "*"); }
      function render(payload) {
        if (!window.bracketsViewer) {
          throw new Error("bracketsViewer not found");
        }
        if (window.i18next && !window.i18next.isInitialized) {
          try { window.i18next.init({ lng: "de", resources: { de: { translation: { bye: "Freilos" } } } }); } catch (_) {}
        }
        window.bracketsViewer.render(payload, { selector: "#brackets-root", clear: true });
        if (msgEl) { msgEl.style.display = "none"; }
      }
      window.addEventListener("message", function (event) {
        var data = event.data;
        if (!data || data.type !== "ata:render-bracket") { return; }
        try {
          render(data.payload || {});
          post({ type: "ata:bracket-rendered" });
        } catch (err) {
          post({ type: "ata:bracket-error", message: err && err.message ? err.message : String(err) });
        }
      });
      post({ type: "ata:bracket-frame-ready" });
    })();
  </script>
</body>
</html>
    `;
  }

  function queueBracketRender(forceReload = false) {
    const tournament = state.store.tournament;
    if (!tournament || (tournament.mode !== "ko" && tournament.mode !== "groups_ko")) {
      return;
    }
    const shadow = state.shadowRoot;
    if (!shadow) {
      return;
    }
    const frame = shadow.getElementById("ata-bracket-frame");
    if (!(frame instanceof HTMLIFrameElement)) {
      return;
    }

    const payload = buildBracketPayload(tournament);
    if (!payload) {
      return;
    }

    if (forceReload || state.bracket.iframe !== frame) {
      state.bracket.iframe = frame;
      state.bracket.ready = false;
      state.bracket.failed = false;
      state.bracket.lastError = "";
      frame.srcdoc = buildBracketFrameSrcdoc();
    }

    if (state.bracket.timeoutHandle) {
      clearTimeout(state.bracket.timeoutHandle);
      state.bracket.timeoutHandle = null;
    }

    state.bracket.timeoutHandle = window.setTimeout(() => {
      state.bracket.failed = true;
      state.bracket.lastError = "Bracket-Render Timeout";
      setNotice("error", "CDN-Bracket Timeout, Fallback bleibt aktiv.", 3200);
      logWarn("bracket", "Iframe bracket render timeout.");
    }, 7000);

    if (state.bracket.ready && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: "ata:render-bracket", payload }, "*");
    }
  }

  function handleBracketMessage(event) {
    const frame = state.bracket.iframe;
    if (!frame || event.source !== frame.contentWindow) {
      return;
    }

    const data = event.data;
    if (!data || typeof data !== "object") {
      return;
    }

    if (data.type === "ata:bracket-frame-ready") {
      state.bracket.ready = true;
      const payload = buildBracketPayload(state.store.tournament);
      if (payload && frame.contentWindow) {
        frame.contentWindow.postMessage({ type: "ata:render-bracket", payload }, "*");
      }
      return;
    }

    if (data.type === "ata:bracket-rendered") {
      if (state.bracket.timeoutHandle) {
        clearTimeout(state.bracket.timeoutHandle);
        state.bracket.timeoutHandle = null;
      }
      state.bracket.failed = false;
      state.bracket.lastError = "";
      logDebug("bracket", "Bracket rendered successfully.");
      return;
    }

    if (data.type === "ata:bracket-error") {
      if (state.bracket.timeoutHandle) {
        clearTimeout(state.bracket.timeoutHandle);
        state.bracket.timeoutHandle = null;
      }
      state.bracket.failed = true;
      state.bracket.lastError = normalizeText(data.message || "Unbekannter Fehler");
      setNotice("error", `Bracket-Fehler: ${state.bracket.lastError}. Fallback aktiv.`, 3600);
      logWarn("bracket", "Bracket render error.", data);
    }
  }

  function playerLookupMap(tournament) {
    const map = new Map();
    tournament.participants.forEach((participant) => {
      map.set(normalizeLookup(participant.name), participant.id);
    });
    return map;
  }

  function extractNameCandidatesFromDom(tournament) {
    const map = playerLookupMap(tournament);
    const counts = new Map();
    const selectors = [
      '[data-testid*="player"]',
      '[data-testid*="name"]',
      '[class*="player"]',
      '[class*="name"]',
      '[class*="scoreboard"]',
    ];

    selectors.forEach((selector) => {
      const nodes = Array.from(document.querySelectorAll(selector)).slice(0, 140);
      nodes.forEach((node) => {
        const text = normalizeText(node.textContent);
        if (!text || text.length > 80) {
          return;
        }
        const lookup = normalizeLookup(text);
        map.forEach((participantId, key) => {
          if (lookup === key || lookup.includes(key)) {
            counts.set(participantId, (counts.get(participantId) || 0) + 1);
          }
        });
      });
    });

    const sorted = [...counts.entries()].sort((left, right) => right[1] - left[1]);
    return sorted.slice(0, 4).map((entry) => entry[0]);
  }

  function extractWinnerFromDom(tournament) {
    const map = playerLookupMap(tournament);
    const selectors = [
      '[class*="winner"]',
      '[data-testid*="winner"]',
      '[aria-label*="winner"]',
      '[aria-label*="Winner"]',
    ];

    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector)).slice(0, 80);
      for (const node of nodes) {
        const text = normalizeLookup(node.textContent || node.getAttribute("aria-label") || "");
        if (!text) {
          continue;
        }
        for (const [nameKey, participantId] of map.entries()) {
          if (text.includes(nameKey)) {
            return participantId;
          }
        }
      }
    }

    const fullText = normalizeText(document.body?.innerText || "");
    const winnerLine = fullText.match(/(?:winner|gewinner)\s*[:\-]\s*([^\n\r]+)/i);
    if (winnerLine) {
      const candidate = normalizeLookup(winnerLine[1]);
      for (const [nameKey, participantId] of map.entries()) {
        if (candidate.includes(nameKey)) {
          return participantId;
        }
      }
    }

    return null;
  }

  function extractLegScoreFromDom(bestOfLegs) {
    const neededWins = Math.floor(bestOfLegs / 2) + 1;
    const selectors = ['[class*="legs"]', '[data-testid*="legs"]', '[class*="score"]', '[class*="result"]'];
    let fallback = { p1: 0, p2: 0 };

    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector)).slice(0, 120);
      for (const node of nodes) {
        const text = normalizeText(node.textContent);
        if (!text || text.length > 20) {
          continue;
        }
        const match = text.match(/^(\d{1,2})\s*[:\-]\s*(\d{1,2})$/);
        if (!match) {
          continue;
        }
        const p1 = clampInt(match[1], 0, 0, 50);
        const p2 = clampInt(match[2], 0, 0, 50);
        fallback = { p1, p2 };
        if (p1 === neededWins || p2 === neededWins) {
          return fallback;
        }
      }
    }
    return fallback;
  }

  function scanForAutoResult() {
    const tournament = state.store.tournament;
    if (!tournament) {
      return;
    }
    const now = Date.now();
    if (now - state.autoDetect.lastScanAt < 900) {
      return;
    }
    state.autoDetect.lastScanAt = now;

    const winnerId = extractWinnerFromDom(tournament);
    if (!winnerId) {
      return;
    }

    const nameCandidates = extractNameCandidatesFromDom(tournament);
    const candidateIds = nameCandidates.filter((id, index, array) => array.indexOf(id) === index).slice(0, 3);
    if (!candidateIds.length) {
      return;
    }

    let targetMatch = null;
    for (let i = 0; i < candidateIds.length; i += 1) {
      for (let j = i + 1; j < candidateIds.length; j += 1) {
        const match = getOpenMatchByPlayers(tournament, candidateIds[i], candidateIds[j]);
        if (match && (winnerId === candidateIds[i] || winnerId === candidateIds[j])) {
          if (targetMatch) {
            logDebug("autodetect", "Multiple possible matches found, skipping auto close.");
            return;
          }
          targetMatch = match;
        }
      }
    }

    if (!targetMatch) {
      const openWithWinner = tournament.matches.filter((match) => (
        match.status === STATUS_PENDING
        && match.player1Id
        && match.player2Id
        && (match.player1Id === winnerId || match.player2Id === winnerId)
      ));
      if (openWithWinner.length === 1) {
        targetMatch = openWithWinner[0];
      }
    }

    if (!targetMatch) {
      return;
    }

    const legs = extractLegScoreFromDom(tournament.bestOfLegs);
    const fingerprint = `${targetMatch.id}|${winnerId}|${legs.p1}:${legs.p2}|${location.pathname}`;
    if (state.autoDetect.lastFingerprint === fingerprint) {
      return;
    }
    state.autoDetect.lastFingerprint = fingerprint;

    const result = updateMatchResult(targetMatch.id, winnerId, legs, "auto");
    if (result.ok) {
      setNotice("info", `Auto-Ergebnis erkannt: ${participantNameById(tournament, winnerId)} (${targetMatch.id})`, 2600);
      logDebug("autodetect", "Auto result applied.", { matchId: targetMatch.id, winnerId, legs });
    }
  }

  function queueAutoScan() {
    if (state.autoDetect.queued) {
      return;
    }
    state.autoDetect.queued = true;
    requestAnimationFrame(() => {
      state.autoDetect.queued = false;
      scanForAutoResult();
    });
  }

  function startAutoDetectionObserver() {
    if (state.autoDetect.observer) {
      state.autoDetect.observer.disconnect();
      state.autoDetect.observer = null;
    }

    const root = document.body || document.documentElement;
    if (!root) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      const relevant = mutations.some((mutation) => mutation.type === "childList" || mutation.type === "characterData");
      if (relevant) {
        queueAutoScan();
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    state.autoDetect.observer = observer;
    addObserver(observer);
  }

  function onRouteChange() {
    const current = routeKey();
    if (current === state.routeKey) {
      return;
    }
    state.routeKey = current;
    logDebug("route", `Route changed to ${current}`);
    ensureHost();
    renderShell();
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

  function setupRuntimeApi() {
    window[RUNTIME_GLOBAL_KEY] = {
      version: APP_VERSION,
      isReady: () => state.ready,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    };

    addCleanup(() => {
      if (window[RUNTIME_GLOBAL_KEY]) {
        delete window[RUNTIME_GLOBAL_KEY];
      }
    });
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
    if (state.bracket.timeoutHandle) {
      clearTimeout(state.bracket.timeoutHandle);
      state.bracket.timeoutHandle = null;
    }
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

  async function init() {
    await loadPersistedStore();
    ensureHost();
    renderShell();

    initEventBridge();
    installRouteHooks();
    startAutoDetectionObserver();
    setupRuntimeApi();
    addInterval(() => {
      syncPendingApiMatches().catch((error) => {
        logWarn("api", "Background sync loop failed.", error);
      });
    }, API_SYNC_INTERVAL_MS);

    state.ready = true;
    window.dispatchEvent(new CustomEvent(READY_EVENT, {
      detail: {
        version: APP_VERSION,
      },
    }));
    logDebug("runtime", "ATA runtime initialized.");
  }

  init().catch((error) => {
    logError("runtime", "Initialization failed.", error);
  });
})();

