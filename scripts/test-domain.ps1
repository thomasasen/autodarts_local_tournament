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

$manifestPath = Resolve-RepoPath "build/domain-test-manifest.json"
$manifest = Get-Content $manifestPath -Raw -Encoding utf8 | ConvertFrom-Json
$browserPath = Get-BrowserPath
$repoRoot = Resolve-RepoPath "."

$tempRoot = Join-Path $repoRoot ".tmp-domain-tests"
if (Test-Path $tempRoot) {
  Remove-Item $tempRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $tempRoot | Out-Null

$htmlPath = Join-Path $tempRoot "domain-tests.html"

$parts = New-Object System.Collections.Generic.List[string]
foreach ($relativeFile in $manifest.files) {
  $fullPath = Resolve-RepoPath $relativeFile
  $raw = Get-Content $fullPath -Raw -Encoding utf8
  $raw = $raw -replace '^\uFEFF', ''
  $raw = $raw -replace '^\s*// Auto-generated module split from dist source\.\r?\n', ''
  $parts.Add($raw.TrimEnd()) | Out-Null
}

foreach ($relativeFile in $manifest.tests) {
  $fullPath = Resolve-RepoPath $relativeFile
  $raw = Get-Content $fullPath -Raw -Encoding utf8
  $raw = $raw -replace '^\uFEFF', ''
  $parts.Add($raw.TrimEnd()) | Out-Null
}

$parts.Add(@'
  runRegisteredTests()
    .then((result) => {
      const json = JSON.stringify(result);
      document.body.innerHTML = `<pre id="ata-domain-test-result">${escapeHtml(json)}</pre>`;
      document.title = result.ok ? "PASS" : "FAIL";
    })
    .catch((error) => {
      const result = {
        ok: false,
        passed: 0,
        failed: 1,
        results: [{
          name: "Domain harness bootstrap",
          ok: false,
          details: normalizeText(error?.message || error),
        }],
        generatedAt: nowIso(),
      };
      document.body.innerHTML = `<pre id="ata-domain-test-result">${escapeHtml(JSON.stringify(result))}</pre>`;
      document.title = "FAIL";
    });
})();
'@) | Out-Null

$bundle = ($parts -join "`n`n") + "`n"
$bundleInline = $bundle -replace '</script>', '<\/script>'

$html = @"
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <title>ATA Domain Tests</title>
  </head>
  <body>
    <script>
$bundleInline
    </script>
  </body>
</html>
"@
Set-Content -Path $htmlPath -Value $html -Encoding utf8

$htmlUri = [System.Uri]::new((Resolve-Path $htmlPath).Path)
$domOutput = & $browserPath `
  --headless=new `
  --disable-gpu `
  --allow-file-access-from-files `
  --virtual-time-budget=6000 `
  --dump-dom `
  $htmlUri.AbsoluteUri 2>&1 | Out-String

if ($null -eq $domOutput) {
  throw "Headless-Browser lieferte keine DOM-Ausgabe."
}

$match = [regex]::Match([string]$domOutput, '<pre id="ata-domain-test-result">(?<json>.*?)</pre>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if (-not $match.Success) {
  throw "Domain-Test-Harness lieferte kein Ergebnis."
}

$json = [System.Net.WebUtility]::HtmlDecode($match.Groups["json"].Value)
$result = $json | ConvertFrom-Json

if (-not $result.ok) {
  $failed = @($result.results | Where-Object { -not $_.ok })
  foreach ($entry in $failed) {
    Write-Host ("FAIL: {0} -> {1}" -f $entry.name, $entry.details)
  }
  throw "Domain-Tests fehlgeschlagen."
}

Write-Host ("Domain tests successful: {0} passed." -f $result.passed)
