param()

$ErrorActionPreference = "Stop"

function Resolve-RepoPath([string]$RelativePath) {
  $scriptDir = Split-Path -Parent $PSCommandPath
  $repoRoot = Split-Path -Parent $scriptDir
  return (Join-Path $repoRoot $RelativePath)
}

$versionPath = Resolve-RepoPath "build/version.json"
$constantsPath = Resolve-RepoPath "src/core/constants.js"
$distPath = Resolve-RepoPath "dist/autodarts-tournament-assistant.user.js"
$metaPath = Resolve-RepoPath "dist/autodarts-tournament-assistant.meta.js"

$versionConfig = Get-Content $versionPath -Raw -Encoding utf8 | ConvertFrom-Json
$appVersion = [string]$versionConfig.appVersion
if (-not $appVersion) {
  throw "Build discipline QA failed: appVersion missing in build/version.json."
}

$constants = Get-Content $constantsPath -Raw -Encoding utf8
if ($constants -notmatch '__ATA_APP_VERSION__') {
  throw "Build discipline QA failed: src/core/constants.js must use __ATA_APP_VERSION__ placeholder."
}

$dist = Get-Content $distPath -Raw -Encoding utf8
$meta = Get-Content $metaPath -Raw -Encoding utf8
if ($dist -match '__ATA_APP_VERSION__') {
  throw "Build discipline QA failed: unresolved __ATA_APP_VERSION__ placeholder found in dist."
}
if ($dist -notmatch "@version\s+$([regex]::Escape($appVersion))") {
  throw "Build discipline QA failed: dist userscript header version does not match build/version.json."
}
if ($dist -notmatch "const APP_VERSION = `"$([regex]::Escape($appVersion))`";") {
  throw "Build discipline QA failed: dist APP_VERSION does not match build/version.json."
}
if ($meta -match '__ATA_APP_VERSION__') {
  throw "Build discipline QA failed: unresolved __ATA_APP_VERSION__ placeholder found in meta."
}
if ($meta -notmatch "@version\s+$([regex]::Escape($appVersion))") {
  throw "Build discipline QA failed: meta userscript header version does not match build/version.json."
}
if ($meta -notmatch "@updateURL\s+https://raw\.githubusercontent\.com/thomasasen/autodarts_local_tournament/main/dist/autodarts-tournament-assistant\.meta\.js") {
  throw "Build discipline QA failed: meta updateURL is not pointing to dist/autodarts-tournament-assistant.meta.js."
}

Write-Host "Build discipline QA successful."
