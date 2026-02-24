// Auto-generated module split from dist source.
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


