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
if ($dist -match '__ATA_APP_VERSION__') {
  throw "Build discipline QA failed: unresolved __ATA_APP_VERSION__ placeholder found in dist."
}
if ($dist -notmatch "@version\s+$([regex]::Escape($appVersion))") {
  throw "Build discipline QA failed: dist userscript header version does not match build/version.json."
}
if ($dist -notmatch "const APP_VERSION = `"$([regex]::Escape($appVersion))`";") {
  throw "Build discipline QA failed: dist APP_VERSION does not match build/version.json."
}

Write-Host "Build discipline QA successful."
