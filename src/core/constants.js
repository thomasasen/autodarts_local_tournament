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
// @connect      raw.githubusercontent.com
// @connect      api.autodarts.io
// @downloadURL  https://raw.githubusercontent.com/thomasasen/autodarts_local_tournament/main/dist/autodarts-tournament-assistant.user.js
// @updateURL    https://raw.githubusercontent.com/thomasasen/autodarts_local_tournament/main/dist/autodarts-tournament-assistant.meta.js
// ==/UserScript==

(function () {
  "use strict";

  const RUNTIME_GUARD_KEY = "__ATA_RUNTIME_BOOTSTRAPPED";
  const RUNTIME_GLOBAL_KEY = "__ATA_RUNTIME";
  const APP_VERSION = "__ATA_APP_VERSION__";
  const STORAGE_KEY = "ata:tournament:v1";
  const STORAGE_SCHEMA_VERSION = 5;
  const STORAGE_KO_MIGRATION_BACKUPS_KEY = "ata:tournament:ko-migration-backups:v2";
  const SAVE_DEBOUNCE_MS = 150;
  const UI_HOST_ID = "ata-ui-host";
  const TOGGLE_EVENT = "ata:toggle-request";
  const READY_EVENT = "ata:ready";
  const LOADER_GUARD_KEY = "__ATA_LOADER_BOOTSTRAPPED";
  const LOADER_MENU_ITEM_ID = "ata-loader-menu-item";
  const API_PROVIDER = "api.autodarts.io";
  const API_GS_BASE = `https://${API_PROVIDER}/gs/v0`;
  const API_AS_BASE = `https://${API_PROVIDER}/as/v0`;
  const API_AUTH_BASE = `https://${API_PROVIDER}/auth/v1`;
  const API_AUTH_CLIENT_ID = "autodarts-play";
  const API_SYNC_INTERVAL_MS = 2500;
  const API_AUTH_NOTICE_THROTTLE_MS = 15000;
  const API_REQUEST_TIMEOUT_MS = 12000;
  const REPO_BLOB_BASE_URL = "https://github.com/thomasasen/autodarts_local_tournament/blob/main";
  const README_BASE_URL = "https://github.com/thomasasen/autodarts_local_tournament/blob/main/README.md";
  const USER_GUIDE_DOC_URL = `${REPO_BLOB_BASE_URL}/docs/einstieg.md`;
  const ORGANIZER_GUIDE_DOC_URL = `${REPO_BLOB_BASE_URL}/docs/veranstalter-handbuch.md`;
  const GLOSSARY_DOC_URL = `${REPO_BLOB_BASE_URL}/docs/begriffe.md`;
  const STATUS_MESSAGES_DOC_URL = `${REPO_BLOB_BASE_URL}/docs/status-und-fehler.md`;
  const README_SETTINGS_URL = `${ORGANIZER_GUIDE_DOC_URL}#einstellungen-und-automatik`;
  const README_INFO_SYMBOLS_URL = `${USER_GUIDE_DOC_URL}#hilfe-direkt-in-der-oberflaeche`;
  const README_TOURNAMENT_MODES_URL = `${USER_GUIDE_DOC_URL}#welcher-turniermodus-passt`;
  const README_TOURNAMENT_CREATE_URL = `${USER_GUIDE_DOC_URL}#erstes-turnier-in-fuenf-minuten`;
  const README_PRESET_CATALOG_URL = `${ORGANIZER_GUIDE_DOC_URL}#formatvorlagen-und-spielregeln`;
  const README_API_AUTOMATION_URL = `${USER_GUIDE_DOC_URL}#match-starten-und-ergebnis-speichern`;
  const DRA_GUI_RULES_DOC_URL = `${REPO_BLOB_BASE_URL}/docs/dra-regeln-gui.md`;
  const DRA_GUI_RULE_MODE_FORMATS_URL = `${DRA_GUI_RULES_DOC_URL}#dra-gui-rule-mode-formats`;
  const DRA_GUI_RULE_OPEN_DRAW_URL = `${DRA_GUI_RULES_DOC_URL}#dra-gui-rule-open-draw`;
  const DRA_GUI_RULE_DRAW_LOCK_URL = `${DRA_GUI_RULES_DOC_URL}#dra-gui-rule-draw-lock`;
  const DRA_GUI_RULE_PARTICIPANT_LIMITS_URL = `${DRA_GUI_RULES_DOC_URL}#dra-gui-rule-participant-limits`;
  const DRA_GUI_RULE_THIRD_PLACE_URL = `${DRA_GUI_RULES_DOC_URL}#dra-gui-rule-third-place`;
  const DRA_GUI_RULE_BYE_URL = `${DRA_GUI_RULES_DOC_URL}#dra-gui-rule-bye`;
  const DRA_GUI_RULE_TIE_BREAK_URL = `${DRA_GUI_RULES_DOC_URL}#dra-gui-rule-tie-break`;
  const DRA_GUI_RULE_CHECKLIST_URL = `${DRA_GUI_RULES_DOC_URL}#dra-gui-rule-checklist`;
  const PDC_DRA_COMPLIANCE_DOC_URL = `${REPO_BLOB_BASE_URL}/docs/pdc-dra-compliance.md`;
  const PDC_DRA_COMPLIANCE_GROUPS_URL = `${PDC_DRA_COMPLIANCE_DOC_URL}#pdc-dra-groups-resolution`;
  const PDC_DRA_COMPLIANCE_KO_URL = `${PDC_DRA_COMPLIANCE_DOC_URL}#pdc-dra-ko`;
  const PDC_DRA_COMPLIANCE_PRELIMINARY_FINAL_URL = `${PDC_DRA_COMPLIANCE_DOC_URL}#pdc-dra-preliminary-final`;
  const PDC_DRA_COMPLIANCE_PRESET_URL = `${PDC_DRA_COMPLIANCE_DOC_URL}#pdc-dra-preset-logic`;
  const PDC_EUROPEAN_TOUR_FORMAT_URL = "https://www.pdc-europe.tv/tournaments/et-2026-en/european-darts-open-2026/";
  const TOURNAMENT_DURATION_DOC_URL = `${REPO_BLOB_BASE_URL}/docs/tournament-duration.md`;
  const TOURNAMENT_DURATION_PARAMETERS_URL = `${TOURNAMENT_DURATION_DOC_URL}#tournament-duration-parameters`;
  const TOURNAMENT_DURATION_TIME_PROFILES_URL = `${TOURNAMENT_DURATION_DOC_URL}#tournament-duration-time-profiles`;
  const USERSCRIPT_DOWNLOAD_URL = "https://raw.githubusercontent.com/thomasasen/autodarts_local_tournament/main/dist/autodarts-tournament-assistant.user.js";
  const USERSCRIPT_UPDATE_URL = "https://raw.githubusercontent.com/thomasasen/autodarts_local_tournament/main/dist/autodarts-tournament-assistant.meta.js";
  const USERSCRIPT_LOADER_URL = "https://github.com/thomasasen/autodarts_local_tournament/raw/refs/heads/main/installer/Autodarts%20Tournament%20Assistant%20Loader.user.js";
  const UPDATE_STATUS_STORAGE_KEY = "ata:update-status:v1";
  const UPDATE_CHECK_TTL_MS = 60 * 60 * 1000;
  const UPDATE_AUTO_CHECK_INTERVAL_MS = 15 * 60 * 1000;
  const UPDATE_CACHE_BUST_PARAM = "_ata_ts";

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
  const MATCH_STAGE_PRELIMINARY = "preliminary";
  const PRELIMINARY_PAIRING_METHOD_BALANCED_REGULAR = "balanced_regular";
  const PRELIMINARY_MATCH_FORMAT_FIXED_LEGS = "fixed_legs";
  const PRELIMINARY_FIXED_LEG_COUNT = 2;
  const FINAL_STAGE_TYPE_KO = "ko";
  const FINAL_STAGE_TYPE_DOUBLE_KO = "double_ko";
  const FINAL_STAGE_TYPES = Object.freeze([FINAL_STAGE_TYPE_KO, FINAL_STAGE_TYPE_DOUBLE_KO]);
  const KO_ENGINE_VERSION = 3;
  const KO_DRAW_MODE_SEEDED = "seeded";
  const KO_DRAW_MODE_OPEN_DRAW = "open_draw";
  const GRAND_FINAL_RESET_IF_NEEDED = "if_needed";
  const GRAND_FINAL_RESET_SINGLE_MATCH = "single_match";
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
  const TOURNAMENT_DURATION_DEFAULT_BOARD_COUNT = 1;
  const TOURNAMENT_DURATION_MAX_BOARD_COUNT = 32;
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
  const GROUPS_KO_ODD_PARTICIPANT_POLICY_REQUIRE_EVEN = "require_even";
  const GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL = "allow_unequal";
  const GROUPS_KO_ODD_PARTICIPANT_POLICIES = Object.freeze([
    GROUPS_KO_ODD_PARTICIPANT_POLICY_REQUIRE_EVEN,
    GROUPS_KO_ODD_PARTICIPANT_POLICY_ALLOW_UNEQUAL,
  ]);
  const GROUPS_KO_QUALIFIERS_PER_GROUP = 2;
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
    { id: "io", label: "Sichern" },
    { id: "settings", label: "Einstellungen" },
  ]);

  const TECHNICAL_PARTICIPANT_HARD_MAX = 128;
  const MODE_PARTICIPANT_LIMITS = Object.freeze({
    ko: Object.freeze({ label: "KO", min: 2, max: 128 }),
    double_ko: Object.freeze({ label: "Doppel-KO", min: 2, max: 32 }),
    league: Object.freeze({ label: "Liga", min: 2, max: 16 }),
    groups_ko: Object.freeze({ label: "Gruppenphase + KO", min: 4, max: 16 }),
    preliminary_final: Object.freeze({ label: "Vorrunde + Finalphase", min: 5, max: 16 }),
  });
  const CREATE_MODE_RULE_FIELDS = Object.freeze({
    ko: Object.freeze(["randomizeKoRound1", "enableThirdPlaceMatch"]),
    double_ko: Object.freeze(["randomizeKoRound1", "grandFinalResetMode"]),
    league: Object.freeze([]),
    groups_ko: Object.freeze([
      "groupsKoOddParticipantPolicy",
      "groupsKoOddParticipantAcknowledged",
    ]),
    preliminary_final: Object.freeze([
      "preliminaryMatchesPerParticipant",
      "preliminaryWinPoints",
      "preliminaryDrawPoints",
      "preliminaryLossPoints",
      "finalStageType",
      "finalStageQualifierCount",
      "finalStageBestOfLegs",
    ]),
  });
  const CREATE_MODE_RULE_GROUPS = Object.freeze({
    ko: Object.freeze(["ko_draw", "third_place"]),
    double_ko: Object.freeze(["ko_draw", "grand_final"]),
    league: Object.freeze(["league_empty"]),
    groups_ko: Object.freeze(["groups_ko"]),
    preliminary_final: Object.freeze(["preliminary_final"]),
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


