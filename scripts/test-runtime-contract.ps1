param()

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
$tempRoot = Join-Path $repoRoot ".tmp-runtime-contract"
if (Test-Path $tempRoot) {
  Remove-Item $tempRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $tempRoot | Out-Null

$distPath = Resolve-RepoPath "dist/autodarts-tournament-assistant.user.js"
$runtimeContractPath = Resolve-RepoPath "tests/contracts/runtime-api-contract.js"
$globalsContractPath = Resolve-RepoPath "tests/contracts/globals-contract.js"
$htmlPath = Join-Path $tempRoot "runtime-contract.html"

$dist = Get-Content $distPath -Raw -Encoding utf8
$runtimeContract = Get-Content $runtimeContractPath -Raw -Encoding utf8
$globalsContract = Get-Content $globalsContractPath -Raw -Encoding utf8

$distInline = ($dist -replace '^\uFEFF', '') -replace '</script>', '<\/script>'
$runtimeContract = ($runtimeContract -replace '^\uFEFF', '') -replace '</script>', '<\/script>'
$globalsContract = ($globalsContract -replace '^\uFEFF', '') -replace '</script>', '<\/script>'

$checkScript = @'
(async function () {
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const normalizeContractText = (value) => String(value || "").replace(/\s+/g, " ").trim();
  let api = null;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    api = window[RUNTIME_API_CONTRACT.globalKey] || null;
    if (api && typeof api.isReady === "function" && api.isReady()) {
      break;
    }
    await wait(50);
  }

  const result = {
    ok: true,
    failures: [],
    runtimeKeys: api ? Object.keys(api).sort() : [],
    ataGlobals: Object.keys(window).filter((key) => key.startsWith("__ATA_")).sort(),
    selfTests: null,
  };

  if (!api) {
    result.ok = false;
    result.failures.push("Runtime API wurde nicht initialisiert.");
  } else {
    for (const key of RUNTIME_API_CONTRACT.requiredKeys) {
      if (!(key in api)) {
        result.ok = false;
        result.failures.push(`Runtime API Key fehlt: ${key}`);
      }
    }

    for (const key of RUNTIME_API_CONTRACT.functionKeys) {
      if (typeof api[key] !== "function") {
        result.ok = false;
        result.failures.push(`Runtime API Funktion fehlt: ${key}`);
      }
    }

    if (typeof api.runSelfTests === "function") {
      const selfTestResult = api.runSelfTests();
      result.selfTests = {
        ok: Boolean(selfTestResult?.ok),
        passed: Number(selfTestResult?.passed || 0),
        failed: Number(selfTestResult?.failed || 0),
        failures: Array.isArray(selfTestResult?.results)
          ? selfTestResult.results.filter((entry) => !entry?.ok).map((entry) => ({
            name: String(entry?.name || ""),
            details: String(entry?.details || ""),
          }))
          : [],
      };
      if (!selfTestResult?.ok) {
        result.ok = false;
        const failedDetails = result.selfTests.failures
          .map((entry) => `${entry.name}: ${entry.details}`)
          .join(" | ");
        result.failures.push(`Runtime-Selftests fehlgeschlagen (${selfTestResult?.failed || 0} Fehler): ${failedDetails}`);
      }
    }
  }

  const createUiContract = RUNTIME_API_CONTRACT.createUi;
  if (api && createUiContract) {
    api.openDrawer();
    await wait(0);
    const host = document.getElementById(createUiContract.hostId);
    const shadowRoot = host?.shadowRoot || null;
    const createForm = shadowRoot?.querySelector(createUiContract.formSelector) || null;
    const sectionOrder = createForm
      ? Array.from(createForm.querySelectorAll(createUiContract.sectionSelector))
        .map((section) => section.getAttribute("data-create-section"))
      : [];
    const styleText = normalizeContractText(shadowRoot?.querySelector("style")?.textContent || "");
    const missingSelectors = createForm
      ? createUiContract.requiredSelectors.filter((selector) => createForm.querySelectorAll(selector).length !== 1)
      : Array.from(createUiContract.requiredSelectors);
    const presentForbiddenSelectors = createForm
      ? createUiContract.forbiddenSelectors.filter((selector) => createForm.querySelector(selector))
      : [];
    const presentForbiddenStyles = createUiContract.forbiddenStyleFragments
      .filter((fragment) => styleText.includes(fragment));
    const missingRequiredStyles = createUiContract.requiredStyleFragments
      .filter((fragment) => !styleText.includes(fragment));
    const fixedSummary = createForm?.querySelector("[data-role='fixed-match-setup']") || null;
    const fixedSummaryText = normalizeContractText(fixedSummary?.textContent || "");
    const fixedSummaryOk = Boolean(fixedSummary)
      && fixedSummary.querySelector("input, select, textarea, button") === null
      && fixedSummaryText.includes("X01")
      && fixedSummaryText.includes("Legs")
      && fixedSummaryText.includes("Private Lobby");
    const presetFieldset = createForm?.querySelector("fieldset[data-role='preset-selection']") || null;
    const presetRadios = createForm
      ? Array.from(createForm.querySelectorAll("input[name='x01Preset']"))
      : [];
    const presetMarkupOk = Boolean(presetFieldset)
      && presetFieldset.tagName === "FIELDSET"
      && normalizeContractText(presetFieldset.querySelector("legend")?.textContent).startsWith("Turnierformat ausw\u00e4hlen")
      && presetRadios.length === 3
      && presetRadios.every((radio) => radio.type === "radio"
        && radio.labels?.length === 1
        && Boolean(radio.getAttribute("aria-describedby"))
        && Boolean(createForm.querySelector(`#${radio.getAttribute("aria-describedby")}`)))
      && presetRadios.filter((radio) => radio.checked).length === 1
      && new FormData(createForm).get("x01Preset") === presetRadios.find((radio) => radio.checked)?.value;
    const sectionOrderOk = JSON.stringify(sectionOrder) === JSON.stringify(createUiContract.sectionOrder);
    const helpPanel = createForm?.querySelector("#ata-create-help-panel") || null;
    const overview = createForm?.querySelector("#ata-create-overview") || null;
    const helpTriggers = createForm
      ? Array.from(createForm.querySelectorAll("button[data-action='open-create-help'][data-help-topic]"))
      : [];
    const helpIds = helpTriggers.map((trigger) => trigger.id);
    const helpInitialOk = Boolean(helpPanel)
      && helpPanel.hidden
      && Boolean(overview)
      && !overview.hidden
      && helpTriggers.length >= 9
      && new Set(helpIds).size === helpIds.length
      && helpTriggers.every((trigger) => normalizeContractText(trigger.textContent) === "?"
        && trigger.getAttribute("aria-controls") === "ata-create-help-panel"
        && trigger.getAttribute("aria-expanded") === "false")
      && createForm.querySelector(".ata-help-links") === null;
    const createSubmitButton = createForm?.querySelector("button[type='submit']") || null;
    const participantStatus = createForm?.querySelector("#ata-create-participant-status") || null;
    const validationOverview = createForm?.querySelector("#ata-create-overview-summary") || null;
    const validationSummary = createForm?.querySelector("#ata-create-error-summary") || null;
    const validationInitialOk = Boolean(createSubmitButton)
      && createSubmitButton.disabled
      && createSubmitButton.getAttribute("aria-disabled") === "true"
      && participantStatus?.getAttribute("role") === "status"
      && participantStatus?.getAttribute("aria-live") === "polite"
      && validationOverview?.getAttribute("role") === "status"
      && validationOverview?.getAttribute("aria-live") === "polite"
      && normalizeContractText(validationOverview?.textContent || "").includes("Noch nicht bereit")
      && Boolean(validationSummary?.hidden)
      && createForm.querySelector("[role='alert']") === null;
    const modeHelpTrigger = createForm?.querySelector("#ata-create-help-trigger-tournamentMode") || null;
    modeHelpTrigger?.click();
    const helpTitle = helpPanel?.querySelector("#ata-create-help-title") || null;
    const helpOpenOk = Boolean(helpInitialOk)
      && Boolean(helpPanel)
      && !helpPanel.hidden
      && Boolean(overview)
      && overview.hidden
      && modeHelpTrigger?.getAttribute("aria-expanded") === "true"
      && shadowRoot?.activeElement === helpTitle
      && helpPanel.querySelectorAll("a[target='_blank'][rel~='noopener'][rel~='noreferrer']").length >= 1;
    const helpClose = helpPanel?.querySelector("[data-action='close-create-help']") || null;
    helpClose?.click();
    const helpCloseOk = Boolean(helpOpenOk)
      && helpPanel.hidden
      && !overview.hidden
      && modeHelpTrigger?.getAttribute("aria-expanded") === "false"
      && shadowRoot?.activeElement === modeHelpTrigger;

    result.createUi = {
      sectionOrder,
      missingSelectors,
      presentForbiddenSelectors,
      presentForbiddenStyles,
      missingRequiredStyles,
      fixedSummaryOk,
      presetMarkupOk,
      helpInitialOk,
      helpOpenOk,
      helpCloseOk,
      validationInitialOk,
      presetMarkupDetails: {
        fieldsetTag: presetFieldset?.tagName || "",
        legend: normalizeContractText(presetFieldset?.querySelector("legend")?.textContent || ""),
        radioCount: presetRadios.length,
        radioTypes: presetRadios.map((radio) => radio.type),
        labelCounts: presetRadios.map((radio) => radio.labels?.length || 0),
        descriptions: presetRadios.map((radio) => radio.getAttribute("aria-describedby") || ""),
        descriptionMatches: presetRadios.map((radio) => Boolean(createForm?.querySelector(`#${radio.getAttribute("aria-describedby")}`))),
        checkedCount: presetRadios.filter((radio) => radio.checked).length,
      },
    };
    if (!createForm) {
      result.ok = false;
      result.failures.push("Create-UI-Formular wurde nicht gerendert.");
    }
    if (!sectionOrderOk) {
      result.ok = false;
      result.failures.push(`Create-UI-Bereichsreihenfolge ungültig: ${sectionOrder.join("/")}.`);
    }
    if (missingSelectors.length) {
      result.ok = false;
      result.failures.push(`Create-UI-Selektoren fehlen oder sind doppelt: ${missingSelectors.join(", ")}.`);
    }
    if (presentForbiddenSelectors.length) {
      result.ok = false;
      result.failures.push(`Veraltete Fake-Felder vorhanden: ${presentForbiddenSelectors.join(", ")}.`);
    }
    if (presentForbiddenStyles.length) {
      result.ok = false;
      result.failures.push(`Nicht interaktive Card-Hover-Stile vorhanden: ${presentForbiddenStyles.join(", ")}.`);
    }
    if (missingRequiredStyles.length) {
      result.ok = false;
      result.failures.push(`Responsive Create-UI-Stile fehlen: ${missingRequiredStyles.join(", ")}.`);
    }
    if (!fixedSummaryOk) {
      result.ok = false;
      result.failures.push("Kompakte Zusammenfassung für X01, Legs und private Lobby fehlt oder enthält Formfelder.");
    }
    if (!presetMarkupOk) {
      result.ok = false;
      result.failures.push("Zugängliche Preset-Radio-Gruppe mit genau einer Auswahl und zugeordneten Beschreibungen fehlt.");
    }
    if (!helpInitialOk || !helpOpenOk || !helpCloseOk) {
      result.ok = false;
      result.failures.push(`Kontext-Regelhilfe verletzt Initial-, Öffnen- oder Schließen-Vertrag: initial=${helpInitialOk}, open=${helpOpenOk}, close=${helpCloseOk}.`);
    }
    if (!validationInitialOk) {
      result.ok = false;
      result.failures.push("Live-Validierung verletzt Initial-, Status- oder Disabled-Vertrag.");
    }
  }

  for (const key of GLOBALS_CONTRACT.requiredKeys) {
    if (!(key in window)) {
      result.ok = false;
      result.failures.push(`Global fehlt: ${key}`);
    }
  }

  for (const key of GLOBALS_CONTRACT.forbiddenNewAtaGlobals) {
    if (key in window) {
      result.ok = false;
      result.failures.push(`Unerwartetes ATA-Global gefunden: ${key}`);
    }
  }

  document.body.innerHTML = `<pre id="ata-runtime-contract-result">${JSON.stringify(result)}</pre>`;
  document.title = result.ok ? "PASS" : "FAIL";
})();
'@

