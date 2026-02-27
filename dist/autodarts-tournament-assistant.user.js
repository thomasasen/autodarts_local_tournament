// ==UserScript==
// @name         Autodarts Tournament Assistant
// @namespace    https://github.com/thomasasen/autodarts_local_tournament
// @version      0.3.3
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
  const APP_VERSION = "0.3.3";
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
  const ATA_UI_MAIN_CSS = `      :host {
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
        --ata-control-bg: rgba(16, 30, 62, 0.72);
        --ata-control-bg-hover: rgba(23, 40, 82, 0.82);
        --ata-control-bg-disabled: rgba(17, 27, 49, 0.55);
        --ata-control-border: rgba(181, 201, 243, 0.36);
        --ata-control-border-strong: rgba(210, 223, 255, 0.62);
        --ata-z-overlay: 2147483000;
        color: var(--ata-color-text);
        font-family: var(--ata-font-body);
        font-size: 19px;
        line-height: 1.4;
        color-scheme: dark;
      }

      .ata-root {
        position: fixed;
        inset: 0;
        z-index: var(--ata-z-overlay);
        display: grid;
        place-items: center;
        padding: 4px;
        box-sizing: border-box;
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
        position: relative;
        z-index: 1;
        width: calc(100vw - 8px);
        height: calc(100vh - 8px);
        max-height: calc(100vh - 8px);
        display: grid;
        grid-template-rows: auto auto auto 1fr;
        border-radius: 10px;
        overflow: hidden;
        opacity: 0;
        visibility: hidden;
        transform: translateY(22px) scale(0.985);
        transition: transform 220ms ease, opacity 220ms ease, visibility 0ms linear 220ms;
        background: linear-gradient(180deg, var(--ata-color-bg-panel), var(--ata-color-bg-panel-2) 42%, var(--ata-color-bg));
        box-shadow: var(--ata-shadow-lg);
        border: 1px solid var(--ata-color-border);
        pointer-events: auto;
      }

      .ata-root[data-open="1"] {
        pointer-events: auto;
      }

      .ata-root[data-open="1"] .ata-overlay {
        opacity: 1;
      }

      .ata-root[data-open="1"] .ata-drawer {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
        transition: transform 220ms ease, opacity 220ms ease, visibility 0ms linear 0ms;
      }

      .ata-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--ata-space-3);
        padding: 12px 18px 10px;
        border-bottom: 1px solid var(--ata-color-border);
        background: rgba(255, 255, 255, 0.03);
      }

      .ata-title-wrap {
        display: flex;
        align-items: baseline;
        gap: 8px;
        flex-wrap: wrap;
        min-width: 0;
      }

      .ata-title-wrap h2 {
        margin: 0;
        font-family: var(--ata-font-head);
        letter-spacing: 0.3px;
        font-size: 27px;
        line-height: 1;
        text-transform: uppercase;
      }

      .ata-title-wrap p {
        margin: 0;
        color: var(--ata-color-muted);
        font-size: 14px;
        line-height: 1.2;
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
        padding: 9px 16px;
        font-size: 18px;
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

      .ata-runtime-statusbar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        padding: 10px 20px;
        border-bottom: 1px solid var(--ata-color-border);
        background: rgba(255, 255, 255, 0.05);
      }

      .ata-status-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        background: rgba(255, 255, 255, 0.1);
        color: var(--ata-color-text);
        padding: 4px 10px;
        font-size: 15px;
        line-height: 1.2;
        white-space: nowrap;
      }

      .ata-status-pill.ata-status-ok {
        border-color: rgba(90, 210, 153, 0.5);
        background: rgba(90, 210, 153, 0.2);
      }

      .ata-status-pill.ata-status-warn {
        border-color: rgba(252, 129, 129, 0.55);
        background: rgba(252, 129, 129, 0.2);
      }

      .ata-status-pill.ata-status-info {
        border-color: rgba(153, 160, 245, 0.56);
        background: rgba(114, 121, 224, 0.24);
      }

      .ata-status-pill.ata-status-neutral {
        border-color: rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.08);
      }

      .ata-runtime-hint {
        color: var(--ata-color-muted);
        font-size: 15px;
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
        font-size: 26px;
        font-family: var(--ata-font-body);
        font-weight: 700;
      }

      .ata-heading-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: var(--ata-space-3);
      }

      .ata-heading-row h3 {
        margin: 0;
      }

      .ata-help-links {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      .ata-help-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.38);
        background: rgba(255, 255, 255, 0.11);
        color: #f4f7ff;
        text-decoration: none;
        font-size: 12px;
        font-weight: 700;
        line-height: 1;
        transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
      }

      .ata-help-link-tech {
        border-color: rgba(153, 184, 245, 0.62);
        background: rgba(153, 184, 245, 0.2);
        color: #e8efff;
      }

      .ata-help-link-rule {
        border-color: rgba(90, 210, 153, 0.62);
        background: rgba(90, 210, 153, 0.18);
        color: #baf5da;
      }

      .ata-help-link:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.62);
        transform: translateY(-1px);
      }

      .ata-help-link:focus-visible {
        outline: none;
        border-color: var(--ata-color-focus);
        box-shadow: 0 0 0 2px rgba(255, 211, 79, 0.24);
      }

      .ata-grid-2 {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--ata-space-3);
      }

      .ata-grid-3 {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--ata-space-3);
      }

      .ata-grid-3-tight {
        gap: 10px;
      }

      .ata-field-span-3 {
        grid-column: 1 / -1;
      }

      .ata-create-form {
        display: grid;
        gap: 10px;
      }

      .ata-create-layout {
        display: grid;
        grid-template-columns: minmax(0, 2.35fr) minmax(300px, 1fr);
        gap: 12px;
        align-items: start;
      }

      .ata-create-main,
      .ata-create-side {
        display: grid;
        gap: 10px;
      }

      .ata-create-side {
        border: 1px solid var(--ata-color-border);
        border-radius: var(--ata-radius-md);
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
      }

      .ata-field {
        display: grid;
        gap: var(--ata-space-1);
      }

      .ata-field label {
        color: var(--ata-color-muted);
        font-size: 15px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }

      .ata-field input,
      .ata-field select,
      .ata-field textarea {
        width: 100%;
        border-radius: var(--ata-radius-sm);
        border: 1px solid var(--ata-control-border);
        background: var(--ata-control-bg);
        color: var(--ata-color-text);
        padding: 11px 12px;
        font-size: 18px;
        font-weight: 600;
        box-sizing: border-box;
        transition: border-color 120ms ease, box-shadow 120ms ease, background 120ms ease, color 120ms ease;
      }

      .ata-field input:focus,
      .ata-field select:focus,
      .ata-field textarea:focus {
        outline: none;
        border-color: var(--ata-color-focus);
        box-shadow: 0 0 0 2px rgba(255, 211, 79, 0.26);
        background: var(--ata-control-bg-hover);
      }

      .ata-field textarea {
        min-height: 92px;
        resize: vertical;
      }

      .ata-create-form .ata-field label {
        font-size: 13px;
        letter-spacing: 0.35px;
      }

      .ata-create-form .ata-field input,
      .ata-create-form .ata-field select,
      .ata-create-form .ata-field textarea {
        padding: 9px 10px;
        font-size: 16px;
        line-height: 1.25;
      }

      .ata-create-form #ata-participants {
        min-height: clamp(190px, 30vh, 320px);
      }

      .ata-field-readonly {
        display: flex;
        align-items: center;
        width: 100%;
        border-radius: var(--ata-radius-sm);
        border: 1px solid rgba(185, 199, 236, 0.22);
        background: var(--ata-control-bg-disabled);
        color: rgba(232, 237, 255, 0.78);
        padding: 9px 10px;
        font-size: 16px;
        line-height: 1.25;
        font-weight: 600;
        box-sizing: border-box;
      }

      .ata-form-inline-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--ata-space-2);
      }

      .ata-preset-pill {
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(255, 211, 79, 0.48);
        border-radius: 999px;
        padding: 5px 11px;
        background: rgba(255, 211, 79, 0.14);
        color: #ffe39a;
        font-size: 14px;
        line-height: 1.1;
        white-space: nowrap;
      }

      .ata-score-grid select,
      .ata-score-grid input[type="number"] {
        border-radius: 8px;
        border: 1px solid var(--ata-control-border);
        background: var(--ata-control-bg);
        color: var(--ata-color-text);
        box-sizing: border-box;
        min-height: 40px;
        font-size: 17px;
        font-weight: 600;
        padding: 7px 10px;
        transition: border-color 120ms ease, box-shadow 120ms ease, background 120ms ease, color 120ms ease;
      }

      .ata-score-grid select {
        width: 100%;
        appearance: none;
        background-image:
          linear-gradient(45deg, transparent 50%, rgba(228, 238, 255, 0.92) 50%),
          linear-gradient(135deg, rgba(228, 238, 255, 0.92) 50%, transparent 50%),
          linear-gradient(to right, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.12));
        background-position:
          calc(100% - 16px) 50%,
          calc(100% - 10px) 50%,
          calc(100% - 30px) 0;
        background-size: 6px 6px, 6px 6px, 1px 100%;
        background-repeat: no-repeat;
        padding-right: 36px;
      }

      .ata-score-grid input[type="number"] {
        width: 100%;
        text-align: center;
      }

      .ata-score-grid select:hover,
      .ata-score-grid input[type="number"]:hover,
      .ata-field input:hover,
      .ata-field select:hover,
      .ata-field textarea:hover {
        background: var(--ata-control-bg-hover);
        border-color: var(--ata-control-border-strong);
      }

      .ata-score-grid select:focus,
      .ata-score-grid input[type="number"]:focus {
        outline: none;
        border-color: var(--ata-color-focus);
        box-shadow: 0 0 0 2px rgba(255, 211, 79, 0.22);
        background: var(--ata-control-bg-hover);
      }

      .ata-score-grid select:disabled,
      .ata-score-grid input[type="number"]:disabled,
      .ata-field input:disabled,
      .ata-field select:disabled,
      .ata-field textarea:disabled {
        background: var(--ata-control-bg-disabled);
        color: rgba(229, 236, 255, 0.56);
        border-color: rgba(185, 199, 236, 0.2);
        cursor: not-allowed;
      }

      .ata-drawer input::placeholder,
      .ata-drawer textarea::placeholder {
        color: rgba(220, 230, 255, 0.62);
      }

      .ata-drawer select option {
        background: #2d3e76;
        color: #eff3ff;
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
        padding: 11px 15px;
        font-size: 17px;
        cursor: pointer;
        transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
      }

      .ata-btn-sm {
        padding: 7px 10px;
        font-size: 14px;
        line-height: 1.2;
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
        padding: 2px 9px;
        margin-right: 6px;
        margin-bottom: 6px;
        font-size: 13px;
      }

      .ata-tournament-title {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .ata-tournament-mode-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 2px 10px;
        border: 1px solid rgba(153, 160, 245, 0.56);
        background: rgba(114, 121, 224, 0.22);
        color: #dce2ff;
        font-size: 13px;
        font-weight: 700;
      }

      .ata-tournament-meta {
        display: grid;
        gap: 8px;
        margin-top: 8px;
      }

      .ata-meta-block {
        display: grid;
        gap: 5px;
      }

      .ata-meta-heading {
        color: var(--ata-color-muted);
        font-size: 12px;
        letter-spacing: 0.35px;
        text-transform: uppercase;
      }

      .ata-info-tag-cloud {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin: 0;
      }

      .ata-info-tag {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.24);
        background: rgba(255, 255, 255, 0.08);
        color: rgba(236, 242, 255, 0.92);
        font-size: 12px;
        line-height: 1.2;
        padding: 2px 8px;
        white-space: nowrap;
      }

      .ata-info-tag.ata-info-tag-key {
        background: rgba(114, 121, 224, 0.22);
        border-color: rgba(153, 160, 245, 0.52);
        color: #dce2ff;
        font-weight: 700;
      }

      .ata-info-tag.ata-info-tag-accent {
        background: rgba(90, 210, 153, 0.16);
        border-color: rgba(90, 210, 153, 0.44);
        color: #7be7b5;
      }

      .ata-player-chip-cloud {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }

      .ata-player-chip {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid rgba(188, 205, 245, 0.4);
        background: rgba(34, 53, 98, 0.62);
        color: #eaf0ff;
        font-size: 13px;
        line-height: 1.2;
        padding: 2px 9px;
      }

      .ata-player-chip-count {
        color: #a9bce8;
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
        font-size: 17px;
      }

      .ata-table th,
      .ata-table td {
        text-align: left;
        border-bottom: 1px solid rgba(157, 180, 197, 0.16);
        padding: 10px 12px;
        vertical-align: middle;
      }

      .ata-table th {
        color: var(--ata-color-muted);
        font-weight: 600;
        text-transform: uppercase;
        font-size: 15px;
        letter-spacing: 0.4px;
      }

      .ata-table tbody tr:nth-of-type(odd) {
        background: #ffffff0d;
      }

      .ata-table tbody tr:hover {
        background: #ffd9262b;
      }

      .ata-table tr.ata-row-inactive {
        background: rgba(17, 27, 49, 0.62) !important;
      }

      .ata-table tr.ata-row-inactive td {
        color: rgba(211, 223, 250, 0.78);
      }

      .ata-table tr.ata-row-completed {
        background: rgba(90, 210, 153, 0.12) !important;
      }

      .ata-table tr.ata-row-completed td {
        border-bottom-color: rgba(90, 210, 153, 0.28);
      }

      .ata-pill-open-slot {
        display: inline-block;
        color: #ffd34f;
        font-weight: 700;
      }

      .ata-match-list {
        display: grid;
        gap: 8px;
      }

      .ata-matches-card {
        max-width: min(1240px, calc(100vw - 28px));
        margin: 0 auto;
      }

      .ata-matches-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        flex-wrap: wrap;
        margin-bottom: 6px;
      }

      .ata-segmented {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 2px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.22);
        background: rgba(255, 255, 255, 0.06);
      }

      .ata-segmented-btn {
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: rgba(232, 237, 255, 0.86);
        font-size: 11px;
        line-height: 1.2;
        padding: 4px 8px;
        cursor: pointer;
      }

      .ata-segmented-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .ata-segmented-btn[data-active="1"] {
        background: rgba(255, 255, 255, 0.95);
        color: #1e2d56;
        font-weight: 700;
      }

      @keyframes ataFinalCardPulse {
        0%, 100% {
          box-shadow: 0 0 0 1px rgba(255, 224, 140, 0.38), 0 8px 18px rgba(46, 30, 8, 0.24);
        }
        50% {
          box-shadow: 0 0 0 1px rgba(255, 224, 140, 0.62), 0 12px 24px rgba(61, 37, 8, 0.38);
        }
      }

      @keyframes ataFinalBorderOrbit {
        to {
          transform: rotate(1turn);
        }
      }

      .ata-match-card {
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: var(--ata-radius-md);
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.05);
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        column-gap: 10px;
        row-gap: 6px;
        transition: background 120ms ease, border-color 120ms ease;
      }

      .ata-match-card:hover {
        background: rgba(255, 255, 255, 0.09);
        border-color: rgba(255, 255, 255, 0.32);
      }

      .ata-match-card.ata-row-inactive {
        background: rgba(17, 27, 49, 0.62);
      }

      .ata-match-card.ata-row-completed {
        background: rgba(90, 210, 153, 0.12);
        border-color: rgba(90, 210, 153, 0.35);
      }

      .ata-match-card.ata-row-live {
        background: rgba(90, 210, 153, 0.15);
        border-color: rgba(110, 231, 183, 0.62);
      }

      .ata-match-card.ata-row-ready {
        background: rgba(106, 146, 237, 0.14);
        border-color: rgba(153, 184, 245, 0.52);
      }

      .ata-match-card.ata-row-next {
        border-color: rgba(255, 255, 255, 0.46);
        box-shadow: inset 4px 0 0 rgba(255, 255, 255, 0.75);
      }

      .ata-match-card.ata-row-blocked {
        background: rgba(20, 31, 57, 0.7);
        border-color: rgba(126, 145, 196, 0.34);
      }

      .ata-match-card.ata-row-bye {
        background: rgba(255, 211, 79, 0.09);
        border-color: rgba(255, 211, 79, 0.42);
      }

      .ata-match-card.ata-row-final {
        position: relative;
        isolation: isolate;
        border-color: rgba(255, 224, 140, 0.72);
        background:
          radial-gradient(circle at 88% -66%, rgba(255, 231, 158, 0.26), transparent 52%),
          linear-gradient(180deg, rgba(255, 211, 79, 0.12), rgba(255, 255, 255, 0.06));
        animation: ataFinalCardPulse 2.6s ease-in-out infinite;
      }

      .ata-match-card.ata-row-final::before {
        content: "";
        position: absolute;
        inset: -1px;
        border-radius: inherit;
        padding: 2px;
        pointer-events: none;
        background: conic-gradient(from 0deg, rgba(255, 244, 202, 0) 0deg, rgba(255, 244, 202, 0) 270deg, rgba(255, 244, 202, 0.92) 330deg, rgba(255, 244, 202, 0) 360deg);
        -webkit-mask:
          linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        transform-origin: center center;
        animation: ataFinalBorderOrbit 2s linear infinite;
      }

      .ata-match-card.ata-row-final::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        background: radial-gradient(circle at 50% 0%, rgba(255, 228, 146, 0.2), transparent 62%);
        opacity: 0.82;
      }

      .ata-match-card.ata-row-final > * {
        position: relative;
        z-index: 1;
      }

      .ata-match-card.ata-row-final:hover {
        border-color: rgba(255, 229, 150, 0.9);
      }

      .ata-match-card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
        flex: 1 1 420px;
        min-width: 280px;
      }

      .ata-match-title-row {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 8px;
        flex-wrap: wrap;
        flex: 1 1 auto;
        min-width: 0;
      }

      .ata-match-meta-inline {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
      }

      .ata-match-advance-pill,
      .ata-match-context-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.24);
        padding: 1px 7px;
        font-size: 11px;
        line-height: 1.2;
      }

      .ata-match-advance-pill {
        border-color: rgba(90, 210, 153, 0.58);
        background: rgba(90, 210, 153, 0.22);
        color: #7be7b5;
        font-weight: 800;
        font-size: 12px;
        padding: 2px 10px;
        box-shadow: 0 0 0 1px rgba(90, 210, 153, 0.22) inset;
      }

      .ata-match-advance-pill.ata-match-advance-bye {
        border-color: rgba(255, 211, 79, 0.62);
        background: rgba(255, 211, 79, 0.2);
        color: #ffe07a;
      }

      .ata-match-context-pill {
        color: rgba(226, 234, 255, 0.88);
        border-color: rgba(188, 205, 245, 0.38);
        background: rgba(255, 255, 255, 0.08);
      }

      .ata-match-context-pill.ata-match-context-open {
        border-color: rgba(188, 205, 245, 0.38);
      }

      .ata-match-context-pill.ata-match-context-completed {
        border-color: rgba(90, 210, 153, 0.5);
        background: rgba(90, 210, 153, 0.16);
      }

      .ata-match-context-pill.ata-match-context-bye {
        border-color: rgba(255, 211, 79, 0.58);
        background: rgba(255, 211, 79, 0.16);
      }

      .ata-match-next-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.56);
        background: rgba(255, 255, 255, 0.14);
        color: #f4f7ff;
        padding: 1px 8px;
        font-size: 11px;
        line-height: 1.2;
        font-weight: 700;
        letter-spacing: 0.01em;
      }

      .ata-match-final-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid rgba(255, 224, 140, 0.85);
        background: rgba(98, 74, 18, 0.88);
        color: #fff1c5;
        padding: 1px 8px;
        font-size: 11px;
        line-height: 1.2;
        font-weight: 800;
        letter-spacing: 0.01em;
        text-shadow: 0 1px 0 rgba(63, 40, 8, 0.52);
      }

      .ata-next-hint {
        margin: 8px 0 2px 0;
        color: rgba(235, 239, 255, 0.82);
      }

      .ata-match-pairing {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 5px;
        font-size: 14px;
        line-height: 1.2;
      }

      .ata-match-pairing .ata-vs {
        color: var(--ata-color-muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.35px;
      }

      .ata-pairing-player {
        font-weight: 700;
        color: #edf3ff;
      }

      .ata-pairing-player.is-winner {
        color: #72e5b0;
      }

      .ata-pairing-player.is-champion {
        color: #ffefb9;
        border: 1px solid rgba(255, 224, 140, 0.76);
        background: rgba(98, 74, 18, 0.62);
        border-radius: 999px;
        padding: 1px 8px;
        text-shadow: 0 1px 0 rgba(57, 35, 8, 0.58);
        box-shadow: 0 0 0 1px rgba(255, 224, 140, 0.18);
      }

      .ata-pairing-player.is-loser {
        color: rgba(229, 237, 255, 0.72);
      }

      .ata-pairing-player.ata-open-slot {
        color: #ffd34f;
      }

      .ata-match-status {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 1px 7px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        background: rgba(255, 255, 255, 0.08);
        font-size: 11px;
        font-weight: 700;
        line-height: 1.2;
      }

      .ata-match-status-open {
        border-color: rgba(188, 205, 245, 0.38);
        color: #e8efff;
      }

      .ata-match-status-completed {
        border-color: rgba(90, 210, 153, 0.5);
        background: rgba(90, 210, 153, 0.18);
        color: #72e5b0;
      }

      .ata-match-status-bye {
        border-color: rgba(255, 211, 79, 0.55);
        background: rgba(255, 211, 79, 0.16);
        color: #ffd34f;
      }

      .ata-match-advance-pill.ata-match-advance-final {
        border-color: rgba(255, 224, 140, 0.82);
        background: rgba(98, 74, 18, 0.86);
        color: #fff1c5;
        box-shadow: 0 0 0 1px rgba(255, 224, 140, 0.28) inset;
      }

      .ata-score-grid {
        display: grid;
        grid-template-columns: repeat(2, 58px);
        gap: 6px;
        min-width: 0;
        align-items: center;
        width: auto;
        flex: 0 0 auto;
      }

      .ata-match-editor {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex: 1 1 100%;
        min-width: 0;
      }

      .ata-editor-actions {
        display: grid;
        grid-template-columns: minmax(100px, 126px) minmax(136px, 176px);
        gap: 6px;
        align-items: center;
        margin-left: auto;
      }

      .ata-editor-actions .ata-btn {
        min-height: 34px;
        padding: 6px 10px;
        font-size: 14px;
      }

      .ata-score-grid input[type="number"] {
        width: 100%;
        max-width: 58px;
        min-height: 30px;
        padding: 4px 7px;
        font-size: 14px;
      }

      .ata-match-note {
        font-size: 12px;
        color: var(--ata-color-muted);
        line-height: 1.25;
        width: 100%;
      }

      .ata-small {
        font-size: 13px;
        color: var(--ata-color-muted);
        line-height: 1.3;
      }

      .ata-group-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: var(--ata-space-3);
      }

      .ata-bracket-dock {
        position: relative;
      }

      .ata-bracket-shell {
        border: 1px solid var(--ata-color-border);
        border-radius: var(--ata-radius-md);
        overflow: hidden;
        background: rgba(255, 255, 255, 0.04);
        min-height: 620px;
      }

      .ata-bracket-frame {
        width: 100%;
        min-height: 620px;
        height: 620px;
        border: 0;
        background: transparent;
      }

      .ata-bracket-fallback {
        display: none;
        padding: var(--ata-space-3);
        background: rgba(255, 255, 255, 0.05);
        border-top: 1px solid var(--ata-color-border);
      }

      .ata-bracket-fallback[data-visible="1"] {
        display: block;
      }

      @media (prefers-reduced-motion: reduce) {
        .ata-match-card.ata-row-final,
        .ata-match-card.ata-row-final::before {
          animation: none;
        }
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

      .ata-bracket-round:last-child {
        border-color: rgba(255, 224, 140, 0.68);
        background: linear-gradient(180deg, rgba(255, 211, 79, 0.2), rgba(255, 211, 79, 0.06) 48%, rgba(255, 255, 255, 0.02));
        box-shadow: inset 0 0 0 1px rgba(255, 224, 140, 0.2), 0 8px 18px rgba(48, 32, 8, 0.18);
      }

      .ata-bracket-round:last-child > strong {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #fff4cb;
        text-shadow: 0 1px 0 rgba(58, 36, 8, 0.45);
      }

      .ata-bracket-round:last-child > strong::before {
        content: "🏆";
      }

      .ata-bracket-match {
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 6px;
        margin-top: 8px;
        background: #ffffff0d;
        display: grid;
        gap: 4px;
      }

      .ata-bracket-round:last-child .ata-bracket-match {
        border-color: rgba(255, 224, 140, 0.62);
        background:
          radial-gradient(circle at 84% -32%, rgba(255, 228, 146, 0.22), transparent 56%),
          linear-gradient(180deg, rgba(255, 211, 79, 0.12), rgba(255, 255, 255, 0.05));
        box-shadow: 0 0 0 1px rgba(255, 224, 140, 0.18);
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

      .ata-toggle-compact {
        padding: 8px 10px;
        margin-bottom: 0;
      }

      .ata-create-help {
        margin: 0;
        font-size: 14px;
      }

      .ata-toggle input {
        width: 18px;
        height: 18px;
        accent-color: var(--ata-color-accent);
      }

      @media (max-width: 1250px) {
        .ata-grid-3 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .ata-create-layout {
          grid-template-columns: 1fr;
        }

        .ata-match-card {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
          align-items: stretch;
        }

        .ata-match-card-head {
          min-width: 0;
        }

        .ata-score-grid {
          grid-template-columns: repeat(2, 58px);
          width: auto;
        }

        .ata-match-editor {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
          align-items: stretch;
        }

        .ata-editor-actions {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          width: 100%;
          margin-left: 0;
        }
      }

      @media (max-width: 820px) {
        .ata-root {
          padding: 2px;
        }

        .ata-drawer {
          width: calc(100vw - 4px);
          height: calc(100vh - 4px);
          max-height: calc(100vh - 4px);
          border-radius: 8px;
        }

        .ata-grid-2 {
          grid-template-columns: 1fr;
        }

        .ata-grid-3 {
          grid-template-columns: 1fr;
        }

        .ata-runtime-statusbar {
          padding: 10px 14px;
        }

        .ata-header {
          align-items: flex-start;
          padding: 9px 12px;
          gap: 8px;
        }

        .ata-title-wrap {
          gap: 6px;
        }

        .ata-title-wrap h2 {
          font-size: 21px;
          letter-spacing: 0.2px;
        }

        .ata-title-wrap p {
          margin: 0;
          font-size: 12px;
          line-height: 1.2;
        }

        .ata-close-btn {
          padding: 6px 10px;
          font-size: 14px;
        }

        .ata-bracket-shell {
          min-height: 420px;
        }

        .ata-bracket-frame {
          min-height: 420px;
          height: 420px;
        }

        .ata-match-pairing {
          font-size: 15px;
        }

        .ata-score-grid {
          grid-template-columns: repeat(2, 58px);
        }

        .ata-editor-actions {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          width: 100%;
        }

      }
    `;
  const ATA_PDC_LOGO_DATA_URI = "data:image/png;base64,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";

  const STATUS_COMPLETED = "completed";
  const STATUS_PENDING = "pending";
  const MATCH_STAGE_KO = "ko";
  const MATCH_STAGE_GROUP = "group";
  const MATCH_STAGE_LEAGUE = "league";
  const KO_ENGINE_VERSION = 3;
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
      frameHeight: 0,
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
    matchReturnShortcut: {
      root: null,
      syncing: false,
      inlineSyncingByLobby: {},
      inlineOutcomeByLobby: {},
    },
    runtimeStatusSignature: "",
    cleanupStack: [],
  };

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


  function renderInfoLinks(links) {
    if (!Array.isArray(links) || !links.length) {
      return "";
    }

    const linksHtml = links
      .map((entry) => {
        const href = String(entry?.href || "").trim();
        if (!href) {
          return "";
        }
        const kind = normalizeToken(entry?.kind || "tech");
        const isRuleLink = kind === "rule" || kind === "rules" || kind === "regel";
        const symbol = isRuleLink ? "§" : "ⓘ";
        const className = isRuleLink
          ? "ata-help-link ata-help-link-rule"
          : "ata-help-link ata-help-link-tech";
        const label = normalizeText(entry?.label) || "Mehr Informationen";
        const title = normalizeText(entry?.title) || label;
        return `
          <a
            class="${className}"
            href="${escapeHtml(href)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${escapeHtml(label)}"
            title="${escapeHtml(title)}"
          >${symbol}</a>
        `;
      })
      .filter(Boolean)
      .join("");

    if (!linksHtml) {
      return "";
    }

    return `<span class="ata-help-links">${linksHtml}</span>`;
  }


  function renderSectionHeading(title, links = []) {
    return `
      <div class="ata-heading-row">
        <h3>${escapeHtml(title)}</h3>
        ${renderInfoLinks(links)}
      </div>
    `;
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

  function createDefaultCreateDraft(settings = null) {
    const defaultRandomize = settings?.featureFlags?.randomizeKoRound1 !== false;
    const pdcSettings = buildPdcX01Settings();
    return {
      name: "",
      mode: "ko",
      bestOfLegs: 5,
      startScore: pdcSettings.baseScore,
      x01Preset: pdcSettings.presetId,
      x01InMode: pdcSettings.inMode,
      x01OutMode: pdcSettings.outMode,
      x01BullMode: pdcSettings.bullMode,
      x01MaxRounds: pdcSettings.maxRounds,
      x01BullOffMode: pdcSettings.bullOffMode,
      lobbyVisibility: pdcSettings.lobbyVisibility,
      participantsText: "",
      randomizeKoRound1: Boolean(defaultRandomize),
    };
  }


  function normalizeCreateDraft(rawDraft, settings = null) {
    const base = createDefaultCreateDraft(settings);
    const modeRaw = normalizeText(rawDraft?.mode || base.mode);
    const mode = ["ko", "league", "groups_ko"].includes(modeRaw) ? modeRaw : base.mode;
    const hasDraftObject = rawDraft && typeof rawDraft === "object";
    const hasExplicitPreset = hasDraftObject && Object.prototype.hasOwnProperty.call(rawDraft, "x01Preset");
    const rawPreset = hasExplicitPreset
      ? sanitizeX01Preset(rawDraft?.x01Preset, base.x01Preset)
      : (hasDraftObject ? X01_PRESET_CUSTOM : base.x01Preset);
    let x01Settings = normalizeTournamentX01Settings({
      presetId: rawPreset,
      baseScore: rawDraft?.startScore ?? base.startScore,
      inMode: rawDraft?.x01InMode ?? base.x01InMode,
      outMode: rawDraft?.x01OutMode ?? base.x01OutMode,
      bullMode: rawDraft?.x01BullMode ?? base.x01BullMode,
      maxRounds: rawDraft?.x01MaxRounds ?? base.x01MaxRounds,
      bullOffMode: rawDraft?.x01BullOffMode ?? base.x01BullOffMode,
      lobbyVisibility: rawDraft?.lobbyVisibility ?? base.lobbyVisibility,
    }, rawDraft?.startScore ?? base.startScore);
    if (rawPreset === X01_PRESET_PDC_STANDARD) {
      x01Settings = buildPdcX01Settings();
    }
    return {
      name: normalizeText(rawDraft?.name || base.name),
      mode,
      bestOfLegs: sanitizeBestOf(rawDraft?.bestOfLegs ?? base.bestOfLegs),
      startScore: x01Settings.baseScore,
      x01Preset: x01Settings.presetId,
      x01InMode: x01Settings.inMode,
      x01OutMode: x01Settings.outMode,
      x01BullMode: x01Settings.bullMode,
      x01MaxRounds: x01Settings.maxRounds,
      x01BullOffMode: x01Settings.bullOffMode,
      lobbyVisibility: x01Settings.lobbyVisibility,
      participantsText: String(rawDraft?.participantsText ?? base.participantsText),
      randomizeKoRound1: typeof rawDraft?.randomizeKoRound1 === "boolean"
        ? rawDraft.randomizeKoRound1
        : base.randomizeKoRound1,
    };
  }


  function createDefaultStore() {
    const settings = {
      debug: false,
      featureFlags: {
        autoLobbyStart: false,
        randomizeKoRound1: true,
        koDrawLockDefault: true,
      },
    };
    return {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      settings,
      ui: {
        activeTab: "tournament",
        matchesSortMode: MATCH_SORT_MODE_READY_FIRST,
        createDraft: createDefaultCreateDraft(settings),
      },
      tournament: null,
    };
  }


  function normalizeKoDrawMode(value, fallback = KO_DRAW_MODE_SEEDED) {
    const mode = normalizeText(value || "").toLowerCase();
    if (mode === KO_DRAW_MODE_OPEN_DRAW || mode === KO_DRAW_MODE_SEEDED) {
      return mode;
    }
    return fallback;
  }


  function normalizeKoEngineVersion(value, fallback = 0) {
    const parsed = clampInt(value, fallback, 0, KO_ENGINE_VERSION);
    return parsed > KO_ENGINE_VERSION ? KO_ENGINE_VERSION : parsed;
  }


  function normalizeMatchResultKind(value) {
    const normalized = normalizeText(value || "").toLowerCase();
    return normalized === "bye" ? "bye" : null;
  }


  function isByePlaceholderValue(value) {
    const token = normalizeToken(value);
    return Boolean(token) && BYE_PLACEHOLDER_TOKENS.has(token);
  }


  function sanitizeBestOf(value) {
    let bestOf = clampInt(value, 5, 1, 21);
    if (bestOf % 2 === 0) {
      bestOf += 1;
    }
    return bestOf;
  }


  function sanitizeStartScore(value) {
    const allowed = new Set(X01_START_SCORE_OPTIONS);
    const score = clampInt(value, 501, 121, 901);
    return allowed.has(score) ? score : 501;
  }


  function getLegsToWin(bestOfLegs) {
    const bestOf = sanitizeBestOf(bestOfLegs);
    return Math.floor(bestOf / 2) + 1;
  }


  function sanitizeX01Preset(value, fallback = X01_PRESET_PDC_STANDARD) {
    const preset = normalizeText(value || "").toLowerCase();
    if (preset === X01_PRESET_CUSTOM || preset === X01_PRESET_PDC_STANDARD) {
      return preset;
    }
    return fallback;
  }


  function sanitizeX01Mode(value, allowedModes, fallback) {
    const mode = normalizeText(value || "");
    return allowedModes.includes(mode) ? mode : fallback;
  }


  function sanitizeX01InMode(value) {
    return sanitizeX01Mode(value, X01_IN_MODES, "Straight");
  }


  function sanitizeX01OutMode(value) {
    return sanitizeX01Mode(value, X01_OUT_MODES, "Double");
  }


  function sanitizeX01BullMode(value) {
    return sanitizeX01Mode(value, X01_BULL_MODES, "25/50");
  }


  function sanitizeX01BullOffMode(value) {
    return sanitizeX01Mode(value, X01_BULL_OFF_MODES, "Normal");
  }


  function sanitizeX01MaxRounds(value) {
    const rounds = clampInt(value, 50, 15, 80);
    return X01_MAX_ROUNDS_OPTIONS.includes(rounds) ? rounds : 50;
  }


  function sanitizeMatchesSortMode(value, fallback = MATCH_SORT_MODE_READY_FIRST) {
    const mode = normalizeText(value || "").toLowerCase();
    return MATCH_SORT_MODES.includes(mode) ? mode : fallback;
  }


  function sanitizeLobbyVisibility(value) {
    void value;
    return "private";
  }


  function mapLegacyTieBreakModeToProfile(value, fallback = TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE) {
    const mode = normalizeText(value || "").toLowerCase();
    if (mode === LEGACY_TIE_BREAK_MODE_DRA_STRICT) {
      return TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE;
    }
    if (mode === LEGACY_TIE_BREAK_MODE_LEGACY) {
      return TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF;
    }
    return fallback;
  }


  function normalizeTieBreakProfile(value, fallback = TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE) {
    const profile = normalizeText(value || "").toLowerCase();
    if (TIE_BREAK_PROFILES.includes(profile)) {
      return profile;
    }
    return mapLegacyTieBreakModeToProfile(value, fallback);
  }


  function normalizeTournamentRules(rawRules) {
    const rules = rawRules && typeof rawRules === "object" ? rawRules : {};
    const tieBreakRaw = Object.prototype.hasOwnProperty.call(rules, "tieBreakProfile")
      ? rules.tieBreakProfile
      : rules.tieBreakMode;
    return {
      tieBreakProfile: normalizeTieBreakProfile(tieBreakRaw, TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE),
    };
  }


  function buildPdcX01Settings() {
    return {
      presetId: X01_PRESET_PDC_STANDARD,
      variant: X01_VARIANT,
      baseScore: 501,
      inMode: "Straight",
      outMode: "Double",
      bullMode: "25/50",
      maxRounds: 50,
      bullOffMode: "Normal",
      lobbyVisibility: "private",
    };
  }


  function normalizeTournamentX01Settings(rawX01, fallbackStartScore = 501) {
    const hasRawObject = rawX01 && typeof rawX01 === "object";
    const input = hasRawObject ? rawX01 : {};
    const rawPreset = normalizeText(input.presetId || input.preset || "").toLowerCase();
    const hasExplicitPreset = Boolean(rawPreset);
    const presetId = hasExplicitPreset ? sanitizeX01Preset(rawPreset, X01_PRESET_CUSTOM) : X01_PRESET_CUSTOM;

    if (presetId === X01_PRESET_PDC_STANDARD) {
      return buildPdcX01Settings();
    }

    return {
      presetId: X01_PRESET_CUSTOM,
      variant: X01_VARIANT,
      baseScore: sanitizeStartScore(input.baseScore ?? fallbackStartScore),
      inMode: sanitizeX01InMode(input.inMode),
      outMode: sanitizeX01OutMode(input.outMode),
      bullMode: sanitizeX01BullMode(input.bullMode),
      maxRounds: sanitizeX01MaxRounds(input.maxRounds),
      bullOffMode: sanitizeX01BullOffMode(input.bullOffMode || input.bullOff),
      lobbyVisibility: sanitizeLobbyVisibility(input.lobbyVisibility ?? input.isPrivate),
    };
  }


  function isPdcX01Settings(input) {
    const pdc = buildPdcX01Settings();
    const fallbackStartScore = input?.baseScore ?? input?.startScore ?? pdc.baseScore;
    const normalized = normalizeTournamentX01Settings({
      presetId: X01_PRESET_CUSTOM,
      baseScore: fallbackStartScore,
      inMode: input?.inMode ?? input?.x01InMode,
      outMode: input?.outMode ?? input?.x01OutMode,
      bullMode: input?.bullMode ?? input?.x01BullMode,
      maxRounds: input?.maxRounds ?? input?.x01MaxRounds,
      bullOffMode: input?.bullOffMode ?? input?.x01BullOffMode,
      lobbyVisibility: input?.lobbyVisibility,
    }, fallbackStartScore);
    return normalized.baseScore === pdc.baseScore
      && normalized.inMode === pdc.inMode
      && normalized.outMode === pdc.outMode
      && normalized.bullMode === pdc.bullMode
      && normalized.maxRounds === pdc.maxRounds
      && normalized.bullOffMode === pdc.bullOffMode
      && normalized.lobbyVisibility === pdc.lobbyVisibility;
  }


  function isPdcCompliantMatchSetup(input) {
    const mode = normalizeText(input?.mode || "").toLowerCase();
    if (mode !== "ko") {
      return false;
    }
    if (sanitizeBestOf(input?.bestOfLegs) < 3) {
      return false;
    }
    const x01Input = input?.x01 && typeof input.x01 === "object"
      ? input.x01
      : {
        baseScore: input?.startScore ?? input?.baseScore,
        inMode: input?.x01InMode ?? input?.inMode,
        outMode: input?.x01OutMode ?? input?.outMode,
        bullMode: input?.x01BullMode ?? input?.bullMode,
        maxRounds: input?.x01MaxRounds ?? input?.maxRounds,
        bullOffMode: input?.x01BullOffMode ?? input?.bullOffMode,
        lobbyVisibility: input?.lobbyVisibility,
      };
    return isPdcX01Settings(x01Input);
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


  function normalizeStoredMatchAverage(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const parsed = Number.parseFloat(String(value));
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 200) {
      return null;
    }
    return Math.round(parsed * 100) / 100;
  }


  function normalizeStoredMatchHighFinish(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const parsed = clampInt(value, null, 1, 170);
    return Number.isFinite(parsed) ? parsed : null;
  }


  function normalizeStoredPlayerStats(rawStats) {
    return {
      average: normalizeStoredMatchAverage(rawStats?.average),
      oneEighties: clampInt(rawStats?.oneEighties, 0, 0, 99),
      highFinish: normalizeStoredMatchHighFinish(rawStats?.highFinish),
    };
  }


  function normalizeStoredMatchStats(rawStats) {
    return {
      p1: normalizeStoredPlayerStats(rawStats?.p1),
      p2: normalizeStoredPlayerStats(rawStats?.p2),
    };
  }


  function resetMatchAutomationMeta(match) {
    const auto = ensureMatchAutoMeta(match);
    auto.lobbyId = null;
    auto.status = "idle";
    auto.startedAt = null;
    auto.finishedAt = null;
    auto.lastSyncAt = null;
    auto.lastError = null;
    return auto;
  }


  function normalizeMatchMeta(rawMeta) {
    const meta = rawMeta && typeof rawMeta === "object" ? rawMeta : {};
    const resultKind = normalizeMatchResultKind(meta.resultKind);
    return {
      ...meta,
      resultKind,
      auto: normalizeAutomationMeta(meta.auto),
    };
  }


  function ensureMatchMeta(match) {
    if (!match || typeof match !== "object") {
      return normalizeMatchMeta(null);
    }
    if (!match.meta || typeof match.meta !== "object") {
      match.meta = {};
    }
    match.meta = normalizeMatchMeta(match.meta);
    return match.meta;
  }


  function setMatchResultKind(match, resultKind) {
    const meta = ensureMatchMeta(match);
    const nextKind = normalizeMatchResultKind(resultKind);
    if (meta.resultKind === nextKind) {
      return false;
    }
    meta.resultKind = nextKind;
    return true;
  }


  function isByeMatchResult(match) {
    return normalizeMatchResultKind(match?.meta?.resultKind) === "bye";
  }


  function ensureMatchAutoMeta(match) {
    const meta = ensureMatchMeta(match);
    meta.auto = normalizeAutomationMeta(meta.auto);
    return meta.auto;
  }


  function normalizeKoVirtualMatch(rawMatch, roundFallback, indexFallback) {
    return {
      id: normalizeText(rawMatch?.id || `ko-r${roundFallback}-m${indexFallback}`),
      round: clampInt(rawMatch?.round, roundFallback, 1, 64),
      number: clampInt(rawMatch?.number, indexFallback, 1, 256),
      structuralBye: Boolean(rawMatch?.structuralBye),
      competitors: {
        p1: rawMatch?.competitors?.p1 || null,
        p2: rawMatch?.competitors?.p2 || null,
      },
    };
  }


  function normalizeKoRoundStructure(rawRound, roundFallback) {
    const virtualMatchesRaw = Array.isArray(rawRound?.virtualMatches) ? rawRound.virtualMatches : [];
    return {
      round: clampInt(rawRound?.round, roundFallback, 1, 64),
      label: normalizeText(rawRound?.label || `Round ${roundFallback}`),
      virtualMatches: virtualMatchesRaw.map((entry, index) => (
        normalizeKoVirtualMatch(entry, roundFallback, index + 1)
      )),
    };
  }


  function normalizeKoSeedEntry(rawSeed, indexFallback) {
    const participantId = normalizeText(rawSeed?.participantId || rawSeed?.id || "");
    if (!participantId) {
      return null;
    }
    return {
      participantId,
      participantName: normalizeText(rawSeed?.participantName || rawSeed?.name || participantId),
      seed: clampInt(rawSeed?.seed, indexFallback, 1, TECHNICAL_PARTICIPANT_HARD_MAX),
      hasBye: Boolean(rawSeed?.hasBye),
      entryRound: clampInt(rawSeed?.entryRound, rawSeed?.hasBye ? 2 : 1, 1, 64),
      slot: Number.isFinite(Number(rawSeed?.slot))
        ? clampInt(rawSeed?.slot, null, 1, TECHNICAL_PARTICIPANT_HARD_MAX)
        : null,
    };
  }


  function normalizeKoDrawLocked(value, fallback = true) {
    if (typeof value === "boolean") {
      return value;
    }
    return Boolean(fallback);
  }


  function normalizeKoPlacement(placementRaw, bracketSize) {
    const fallbackPlacement = buildSeedPlacement(bracketSize);
    if (!Array.isArray(placementRaw) || !placementRaw.length) {
      return fallbackPlacement;
    }
    const used = new Set();
    const normalized = placementRaw
      .map((entry) => clampInt(entry, null, 1, bracketSize))
      .filter((entry) => Number.isInteger(entry) && !used.has(entry) && used.add(entry));
    if (normalized.length !== bracketSize) {
      return fallbackPlacement;
    }
    return normalized;
  }


  function normalizeTournamentKoMeta(rawKo, fallbackDrawMode = KO_DRAW_MODE_SEEDED, fallbackDrawLocked = true) {
    const ko = rawKo && typeof rawKo === "object" ? rawKo : {};
    const drawMode = normalizeKoDrawMode(ko.drawMode, fallbackDrawMode);
    const drawLocked = normalizeKoDrawLocked(ko.drawLocked, fallbackDrawLocked);
    const engineVersion = normalizeKoEngineVersion(ko.engineVersion, 0);
    const seeding = (Array.isArray(ko.seeding) ? ko.seeding : [])
      .map((entry, index) => normalizeKoSeedEntry(entry, index + 1))
      .filter(Boolean);
    const rounds = (Array.isArray(ko.rounds) ? ko.rounds : [])
      .map((entry, index) => normalizeKoRoundStructure(entry, index + 1));
    const fallbackBracketSize = nextPowerOfTwo(Math.max(2, seeding.length));
    const bracketSize = nextPowerOfTwo(clampInt(
      ko.bracketSize,
      fallbackBracketSize,
      2,
      TECHNICAL_PARTICIPANT_HARD_MAX,
    ));
    const placement = normalizeKoPlacement(ko.placement, bracketSize);
    return {
      drawMode,
      drawLocked,
      engineVersion,
      bracketSize,
      placement,
      seeding,
      rounds,
    };
  }


  function normalizeTournamentResultEntry(rawResult, indexFallback) {
    return {
      matchId: normalizeText(rawResult?.matchId || rawResult?.id || `result-${indexFallback}`),
      stage: [MATCH_STAGE_KO, MATCH_STAGE_GROUP, MATCH_STAGE_LEAGUE].includes(rawResult?.stage)
        ? rawResult.stage
        : MATCH_STAGE_KO,
      round: clampInt(rawResult?.round, 1, 1, 64),
      number: clampInt(rawResult?.number, indexFallback, 1, 256),
      player1Id: rawResult?.player1Id ? normalizeText(rawResult.player1Id) : null,
      player2Id: rawResult?.player2Id ? normalizeText(rawResult.player2Id) : null,
      winnerId: rawResult?.winnerId ? normalizeText(rawResult.winnerId) : null,
      legs: {
        p1: clampInt(rawResult?.legs?.p1, 0, 0, 99),
        p2: clampInt(rawResult?.legs?.p2, 0, 0, 99),
      },
      stats: normalizeStoredMatchStats(rawResult?.stats),
      source: rawResult?.source === "auto" ? "auto" : "manual",
      updatedAt: normalizeText(rawResult?.updatedAt || nowIso()),
    };
  }


  function normalizeTournament(rawTournament, fallbackKoDrawLocked = true) {
    if (!rawTournament || typeof rawTournament !== "object") {
      return null;
    }

    const mode = ["ko", "league", "groups_ko"].includes(rawTournament.mode) ? rawTournament.mode : "ko";
    const modeLimits = getModeParticipantLimits(mode);
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
      .slice(0, TECHNICAL_PARTICIPANT_HARD_MAX);

    if (participants.length < modeLimits.min) {
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
      stats: normalizeStoredMatchStats(match?.stats),
      updatedAt: normalizeText(match?.updatedAt || nowIso()),
      meta: normalizeMatchMeta(match?.meta),
    }));
    const resultsRaw = Array.isArray(rawTournament.results) ? rawTournament.results : [];
    const results = resultsRaw.map((entry, index) => normalizeTournamentResultEntry(entry, index + 1));

    const fallbackStartScore = sanitizeStartScore(rawTournament.startScore);
    const x01 = normalizeTournamentX01Settings(rawTournament.x01, fallbackStartScore);
    const rules = normalizeTournamentRules(rawTournament.rules);

    return {
      id: normalizeText(rawTournament.id || uuid("tournament")),
      name: normalizeText(rawTournament.name || "Lokales Turnier"),
      mode,
      ko: mode === "ko"
        ? normalizeTournamentKoMeta(rawTournament.ko, KO_DRAW_MODE_SEEDED, fallbackKoDrawLocked)
        : null,
      bestOfLegs: sanitizeBestOf(rawTournament.bestOfLegs),
      startScore: x01.baseScore,
      x01,
      rules,
      participants,
      groups,
      matches,
      results,
      createdAt: normalizeText(rawTournament.createdAt || nowIso()),
      updatedAt: normalizeText(rawTournament.updatedAt || nowIso()),
    };
  }


  function normalizeStoreShape(input) {
    const defaults = createDefaultStore();
    const defaultKoDrawLocked = input?.settings?.featureFlags?.koDrawLockDefault !== false;
    const settings = {
      debug: Boolean(input?.settings?.debug),
      featureFlags: {
        autoLobbyStart: Boolean(input?.settings?.featureFlags?.autoLobbyStart),
        randomizeKoRound1: input?.settings?.featureFlags?.randomizeKoRound1 !== false,
        koDrawLockDefault: defaultKoDrawLocked,
      },
    };
    return {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      settings,
      ui: {
        activeTab: TAB_IDS.includes(input?.ui?.activeTab) ? input.ui.activeTab : defaults.ui.activeTab,
        matchesSortMode: sanitizeMatchesSortMode(input?.ui?.matchesSortMode, defaults.ui.matchesSortMode),
        createDraft: normalizeCreateDraft(input?.ui?.createDraft, settings),
      },
      tournament: normalizeTournament(input?.tournament, defaultKoDrawLocked),
    };
  }


  function participantById(tournament, participantId) {
    return tournament?.participants?.find((participant) => participant.id === participantId) || null;
  }


  function participantNameById(tournament, participantId) {
    if (!participantId) {
      return "\u2205 offen";
    }
    const participant = participantById(tournament, participantId);
    return participant ? participant.name : "\u2205 offen";
  }


  function buildParticipantIndexes(tournament) {
    const byId = new Map();
    const byName = new Map();
    (tournament?.participants || []).forEach((participant) => {
      const id = normalizeText(participant?.id || "");
      if (!id) {
        return;
      }
      byId.set(id, participant);
      const key = normalizeLookup(participant?.name || "");
      if (key && !byName.has(key)) {
        byName.set(key, id);
      }
    });
    return { byId, byName };
  }


  function resolveParticipantSlotId(tournament, rawValue, indexes = null) {
    const value = normalizeText(rawValue || "");
    if (!value || isByePlaceholderValue(value)) {
      return null;
    }

    const participantIndexes = indexes || buildParticipantIndexes(tournament);
    if (participantIndexes.byId.has(value)) {
      return value;
    }

    const mappedByName = participantIndexes.byName.get(normalizeLookup(value));
    return mappedByName || null;
  }

  // Logic layer: deterministic tournament and bracket calculations.

  function getModeParticipantLimits(mode) {
    return MODE_PARTICIPANT_LIMITS[mode] || MODE_PARTICIPANT_LIMITS.ko;
  }


  function buildModeParticipantLimitSummary() {
    return Object.entries(MODE_PARTICIPANT_LIMITS)
      .map(([, limits]) => `${limits.label}: ${limits.min}-${limits.max}`)
      .join(", ");
  }


  function getParticipantCountError(mode, count) {
    const limits = getModeParticipantLimits(mode);
    const participantCount = Number(count || 0);
    if (participantCount < limits.min || participantCount > limits.max) {
      return `${limits.label} erfordert ${limits.min}-${limits.max} Teilnehmer.`;
    }
    return "";
  }

  async function persistKoMigrationBackup(tournamentSnapshot, reason = "ko-engine-v2-migration") {
    const snapshot = cloneSerializable(tournamentSnapshot);
    if (!snapshot) {
      return false;
    }

    const backupsRaw = await readStoreValue(STORAGE_KO_MIGRATION_BACKUPS_KEY, []);
    const backups = Array.isArray(backupsRaw) ? backupsRaw : [];
    backups.unshift({
      id: uuid("ko-backup"),
      reason: normalizeText(reason) || "ko-engine-v2-migration",
      createdAt: nowIso(),
      schemaVersion: STORAGE_SCHEMA_VERSION,
      tournament: snapshot,
    });
    const limitedBackups = backups.slice(0, 5);
    await writeStoreValue(STORAGE_KO_MIGRATION_BACKUPS_KEY, limitedBackups);
    return true;
  }


  function migrateStorage(rawValue) {
    if (!rawValue || typeof rawValue !== "object") {
      return createDefaultStore();
    }

    const version = Number(rawValue.schemaVersion || 0);
    switch (version) {
      case 4:
      case 3:
      case 2:
      case 1:
        return normalizeStoreShape({
          ...rawValue,
          tournament: rawValue.tournament
            ? {
              ...rawValue.tournament,
              rules: normalizeTournamentRules(rawValue.tournament.rules),
            }
            : rawValue.tournament,
        });
      default:
        if (rawValue.mode && rawValue.participants) {
          return normalizeStoreShape({
            tournament: {
              ...rawValue,
              rules: normalizeTournamentRules(rawValue.rules),
            },
          });
        }
        return createDefaultStore();
    }
  }

  function setTournamentTieBreakProfile(profile) {
    const tournament = state.store.tournament;
    if (!tournament) {
      return { ok: false, message: "Kein aktives Turnier vorhanden." };
    }
    const nextProfile = normalizeTieBreakProfile(profile, TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE);
    const currentProfile = normalizeTieBreakProfile(
      tournament?.rules?.tieBreakProfile,
      TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE,
    );
    if (nextProfile === currentProfile) {
      return { ok: true, changed: false };
    }
    tournament.rules = normalizeTournamentRules({
      ...(tournament.rules || {}),
      tieBreakProfile: nextProfile,
    });
    refreshDerivedMatches(tournament);
    tournament.updatedAt = nowIso();
    schedulePersist();
    renderShell();
    return { ok: true, changed: true };
  }


  function setTournamentKoDrawLocked(drawLocked) {
    const tournament = state.store.tournament;
    if (!tournament) {
      return { ok: false, message: "Kein aktives Turnier vorhanden." };
    }
    if (tournament.mode !== "ko") {
      return { ok: false, message: "Draw-Lock ist nur im KO-Modus verfügbar." };
    }
    const nextDrawLocked = Boolean(drawLocked);
    const currentDrawLocked = tournament?.ko?.drawLocked !== false;
    if (nextDrawLocked === currentDrawLocked) {
      return { ok: true, changed: false };
    }
    tournament.ko = normalizeTournamentKoMeta({
      ...(tournament.ko || {}),
      drawLocked: nextDrawLocked,
    }, normalizeKoDrawMode(tournament?.ko?.drawMode, KO_DRAW_MODE_SEEDED), nextDrawLocked);
    refreshDerivedMatches(tournament);
    tournament.updatedAt = nowIso();
    schedulePersist();
    renderShell();
    return { ok: true, changed: true };
  }

  /**
   * @typedef {Object} KoSeed
   * @property {string} participantId
   * @property {string} participantName
   * @property {number} seed
   * @property {boolean} hasBye
   * @property {number} entryRound
   * @property {number|null} slot
   */

  /**
   * @typedef {Object} KoVirtualMatch
   * @property {string} id
   * @property {number} round
   * @property {number} number
   * @property {boolean} structuralBye
   * @property {Object} competitors
   * @property {Object|null} competitors.p1
   * @property {Object|null} competitors.p2
   */

  /**
   * @typedef {Object} KoBracketStructure
   * @property {number} bracketSize
   * @property {number} byeCount
   * @property {number[]} placement
   * @property {KoSeed[]} seeding
   * @property {Array<{round:number,label:string,virtualMatches:KoVirtualMatch[]}>} rounds
   */

  function sanitizeMatchAverage(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const parsed = Number.parseFloat(String(value));
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 200) {
      return null;
    }
    return Math.round(parsed * 100) / 100;
  }


  function sanitizeMatchHighFinish(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const parsed = clampInt(value, null, 1, 170);
    return Number.isFinite(parsed) ? parsed : null;
  }


  function normalizePlayerStats(rawStats) {
    return {
      average: sanitizeMatchAverage(rawStats?.average),
      oneEighties: clampInt(rawStats?.oneEighties, 0, 0, 99),
      highFinish: sanitizeMatchHighFinish(rawStats?.highFinish),
    };
  }


  function normalizeMatchStats(rawStats) {
    return {
      p1: normalizePlayerStats(rawStats?.p1),
      p2: normalizePlayerStats(rawStats?.p2),
    };
  }


  function createKoVirtualCompetitorRef(node) {
    if (!node) {
      return null;
    }
    if (node.kind === "participant") {
      return {
        type: "participant",
        participantId: node.participantId,
        seed: node.seed,
      };
    }
    if (node.kind === "winner") {
      return {
        type: "winner",
        matchId: node.sourceMatchId,
      };
    }
    return null;
  }


  function createMatch({
    id,
    stage,
    round,
    number,
    groupId = null,
    player1Id = null,
    player2Id = null,
    status = STATUS_PENDING,
    winnerId = null,
    source = null,
    legs = null,
    stats = null,
    meta = {},
  }) {
    const normalizedStatus = status === STATUS_COMPLETED ? STATUS_COMPLETED : STATUS_PENDING;
    const normalizedWinnerId = normalizedStatus === STATUS_COMPLETED
      ? normalizeText(winnerId || "") || null
      : null;
    const normalizedSource = source === "auto" || source === "manual" ? source : null;
    return {
      id,
      stage,
      round,
      number,
      groupId,
      player1Id,
      player2Id,
      status: normalizedStatus,
      winnerId: normalizedWinnerId,
      source: normalizedSource,
      legs: {
        p1: clampInt(legs?.p1, 0, 0, 99),
        p2: clampInt(legs?.p2, 0, 0, 99),
      },
      // Domain structure for required PDC match stats.
      stats: normalizeMatchStats(stats),
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


  function calculateBracketSize(participantCount) {
    const normalizedCount = clampInt(participantCount, 0, 0, TECHNICAL_PARTICIPANT_HARD_MAX);
    if (normalizedCount <= 2) {
      return 2;
    }
    return nextPowerOfTwo(normalizedCount);
  }


  function buildSeedPlacement(size) {
    if (!Number.isFinite(size) || size < 2 || size % 2 !== 0) {
      return [];
    }
    let placement = [1];
    while (placement.length < size) {
      const mirrorBase = (placement.length * 2) + 1;
      const next = [];
      placement.forEach((seedNumber) => {
        next.push(seedNumber, mirrorBase - seedNumber);
      });
      placement = next;
    }
    return placement;
  }


  function buildDeterministicSeedHash(value) {
    const token = normalizeLookup(value || "");
    let hash = 5381;
    for (let i = 0; i < token.length; i += 1) {
      hash = ((hash << 5) + hash) + token.charCodeAt(i);
      hash >>>= 0;
    }
    return hash >>> 0;
  }


  function normalizeSeedParticipants(players) {
    const source = Array.isArray(players) ? players : [];
    const seen = new Set();
    const list = [];
    source.forEach((entry, index) => {
      const participantId = normalizeText(entry?.id || entry || "");
      if (!participantId || seen.has(participantId)) {
        return;
      }
      seen.add(participantId);
      const explicitSeed = Number.parseInt(String(entry?.seed ?? ""), 10);
      list.push({
        participantId,
        participantName: normalizeText(entry?.name || participantId),
        originalIndex: index,
        explicitSeed: Number.isFinite(explicitSeed) && explicitSeed > 0 ? explicitSeed : null,
      });
    });
    return list;
  }


  function generateSeeds(players, drawMode = KO_DRAW_MODE_SEEDED) {
    const participants = normalizeSeedParticipants(players);
    const mode = normalizeKoDrawMode(drawMode, KO_DRAW_MODE_SEEDED);
    const ordered = participants.slice();

    if (mode === KO_DRAW_MODE_OPEN_DRAW) {
      ordered.sort((left, right) => {
        const leftHash = buildDeterministicSeedHash(`${left.participantName}|${left.participantId}|${left.originalIndex}`);
        const rightHash = buildDeterministicSeedHash(`${right.participantName}|${right.participantId}|${right.originalIndex}`);
        if (leftHash !== rightHash) {
          return leftHash - rightHash;
        }
        return left.originalIndex - right.originalIndex;
      });
    } else {
      // Extension point: replace this comparator when external ranking-based seeding is added.
      ordered.sort((left, right) => {
        const leftSeed = Number.isFinite(left.explicitSeed) ? left.explicitSeed : Number.MAX_SAFE_INTEGER;
        const rightSeed = Number.isFinite(right.explicitSeed) ? right.explicitSeed : Number.MAX_SAFE_INTEGER;
        if (leftSeed !== rightSeed) {
          return leftSeed - rightSeed;
        }
        return left.originalIndex - right.originalIndex;
      });
    }

    return ordered.map((entry, index) => ({
      participantId: entry.participantId,
      participantName: entry.participantName,
      seed: index + 1,
    }));
  }


  function assignByes(players, bracketSize) {
    const seeds = Array.isArray(players) ? players.slice() : [];
    const size = calculateBracketSize(bracketSize || seeds.length);
    const byeCount = Math.max(0, size - seeds.length);
    const seededWithByes = seeds.map((seedEntry, index) => ({
      ...seedEntry,
      hasBye: index < byeCount,
      entryRound: index < byeCount ? 2 : 1,
    }));
    return {
      bracketSize: size,
      byeCount,
      seeds: seededWithByes,
    };
  }


  function buildBracketStructure(players, seeds) {
    const normalizedParticipants = normalizeSeedParticipants(players);
    const seeded = Array.isArray(seeds) && seeds.length
      ? seeds.slice()
      : generateSeeds(normalizedParticipants, KO_DRAW_MODE_SEEDED);
    const assignedByes = assignByes(seeded, normalizedParticipants.length);
    const placement = buildSeedPlacement(assignedByes.bracketSize);
    const seedByNumber = new Map(assignedByes.seeds.map((entry) => [entry.seed, entry]));

    const slotByParticipantId = new Map();
    const leafNodes = placement.map((seedNumber, slotIndex) => {
      const seedEntry = seedByNumber.get(seedNumber) || null;
      if (!seedEntry) {
        return null;
      }
      slotByParticipantId.set(seedEntry.participantId, slotIndex + 1);
      return {
        kind: "participant",
        participantId: seedEntry.participantId,
        seed: seedEntry.seed,
      };
    });

    const seeding = assignedByes.seeds.map((seedEntry) => ({
      ...seedEntry,
      slot: slotByParticipantId.get(seedEntry.participantId) || null,
    }));

    const rounds = [];
    let currentNodes = leafNodes;
    const totalRounds = Math.log2(assignedByes.bracketSize);
    for (let round = 1; round <= totalRounds; round += 1) {
      const matchesInRound = currentNodes.length / 2;
      const virtualMatches = [];
      const nextNodes = [];
      for (let number = 1; number <= matchesInRound; number += 1) {
        const idx = (number - 1) * 2;
        const leftNode = currentNodes[idx] || null;
        const rightNode = currentNodes[idx + 1] || null;
        const id = `ko-r${round}-m${number}`;
        const structuralBye = Boolean((leftNode && !rightNode) || (!leftNode && rightNode));

        virtualMatches.push({
          id,
          round,
          number,
          structuralBye,
          competitors: {
            p1: createKoVirtualCompetitorRef(leftNode),
            p2: createKoVirtualCompetitorRef(rightNode),
          },
        });

        if (!leftNode && !rightNode) {
          nextNodes.push(null);
        } else if (structuralBye) {
          nextNodes.push(leftNode || rightNode);
        } else {
          nextNodes.push({
            kind: "winner",
            sourceMatchId: id,
          });
        }
      }
      rounds.push({
        round,
        label: round === totalRounds ? "Final" : `Round ${round}`,
        virtualMatches,
      });
      currentNodes = nextNodes;
    }

    return {
      bracketSize: assignedByes.bracketSize,
      byeCount: assignedByes.byeCount,
      placement,
      seeding,
      rounds,
    };
  }


  function buildKoMatchMetaFromVirtualMatch(virtualMatch) {
    return {
      bracket: {
        p1Source: virtualMatch?.competitors?.p1 || null,
        p2Source: virtualMatch?.competitors?.p2 || null,
      },
    };
  }


  function resolveInitialVirtualParticipantId(competitorRef) {
    if (!competitorRef || competitorRef.type !== "participant") {
      return null;
    }
    return normalizeText(competitorRef.participantId || "") || null;
  }


  function buildKoMatchesFromStructure(bracketStructure) {
    const rounds = Array.isArray(bracketStructure?.rounds) ? bracketStructure.rounds : [];
    const matches = [];
    rounds.forEach((roundDef) => {
      roundDef.virtualMatches.forEach((virtualMatch) => {
        const p1 = resolveInitialVirtualParticipantId(virtualMatch?.competitors?.p1);
        const p2 = resolveInitialVirtualParticipantId(virtualMatch?.competitors?.p2);
        const structuralBye = Boolean(virtualMatch?.structuralBye);
        const advancedParticipantId = structuralBye ? (p1 || p2 || null) : null;
        const isBye = structuralBye && Boolean(advancedParticipantId);
        const baseMeta = buildKoMatchMetaFromVirtualMatch(virtualMatch);
        const meta = isBye
          ? { ...baseMeta, resultKind: "bye" }
          : baseMeta;

        matches.push(createMatch({
          id: virtualMatch.id,
          stage: MATCH_STAGE_KO,
          round: virtualMatch.round,
          number: virtualMatch.number,
          player1Id: p1,
          player2Id: p2,
          status: isBye ? STATUS_COMPLETED : STATUS_PENDING,
          winnerId: isBye ? advancedParticipantId : null,
          legs: isBye ? { p1: 0, p2: 0 } : { p1: 0, p2: 0 },
          meta,
        }));
      });
    });
    return matches;
  }


  function buildKoMatchesV2(participantIds, drawMode = KO_DRAW_MODE_SEEDED) {
    const participants = (Array.isArray(participantIds) ? participantIds : [])
      .map((entry) => ({
        id: normalizeText(entry?.id || entry || ""),
        name: normalizeText(entry?.name || entry?.id || entry || ""),
        seed: entry?.seed,
      }))
      .filter((entry) => entry.id);
    const seeds = generateSeeds(participants, drawMode);
    const structure = buildBracketStructure(participants, seeds);
    return buildKoMatchesFromStructure(structure);
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
      errors.push("Ungültiger Modus.");
    }
    const participantCountError = getParticipantCountError(config.mode, config.participants.length);
    if (participantCountError) {
      errors.push(participantCountError);
    }

    return errors;
  }


  function createTournament(config) {
    const modeLimits = getModeParticipantLimits(config.mode);
    const participants = config.participants.slice(0, modeLimits.max);
    const participantIds = participants.map((participant) => participant.id);
    const koDrawMode = config.mode === "ko" && config.randomizeKoRound1
      ? KO_DRAW_MODE_OPEN_DRAW
      : KO_DRAW_MODE_SEEDED;
    const koDrawLocked = config.mode === "ko"
      ? config.koDrawLocked !== false
      : false;
    const x01 = normalizeTournamentX01Settings({
      presetId: config.x01Preset,
      baseScore: config.startScore,
      inMode: config.x01InMode,
      outMode: config.x01OutMode,
      bullMode: config.x01BullMode,
      maxRounds: config.x01MaxRounds,
      bullOffMode: config.x01BullOffMode,
      lobbyVisibility: config.lobbyVisibility,
    }, config.startScore);

    let groups = [];
    let matches = [];
    let koMeta = null;

    if (config.mode === "league") {
      matches = buildLeagueMatches(participantIds);
    } else if (config.mode === "groups_ko") {
      groups = buildGroups(participantIds);
      matches = buildGroupMatches(groups).concat(buildGroupsKoMatches());
    } else {
      const koSeeds = generateSeeds(participants, koDrawMode);
      const koStructure = buildBracketStructure(participants, koSeeds);
      matches = buildKoMatchesFromStructure(koStructure);
      koMeta = {
        drawMode: koDrawMode,
        drawLocked: koDrawLocked,
        engineVersion: KO_ENGINE_VERSION,
        bracketSize: koStructure.bracketSize,
        placement: koStructure.placement,
        seeding: koStructure.seeding,
        rounds: koStructure.rounds,
      };
    }

    const tournament = {
      id: uuid("tournament"),
      name: normalizeText(config.name),
      mode: config.mode,
      ko: koMeta,
      bestOfLegs: sanitizeBestOf(config.bestOfLegs),
      startScore: x01.baseScore,
      x01,
      rules: normalizeTournamentRules({ tieBreakProfile: TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE }),
      participants,
      groups,
      matches,
      results: [],
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

  function standingsForMatches(tournament, matches, participantIds = null) {
    const allowedIds = Array.isArray(participantIds)
      ? new Set(participantIds.map((id) => normalizeText(id)).filter(Boolean))
      : null;

    const rows = (tournament?.participants || [])
      .filter((participant) => !allowedIds || allowedIds.has(participant.id))
      .map((participant) => ({
        id: participant.id,
        name: participant.name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        legsFor: 0,
        legsAgainst: 0,
        legDiff: 0,
        points: 0,
        rank: 0,
        tiebreakState: "resolved",
      }));

    const rowById = new Map(rows.map((row) => [row.id, row]));
    const completedMatches = (Array.isArray(matches) ? matches : []).filter((match) => match?.status === STATUS_COMPLETED);

    completedMatches.forEach((match) => {
      if (!match.player1Id || !match.player2Id) {
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
        return;
      }
      if (match.winnerId === match.player2Id) {
        row2.wins += 1;
        row1.losses += 1;
        row2.points += 2;
        return;
      }
      row1.draws += 1;
      row2.draws += 1;
      row1.points += 1;
      row2.points += 1;
    });

    rows.forEach((row) => {
      row.legDiff = row.legsFor - row.legsAgainst;
    });

    const tieBreakProfile = normalizeTieBreakProfile(
      tournament?.rules?.tieBreakProfile,
      TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE,
    );
    const tiePrimaryById = new Map(rows.map((row) => [row.id, 0]));

    if (tieBreakProfile === TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE) {
      const pointsBuckets = new Map();
      rows.forEach((row) => {
        if (!pointsBuckets.has(row.points)) {
          pointsBuckets.set(row.points, []);
        }
        pointsBuckets.get(row.points).push(row);
      });

      pointsBuckets.forEach((bucketRows) => {
        if (bucketRows.length < 2) {
          return;
        }
        const bucketIds = new Set(bucketRows.map((row) => row.id));
        const bucketMatches = completedMatches.filter((match) => (
          match.player1Id
          && match.player2Id
          && bucketIds.has(match.player1Id)
          && bucketIds.has(match.player2Id)
        ));

        if (bucketRows.length === 2) {
          const left = bucketRows[0];
          const right = bucketRows[1];
          let leftDirectScore = 0;
          let rightDirectScore = 0;
          bucketMatches.forEach((match) => {
            if (match.winnerId === left.id) {
              leftDirectScore += 1;
            } else if (match.winnerId === right.id) {
              rightDirectScore += 1;
            }
          });
          if (leftDirectScore !== rightDirectScore) {
            tiePrimaryById.set(left.id, leftDirectScore - rightDirectScore);
            tiePrimaryById.set(right.id, rightDirectScore - leftDirectScore);
          }
          return;
        }

        const miniLegDiffById = new Map(bucketRows.map((row) => [row.id, 0]));
        bucketMatches.forEach((match) => {
          const p1 = clampInt(match.legs?.p1, 0, 0, 50);
          const p2 = clampInt(match.legs?.p2, 0, 0, 50);
          miniLegDiffById.set(match.player1Id, (miniLegDiffById.get(match.player1Id) || 0) + (p1 - p2));
          miniLegDiffById.set(match.player2Id, (miniLegDiffById.get(match.player2Id) || 0) + (p2 - p1));
        });
        bucketRows.forEach((row) => {
          tiePrimaryById.set(row.id, miniLegDiffById.get(row.id) || 0);
        });
      });
    }

    rows.sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }

      if (tieBreakProfile === TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE) {
        const rightPrimary = tiePrimaryById.get(right.id) || 0;
        const leftPrimary = tiePrimaryById.get(left.id) || 0;
        if (rightPrimary !== leftPrimary) {
          return rightPrimary - leftPrimary;
        }
      }

      if (right.legDiff !== left.legDiff) {
        return right.legDiff - left.legDiff;
      }
      if (right.legsFor !== left.legsFor) {
        return right.legsFor - left.legsFor;
      }
      return left.name.localeCompare(right.name, "de");
    });

    if (tieBreakProfile === TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE) {
      const unresolvedBuckets = new Map();
      rows.forEach((row) => {
        const key = [
          row.points,
          tiePrimaryById.get(row.id) || 0,
          row.legDiff,
          row.legsFor,
        ].join("|");
        if (!unresolvedBuckets.has(key)) {
          unresolvedBuckets.set(key, []);
        }
        unresolvedBuckets.get(key).push(row);
      });
      unresolvedBuckets.forEach((bucketRows) => {
        if (bucketRows.length < 2) {
          return;
        }
        bucketRows.forEach((row) => {
          row.tiebreakState = "playoff_required";
        });
      });
    }

    rows.forEach((row, index) => {
      row.rank = index + 1;
    });

    return rows;
  }

  function groupStandingsMap(tournament) {
    const map = new Map();
    (tournament.groups || []).forEach((group) => {
      const groupMatches = tournament.matches.filter((match) => match.stage === MATCH_STAGE_GROUP && match.groupId === group.id);
      const rows = standingsForMatches(tournament, groupMatches, group.participantIds);
      const complete = groupMatches.length > 0 && groupMatches.every((match) => match.status === STATUS_COMPLETED);
      const groupResolution = complete && rows.some((row) => row.tiebreakState === "playoff_required")
        ? {
          status: "playoff_required",
          reason: "Playoff erforderlich: Gleichstand nach DRA-Tie-Break.",
        }
        : {
          status: "resolved",
          reason: "",
        };
      map.set(group.id, {
        group,
        rows,
        complete,
        groupResolution,
      });
    });
    return map;
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
      const p1 = group1 && group1.complete && group1.groupResolution?.status === "resolved"
        ? group1.rows[from1.rank - 1]?.id || null
        : null;
      const p2 = group2 && group2.complete && group2.groupResolution?.status === "resolved"
        ? group2.rows[from2.rank - 1]?.id || null
        : null;
      changed = assignPlayerSlot(match, 1, p1) || changed;
      changed = assignPlayerSlot(match, 2, p2) || changed;
    });

    return changed;
  }

  function clearMatchResult(match) {
    match.status = STATUS_PENDING;
    match.winnerId = null;
    match.source = null;
    match.legs = { p1: 0, p2: 0 };
    match.stats = normalizeMatchStats(null);
    setMatchResultKind(match, null);
    resetMatchAutomationMeta(match);
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
    const hasStoredResult = match.status === STATUS_COMPLETED
      || Boolean(match.winnerId || match.source || match.legs?.p1 || match.legs?.p2);
    if (hasStoredResult) {
      clearMatchResult(match);
    }
    match.updatedAt = nowIso();
    return true;
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


  function serializeComparable(value) {
    return JSON.stringify(value === undefined ? null : value);
  }


  function isSerializableEqual(left, right) {
    return serializeComparable(left) === serializeComparable(right);
  }


  function deriveWinnerIdFromLegs(tournament, match) {
    if (!match?.player1Id || !match?.player2Id) {
      return null;
    }
    const legsToWin = getLegsToWin(tournament?.bestOfLegs);
    const p1Legs = clampInt(match.legs?.p1, 0, 0, 99);
    const p2Legs = clampInt(match.legs?.p2, 0, 0, 99);
    if (p1Legs === p2Legs) {
      return null;
    }
    if (p1Legs > legsToWin || p2Legs > legsToWin) {
      return null;
    }
    if (p1Legs === legsToWin && p1Legs > p2Legs) {
      return match.player1Id;
    }
    if (p2Legs === legsToWin && p2Legs > p1Legs) {
      return match.player2Id;
    }
    return null;
  }


  function resolveVirtualCompetitorParticipantId(competitorRef, winnerByVirtualMatchId) {
    if (!competitorRef) {
      return null;
    }
    if (competitorRef.type === "participant") {
      return normalizeText(competitorRef.participantId || "") || null;
    }
    if (competitorRef.type === "winner") {
      return winnerByVirtualMatchId.get(normalizeText(competitorRef.matchId || "")) || null;
    }
    return null;
  }


  function buildKoMetaSnapshot(drawMode, drawLocked, structure) {
    const bracketSize = clampInt(structure?.bracketSize, 2, 2, TECHNICAL_PARTICIPANT_HARD_MAX);
    const placement = (Array.isArray(structure?.placement) ? structure.placement : [])
      .map((slot) => clampInt(slot, null, 1, bracketSize))
      .filter((slot) => Number.isInteger(slot));
    const normalizedPlacement = placement.length === bracketSize
      ? placement
      : buildSeedPlacement(bracketSize);

    const rounds = (Array.isArray(structure?.rounds) ? structure.rounds : []).map((roundDef) => ({
      round: clampInt(roundDef?.round, 1, 1, 64),
      label: normalizeText(roundDef?.label || ""),
      virtualMatches: (Array.isArray(roundDef?.virtualMatches) ? roundDef.virtualMatches : []).map((virtualMatch) => ({
        id: normalizeText(virtualMatch?.id || ""),
        round: clampInt(virtualMatch?.round, 1, 1, 64),
        number: clampInt(virtualMatch?.number, 1, 1, 256),
        structuralBye: Boolean(virtualMatch?.structuralBye),
        competitors: {
          p1: virtualMatch?.competitors?.p1 || null,
          p2: virtualMatch?.competitors?.p2 || null,
        },
      })),
    }));

    const seeding = (Array.isArray(structure?.seeding) ? structure.seeding : []).map((entry) => ({
      participantId: normalizeText(entry?.participantId || ""),
      participantName: normalizeText(entry?.participantName || entry?.participantId || ""),
      seed: clampInt(entry?.seed, 1, 1, TECHNICAL_PARTICIPANT_HARD_MAX),
      hasBye: Boolean(entry?.hasBye),
      entryRound: clampInt(entry?.entryRound, 1, 1, 64),
      slot: Number.isFinite(Number(entry?.slot)) ? clampInt(entry?.slot, 1, 1, TECHNICAL_PARTICIPANT_HARD_MAX) : null,
    })).filter((entry) => entry.participantId);

    return {
      drawMode: normalizeKoDrawMode(drawMode, KO_DRAW_MODE_SEEDED),
      drawLocked: Boolean(drawLocked),
      engineVersion: KO_ENGINE_VERSION,
      bracketSize,
      placement: normalizedPlacement,
      seeding,
      rounds,
    };
  }


  function buildKoStructureFromMeta(koMeta, fallbackDrawMode = KO_DRAW_MODE_SEEDED) {
    const normalized = normalizeTournamentKoMeta(koMeta, fallbackDrawMode, koMeta?.drawLocked !== false);
    if (!Array.isArray(normalized?.rounds) || !normalized.rounds.length) {
      return null;
    }
    return {
      bracketSize: normalized.bracketSize,
      placement: normalized.placement,
      seeding: normalized.seeding,
      rounds: normalized.rounds,
    };
  }


  function synchronizeStructuralByeMatch(match, p1, p2) {
    const hasP1 = Boolean(p1);
    const hasP2 = Boolean(p2);
    const hasExactlyOneParticipant = (hasP1 && !hasP2) || (!hasP1 && hasP2);
    let changed = false;

    if (!hasExactlyOneParticipant) {
      if (isByeMatchResult(match) || match.status === STATUS_COMPLETED) {
        clearMatchResult(match);
        changed = true;
      }
      return changed;
    }

    const expectedWinnerId = p1 || p2;
    if (match.status !== STATUS_COMPLETED) {
      match.status = STATUS_COMPLETED;
      changed = true;
    }
    if (match.winnerId !== expectedWinnerId) {
      match.winnerId = expectedWinnerId;
      changed = true;
    }
    if (match.source !== null) {
      match.source = null;
      changed = true;
    }
    if (clampInt(match.legs?.p1, 0, 0, 99) !== 0 || clampInt(match.legs?.p2, 0, 0, 99) !== 0) {
      match.legs = { p1: 0, p2: 0 };
      changed = true;
    }
    const normalizedStats = normalizeMatchStats(match.stats);
    if (!isSerializableEqual(match.stats, normalizedStats)) {
      match.stats = normalizedStats;
      changed = true;
    }
    changed = setMatchResultKind(match, "bye") || changed;

    const auto = ensureMatchAutoMeta(match);
    if (
      auto.lobbyId
      || auto.status !== "idle"
      || auto.startedAt
      || auto.finishedAt
      || auto.lastSyncAt
      || auto.lastError
    ) {
      resetMatchAutomationMeta(match);
      changed = true;
    }

    if (changed) {
      match.updatedAt = nowIso();
    }
    return changed;
  }


  function synchronizeKoBracketState(tournament) {
    if (!tournament || tournament.mode !== "ko") {
      return false;
    }

    let changed = false;
    const drawMode = normalizeKoDrawMode(tournament?.ko?.drawMode, KO_DRAW_MODE_SEEDED);
    const drawLocked = tournament?.ko?.drawLocked !== false;
    const participants = (Array.isArray(tournament.participants) ? tournament.participants : [])
      .map((participant) => ({
        id: normalizeText(participant?.id || ""),
        name: normalizeText(participant?.name || participant?.id || ""),
        seed: participant?.seed,
      }))
      .filter((participant) => participant.id);

    const generatedStructure = buildBracketStructure(participants, generateSeeds(participants, drawMode));
    const lockedStructure = drawLocked ? buildKoStructureFromMeta(tournament?.ko, drawMode) : null;
    const structure = lockedStructure || generatedStructure;
    const nextKoMeta = buildKoMetaSnapshot(drawMode, drawLocked, structure);
    if (!isSerializableEqual(tournament.ko, nextKoMeta)) {
      tournament.ko = nextKoMeta;
      changed = true;
    }

    const existingKoMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);
    const existingKoById = new Map(existingKoMatches.map((match) => [match.id, match]));
    const winnerByVirtualMatchId = new Map();
    const nextKoMatches = [];

    structure.rounds.forEach((roundDef) => {
      roundDef.virtualMatches.forEach((virtualMatch) => {
        const p1 = resolveVirtualCompetitorParticipantId(virtualMatch?.competitors?.p1, winnerByVirtualMatchId);
        const p2 = resolveVirtualCompetitorParticipantId(virtualMatch?.competitors?.p2, winnerByVirtualMatchId);
        const structuralBye = Boolean(virtualMatch?.structuralBye);

        let match = existingKoById.get(virtualMatch.id) || null;
        if (!match) {
          match = createMatch({
            id: virtualMatch.id,
            stage: MATCH_STAGE_KO,
            round: virtualMatch.round,
            number: virtualMatch.number,
            player1Id: p1,
            player2Id: p2,
            meta: buildKoMatchMetaFromVirtualMatch(virtualMatch),
          });
          if (structuralBye) {
            synchronizeStructuralByeMatch(match, p1, p2);
          }
          changed = true;
        } else {
          if (match.round !== virtualMatch.round || match.number !== virtualMatch.number) {
            match.round = virtualMatch.round;
            match.number = virtualMatch.number;
            match.updatedAt = nowIso();
            changed = true;
          }
          changed = assignPlayerSlot(match, 1, p1) || changed;
          changed = assignPlayerSlot(match, 2, p2) || changed;

          if (structuralBye) {
            changed = synchronizeStructuralByeMatch(match, p1, p2) || changed;
          } else if (isByeMatchResult(match)) {
            const localChanged = setMatchResultKind(match, null);
            if (localChanged) {
              match.updatedAt = nowIso();
            }
            changed = localChanged || changed;
          }

          const normalizedMeta = normalizeMatchMeta({
            ...(match.meta || {}),
            ...buildKoMatchMetaFromVirtualMatch(virtualMatch),
          });
          if (!isSerializableEqual(match.meta, normalizedMeta)) {
            match.meta = normalizedMeta;
            match.updatedAt = nowIso();
            changed = true;
          }
        }

        const normalizedStats = normalizeMatchStats(match.stats);
        if (!isSerializableEqual(match.stats, normalizedStats)) {
          match.stats = normalizedStats;
          match.updatedAt = nowIso();
          changed = true;
        }

        nextKoMatches.push(match);

        if (match.status === STATUS_COMPLETED) {
          if (!isByeMatchResult(match)) {
            const derivedWinnerId = deriveWinnerIdFromLegs(tournament, match);
            if (derivedWinnerId && match.winnerId !== derivedWinnerId) {
              match.winnerId = derivedWinnerId;
              match.updatedAt = nowIso();
              changed = true;
            }
          }
          if (isCompletedMatchResultValid(tournament, match)) {
            winnerByVirtualMatchId.set(match.id, match.winnerId);
          }
        } else if (structuralBye) {
          const advancedParticipant = p1 || p2 || null;
          if (advancedParticipant) {
            winnerByVirtualMatchId.set(virtualMatch.id, advancedParticipant);
          }
        }
      });
    });

    const nextKoMatchIdSet = new Set(nextKoMatches.map((match) => match.id));
    if (existingKoMatches.some((match) => !nextKoMatchIdSet.has(match.id))) {
      changed = true;
    }

    const nonKoMatches = (tournament.matches || []).filter((match) => match.stage !== MATCH_STAGE_KO);
    const mergedMatches = nonKoMatches.concat(nextKoMatches);
    const currentMatches = Array.isArray(tournament.matches) ? tournament.matches : [];
    if (currentMatches.length !== mergedMatches.length) {
      changed = true;
    } else {
      for (let i = 0; i < currentMatches.length; i += 1) {
        if (currentMatches[i]?.id !== mergedMatches[i]?.id) {
          changed = true;
          break;
        }
      }
    }
    tournament.matches = mergedMatches;

    return changed;
  }


  function migrateKoTournamentToV3(tournament, defaultDrawMode = KO_DRAW_MODE_SEEDED) {
    if (!tournament || tournament.mode !== "ko") {
      return false;
    }

    const drawMode = normalizeKoDrawMode(tournament?.ko?.drawMode, defaultDrawMode);
    const drawLocked = tournament?.ko?.drawLocked !== false;
    const engineVersion = normalizeKoEngineVersion(tournament?.ko?.engineVersion, 0);
    const currentKo = tournament.ko && typeof tournament.ko === "object" ? tournament.ko : {};
    const normalizedKo = normalizeTournamentKoMeta(currentKo, drawMode, drawLocked);

    if (engineVersion >= KO_ENGINE_VERSION) {
      const nextKo = {
        ...normalizedKo,
        drawMode,
        drawLocked,
        engineVersion: KO_ENGINE_VERSION,
      };
      if (!isSerializableEqual(currentKo, nextKo)) {
        tournament.ko = nextKo;
        return true;
      }
      return false;
    }

    const backupSnapshot = cloneSerializable(tournament);
    if (backupSnapshot) {
      persistKoMigrationBackup(backupSnapshot, "ko-engine-v3-migration").catch((error) => {
        logWarn("storage", "KO migration backup write failed.", error);
      });
    }

    tournament.ko = {
      ...normalizedKo,
      drawMode,
      drawLocked,
      engineVersion: KO_ENGINE_VERSION,
    };
    tournament.updatedAt = nowIso();

    logDebug("ko", "KO tournament migrated to engine v3.", {
      drawMode,
      participantCount: Array.isArray(tournament.participants) ? tournament.participants.length : 0,
    });

    return true;
  }


  function isCompletedMatchResultValid(tournament, match) {
    if (!match || match.status !== STATUS_COMPLETED) {
      return true;
    }

    if (isByeMatchResult(match)) {
      const hasP1 = Boolean(match.player1Id);
      const hasP2 = Boolean(match.player2Id);
      if (hasP1 === hasP2) {
        return false;
      }
      const expectedWinnerId = hasP1 ? match.player1Id : match.player2Id;
      const p1Legs = clampInt(match.legs?.p1, 0, 0, 99);
      const p2Legs = clampInt(match.legs?.p2, 0, 0, 99);
      return normalizeText(match.winnerId || "") === normalizeText(expectedWinnerId || "")
        && p1Legs === 0
        && p2Legs === 0;
    }

    if (!match.player1Id || !match.player2Id) {
      return false;
    }

    const derivedWinnerId = deriveWinnerIdFromLegs(tournament, match);
    if (!derivedWinnerId) {
      return false;
    }
    if (!match.winnerId) {
      return false;
    }
    return match.winnerId === derivedWinnerId;
  }


  function normalizeCompletedMatchResults(tournament) {
    if (!tournament) {
      return false;
    }
    let changed = false;
    tournament.matches.forEach((match) => {
      const normalizedStats = normalizeMatchStats(match.stats);
      if (!isSerializableEqual(match.stats, normalizedStats)) {
        match.stats = normalizedStats;
        match.updatedAt = nowIso();
        changed = true;
      }

      if (match.status !== STATUS_COMPLETED) {
        return;
      }

      if (isByeMatchResult(match)) {
        changed = synchronizeStructuralByeMatch(match, match.player1Id || null, match.player2Id || null) || changed;
        return;
      }

      const derivedWinnerId = deriveWinnerIdFromLegs(tournament, match);
      if (!derivedWinnerId || !match.player1Id || !match.player2Id) {
        clearMatchResult(match);
        changed = true;
        return;
      }
      if (match.winnerId !== derivedWinnerId) {
        match.winnerId = derivedWinnerId;
        match.updatedAt = nowIso();
        changed = true;
      }
    });
    return changed;
  }


  function buildTournamentResults(tournament) {
    const stageOrder = new Map([
      [MATCH_STAGE_GROUP, 1],
      [MATCH_STAGE_LEAGUE, 2],
      [MATCH_STAGE_KO, 3],
    ]);

    return (Array.isArray(tournament?.matches) ? tournament.matches : [])
      .filter((match) => match?.status === STATUS_COMPLETED && isCompletedMatchResultValid(tournament, match))
      .map((match) => ({
        matchId: match.id,
        stage: match.stage,
        round: match.round,
        number: match.number,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        winnerId: match.winnerId,
        legs: {
          p1: clampInt(match.legs?.p1, 0, 0, 99),
          p2: clampInt(match.legs?.p2, 0, 0, 99),
        },
        stats: normalizeMatchStats(match.stats),
        source: match.source === "auto" ? "auto" : "manual",
        updatedAt: normalizeText(match.updatedAt || nowIso()),
      }))
      .sort((left, right) => (
        (stageOrder.get(left.stage) || 99) - (stageOrder.get(right.stage) || 99)
        || left.round - right.round
        || left.number - right.number
      ));
  }


  function refreshTournamentResultsIndex(tournament) {
    if (!tournament) {
      return false;
    }
    const nextResults = buildTournamentResults(tournament);
    if (isSerializableEqual(tournament.results, nextResults)) {
      return false;
    }
    tournament.results = nextResults;
    return true;
  }


  function refreshDerivedMatches(tournament) {
    if (!tournament) {
      return false;
    }

    let changedAny = false;
    for (let i = 0; i < 8; i += 1) {
      let changed = false;
      changed = migrateKoTournamentToV3(tournament, KO_DRAW_MODE_SEEDED) || changed;
      changed = resolveGroupsToKoAssignments(tournament) || changed;
      changed = synchronizeKoBracketState(tournament) || changed;
      changed = normalizeCompletedMatchResults(tournament) || changed;
      changed = synchronizeKoBracketState(tournament) || changed;
      if (tournament.mode === "groups_ko") {
        changed = advanceKoWinners(tournament) || changed;
      }
      changed = refreshTournamentResultsIndex(tournament) || changed;
      changedAny = changedAny || changed;
      if (!changed) {
        break;
      }
    }
    return changedAny;
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


  function deriveWinnerIdFromLegInput(match, p1Legs, p2Legs, legsToWin) {
    if (!match?.player1Id || !match?.player2Id) {
      return null;
    }
    if (p1Legs === p2Legs) {
      return null;
    }
    if (p1Legs > legsToWin || p2Legs > legsToWin) {
      return null;
    }
    if (p1Legs === legsToWin && p1Legs > p2Legs) {
      return match.player1Id;
    }
    if (p2Legs === legsToWin && p2Legs > p1Legs) {
      return match.player2Id;
    }
    return null;
  }


  function updateMatchResult(matchId, winnerId, legs, source, stats = null) {
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
    if (winnerId && winnerId !== match.player1Id && winnerId !== match.player2Id) {
      return { ok: false, message: "Gewinner passt nicht zum Match." };
    }

    const legsToWin = getLegsToWin(tournament.bestOfLegs);
    const p1Legs = clampInt(legs?.p1, 0, 0, 99);
    const p2Legs = clampInt(legs?.p2, 0, 0, 99);
    const derivedWinnerId = deriveWinnerIdFromLegInput(match, p1Legs, p2Legs, legsToWin);

    if (p1Legs > legsToWin || p2Legs > legsToWin) {
      return {
        ok: false,
        message: `Ung\u00fcltiges Ergebnis: Pro Spieler sind maximal ${legsToWin} Legs m\u00f6glich (Best-of ${sanitizeBestOf(tournament.bestOfLegs)}).`,
      };
    }

    if (p1Legs === p2Legs) {
      return { ok: false, message: "Ung\u00fcltiges Ergebnis: Bei Best-of ist kein Gleichstand m\u00f6glich." };
    }

    if (!derivedWinnerId) {
      return {
        ok: false,
        message: `Ung\u00fcltiges Ergebnis: Ein Spieler muss genau ${legsToWin} Legs erreichen (Best-of ${sanitizeBestOf(tournament.bestOfLegs)}).`,
      };
    }

    if (winnerId && winnerId !== derivedWinnerId) {
      return {
        ok: false,
        message: "Ung\u00fcltiges Ergebnis: Gewinner muss aus den Legs abgeleitet werden.",
      };
    }

    match.status = STATUS_COMPLETED;
    match.winnerId = derivedWinnerId;
    match.source = source === "auto" ? "auto" : "manual";
    match.legs = { p1: p1Legs, p2: p2Legs };
    match.stats = normalizeMatchStats(stats || match.stats);
    setMatchResultKind(match, null);
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


  function getKoBlockingSourceMatch(tournament, match) {
    if (!tournament || !match || match.stage !== MATCH_STAGE_KO || match.round <= 1) {
      return null;
    }

    const previousRound = match.round - 1;
    const sourceNumberA = ((match.number - 1) * 2) + 1;
    const sourceNumberB = sourceNumberA + 1;
    const sourceMatches = getMatchesByStage(tournament, MATCH_STAGE_KO)
      .filter((item) => (
        item.round === previousRound
        && (item.number === sourceNumberA || item.number === sourceNumberB)
      ))
      .sort((left, right) => left.number - right.number);

    if (!sourceMatches.length) {
      return null;
    }

    return sourceMatches.find((item) => item.status !== STATUS_COMPLETED) || null;
  }


  function getMatchEditability(tournament, match) {
    if (!tournament || !match) {
      return { editable: false, reason: "Match nicht verf\u00fcgbar." };
    }

    if (match.status === STATUS_COMPLETED) {
      return { editable: false, reason: "Match ist bereits abgeschlossen." };
    }

    if (!match.player1Id || !match.player2Id) {
      return { editable: false, reason: "Paarung steht noch nicht fest." };
    }

    if (match.stage === MATCH_STAGE_KO) {
      const blockingMatch = getKoBlockingSourceMatch(tournament, match);
      if (blockingMatch) {
        return {
          editable: false,
          reason: `Vorg\u00e4nger-Match Runde ${blockingMatch.round} / Spiel ${blockingMatch.number} muss zuerst abgeschlossen werden.`,
        };
      }
    }

    return { editable: true, reason: "" };
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
      const rawBoardValue = localStorage.getItem("autodarts-board");
      if (!rawBoardValue) {
        return "";
      }
      let boardId = rawBoardValue;
      try {
        const parsed = JSON.parse(rawBoardValue);
        if (typeof parsed === "string") {
          boardId = parsed;
        } else if (parsed && typeof parsed === "object") {
          boardId = normalizeText(parsed.id || parsed.boardId || parsed.uuid || parsed.value || "");
        }
      } catch (_) {
        // Keep raw value when localStorage entry is not JSON encoded.
      }
      return normalizeText(String(boardId || "").replace(/^"+|"+$/g, ""));
    } catch (_) {
      return "";
    }
  }


  function isValidBoardId(boardId) {
    const value = normalizeText(boardId || "");
    if (!value) {
      return false;
    }
    if (value === "[object Object]" || value.toLowerCase() === "manual") {
      return false;
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return true;
    }
    return /^[a-z0-9][a-z0-9-]{7,}$/i.test(value);
  }


  function collectRuntimeStatus() {
    const token = getAuthTokenFromCookie();
    const boardId = getBoardId();
    const boardPreview = boardId.length > 18 ? `${boardId.slice(0, 7)}...${boardId.slice(-6)}` : boardId;
    const autoEnabled = Boolean(state.store?.settings?.featureFlags?.autoLobbyStart);
    const authBlocked = Number(state.apiAutomation?.authBackoffUntil || 0) > Date.now();
    const hasToken = Boolean(token);
    const hasBoard = isValidBoardId(boardId);
    const hasBoardValue = Boolean(boardId);
    return {
      hasToken,
      hasBoard,
      boardId: boardId || "",
      autoEnabled,
      authBlocked,
      apiLabel: hasToken ? (authBlocked ? "API Auth abgelaufen" : "API Auth bereit") : "API Auth fehlt",
      boardLabel: hasBoard
        ? `Board aktiv (${boardPreview})`
        : hasBoardValue
          ? `Board-ID ung\u00fcltig (${boardPreview})`
          : "Kein aktives Board",
      autoLabel: autoEnabled ? "Auto-Lobby ON" : "Auto-Lobby OFF",
    };
  }


  function renderRuntimeStatusBar() {
    const status = collectRuntimeStatus();
    const apiStateClass = status.hasToken && !status.authBlocked ? "ata-status-ok" : "ata-status-warn";
    const boardStateClass = status.hasBoard ? "ata-status-ok" : "ata-status-warn";
    const autoStateClass = status.autoEnabled ? "ata-status-info" : "ata-status-neutral";
    const hint = status.autoEnabled && (!status.hasToken || !status.hasBoard)
      ? `<span class="ata-runtime-hint">Hinweis: F\u00fcr API-Halbautomatik werden Auth-Token und aktives Board ben\u00f6tigt.</span>`
      : "";
    return `
      <div class="ata-runtime-statusbar">
        <span class="ata-status-pill ${apiStateClass}">${escapeHtml(status.apiLabel)}</span>
        <span class="ata-status-pill ${boardStateClass}">${escapeHtml(status.boardLabel)}</span>
        <span class="ata-status-pill ${autoStateClass}">${escapeHtml(status.autoLabel)}</span>
        ${hint}
      </div>
    `;
  }


  function runtimeStatusSignature() {
    const status = collectRuntimeStatus();
    return [
      status.hasToken ? "1" : "0",
      status.authBlocked ? "1" : "0",
      status.boardId || "",
      status.autoEnabled ? "1" : "0",
    ].join("|");
  }


  function refreshRuntimeStatusUi() {
    const signature = runtimeStatusSignature();
    if (signature === state.runtimeStatusSignature) {
      return;
    }
    state.runtimeStatusSignature = signature;
    if (state.drawerOpen) {
      renderShell();
    }
  }


  function createApiError(status, message, body) {
    const error = new Error(String(message || "API request failed."));
    error.status = Number(status || 0);
    error.body = body;
    return error;
  }


  function apiBodyToErrorText(value, depth = 0) {
    if (value == null || depth > 3) {
      return "";
    }
    if (typeof value === "string") {
      return normalizeText(value);
    }
    if (Array.isArray(value)) {
      const parts = value.map((entry) => apiBodyToErrorText(entry, depth + 1)).filter(Boolean);
      return normalizeText(parts.join(" | "));
    }
    if (typeof value === "object") {
      const parts = [];
      ["message", "error", "detail", "title", "reason", "description"].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const text = apiBodyToErrorText(value[key], depth + 1);
          if (text) {
            parts.push(text);
          }
        }
      });
      if (value.errors && typeof value.errors === "object") {
        Object.entries(value.errors).forEach(([key, entry]) => {
          const text = apiBodyToErrorText(entry, depth + 1);
          if (text) {
            parts.push(`${key}: ${text}`);
          }
        });
      }
      const deduped = [...new Set(parts.map((entry) => normalizeText(entry)).filter(Boolean))];
      if (deduped.length) {
        return normalizeText(deduped.join(" | "));
      }
      try {
        const json = JSON.stringify(value);
        if (json && json !== "{}") {
          return normalizeText(json);
        }
      } catch (_) {
        return "";
      }
      return "";
    }
    return normalizeText(String(value));
  }


  function extractApiErrorMessage(status, body) {
    const detail = apiBodyToErrorText(body);
    if (detail) {
      return `HTTP ${status}: ${detail}`;
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


  function getRouteLobbyId(pathname = location.pathname) {
    const route = normalizeText(pathname || "");
    if (!route) {
      return "";
    }
    const match = route.match(/^\/(?:(?:history\/)?(?:matches|lobbies))\/([^/?#]+)/i);
    if (!match || !match[1]) {
      return "";
    }
    try {
      return normalizeText(decodeURIComponent(match[1]));
    } catch (_) {
      return normalizeText(match[1]);
    }
  }


  function isApiSyncCandidateMatch(match, includeErrored = false) {
    if (!match || match.status !== STATUS_PENDING) {
      return false;
    }
    const auto = ensureMatchAutoMeta(match);
    if (!auto.lobbyId) {
      return false;
    }
    if (auto.status === "started") {
      return true;
    }
    return includeErrored && auto.status === "error";
  }


  function findTournamentMatchByLobbyId(tournament, lobbyId, includeCompleted = false) {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!tournament || !targetLobbyId) {
      return null;
    }
    return tournament.matches.find((match) => {
      if (!includeCompleted && match.status !== STATUS_PENDING) {
        return false;
      }
      const auto = ensureMatchAutoMeta(match);
      return normalizeText(auto.lobbyId || "") === targetLobbyId;
    }) || null;
  }

  async function syncApiMatchResult(tournament, match, token, options = {}) {
    const notifyErrors = Boolean(options.notifyErrors);
    const notifyNotReady = Boolean(options.notifyNotReady);
    const includeErrorRetry = options.includeErrorRetry !== false;
    const trigger = normalizeText(options.trigger || "background");
    const auto = ensureMatchAutoMeta(match);
    const lobbyId = normalizeText(auto.lobbyId || "");
    if (!lobbyId) {
      return {
        ok: false,
        updated: false,
        completed: false,
        pending: true,
        reasonCode: "not_found",
        message: "Keine Lobby-ID vorhanden.",
      };
    }
    if (!includeErrorRetry && auto.status === "error") {
      return {
        ok: false,
        updated: false,
        completed: false,
        pending: true,
        reasonCode: "error",
        message: "Match ist im Fehlerstatus.",
      };
    }

    let updated = false;
    if (auto.status === "error") {
      auto.status = "started";
      auto.lastSyncAt = nowIso();
      match.updatedAt = nowIso();
      updated = true;
    }

    try {
      const stats = options.prefetchedStats || await fetchMatchStats(lobbyId, token);
      const syncTimestamp = nowIso();
      if (auto.lastError) {
        auto.lastError = null;
        auto.lastSyncAt = syncTimestamp;
        match.updatedAt = syncTimestamp;
        updated = true;
      } else if (!auto.lastSyncAt) {
        auto.lastSyncAt = syncTimestamp;
        match.updatedAt = syncTimestamp;
        updated = true;
      }

      const winnerIndex = Number(stats?.winner);
      if (!Number.isInteger(winnerIndex) || winnerIndex < 0) {
        auto.status = "started";
        if (!auto.lastSyncAt) {
          auto.lastSyncAt = syncTimestamp;
        }
        if (notifyNotReady) {
          setNotice("info", "API-Ergebnis ist noch nicht final verf\u00fcgbar.", 2200);
        }
        return {
          ok: true,
          updated,
          completed: false,
          pending: true,
          recoverable: true,
          reasonCode: "pending",
          message: "API-Ergebnis ist noch nicht final verf\u00fcgbar.",
        };
      }

      const winnerCandidates = resolveWinnerIdCandidatesFromApiStats(tournament, match, stats, winnerIndex);
      logDebug("api", "Auto-sync winner candidates resolved.", {
        trigger,
        matchId: match.id,
        lobbyId,
        winnerIndex,
        winnerCandidates,
      });
      if (!winnerCandidates.length) {
        const mappingError = "Gewinner konnte nicht eindeutig zugeordnet werden.";
        const changedError = auto.lastError !== mappingError || auto.status !== "error";
        auto.status = "error";
        auto.lastError = mappingError;
        auto.lastSyncAt = syncTimestamp;
        match.updatedAt = syncTimestamp;
        updated = true;
        if (notifyErrors && changedError) {
          setNotice("error", `Auto-Sync Fehler bei ${match.id}: Gewinner nicht zuordenbar.`);
        }
        return {
          ok: false,
          updated,
          completed: false,
          pending: true,
          recoverable: false,
          reasonCode: "error",
          message: mappingError,
        };
      }

      let result = { ok: false, message: "Auto-Sync konnte Ergebnis nicht speichern." };
      for (const winnerId of winnerCandidates) {
        const legCandidates = getApiMatchLegCandidatesFromStats(tournament, match, stats, winnerId);
        logDebug("api", "Auto-sync leg candidates resolved.", {
          trigger,
          matchId: match.id,
          winnerId,
          legCandidates,
        });
        for (const legs of legCandidates) {
          result = updateMatchResult(match.id, winnerId, legs, "auto");
          if (result.ok) {
            break;
          }
        }
        if (result.ok) {
          break;
        }
      }
      if (!result.ok) {
        logWarn("api", "Auto-sync could not persist result with resolved winner/legs candidates.", {
          trigger,
          matchId: match.id,
          winnerCandidates,
          winnerIndex,
        });
        const saveError = result.message || "Auto-Sync konnte Ergebnis nicht speichern.";
        const changedError = auto.lastError !== saveError || auto.status !== "error";
        auto.status = "error";
        auto.lastError = saveError;
        auto.lastSyncAt = syncTimestamp;
        match.updatedAt = syncTimestamp;
        updated = true;
        if (notifyErrors && changedError) {
          setNotice("error", `Auto-Sync Fehler bei ${match.id}: ${saveError}`);
        }
        return {
          ok: false,
          updated,
          completed: false,
          pending: true,
          recoverable: false,
          reasonCode: "error",
          message: saveError,
        };
      }

      const updatedMatch = findMatch(tournament, match.id);
      if (updatedMatch) {
        const updatedAuto = ensureMatchAutoMeta(updatedMatch);
        const finishedAt = nowIso();
        updatedAuto.provider = API_PROVIDER;
        updatedAuto.status = "completed";
        updatedAuto.finishedAt = finishedAt;
        updatedAuto.lastSyncAt = finishedAt;
        updatedAuto.lastError = null;
        updatedMatch.updatedAt = finishedAt;
      }

      return {
        ok: true,
        updated: true,
        completed: true,
        pending: false,
        reasonCode: "completed",
        message: "Ergebnis \u00fcbernommen.",
      };
    } catch (error) {
      const status = Number(error?.status || 0);
      if (status === 401 || status === 403) {
        return {
          ok: false,
          updated,
          completed: false,
          pending: true,
          authError: true,
          reasonCode: "auth",
          message: "Auth abgelaufen.",
        };
      }
      if (status === 404) {
        return {
          ok: false,
          updated,
          completed: false,
          pending: true,
          recoverable: true,
          reasonCode: "pending",
          message: "Match-Stats noch nicht verf\u00fcgbar.",
        };
      }

      const errorMessage = normalizeText(error?.message || "API-Sync fehlgeschlagen.") || "API-Sync fehlgeschlagen.";
      const lastSyncAtMs = auto.lastSyncAt ? Date.parse(auto.lastSyncAt) : 0;
      const shouldPersistError = auto.lastError !== errorMessage
        || !Number.isFinite(lastSyncAtMs)
        || (Date.now() - lastSyncAtMs > API_AUTH_NOTICE_THROTTLE_MS);
      if (shouldPersistError) {
        auto.status = "error";
        auto.lastError = errorMessage;
        auto.lastSyncAt = nowIso();
        match.updatedAt = nowIso();
        updated = true;
      }
      if (notifyErrors && shouldPersistError) {
        setNotice("error", `Auto-Sync Fehler bei ${match.id}: ${errorMessage}`);
      }
      return {
        ok: false,
        updated,
        completed: false,
        pending: true,
        recoverable: false,
        reasonCode: "error",
        message: errorMessage,
      };
    }
  }


  async function syncResultForLobbyId(lobbyId, options = {}) {
    const targetLobbyId = normalizeText(lobbyId || "");
    const trigger = normalizeText(options.trigger || "manual");
    const tournament = state.store.tournament;
    logDebug("api", "Lobby sync requested.", {
      trigger,
      lobbyId: targetLobbyId,
    });
    if (!targetLobbyId) {
      return { ok: false, reasonCode: "not_found", message: "Keine Lobby-ID erkannt." };
    }
    if (!tournament) {
      return { ok: false, reasonCode: "error", message: "Kein aktives Turnier vorhanden." };
    }
    if (!state.store.settings.featureFlags.autoLobbyStart) {
      return { ok: false, reasonCode: "error", message: "Auto-Lobby ist deaktiviert." };
    }

    const token = getAuthTokenFromCookie();
    if (!token) {
      return { ok: false, reasonCode: "auth", message: "Kein Auth-Token gefunden. Bitte neu einloggen." };
    }

    let openMatch = findTournamentMatchByLobbyId(tournament, targetLobbyId, false);
    const completedMatch = openMatch ? null : findTournamentMatchByLobbyId(tournament, targetLobbyId, true);
    if (!openMatch && completedMatch?.status === STATUS_COMPLETED) {
      return { ok: true, completed: true, reasonCode: "completed", message: "Ergebnis war bereits \u00fcbernommen." };
    }
    let prefetchedStats = null;
    if (!openMatch) {
      try {
        prefetchedStats = await fetchMatchStats(targetLobbyId, token);
        const recoveredMatches = findOpenMatchCandidatesByApiStats(tournament, prefetchedStats);
        logDebug("api", "Recovery match candidates resolved.", {
          trigger,
          lobbyId: targetLobbyId,
          candidateCount: recoveredMatches.length,
          candidateMatchIds: recoveredMatches.map((match) => match.id),
        });
        if (recoveredMatches.length > 1) {
          return {
            ok: false,
            reasonCode: "ambiguous",
            message: "Mehrdeutige Zuordnung: mehrere offene Turnier-Matches passen zur Lobby. Bitte in der Ergebnisf\u00fchrung manuell speichern.",
          };
        }
        if (recoveredMatches.length === 1) {
          openMatch = recoveredMatches[0];
          const auto = ensureMatchAutoMeta(openMatch);
          const now = nowIso();
          auto.provider = API_PROVIDER;
          auto.lobbyId = targetLobbyId;
          auto.status = "started";
          auto.startedAt = auto.startedAt || now;
          auto.lastSyncAt = now;
          auto.lastError = null;
          openMatch.updatedAt = now;
          tournament.updatedAt = now;
          try {
            await persistStore();
          } catch (persistError) {
            schedulePersist();
            logWarn("storage", "Immediate persist after recovery link failed; scheduled retry.", persistError);
          }
          renderShell();
        }
      } catch (error) {
        logWarn("api", "Recovery lookup via stats failed.", error);
        // Fallback keeps original behavior when stats are not yet available.
      }
    }
    if (!openMatch) {
      return { ok: false, reasonCode: "not_found", message: "Kein offenes Turnier-Match f\u00fcr diese Lobby gefunden." };
    }

    const syncOutcome = await syncApiMatchResult(tournament, openMatch, token, {
      notifyErrors: Boolean(options.notifyErrors),
      notifyNotReady: Boolean(options.notifyNotReady),
      includeErrorRetry: true,
      prefetchedStats,
      trigger,
    });

    if (syncOutcome.authError) {
      state.apiAutomation.authBackoffUntil = Date.now() + API_AUTH_NOTICE_THROTTLE_MS;
      return { ok: false, reasonCode: "auth", message: "Auth abgelaufen. Bitte neu einloggen." };
    }

    if (syncOutcome.updated) {
      if (state.store.tournament) {
        state.store.tournament.updatedAt = nowIso();
      }
      schedulePersist();
      renderShell();
    }

    const normalizedOutcome = {
      ...syncOutcome,
      reasonCode: syncOutcome.reasonCode || (syncOutcome.completed ? "completed" : (syncOutcome.pending ? "pending" : "error")),
    };
    logDebug("api", "Lobby sync finished.", {
      trigger,
      lobbyId: targetLobbyId,
      reasonCode: normalizedOutcome.reasonCode,
      ok: normalizedOutcome.ok,
      completed: Boolean(normalizedOutcome.completed),
    });
    return normalizedOutcome;
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
    const legsToWin = getLegsToWin(tournament.bestOfLegs);
    const x01Settings = normalizeTournamentX01Settings(tournament?.x01, tournament?.startScore);
    const bullOffMode = sanitizeX01BullOffMode(x01Settings.bullOffMode);
    const settings = {
      baseScore: x01Settings.baseScore,
      inMode: x01Settings.inMode,
      outMode: x01Settings.outMode,
      maxRounds: x01Settings.maxRounds,
      bullMode: sanitizeX01BullMode(x01Settings.bullMode),
    };
    return {
      variant: x01Settings.variant,
      isPrivate: true,
      bullOffMode,
      legs: legsToWin,
      settings,
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


  function resolveParticipantIdFromApiRef(tournament, participantRef) {
    const normalizedRef = normalizeText(participantRef || "");
    if (!normalizedRef) {
      return "";
    }
    const direct = (tournament?.participants || []).find((participant) => (
      normalizeText(participant?.id || "") === normalizedRef
    ));
    if (direct?.id) {
      return direct.id;
    }
    const lookup = normalizeLookup(normalizedRef);
    const byName = (tournament?.participants || []).find((participant) => (
      normalizeLookup(participant?.name || "") === lookup
    ));
    return byName?.id || "";
  }


  function getOpenMatchesByPlayersPair(tournament, player1Id, player2Id) {
    const key = new Set([normalizeText(player1Id || ""), normalizeText(player2Id || "")]);
    if (key.size !== 2 || key.has("")) {
      return [];
    }
    return (tournament?.matches || []).filter((match) => {
      if (!match || match.status !== STATUS_PENDING || !match.player1Id || !match.player2Id) {
        return false;
      }
      const set = new Set([normalizeText(match.player1Id), normalizeText(match.player2Id)]);
      return key.size === set.size && [...key].every((id) => set.has(id));
    });
  }


  function findOpenMatchCandidatesByApiStats(tournament, data) {
    if (!tournament || !data) {
      return [];
    }
    const participantIds = [];
    const seenParticipants = new Set();
    const pushId = (participantId) => {
      const id = normalizeText(participantId || "");
      if (!id || seenParticipants.has(id)) {
        return;
      }
      seenParticipants.add(id);
      participantIds.push(id);
    };

    const collectFrom = (entry) => {
      const refs = extractApiParticipantRefCandidates(entry);
      refs.forEach((ref) => {
        pushId(resolveParticipantIdFromApiRef(tournament, ref));
      });
    };

    const statsEntries = Array.isArray(data?.matchStats) ? data.matchStats : [];
    statsEntries.forEach((entry) => {
      collectFrom(entry);
    });
    const playerEntries = Array.isArray(data?.players) ? data.players : [];
    playerEntries.forEach((entry) => {
      collectFrom(entry);
    });

    if (participantIds.length < 2) {
      return [];
    }

    const matches = [];
    const seenMatches = new Set();
    for (let left = 0; left < participantIds.length; left += 1) {
      for (let right = left + 1; right < participantIds.length; right += 1) {
        const candidates = getOpenMatchesByPlayersPair(tournament, participantIds[left], participantIds[right]);
        candidates.forEach((match) => {
          if (!seenMatches.has(match.id)) {
            seenMatches.add(match.id);
            matches.push(match);
          }
        });
      }
    }

    return matches.sort((left, right) => {
      if (left.round !== right.round) {
        return left.round - right.round;
      }
      return left.number - right.number;
    });
  }


  function extractApiParticipantRefCandidates(value) {
    const refs = [];
    const pushRef = (ref) => {
      const text = normalizeText(ref || "");
      if (text) {
        refs.push(text);
      }
    };

    if (!value) {
      return refs;
    }
    if (typeof value === "string" || typeof value === "number") {
      pushRef(value);
      return refs;
    }
    if (typeof value !== "object") {
      return refs;
    }

    pushRef(value.id);
    pushRef(value.playerId);
    pushRef(value.name);
    pushRef(value.playerName);
    pushRef(value.username);

    if (value.player && typeof value.player === "object") {
      pushRef(value.player.id);
      pushRef(value.player.name);
      pushRef(value.player.username);
    }

    return refs;
  }


  function resolveWinnerIdFromApiRef(tournament, match, winnerRef) {
    const normalizedRef = normalizeText(winnerRef || "");
    if (!normalizedRef || !match?.player1Id || !match?.player2Id) {
      return "";
    }

    if (normalizedRef === match.player1Id) {
      return match.player1Id;
    }
    if (normalizedRef === match.player2Id) {
      return match.player2Id;
    }
    return resolveWinnerIdFromApiName(tournament, match, normalizedRef);
  }


  function pushWinnerIdCandidate(candidates, seen, winnerId) {
    const candidate = normalizeText(winnerId || "");
    if (!candidate || seen.has(candidate)) {
      return;
    }
    seen.add(candidate);
    candidates.push(candidate);
  }


  function resolveWinnerIdCandidatesFromApiStats(tournament, match, data, winnerIndex) {
    const candidates = [];
    const seen = new Set();
    const tryRefs = (refs) => {
      refs.forEach((ref) => {
        const winnerId = resolveWinnerIdFromApiRef(tournament, match, ref);
        pushWinnerIdCandidate(candidates, seen, winnerId);
      });
    };

    if (Number.isInteger(winnerIndex) && winnerIndex >= 0) {
      tryRefs(extractApiParticipantRefCandidates(data?.matchStats?.[winnerIndex]));
      tryRefs(extractApiParticipantRefCandidates(data?.players?.[winnerIndex]));
    }

    tryRefs(extractApiParticipantRefCandidates(data?.winnerPlayer));
    tryRefs(extractApiParticipantRefCandidates(data?.winnerEntry));
    tryRefs(extractApiParticipantRefCandidates(data?.winnerData));
    tryRefs(extractApiParticipantRefCandidates(data?.winnerName));
    tryRefs(extractApiParticipantRefCandidates(data?.winnerId));

    const matchStats = Array.isArray(data?.matchStats) ? data.matchStats : [];
    matchStats.forEach((entry) => {
      const hasWinnerFlag = entry?.winner === true
        || entry?.isWinner === true
        || entry?.won === true
        || entry?.result === "winner"
        || entry?.result === "win";
      if (hasWinnerFlag) {
        tryRefs(extractApiParticipantRefCandidates(entry));
      }
    });

    const players = Array.isArray(data?.players) ? data.players : [];
    players.forEach((entry) => {
      const hasWinnerFlag = entry?.winner === true
        || entry?.isWinner === true
        || entry?.won === true
        || entry?.result === "winner"
        || entry?.result === "win";
      if (hasWinnerFlag) {
        tryRefs(extractApiParticipantRefCandidates(entry));
      }
    });

    return candidates;
  }


  function addApiLegCandidate(candidates, seenKeys, legs) {
    if (!legs || typeof legs !== "object") {
      return;
    }
    const p1 = clampInt(legs.p1, 0, 0, 50);
    const p2 = clampInt(legs.p2, 0, 0, 50);
    const key = `${p1}:${p2}`;
    if (seenKeys.has(key)) {
      return;
    }
    seenKeys.add(key);
    candidates.push({ p1, p2 });
  }


  function doesLegsSupportWinner(match, winnerId, legs) {
    if (!match || !legs) {
      return false;
    }
    const winnerIsP1 = winnerId === match.player1Id;
    const winnerIsP2 = winnerId === match.player2Id;
    if (!winnerIsP1 && !winnerIsP2) {
      return false;
    }
    const winnerLegs = winnerIsP1 ? legs.p1 : legs.p2;
    const loserLegs = winnerIsP1 ? legs.p2 : legs.p1;
    return winnerLegs > loserLegs;
  }


  function getApiNameToLegsLookup(data) {
    const lookup = new Map();
    const players = Array.isArray(data?.players) ? data.players : [];
    const matchStats = Array.isArray(data?.matchStats) ? data.matchStats : [];
    const count = Math.max(players.length, matchStats.length);
    for (let index = 0; index < count; index += 1) {
      const statEntry = matchStats[index];
      const legs = clampInt(statEntry?.legsWon, 0, 0, 50);
      const playerName = normalizeLookup(players[index]?.name || "");
      const statName = normalizeLookup(
        statEntry?.name
        || statEntry?.playerName
        || statEntry?.player?.name
        || statEntry?.player?.username
        || "",
      );
      if (playerName && !lookup.has(playerName)) {
        lookup.set(playerName, legs);
      }
      if (statName && !lookup.has(statName)) {
        lookup.set(statName, legs);
      }
    }
    return lookup;
  }


  function getApiMatchLegCandidatesFromStats(tournament, match, data, winnerId) {
    const candidates = [];
    const seen = new Set();
    const positional = {
      p1: clampInt(data?.matchStats?.[0]?.legsWon, 0, 0, 50),
      p2: clampInt(data?.matchStats?.[1]?.legsWon, 0, 0, 50),
    };
    addApiLegCandidate(candidates, seen, positional);
    addApiLegCandidate(candidates, seen, { p1: positional.p2, p2: positional.p1 });

    const p1 = participantById(tournament, match?.player1Id);
    const p2 = participantById(tournament, match?.player2Id);
    const p1Name = normalizeLookup(p1?.name || "");
    const p2Name = normalizeLookup(p2?.name || "");
    if (p1Name && p2Name && p1Name !== p2Name) {
      const nameToLegs = getApiNameToLegsLookup(data);
      if (nameToLegs.has(p1Name) && nameToLegs.has(p2Name)) {
        addApiLegCandidate(candidates, seen, {
          p1: nameToLegs.get(p1Name),
          p2: nameToLegs.get(p2Name),
        });
      }
    }

    const winnerIndex = Number(data?.winner);
    if (Number.isInteger(winnerIndex) && winnerIndex >= 0) {
      const winnerLegs = clampInt(data?.matchStats?.[winnerIndex]?.legsWon, 0, 0, 50);
      const loserIndex = winnerIndex === 0 ? 1 : 0;
      const loserLegs = clampInt(data?.matchStats?.[loserIndex]?.legsWon, 0, 0, 50);
      if (winnerId === match?.player1Id) {
        addApiLegCandidate(candidates, seen, { p1: winnerLegs, p2: loserLegs });
      } else if (winnerId === match?.player2Id) {
        addApiLegCandidate(candidates, seen, { p1: loserLegs, p2: winnerLegs });
      }
    }

    if (!candidates.length) {
      return [positional];
    }

    const preferred = [];
    const fallback = [];
    candidates.forEach((candidate) => {
      if (doesLegsSupportWinner(match, winnerId, candidate)) {
        preferred.push(candidate);
      } else {
        fallback.push(candidate);
      }
    });
    return preferred.concat(fallback);
  }


  function getApiMatchStartUi(tournament, match, activeStartedMatch) {
    const auto = ensureMatchAutoMeta(match);
    if (auto.lobbyId) {
      return {
        label: "Zum Match",
        disabled: false,
        title: "\u00d6ffnet das bereits gestartete Match.",
      };
    }

    if (!state.store.settings.featureFlags.autoLobbyStart) {
      return {
        label: "Match starten",
        disabled: true,
        title: "Feature-Flag in Einstellungen aktivieren.",
      };
    }

    const editability = getMatchEditability(tournament, match);
    if (!editability.editable) {
      return {
        label: "Match starten",
        disabled: true,
        title: editability.reason || "Match kann aktuell nicht gestartet werden.",
      };
    }

    if (!getAuthTokenFromCookie()) {
      return {
        label: "Match starten",
        disabled: true,
        title: "Kein Auth-Token vorhanden. Bitte einloggen.",
      };
    }

    const boardId = getBoardId();
    if (!isValidBoardId(boardId)) {
      return {
        label: "Match starten",
        disabled: true,
        title: boardId
          ? `Board-ID ung\u00fcltig (${boardId}). Bitte Board in einer manuellen Lobby w\u00e4hlen.`
          : "Kein Board aktiv. Bitte einmal manuell eine Lobby \u00f6ffnen und Board w\u00e4hlen.",
      };
    }

    if (activeStartedMatch && activeStartedMatch.id !== match.id) {
      return {
        label: "Match starten",
        disabled: true,
        title: "Es l\u00e4uft bereits ein aktives Match.",
      };
    }

    if (state.apiAutomation.startingMatchId && state.apiAutomation.startingMatchId !== match.id) {
      return {
        label: "Match starten",
        disabled: true,
        title: "Ein anderer Matchstart l\u00e4uft bereits.",
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
      title: "Erstellt Lobby, f\u00fcgt Spieler hinzu und startet automatisch.",
    };
  }


  function getApiMatchStatusText(match) {
    if (isByeMatchResult(match)) {
      return "Freilos (Bye): kein API-Sync erforderlich";
    }
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

    const editability = getMatchEditability(tournament, match);
    if (!editability.editable) {
      setNotice("error", editability.reason || "Match kann aktuell nicht gestartet werden.");
      return;
    }

    const duplicates = getDuplicateParticipantNames(tournament);
    if (duplicates.length) {
      setNotice("error", "F\u00fcr Auto-Sync m\u00fcssen Teilnehmernamen eindeutig sein.");
      return;
    }

    const activeMatch = findActiveStartedMatch(tournament, match.id);
    if (activeMatch) {
      const activeAuto = ensureMatchAutoMeta(activeMatch);
      setNotice("info", "Es l\u00e4uft bereits ein aktives Match. Weiterleitung dorthin.");
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
      setNotice("error", "Board-ID fehlt. Bitte einmal manuell eine Lobby \u00f6ffnen und Board ausw\u00e4hlen.");
      return;
    }
    if (!isValidBoardId(boardId)) {
      setNotice("error", `Board-ID ist ung\u00fcltig (${boardId}). Bitte in einer manuellen Lobby ein echtes Board ausw\u00e4hlen.`);
      return;
    }

    const participant1 = participantById(tournament, match.player1Id);
    const participant2 = participantById(tournament, match.player2Id);
    if (!participant1 || !participant2) {
      setNotice("error", "Teilnehmerzuordnung im Match ist unvollst\u00e4ndig.");
      return;
    }

    let createdLobbyId = "";
    state.apiAutomation.startingMatchId = match.id;
    renderShell();

    try {
      let lobbyPayload = buildLobbyCreatePayload(tournament);
      let lobby = null;
      try {
        logDebug("api", "Creating lobby with tournament payload.", {
          matchId: match.id,
          legs: lobbyPayload.legs,
          settings: lobbyPayload.settings,
        });
        lobby = await createLobby(lobbyPayload, token);
      } catch (createError) {
        const errorStatus = Number(createError?.status || 0);
        const errorText = normalizeLookup(createError?.message || apiBodyToErrorText(createError?.body) || "");
        const shouldRetryWithBullFallback = errorStatus === 400 && errorText.includes("bull mode");
        if (!shouldRetryWithBullFallback) {
          throw createError;
        }

        // Fallback for backend validation variants that reject selected bullMode values.
        lobbyPayload = cloneSerializable(lobbyPayload) || buildLobbyCreatePayload(tournament);
        if (!lobbyPayload.settings || typeof lobbyPayload.settings !== "object") {
          lobbyPayload.settings = {};
        }
        lobbyPayload.settings.bullMode = "25/50";
        logWarn("api", "Retrying lobby create with bullMode fallback 25/50.", {
          matchId: match.id,
          legs: lobbyPayload.legs,
          settings: lobbyPayload.settings,
        });
        lobby = await createLobby(lobbyPayload, token);
      }
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

      try {
        await persistStore();
      } catch (persistError) {
        schedulePersist();
        logWarn("storage", "Immediate persist before match redirect failed; scheduled retry.", persistError);
      }
      renderShell();
      setNotice("success", "Match gestartet. Weiterleitung ins Match.");
      openMatchPage(createdLobbyId);
    } catch (error) {
      const message = normalizeText(error?.message || apiBodyToErrorText(error?.body) || "Unbekannter API-Fehler.") || "Unbekannter API-Fehler.";
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
      return isApiSyncCandidateMatch(match, true);
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
        const syncOutcome = await syncApiMatchResult(tournament, match, token, {
          notifyErrors: false,
          notifyNotReady: false,
          includeErrorRetry: true,
          trigger: "background",
        });

        if (syncOutcome.authError) {
          state.apiAutomation.authBackoffUntil = Date.now() + API_AUTH_NOTICE_THROTTLE_MS;
          if (shouldShowAuthNotice()) {
            setNotice("error", "Auto-Sync pausiert: Auth abgelaufen. Bitte neu einloggen.");
          }
          logWarn("api", "Auto-sync auth error.");
          return;
        }

        if (syncOutcome.updated) {
          hasMetaUpdates = true;
        }

        if (!syncOutcome.ok && syncOutcome.message && !syncOutcome.recoverable) {
          logWarn("api", `Auto-sync failed for ${match.id}: ${syncOutcome.message}`);
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

  // Presentation layer: UI rendering and interaction wiring.

  function onRouteChange() {
    const current = routeKey();
    if (current === state.routeKey) {
      return;
    }
    state.routeKey = current;
    logDebug("route", `Route changed to ${current}`);
    ensureHost();
    renderShell();
    renderHistoryImportButton();
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
      renderHistoryImportButton();
    }, 1000);
  }

  function buildStyles() {
    return ATA_UI_MAIN_CSS;
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
    const runtimeStatusHtml = renderRuntimeStatusBar();

    return `
      <style>${buildStyles()}</style>
      <div class="ata-root" data-open="${state.drawerOpen ? "1" : "0"}">
        <div class="ata-overlay" data-action="close-drawer"></div>
        <aside class="ata-drawer" role="dialog" aria-modal="true" aria-label="Autodarts Tournament Assistant" tabindex="-1">
          <header class="ata-header">
            <div class="ata-title-wrap">
              <h2>Turnier Assistent</h2>
              <p>Lokales Management f\u00fcr KO, Liga und Gruppenphase <span class="ata-version">v${escapeHtml(APP_VERSION)}</span></p>
            </div>
            <button type="button" class="ata-close-btn" data-action="close-drawer" aria-label="Schlie\u00dfen">Schlie\u00dfen</button>
          </header>
          <nav class="ata-tabs">${tabs}</nav>
          ${runtimeStatusHtml}
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
      const draft = normalizeCreateDraft(state.store?.ui?.createDraft, state.store?.settings);
      const randomizeChecked = draft.randomizeKoRound1 ? "checked" : "";
      const modeLimitSummary = buildModeParticipantLimitSummary();
      const startScoreOptions = X01_START_SCORE_OPTIONS.map((score) => (
        `<option value="${score}" ${draft.startScore === score ? "selected" : ""}>${score}</option>`
      )).join("");
      const pdcCompliantSetup = isPdcCompliantMatchSetup(draft);
      const pdcPresetActive = draft.x01Preset === X01_PRESET_PDC_STANDARD && pdcCompliantSetup;
      const presetStatusLabel = pdcPresetActive ? "Preset aktiv: PDC-Standard" : "Preset aktiv: Individuell";
      const pdcPresetHint = "PDC-Preset setzt KO, Best of 5, 501, Straight In, Double Out, Bull-off Normal, Bull 25/50 und Max. Runden 50.";
      const bullModeDisabled = draft.x01BullOffMode === "Off";
      const bullModeDisabledAttr = bullModeDisabled ? "disabled" : "";
      const bullModeHiddenInput = bullModeDisabled
        ? `<input type="hidden" id="ata-x01-bullmode-hidden" name="x01BullMode" value="${escapeHtml(draft.x01BullMode)}">`
        : "";
      const createHeadingLinks = [
        { href: README_TOURNAMENT_CREATE_URL, kind: "tech", label: "Erklärung zur Turniererstellung öffnen", title: "README: Turnier anlegen" },
        { href: README_INFO_SYMBOLS_URL, kind: "tech", label: "Legende der Info-Symbole öffnen", title: "README: Info-Symbole" },
      ];
      const modeHelpLinks = renderInfoLinks([
        { href: README_TOURNAMENT_MODES_URL, kind: "tech", label: "Erklärung der Modi öffnen", title: "README: Turniermodi" },
        { href: DRA_GUI_RULE_MODE_FORMATS_URL, kind: "rule", label: "DRA-Regelerklärung zu Modus und Format öffnen", title: "DRA-Regeln in der GUI: Modus und Format" },
      ]);
      const drawHelpLinks = renderInfoLinks([
        { href: README_TOURNAMENT_MODES_URL, kind: "tech", label: "Open Draw und gesetzter Draw erklärt", title: "README: KO-Modus" },
        { href: DRA_GUI_RULE_OPEN_DRAW_URL, kind: "rule", label: "DRA-Regelerklärung zu Open Draw öffnen", title: "DRA-Regeln in der GUI: Open Draw" },
      ]);
      const modeLimitHelpLinks = renderInfoLinks([
        { href: DRA_GUI_RULE_PARTICIPANT_LIMITS_URL, kind: "rule", label: "DRA-Regelerklärung zu Limits öffnen", title: "DRA-Regeln in der GUI: Teilnehmerlimits" },
      ]);
      return `
        <section class="ata-card tournamentCard">
          ${renderSectionHeading("Neues Turnier erstellen", createHeadingLinks)}
          <form id="ata-create-form" class="ata-create-form">
            <input type="hidden" id="ata-x01-preset" name="x01Preset" value="${escapeHtml(draft.x01Preset)}">
            <div class="ata-create-layout">
              <div class="ata-create-main">
                <div class="ata-grid-3 ata-grid-3-tight">
                  <div class="ata-field">
                    <label for="ata-name">Turniername</label>
                    <input id="ata-name" name="name" type="text" placeholder="z. B. Freitagsturnier" value="${escapeHtml(draft.name)}" required>
                  </div>
                  <div class="ata-field">
                    <label for="ata-mode">Modus ${modeHelpLinks}</label>
                    <select id="ata-mode" name="mode">
                      <option value="ko" ${draft.mode === "ko" ? "selected" : ""}>KO</option>
                      <option value="league" ${draft.mode === "league" ? "selected" : ""}>Liga</option>
                      <option value="groups_ko" ${draft.mode === "groups_ko" ? "selected" : ""}>Gruppenphase + KO</option>
                    </select>
                  </div>
                  <div class="ata-field">
                    <label for="ata-bestof">Best of Legs</label>
                    <input id="ata-bestof" name="bestOfLegs" type="number" min="1" max="21" step="2" value="${draft.bestOfLegs}">
                  </div>
                  <div class="ata-field">
                    <label for="ata-startscore">Startpunkte</label>
                    <select id="ata-startscore" name="startScore">
                      ${startScoreOptions}
                    </select>
                  </div>
                  <div class="ata-field">
                    <label for="ata-x01-inmode">In-Modus</label>
                    <select id="ata-x01-inmode" name="x01InMode">
                      <option value="Straight" ${draft.x01InMode === "Straight" ? "selected" : ""}>Straight</option>
                      <option value="Double" ${draft.x01InMode === "Double" ? "selected" : ""}>Double</option>
                      <option value="Master" ${draft.x01InMode === "Master" ? "selected" : ""}>Master</option>
                    </select>
                  </div>
                  <div class="ata-field">
                    <label for="ata-x01-outmode">Out-Modus</label>
                    <select id="ata-x01-outmode" name="x01OutMode">
                      <option value="Straight" ${draft.x01OutMode === "Straight" ? "selected" : ""}>Straight</option>
                      <option value="Double" ${draft.x01OutMode === "Double" ? "selected" : ""}>Double</option>
                      <option value="Master" ${draft.x01OutMode === "Master" ? "selected" : ""}>Master</option>
                    </select>
                  </div>
                  <div class="ata-field">
                    <label for="ata-x01-bulloff">Bull-off</label>
                    <select id="ata-x01-bulloff" name="x01BullOffMode">
                      <option value="Off" ${draft.x01BullOffMode === "Off" ? "selected" : ""}>Off</option>
                      <option value="Normal" ${draft.x01BullOffMode === "Normal" ? "selected" : ""}>Normal</option>
                      <option value="Official" ${draft.x01BullOffMode === "Official" ? "selected" : ""}>Official</option>
                    </select>
                  </div>
                  <div class="ata-field">
                    <label for="ata-x01-bullmode">Bull-Modus</label>
                    <select id="ata-x01-bullmode" name="x01BullMode" ${bullModeDisabledAttr}>
                      <option value="25/50" ${draft.x01BullMode === "25/50" ? "selected" : ""}>25/50</option>
                      <option value="50/50" ${draft.x01BullMode === "50/50" ? "selected" : ""}>50/50</option>
                    </select>
                    ${bullModeHiddenInput}
                  </div>
                  <div class="ata-field">
                    <label for="ata-x01-maxrounds">Max Runden</label>
                    <select id="ata-x01-maxrounds" name="x01MaxRounds">
                      <option value="15" ${draft.x01MaxRounds === 15 ? "selected" : ""}>15</option>
                      <option value="20" ${draft.x01MaxRounds === 20 ? "selected" : ""}>20</option>
                      <option value="50" ${draft.x01MaxRounds === 50 ? "selected" : ""}>50</option>
                      <option value="80" ${draft.x01MaxRounds === 80 ? "selected" : ""}>80</option>
                    </select>
                  </div>
                  <div class="ata-field">
                    <label for="ata-match-mode">Spielmodus</label>
                    <span id="ata-match-mode" class="ata-field-readonly">Legs (First to N aus Best of)</span>
                  </div>
                  <div class="ata-field">
                    <label for="ata-lobby-fixed">Lobby</label>
                    <span id="ata-lobby-fixed" class="ata-field-readonly">Privat</span>
                  </div>
                  <div class="ata-field ata-field-span-3">
                    <label for="ata-apply-pdc-preset">Preset</label>
                    <div class="ata-form-inline-actions">
                      <button id="ata-apply-pdc-preset" type="button" class="ata-btn ata-btn-sm" data-action="apply-pdc-preset">PDC-Preset anwenden</button>
                      <span class="ata-preset-pill">${escapeHtml(presetStatusLabel)}</span>
                    </div>
                  </div>
                </div>
                <div class="ata-toggle ata-toggle-compact">
                  <div>
                    <strong>KO-Erstrunde zuf\u00e4llig mischen ${drawHelpLinks}</strong>
                    <div class="ata-small">Open Draw bei aktivem Schalter, sonst gesetzter Draw.</div>
                  </div>
                  <input id="ata-randomize-ko" name="randomizeKoRound1" type="checkbox" ${randomizeChecked}>
                </div>
                <p class="ata-small ata-create-help">${escapeHtml(pdcPresetHint)}</p>
                <p class="ata-small ata-create-help">Best of 1 ist kein PDC-Standardprofil; für das Badge gilt Best of mindestens 3 Legs.</p>
                <p class="ata-small ata-create-help">Bull-off = Off deaktiviert Bull-Modus automatisch (schreibgesch\u00fctzt).</p>
              </div>
              <aside class="ata-create-side">
                <div class="ata-field">
                  <label for="ata-participants">Teilnehmer (eine Zeile pro Person)</label>
                  <textarea id="ata-participants" name="participants" placeholder="Max Mustermann&#10;Erika Musterfrau">${escapeHtml(draft.participantsText)}</textarea>
                </div>
                <div class="ata-actions">
                  <button type="button" class="ata-btn ata-btn-sm" data-action="shuffle-participants">Teilnehmer mischen</button>
                  <button type="submit" class="ata-btn ata-btn-primary">Turnier anlegen</button>
                </div>
                <p class="ata-small">Modus-Limits ${modeLimitHelpLinks}: ${escapeHtml(modeLimitSummary)}.</p>
              </aside>
            </div>
            <p class="ata-small">Bei Moduswechsel gelten die jeweiligen Grenzen sofort.</p>
          </form>
        </section>
      `;
    }

    const modeLabel = tournament.mode === "ko"
      ? "KO (Straight Knockout)"
      : tournament.mode === "league"
        ? "Liga (Round Robin)"
        : "Gruppenphase + KO (Round Robin + Straight Knockout)";

    const participantsHtml = tournament.participants.map((participant) => (
      `<span class="ata-player-chip">${escapeHtml(participant.name)}</span>`
    )).join("");
    const participantsCount = tournament.participants.length;
    const x01Settings = normalizeTournamentX01Settings(tournament?.x01, tournament?.startScore);
    const x01PresetLabel = x01Settings.presetId === X01_PRESET_PDC_STANDARD ? "PDC-Standard" : "Individuell";
    const x01BullModeLabel = x01Settings.bullOffMode === "Off"
      ? "Bull-Modus deaktiviert"
      : `Bull-Modus ${x01Settings.bullMode}`;
    const legsToWin = getLegsToWin(tournament.bestOfLegs);
    const drawMode = normalizeKoDrawMode(tournament?.ko?.drawMode, KO_DRAW_MODE_SEEDED);
    const drawModeLabel = drawMode === KO_DRAW_MODE_OPEN_DRAW ? "Open Draw" : "Gesetzter Draw";
    const drawLockLabel = tournament?.ko?.drawLocked !== false ? "Draw-Lock aktiv" : "Draw-Lock aus";
    const primaryTags = [
      { text: `Best of ${tournament.bestOfLegs} Legs`, cls: "ata-info-tag ata-info-tag-key" },
      { text: `First to ${legsToWin} Legs`, cls: "ata-info-tag" },
      { text: `Startpunkte ${tournament.startScore}`, cls: "ata-info-tag" },
      ...(tournament.mode === "ko"
        ? [
          { text: drawModeLabel, cls: "ata-info-tag ata-info-tag-accent" },
          { text: drawLockLabel, cls: "ata-info-tag" },
        ]
        : []),
    ];
    const x01Tags = [
      { text: `X01 ${x01PresetLabel}`, cls: "ata-info-tag ata-info-tag-key" },
      { text: `${x01Settings.inMode} In`, cls: "ata-info-tag" },
      { text: `${x01Settings.outMode} Out`, cls: "ata-info-tag" },
      { text: `Bull-off ${x01Settings.bullOffMode}`, cls: "ata-info-tag" },
      { text: x01BullModeLabel, cls: "ata-info-tag" },
      { text: `Max. Runden ${x01Settings.maxRounds}`, cls: "ata-info-tag" },
    ];
    const primaryTagsHtml = primaryTags.map((tag) => `<span class="${tag.cls}">${escapeHtml(tag.text)}</span>`).join("");
    const x01TagsHtml = x01Tags.map((tag) => `<span class="${tag.cls}">${escapeHtml(tag.text)}</span>`).join("");
    const activeTournamentHeadingLinks = [
      { href: README_TOURNAMENT_MODES_URL, kind: "tech", label: "Turniermodus-Erklärung öffnen", title: "README: Turniermodi" },
    ];
    const activeFormatHelpLinks = renderInfoLinks([
      { href: DRA_GUI_RULE_MODE_FORMATS_URL, kind: "rule", label: "DRA-Regelerklärung zu Modus und Format öffnen", title: "DRA-Regeln in der GUI: Modus und Format" },
    ]);

    return `
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Aktives Turnier", activeTournamentHeadingLinks)}
        <p class="ata-tournament-title">
          <b>${escapeHtml(tournament.name)}</b>
          <span class="ata-tournament-mode-pill">${escapeHtml(modeLabel)}</span>
        </p>
        <div class="ata-tournament-meta">
          <div class="ata-meta-block">
            <div class="ata-meta-heading">Format ${activeFormatHelpLinks}</div>
            <div class="ata-info-tag-cloud">${primaryTagsHtml}</div>
          </div>
          <div class="ata-meta-block">
            <div class="ata-meta-heading">Spiel-Setup (X01)</div>
            <div class="ata-info-tag-cloud">${x01TagsHtml}</div>
          </div>
          <div class="ata-meta-block">
            <div class="ata-meta-heading">Teilnehmerfeld <span class="ata-player-chip-count">(${participantsCount})</span></div>
            <div class="ata-player-chip-cloud">${participantsHtml}</div>
          </div>
        </div>
      </section>
      <section class="ata-card tournamentCard">
        <h3>Turnier zur\u00fccksetzen</h3>
        <p class="ata-small">Dieser Schritt l\u00f6scht alle Spielst\u00e4nde. Bitte vorher exportieren.</p>
        <div class="ata-actions">
          <button type="button" class="ata-btn ata-btn-danger" data-action="reset-tournament">Turnier l\u00f6schen</button>
        </div>
      </section>
    `;
  }

  function compareMatchesByRound(left, right) {
    const stageOrder = { group: 1, league: 2, ko: 3 };
    const leftOrder = stageOrder[left.stage] || 99;
    const rightOrder = stageOrder[right.stage] || 99;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return left.round - right.round || left.number - right.number;
  }


  function getMatchPriorityReadyFirst(tournament, match) {
    const auto = ensureMatchAutoMeta(match);
    const playability = getMatchEditability(tournament, match);
    if (match.status === STATUS_PENDING && auto.status === "started" && auto.lobbyId) {
      return 0;
    }
    if (match.status === STATUS_PENDING && playability.editable) {
      return 1;
    }
    if (match.status === STATUS_COMPLETED && !isByeMatchResult(match)) {
      return 2;
    }
    if (match.status === STATUS_COMPLETED && isByeMatchResult(match)) {
      return 3;
    }
    return 4;
  }


  function getMatchPriorityStatus(tournament, match) {
    const playability = getMatchEditability(tournament, match);
    if (match.status === STATUS_PENDING && playability.editable) {
      return 0;
    }
    if (match.status === STATUS_PENDING) {
      return 1;
    }
    if (isByeMatchResult(match)) {
      return 3;
    }
    return 2;
  }


  function sortMatchesForDisplay(tournament, sortMode) {
    const mode = sanitizeMatchesSortMode(sortMode, MATCH_SORT_MODE_READY_FIRST);
    const source = Array.isArray(tournament?.matches) ? tournament.matches.slice() : [];
    if (mode === MATCH_SORT_MODE_ROUND) {
      return source.sort(compareMatchesByRound);
    }
    if (mode === MATCH_SORT_MODE_STATUS) {
      return source.sort((left, right) => {
        const leftPriority = getMatchPriorityStatus(tournament, left);
        const rightPriority = getMatchPriorityStatus(tournament, right);
        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }
        return compareMatchesByRound(left, right);
      });
    }
    return source.sort((left, right) => {
      const leftPriority = getMatchPriorityReadyFirst(tournament, left);
      const rightPriority = getMatchPriorityReadyFirst(tournament, right);
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return compareMatchesByRound(left, right);
    });
  }


  function findSuggestedNextMatch(tournament) {
    const source = Array.isArray(tournament?.matches) ? tournament.matches.slice() : [];
    const candidates = source
      .filter((match) => {
        if (!match || match.status !== STATUS_PENDING) {
          return false;
        }
        const playability = getMatchEditability(tournament, match);
        if (!playability.editable) {
          return false;
        }
        const auto = ensureMatchAutoMeta(match);
        return !(auto.status === "started" && auto.lobbyId);
      })
      .sort(compareMatchesByRound);
    return candidates[0] || null;
  }


  function renderMatchesTab() {
    const tournament = state.store.tournament;
    if (!tournament) {
      return `<section class="ata-card tournamentCard"><h3>Keine Turnierdaten</h3><p>Bitte zuerst ein Turnier erstellen.</p></section>`;
    }

    const activeStartedMatch = findActiveStartedMatch(tournament);
    const sortMode = sanitizeMatchesSortMode(state.store?.ui?.matchesSortMode, MATCH_SORT_MODE_READY_FIRST);
    const sortOptions = [
      { id: MATCH_SORT_MODE_READY_FIRST, label: "Spielbar zuerst" },
      { id: MATCH_SORT_MODE_ROUND, label: "Runde/Spiel" },
      { id: MATCH_SORT_MODE_STATUS, label: "Status" },
    ];

    const matches = sortMatchesForDisplay(tournament, sortMode);
    const legsToWin = getLegsToWin(tournament.bestOfLegs);
    const suggestedNextMatch = findSuggestedNextMatch(tournament);
    const suggestedNextMatchId = suggestedNextMatch?.id || "";
    const koFinalRound = getMatchesByStage(tournament, MATCH_STAGE_KO).reduce((maxRound, koMatch) => {
      const roundNumber = Number.parseInt(String(koMatch?.round || "0"), 10);
      return Number.isFinite(roundNumber) && roundNumber > maxRound ? roundNumber : maxRound;
    }, 0);

    const cards = matches.map((match) => {
      const player1 = participantNameById(tournament, match.player1Id);
      const player2 = participantNameById(tournament, match.player2Id);
      const winner = participantNameById(tournament, match.winnerId);
      const isOpenSlot = (name) => name === "\u2205 offen";
      const playability = getMatchEditability(tournament, match);
      const editable = playability.editable;
      const auto = ensureMatchAutoMeta(match);
      const isCompleted = match.status === STATUS_COMPLETED;
      const isByeCompletion = isCompleted && isByeMatchResult(match);
      const isAutoStarted = match.status === STATUS_PENDING && auto.status === "started" && Boolean(auto.lobbyId);
      const isBlockedPending = match.status === STATUS_PENDING && !editable;
      const isReadyPending = match.status === STATUS_PENDING && editable;
      const isSuggestedNext = Boolean(suggestedNextMatchId) && match.id === suggestedNextMatchId;
      const isKoFinal = match.stage === MATCH_STAGE_KO && koFinalRound > 0 && Number(match.round) === koFinalRound;
      const stageLabel = match.stage === MATCH_STAGE_GROUP
        ? `Gruppe ${match.groupId || "?"}`
        : match.stage === MATCH_STAGE_LEAGUE
          ? "Liga (Round Robin)"
          : "KO (Straight Knockout)";
      const startUi = getApiMatchStartUi(tournament, match, activeStartedMatch);
      const startDisabledAttr = startUi.disabled ? "disabled" : "";
      const startTitleAttr = startUi.title ? `title="${escapeHtml(startUi.title)}"` : "";
      const autoStatus = getApiMatchStatusText(match);
      let statusLine = "";
      if (match.status === STATUS_PENDING) {
        if (!editable && playability.reason) {
          statusLine = auto.status === "idle"
            ? playability.reason
            : `${playability.reason} - ${autoStatus}`;
        } else if (auto.status !== "idle") {
          statusLine = autoStatus;
        }
      } else if (!isByeCompletion && auto.status !== "completed") {
        statusLine = autoStatus;
      }
      const matchCellText = `Runde ${match.round} / Spiel ${match.number}`;
      const matchCellHelpText = "Runde = Turnierrunde, Spiel = Paarung innerhalb dieser Runde.";
      const legsP1HelpText = `Hier die Anzahl gewonnener Legs von ${player1} eintragen (nicht Punkte pro Wurf). Ziel: ${legsToWin} Legs f\u00fcr den Matchgewinn.`;
      const legsP2HelpText = `Hier die Anzahl gewonnener Legs von ${player2} eintragen (nicht Punkte pro Wurf). Ziel: ${legsToWin} Legs f\u00fcr den Matchgewinn.`;
      const saveHelpText = `Speichert Legs f\u00fcr ${player1} vs ${player2}. Sieger wird automatisch aus den Legs bestimmt. Sieger muss ${legsToWin} Legs erreichen.`;
      const rowClasses = [
        "ata-match-card",
        isCompleted ? "ata-row-completed" : "",
        isByeCompletion ? "ata-row-bye" : "",
        isAutoStarted ? "ata-row-live" : "",
        isReadyPending ? "ata-row-ready" : "",
        isSuggestedNext ? "ata-row-next" : "",
        isKoFinal ? "ata-row-final" : "",
        isBlockedPending ? "ata-row-blocked" : "",
        !editable ? "ata-row-inactive" : "",
      ].filter(Boolean).join(" ");
      const statusBadgeText = isByeCompletion ? "Freilos (Bye)" : (isCompleted ? "Abgeschlossen" : "Offen");
      const contextPillClass = isByeCompletion
        ? "ata-match-context-pill ata-match-context-bye"
        : (isCompleted ? "ata-match-context-pill ata-match-context-completed" : "ata-match-context-pill ata-match-context-open");
      const contextText = `${stageLabel}, ${matchCellText}, ${statusBadgeText}`;
      const summaryText = isCompleted
        ? (isByeCompletion
          ? `Weiter (Bye): ${winner}`
          : (isKoFinal ? `Champion: ${winner} (${match.legs.p1}:${match.legs.p2})` : `Sieger: ${winner} (${match.legs.p1}:${match.legs.p2})`))
        : "";
      const advanceClasses = [
        "ata-match-advance-pill",
        isByeCompletion ? "ata-match-advance-bye" : "",
        isKoFinal ? "ata-match-advance-final" : "",
      ].filter(Boolean).join(" ");

      const buildPairingPlayerHtml = (name, participantId) => {
        const classes = ["ata-pairing-player"];
        if (isOpenSlot(name)) {
          classes.push("ata-open-slot");
          return `<span class="${classes.join(" ")}">${escapeHtml(name)}</span>`;
        }
        if (isCompleted && match.winnerId) {
          if (participantId === match.winnerId) {
            classes.push("is-winner");
            if (isKoFinal) {
              classes.push("is-champion");
            }
          } else if (participantId === match.player1Id || participantId === match.player2Id) {
            classes.push("is-loser");
          }
        }
        return `<span class="${classes.join(" ")}">${escapeHtml(name)}</span>`;
      };

      const player1PairingHtml = buildPairingPlayerHtml(player1, match.player1Id);
      const player2PairingHtml = buildPairingPlayerHtml(player2, match.player2Id);

      const editorHtml = editable
        ? `
          <div class="ata-match-editor">
            <div class="ata-score-grid">
              <input
                type="number"
                min="0"
                max="${legsToWin}"
                data-field="legs-p1"
                data-match-id="${escapeHtml(match.id)}"
                value="${match.legs.p1}"
                aria-label="${escapeHtml(legsP1HelpText)}"
                title="${escapeHtml(legsP1HelpText)}"
              >
              <input
                type="number"
                min="0"
                max="${legsToWin}"
                data-field="legs-p2"
                data-match-id="${escapeHtml(match.id)}"
                value="${match.legs.p2}"
                aria-label="${escapeHtml(legsP2HelpText)}"
                title="${escapeHtml(legsP2HelpText)}"
              >
            </div>
            <div class="ata-editor-actions">
              <button type="button" class="ata-btn" data-action="save-match" data-match-id="${escapeHtml(match.id)}" title="${escapeHtml(saveHelpText)}">Speichern</button>
              <button type="button" class="ata-btn ata-btn-primary" data-action="start-match" data-match-id="${escapeHtml(match.id)}" ${startDisabledAttr} ${startTitleAttr}>${escapeHtml(startUi.label)}</button>
            </div>
          </div>
        `
        : "";

      const summaryHtml = summaryText
        ? `<span class="${escapeHtml(advanceClasses)}">${escapeHtml(summaryText)}</span>`
        : "";
      const nextPillHtml = isSuggestedNext
        ? `<span class="ata-match-next-pill" title="Empfohlene n\u00e4chste Paarung (PDC: Next Match)">N\u00e4chstes Match</span>`
        : "";
      const finalPillHtml = isKoFinal
        ? `<span class="ata-match-final-pill" title="Finale">🏆 Finale</span>`
        : "";
      const statusLineHtml = statusLine
        ? `<div class="ata-match-note">${escapeHtml(statusLine)}</div>`
        : "";

      return `
        <article class="${escapeHtml(rowClasses)}" data-match-id="${escapeHtml(match.id)}">
          <div class="ata-match-card-head">
            <div class="ata-match-title-row">
              <div class="ata-match-pairing">${player1PairingHtml} <span class="ata-vs">vs</span> ${player2PairingHtml}</div>
              <div class="ata-match-meta-inline">
                ${finalPillHtml}
                ${nextPillHtml}
                <span class="${contextPillClass}" title="${escapeHtml(matchCellHelpText)}">${escapeHtml(contextText)}</span>
              </div>
            </div>
            ${summaryHtml}
          </div>
          ${editorHtml}
          ${statusLineHtml}
        </article>
      `;
    }).join("");

    const cardsHtml = cards || `<p class="ata-small">Keine Matches vorhanden.</p>`;
    const resultHeadingLinks = [
      { href: README_API_AUTOMATION_URL, kind: "tech", label: "Erklärung zur API-Halbautomatik öffnen", title: "README: API-Halbautomatik" },
      { href: DRA_GUI_RULE_TIE_BREAK_URL, kind: "rule", label: "DRA-Regelerklärung zum Tie-Break öffnen", title: "DRA-Regeln in der GUI: Tie-Break" },
    ];
    const nextMatchHelpLinks = renderInfoLinks([
      { href: README_API_AUTOMATION_URL, kind: "tech", label: "Ablauf der Ergebnisführung öffnen", title: "README: API-Halbautomatik und Ergebnisführung" },
      { href: README_TOURNAMENT_MODES_URL, kind: "tech", label: "Turniermodus-Kontext öffnen", title: "README: Turniermodi" },
    ]);
    const nextHintHtml = suggestedNextMatchId
      ? `<p class="ata-small ata-next-hint">Hinweis: Die Markierung "Nächstes Match" zeigt die empfohlene nächste Paarung (PDC: Next Match) ${nextMatchHelpLinks}.</p>`
      : "";
    const sortButtonsHtml = sortOptions.map((option) => `
      <button type="button" class="ata-segmented-btn" data-action="set-matches-sort" data-sort-mode="${option.id}" data-active="${sortMode === option.id ? "1" : "0"}">${escapeHtml(option.label)}</button>
    `).join("");

    return `
      <section class="ata-card tournamentCard ata-matches-card">
        ${renderSectionHeading("Ergebnisführung", resultHeadingLinks)}
        <p class="ata-small">API-Halbautomatik: Match per Klick starten, Ergebnis wird automatisch synchronisiert. Manuelle Eingabe bleibt als Fallback aktiv. ${renderInfoLinks([
          { href: README_API_AUTOMATION_URL, kind: "tech", label: "Voraussetzungen und Ablauf öffnen", title: "README: API-Halbautomatik" },
        ])}</p>
        <div class="ata-matches-toolbar">
          <div class="ata-segmented" role="group" aria-label="Match-Sortierung">${sortButtonsHtml}</div>
        </div>
        ${nextHintHtml}
        <div class="ata-match-list">${cardsHtml}</div>
      </section>
    `;
  }

  function renderStandingsTable(rows, headline, headingLinks = []) {
    const bodyRows = rows.map((row) => `
      <tr>
        <td>${row.rank}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${row.played}</td>
        <td>${row.wins}</td>
        <td>${row.draws || 0}</td>
        <td>${row.losses}</td>
        <td>${row.points}</td>
        <td>${row.legDiff}</td>
        <td>${row.legsFor}</td>
        <td>${row.tiebreakState === "playoff_required" ? "Playoff" : "-"}</td>
      </tr>
    `).join("");

    return `
      <div class="ata-card">
        ${renderSectionHeading(headline, headingLinks)}
        <div class="ata-table-wrap">
          <table class="ata-table tournamentRanking">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Sp</th>
                <th>S</th>
                <th>U</th>
                <th>N</th>
                <th>Pkt</th>
                <th>LegDiff</th>
                <th>Legs+</th>
                <th>TB</th>
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
      return `<p class="ata-small">Kein KO-Turnierbaum vorhanden.</p>`;
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
          .map((match) => {
            const isCompleted = isCompletedMatchResultValid(tournament, match);
            const isBye = isCompleted && isByeMatchResult(match);
            const statusBadgeClass = isBye
              ? "ata-match-status ata-match-status-bye"
              : (isCompleted ? "ata-match-status ata-match-status-completed" : "ata-match-status ata-match-status-open");
            const statusBadgeText = isBye ? "Freilos (Bye)" : (isCompleted ? "Abgeschlossen" : "Offen");
            const statusText = !isCompleted
              ? "Noch nicht abgeschlossen."
              : isBye
                ? `Freilos (Bye): ${escapeHtml(participantNameById(tournament, match.winnerId))}`
                : `Gewinner: ${escapeHtml(participantNameById(tournament, match.winnerId))}`;
            return `
              <div class="ata-bracket-match">
                <div>${escapeHtml(participantNameById(tournament, match.player1Id))}</div>
                <div>${escapeHtml(participantNameById(tournament, match.player2Id))}</div>
                <div><span class="${statusBadgeClass}">${statusBadgeText}</span></div>
                <div class="ata-small">${statusText}</div>
              </div>
            `;
          }).join("");

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
    const fallbackVisible = state.bracket.failed ? "1" : "0";

    if (tournament.mode === "league") {
      const standings = standingsForMatches(tournament, getMatchesByStage(tournament, MATCH_STAGE_LEAGUE));
      html += renderStandingsTable(standings, "Liga-Tabelle", [
        { href: DRA_GUI_RULE_TIE_BREAK_URL, kind: "rule", label: "DRA-Regelerklärung zum Tie-Break öffnen", title: "DRA-Regeln in der GUI: Tie-Break" },
      ]);
      html += renderLeagueSchedule(tournament);
    } else if (tournament.mode === "groups_ko") {
      const standingsMap = groupStandingsMap(tournament);
      const groupCards = [];
      const blockedGroups = [];
      standingsMap.forEach((entry) => {
        groupCards.push(renderStandingsTable(entry.rows, `Tabelle ${entry.group.name}`, [
          { href: DRA_GUI_RULE_TIE_BREAK_URL, kind: "rule", label: "DRA-Regelerklärung zum Tie-Break öffnen", title: "DRA-Regeln in der GUI: Tie-Break" },
        ]));
        if (entry.groupResolution?.status === "playoff_required") {
          blockedGroups.push(`${entry.group.name}: ${entry.groupResolution.reason}`);
        }
      });
      html += `<div class="ata-group-grid">${groupCards.join("")}</div>`;
      if (blockedGroups.length) {
        html += `
          <section class="ata-card tournamentCard">
            ${renderSectionHeading("Gruppenentscheidung offen", [
              { href: DRA_GUI_RULE_TIE_BREAK_URL, kind: "rule", label: "DRA-Regelerklärung zum Tie-Break öffnen", title: "DRA-Regeln in der GUI: Tie-Break" },
            ])}
            <p class="ata-small">KO-Qualifikation ist blockiert, bis folgende DRA-Entscheidungen geklärt sind:</p>
            <ul class="ata-small">
              ${blockedGroups.map((text) => `<li>${escapeHtml(text)}</li>`).join("")}
            </ul>
          </section>
        `;
      }
    }

    if (tournament.mode === "ko" || tournament.mode === "groups_ko") {
      html += `
        <section class="ata-card tournamentCard">
          ${renderSectionHeading("KO-Turnierbaum", [
            { href: DRA_GUI_RULE_BYE_URL, kind: "rule", label: "DRA-Regelerklärung zu Freilosen öffnen", title: "DRA-Regeln in der GUI: Freilos (Bye)" },
          ])}
          <div class="ata-bracket-dock" id="ata-bracket-dock">
            <div class="ata-bracket-shell">
              <iframe id="ata-bracket-frame" class="ata-bracket-frame" title="Turnierbaum" sandbox="allow-scripts allow-same-origin"></iframe>
              <div class="ata-bracket-fallback" id="ata-bracket-fallback" data-visible="${fallbackVisible}">
                ${renderStaticBracketFallback(tournament)}
              </div>
            </div>
          </div>
          <div class="ata-actions" style="margin-top: 10px;">
            <button type="button" class="ata-btn" data-action="retry-bracket">Turnierbaum neu laden</button>
          </div>
          <p class="ata-small">CDN-Render aktiv. Der HTML-Fallback wird nur bei Fehlern oder Timeout angezeigt.</p>
        </section>
      `;
    }

    return html || `<section class="ata-card tournamentCard"><h3>Turnierbaum</h3><p>Keine Daten.</p></section>`;
  }


  function syncBracketFallbackVisibility() {
    const shadow = state.shadowRoot;
    if (!shadow || state.activeTab !== "view") {
      return;
    }
    const fallback = shadow.getElementById("ata-bracket-fallback");
    if (!(fallback instanceof HTMLElement)) {
      return;
    }
    fallback.setAttribute("data-visible", state.bracket.failed ? "1" : "0");
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
          <label for="ata-import-text">JSON einf\u00fcgen</label>
          <textarea id="ata-import-text" placeholder="{ ... }"></textarea>
        </div>
        <div class="ata-actions" style="margin-top: 10px;">
          <button type="button" class="ata-btn" data-action="import-text">Eingef\u00fcgtes JSON importieren</button>
        </div>
      </section>
    `;
  }

  function renderSettingsTab() {
    const debugEnabled = state.store.settings.debug ? "checked" : "";
    const autoLobbyEnabled = state.store.settings.featureFlags.autoLobbyStart ? "checked" : "";
    const randomizeKoEnabled = state.store.settings.featureFlags.randomizeKoRound1 ? "checked" : "";
    const koDrawLockDefaultEnabled = state.store.settings.featureFlags.koDrawLockDefault !== false ? "checked" : "";
    const activeKoDrawLocked = state.store?.tournament?.mode === "ko"
      ? (state.store?.tournament?.ko?.drawLocked !== false ? "checked" : "")
      : "";
    const activeKoDrawLockDisabledAttr = state.store?.tournament?.mode === "ko" ? "" : "disabled";
    const modeLimitSummary = buildModeParticipantLimitSummary();
    const tieBreakProfile = normalizeTieBreakProfile(
      state.store?.tournament?.rules?.tieBreakProfile,
      TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE,
    );
    const tieBreakDisabledAttr = state.store?.tournament ? "" : "disabled";
    const apiSyncHelpLinks = renderInfoLinks([
      { href: README_API_AUTOMATION_URL, kind: "tech", label: "Erkl\u00e4rung zur API-Halbautomatik \u00f6ffnen", title: "README: API-Halbautomatik" },
      { href: README_INFO_SYMBOLS_URL, kind: "tech", label: "Legende der Info-Symbole \u00f6ffnen", title: "README: Info-Symbole" },
    ]);
    const koDrawHelpLinks = renderInfoLinks([
      { href: README_TOURNAMENT_MODES_URL, kind: "tech", label: "Erkl\u00e4rung zu Turniermodi \u00f6ffnen", title: "README: Turniermodi und Open Draw" },
      { href: DRA_GUI_RULE_OPEN_DRAW_URL, kind: "rule", label: "DRA-Regelerkl\u00e4rung zu Open Draw \u00f6ffnen", title: "DRA-Regeln in der GUI: Open Draw" },
    ]);
    const koDrawLockHelpLinks = renderInfoLinks([
      { href: DRA_GUI_RULE_DRAW_LOCK_URL, kind: "rule", label: "DRA-Regelerkl\u00e4rung zu Draw-Lock \u00f6ffnen", title: "DRA-Regeln in der GUI: Draw-Lock" },
    ]);

    return `
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Debug und Feature-Flags", [
          { href: README_SETTINGS_URL, kind: "tech", label: "Einstellungen-Dokumentation \u00f6ffnen", title: "README: Einstellungen" },
          { href: README_INFO_SYMBOLS_URL, kind: "tech", label: "Legende der Info-Symbole \u00f6ffnen", title: "README: Info-Symbole" },
        ])}
        <div class="ata-toggle">
          <div>
            <strong>Debug-Mode</strong>
            <div class="ata-small">Aktiviert detaillierte Logs in der Browser-Konsole.</div>
          </div>
          <input type="checkbox" id="ata-setting-debug" data-action="toggle-debug" ${debugEnabled}>
        </div>
        <div class="ata-toggle">
          <div>
            <strong>Automatischer Lobby-Start + API-Sync ${apiSyncHelpLinks}</strong>
            <div class="ata-small">Standard: AUS. Aktiviert Matchstart per Klick und automatische Ergebnis\u00fcbernahme aus der Autodarts-API.</div>
          </div>
          <input type="checkbox" id="ata-setting-autolobby" data-action="toggle-autolobby" ${autoLobbyEnabled}>
        </div>
        <div class="ata-toggle">
          <div>
            <strong>KO-Erstrunde zuf\u00e4llig mischen (Standard) ${koDrawHelpLinks}</strong>
            <div class="ata-small">Standard: EIN. Neue KO-Turniere nutzen damit Open Draw (zuf\u00e4llige Reihenfolge, PDC-konforme Freilose).</div>
          </div>
          <input type="checkbox" id="ata-setting-randomize-ko" data-action="toggle-randomize-ko" ${randomizeKoEnabled}>
        </div>
        <div class="ata-toggle">
          <div>
            <strong>KO-Draw sperren (Standard) ${koDrawLockHelpLinks}</strong>
            <div class="ata-small">Standard: EIN. Neue KO-Turniere behalten den initialen Draw unver\u00e4ndert.</div>
          </div>
          <input type="checkbox" id="ata-setting-ko-draw-lock-default" data-action="toggle-ko-draw-lock-default" ${koDrawLockDefaultEnabled}>
        </div>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("KO Draw-Lock (aktives Turnier)", [
          { href: DRA_GUI_RULE_DRAW_LOCK_URL, kind: "rule", label: "DRA-Regelerkl\u00e4rung zu Draw-Lock \u00f6ffnen", title: "DRA-Regeln in der GUI: Draw-Lock" },
        ])}
        <div class="ata-toggle">
          <div>
            <strong>Draw unver\u00e4nderlich halten</strong>
            <div class="ata-small">Wenn aktiv, bleibt die KO-Struktur dieses Turniers bestehen und wird nicht automatisch neu ausgelost.</div>
          </div>
          <input type="checkbox" id="ata-setting-ko-draw-locked" data-action="set-ko-draw-locked" ${activeKoDrawLocked} ${activeKoDrawLockDisabledAttr}>
        </div>
        <p class="ata-small">Nur f\u00fcr den Modus KO (Straight Knockout) verf\u00fcgbar.</p>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Promoter Tie-Break-Profil", [
          { href: DRA_GUI_RULE_TIE_BREAK_URL, kind: "rule", label: "DRA-Regelerkl\u00e4rung zum Tie-Break \u00f6ffnen", title: "DRA-Regeln in der GUI: Tie-Break" },
        ])}
        <div class="ata-field">
          <label for="ata-setting-tiebreak">Profil pro Turnier</label>
          <select id="ata-setting-tiebreak" data-action="set-tiebreak-mode" ${tieBreakDisabledAttr}>
            <option value="${TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE}" ${tieBreakProfile === TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE ? "selected" : ""}>Promoter H2H + Mini-Tabelle (empfohlen)</option>
            <option value="${TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF}" ${tieBreakProfile === TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF ? "selected" : ""}>Promoter Punkte + LegDiff</option>
          </select>
        </div>
        <p class="ata-small"><strong>Promoter H2H + Mini-Tabelle:</strong> Punkte (2/1/0), danach Direktvergleich (2er-Gleichstand), Teilgruppen-Leg-Differenz (3+), Gesamt-Leg-Differenz, Legs gewonnen; verbleibender Gleichstand = &bdquo;Playoff erforderlich&ldquo;.</p>
        <p class="ata-small"><strong>Promoter Punkte + LegDiff:</strong> vereinfachte Sortierung \u00fcber Punkte, Gesamt-Leg-Differenz und Legs gewonnen (legacy-kompatibel).</p>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("DRA Checkliste (nicht automatisierbar)", [
          { href: DRA_GUI_RULE_CHECKLIST_URL, kind: "rule", label: "DRA-Regelerkl\u00e4rung zur Checkliste \u00f6ffnen", title: "DRA-Regeln in der GUI: Checkliste" },
        ])}
        <ul class="ata-small">
          <li>Start-/Wurfreihenfolge und Bull-Off-Entscheidungen werden durch den Spielleiter vor Ort best\u00e4tigt.</li>
          <li>Practice/Anspielzeit und Board-Etikette werden organisatorisch durchgesetzt.</li>
          <li>Tie-Break-Entscheidungen bei verbleibendem Gleichstand erfolgen als Promoter-Entscheidung.</li>
          <li>Unklare Sonderf\u00e4lle werden dokumentiert und manuell entschieden, bevor der Turnierfortschritt fortgesetzt wird.</li>
        </ul>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Regelbasis und Limits", [
          { href: DRA_GUI_RULE_PARTICIPANT_LIMITS_URL, kind: "rule", label: "DRA-Regelerkl\u00e4rung zu Limits \u00f6ffnen", title: "DRA-Regeln in der GUI: Teilnehmerlimits" },
        ])}
        <p class="ata-small">Aktive Modus-Limits: ${escapeHtml(modeLimitSummary)}.</p>
        <p class="ata-small">Die DRA-Regeln setzen kein fixes globales Teilnehmermaximum. Die Grenzen oben sind bewusst f\u00fcr faire Turnierdauer und stabile Darstellung gesetzt.</p>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Storage", [
          { href: README_BASE_URL, kind: "tech", label: "Hinweise zu Storage und Import \u00f6ffnen", title: "README: Import, Migration und Persistenz" },
        ])}
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
      syncBracketFallbackVisibility();
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

    shadow.querySelectorAll("[data-action='set-matches-sort']").forEach((button) => {
      button.addEventListener("click", () => {
        const sortMode = sanitizeMatchesSortMode(button.getAttribute("data-sort-mode"), MATCH_SORT_MODE_READY_FIRST);
        if (state.store.ui.matchesSortMode === sortMode) {
          return;
        }
        state.store.ui.matchesSortMode = sortMode;
        schedulePersist();
        renderShell();
      });
    });

    const createForm = shadow.getElementById("ata-create-form");
    if (createForm instanceof HTMLFormElement) {
      syncCreateFormDependencies(createForm);
      const handleDraftInputChange = (event) => {
        const target = event?.target;
        const fieldName = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement
          ? normalizeText(target.name || "")
          : "";
        if (isCreateDraftPresetField(fieldName)) {
          setCreateFormPresetValue(createForm, X01_PRESET_CUSTOM);
        }
        syncCreateFormDependencies(createForm);
        updateCreateDraftFromForm(createForm, true);
      };
      createForm.addEventListener("input", handleDraftInputChange);
      createForm.addEventListener("change", handleDraftInputChange);
      createForm.addEventListener("submit", (event) => {
        event.preventDefault();
        handleCreateTournament(createForm);
      });

      const applyPresetButton = createForm.querySelector("[data-action='apply-pdc-preset']");
      if (applyPresetButton instanceof HTMLButtonElement) {
        applyPresetButton.addEventListener("click", () => {
          applyPdcPresetToCreateForm(createForm);
        });
      }
    }

    const shuffleParticipantsButton = shadow.querySelector("[data-action='shuffle-participants']");
    if (shuffleParticipantsButton && createForm instanceof HTMLFormElement) {
      shuffleParticipantsButton.addEventListener("click", () => handleShuffleParticipants(createForm));
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

    const randomizeKoToggle = shadow.getElementById("ata-setting-randomize-ko");
    if (randomizeKoToggle instanceof HTMLInputElement) {
      randomizeKoToggle.addEventListener("change", () => {
        state.store.settings.featureFlags.randomizeKoRound1 = randomizeKoToggle.checked;
        state.store.ui.createDraft = normalizeCreateDraft({
          ...state.store.ui.createDraft,
          randomizeKoRound1: randomizeKoToggle.checked,
        }, state.store.settings);
        schedulePersist();
        setNotice("info", `KO-Erstrunden-Mix: ${randomizeKoToggle.checked ? "ON" : "OFF"}.`, 2200);
        if (state.activeTab === "tournament" && !state.store.tournament) {
          renderShell();
        }
      });
    }

    const koDrawLockDefaultToggle = shadow.getElementById("ata-setting-ko-draw-lock-default");
    if (koDrawLockDefaultToggle instanceof HTMLInputElement) {
      koDrawLockDefaultToggle.addEventListener("change", () => {
        state.store.settings.featureFlags.koDrawLockDefault = koDrawLockDefaultToggle.checked;
        schedulePersist();
        setNotice("info", `KO Draw-Lock (Standard): ${koDrawLockDefaultToggle.checked ? "ON" : "OFF"}.`, 2200);
      });
    }

    const koDrawLockedToggle = shadow.getElementById("ata-setting-ko-draw-locked");
    if (koDrawLockedToggle instanceof HTMLInputElement) {
      koDrawLockedToggle.addEventListener("change", () => {
        const result = setTournamentKoDrawLocked(koDrawLockedToggle.checked);
        if (!result.ok) {
          setNotice("error", result.message || "KO Draw-Lock konnte nicht gesetzt werden.");
          return;
        }
        if (result.changed) {
          setNotice("success", `KO Draw-Lock ${koDrawLockedToggle.checked ? "aktiviert" : "deaktiviert"}.`, 1800);
        }
      });
    }

    const tieBreakSelect = shadow.getElementById("ata-setting-tiebreak");
    if (tieBreakSelect instanceof HTMLSelectElement) {
      tieBreakSelect.addEventListener("change", () => {
        const result = setTournamentTieBreakProfile(tieBreakSelect.value);
        if (!result.ok) {
          setNotice("error", result.message || "Tie-Break-Profil konnte nicht gesetzt werden.");
          return;
        }
        if (result.changed) {
          setNotice("success", "Tie-Break-Profil aktualisiert.", 1800);
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


  function isCreateDraftPresetField(fieldName) {
    return [
      "mode",
      "bestOfLegs",
      "startScore",
      "x01InMode",
      "x01OutMode",
      "x01BullMode",
      "x01BullOffMode",
      "x01MaxRounds",
    ].includes(normalizeText(fieldName || ""));
  }


  function setCreateFormPresetValue(form, presetId) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const presetInput = form.querySelector("#ata-x01-preset");
    if (!(presetInput instanceof HTMLInputElement)) {
      return;
    }
    const normalizedPreset = sanitizeX01Preset(presetId, X01_PRESET_CUSTOM);
    presetInput.value = normalizedPreset;
  }


  function refreshCreateFormPresetBadge(form) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const presetInput = form.querySelector("#ata-x01-preset");
    const presetBadge = form.querySelector(".ata-preset-pill");
    if (!(presetInput instanceof HTMLInputElement) || !(presetBadge instanceof HTMLElement)) {
      return;
    }
    let presetId = sanitizeX01Preset(presetInput.value, X01_PRESET_CUSTOM);
    if (presetId === X01_PRESET_PDC_STANDARD) {
      const formData = new FormData(form);
      const draft = normalizeCreateDraft(readCreateDraftInput(formData), state.store.settings);
      if (!isPdcCompliantMatchSetup(draft)) {
        presetId = X01_PRESET_CUSTOM;
        presetInput.value = presetId;
      }
    }
    presetBadge.textContent = presetId === X01_PRESET_PDC_STANDARD
      ? "Preset aktiv: PDC-Standard"
      : "Preset aktiv: Individuell";
  }


  function syncCreateFormDependencies(form) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const bullOffSelect = form.querySelector("#ata-x01-bulloff");
    const bullModeSelect = form.querySelector("#ata-x01-bullmode");
    if (!(bullOffSelect instanceof HTMLSelectElement) || !(bullModeSelect instanceof HTMLSelectElement)) {
      refreshCreateFormPresetBadge(form);
      return;
    }

    const disableBullMode = normalizeText(bullOffSelect.value) === "Off";
    bullModeSelect.disabled = disableBullMode;
    bullModeSelect.title = disableBullMode
      ? "Bull-Modus ist bei Bull-off = Off ohne Wirkung und daher schreibgesch\u00fctzt."
      : "";

    let hiddenBullMode = form.querySelector("#ata-x01-bullmode-hidden");
    if (disableBullMode) {
      if (!(hiddenBullMode instanceof HTMLInputElement)) {
        hiddenBullMode = document.createElement("input");
        hiddenBullMode.type = "hidden";
        hiddenBullMode.id = "ata-x01-bullmode-hidden";
        hiddenBullMode.name = "x01BullMode";
        bullModeSelect.insertAdjacentElement("afterend", hiddenBullMode);
      }
      hiddenBullMode.value = sanitizeX01BullMode(bullModeSelect.value);
    } else if (hiddenBullMode instanceof HTMLElement) {
      hiddenBullMode.remove();
    }

    refreshCreateFormPresetBadge(form);
  }


  function applyPdcPresetToCreateForm(form) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const pdcSettings = buildPdcX01Settings();
    const pdcMode = "ko";
    const pdcBestOfLegs = 5;
    const assignments = [
      ["#ata-mode", pdcMode],
      ["#ata-bestof", String(pdcBestOfLegs)],
      ["#ata-startscore", String(pdcSettings.baseScore)],
      ["#ata-x01-inmode", pdcSettings.inMode],
      ["#ata-x01-outmode", pdcSettings.outMode],
      ["#ata-x01-bullmode", pdcSettings.bullMode],
      ["#ata-x01-bulloff", pdcSettings.bullOffMode],
      ["#ata-x01-maxrounds", String(pdcSettings.maxRounds)],
    ];

    assignments.forEach(([selector, value]) => {
      const field = form.querySelector(selector);
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
        field.value = value;
      }
    });

    setCreateFormPresetValue(form, X01_PRESET_PDC_STANDARD);
    syncCreateFormDependencies(form);
    updateCreateDraftFromForm(form, true);
    setNotice("info", "PDC-Preset wurde auf KO, Best of 5 und die X01-Felder angewendet.", 2400);
  }


  function readCreateDraftInput(formData) {
    return {
      name: formData.get("name"),
      mode: formData.get("mode"),
      bestOfLegs: formData.get("bestOfLegs"),
      startScore: formData.get("startScore"),
      x01Preset: formData.get("x01Preset"),
      x01InMode: formData.get("x01InMode"),
      x01OutMode: formData.get("x01OutMode"),
      x01BullMode: formData.get("x01BullMode"),
      x01MaxRounds: formData.get("x01MaxRounds"),
      x01BullOffMode: formData.get("x01BullOffMode"),
      participantsText: String(formData.get("participants") || ""),
      randomizeKoRound1: formData.get("randomizeKoRound1") !== null,
    };
  }


  function updateCreateDraftFromForm(form, persist = true) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const formData = new FormData(form);
    const nextDraft = normalizeCreateDraft(readCreateDraftInput(formData), state.store.settings);
    const currentDraft = state.store.ui.createDraft || {};
    const changed = JSON.stringify(nextDraft) !== JSON.stringify(currentDraft);
    if (!changed) {
      return;
    }
    state.store.ui.createDraft = nextDraft;
    if (persist) {
      schedulePersist();
    }
  }


  function handleShuffleParticipants(form) {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const participantField = form.querySelector("#ata-participants");
    if (!(participantField instanceof HTMLTextAreaElement)) {
      return;
    }
    const participants = parseParticipantLines(participantField.value);
    if (participants.length < 2) {
      setNotice("info", "Mindestens zwei Teilnehmer zum Mischen eingeben.", 2200);
      return;
    }
    const shuffledNames = shuffleArray(participants.map((participant) => participant.name));
    participantField.value = shuffledNames.join("\n");
    updateCreateDraftFromForm(form, true);
    setNotice("success", "Teilnehmer wurden zuf\u00e4llig gemischt.", 1800);
  }


  function handleCreateTournament(form) {
    syncCreateFormDependencies(form);
    const formData = new FormData(form);
    const draft = normalizeCreateDraft(readCreateDraftInput(formData), state.store.settings);
    state.store.ui.createDraft = draft;
    const participants = parseParticipantLines(formData.get("participants"));
    const config = {
      name: draft.name,
      mode: draft.mode,
      bestOfLegs: draft.bestOfLegs,
      startScore: draft.startScore,
      x01Preset: draft.x01Preset,
      x01InMode: draft.x01InMode,
      x01OutMode: draft.x01OutMode,
      x01BullMode: draft.x01BullMode,
      x01MaxRounds: draft.x01MaxRounds,
      x01BullOffMode: draft.x01BullOffMode,
      lobbyVisibility: "private",
      randomizeKoRound1: draft.randomizeKoRound1,
      koDrawLocked: state.store.settings.featureFlags.koDrawLockDefault !== false,
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
    const tournament = state.store.tournament;
    if (!tournament) {
      return;
    }
    const match = findMatch(tournament, matchId);
    if (!match) {
      setNotice("error", "Match nicht gefunden.");
      return;
    }
    const editability = getMatchEditability(tournament, match);
    if (!editability.editable) {
      setNotice("error", editability.reason || "Match ist nicht freigeschaltet.");
      return;
    }
    const legsP1Input = getMatchFieldElement(shadow, "legs-p1", matchId);
    const legsP2Input = getMatchFieldElement(shadow, "legs-p2", matchId);

    if (!(legsP1Input instanceof HTMLInputElement) || !(legsP2Input instanceof HTMLInputElement)) {
      return;
    }

    const p1Legs = clampInt(legsP1Input.value, 0, 0, 99);
    const p2Legs = clampInt(legsP2Input.value, 0, 0, 99);
    if (p1Legs === p2Legs) {
      setNotice("error", "Ung\u00fcltiges Ergebnis: Bei Best-of ist kein Gleichstand m\u00f6glich.");
      return;
    }

    const winnerId = p1Legs > p2Legs ? match.player1Id : match.player2Id;

    const result = updateMatchResult(matchId, winnerId, {
      p1: p1Legs,
      p2: p2Legs,
    }, "manual");

    if (result.ok) {
      setNotice("success", "Match gespeichert.", 1800);
    } else {
      setNotice("error", result.message || "Match konnte nicht gespeichert werden.");
    }
  }


  function handleResetTournament() {
    const confirmed = window.confirm("Soll das Turnier wirklich gel\u00f6scht werden? Dieser Schritt kann nicht r\u00fcckg\u00e4ngig gemacht werden.");
    if (!confirmed) {
      return;
    }
    state.store.tournament = null;
    state.apiAutomation.startingMatchId = "";
    state.apiAutomation.authBackoffUntil = 0;
    schedulePersist();
    setNotice("success", "Turnier wurde gel\u00f6scht.");
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
      return { ok: false, message: "JSON ist leer oder ung\u00fcltig." };
    }

    let tournament = rawObject.tournament || null;
    if (!tournament && rawObject.mode && rawObject.participants) {
      tournament = rawObject;
    }

    const normalizedTournament = normalizeTournament(
      tournament,
      state.store.settings.featureFlags.koDrawLockDefault !== false,
    );
    if (!normalizedTournament) {
      return { ok: false, message: "Turnierdaten konnten nicht validiert werden." };
    }

    const participantCountError = getParticipantCountError(normalizedTournament.mode, normalizedTournament.participants.length);
    if (participantCountError) {
      return { ok: false, message: participantCountError };
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
        setNotice("error", "Datei enth\u00e4lt kein g\u00fcltiges JSON.");
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

    const bracketSize = tournament.mode === "groups_ko"
      ? 4
      : nextPowerOfTwo(clampInt(tournament?.ko?.bracketSize, tournament.participants.length, 2, TECHNICAL_PARTICIPANT_HARD_MAX));
    const participants = tournament.participants
      .map((participant) => {
        const participantId = normalizeText(participant?.id);
        if (!participantId) {
          return null;
        }
        return {
          id: participantId,
          tournament_id: 1,
          name: normalizeText(participant?.name) || participantId,
        };
      })
      .filter(Boolean);
    const participantIdSet = new Set(participants.map((participant) => participant.id));
    const participantIndexes = buildParticipantIndexes(tournament);
    const resolveBracketParticipantId = (slotId) => {
      const resolved = resolveParticipantSlotId(tournament, slotId, participantIndexes);
      if (!resolved) {
        return null;
      }
      const participantId = normalizeText(resolved);
      return participantIdSet.has(participantId) ? participantId : null;
    };

    const matches = koMatches.map((match) => {
      const player1Id = resolveBracketParticipantId(match.player1Id);
      const player2Id = resolveBracketParticipantId(match.player2Id);
      const winnerId = resolveBracketParticipantId(match.winnerId);
      const isBye = isByeMatchResult(match);
      const completed = isCompletedMatchResultValid(tournament, match)
        && Boolean(winnerId && (winnerId === player1Id || winnerId === player2Id));
      const occupied = Boolean(player1Id || player2Id);
      const status = completed
        ? 4
        : (occupied ? 2 : 1);
      const opponent1 = player1Id
        ? {
            id: player1Id,
            score: completed ? clampInt(match.legs?.p1, 0, 0, 99) : undefined,
            result: completed && winnerId
              ? (winnerId === player1Id ? "win" : (isBye ? undefined : "loss"))
              : undefined,
          }
        : null;
      const opponent2 = player2Id
        ? {
            id: player2Id,
            score: completed ? clampInt(match.legs?.p2, 0, 0, 99) : undefined,
            result: completed && winnerId
              ? (winnerId === player2Id ? "win" : (isBye ? undefined : "loss"))
              : undefined,
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
  <link rel="stylesheet" href="${BRACKETS_VIEWER_CSS}">
  <style>
    :root {
      --tb-bg-1: #2b356f;
      --tb-bg-2: #1f3f72;
      --tb-panel-border: rgba(255, 255, 255, 0.2);
      --tb-text: #f4f7ff;
      --tb-muted: rgba(232, 237, 255, 0.78);
    }

    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden !important;
      color: var(--tb-text);
      font-family: "Open Sans", "Segoe UI", Tahoma, sans-serif !important;
      background: linear-gradient(180deg, var(--tb-bg-1), var(--tb-bg-2));
    }

    #msg {
      padding: 12px 16px;
      font-size: 16px;
      color: var(--tb-muted);
      border-bottom: 1px solid var(--tb-panel-border);
      background: rgba(255, 255, 255, 0.05);
    }

    #brackets-root {
      width: 100%;
      flex: 1 1 auto;
      overflow-x: auto;
      overflow-y: hidden;
      min-height: 420px;
      box-sizing: border-box;
      padding: 10px;
      background:
        radial-gradient(circle at 14% 8%, rgba(90, 210, 153, 0.07), transparent 45%),
        radial-gradient(circle at 82% 10%, rgba(114, 121, 224, 0.18), transparent 52%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
    }

    #ata-brackets-viewer {
      --primary-background: transparent;
      --secondary-background: rgba(255, 255, 255, 0.11);
      --match-background: rgba(59, 84, 136, 0.93);
      --font-color: #f4f7ff;
      --win-color: #5ad299;
      --loss-color: #ff8787;
      --label-color: rgba(226, 234, 255, 0.82);
      --hint-color: rgba(205, 217, 248, 0.75);
      --connector-color: rgba(183, 198, 236, 0.8);
      --border-color: rgba(255, 255, 255, 0.28);
      --border-hover-color: rgba(255, 255, 255, 0.46);
      --border-selected-color: rgba(255, 255, 255, 0.66);
      --text-size: 16px;
      --round-margin: 78px;
      --match-width: 256px;
      --match-horizontal-padding: 14px;
      --match-vertical-padding: 10px;
      --connector-border-width: 2px;
      --match-border-width: 1px;
      --match-border-radius: 10px;
      --participant-image-size: 1.1em;
      width: max-content;
      min-width: 100%;
      min-height: 0;
      margin: 0;
      padding: 12px 20px 22px;
    }

    #ata-brackets-viewer.brackets-viewer {
      align-items: flex-start;
      margin: 0;
    }

    #ata-brackets-viewer h1,
    #ata-brackets-viewer .bracket h2 {
      display: none;
    }

    #ata-brackets-viewer h3 {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.26);
      border-radius: 10px;
      font-size: 1em;
      font-weight: 700;
      color: #f2f6ff;
      padding: 9px 10px;
    }

    @keyframes ataFinalPulse {
      0%, 100% {
        box-shadow: 0 0 0 1px rgba(255, 224, 140, 0.42), 0 8px 20px rgba(32, 22, 8, 0.3);
      }
      50% {
        box-shadow: 0 0 0 1px rgba(255, 224, 140, 0.68), 0 12px 26px rgba(60, 38, 8, 0.46);
      }
    }

    @keyframes ataFinalBorderOrbit {
      to {
        transform: rotate(1turn);
      }
    }

    #ata-brackets-viewer .round.ata-final-round {
      position: relative;
    }

    #ata-brackets-viewer .round.ata-final-round h3 {
      background: linear-gradient(180deg, rgba(255, 211, 79, 0.28), rgba(255, 211, 79, 0.08));
      border-color: rgba(255, 224, 140, 0.84);
      color: #fff4cb;
      text-shadow: 0 1px 0 rgba(58, 36, 8, 0.45);
      box-shadow: 0 0 0 1px rgba(255, 211, 79, 0.36), 0 8px 18px rgba(47, 31, 8, 0.28);
      position: relative;
      padding-right: 104px;
    }

    #ata-brackets-viewer .round.ata-final-round h3::after {
      content: "🏆 Finale";
      position: absolute;
      right: 8px;
      top: 6px;
      border-radius: 999px;
      font-size: 0.65em;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #fff1c5;
      background: rgba(98, 74, 18, 0.95);
      border: 1px solid rgba(255, 224, 140, 0.82);
      padding: 2px 7px;
      line-height: 1.2;
      text-transform: uppercase;
    }

    #ata-brackets-viewer .match {
      margin: 12px 0;
    }

    #ata-brackets-viewer .round.ata-final-round .match {
      margin: 16px 0;
    }

    #ata-brackets-viewer .round.ata-final-round .match.ata-final-match .opponents {
      position: relative;
      overflow: hidden;
      border-color: rgba(255, 224, 140, 0.86);
      background:
        radial-gradient(circle at 88% -22%, rgba(255, 228, 146, 0.27), transparent 54%),
        linear-gradient(180deg, rgba(255, 211, 79, 0.15), rgba(59, 84, 136, 0.95));
      animation: ataFinalPulse 2.6s ease-in-out infinite;
    }

    #ata-brackets-viewer .round.ata-final-round .match.ata-final-match .opponents::before {
      content: "";
      position: absolute;
      inset: -1px;
      border-radius: inherit;
      padding: 2px;
      pointer-events: none;
      background: conic-gradient(from 0deg, rgba(255, 244, 202, 0) 0deg, rgba(255, 244, 202, 0) 274deg, rgba(255, 244, 202, 0.92) 334deg, rgba(255, 244, 202, 0) 360deg);
      -webkit-mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      transform-origin: center center;
      animation: ataFinalBorderOrbit 2s linear infinite;
    }

    #ata-brackets-viewer .match[data-match-status="4"] .opponents {
      border-color: rgba(90, 210, 153, 0.9);
      box-shadow: 0 0 0 1px rgba(90, 210, 153, 0.35), 0 6px 16px rgba(8, 30, 24, 0.35);
      background: linear-gradient(180deg, rgba(90, 210, 153, 0.16), rgba(59, 84, 136, 0.94));
    }

    #ata-brackets-viewer .match[data-match-status="4"] .opponents::after {
      content: "Abgeschlossen";
      position: absolute;
      top: -11px;
      right: 8px;
      font-size: 0.69em;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #aef4ce;
      background: rgba(32, 88, 68, 0.94);
      border: 1px solid rgba(110, 231, 183, 0.66);
      border-radius: 999px;
      padding: 2px 7px;
      line-height: 1.2;
      pointer-events: none;
      text-transform: uppercase;
    }

    #ata-brackets-viewer .match[data-match-status="4"].ata-bye .opponents {
      border-color: rgba(255, 211, 79, 0.9);
      box-shadow: 0 0 0 1px rgba(255, 211, 79, 0.38), 0 6px 16px rgba(56, 36, 8, 0.35);
      background: linear-gradient(180deg, rgba(255, 211, 79, 0.16), rgba(59, 84, 136, 0.94));
    }

    #ata-brackets-viewer .match[data-match-status="4"].ata-bye .opponents::after {
      content: "Freilos";
      color: #ffe39a;
      background: rgba(89, 68, 16, 0.95);
      border-color: rgba(255, 224, 140, 0.72);
    }

    #ata-brackets-viewer .round.ata-final-round .match.ata-final-match[data-match-status="4"] .opponents {
      border-color: rgba(255, 224, 140, 0.92);
      box-shadow: 0 0 0 1px rgba(255, 224, 140, 0.52), 0 10px 22px rgba(50, 31, 8, 0.44);
      background:
        radial-gradient(circle at 84% -14%, rgba(255, 241, 198, 0.22), transparent 56%),
        linear-gradient(180deg, rgba(255, 211, 79, 0.25), rgba(90, 210, 153, 0.2), rgba(59, 84, 136, 0.96));
    }

    #ata-brackets-viewer .round.ata-final-round .match.ata-final-match[data-match-status="4"] .opponents::after {
      content: "Champion";
      color: #fff3c7;
      background: rgba(98, 74, 18, 0.96);
      border-color: rgba(255, 224, 140, 0.8);
    }

    #ata-brackets-viewer .round.ata-final-round .match.ata-final-match[data-match-status="4"].ata-bye .opponents::after {
      content: "Freilos";
      color: #ffe39a;
      background: rgba(89, 68, 16, 0.95);
      border-color: rgba(255, 224, 140, 0.72);
    }

    #ata-brackets-viewer .round.ata-final-round .match.ata-final-match .participant.ata-final-winner {
      background: rgba(98, 74, 18, 0.45);
      border-radius: 8px;
      box-shadow: inset 0 0 0 1px rgba(255, 224, 140, 0.48);
    }

    #ata-brackets-viewer .round.ata-final-round .match.ata-final-match .participant.ata-final-winner .name {
      color: #ffefb9;
      text-shadow: 0 1px 0 rgba(57, 35, 8, 0.56);
      font-weight: 800;
    }

    #ata-brackets-viewer .round.ata-final-round .match.ata-final-match .participant.ata-final-winner .name::after {
      content: "  🏆";
      font-size: 0.88em;
    }

    #ata-brackets-viewer .round.ata-final-round .match.ata-final-match .participant.ata-final-loser .name {
      color: rgba(229, 237, 255, 0.72);
    }

    #ata-brackets-viewer .match[data-match-status="4"] .participant .name:not(.ata-open-slot) {
      font-weight: 700;
    }

    #ata-brackets-viewer .participant {
      align-items: center;
      min-height: 42px;
      font-size: 1em;
    }

    #ata-brackets-viewer .participant .name {
      width: 78%;
      font-weight: 600;
    }

    #ata-brackets-viewer .participant .name.ata-open-slot {
      color: #ffd34f;
      font-weight: 700;
    }

    #ata-brackets-viewer .participant .result {
      width: 22%;
      font-weight: 700;
      text-align: center;
    }

    #brackets-root::-webkit-scrollbar {
      width: 11px;
      height: 11px;
    }

    #brackets-root::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.08);
      border-radius: 999px;
    }

    #brackets-root::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.28);
      border-radius: 999px;
    }

    @media (prefers-reduced-motion: reduce) {
      #ata-brackets-viewer .round.ata-final-round .match.ata-final-match .opponents,
      #ata-brackets-viewer .round.ata-final-round .match.ata-final-match .opponents::before {
        animation: none;
      }
    }
  </style>
