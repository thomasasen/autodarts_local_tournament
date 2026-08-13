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
$loaderPath = Resolve-RepoPath "installer/Autodarts Tournament Assistant Loader.user.js"
$readmePath = Resolve-RepoPath "README.md"
$changelogPath = Resolve-RepoPath "docs/changelog.md"

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
$loader = Get-Content $loaderPath -Raw -Encoding utf8
$readme = Get-Content $readmePath -Raw -Encoding utf8
$changelog = Get-Content $changelogPath -Raw -Encoding utf8
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
foreach ($artifact in @(
    @{ Name = "dist userscript"; Content = $dist },
    @{ Name = "dist meta"; Content = $meta },
    @{ Name = "loader"; Content = $loader }
  )) {
  if ($artifact.Content -notmatch '(?m)^// @match\s+\*://play\.autodarts\.com/\*$') {
    throw "Build discipline QA failed: $($artifact.Name) does not match play.autodarts.com."
  }
  if ($artifact.Content -notmatch '(?m)^// @match\s+\*://play\.autodarts\.io/\*$') {
    throw "Build discipline QA failed: $($artifact.Name) is missing the transitional play.autodarts.io match."
  }
}
foreach ($artifact in @(
    @{ Name = "dist userscript"; Content = $dist },
    @{ Name = "dist meta"; Content = $meta },
    @{ Name = "loader"; Content = $loader }
  )) {
  if ($artifact.Content -notmatch '(?m)^// @connect\s+api\.autodarts\.com$') {
    throw "Build discipline QA failed: $($artifact.Name) does not grant api.autodarts.com access."
  }
}
if ($dist -notmatch 'const API_PROVIDER = "api\.autodarts\.com";') {
  throw "Build discipline QA failed: dist API provider is not api.autodarts.com."
}
if ($constants -notmatch 'const API_PROVIDER = "api\.autodarts\.com";') {
  throw "Build discipline QA failed: source API provider is not api.autodarts.com."
}
if (-not $readme.Contains("Aktuelle Version: ``$appVersion``")) {
  throw "Build discipline QA failed: README current version does not match build/version.json."
}
if ($changelog -notmatch "(?m)^## $([regex]::Escape($appVersion))$") {
  throw "Build discipline QA failed: changelog has no section for appVersion."
}

Write-Host "Build discipline QA successful."