$html = @"
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <title>ATA Runtime Contract</title>
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
    <script>
$runtimeContract
$globalsContract
$distInline
$checkScript
    </script>
  </body>
</html>
"@

Set-Content -Path $htmlPath -Value $html -Encoding utf8

$browserPath = Get-BrowserPath
$htmlUri = [System.Uri]::new((Resolve-Path $htmlPath).Path)
$stdoutPath = Join-Path $tempRoot "runtime-contract.stdout.txt"
$stderrPath = Join-Path $tempRoot "runtime-contract.stderr.txt"
$arguments = @(
  "--headless=new",
  "--disable-gpu",
  "--allow-file-access-from-files",
  "--virtual-time-budget=8000",
  "--dump-dom",
  $htmlUri.AbsoluteUri
)
$process = Start-Process -FilePath $browserPath `
  -ArgumentList $arguments `
  -RedirectStandardOutput $stdoutPath `
  -RedirectStandardError $stderrPath `
  -PassThru `
  -Wait `
  -NoNewWindow

$domOutput = Get-Content $stdoutPath -Raw -Encoding utf8

$match = [regex]::Match([string]$domOutput, '<pre id="ata-runtime-contract-result">(?<json>.*?)</pre>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if (-not $match.Success) {
  throw "Runtime-Contract-Test lieferte kein Ergebnis."
}

$json = [System.Net.WebUtility]::HtmlDecode($match.Groups["json"].Value)
$result = $json | ConvertFrom-Json
if (-not $result.ok) {
  foreach ($failure in $result.failures) {
    Write-Host "FAIL: $failure"
  }
  throw "Runtime-Contract-Test fehlgeschlagen."
}

Write-Host "Runtime contract successful ($($result.selfTests.passed) Runtime-Selftests)."
Remove-Item -LiteralPath $tempRoot -Recurse -Force