</head>
<body>
  <div id="msg">Turnierbaum wird geladen ...</div>
  <div id="brackets-root">
    <div id="ata-brackets-viewer" class="brackets-viewer"></div>
  </div>
  <script src="${I18NEXT_JS}"></script>
  <script src="${BRACKETS_VIEWER_JS}"></script>
  <script>
    (function () {
      var msgEl = document.getElementById("msg");
      var rootEl = document.getElementById("brackets-root");
      var viewerEl = document.getElementById("ata-brackets-viewer");

      function post(data) { window.parent.postMessage(data, "*"); }

      function ensurePayload(payload) {
        var safePayload = payload && typeof payload === "object" ? payload : {};
        if (!Array.isArray(safePayload.stages) || !Array.isArray(safePayload.matches) || !Array.isArray(safePayload.participants)) {
          throw new Error("invalid bracket payload");
        }
        return safePayload;
      }

      function normalizeOpenSlotLabels() {
        if (!viewerEl) {
          return;
        }
        var nodes = viewerEl.querySelectorAll(".participant .name");
        nodes.forEach(function (node) {
          var value = String(node.textContent || "").trim();
          if (/^(bye|tbd)$/i.test(value)) {
            node.textContent = "\\u2205 offen";
            node.classList.add("ata-open-slot");
          }
        });
      }

      function decorateCompletedMatchBadges(payload) {
        if (!viewerEl || !payload || !Array.isArray(payload.matches)) {
          return;
        }

        var byeMatchById = {};
        payload.matches.forEach(function (match) {
          if (!match || Number(match.status) !== 4) {
            return;
          }
          var matchId = String(match.id || "");
          if (!matchId) {
            return;
          }
          byeMatchById[matchId] = !match.opponent1 || !match.opponent2;
        });

        var matchNodes = viewerEl.querySelectorAll(".match[data-match-status='4']");
        matchNodes.forEach(function (node) {
          var matchId = String(node.getAttribute("data-match-id") || "");
          var isByeByPayload = matchId && Object.prototype.hasOwnProperty.call(byeMatchById, matchId)
            ? byeMatchById[matchId]
            : false;
          var isByeByDom = Boolean(node.querySelector(".participant .name.ata-open-slot"));
          var isBye = isByeByPayload || isByeByDom;
          node.classList.toggle("ata-bye", isBye);
        });
      }

      function decorateFinalRound(payload) {
        if (!viewerEl) {
          return;
        }

        var roundNodes = viewerEl.querySelectorAll(".round");
        var matchNodes = viewerEl.querySelectorAll(".match");
        var participantNodes = viewerEl.querySelectorAll(".participant");
        matchNodes.forEach(function (node) {
          node.classList.remove("ata-final-match");
        });
        participantNodes.forEach(function (node) {
          node.classList.remove("ata-final-winner");
          node.classList.remove("ata-final-loser");
        });
        if (!roundNodes || !roundNodes.length) {
          return;
        }

        roundNodes.forEach(function (node) {
          node.classList.remove("ata-final-round");
        });

        var finalRoundNode = null;
        roundNodes.forEach(function (node) {
          if (finalRoundNode) {
            return;
          }
          var titleEl = node.querySelector("h3");
          var title = titleEl ? String(titleEl.textContent || "").trim() : "";
          if (/(^|\\s)(final|finale|endspiel|grand\\s*final|championship)(\\s|$)/i.test(title)) {
            finalRoundNode = node;
          }
        });

        if (!finalRoundNode) {
          finalRoundNode = roundNodes[roundNodes.length - 1];
        }

        if (finalRoundNode) {
          finalRoundNode.classList.add("ata-final-round");
        }

        if (!finalRoundNode) {
          return;
        }

        var winnerSideByMatchId = {};
        if (payload && Array.isArray(payload.matches)) {
          payload.matches.forEach(function (match) {
            if (!match) {
              return;
            }
            var matchId = String(match.id || "");
            if (!matchId) {
              return;
            }
            var winnerSide = 0;
            if (match.opponent1 && String(match.opponent1.result || "").toLowerCase() === "win") {
              winnerSide = 1;
            } else if (match.opponent2 && String(match.opponent2.result || "").toLowerCase() === "win") {
              winnerSide = 2;
            }
            winnerSideByMatchId[matchId] = winnerSide;
          });
        }

        var finalMatchNodes = finalRoundNode.querySelectorAll(".match");
        finalMatchNodes.forEach(function (node) {
          node.classList.add("ata-final-match");
          var matchId = String(node.getAttribute("data-match-id") || "");
          var winnerSide = matchId && Object.prototype.hasOwnProperty.call(winnerSideByMatchId, matchId)
            ? winnerSideByMatchId[matchId]
            : 0;
          if (!winnerSide) {
            return;
          }
          var participants = node.querySelectorAll(".participant");
          participants.forEach(function (participantNode, index) {
            if (index === winnerSide - 1) {
              participantNode.classList.add("ata-final-winner");
            } else if (index === 0 || index === 1) {
              participantNode.classList.add("ata-final-loser");
            }
          });
        });
      }

      function pxToNumber(value) {
        var num = Number.parseFloat(String(value || "0"));
        return Number.isFinite(num) ? num : 0;
      }

      function computeFrameHeight() {
        var msgHeight = msgEl && msgEl.style.display !== "none" ? msgEl.offsetHeight : 0;
        var rootStyles = rootEl ? window.getComputedStyle(rootEl) : null;
        var rootPadding = rootStyles
          ? pxToNumber(rootStyles.paddingTop) + pxToNumber(rootStyles.paddingBottom)
          : 0;
        var viewerHeight = viewerEl ? Math.ceil(viewerEl.getBoundingClientRect().height) : 0;
        return Math.max(420, msgHeight + rootPadding + viewerHeight);
      }

      function scheduleHeightReport() {
        window.requestAnimationFrame(function () {
          post({ type: "ata:bracket-frame-height", height: computeFrameHeight() });
          window.setTimeout(function () {
            post({ type: "ata:bracket-frame-height", height: computeFrameHeight() });
          }, 100);
          window.setTimeout(function () {
            post({ type: "ata:bracket-frame-height", height: computeFrameHeight() });
          }, 320);
        });
      }

      function render(payload) {
        if (!window.bracketsViewer || typeof window.bracketsViewer.render !== "function") {
          throw new Error("brackets-viewer not found");
        }
        if (!viewerEl) {
          throw new Error("bracket root not found");
        }
        var safePayload = ensurePayload(payload);
        window.bracketsViewer.render(safePayload, {
          selector: "#ata-brackets-viewer",
          clear: true,
        });
        normalizeOpenSlotLabels();
        decorateCompletedMatchBadges(safePayload);
        decorateFinalRound(safePayload);
        if (msgEl) {
          msgEl.style.display = "none";
        }
        scheduleHeightReport();
      }

      window.addEventListener("message", function (event) {
        var data = event.data;
        if (!data || data.type !== "ata:render-bracket") {
          return;
        }
        try {
          render(data.payload || {});
          post({ type: "ata:bracket-rendered" });
        } catch (error) {
          post({
            type: "ata:bracket-error",
            message: error && error.message ? error.message : String(error),
          });
        }
      });

      window.addEventListener("resize", scheduleHeightReport);

      if (window.ResizeObserver && viewerEl) {
        var resizeObserver = new window.ResizeObserver(scheduleHeightReport);
        resizeObserver.observe(viewerEl);
        if (rootEl) {
          resizeObserver.observe(rootEl);
        }
      }

      post({ type: "ata:bracket-frame-ready" });
      scheduleHeightReport();
    })();
  </script>
