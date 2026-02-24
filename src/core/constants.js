// Auto-generated module split from dist source.
// ==UserScript==
// @name         Autodarts Tournament Assistant
// @namespace    https://github.com/thomasasen/autodarts_local_tournament
// @version      0.3.0
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
  const APP_VERSION = "0.3.0";
  const STORAGE_KEY = "ata:tournament:v1";
  const STORAGE_SCHEMA_VERSION = 3;
  const STORAGE_KO_MIGRATION_BACKUPS_KEY = "ata:tournament:ko-migration-backups:v2";
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
  const README_BASE_URL = "https://github.com/thomasasen/autodarts_local_tournament/blob/main/README.md";
  const README_RULES_URL = `${README_BASE_URL}#regelbasis-und-limits`;
  const README_SETTINGS_URL = `${README_BASE_URL}#einstellungen`;
  const README_INFO_SYMBOLS_URL = `${README_BASE_URL}#info-symbole`;
  const README_TIE_BREAK_URL = `${README_BASE_URL}#dra-tie-break`;
  const README_TOURNAMENT_MODES_URL = `${README_BASE_URL}#turniermodi`;
  const README_TOURNAMENT_CREATE_URL = `${README_BASE_URL}#turnier-anlegen`;
  const README_API_AUTOMATION_URL = `${README_BASE_URL}#api-halbautomatik`;
  const DRA_RULES_URL = "https://www.thedra.co.uk/dra-rulebook";
  const REPO_BLOB_BASE_URL = "https://github.com/thomasasen/autodarts_local_tournament/blob/main";
  const DRA_RULEBOOK_PDF_URL = `${REPO_BLOB_BASE_URL}/docs/DRA-RULE_BOOK.pdf`;
  const DRA_RULEBOOK_BASICS_URL = `${DRA_RULEBOOK_PDF_URL}#page=4`;
  const DRA_RULEBOOK_FORMATS_URL = `${DRA_RULEBOOK_PDF_URL}#page=17`;
  const DRA_RULEBOOK_LIMITS_URL = `${DRA_RULEBOOK_PDF_URL}#page=18`;
  const DRA_RULEBOOK_TIEBREAK_URL = `${DRA_RULEBOOK_PDF_URL}#page=20`;
  const PDC_OPEN_DRAW_CONTEXT_URL = "https://www.pdc.tv/news/2013/01/16/rules-challenge-youth-tours";

  const BRACKETS_VIEWER_CSS = "https://cdn.jsdelivr.net/npm/brackets-viewer@1.9.0/dist/brackets-viewer.min.css";
  const BRACKETS_VIEWER_JS = "https://cdn.jsdelivr.net/npm/brackets-viewer@1.9.0/dist/brackets-viewer.min.js";
  const I18NEXT_JS = "https://cdn.jsdelivr.net/npm/i18next@23.16.8/dist/umd/i18next.min.js";
  const ATA_UI_MAIN_CSS = `__ATA_UI_MAIN_CSS__`;

  const STATUS_COMPLETED = "completed";
  const STATUS_PENDING = "pending";
  const MATCH_STAGE_KO = "ko";
  const MATCH_STAGE_GROUP = "group";
  const MATCH_STAGE_LEAGUE = "league";
  const KO_ENGINE_VERSION = 2;
  const KO_DRAW_MODE_SEEDED = "seeded";
  const KO_DRAW_MODE_OPEN_DRAW = "open_draw";
  const X01_VARIANT = "X01";
  const X01_PRESET_PDC_STANDARD = "pdc_standard";
  const X01_PRESET_CUSTOM = "custom";
  const X01_IN_MODES = Object.freeze(["Straight", "Double", "Master"]);
  const X01_OUT_MODES = Object.freeze(["Straight", "Double", "Master"]);
  const X01_BULL_MODES = Object.freeze(["25/50", "50/50"]);
  const X01_BULL_OFF_MODES = Object.freeze(["Off", "Normal", "Official"]);
  const X01_MAX_ROUNDS_OPTIONS = Object.freeze([15, 20, 50, 80]);
  const X01_START_SCORE_OPTIONS = Object.freeze([121, 170, 301, 501, 701, 901]);
  const MATCH_SORT_MODE_READY_FIRST = "ready_first";
  const MATCH_SORT_MODE_ROUND = "round";
  const MATCH_SORT_MODE_STATUS = "status";
  const TIE_BREAK_MODE_DRA_STRICT = "dra_strict";
  const TIE_BREAK_MODE_LEGACY = "legacy";
  const TIE_BREAK_MODES = Object.freeze([
    TIE_BREAK_MODE_DRA_STRICT,
    TIE_BREAK_MODE_LEGACY,
  ]);
  const MATCH_SORT_MODES = Object.freeze([
    MATCH_SORT_MODE_READY_FIRST,
    MATCH_SORT_MODE_ROUND,
    MATCH_SORT_MODE_STATUS,
  ]);

  const TAB_IDS = Object.freeze(["tournament", "matches", "view", "io", "settings"]);
  const TAB_META = Object.freeze([
    { id: "tournament", label: "Turnier" },
    { id: "matches", label: "Spiele" },
    { id: "view", label: "Turnierbaum" },
    { id: "io", label: "Import/Export" },
    { id: "settings", label: "Einstellungen" },
  ]);

  const TECHNICAL_PARTICIPANT_HARD_MAX = 128;
  const MODE_PARTICIPANT_LIMITS = Object.freeze({
    ko: Object.freeze({ label: "KO", min: 2, max: 128 }),
    league: Object.freeze({ label: "Liga", min: 2, max: 16 }),
    groups_ko: Object.freeze({ label: "Gruppenphase + KO", min: 4, max: 16 }),
  });
  const BYE_PLACEHOLDER_TOKENS = new Set([
    "bye",
    "freilos",
    "tbd",
    "tobeconfirmed",
    "tobedetermined",
    "unknown",
    "none",
    "null",
    "na",
  ]);

  if (window[RUNTIME_GUARD_KEY]) {
    return;
  }
  window[RUNTIME_GUARD_KEY] = true;


