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
  const README_TIE_BREAK_URL = `${README_BASE_URL}#dra-tie-break`;
  const README_TOURNAMENT_MODES_URL = `${README_BASE_URL}#turniermodi`;
  const README_TOURNAMENT_CREATE_URL = `${README_BASE_URL}#turnier-anlegen`;
  const README_API_AUTOMATION_URL = `${README_BASE_URL}#api-halbautomatik`;
  const DRA_RULES_URL = "https://www.thedra.co.uk/rules";
  const DRA_RULES_PDF_URL = "https://static.wixstatic.com/ugd/298855_0050acb8726842f7b7ca13ec829f5ebf.pdf";
  const PDC_OPEN_DRAW_CONTEXT_URL = "https://www.pdc.tv/news/2013/01/16/rules-challenge-youth-tours";

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
        display: inline-flex;
        align-items: center;
        min-height: 42px;
        border-radius: var(--ata-radius-sm);
        border: 1px solid rgba(185, 199, 236, 0.22);
        background: var(--ata-control-bg-disabled);
        color: rgba(232, 237, 255, 0.78);
        padding: 9px 10px;
        font-size: 15px;
        font-weight: 600;
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
        display: grid;
        gap: 4px;
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
        const label = normalizeText(entry?.label) || "Mehr Informationen";
        const title = normalizeText(entry?.title) || label;
        return `
          <a
            class="ata-help-link"
            href="${escapeHtml(href)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${escapeHtml(label)}"
            title="${escapeHtml(title)}"
          >ⓘ</a>
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


  function normalizeTieBreakMode(value, fallback = TIE_BREAK_MODE_DRA_STRICT) {
    const mode = normalizeText(value || "").toLowerCase();
    return TIE_BREAK_MODES.includes(mode) ? mode : fallback;
  }


  function normalizeTournamentRules(rawRules) {
    const rules = rawRules && typeof rawRules === "object" ? rawRules : {};
    return {
      tieBreakMode: normalizeTieBreakMode(rules.tieBreakMode, TIE_BREAK_MODE_DRA_STRICT),
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


  function normalizeTournamentKoMeta(rawKo, fallbackDrawMode = KO_DRAW_MODE_SEEDED) {
    const ko = rawKo && typeof rawKo === "object" ? rawKo : {};
    const drawMode = normalizeKoDrawMode(ko.drawMode, fallbackDrawMode);
    const engineVersion = normalizeKoEngineVersion(ko.engineVersion, 0);
    return {
      drawMode,
      engineVersion,
    };
  }


  function normalizeTournament(rawTournament) {
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
      updatedAt: normalizeText(match?.updatedAt || nowIso()),
      meta: normalizeMatchMeta(match?.meta),
    }));

    const fallbackStartScore = sanitizeStartScore(rawTournament.startScore);
    const x01 = normalizeTournamentX01Settings(rawTournament.x01, fallbackStartScore);
    const rules = normalizeTournamentRules(rawTournament.rules);

    return {
      id: normalizeText(rawTournament.id || uuid("tournament")),
      name: normalizeText(rawTournament.name || "Lokales Turnier"),
      mode,
      ko: mode === "ko"
        ? normalizeTournamentKoMeta(rawTournament.ko, KO_DRAW_MODE_SEEDED)
        : null,
      bestOfLegs: sanitizeBestOf(rawTournament.bestOfLegs),
      startScore: x01.baseScore,
      x01,
      rules,
      participants,
      groups,
      matches,
      createdAt: normalizeText(rawTournament.createdAt || nowIso()),
      updatedAt: normalizeText(rawTournament.updatedAt || nowIso()),
    };
  }


  function normalizeStoreShape(input) {
    const defaults = createDefaultStore();
    const settings = {
      debug: Boolean(input?.settings?.debug),
      featureFlags: {
        autoLobbyStart: Boolean(input?.settings?.featureFlags?.autoLobbyStart),
        randomizeKoRound1: input?.settings?.featureFlags?.randomizeKoRound1 !== false,
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
      tournament: normalizeTournament(input?.tournament),
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

  function setTournamentTieBreakMode(mode) {
    const tournament = state.store.tournament;
    if (!tournament) {
      return { ok: false, message: "Kein aktives Turnier vorhanden." };
    }
    const nextMode = normalizeTieBreakMode(mode, TIE_BREAK_MODE_DRA_STRICT);
    const currentMode = normalizeTieBreakMode(tournament?.rules?.tieBreakMode, TIE_BREAK_MODE_DRA_STRICT);
    if (nextMode === currentMode) {
      return { ok: true, changed: false };
    }
    tournament.rules = normalizeTournamentRules({
      ...(tournament.rules || {}),
      tieBreakMode: nextMode,
    });
    refreshDerivedMatches(tournament);
    tournament.updatedAt = nowIso();
    schedulePersist();
    renderShell();
    return { ok: true, changed: true };
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


  function buildKoRound1Slots(participantIds, drawMode) {
    const ids = Array.isArray(participantIds) ? participantIds.slice() : [];
    if (!ids.length) {
      return [];
    }
    const size = nextPowerOfTwo(ids.length);
    const mode = normalizeKoDrawMode(drawMode, KO_DRAW_MODE_SEEDED);
    const seedOrderedParticipants = mode === KO_DRAW_MODE_OPEN_DRAW ? shuffleArray(ids) : ids;
    const placement = buildSeedPlacement(size);
    const seedToParticipant = new Map();
    seedOrderedParticipants.forEach((participantId, index) => {
      seedToParticipant.set(index + 1, participantId);
    });
    return placement.map((seedNumber) => seedToParticipant.get(seedNumber) || null);
  }


  function buildKoMatchesV2(participantIds, drawMode = KO_DRAW_MODE_SEEDED) {
    const roundOneSlots = buildKoRound1Slots(participantIds, drawMode);
    const size = roundOneSlots.length || nextPowerOfTwo(participantIds.length);

    const matches = [];
    const rounds = Math.log2(size);

    for (let round = 1; round <= rounds; round += 1) {
      const matchesInRound = size / (2 ** round);
      for (let number = 1; number <= matchesInRound; number += 1) {
        const idx = (number - 1) * 2;
        const player1Id = round === 1 ? roundOneSlots[idx] || null : null;
        const player2Id = round === 1 ? roundOneSlots[idx + 1] || null : null;
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
      errors.push("Ung\u00fcltiger Modus.");
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

    if (config.mode === "league") {
      matches = buildLeagueMatches(participantIds);
    } else if (config.mode === "groups_ko") {
      groups = buildGroups(participantIds);
      matches = buildGroupMatches(groups).concat(buildGroupsKoMatches());
    } else {
      matches = buildKoMatchesV2(participantIds, koDrawMode);
    }

    const tournament = {
      id: uuid("tournament"),
      name: normalizeText(config.name),
      mode: config.mode,
      ko: config.mode === "ko" ? {
        drawMode: koDrawMode,
        engineVersion: KO_ENGINE_VERSION,
      } : null,
      bestOfLegs: sanitizeBestOf(config.bestOfLegs),
      startScore: x01.baseScore,
      x01,
      rules: normalizeTournamentRules({ tieBreakMode: TIE_BREAK_MODE_DRA_STRICT }),
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

    const tieBreakMode = normalizeTieBreakMode(tournament?.rules?.tieBreakMode, TIE_BREAK_MODE_DRA_STRICT);
    const tiePrimaryById = new Map(rows.map((row) => [row.id, 0]));

    if (tieBreakMode === TIE_BREAK_MODE_DRA_STRICT) {
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

      if (tieBreakMode === TIE_BREAK_MODE_DRA_STRICT) {
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

    if (tieBreakMode === TIE_BREAK_MODE_DRA_STRICT) {
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


  function migrateKoTournamentToV2(tournament, defaultDrawMode = KO_DRAW_MODE_SEEDED) {
    if (!tournament || tournament.mode !== "ko") {
      return false;
    }

    const drawMode = normalizeKoDrawMode(tournament?.ko?.drawMode, defaultDrawMode);
    const engineVersion = normalizeKoEngineVersion(tournament?.ko?.engineVersion, 0);

    if (engineVersion >= KO_ENGINE_VERSION) {
      if (!tournament.ko || tournament.ko.drawMode !== drawMode || tournament.ko.engineVersion !== KO_ENGINE_VERSION) {
        tournament.ko = { drawMode, engineVersion: KO_ENGINE_VERSION };
        return true;
      }
      return false;
    }

    const backupSnapshot = cloneSerializable(tournament);
    if (backupSnapshot) {
      persistKoMigrationBackup(backupSnapshot, "ko-engine-v2-migration").catch((error) => {
        logWarn("storage", "KO migration backup write failed.", error);
      });
    }

    const participantIds = (tournament.participants || [])
      .map((participant) => normalizeText(participant?.id || ""))
      .filter(Boolean);

    const nonKoMatches = (tournament.matches || []).filter((match) => match.stage !== MATCH_STAGE_KO);
    const migratedKoMatches = buildKoMatchesV2(participantIds, drawMode);
    tournament.matches = nonKoMatches.concat(migratedKoMatches);
    tournament.ko = { drawMode, engineVersion: KO_ENGINE_VERSION };
    tournament.updatedAt = nowIso();

    logDebug("ko", "KO tournament migrated to engine v2.", {
      drawMode,
      participantCount: participantIds.length,
    });

    return true;
  }


  function autoCompleteByes(tournament) {
    if (!tournament || tournament.mode !== "ko") {
      return false;
    }

    let changed = false;
    const participantIndexes = buildParticipantIndexes(tournament);
    const koMatches = getMatchesByStage(tournament, MATCH_STAGE_KO);

    function applyByeCompletion(match, winnerId) {
      let localChanged = false;
      if (match.status !== STATUS_COMPLETED) {
        match.status = STATUS_COMPLETED;
        localChanged = true;
      }
      if (match.winnerId !== winnerId) {
        match.winnerId = winnerId;
        localChanged = true;
      }
      if (match.source !== "auto") {
        match.source = "auto";
        localChanged = true;
      }
      if (clampInt(match.legs?.p1, 0, 0, 99) !== 0 || clampInt(match.legs?.p2, 0, 0, 99) !== 0) {
        match.legs = { p1: 0, p2: 0 };
        localChanged = true;
      }
      localChanged = setMatchResultKind(match, "bye") || localChanged;
      const auto = ensureMatchAutoMeta(match);
      if (auto.lobbyId || auto.status !== "idle" || auto.startedAt || auto.finishedAt || auto.lastSyncAt || auto.lastError) {
        resetMatchAutomationMeta(match);
        localChanged = true;
      }
      if (localChanged) {
        match.updatedAt = nowIso();
      }
      return localChanged;
    }

    koMatches.forEach((match) => {
      // Byes are only legitimate in round 1 seeding; later rounds with one empty slot
      // mean "winner not known yet", not an automatic win.
      if (match.round !== 1) {
        if (isByeMatchResult(match)) {
          const localChanged = setMatchResultKind(match, null);
          if (localChanged) {
            match.updatedAt = nowIso();
          }
          changed = localChanged || changed;
        }
        return;
      }
      const p1 = resolveParticipantSlotId(tournament, match.player1Id, participantIndexes);
      const p2 = resolveParticipantSlotId(tournament, match.player2Id, participantIndexes);
      changed = assignPlayerSlot(match, 1, p1) || changed;
      changed = assignPlayerSlot(match, 2, p2) || changed;

      if (p1 && p2) {
        if (isByeMatchResult(match)) {
          const localChanged = setMatchResultKind(match, null);
          if (localChanged) {
            match.updatedAt = nowIso();
          }
          changed = localChanged || changed;
        }
        return;
      }

      if (p1 && !p2) {
        changed = applyByeCompletion(match, p1) || changed;
      } else if (p2 && !p1) {
        changed = applyByeCompletion(match, p2) || changed;
      } else if (isByeMatchResult(match)) {
        const localChanged = setMatchResultKind(match, null);
        if (localChanged) {
          match.updatedAt = nowIso();
        }
        changed = localChanged || changed;
      }
    });
    return changed;
  }


  function isCompletedMatchResultValid(tournament, match) {
    if (!match || match.status !== STATUS_COMPLETED) {
      return true;
    }
    if (!match.player1Id || !match.player2Id) {
      const availablePlayerId = match.player1Id || match.player2Id;
      if (match.stage !== MATCH_STAGE_KO || match.round !== 1) {
        return false;
      }
      return Boolean(availablePlayerId && match.winnerId === availablePlayerId);
    }
    if (match.winnerId !== match.player1Id && match.winnerId !== match.player2Id) {
      return false;
    }

    const legsToWin = getLegsToWin(tournament?.bestOfLegs);
    const p1Legs = clampInt(match.legs?.p1, 0, 0, 99);
    const p2Legs = clampInt(match.legs?.p2, 0, 0, 99);
    if (p1Legs > legsToWin || p2Legs > legsToWin) {
      return false;
    }
    if (p1Legs === p2Legs) {
      return false;
    }

    const winnerLegs = match.winnerId === match.player1Id ? p1Legs : p2Legs;
    const loserLegs = match.winnerId === match.player1Id ? p2Legs : p1Legs;
    return winnerLegs === legsToWin && winnerLegs > loserLegs;
  }


  function normalizeCompletedMatchResults(tournament) {
    if (!tournament) {
      return false;
    }
    let changed = false;
    tournament.matches.forEach((match) => {
      if (match.status === STATUS_COMPLETED && !isCompletedMatchResultValid(tournament, match)) {
        clearMatchResult(match);
        changed = true;
      }
    });
    return changed;
  }


  function refreshDerivedMatches(tournament) {
    if (!tournament) {
      return false;
    }

    let changedAny = false;
    for (let i = 0; i < 8; i += 1) {
      let changed = false;
      changed = migrateKoTournamentToV2(tournament, KO_DRAW_MODE_SEEDED) || changed;
      changed = normalizeCompletedMatchResults(tournament) || changed;
      changed = resolveGroupsToKoAssignments(tournament) || changed;
      changed = autoCompleteByes(tournament) || changed;
      changed = advanceKoWinners(tournament) || changed;
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

    const legsToWin = getLegsToWin(tournament.bestOfLegs);
    const p1Legs = clampInt(legs?.p1, 0, 0, 99);
    const p2Legs = clampInt(legs?.p2, 0, 0, 99);
    const winnerIsP1 = winnerId === match.player1Id;
    const winnerLegs = winnerIsP1 ? p1Legs : p2Legs;
    const loserLegs = winnerIsP1 ? p2Legs : p1Legs;

    if (p1Legs > legsToWin || p2Legs > legsToWin) {
      return {
        ok: false,
        message: `Ung\u00fcltiges Ergebnis: Pro Spieler sind maximal ${legsToWin} Legs m\u00f6glich (Best-of ${sanitizeBestOf(tournament.bestOfLegs)}).`,
      };
    }

    if (p1Legs === p2Legs) {
      return { ok: false, message: "Ung\u00fcltiges Ergebnis: Bei Best-of ist kein Gleichstand m\u00f6glich." };
    }

    if (winnerLegs <= loserLegs) {
      return { ok: false, message: "Ung\u00fcltiges Ergebnis: Der gew\u00e4hlte Gewinner muss mehr Legs als der Gegner haben." };
    }

    if (winnerLegs !== legsToWin) {
      return {
        ok: false,
        message: `Ung\u00fcltiges Ergebnis: Der Gewinner muss genau ${legsToWin} Legs erreichen (Best-of ${sanitizeBestOf(tournament.bestOfLegs)}).`,
      };
    }

    match.status = STATUS_COMPLETED;
    match.winnerId = winnerId;
    match.source = source === "auto" ? "auto" : "manual";
    match.legs = { p1: p1Legs, p2: p2Legs };
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
      if (isByeMatchResult(match)) {
        return { editable: false, reason: "Freilos wurde automatisch weitergeleitet." };
      }
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
    const auto = ensureMatchAutoMeta(match);
    const lobbyId = normalizeText(auto.lobbyId || "");
    if (!lobbyId) {
      return { ok: false, updated: false, completed: false, pending: true, message: "Keine Lobby-ID vorhanden." };
    }
    if (!includeErrorRetry && auto.status === "error") {
      return { ok: false, updated: false, completed: false, pending: true, message: "Match ist im Fehlerstatus." };
    }

    let updated = false;
    if (auto.status === "error") {
      auto.status = "started";
      auto.lastSyncAt = nowIso();
      match.updatedAt = nowIso();
      updated = true;
    }

    try {
      const stats = await fetchMatchStats(lobbyId, token);
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
          message: "API-Ergebnis ist noch nicht final verf\u00fcgbar.",
        };
      }

      const winnerName = normalizeText(stats?.players?.[winnerIndex]?.name || "");
      const winnerId = resolveWinnerIdFromApiName(tournament, match, winnerName);
      if (!winnerId) {
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
        return { ok: false, updated, completed: false, pending: true, recoverable: false, message: mappingError };
      }

      const legs = getApiMatchLegsFromStats(stats);
      const result = updateMatchResult(match.id, winnerId, legs, "auto");
      if (!result.ok) {
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
        return { ok: false, updated, completed: false, pending: true, recoverable: false, message: saveError };
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

      return { ok: true, updated: true, completed: true, pending: false, message: "Ergebnis \u00fcbernommen." };
    } catch (error) {
      const status = Number(error?.status || 0);
      if (status === 401 || status === 403) {
        return { ok: false, updated, completed: false, pending: true, authError: true, message: "Auth abgelaufen." };
      }
      if (status === 404) {
        return {
          ok: false,
          updated,
          completed: false,
          pending: true,
          recoverable: true,
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
      return { ok: false, updated, completed: false, pending: true, recoverable: false, message: errorMessage };
    }
  }


  async function syncResultForLobbyId(lobbyId, options = {}) {
    const targetLobbyId = normalizeText(lobbyId || "");
    const tournament = state.store.tournament;
    if (!targetLobbyId) {
      return { ok: false, message: "Keine Lobby-ID erkannt." };
    }
    if (!tournament) {
      return { ok: false, message: "Kein aktives Turnier vorhanden." };
    }
    if (!state.store.settings.featureFlags.autoLobbyStart) {
      return { ok: false, message: "Auto-Lobby ist deaktiviert." };
    }

    const openMatch = findTournamentMatchByLobbyId(tournament, targetLobbyId, false);
    const completedMatch = openMatch ? null : findTournamentMatchByLobbyId(tournament, targetLobbyId, true);
    if (!openMatch && completedMatch?.status === STATUS_COMPLETED) {
      return { ok: true, completed: true, message: "Ergebnis war bereits \u00fcbernommen." };
    }
    if (!openMatch) {
      return { ok: false, message: "Kein offenes Turnier-Match f\u00fcr diese Lobby gefunden." };
    }

    const token = getAuthTokenFromCookie();
    if (!token) {
      return { ok: false, message: "Kein Auth-Token gefunden. Bitte neu einloggen." };
    }

    const syncOutcome = await syncApiMatchResult(tournament, openMatch, token, {
      notifyErrors: Boolean(options.notifyErrors),
      notifyNotReady: Boolean(options.notifyNotReady),
      includeErrorRetry: true,
    });

    if (syncOutcome.authError) {
      state.apiAutomation.authBackoffUntil = Date.now() + API_AUTH_NOTICE_THROTTLE_MS;
      return { ok: false, message: "Auth abgelaufen. Bitte neu einloggen." };
    }

    if (syncOutcome.updated) {
      if (state.store.tournament) {
        state.store.tournament.updatedAt = nowIso();
      }
      schedulePersist();
      renderShell();
    }

    return syncOutcome;
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
    const settings = {
      baseScore: x01Settings.baseScore,
      inMode: x01Settings.inMode,
      outMode: x01Settings.outMode,
      maxRounds: x01Settings.maxRounds,
      bullOffMode: x01Settings.bullOffMode,
      // API expects a valid bullMode even when bull-off is "Off".
      bullMode: sanitizeX01BullMode(x01Settings.bullMode),
    };
    return {
      variant: x01Settings.variant,
      isPrivate: true,
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


  function getApiMatchLegsFromStats(data) {
    return {
      p1: clampInt(data?.matchStats?.[0]?.legsWon, 0, 0, 50),
      p2: clampInt(data?.matchStats?.[1]?.legsWon, 0, 0, 50),
    };
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
    renderMatchReturnShortcut();
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
      const pdcPresetActive = draft.x01Preset === X01_PRESET_PDC_STANDARD;
      const presetStatusLabel = pdcPresetActive ? "Preset aktiv: PDC-Standard" : "Preset aktiv: Individuell";
      const pdcPresetHint = "PDC-Preset setzt 501, Straight In, Double Out, Bull-off Normal, Bull 25/50 und Max. Runden 50.";
      const bullModeDisabled = draft.x01BullOffMode === "Off";
      const bullModeDisabledAttr = bullModeDisabled ? "disabled" : "";
      const bullModeHiddenInput = bullModeDisabled
        ? `<input type="hidden" id="ata-x01-bullmode-hidden" name="x01BullMode" value="${escapeHtml(draft.x01BullMode)}">`
        : "";
      const createHeadingLinks = [
        { href: README_TOURNAMENT_CREATE_URL, label: "Erklärung zur Turniererstellung öffnen", title: "README: Turnier anlegen" },
        { href: README_RULES_URL, label: "Regelbasis und Limits öffnen", title: "README: Regelbasis und Limits" },
      ];
      const modeHelpLinks = renderInfoLinks([
        { href: README_TOURNAMENT_MODES_URL, label: "Erklärung der Modi öffnen", title: "README: Turniermodi" },
        { href: DRA_RULES_URL, label: "Offizielle DRA-Regeln öffnen", title: "DRA Rules (offiziell)" },
      ]);
      const drawHelpLinks = renderInfoLinks([
        { href: README_TOURNAMENT_MODES_URL, label: "Open Draw und gesetzter Draw erklärt", title: "README: KO-Modus" },
        { href: PDC_OPEN_DRAW_CONTEXT_URL, label: "PDC-Kontext zu Open Draw öffnen", title: "PDC: Open Draw Kontext" },
      ]);
      const modeLimitHelpLinks = renderInfoLinks([
        { href: README_RULES_URL, label: "Regelbasis und Limits öffnen", title: "README: Regelbasis und Limits" },
        { href: DRA_RULES_URL, label: "Offizielle DRA-Regeln öffnen", title: "DRA Rules (offiziell)" },
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
            <p class="ata-small">Bei Moduswechsel gelten die jeweiligen Grenzen sofort. Regelbasis und Begr\u00fcndung ${modeLimitHelpLinks}.</p>
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
    const primaryTags = [
      { text: `Best of ${tournament.bestOfLegs} Legs`, cls: "ata-info-tag ata-info-tag-key" },
      { text: `First to ${legsToWin} Legs`, cls: "ata-info-tag" },
      { text: `Startpunkte ${tournament.startScore}`, cls: "ata-info-tag" },
      ...(tournament.mode === "ko" ? [{ text: drawModeLabel, cls: "ata-info-tag ata-info-tag-accent" }] : []),
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
      { href: README_TOURNAMENT_MODES_URL, label: "Turniermodus-Erklärung öffnen", title: "README: Turniermodi" },
      { href: README_RULES_URL, label: "Regelbasis und Limits öffnen", title: "README: Regelbasis und Limits" },
    ];

    return `
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Aktives Turnier", activeTournamentHeadingLinks)}
        <p class="ata-tournament-title">
          <b>${escapeHtml(tournament.name)}</b>
          <span class="ata-tournament-mode-pill">${escapeHtml(modeLabel)}</span>
        </p>
        <div class="ata-tournament-meta">
          <div class="ata-meta-block">
            <div class="ata-meta-heading">Format</div>
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
        isBlockedPending ? "ata-row-blocked" : "",
        !editable ? "ata-row-inactive" : "",
      ].filter(Boolean).join(" ");
      const statusBadgeText = isByeCompletion ? "Freilos (Bye)" : (isCompleted ? "Abgeschlossen" : "Offen");
      const contextPillClass = isByeCompletion
        ? "ata-match-context-pill ata-match-context-bye"
        : (isCompleted ? "ata-match-context-pill ata-match-context-completed" : "ata-match-context-pill ata-match-context-open");
      const contextText = `${stageLabel}, ${matchCellText}, ${statusBadgeText}`;
      const summaryText = isCompleted
        ? (isByeCompletion ? `Weiter (Bye): ${winner}` : `Sieger: ${winner} (${match.legs.p1}:${match.legs.p2})`)
        : "";
      const advanceClasses = [
        "ata-match-advance-pill",
        isByeCompletion ? "ata-match-advance-bye" : "",
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
      const statusLineHtml = statusLine
        ? `<div class="ata-match-note">${escapeHtml(statusLine)}</div>`
        : "";

      return `
        <article class="${escapeHtml(rowClasses)}" data-match-id="${escapeHtml(match.id)}">
          <div class="ata-match-card-head">
            <div class="ata-match-title-row">
              <div class="ata-match-pairing">${player1PairingHtml} <span class="ata-vs">vs</span> ${player2PairingHtml}</div>
              <div class="ata-match-meta-inline">
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
      { href: README_API_AUTOMATION_URL, label: "Erklärung zur API-Halbautomatik öffnen", title: "README: API-Halbautomatik" },
      { href: README_TIE_BREAK_URL, label: "Erklärung zum Tie-Break und Playoff öffnen", title: "README: DRA Tie-Break" },
    ];
    const nextMatchHelpLinks = renderInfoLinks([
      { href: README_API_AUTOMATION_URL, label: "Ablauf der Ergebnisführung öffnen", title: "README: API-Halbautomatik und Ergebnisführung" },
      { href: README_TOURNAMENT_MODES_URL, label: "Turniermodus-Kontext öffnen", title: "README: Turniermodi" },
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
          { href: README_API_AUTOMATION_URL, label: "Voraussetzungen und Ablauf öffnen", title: "README: API-Halbautomatik" },
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
        { href: DRA_RULES_URL, label: "Offizielle DRA-Regeln öffnen", title: "DRA Rules (offiziell)" },
        { href: README_TIE_BREAK_URL, label: "Tie-Break-Erklärung öffnen", title: "README: DRA Tie-Break" },
      ]);
      html += renderLeagueSchedule(tournament);
    } else if (tournament.mode === "groups_ko") {
      const standingsMap = groupStandingsMap(tournament);
      const groupCards = [];
      const blockedGroups = [];
      standingsMap.forEach((entry) => {
        groupCards.push(renderStandingsTable(entry.rows, `Tabelle ${entry.group.name}`, [
          { href: DRA_RULES_URL, label: "Offizielle DRA-Regeln öffnen", title: "DRA Rules (offiziell)" },
          { href: README_TIE_BREAK_URL, label: "Tie-Break-Erklärung öffnen", title: "README: DRA Tie-Break" },
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
              { href: DRA_RULES_URL, label: "Offizielle DRA-Regeln öffnen", title: "DRA Rules (offiziell)" },
              { href: README_TIE_BREAK_URL, label: "Tie-Break-Erklärung öffnen", title: "README: DRA Tie-Break" },
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
          <h3>KO-Turnierbaum</h3>
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
    const modeLimitSummary = buildModeParticipantLimitSummary();
    const tieBreakMode = normalizeTieBreakMode(state.store?.tournament?.rules?.tieBreakMode, TIE_BREAK_MODE_DRA_STRICT);
    const tieBreakDisabledAttr = state.store?.tournament ? "" : "disabled";
    const apiSyncHelpLinks = renderInfoLinks([
      { href: README_API_AUTOMATION_URL, label: "Erklärung zur API-Halbautomatik öffnen", title: "README: API-Halbautomatik" },
    ]);
    const koDrawHelpLinks = renderInfoLinks([
      { href: README_TOURNAMENT_MODES_URL, label: "Erklärung zu Turniermodi öffnen", title: "README: Turniermodi und Open Draw" },
      { href: PDC_OPEN_DRAW_CONTEXT_URL, label: "PDC-Kontext zu Open Draw öffnen", title: "PDC: Open Draw Kontext" },
    ]);

    return `
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Debug und Feature-Flags", [
          { href: README_SETTINGS_URL, label: "Einstellungen-Dokumentation öffnen", title: "README: Einstellungen" },
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
            <div class="ata-small">Standard: AUS. Aktiviert Matchstart per Klick und automatische Ergebnisübernahme aus der Autodarts-API.</div>
          </div>
          <input type="checkbox" id="ata-setting-autolobby" data-action="toggle-autolobby" ${autoLobbyEnabled}>
        </div>
        <div class="ata-toggle">
          <div>
            <strong>KO-Erstrunde zufällig mischen (Standard) ${koDrawHelpLinks}</strong>
            <div class="ata-small">Standard: EIN. Neue KO-Turniere nutzen damit Open Draw (zufällige Reihenfolge, PDC-konforme Freilose).</div>
          </div>
          <input type="checkbox" id="ata-setting-randomize-ko" data-action="toggle-randomize-ko" ${randomizeKoEnabled}>
        </div>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("DRA Tie-Break", [
          { href: DRA_RULES_URL, label: "Offizielle DRA-Regeln öffnen", title: "DRA Rules (offiziell)" },
          { href: DRA_RULES_PDF_URL, label: "DRA-Regel-PDF öffnen", title: "DRA Rules PDF (offizieller Regeltext)" },
          { href: README_TIE_BREAK_URL, label: "Erklärung DRA Strict und Legacy öffnen", title: "README: DRA Tie-Break" },
        ])}
        <div class="ata-field">
          <label for="ata-setting-tiebreak">Regelmodus pro Turnier ${renderInfoLinks([
            { href: DRA_RULES_URL, label: "Offizielle Regelquelle öffnen", title: "DRA Rules: Tie-Break-Basis" },
          ])}</label>
          <select id="ata-setting-tiebreak" data-action="set-tiebreak-mode" ${tieBreakDisabledAttr}>
            <option value="${TIE_BREAK_MODE_DRA_STRICT}" ${tieBreakMode === TIE_BREAK_MODE_DRA_STRICT ? "selected" : ""}>DRA Strict (empfohlen)</option>
            <option value="${TIE_BREAK_MODE_LEGACY}" ${tieBreakMode === TIE_BREAK_MODE_LEGACY ? "selected" : ""}>Legacy</option>
          </select>
        </div>
        <p class="ata-small"><strong>DRA Strict:</strong> Punkte (2/1/0), danach Direktvergleich (2er-Gleichstand), Teilgruppen-Leg-Differenz (3+), Gesamt-Leg-Differenz, Legs gewonnen; verbleibender Gleichstand = „Playoff erforderlich“.</p>
        <p class="ata-small"><strong>Legacy:</strong> bisherige, vereinfachte Sortierung (Punkte, Gesamt-Leg-Differenz, Legs gewonnen). Dieser Modus ist für Rückwärtskompatibilität gedacht und nicht DRA-strict.</p>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Regelbasis und Limits", [
          { href: DRA_RULES_URL, label: "Offizielle DRA-Regeln öffnen", title: "DRA Rules (offiziell)" },
          { href: README_RULES_URL, label: "Projekt-Regelbasis und Limits öffnen", title: "README: Regelbasis und Limits" },
        ])}
        <p class="ata-small">Aktive Modus-Limits: ${escapeHtml(modeLimitSummary)}.</p>
        <p class="ata-small">Die DRA-Regeln setzen kein fixes globales Teilnehmermaximum. Die Grenzen oben sind bewusst für faire Turnierdauer und stabile Darstellung gesetzt.</p>
      </section>
      <section class="ata-card tournamentCard">
        ${renderSectionHeading("Storage", [
          { href: README_BASE_URL, label: "Hinweise zu Storage und Import öffnen", title: "README: Import, Migration und Persistenz" },
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
        if (isCreateDraftX01Field(fieldName)) {
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

    const tieBreakSelect = shadow.getElementById("ata-setting-tiebreak");
    if (tieBreakSelect instanceof HTMLSelectElement) {
      tieBreakSelect.addEventListener("change", () => {
        const result = setTournamentTieBreakMode(tieBreakSelect.value);
        if (!result.ok) {
          setNotice("error", result.message || "Tie-Break-Modus konnte nicht gesetzt werden.");
          return;
        }
        if (result.changed) {
          setNotice("success", "Tie-Break-Modus aktualisiert.", 1800);
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


  function isCreateDraftX01Field(fieldName) {
    return [
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
    const presetId = sanitizeX01Preset(presetInput.value, X01_PRESET_CUSTOM);
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
    const assignments = [
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
    setNotice("info", "PDC-Preset wurde auf die X01-Felder angewendet.", 2200);
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

    const normalizedTournament = normalizeTournament(tournament);
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

    const bracketSize = tournament.mode === "groups_ko" ? 4 : nextPowerOfTwo(tournament.participants.length);
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
      const byeResult = isByeMatchResult(match);
      const completed = isCompletedMatchResultValid(tournament, match)
        && Boolean(winnerId && (winnerId === player1Id || winnerId === player2Id));
      const status = completed ? 4 : (player1Id && player2Id ? 2 : 1);
      const opponent1 = player1Id
        ? {
            id: player1Id,
            score: completed && !byeResult ? clampInt(match.legs?.p1, 0, 0, 99) : undefined,
            result: completed && winnerId ? (winnerId === player1Id ? "win" : "loss") : undefined,
          }
        : null;
      const opponent2 = player2Id
        ? {
            id: player2Id,
            score: completed && !byeResult ? clampInt(match.legs?.p2, 0, 0, 99) : undefined,
            result: completed && winnerId ? (winnerId === player2Id ? "win" : "loss") : undefined,
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

    #ata-brackets-viewer .match {
      margin: 12px 0;
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
  }


  function ensureMatchReturnShortcutRoot() {
    if (state.matchReturnShortcut.root instanceof HTMLElement && document.body?.contains(state.matchReturnShortcut.root)) {
      return state.matchReturnShortcut.root;
    }
    const root = document.createElement("div");
    root.id = "ata-match-return-shortcut";
    root.style.position = "fixed";
    root.style.right = "18px";
    root.style.bottom = "18px";
    root.style.zIndex = "2147482990";
    root.style.minWidth = "280px";
    root.style.maxWidth = "340px";
    root.style.borderRadius = "10px";
    root.style.border = "1px solid rgba(255,255,255,0.25)";
    root.style.background = "linear-gradient(180deg, rgba(44,50,109,0.94), rgba(31,63,113,0.94))";
    root.style.color = "#f4f7ff";
    root.style.padding = "10px";
    root.style.boxShadow = "0 12px 24px rgba(7,11,25,0.45)";
    root.style.fontFamily = "\"Open Sans\", \"Segoe UI\", Tahoma, sans-serif";
    document.body.appendChild(root);
    state.matchReturnShortcut.root = root;
    return root;
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


  async function handleMatchShortcutSyncAndOpen(lobbyId) {
    const targetLobbyId = normalizeText(lobbyId || "");
    if (!targetLobbyId || state.matchReturnShortcut.syncing) {
      return;
    }
    state.matchReturnShortcut.syncing = true;
    renderMatchReturnShortcut();
    try {
      const syncOutcome = await syncResultForLobbyId(targetLobbyId, {
        notifyErrors: true,
        notifyNotReady: true,
      });
      openAssistantMatchesTab();
      if (syncOutcome.completed) {
        setNotice("success", "Ergebnis wurde in xLokale Turniere \u00fcbernommen.", 2400);
      } else if (!syncOutcome.ok && syncOutcome.message) {
        setNotice("info", syncOutcome.message, 3200);
      } else if (syncOutcome.ok && !syncOutcome.completed) {
        setNotice("info", "Noch kein finales Ergebnis verf\u00fcgbar. Match l\u00e4uft ggf. noch.", 2600);
      }
    } catch (error) {
      logWarn("api", "Manual shortcut sync failed.", error);
      setNotice("error", "Ergebnis\u00fcbernahme fehlgeschlagen. Bitte sp\u00e4ter erneut versuchen.");
    } finally {
      state.matchReturnShortcut.syncing = false;
      renderMatchReturnShortcut();
    }
  }


  function renderMatchReturnShortcut() {
    const lobbyId = getRouteLobbyId();
    if (!lobbyId) {
      removeMatchReturnShortcut();
      return;
    }

    const tournament = state.store.tournament;
    if (!tournament) {
      removeMatchReturnShortcut();
      return;
    }

    const linkedMatchAny = findTournamentMatchByLobbyId(tournament, lobbyId, true);
    if (!linkedMatchAny) {
      removeMatchReturnShortcut();
      return;
    }

    const linkedMatchOpen = linkedMatchAny.status === STATUS_PENDING ? linkedMatchAny : null;
    const auto = ensureMatchAutoMeta(linkedMatchAny);
    const root = ensureMatchReturnShortcutRoot();
    const isSyncing = state.matchReturnShortcut.syncing;
    const hasOpenMatch = Boolean(linkedMatchOpen);

    const statusText = linkedMatchAny.status === STATUS_COMPLETED
      ? "Ergebnis bereits im Turnier gespeichert."
      : auto.status === "error"
        ? `Letzter Sync-Fehler: ${normalizeText(auto.lastError || "Unbekannt") || "Unbekannt"}`
        : auto.status === "started"
          ? "Match verkn\u00fcpft. Ergebnis kann \u00fcbernommen werden."
          : "API-Sync wartet auf Match-Start.";

    const primaryLabel = hasOpenMatch
      ? (isSyncing ? "\u00dcbernehme..." : "Ergebnis \u00fcbernehmen & Turnier \u00f6ffnen")
      : "Turnierassistent \u00f6ffnen";

    const secondaryButtonHtml = hasOpenMatch
      ? `<button type="button" data-action="open-assistant" style="flex:1 1 auto;border:1px solid rgba(255,255,255,0.28);background:rgba(255,255,255,0.1);color:#f4f7ff;border-radius:8px;padding:8px 10px;font-size:13px;cursor:pointer;">Nur Turnierassistent</button>`
      : "";

    root.innerHTML = `
      <div style="font-size:13px;font-weight:700;letter-spacing:0.3px;margin-bottom:6px;">xLokale Turniere</div>
      <div style="font-size:12px;line-height:1.35;color:rgba(232,237,255,0.86);margin-bottom:8px;">${escapeHtml(statusText)}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" data-action="sync-open" style="flex:1 1 auto;border:1px solid rgba(90,210,153,0.55);background:rgba(90,210,153,0.24);color:#dcffe8;border-radius:8px;padding:8px 10px;font-size:13px;font-weight:700;cursor:pointer;" ${isSyncing ? "disabled" : ""}>${escapeHtml(primaryLabel)}</button>
        ${secondaryButtonHtml}
      </div>
    `;

    const syncButton = root.querySelector("[data-action='sync-open']");
    if (syncButton instanceof HTMLButtonElement) {
      if (hasOpenMatch) {
        syncButton.onclick = () => {
          handleMatchShortcutSyncAndOpen(lobbyId).catch((error) => {
            logWarn("api", "Shortcut action failed.", error);
          });
        };
      } else {
        syncButton.onclick = () => {
          openAssistantMatchesTab();
        };
      }
    }

    const openAssistantButton = root.querySelector("[data-action='open-assistant']");
    if (openAssistantButton instanceof HTMLButtonElement) {
      openAssistantButton.onclick = () => {
        openAssistantMatchesTab();
      };
    }
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
      const seededOpenRoundOne = seededRoundOne.filter((match) => match.player1Id && match.player2Id);
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
      const roundOne = openDrawMatches.filter((match) => match.round === 1);
      const slottedPlayers = roundOne.reduce((sum, match) => sum + (match.player1Id ? 1 : 0) + (match.player2Id ? 1 : 0), 0);
      record(
        "KO Open Draw: alle Teilnehmer korrekt in R1-Slots",
        slottedPlayers === participants.length,
        `R1-Slots belegt: ${slottedPlayers}/${participants.length}`,
      );
    } catch (error) {
      record("KO Open Draw: alle Teilnehmer korrekt in R1-Slots", false, String(error?.message || error));
    }

    try {
      const tournament = {
        id: "t1",
        name: "T1",
        mode: "league",
        ko: null,
        bestOfLegs: 3,
        startScore: 501,
        x01: buildPdcX01Settings(),
        rules: normalizeTournamentRules({ tieBreakMode: TIE_BREAK_MODE_DRA_STRICT }),
        participants: [
          { id: "A", name: "A" },
          { id: "B", name: "B" },
        ],
        groups: [],
        matches: [
          createMatch({
            id: "m1",
            stage: MATCH_STAGE_LEAGUE,
            round: 1,
            number: 1,
            player1Id: "A",
            player2Id: "B",
            status: STATUS_COMPLETED,
            winnerId: "A",
            legs: { p1: 2, p2: 1 },
          }),
        ],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const rows = standingsForMatches(tournament, tournament.matches);
      record(
        "DRA Strict: Direktvergleich bei 2 punktgleichen Spielern",
        rows[0]?.id === "A" && rows[0]?.tiebreakState === "resolved",
        rows.map((row) => `${row.id}:${row.points}/${row.tiebreakState}`).join(", "),
      );
    } catch (error) {
      record("DRA Strict: Direktvergleich bei 2 punktgleichen Spielern", false, String(error?.message || error));
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
        rules: normalizeTournamentRules({ tieBreakMode: TIE_BREAK_MODE_DRA_STRICT }),
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
        "DRA Strict: Deadlock -> Playoff erforderlich",
        blocked === 3,
        rows.map((row) => `${row.id}:${row.tiebreakState}`).join(", "),
      );
    } catch (error) {
      record("DRA Strict: Deadlock -> Playoff erforderlich", false, String(error?.message || error));
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
        "Migration: v2 -> v3 setzt Tie-Break-Regeln",
        migrated.schemaVersion === 3 && migrated.tournament?.rules?.tieBreakMode === TIE_BREAK_MODE_DRA_STRICT,
        `schema=${migrated.schemaVersion}, mode=${migrated.tournament?.rules?.tieBreakMode}`,
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
    renderMatchReturnShortcut();

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
      renderMatchReturnShortcut();
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