</body>
</html>
    `;
  }

  function applyBracketFrameHeight(height) {
    const frame = state.bracket.iframe;
    if (!(frame instanceof HTMLIFrameElement)) {
      return;
    }
    const nextHeight = clampInt(height, 0, 420, 12000);
    if (!nextHeight || Math.abs(nextHeight - state.bracket.frameHeight) < 2) {
      return;
    }
    state.bracket.frameHeight = nextHeight;
    frame.style.height = `${nextHeight}px`;
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
      state.bracket.frameHeight = 0;
      state.bracket.lastError = "";
      frame.style.removeProperty("height");
      syncBracketFallbackVisibility();
      frame.srcdoc = buildBracketFrameSrcdoc();
    }

    if (state.bracket.timeoutHandle) {
      clearTimeout(state.bracket.timeoutHandle);
      state.bracket.timeoutHandle = null;
    }

    state.bracket.timeoutHandle = window.setTimeout(() => {
      state.bracket.failed = true;
      state.bracket.lastError = "Turnierbaum-Render-Timeout";
      syncBracketFallbackVisibility();
      setNotice("error", "CDN-Turnierbaum-Timeout, Fallback bleibt aktiv.", 3200);
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

    if (data.type === "ata:bracket-frame-height") {
      applyBracketFrameHeight(data.height);
      return;
    }

    if (data.type === "ata:bracket-rendered") {
      if (state.bracket.timeoutHandle) {
        clearTimeout(state.bracket.timeoutHandle);
        state.bracket.timeoutHandle = null;
      }
      state.bracket.failed = false;
      state.bracket.lastError = "";
      syncBracketFallbackVisibility();
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
      syncBracketFallbackVisibility();
      setNotice("error", `Turnierbaum-Fehler: ${state.bracket.lastError}. Fallback aktiv.`, 3600);
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
    const neededWins = getLegsToWin(bestOfLegs);
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


  function removeMatchReturnShortcut() {
    if (state.matchReturnShortcut.root instanceof HTMLElement) {
      state.matchReturnShortcut.root.remove();
    }
    state.matchReturnShortcut.root = null;
    state.matchReturnShortcut.syncing = false;
    state.matchReturnShortcut.inlineSyncingByLobby = {};
    state.matchReturnShortcut.inlineOutcomeByLobby = {};
  }


  function removeHistoryImportButton() {
    const nodes = Array.from(document.querySelectorAll("[data-ata-history-import-root='1']"));
    nodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        node.remove();
      }
    });
  }


  function isHistoryMatchRoute(pathname = location.pathname) {
    return /^\/history\/matches\/[^/?#]+/i.test(normalizeText(pathname || ""));
  }


  function getHistoryRouteLobbyId(pathname = location.pathname) {
    if (!isHistoryMatchRoute(pathname)) {
      return "";
    }
    return getRouteLobbyId(pathname);
  }


  function isLobbySyncing(lobbyId) {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!targetLobbyId) {
      return false;
    }
    const map = state.matchReturnShortcut.inlineSyncingByLobby || {};
    return Boolean(map[targetLobbyId]);
  }


  function setLobbySyncing(lobbyId, syncing) {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!targetLobbyId) {
      return;
    }
    if (!state.matchReturnShortcut.inlineSyncingByLobby || typeof state.matchReturnShortcut.inlineSyncingByLobby !== "object") {
      state.matchReturnShortcut.inlineSyncingByLobby = {};
    }
    if (syncing) {
      state.matchReturnShortcut.inlineSyncingByLobby[targetLobbyId] = true;
    } else {
      delete state.matchReturnShortcut.inlineSyncingByLobby[targetLobbyId];
    }
    state.matchReturnShortcut.syncing = Object.keys(state.matchReturnShortcut.inlineSyncingByLobby).length > 0;
  }


  function setHistoryInlineOutcome(lobbyId, type, message) {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!targetLobbyId) {
      return;
    }
    if (!state.matchReturnShortcut.inlineOutcomeByLobby || typeof state.matchReturnShortcut.inlineOutcomeByLobby !== "object") {
      state.matchReturnShortcut.inlineOutcomeByLobby = {};
    }
    const normalizedType = normalizeText(type || "info");
    const normalizedMessage = normalizeText(message || "");
    if (!normalizedMessage) {
      delete state.matchReturnShortcut.inlineOutcomeByLobby[targetLobbyId];
      return;
    }
    state.matchReturnShortcut.inlineOutcomeByLobby[targetLobbyId] = {
      type: normalizedType || "info",
      message: normalizedMessage,
      updatedAt: Date.now(),
    };
  }


  function getHistoryInlineOutcome(lobbyId) {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!targetLobbyId) {
      return null;
    }
    const map = state.matchReturnShortcut.inlineOutcomeByLobby || {};
    const entry = map[targetLobbyId];
    if (!entry || !normalizeText(entry.message || "")) {
      return null;
    }
    return entry;
  }


  function cleanupStaleHistoryImportButtons(activeLobbyId = "") {
    const nodes = Array.from(document.querySelectorAll("[data-ata-history-import-root='1']"));
    nodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      const nodeLobbyId = normalizeText(node.getAttribute("data-lobby-id") || "");
      if (!activeLobbyId || nodeLobbyId !== activeLobbyId) {
        node.remove();
        if (nodeLobbyId && state.matchReturnShortcut.inlineOutcomeByLobby?.[nodeLobbyId]) {
          delete state.matchReturnShortcut.inlineOutcomeByLobby[nodeLobbyId];
        }
      }
    });
  }


  function findHistoryImportHost(lobbyId) {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!targetLobbyId) {
      return null;
    }
    const routeLinks = Array.from(document.querySelectorAll(`a[href^="/history/matches/${targetLobbyId}"]`));
    const links = routeLinks.filter((link) => link instanceof HTMLAnchorElement);
    for (const link of links) {
      const card = link.closest(".chakra-card, [class*='chakra-card'], article, section, [class*='card']");
      if (!(card instanceof HTMLElement)) {
        continue;
      }
      const table = card.querySelector("table");
      if (table instanceof HTMLElement) {
        return { card, table };
      }
      return { card, table: null };
    }

    const firstTable = document.querySelector("table");
    if (firstTable instanceof HTMLElement) {
      const card = firstTable.closest(".chakra-card, [class*='chakra-card'], article, section, [class*='card']");
      if (card instanceof HTMLElement) {
        return { card, table: firstTable };
      }
      if (firstTable.parentElement instanceof HTMLElement) {
        return { card: firstTable.parentElement, table: firstTable };
      }
    }

    return null;
  }


  function ensureHistoryImportRoot(host, lobbyId) {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!(host instanceof HTMLElement) || !targetLobbyId) {
      return null;
    }
    let root = host.querySelector(`[data-ata-history-import-root='1'][data-lobby-id='${targetLobbyId}']`);
    if (root instanceof HTMLElement) {
      return root;
    }
    root = document.createElement("div");
    root.setAttribute("data-ata-history-import-root", "1");
    root.setAttribute("data-lobby-id", targetLobbyId);
    if (host.firstChild) {
      host.insertBefore(root, host.firstChild);
    } else {
      host.appendChild(root);
    }
    return root;
  }


  function extractHistoryHeaderName(cell) {
    if (!(cell instanceof HTMLElement)) {
      return "";
    }
    const namedNode = cell.querySelector(".ad-ext-player-name p, .ad-ext-player-name, p, span");
    if (namedNode instanceof HTMLElement) {
      return normalizeText(namedNode.textContent || "");
    }
    const fallbackText = normalizeText(cell.textContent || "");
    if (!fallbackText) {
      return "";
    }
    const parts = fallbackText.split(/\s+/).filter(Boolean);
    return normalizeText(parts[parts.length - 1] || fallbackText);
  }


  function parseHistoryStatsTable(table) {
    if (!(table instanceof HTMLTableElement)) {
      return null;
    }
    const headerCells = Array.from(table.querySelectorAll("thead tr td"));
    if (headerCells.length < 2) {
      return null;
    }

    const p1Cell = headerCells[0];
    const p2Cell = headerCells[1];
    const p1Name = extractHistoryHeaderName(p1Cell);
    const p2Name = extractHistoryHeaderName(p2Cell);
    if (!p1Name || !p2Name) {
      return null;
    }

    const p1HasTrophy = Boolean(p1Cell?.querySelector("svg[data-icon='trophy'], [data-icon='trophy'], .fa-trophy"));
    const p2HasTrophy = Boolean(p2Cell?.querySelector("svg[data-icon='trophy'], [data-icon='trophy'], .fa-trophy"));

    let p1Legs = null;
    let p2Legs = null;
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    rows.forEach((row) => {
      if (!(row instanceof HTMLTableRowElement)) {
        return;
      }
      const cells = Array.from(row.querySelectorAll("td"));
      if (cells.length < 3) {
        return;
      }
      const label = normalizeLookup(cells[0].textContent || "");
      const isLegsRow = label.includes("gewonnene legs")
        || label.includes("legs won")
        || label === "legs";
      if (!isLegsRow) {
        return;
      }
      p1Legs = clampInt(cells[1].textContent, 0, 0, 50);
      p2Legs = clampInt(cells[2].textContent, 0, 0, 50);
    });

    if (!Number.isInteger(p1Legs) || !Number.isInteger(p2Legs)) {
      return null;
    }

    let winnerIndex = -1;
    if (p1Legs !== p2Legs) {
      winnerIndex = p1Legs > p2Legs ? 0 : 1;
    } else if (p1HasTrophy !== p2HasTrophy) {
      winnerIndex = p1HasTrophy ? 0 : 1;
    }

    return {
      p1Name,
      p2Name,
      p1Legs,
      p2Legs,
      winnerIndex,
    };
  }


  function getParsedHistoryWinnerName(parsed) {
    if (!parsed) {
      return "";
    }
    if (parsed.winnerIndex === 0) {
      return parsed.p1Name;
    }
    if (parsed.winnerIndex === 1) {
      return parsed.p2Name;
    }
    if (Number.isInteger(parsed.p1Legs) && Number.isInteger(parsed.p2Legs) && parsed.p1Legs !== parsed.p2Legs) {
      return parsed.p1Legs > parsed.p2Legs ? parsed.p1Name : parsed.p2Name;
    }
    return "";
  }


  function scoreParticipantNameMatch(participantName, tableName) {
    const participantLookup = normalizeLookup(participantName || "");
    const tableLookup = normalizeLookup(tableName || "");
    if (!participantLookup || !tableLookup) {
      return 0;
    }
    if (participantLookup === tableLookup) {
      return 400;
    }

    const participantToken = normalizeToken(participantLookup);
    const tableToken = normalizeToken(tableLookup);
    if (participantToken && tableToken && participantToken === tableToken) {
      return 360;
    }

    const participantWords = participantLookup.split(/\s+/).filter(Boolean);
    const tableWords = tableLookup.split(/\s+/).filter(Boolean);
    if (participantWords.includes(tableLookup) || tableWords.includes(participantLookup)) {
      return 300;
    }
    if (
      participantLookup.startsWith(`${tableLookup} `)
      || participantLookup.endsWith(` ${tableLookup}`)
      || tableLookup.startsWith(`${participantLookup} `)
      || tableLookup.endsWith(` ${participantLookup}`)
    ) {
      return 280;
    }

    if (participantToken && tableToken && participantToken.includes(tableToken)) {
      return 240;
    }
    if (participantToken && tableToken && tableToken.includes(participantToken)) {
      return 200;
    }
    if (participantLookup.includes(tableLookup)) {
      return 170;
    }
    if (tableLookup.includes(participantLookup)) {
      return 140;
    }
    return 0;
  }


  function participantIdsByName(tournament, name) {
    const tableName = normalizeText(name || "");
    if (!tableName) {
      return [];
    }
    const scored = (tournament?.participants || [])
      .map((participant) => ({
        id: participant?.id,
        score: scoreParticipantNameMatch(participant?.name || "", tableName),
      }))
      .filter((entry) => entry.id && entry.score > 0)
      .sort((left, right) => right.score - left.score);
    if (!scored.length) {
      return [];
    }

    const exact = scored.filter((entry) => entry.score >= 360);
    if (exact.length) {
      return exact.map((entry) => entry.id);
    }

    const strong = scored.filter((entry) => entry.score >= 280);
    if (strong.length) {
      return strong.map((entry) => entry.id);
    }

    const medium = scored.filter((entry) => entry.score >= 200);
    if (medium.length === 1) {
      return [medium[0].id];
    }
    return medium.map((entry) => entry.id);
  }


  function getOpenMatchCandidatesByParticipantIds(tournament, idA, idB) {
    const left = normalizeText(idA || "");
    const right = normalizeText(idB || "");
    if (!left || !right || left === right) {
      return [];
    }
    const key = new Set([left, right]);
    return (tournament?.matches || [])
      .filter((match) => {
        if (!match || match.status !== STATUS_PENDING || !match.player1Id || !match.player2Id) {
          return false;
        }
        const set = new Set([normalizeText(match.player1Id), normalizeText(match.player2Id)]);
        return key.size === set.size && [...key].every((entry) => set.has(entry));
      })
      .sort((a, b) => {
        if (a.round !== b.round) {
          return a.round - b.round;
        }
        return a.number - b.number;
      });
  }


  function resolveTableToMatchOrder(tournament, match, parsed) {
    const matchP1Name = participantNameById(tournament, match?.player1Id);
    const matchP2Name = participantNameById(tournament, match?.player2Id);
    const directScore = scoreParticipantNameMatch(matchP1Name, parsed?.p1Name)
      + scoreParticipantNameMatch(matchP2Name, parsed?.p2Name);
    const swappedScore = scoreParticipantNameMatch(matchP1Name, parsed?.p2Name)
      + scoreParticipantNameMatch(matchP2Name, parsed?.p1Name);
    if (swappedScore > directScore) {
      return false;
    }
    if (directScore > swappedScore) {
      return true;
    }
    const parsedP1Lookup = normalizeLookup(parsed?.p1Name || "");
    const matchP1Lookup = normalizeLookup(matchP1Name || "");
    if (parsedP1Lookup && matchP1Lookup && parsedP1Lookup === matchP1Lookup) {
      return true;
    }
    return true;
  }


  function normalizeHistoryLegsForTournament(tournament, match, winnerId, legsRaw) {
    const legsToWin = getLegsToWin(tournament?.bestOfLegs);
    const winnerIsP1 = winnerId === match?.player1Id;
    let p1 = clampInt(legsRaw?.p1, 0, 0, 99);
    let p2 = clampInt(legsRaw?.p2, 0, 0, 99);
    let winnerLegs = winnerIsP1 ? p1 : p2;
    let loserLegs = winnerIsP1 ? p2 : p1;
    let adjusted = false;

    if (winnerLegs <= loserLegs) {
      winnerLegs = loserLegs + 1;
      adjusted = true;
    }

    if (winnerLegs !== legsToWin) {
      winnerLegs = legsToWin;
      adjusted = true;
    }

    loserLegs = clampInt(loserLegs, 0, 0, Math.max(0, legsToWin - 1));
    if (loserLegs >= winnerLegs) {
      loserLegs = Math.max(0, winnerLegs - 1);
      adjusted = true;
    }

    p1 = winnerIsP1 ? winnerLegs : loserLegs;
    p2 = winnerIsP1 ? loserLegs : winnerLegs;
    return {
      legs: { p1, p2 },
      adjusted,
      legsToWin,
    };
  }


  function findHistoryImportMatchCandidates(tournament, lobbyId, parsed) {
    const targetLobbyId = normalizeText(lobbyId || "");
    const linkedByLobby = findTournamentMatchByLobbyId(tournament, targetLobbyId, false);
    const seenMatches = new Set();
    const matchCandidates = [];
    const pushMatch = (match) => {
      if (!match?.id || seenMatches.has(match.id)) {
        return;
      }
      seenMatches.add(match.id);
      matchCandidates.push(match);
    };

    if (linkedByLobby?.status === STATUS_PENDING && linkedByLobby.player1Id && linkedByLobby.player2Id) {
      pushMatch(linkedByLobby);
    }

    const p1Ids = participantIdsByName(tournament, parsed?.p1Name);
    const p2Ids = participantIdsByName(tournament, parsed?.p2Name);
    p1Ids.forEach((p1Id) => {
      p2Ids.forEach((p2Id) => {
        getOpenMatchCandidatesByParticipantIds(tournament, p1Id, p2Id).forEach((match) => {
          pushMatch(match);
        });
      });
    });

    return {
      linkedByLobby: linkedByLobby && linkedByLobby.status === STATUS_PENDING ? linkedByLobby : null,
      matchCandidates,
    };
  }


  function importHistoryStatsTableResult(lobbyId, hostInfo) {
    const targetLobbyId = normalizeText(lobbyId || "");
    const tournament = state.store.tournament;
    if (!tournament || !targetLobbyId) {
      return null;
    }
    const parsed = parseHistoryStatsTable(hostInfo?.table);
    if (!parsed) {
      logDebug("api", "History table import skipped: stats table not parsable.", {
        lobbyId: targetLobbyId,
      });
      return null;
    }

    const selection = findHistoryImportMatchCandidates(tournament, targetLobbyId, parsed);
    const linkedByLobby = selection.linkedByLobby;
    const matchCandidates = selection.matchCandidates;
    let match = null;
    if (linkedByLobby?.player1Id && linkedByLobby?.player2Id) {
      match = linkedByLobby;
    } else if (!matchCandidates.length) {
      return {
        ok: false,
        completed: false,
        reasonCode: "not_found",
        message: "Kein offenes Turnier-Match aus Lobby-ID oder Statistik-Spielern gefunden.",
      };
    } else if (matchCandidates.length > 1) {
      return {
        ok: false,
        completed: false,
        reasonCode: "ambiguous",
        message: "Mehrdeutige Zuordnung: mehrere offene Turnier-Matches passen zu diesen Spielern.",
      };
    } else {
      match = matchCandidates[0];
    }

    const tableMapsDirect = resolveTableToMatchOrder(tournament, match, parsed);

    const legsRaw = tableMapsDirect
      ? { p1: parsed.p1Legs, p2: parsed.p2Legs }
      : { p1: parsed.p2Legs, p2: parsed.p1Legs };

    let winnerId = "";
    if (parsed.winnerIndex === 0) {
      winnerId = tableMapsDirect ? match.player1Id : match.player2Id;
    } else if (parsed.winnerIndex === 1) {
      winnerId = tableMapsDirect ? match.player2Id : match.player1Id;
    } else if (legsRaw.p1 !== legsRaw.p2) {
      winnerId = legsRaw.p1 > legsRaw.p2 ? match.player1Id : match.player2Id;
    }

    if (!winnerId) {
      return {
        ok: false,
        completed: false,
        reasonCode: "error",
        message: "Sieger konnte aus der Statistik nicht eindeutig bestimmt werden.",
      };
    }

    const normalizedLegs = normalizeHistoryLegsForTournament(tournament, match, winnerId, legsRaw);
    const result = updateMatchResult(match.id, winnerId, normalizedLegs.legs, "auto");
    if (!result.ok) {
      return {
        ok: false,
        completed: false,
        reasonCode: "error",
        message: result.message || "Ergebnis konnte nicht aus der Statistik gespeichert werden.",
      };
    }

    const updatedMatch = findMatch(tournament, match.id);
    if (updatedMatch) {
      const auto = ensureMatchAutoMeta(updatedMatch);
      const now = nowIso();
      auto.provider = API_PROVIDER;
      auto.lobbyId = auto.lobbyId || targetLobbyId;
      auto.status = "completed";
      auto.finishedAt = auto.finishedAt || now;
      auto.lastSyncAt = now;
      auto.lastError = null;
      updatedMatch.updatedAt = now;
      tournament.updatedAt = now;
      schedulePersist();
    }

    logDebug("api", "History table result imported.", {
      lobbyId: targetLobbyId,
      matchId: match.id,
      winnerId,
      legs: normalizedLegs.legs,
      adjustedLegs: normalizedLegs.adjusted,
      linkedByLobby: Boolean(linkedByLobby?.id),
    });
    const successMessage = normalizedLegs.adjusted
      ? `Ergebnis übernommen. Legs wurden auf Turniermodus (First to ${normalizedLegs.legsToWin}) normalisiert.`
      : "Ergebnis wurde aus der Match-Statistik übernommen.";
    return {
      ok: true,
      completed: true,
      reasonCode: "completed",
      message: successMessage,
    };
  }


  function renderHistoryImportButton() {
    const lobbyId = getHistoryRouteLobbyId();
    if (!lobbyId) {
      removeHistoryImportButton();
      return;
    }

    const tournament = state.store.tournament;
    if (!tournament) {
      removeHistoryImportButton();
      return;
    }

    const hostInfo = findHistoryImportHost(lobbyId);
    if (!hostInfo?.card) {
      removeHistoryImportButton();
      return;
    }

    cleanupStaleHistoryImportButtons(lobbyId);
    const root = ensureHistoryImportRoot(hostInfo.card, lobbyId);
    if (!(root instanceof HTMLElement)) {
      return;
    }

    if (hostInfo.table instanceof HTMLElement && root.nextSibling !== hostInfo.table) {
      hostInfo.card.insertBefore(root, hostInfo.table);
    }

    const linkedMatchAny = findTournamentMatchByLobbyId(tournament, lobbyId, true);
    const auto = linkedMatchAny ? ensureMatchAutoMeta(linkedMatchAny) : null;
    const autoEnabled = Boolean(state.store.settings.featureFlags.autoLobbyStart);
    const isSyncing = isLobbySyncing(lobbyId);
    const isAlreadyCompleted = linkedMatchAny?.status === STATUS_COMPLETED;
    const parsedStats = parseHistoryStatsTable(hostInfo.table);
    const parsedWinnerName = getParsedHistoryWinnerName(parsedStats);
    const parsedScoreText = parsedStats
      ? `${parsedStats.p1Name} ${parsedStats.p1Legs}:${parsedStats.p2Legs} ${parsedStats.p2Name}`
      : "";
    const inlineOutcome = getHistoryInlineOutcome(lobbyId);

    let statusText = "";
    if (isAlreadyCompleted) {
      statusText = "Ergebnis bereits im Turnier gespeichert.";
    } else if (!autoEnabled) {
      statusText = "Auto-Lobby ist deaktiviert. Aktivieren Sie die Funktion im Tab Einstellungen.";
    } else if (!parsedStats) {
      statusText = "Statistik konnte nicht vollständig gelesen werden. Beim Klick wird API-Fallback genutzt.";
    } else if (parsedWinnerName) {
      statusText = `Import bereit. Sieger laut Statistik: ${parsedWinnerName}.`;
    } else if (linkedMatchAny && auto?.status === "error") {
      statusText = `Letzter Sync-Fehler: ${normalizeText(auto.lastError || "Unbekannt") || "Unbekannt"}`;
    } else if (linkedMatchAny && auto?.status === "started") {
      statusText = "Match verknüpft. Ergebnis kann jetzt übernommen werden.";
    } else {
      statusText = "Kein direkt verknüpftes Match gefunden. Ergebnisübernahme versucht Zuordnung über die Statistik.";
    }

    const primaryLabel = isAlreadyCompleted
      ? "Turnierassistent öffnen"
      : (isSyncing ? "\u00dcbernehme..." : "Ergebnis aus Statistik \u00fcbernehmen & Turnier \u00f6ffnen");
    const disabledAttr = isSyncing || (!autoEnabled && !isAlreadyCompleted) ? "disabled" : "";
    const outcomeType = normalizeText(inlineOutcome?.type || "info");
    const outcomeMessage = normalizeText(inlineOutcome?.message || "");
    const outcomeColor = outcomeType === "success"
      ? "#d8ffe7"
      : outcomeType === "error"
        ? "#ffd9dc"
        : "#dbe8ff";
    const outcomeBg = outcomeType === "success"
      ? "rgba(73, 205, 138, 0.16)"
      : outcomeType === "error"
        ? "rgba(214, 74, 105, 0.18)"
        : "rgba(119, 167, 255, 0.14)";
    const outcomeBorder = outcomeType === "success"
      ? "rgba(95, 220, 154, 0.5)"
      : outcomeType === "error"
        ? "rgba(245, 123, 143, 0.52)"
        : "rgba(142, 188, 255, 0.48)";

    root.innerHTML = `
      <div style="margin:10px 0 14px 0;padding:14px;border-radius:12px;border:1px solid rgba(120,203,255,0.45);background:linear-gradient(180deg, rgba(54,70,145,0.92), rgba(34,80,136,0.9));color:#f4f7ff;box-shadow:0 10px 24px rgba(7,11,25,0.28);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;">
          <div style="font-size:15px;line-height:1.2;font-weight:800;letter-spacing:0.25px;">xLokales Turnier</div>
          <div style="font-size:11px;font-weight:700;letter-spacing:0.3px;color:#d5ebff;background:rgba(31,175,198,0.32);border:1px solid rgba(133,219,255,0.42);padding:3px 8px;border-radius:999px;">Match-Import</div>
        </div>
        <div style="font-size:13px;line-height:1.45;color:rgba(240,246,255,0.95);margin-bottom:8px;">${escapeHtml(statusText)}</div>
        ${parsedScoreText ? `<div style="font-size:12px;line-height:1.4;color:rgba(220,236,255,0.88);margin-bottom:10px;">Statistik: ${escapeHtml(parsedScoreText)}</div>` : ""}
        ${outcomeMessage ? `<div style="font-size:12px;line-height:1.4;color:${outcomeColor};background:${outcomeBg};border:1px solid ${outcomeBorder};padding:7px 9px;border-radius:8px;margin-bottom:10px;">${escapeHtml(outcomeMessage)}</div>` : ""}
        <button type="button" data-action="ata-history-sync" style="display:block;width:100%;border:1px solid rgba(99,231,173,0.7);background:linear-gradient(180deg, rgba(83,221,163,0.36), rgba(58,197,141,0.36));color:#ecfff6;border-radius:10px;padding:12px 14px;font-size:14px;font-weight:800;cursor:pointer;letter-spacing:0.2px;" ${disabledAttr}>${escapeHtml(primaryLabel)}</button>
      </div>
    `;

    const syncButton = root.querySelector("[data-action='ata-history-sync']");
    if (syncButton instanceof HTMLButtonElement) {
      if (isSyncing || (!autoEnabled && !isAlreadyCompleted)) {
        syncButton.onclick = null;
      } else if (isAlreadyCompleted) {
        syncButton.onclick = () => {
          openAssistantMatchesTab();
        };
      } else {
        syncButton.onclick = () => {
          handleHistoryImportClick(lobbyId).catch((error) => {
            logWarn("api", "Inline history import action failed.", error);
          });
        };
      }
    }
  }


  function openAssistantMatchesTab() {
    state.activeTab = "matches";
    state.store.ui.activeTab = "matches";
    schedulePersist();
    if (state.drawerOpen) {
      renderShell();
      return;
    }
    openDrawer();
  }


  async function handleLobbySyncAndOpen(lobbyId, trigger = "manual") {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!targetLobbyId || isLobbySyncing(targetLobbyId)) {
      return;
    }
    setHistoryInlineOutcome(targetLobbyId, "info", "Übernehme Ergebnis...");
    setLobbySyncing(targetLobbyId, true);
    renderHistoryImportButton();
    try {
      let syncOutcome = null;
      if (trigger === "inline-history") {
        const hostInfo = findHistoryImportHost(targetLobbyId);
        syncOutcome = importHistoryStatsTableResult(targetLobbyId, hostInfo);
      }

      if (!syncOutcome) {
        syncOutcome = await syncResultForLobbyId(targetLobbyId, {
          notifyErrors: true,
          notifyNotReady: true,
          trigger,
        });
      }

      if (syncOutcome.reasonCode === "completed" || syncOutcome.completed) {
        openAssistantMatchesTab();
        setHistoryInlineOutcome(targetLobbyId, "success", syncOutcome.message || "Ergebnis wurde übernommen.");
        const alreadyStored = normalizeText(syncOutcome.message || "").includes("bereits");
        if (alreadyStored) {
          setNotice("info", syncOutcome.message || "Ergebnis war bereits im Turnier gespeichert.", 2600);
        } else {
          setNotice("success", syncOutcome.message || "Ergebnis wurde in xLokales Turnier \u00fcbernommen.", 2600);
        }
      } else if (!syncOutcome.ok && syncOutcome.message) {
        setHistoryInlineOutcome(targetLobbyId, syncOutcome.reasonCode === "ambiguous" ? "error" : "info", syncOutcome.message);
        const noticeType = syncOutcome.reasonCode === "ambiguous" ? "error" : "info";
        setNotice(noticeType, syncOutcome.message, 3200);
      } else if (syncOutcome.ok && !syncOutcome.completed) {
        setHistoryInlineOutcome(targetLobbyId, "info", "Noch kein finales Ergebnis verfügbar.");
        setNotice("info", "Noch kein finales Ergebnis verf\u00fcgbar. Match l\u00e4uft ggf. noch.", 2600);
      }
    } catch (error) {
      logWarn("api", "Manual shortcut sync failed.", error);
      setHistoryInlineOutcome(targetLobbyId, "error", "Ergebnisübernahme fehlgeschlagen. Bitte erneut versuchen.");
      setNotice("error", "Ergebnis\u00fcbernahme fehlgeschlagen. Bitte sp\u00e4ter erneut versuchen.");
    } finally {
      setLobbySyncing(targetLobbyId, false);
      renderHistoryImportButton();
    }
  }


  async function handleHistoryImportClick(lobbyId) {
    return handleLobbySyncAndOpen(lobbyId, "inline-history");
  }


  function renderMatchReturnShortcut() {
    removeMatchReturnShortcut();
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
    removeMatchReturnShortcut();
    removeHistoryImportButton();
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

  function runSelfTests() {
    const results = [];
    const record = (name, ok, details = "") => {
      results.push({ name, ok: Boolean(ok), details: normalizeText(details || "") });
    };
    const participantList = (count, prefix = "P") => {
      const list = [];
      for (let i = 1; i <= count; i += 1) {
        list.push({ id: `${prefix}${i}`, name: `${prefix}${i}` });
      }
      return list;
    };

    try {
      const participants = participantList(9, "S");
      const ids = participants.map((item) => item.id);
      const seededMatches = buildKoMatchesV2(ids, KO_DRAW_MODE_SEEDED);
      const seededRoundOne = seededMatches.filter((match) => match.round === 1);
      const seededOpenRoundOne = seededRoundOne.filter((match) => match.player1Id && match.player2Id && !isByeMatchResult(match));
      record(
        "KO Seeded: 9 Teilnehmer -> genau 1 offenes R1-Match",
        seededOpenRoundOne.length === 1,
        `offene R1-Matches: ${seededOpenRoundOne.length}`,
      );
    } catch (error) {
      record("KO Seeded: 9 Teilnehmer -> genau 1 offenes R1-Match", false, String(error?.message || error));
    }

    try {
      const participants = participantList(9, "O");
      const ids = participants.map((item) => item.id);
      const openDrawMatches = buildKoMatchesV2(ids, KO_DRAW_MODE_OPEN_DRAW);
      const repeatedOpenDrawMatches = buildKoMatchesV2(ids, KO_DRAW_MODE_OPEN_DRAW);
      const toSignature = (matches) => matches
        .map((match) => `${match.id}:${match.player1Id || "-"}:${match.player2Id || "-"}:${isByeMatchResult(match) ? "bye" : "match"}`)
        .join("|");
      const deterministic = toSignature(openDrawMatches) === toSignature(repeatedOpenDrawMatches);
      const byeCount = openDrawMatches.filter((match) => isByeMatchResult(match)).length;
      record(
        "KO Open Draw: deterministisch mit expliziten Byes",
        deterministic && byeCount > 0,
        `matches=${openDrawMatches.length}, byes=${byeCount}, deterministic=${deterministic}`,
      );
    } catch (error) {
      record("KO Open Draw: deterministisch mit expliziten Byes", false, String(error?.message || error));
    }

    try {
      const participants = participantList(6, "K6");
      const structure = buildBracketStructure(participants, generateSeeds(participants, KO_DRAW_MODE_SEEDED));
      const matches = buildKoMatchesFromStructure(structure);
      const expectedTotalMatches = structure.rounds.reduce((sum, roundDef) => sum + roundDef.virtualMatches.length, 0);
      const byeCount = matches.filter((match) => isByeMatchResult(match)).length;
      record(
        "KO 6: vollständiger 8er-Baum mit 2 Byes",
        matches.length === expectedTotalMatches && expectedTotalMatches === 7 && byeCount === 2,
        `matches=${matches.length}, expected=${expectedTotalMatches}, byes=${byeCount}`,
      );
    } catch (error) {
      record("KO 6: vollständiger 8er-Baum mit 2 Byes", false, String(error?.message || error));
    }

    try {
      const participants = participantList(8, "K8");
      const structure = buildBracketStructure(participants, generateSeeds(participants, KO_DRAW_MODE_SEEDED));
      const matches = buildKoMatchesFromStructure(structure);
      const byeCount = matches.filter((match) => isByeMatchResult(match)).length;
      record(
        "KO 8: 7 Match-Knoten von Start an vorhanden",
        matches.length === 7 && byeCount === 0,
        `matches=${matches.length}, byes=${byeCount}`,
      );
    } catch (error) {
      record("KO 8: 7 Match-Knoten von Start an vorhanden", false, String(error?.message || error));
    }

    try {
      const compliant = isPdcCompliantMatchSetup({
        mode: "ko",
        bestOfLegs: 5,
        startScore: 501,
        x01InMode: "Straight",
        x01OutMode: "Double",
        x01BullMode: "25/50",
        x01MaxRounds: 50,
        x01BullOffMode: "Normal",
        lobbyVisibility: "private",
      });
      const notCompliantBestOfOne = isPdcCompliantMatchSetup({
        mode: "ko",
        bestOfLegs: 1,
        startScore: 501,
        x01InMode: "Straight",
        x01OutMode: "Double",
        x01BullMode: "25/50",
        x01MaxRounds: 50,
        x01BullOffMode: "Normal",
        lobbyVisibility: "private",
      });
      record(
        "PDC-Setup: KO + Best of >=3 + PDC-X01 erforderlich",
        compliant && !notCompliantBestOfOne,
        `compliant=${compliant}, bo1=${notCompliantBestOfOne}`,
      );
    } catch (error) {
      record("PDC-Setup: KO + Best of >=3 + PDC-X01 erforderlich", false, String(error?.message || error));
    }

    try {
      const tournament = createTournament({
        name: "PayloadMapping",
        mode: "league",
        bestOfLegs: 7,
        startScore: 701,
        x01Preset: X01_PRESET_CUSTOM,
        x01InMode: "Double",
        x01OutMode: "Master",
        x01BullMode: "50/50",
        x01MaxRounds: 20,
        x01BullOffMode: "Official",
        lobbyVisibility: "private",
        randomizeKoRound1: false,
        participants: participantList(2, "PM"),
      });
      const payload = buildLobbyCreatePayload(tournament);
      record(
        "Turnieranlage -> Matchstart-Payload übernimmt X01 + Best-of konsistent",
        payload?.variant === X01_VARIANT
          && payload?.isPrivate === true
          && payload?.bullOffMode === "Official"
          && payload?.legs === 4
          && payload?.settings?.baseScore === 701
          && payload?.settings?.inMode === "Double"
          && payload?.settings?.outMode === "Master"
          && payload?.settings?.maxRounds === 20
          && payload?.settings?.bullMode === "50/50",
        `legs=${payload?.legs}, settings=${JSON.stringify(payload?.settings || {})}`,
      );
    } catch (error) {
      record("Turnieranlage -> Matchstart-Payload übernimmt X01 + Best-of konsistent", false, String(error?.message || error));
    }

    try {
      const tournament = createTournament({
        name: "BullOffOff",
        mode: "league",
        bestOfLegs: 5,
        startScore: 501,
        x01Preset: X01_PRESET_CUSTOM,
        x01InMode: "Straight",
        x01OutMode: "Double",
        x01BullMode: "50/50",
        x01MaxRounds: 50,
        x01BullOffMode: "Off",
        lobbyVisibility: "private",
        randomizeKoRound1: false,
        participants: participantList(2, "BO"),
      });
      const payload = buildLobbyCreatePayload(tournament);
      const hasBullMode = Object.prototype.hasOwnProperty.call(payload?.settings || {}, "bullMode");
      record(
        "Bull-off Off: Matchstart-Payload setzt top-level bullOffMode + bullMode",
        payload?.bullOffMode === "Off"
          && hasBullMode,
        `bullOffMode=${payload?.bullOffMode || "-"}, hasBullMode=${hasBullMode}`,
      );
    } catch (error) {
      record("Bull-off Off: Matchstart-Payload setzt top-level bullOffMode + bullMode", false, String(error?.message || error));
    }

    try {
      const tournament = createTournament({
        name: "DrawLockOn",
        mode: "ko",
        bestOfLegs: 3,
        startScore: 501,
        x01Preset: X01_PRESET_PDC_STANDARD,
        x01InMode: "Straight",
        x01OutMode: "Double",
        x01BullMode: "25/50",
        x01MaxRounds: 50,
        x01BullOffMode: "Normal",
        lobbyVisibility: "private",
        randomizeKoRound1: false,
        koDrawLocked: true,
        participants: participantList(8, "DL"),
      });
      const before = JSON.stringify(tournament.ko?.rounds || []);
      tournament.participants = tournament.participants.slice().reverse();
      refreshDerivedMatches(tournament);
      const after = JSON.stringify(tournament.ko?.rounds || []);
      record(
        "Draw-Lock aktiv: KO-Struktur bleibt stabil",
        before === after,
        `stable=${before === after}`,
      );
    } catch (error) {
      record("Draw-Lock aktiv: KO-Struktur bleibt stabil", false, String(error?.message || error));
    }

    try {
      const tournament = createTournament({
        name: "DrawLockOff",
        mode: "ko",
        bestOfLegs: 3,
        startScore: 501,
        x01Preset: X01_PRESET_PDC_STANDARD,
        x01InMode: "Straight",
        x01OutMode: "Double",
        x01BullMode: "25/50",
        x01MaxRounds: 50,
        x01BullOffMode: "Normal",
        lobbyVisibility: "private",
        randomizeKoRound1: false,
        koDrawLocked: false,
        participants: participantList(8, "DU"),
      });
      const before = JSON.stringify(tournament.ko?.rounds || []);
      tournament.participants = tournament.participants.slice().reverse();
      refreshDerivedMatches(tournament);
      const after = JSON.stringify(tournament.ko?.rounds || []);
      record(
        "Draw-Lock aus: KO-Struktur kann neu aufgebaut werden",
        before !== after,
        `changed=${before !== after}`,
      );
    } catch (error) {
      record("Draw-Lock aus: KO-Struktur kann neu aufgebaut werden", false, String(error?.message || error));
    }

    try {
      const matches = [
        createMatch({ id: "m-ab", stage: MATCH_STAGE_LEAGUE, round: 1, number: 1, player1Id: "A", player2Id: "B", status: STATUS_COMPLETED, winnerId: "A", legs: { p1: 2, p2: 1 } }),
        createMatch({ id: "m-ac", stage: MATCH_STAGE_LEAGUE, round: 1, number: 2, player1Id: "A", player2Id: "C", status: STATUS_COMPLETED, winnerId: "A", legs: { p1: 2, p2: 1 } }),
        createMatch({ id: "m-ad", stage: MATCH_STAGE_LEAGUE, round: 1, number: 3, player1Id: "A", player2Id: "D", status: STATUS_COMPLETED, winnerId: "D", legs: { p1: 0, p2: 2 } }),
        createMatch({ id: "m-bc", stage: MATCH_STAGE_LEAGUE, round: 2, number: 1, player1Id: "B", player2Id: "C", status: STATUS_COMPLETED, winnerId: "B", legs: { p1: 2, p2: 0 } }),
        createMatch({ id: "m-bd", stage: MATCH_STAGE_LEAGUE, round: 2, number: 2, player1Id: "B", player2Id: "D", status: STATUS_COMPLETED, winnerId: "B", legs: { p1: 2, p2: 0 } }),
        createMatch({ id: "m-cd", stage: MATCH_STAGE_LEAGUE, round: 2, number: 3, player1Id: "C", player2Id: "D", status: STATUS_COMPLETED, winnerId: "C", legs: { p1: 2, p2: 1 } }),
      ];

      const h2hTournament = {
        id: "tb1",
        name: "TB1",
        mode: "league",
        ko: null,
        bestOfLegs: 3,
        startScore: 501,
        x01: buildPdcX01Settings(),
        rules: normalizeTournamentRules({ tieBreakProfile: TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE }),
        participants: [
          { id: "A", name: "A" },
          { id: "B", name: "B" },
          { id: "C", name: "C" },
          { id: "D", name: "D" },
        ],
        groups: [],
        matches: cloneSerializable(matches),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const pointsLegDiffTournament = {
        ...h2hTournament,
        id: "tb2",
        rules: normalizeTournamentRules({ tieBreakProfile: TIE_BREAK_PROFILE_PROMOTER_POINTS_LEGDIFF }),
        matches: cloneSerializable(matches),
      };
      const h2hRows = standingsForMatches(h2hTournament, h2hTournament.matches);
      const legacyRows = standingsForMatches(pointsLegDiffTournament, pointsLegDiffTournament.matches);
      record(
        "Tie-Break-Profile: H2H und Punkte+LegDiff liefern unterschiedliche Reihenfolge",
        h2hRows[0]?.id === "A" && legacyRows[0]?.id === "B",
        `h2h=${h2hRows[0]?.id || "-"}, legacy=${legacyRows[0]?.id || "-"}`,
      );
    } catch (error) {
      record("Tie-Break-Profile: H2H und Punkte+LegDiff liefern unterschiedliche Reihenfolge", false, String(error?.message || error));
    }

    try {
      const tournament = createTournament({
        name: "GroupsKo",
        mode: "groups_ko",
        bestOfLegs: 3,
        startScore: 501,
        x01Preset: X01_PRESET_PDC_STANDARD,
        x01InMode: "Straight",
        x01OutMode: "Double",
        x01BullMode: "25/50",
        x01MaxRounds: 50,
        x01BullOffMode: "Normal",
        lobbyVisibility: "private",
        randomizeKoRound1: false,
        participants: participantList(4, "G"),
      });
      const groupA = findMatch(tournament, "group-A-r1-m1");
      const groupB = findMatch(tournament, "group-B-r1-m1");
      groupA.status = STATUS_COMPLETED;
      groupA.winnerId = groupA.player1Id;
      groupA.legs = { p1: 2, p2: 0 };
      groupB.status = STATUS_COMPLETED;
      groupB.winnerId = groupB.player1Id;
      groupB.legs = { p1: 2, p2: 1 };
      refreshDerivedMatches(tournament);

      const semi1 = findMatch(tournament, "ko-r1-m1");
      const semi2 = findMatch(tournament, "ko-r1-m2");
      semi1.status = STATUS_COMPLETED;
      semi1.winnerId = semi1.player1Id;
      semi1.legs = { p1: 2, p2: 0 };
      semi2.status = STATUS_COMPLETED;
      semi2.winnerId = semi2.player1Id;
      semi2.legs = { p1: 2, p2: 1 };
      refreshDerivedMatches(tournament);

      const final = findMatch(tournament, "ko-r2-m1");
      record(
        "Groups+KO Regression: Finale wird korrekt aus Semis belegt",
        Boolean(final?.player1Id && final?.player2Id),
        `final=${final?.player1Id || "-"}:${final?.player2Id || "-"}`,
      );
    } catch (error) {
      record("Groups+KO Regression: Finale wird korrekt aus Semis belegt", false, String(error?.message || error));
    }

    try {
      const tournament = {
        id: "t2",
        name: "T2",
        mode: "groups_ko",
        ko: null,
        bestOfLegs: 3,
        startScore: 501,
        x01: buildPdcX01Settings(),
        rules: normalizeTournamentRules({ tieBreakProfile: TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE }),
        participants: [
          { id: "A", name: "A" },
          { id: "B", name: "B" },
          { id: "C", name: "C" },
        ],
        groups: [],
        matches: [
          createMatch({ id: "m1", stage: MATCH_STAGE_GROUP, groupId: "A", round: 1, number: 1, player1Id: "A", player2Id: "B", status: STATUS_COMPLETED, winnerId: "A", legs: { p1: 2, p2: 1 } }),
          createMatch({ id: "m2", stage: MATCH_STAGE_GROUP, groupId: "A", round: 2, number: 1, player1Id: "B", player2Id: "C", status: STATUS_COMPLETED, winnerId: "B", legs: { p1: 2, p2: 1 } }),
          createMatch({ id: "m3", stage: MATCH_STAGE_GROUP, groupId: "A", round: 3, number: 1, player1Id: "C", player2Id: "A", status: STATUS_COMPLETED, winnerId: "C", legs: { p1: 2, p2: 1 } }),
        ],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const rows = standingsForMatches(tournament, tournament.matches, ["A", "B", "C"]);
      const blocked = rows.filter((row) => row.tiebreakState === "playoff_required").length;
      record(
        "Promoter H2H: Deadlock -> Playoff erforderlich",
        blocked === 3,
        rows.map((row) => `${row.id}:${row.tiebreakState}`).join(", "),
      );
    } catch (error) {
      record("Promoter H2H: Deadlock -> Playoff erforderlich", false, String(error?.message || error));
    }

    try {
      const tournament = {
        participants: [
          { id: "P1", name: "Sabine" },
          { id: "P2", name: "Tanja" },
        ],
      };
      const match = {
        player1Id: "P1",
        player2Id: "P2",
      };
      const apiStats = {
        winner: 1,
        players: [
          { name: "Sabine" },
          { name: "Tanja" },
        ],
        matchStats: [
          { legsWon: 1 },
          { legsWon: 0 },
        ],
      };
      const candidates = getApiMatchLegCandidatesFromStats(tournament, match, apiStats, "P2");
      const best = candidates[0] || { p1: -1, p2: -1 };
      record(
        "API Sync: vertauschte Legs-Reihenfolge wird korrigiert",
        best.p1 === 0 && best.p2 === 1,
        `best=${best.p1}:${best.p2}`,
      );
    } catch (error) {
      record("API Sync: vertauschte Legs-Reihenfolge wird korrigiert", false, String(error?.message || error));
    }

    try {
      const tournament = {
        participants: [
          { id: "P1", name: "Sabine" },
          { id: "P2", name: "Tanja" },
        ],
      };
      const match = {
        player1Id: "P1",
        player2Id: "P2",
      };
      const apiStats = {
        winner: 0,
        players: [
          { name: "Sabine" },
          { name: "Tanja" },
        ],
        matchStats: [
          { legsWon: 1, player: { name: "Tanja" } },
          { legsWon: 0, player: { name: "Sabine" } },
        ],
      };
      const winners = resolveWinnerIdCandidatesFromApiStats(tournament, match, apiStats, 0);
      record(
        "API Sync: Winner-Index aus matchStats wird bevorzugt",
        winners[0] === "P2",
        `first=${winners[0] || "-"}`,
      );
    } catch (error) {
      record("API Sync: Winner-Index aus matchStats wird bevorzugt", false, String(error?.message || error));
    }

    try {
      const tournament = {
        participants: [
          { id: "P1", name: "Tommy" },
          { id: "P2", name: "Hans" },
        ],
        matches: [
          createMatch({ id: "m1", stage: MATCH_STAGE_GROUP, round: 1, number: 1, player1Id: "P1", player2Id: "P2", status: STATUS_PENDING }),
          createMatch({ id: "m2", stage: MATCH_STAGE_KO, round: 2, number: 1, player1Id: "P1", player2Id: "P2", status: STATUS_PENDING }),
        ],
      };
      const apiStats = {
        players: [
          { name: "Tommy" },
          { name: "Hans" },
        ],
        matchStats: [
          { player: { name: "Tommy" }, legsWon: 1 },
          { player: { name: "Hans" }, legsWon: 0 },
        ],
      };
      const recovered = findOpenMatchCandidatesByApiStats(tournament, apiStats);
      record(
        "API Sync: Recovery erkennt mehrdeutige Match-Zuordnung",
        recovered.length === 2,
        `candidates=${recovered.length}`,
      );
    } catch (error) {
      record("API Sync: Recovery erkennt mehrdeutige Match-Zuordnung", false, String(error?.message || error));
    }

    try {
      const tournament = {
        participants: [
          { id: "P1", name: "Tanja Mueller" },
          { id: "P2", name: "Simon Stark" },
        ],
      };
      const ids = participantIdsByName(tournament, "TANJA");
      record(
        "History Import: Namens-Matching erkennt Teilnamen",
        ids.includes("P1"),
        `ids=${ids.join(",")}`,
      );
    } catch (error) {
      record("History Import: Namens-Matching erkennt Teilnamen", false, String(error?.message || error));
    }

    {
      const previousTournament = state.store.tournament;
      try {
        const tournament = {
          id: "history-test-lobby",
          name: "History",
          mode: "league",
          ko: null,
          bestOfLegs: 3,
          startScore: 501,
          x01: buildPdcX01Settings(),
          rules: normalizeTournamentRules({ tieBreakProfile: TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE }),
          participants: [
            { id: "P1", name: "Tanja Mueller" },
            { id: "P2", name: "Simon Stark" },
          ],
          groups: [],
          matches: [
            createMatch({
              id: "m-history-lobby",
              stage: MATCH_STAGE_LEAGUE,
              round: 1,
              number: 1,
              player1Id: "P1",
              player2Id: "P2",
              meta: {
                auto: {
                  lobbyId: "lobby-history-1",
                  status: "started",
                },
              },
            }),
          ],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        state.store.tournament = tournament;
        const table = document.createElement("table");
        table.innerHTML = `
          <thead>
            <tr>
              <th>Stats</th>
              <td><span class="ad-ext-player-name"><p>TANJA</p></span></td>
              <td><span class="ad-ext-player-name"><p>SIMON</p></span><svg data-icon="trophy"></svg></td>
            </tr>
          </thead>
          <tbody>
            <tr><td>Gewonnene Legs</td><td>1</td><td>0</td></tr>
          </tbody>
        `;
        const outcome = importHistoryStatsTableResult("lobby-history-1", { table });
        const updated = findMatch(tournament, "m-history-lobby");
        record(
          "History Import: Lobby-Mapping priorisiert + Legs normalisiert",
          Boolean(outcome?.ok)
            && outcome.reasonCode === "completed"
            && updated?.status === STATUS_COMPLETED
            && updated?.winnerId === "P1"
            && updated?.legs?.p1 === 2
            && updated?.legs?.p2 === 0,
          `reason=${outcome?.reasonCode || "-"}, winner=${updated?.winnerId || "-"}, legs=${updated?.legs?.p1}:${updated?.legs?.p2}`,
        );
      } catch (error) {
        record("History Import: Lobby-Mapping priorisiert + Legs normalisiert", false, String(error?.message || error));
      } finally {
        state.store.tournament = previousTournament;
      }
    }

    {
      const previousTournament = state.store.tournament;
      try {
        const tournament = {
          id: "history-test-ambiguous",
          name: "History",
          mode: "league",
          ko: null,
          bestOfLegs: 1,
          startScore: 501,
          x01: buildPdcX01Settings(),
          rules: normalizeTournamentRules({ tieBreakProfile: TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE }),
          participants: [
            { id: "P1", name: "Tommy" },
            { id: "P2", name: "Hans" },
          ],
          groups: [],
          matches: [
            createMatch({
              id: "m-history-a",
              stage: MATCH_STAGE_LEAGUE,
              round: 1,
              number: 1,
              player1Id: "P1",
              player2Id: "P2",
            }),
            createMatch({
              id: "m-history-b",
              stage: MATCH_STAGE_KO,
              round: 2,
              number: 1,
              player1Id: "P1",
              player2Id: "P2",
              meta: {
                auto: {
                  lobbyId: "lobby-history-2",
                  status: "started",
                },
              },
            }),
          ],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        state.store.tournament = tournament;
        const table = document.createElement("table");
        table.innerHTML = `
          <thead>
            <tr>
              <th>Stats</th>
              <td><span class="ad-ext-player-name"><p>TOMMY</p></span></td>
              <td><span class="ad-ext-player-name"><p>HANS</p></span></td>
            </tr>
          </thead>
          <tbody>
            <tr><td>Gewonnene Legs</td><td>1</td><td>0</td></tr>
          </tbody>
        `;
        const outcome = importHistoryStatsTableResult("lobby-history-2", { table });
        const matchA = findMatch(tournament, "m-history-a");
        const matchB = findMatch(tournament, "m-history-b");
        record(
          "History Import: bei Mehrdeutigkeit gewinnt verknüpfte Lobby",
          Boolean(outcome?.ok)
            && matchA?.status === STATUS_PENDING
            && matchB?.status === STATUS_COMPLETED
            && matchB?.winnerId === "P1",
          `reason=${outcome?.reasonCode || "-"}, A=${matchA?.status || "-"}, B=${matchB?.status || "-"}:${matchB?.winnerId || "-"}`,
        );
      } catch (error) {
        record("History Import: bei Mehrdeutigkeit gewinnt verknüpfte Lobby", false, String(error?.message || error));
      } finally {
        state.store.tournament = previousTournament;
      }
    }

    try {
      const rawStoreV2 = {
        schemaVersion: 2,
        settings: { debug: false, featureFlags: { autoLobbyStart: false, randomizeKoRound1: true } },
        ui: { activeTab: "tournament", matchesSortMode: MATCH_SORT_MODE_READY_FIRST },
        tournament: {
          id: "legacy",
          name: "Legacy",
          mode: "league",
          bestOfLegs: 3,
          startScore: 501,
          x01: buildPdcX01Settings(),
          participants: [{ id: "A", name: "A" }, { id: "B", name: "B" }],
          groups: [],
          matches: [],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
      };
      const migrated = migrateStorage(rawStoreV2);
      record(
        "Migration: v2 -> v4 setzt Tie-Break-Profil",
        migrated.schemaVersion === 4
          && migrated.tournament?.rules?.tieBreakProfile === TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE
          && migrated.settings?.featureFlags?.koDrawLockDefault === true,
        `schema=${migrated.schemaVersion}, profile=${migrated.tournament?.rules?.tieBreakProfile}`,
      );
    } catch (error) {
      record("Migration: v2 -> v3 setzt Tie-Break-Regeln", false, String(error?.message || error));
    }

    const passed = results.filter((entry) => entry.ok).length;
    const failed = results.length - passed;
    return {
      ok: failed === 0,
      passed,
      failed,
      results,
      generatedAt: nowIso(),
      version: APP_VERSION,
    };
  }


  function setupRuntimeApi() {
    window[RUNTIME_GLOBAL_KEY] = {
      version: APP_VERSION,
      isReady: () => state.ready,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      runSelfTests,
    };

    addCleanup(() => {
      if (window[RUNTIME_GLOBAL_KEY]) {
        delete window[RUNTIME_GLOBAL_KEY];
      }
    });
  }

  async function init() {
    await loadPersistedStore();
    state.runtimeStatusSignature = runtimeStatusSignature();
    ensureHost();
    renderShell();
    removeMatchReturnShortcut();
    renderHistoryImportButton();

    initEventBridge();
    installRouteHooks();
    startAutoDetectionObserver();
    setupRuntimeApi();
    addInterval(() => {
      syncPendingApiMatches().catch((error) => {
        logWarn("api", "Background sync loop failed.", error);
      });
    }, API_SYNC_INTERVAL_MS);
    addInterval(() => {
      refreshRuntimeStatusUi();
      renderHistoryImportButton();
    }, 1200);

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

