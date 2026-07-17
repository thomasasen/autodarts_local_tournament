param(
  [switch]$UpdateScreenshot,
  [switch]$UpdateGuideScreenshots,
  [switch]$KeepArtifacts
)

$ErrorActionPreference = "Stop"

function Resolve-RepoPath([string]$RelativePath) {
  $scriptDir = Split-Path -Parent $PSCommandPath
  $repoRoot = Split-Path -Parent $scriptDir
  return (Join-Path $repoRoot $RelativePath)
}

function Get-BrowserPath() {
  $candidates = @(
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Google\Chrome\Application\chrome.exe"
  )
  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }
  throw "Kein unterstützter Headless-Browser gefunden (Edge/Chrome)."
}

$repoRoot = Resolve-RepoPath "."
$tempRoot = Join-Path $repoRoot ".tmp-ui-viewports"
if (Test-Path $tempRoot) {
  Remove-Item -LiteralPath $tempRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $tempRoot | Out-Null

$framePath = Join-Path $tempRoot "viewport-frame.html"
$hostPath = Join-Path $tempRoot "viewport-host.html"

$frameHtml = @'
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ATA Viewport Frame</title>
  </head>
  <body>
    <script>
      try {
        [
          "ata:tournament:v1",
          "ata:tournament:ko-migration-backups:v2",
          "ata:update-status:v1",
        ].forEach((key) => window.localStorage.removeItem(key));
      } catch (error) {
        /* best effort test isolation */
      }
    </script>
    <script src="../dist/autodarts-tournament-assistant.user.js"></script>
    <script>
      (async function () {
        const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
        const frameId = decodeURIComponent(window.location.hash.slice(1));
        const failures = [];
        const stages = [];
        const selectors = [
          ".ata-root",
          ".ata-drawer",
          ".ata-content",
          ".ata-card",
          ".ata-create-form",
          ".ata-create-layout",
          ".ata-create-main",
          ".ata-create-side",
          ".ata-create-section",
          ".ata-create-overview",
          ".ata-create-help-panel",
          ".ata-create-error-summary",
          ".ata-match-card",
          ".ata-bracket-shell",
        ];
        const measureStage = (name, shadowRoot) => {
          const issues = [];
          if (document.documentElement.scrollWidth > window.innerWidth + 1) {
            issues.push(`document ${document.documentElement.scrollWidth}>${window.innerWidth}`);
          }
          selectors.forEach((selector) => {
            shadowRoot.querySelectorAll(selector).forEach((element, index) => {
              if (element.closest("[hidden], details:not([open])") || window.getComputedStyle(element).display === "none") return;
              const rect = element.getBoundingClientRect();
              if (element.scrollWidth > element.clientWidth + 1) {
                const offender = Array.from(element.querySelectorAll("*"))
                  .map((candidate) => ({ candidate, rect: candidate.getBoundingClientRect() }))
                  .filter((entry) => entry.rect.right > rect.right + 1 || entry.rect.left < rect.left - 1)
                  .sort((left, right) => (right.rect.right - rect.right) - (left.rect.right - rect.right))[0];
                const offenderLabel = offender
                  ? ` via ${offender.candidate.id ? `#${offender.candidate.id}` : offender.candidate.className || offender.candidate.tagName} ${Math.round(offender.rect.left)}..${Math.round(offender.rect.right)} parent ${Math.round(rect.left)}..${Math.round(rect.right)}`
                  : "";
                issues.push(`${selector}[${index}] scroll ${element.scrollWidth}>${element.clientWidth}${offenderLabel}`);
              }
              if (selector !== ".ata-root" && (rect.left < -1 || rect.right > window.innerWidth + 1)) {
                issues.push(`${selector}[${index}] rect ${Math.round(rect.left)}..${Math.round(rect.right)}`);
              }
            });
          });
          const drawer = shadowRoot.querySelector(".ata-drawer");
          if (drawer) {
            const rect = drawer.getBoundingClientRect();
            if (rect.height > window.innerHeight + 1 || rect.top < -1 || rect.bottom > window.innerHeight + 1) {
              issues.push(`drawer height ${Math.round(rect.top)}..${Math.round(rect.bottom)} of ${window.innerHeight}`);
            }
          }
          const ids = Array.from(shadowRoot.querySelectorAll("[id]")).map((element) => element.id);
          if (ids.length !== new Set(ids).size) {
            issues.push(`duplicate ids ${ids.length}/${new Set(ids).size}`);
          }
          const interactive = Array.from(shadowRoot.querySelectorAll("a[href], button, input:not([type='hidden']), select, textarea"))
            .filter((element) => !element.closest("[hidden], [aria-hidden='true']") && window.getComputedStyle(element).display !== "none");
          interactive.forEach((element) => {
            const nativeTextName = element.matches("a, button") && String(element.textContent || "").trim();
            const labelsName = (element.labels?.length || 0) > 0;
            const ariaName = String(element.getAttribute("aria-label") || element.getAttribute("aria-labelledby") || "").trim();
            if (!nativeTextName && !labelsName && !ariaName) {
              issues.push(`unnamed control ${element.id || element.getAttribute("data-action") || element.tagName}`);
            }
          });
          stages.push({ name, ok: issues.length === 0, issues });
          issues.forEach((issue) => failures.push(`${name}: ${issue}`));
        };

        try {
          let api = null;
          for (let attempt = 0; attempt < 100; attempt += 1) {
            api = window.__ATA_RUNTIME || null;
            if (api?.isReady?.()) break;
            await wait(50);
          }
          if (!api?.isReady?.()) throw new Error("Runtime API wurde nicht bereit.");
          api.openDrawer();
          await wait(0);
          const host = document.getElementById("ata-ui-host");
          const shadowRoot = host?.shadowRoot;
          if (!shadowRoot) throw new Error("Shadow Root fehlt.");
          const screenshotScenario = new URLSearchParams(window.location.search).get("screenshot") || "";
          const screenshotMode = Boolean(screenshotScenario);

          let form = shadowRoot.getElementById("ata-create-form");
          if (!(form instanceof HTMLFormElement)) throw new Error("Create-Formular fehlt.");
          const longNames = [
            "Alexandra-von-einem-sehr-langen-Ortsnamen-mit-Zusatz",
            "Benedikt Mit Einem Aussergewoehnlich Langen Doppelnamen",
            "CharlotteSupercalifragilisticexpialidociousOhneTrennzeichen",
            "Dominik aus der oertlichen Donnerstags-Dartliga",
            "Elisabeth-Marie Beispielspielerin",
            "Friedrich Wilhelm Langname",
            "Gabriele vom Nachbarverein",
            "Hannah Testperson Nummer Acht",
          ];
          const guideNames = [
            "Anna",
            "Ben",
            "Clara",
            "David",
            "Emma",
            "Felix",
            "Greta",
            "Hasan",
          ];
          const nameInput = form.querySelector("#ata-name");
          const participants = form.querySelector("#ata-participants");
          if (!(nameInput instanceof HTMLInputElement) || !(participants instanceof HTMLTextAreaElement)) {
            throw new Error("Pflichtfelder fehlen.");
          }
          nameInput.value = "Freitagsturnier des Dartvereins";
          nameInput.dispatchEvent(new Event("input", { bubbles: true }));
          participants.value = (screenshotMode ? guideNames : longNames).join("\n");
          participants.dispatchEvent(new Event("input", { bubbles: true }));
          measureStage("create", shadowRoot);

          if (screenshotMode) {
            const waitForRender = async () => await wait(80);
            const createTournament = async () => {
              shadowRoot.querySelector("#ata-create-form button[type='submit']")?.click();
              await waitForRender();
            };
            const openTab = async (tabId) => {
              shadowRoot.querySelector(`[data-tab='${tabId}']`)?.click();
              await waitForRender();
            };
            const scrollToHeading = (headingText) => {
              const content = shadowRoot.querySelector(".ata-content");
              const heading = Array.from(shadowRoot.querySelectorAll(".ata-content h3"))
                .find((candidate) => String(candidate.textContent || "").trim() === headingText);
              const section = heading?.closest("section");
              if (content instanceof HTMLElement && section instanceof HTMLElement) {
                content.scrollTo(0, Math.max(0, section.offsetTop - content.offsetTop - 10));
              }
            };
            const showOnlyStatusArea = () => {
              const statusBar = shadowRoot.querySelector(".ata-runtime-statusbar");
              const root = shadowRoot.querySelector(".ata-root");
              if (statusBar instanceof HTMLElement && root instanceof HTMLElement) {
                root.innerHTML = statusBar.outerHTML;
                root.style.display = "block";
                root.style.pointerEvents = "auto";
                root.style.width = "100vw";
                root.style.minHeight = "100vh";
                root.style.background = "#263b73";
                document.documentElement.style.background = "#263b73";
                document.body.style.background = "#263b73";
              }
            };
            const showFixedLegsGuide = (twoLegsFinished) => {
              host.style.setProperty("display", "none", "important");
              const assistantRoot = shadowRoot.querySelector(".ata-root");
              if (assistantRoot instanceof HTMLElement) assistantRoot.style.display = "none";
              let guide = document.getElementById("ata-fixed-legs-guide-fixture");
              if (!(guide instanceof HTMLElement)) {
                guide = document.createElement("main");
                guide.id = "ata-fixed-legs-guide-fixture";
                document.body.appendChild(guide);
              }
              const score = twoLegsFinished ? "1:1" : "1:0";
              const phase = twoLegsFinished ? "Zwei Legs beendet" : "Leg 1 beendet";
              const detail = twoLegsFinished
                ? "Pr&uuml;fe den Stand und beende das Match anschlie&szlig;end ausdr&uuml;cklich."
                : "Der Leg-Sieger wird gespeichert; Leg 2 startet erst nach deinem Klick.";
              const label = twoLegsFinished
                ? "Match abschlie&szlig;en &amp; Ergebnis &uuml;bernehmen"
                : "Leg 1 &uuml;bernehmen &amp; Leg 2 starten";
              guide.innerHTML = `<section style="width:min(760px,calc(100vw - 24px));margin:24px auto;padding:16px;border-radius:14px;border:1px solid rgba(120,203,255,.58);background:linear-gradient(180deg,rgba(43,62,126,.98),rgba(29,72,122,.98));color:#f4f7ff;box-shadow:0 14px 32px rgba(7,11,25,.32);font-family:system-ui,sans-serif;box-sizing:border-box;">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                  <div><div style="font-size:12px;font-weight:800;letter-spacing:.3px;color:#bfe7ff;">VORRUNDE &middot; ZWEI FESTE LEGS</div><h2 style="font-size:20px;line-height:1.3;margin:4px 0 0;">Anna vs Berta</h2></div>
                  <div style="font-size:28px;font-weight:900;min-width:64px;text-align:center;">${score}</div>
                </div>
                <p style="margin:13px 0 3px;font-size:16px;font-weight:800;">${phase}</p>
                <p style="margin:0 0 14px;font-size:14px;line-height:1.45;color:#deebff;">${detail}</p>
                <button type="button" style="display:block;width:100%;min-height:44px;border:1px solid rgba(99,231,173,.75);background:linear-gradient(180deg,rgba(83,221,163,.38),rgba(58,197,141,.38));color:#f2fff8;border-radius:10px;padding:11px 14px;font-size:14px;font-weight:850;">${label}</button>
                <div aria-live="polite" aria-atomic="true" style="min-height:18px;margin-top:0;font-size:12px;"></div>
              </section>`;
              document.documentElement.style.background = "#182b54";
              document.body.style.background = "#182b54";
              document.body.style.margin = "0";
            };

            if (screenshotScenario === "help") {
              form.querySelector("#ata-create-help-trigger-presetFormat")?.click();
              await waitForRender();
            } else if (screenshotScenario === "matches") {
              await createTournament();
            } else if (screenshotScenario === "automation-settings") {
              await openTab("settings");
              scrollToHeading("Turnierablauf und Automatik");
            } else if (screenshotScenario === "organizer-rules") {
              await createTournament();
              await openTab("settings");
              const organizerMarkup = Array.from(shadowRoot.querySelectorAll(".ata-content > section"))
                .slice(4, 7)
                .map((section) => section.outerHTML)
                .join("");
              const showOrganizerRulesArea = () => {
                const root = shadowRoot.querySelector(".ata-root");
                if (!(root instanceof HTMLElement) || !organizerMarkup) return;
                root.innerHTML = `<main class="ata-content" style="height:100vh;overflow:hidden;padding:20px;background:#263b73">${organizerMarkup}</main>`;
                root.style.display = "block";
                root.style.width = "100vw";
                root.style.minHeight = "100vh";
                root.style.background = "#263b73";
                document.documentElement.style.background = "#263b73";
                document.body.style.background = "#263b73";
              };
              showOrganizerRulesArea();
              window.setInterval(showOrganizerRulesArea, 50);
            } else if (screenshotScenario === "backup") {
              await createTournament();
              await openTab("io");
            } else if (screenshotScenario === "status-auto") {
              await openTab("settings");
              const autoToggle = shadowRoot.querySelector("#ata-setting-autolobby");
              if (autoToggle instanceof HTMLInputElement && !autoToggle.checked) autoToggle.click();
              await waitForRender();
              showOnlyStatusArea();
              window.setInterval(showOnlyStatusArea, 50);
            } else if (screenshotScenario === "status-manual") {
              showOnlyStatusArea();
              window.setInterval(showOnlyStatusArea, 50);
            } else if (screenshotScenario === "fixed-leg-1") {
              showFixedLegsGuide(false);
              window.setInterval(() => showFixedLegsGuide(false), 50);
            } else if (screenshotScenario === "fixed-two-legs") {
              showFixedLegsGuide(true);
              window.setInterval(() => showFixedLegsGuide(true), 50);
            }

            if (["create", "help", "matches", "backup"].includes(screenshotScenario)) {
              shadowRoot.querySelector(".ata-content")?.scrollTo(0, 0);
            }
            document.documentElement.setAttribute("data-ata-screenshot-ready", "1");
            document.title = "ATA Screenshot Ready";
            return;
          }

          const editorToggle = form.querySelector("#ata-game-rules-editor-toggle");
          editorToggle?.click();
          measureStage("game-rules", shadowRoot);

          const helpTrigger = form.querySelector("#ata-create-help-trigger-participants");
          helpTrigger?.click();
          measureStage("help", shadowRoot);
          form.querySelector("[data-action='close-create-help']")?.click();

          nameInput.value = "";
          nameInput.dispatchEvent(new Event("input", { bubbles: true }));
          const submit = form.querySelector("button[type='submit']");
          if (submit instanceof HTMLButtonElement) submit.disabled = false;
          form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
          measureStage("validation", shadowRoot);

          nameInput.value = `Viewport-Test ${frameId}`;
          nameInput.dispatchEvent(new Event("input", { bubbles: true }));
          form.querySelector("button[type='submit']")?.click();
          await wait(0);
          measureStage("active-tournament", shadowRoot);

          for (const tabId of ["matches", "view", "io", "settings"]) {
            const tab = shadowRoot.querySelector(`[data-tab='${tabId}']`);
            tab?.click();
            await wait(tabId === "view" ? 120 : 0);
            measureStage(tabId, shadowRoot);
          }

          const fixedLegsFixture = document.createElement("section");
          fixedLegsFixture.setAttribute("data-ata-fixed-legs-live-viewport", "1");
          fixedLegsFixture.style.cssText = "box-sizing:border-box;width:min(760px,calc(100vw - 24px));margin:12px auto;padding:14px;border:1px solid #6bc9ff;border-radius:12px;background:#24447d;color:white;font-family:system-ui,sans-serif;";
          fixedLegsFixture.innerHTML = `<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><strong>Anna vs Berta</strong><strong>1:0</strong></div><p style="overflow-wrap:anywhere">Leg 1 beendet &middot; Der Leg-Sieger wird gespeichert.</p><button style="box-sizing:border-box;width:100%;min-height:44px;padding:10px;white-space:normal">Leg 1 &uuml;bernehmen &amp; Leg 2 starten</button><div aria-live="polite" aria-atomic="true"></div>`;
          document.body.appendChild(fixedLegsFixture);
          const fixedIssues = [];
          const fixedRect = fixedLegsFixture.getBoundingClientRect();
          const fixedButton = fixedLegsFixture.querySelector("button");
          const fixedButtonRect = fixedButton?.getBoundingClientRect();
          if (fixedLegsFixture.scrollWidth > fixedLegsFixture.clientWidth + 1 || fixedRect.left < -1 || fixedRect.right > window.innerWidth + 1) {
            fixedIssues.push(`fixed live overflow ${fixedLegsFixture.scrollWidth}/${fixedLegsFixture.clientWidth}, rect ${Math.round(fixedRect.left)}..${Math.round(fixedRect.right)}`);
          }
          if (!fixedButtonRect || fixedButtonRect.height < 43.5) fixedIssues.push(`fixed live target ${Math.round(fixedButtonRect?.height || 0)}px`);
          if (fixedLegsFixture.querySelectorAll("[aria-live='polite'][aria-atomic='true']").length !== 1) fixedIssues.push("fixed live region invalid");
          stages.push({ name: "fixed-legs-live", ok: fixedIssues.length === 0, issues: fixedIssues });
          fixedIssues.forEach((issue) => failures.push(`fixed-legs-live: ${issue}`));

          const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
          if (coarsePointer) {
            const targetSelectors = ".ata-close-btn, .ata-tab, .ata-btn, .ata-help-link, .ata-help-trigger, .ata-segmented-btn, .ata-toggle input[type='checkbox']";
            shadowRoot.querySelectorAll(targetSelectors).forEach((element) => {
              if (element.closest("[hidden], details:not([open])") || window.getComputedStyle(element).display === "none") return;
              const rect = element.getBoundingClientRect();
              if (rect.width < 43.5 || rect.height < 43.5) {
                failures.push(`touch-target: ${element.className || element.id} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
              }
            });
          }
          fixedLegsFixture.remove();

          window.parent.postMessage({
            type: "ata-viewport-result",
            frameId,
            ok: failures.length === 0,
            failures,
            stages,
            metrics: {
              innerWidth: window.innerWidth,
              innerHeight: window.innerHeight,
              devicePixelRatio: window.devicePixelRatio,
              coarsePointer,
            },
          }, "*");
        } catch (error) {
          window.parent.postMessage({
            type: "ata-viewport-result",
            frameId,
            ok: false,
            failures: [String(error?.message || error)],
            stages,
          }, "*");
        }
      })();
    </script>
  </body>
</html>
'@

$hostHtml = @'
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <title>ATA Viewport Matrix</title>
  </head>
  <body>
    <div id="frames"></div>
    <script>
      (function () {
        const viewports = [
          { id: "1920x1080", width: 1920, height: 1080 },
          { id: "1366x768", width: 1366, height: 768 },
          { id: "1024x768", width: 1024, height: 768 },
          { id: "768x1024", width: 768, height: 1024 },
          { id: "800x360", width: 800, height: 360 },
          { id: "430x932", width: 430, height: 932 },
          { id: "390x844", width: 390, height: 844 },
          { id: "360x800", width: 360, height: 800 },
          { id: "320x800", width: 320, height: 800 },
          { id: "1024x600", width: 1024, height: 600 },
          { id: "1366x600", width: 1366, height: 600 },
          { id: "1366x768@200%-reflow", width: 683, height: 384 },
        ];
        const results = [];
        const resultById = new Set();
        const finish = () => {
          const failures = results.flatMap((entry) => entry.failures.map((failure) => `${entry.frameId}: ${failure}`));
          const result = {
            ok: results.length === viewports.length && failures.length === 0,
            expected: viewports.length,
            received: results.length,
            failures,
            results,
          };
          document.body.innerHTML = `<pre id="ata-viewport-result">${JSON.stringify(result)}</pre>`;
          document.title = result.ok ? "PASS" : "FAIL";
        };
        window.addEventListener("message", (event) => {
          if (event.data?.type !== "ata-viewport-result" || resultById.has(event.data.frameId)) return;
          resultById.add(event.data.frameId);
          results.push(event.data);
          if (results.length === viewports.length) finish();
        });
        const host = document.getElementById("frames");
        viewports.forEach((viewport) => {
          const iframe = document.createElement("iframe");
          iframe.src = `viewport-frame.html#${encodeURIComponent(viewport.id)}`;
          iframe.width = String(viewport.width);
          iframe.height = String(viewport.height);
          iframe.title = viewport.id;
          iframe.style.display = "block";
          host.appendChild(iframe);
        });
        window.setTimeout(finish, 14000);
      })();
    </script>
  </body>
</html>
'@

Set-Content -LiteralPath $framePath -Value $frameHtml -Encoding utf8
Set-Content -LiteralPath $hostPath -Value $hostHtml -Encoding utf8

$browserPath = Get-BrowserPath
$hostUri = [System.Uri]::new((Resolve-Path $hostPath).Path)
$stdoutPath = Join-Path $tempRoot "viewport.stdout.txt"
$stderrPath = Join-Path $tempRoot "viewport.stderr.txt"
$arguments = @(
  "--headless=new",
  "--disable-gpu",
  "--allow-file-access-from-files",
  "--touch-events=enabled",
  "--blink-settings=primaryPointerType=2,availablePointerTypes=2,primaryHoverType=1,availableHoverTypes=1",
  "--force-device-scale-factor=1",
  "--window-size=2000,1200",
  "--virtual-time-budget=16000",
  "--dump-dom",
  $hostUri.AbsoluteUri
)
$process = Start-Process -FilePath $browserPath `
  -ArgumentList $arguments `
  -RedirectStandardOutput $stdoutPath `
  -RedirectStandardError $stderrPath `
  -PassThru `
  -Wait `
  -NoNewWindow

$domOutput = Get-Content -LiteralPath $stdoutPath -Raw -Encoding utf8
$match = [regex]::Match([string]$domOutput, '<pre id="ata-viewport-result">(?<json>.*?)</pre>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if (-not $match.Success) {
  throw "Viewport-Test lieferte kein Ergebnis."
}

$json = [System.Net.WebUtility]::HtmlDecode($match.Groups["json"].Value)
$result = $json | ConvertFrom-Json
if (-not $result.ok) {
  foreach ($failure in $result.failures) {
    Write-Host "FAIL: $failure"
  }
  throw "Viewport-Test fehlgeschlagen ($($result.received)/$($result.expected) Ergebnisse)."
}

$coarseCount = @($result.results | Where-Object { $_.metrics.coarsePointer }).Count
Write-Host "UI viewport matrix successful ($($result.received) viewports, $coarseCount coarse-pointer contexts)."

if ($UpdateScreenshot) {
  $screenshotPath = Resolve-RepoPath "assets/ss_Turnier_anlage-neu.png"
  $frameUri = [System.Uri]::new((Resolve-Path $framePath).Path)
  $screenshotStdoutPath = Join-Path $tempRoot "screenshot.stdout.txt"
  $screenshotStderrPath = Join-Path $tempRoot "screenshot.stderr.txt"
  $screenshotArguments = @(
    "--headless=new",
    "--disable-gpu",
    "--allow-file-access-from-files",
    "--force-device-scale-factor=1",
    "--window-size=1366,768",
    "--virtual-time-budget=4000",
    "--screenshot=$screenshotPath",
    "$($frameUri.AbsoluteUri)?screenshot=create#1366x768"
  )
  Start-Process -FilePath $browserPath `
    -ArgumentList $screenshotArguments `
    -RedirectStandardOutput $screenshotStdoutPath `
    -RedirectStandardError $screenshotStderrPath `
    -PassThru `
    -Wait `
    -NoNewWindow | Out-Null
  if (-not (Test-Path -LiteralPath $screenshotPath)) {
    throw "Screenshot wurde nicht erzeugt."
  }
  Write-Host "Screenshot updated: assets/ss_Turnier_anlage-neu.png"
}

if ($UpdateGuideScreenshots) {
  $frameUri = [System.Uri]::new((Resolve-Path $framePath).Path)
  $guideScreenshots = @(
    @{ Scenario = "help"; FileName = "gui-kontexthilfe-formatvorlage.png"; Width = 1366; Height = 768 },
    @{ Scenario = "matches"; FileName = "gui-ergebnisfuehrung-manuell.png"; Width = 1366; Height = 768 },
    @{ Scenario = "automation-settings"; FileName = "gui-einstellungen-automatik.png"; Width = 1366; Height = 768 },
    @{ Scenario = "organizer-rules"; FileName = "gui-einstellungen-turnierregeln.png"; Width = 1366; Height = 768 },
    @{ Scenario = "backup"; FileName = "gui-sicherung-wiederherstellen.png"; Width = 1366; Height = 768 },
    @{ Scenario = "status-manual"; FileName = "gui-status-manuell.png"; Width = 1100; Height = 58 },
    @{ Scenario = "status-auto"; FileName = "gui-status-automatik.png"; Width = 1100; Height = 58 },
    @{ Scenario = "fixed-leg-1"; FileName = "gui-vorrunde-fixed-legs.png"; Width = 900; Height = 300 },
    @{ Scenario = "fixed-two-legs"; FileName = "gui-vorrunde-zwei-legs.png"; Width = 900; Height = 300 }
  )

  foreach ($entry in $guideScreenshots) {
    $screenshotPath = Resolve-RepoPath (Join-Path "assets" $entry.FileName)
    $safeScenario = [System.Uri]::EscapeDataString($entry.Scenario)
    $stdoutPath = Join-Path $tempRoot ("guide-{0}.stdout.txt" -f $entry.Scenario)
    $stderrPath = Join-Path $tempRoot ("guide-{0}.stderr.txt" -f $entry.Scenario)
    $arguments = @(
      "--headless=new",
      "--disable-gpu",
      "--allow-file-access-from-files",
      "--force-device-scale-factor=1",
      "--window-size=$($entry.Width),$($entry.Height)",
      "--virtual-time-budget=5000",
      "--screenshot=$screenshotPath",
      "$($frameUri.AbsoluteUri)?screenshot=$safeScenario#$($entry.Width)x$($entry.Height)"
    )
    Start-Process -FilePath $browserPath `
      -ArgumentList $arguments `
      -RedirectStandardOutput $stdoutPath `
      -RedirectStandardError $stderrPath `
      -PassThru `
      -Wait `
      -NoNewWindow | Out-Null
    if (-not (Test-Path -LiteralPath $screenshotPath) -or (Get-Item -LiteralPath $screenshotPath).Length -lt 1024) {
      throw "Guide-Screenshot wurde nicht erzeugt: $($entry.FileName)"
    }
    Write-Host "Guide screenshot updated: assets/$($entry.FileName)"
  }
}

if (-not $KeepArtifacts) {
  Remove-Item -LiteralPath $tempRoot -Recurse -Force
}
