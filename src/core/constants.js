// Auto-generated module split from dist source.
// ==UserScript==
// @name         Autodarts Tournament Assistant
// @namespace    https://github.com/thomasasen/autodarts_local_tournament
// @version      __ATA_APP_VERSION__
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
  const APP_VERSION = "__ATA_APP_VERSION__";
  const STORAGE_KEY = "ata:tournament:v1";
  const STORAGE_SCHEMA_VERSION = 4;
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
  const REPO_BLOB_BASE_URL = "https://github.com/thomasasen/autodarts_local_tournament/blob/main";
  const README_BASE_URL = "https://github.com/thomasasen/autodarts_local_tournament/blob/main/README.md";
  const README_SETTINGS_URL = `${README_BASE_URL}#einstellungen`;
  const README_INFO_SYMBOLS_URL = `${README_BASE_URL}#info-symbole`;
  const README_TOURNAMENT_MODES_URL = `${README_BASE_URL}#turniermodi`;
  const README_TOURNAMENT_CREATE_URL = `${README_BASE_URL}#turnier-anlegen`;
  const README_API_AUTOMATION_URL = `${README_BASE_URL}#api-halbautomatik`;
  const DRA_GUI_RULES_DOC_URL = `${REPO_BLOB_BASE_URL}/docs/dra-regeln-gui.md`;
  const DRA_GUI_RULE_MODE_FORMATS_URL = `${DRA_GUI_RULES_DOC_URL}#dra-gui-rule-mode-formats`;
  const DRA_GUI_RULE_OPEN_DRAW_URL = `${DRA_GUI_RULES_DOC_URL}#dra-gui-rule-open-draw`;
  const DRA_GUI_RULE_DRAW_LOCK_URL = `${DRA_GUI_RULES_DOC_URL}#dra-gui-rule-draw-lock`;
  const DRA_GUI_RULE_PARTICIPANT_LIMITS_URL = `${DRA_GUI_RULES_DOC_URL}#dra-gui-rule-participant-limits`;
  const DRA_GUI_RULE_BYE_URL = `${DRA_GUI_RULES_DOC_URL}#dra-gui-rule-bye`;
  const DRA_GUI_RULE_TIE_BREAK_URL = `${DRA_GUI_RULES_DOC_URL}#dra-gui-rule-tie-break`;
  const DRA_GUI_RULE_CHECKLIST_URL = `${DRA_GUI_RULES_DOC_URL}#dra-gui-rule-checklist`;

  const BRACKETS_VIEWER_CSS = "https://cdn.jsdelivr.net/npm/brackets-viewer@1.9.0/dist/brackets-viewer.min.css";
  const BRACKETS_VIEWER_JS = "https://cdn.jsdelivr.net/npm/brackets-viewer@1.9.0/dist/brackets-viewer.min.js";
  const I18NEXT_JS = "https://cdn.jsdelivr.net/npm/i18next@23.16.8/dist/umd/i18next.min.js";
  const ATA_UI_MAIN_CSS = `__ATA_UI_MAIN_CSS__`;
  const ATA_PDC_LOGO_DATA_URI = "__ATA_PDC_LOGO_DATA_URI__";

  const STATUS_COMPLETED = "completed";
  const STATUS_PENDING = "pending";
  const MATCH_STAGE_KO = "ko";
  const MATCH_STAGE_GROUP = "group";
  const MATCH_STAGE_LEAGUE = "league";
  const KO_ENGINE_VERSION = 3;
  const KO_DRAW_MODE_SEEDED = "seeded";
  const KO_DRAW_MODE_OPEN_DRAW = "open_draw";
  const X01_VARIANT = "X01";
  const X01_PRESET_LEGACY_PDC_STANDARD = "pdc_standard";
  const X01_PRESET_PDC_EUROPEAN_TOUR_OFFICIAL = "pdc_european_tour_official";
  const X01_PRESET_PDC_501_DOUBLE_OUT_BASIC = "pdc_501_double_out_basic";
  const X01_PRESET_CUSTOM = "custom";
  const X01_IN_MODES = Object.freeze(["Straight", "Double", "Master"]);
  const X01_OUT_MODES = Object.freeze(["Straight", "Double", "Master"]);
  const X01_BULL_MODES = Object.freeze(["25/50", "50/50"]);
  const X01_BULL_OFF_MODES = Object.freeze(["Off", "Normal", "Official"]);
  const X01_MAX_ROUNDS_OPTIONS = Object.freeze([15, 20, 50, 80]);
  const X01_START_SCORE_OPTIONS = Object.freeze([121, 170, 301, 501, 701, 901]);
  const TOURNAMENT_TIME_PROFILE_FAST = "fast";
  const TOURNAMENT_TIME_PROFILE_NORMAL = "normal";
  const TOURNAMENT_TIME_PROFILE_SLOW = "slow";
  const TOURNAMENT_TIME_PROFILES = Object.freeze([
    TOURNAMENT_TIME_PROFILE_FAST,
    TOURNAMENT_TIME_PROFILE_NORMAL,
    TOURNAMENT_TIME_PROFILE_SLOW,
  ]);
  const MATCH_SORT_MODE_READY_FIRST = "ready_first";
  const MATCH_SORT_MODE_ROUND = "round";
  const MATCH_SORT_MODE_STATUS = "status";
  const TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE = "promoter_h2h_minitable";
  const TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF = "promoter_points_legdiff";
  const TIE_BREAK_PROFILES = Object.freeze([
    TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE,
    TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF,
  ]);
  const LEGACY_TIE_BREAK_MODE_DRA_STRICT = "dra_strict";
  const LEGACY_TIE_BREAK_MODE_LEGACY = "legacy";
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


