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
      };
      if (!selfTestResult?.ok) {
        result.ok = false;
        result.failures.push(`Runtime-Selftests fehlgeschlagen (${selfTestResult?.failed || 0} Fehler).`);
      }
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

Write-Host "Runtime contract successful."
