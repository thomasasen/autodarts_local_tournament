param()

$ErrorActionPreference = "Stop"

function Resolve-RepoPath([string]$RelativePath) {
  $scriptDir = Split-Path -Parent $PSCommandPath
  $repoRoot = Split-Path -Parent $scriptDir
  return (Join-Path $repoRoot $RelativePath)
}

$packagePath = Resolve-RepoPath "package.json"
$constantsPath = Resolve-RepoPath "src/core/constants.js"
$canonicalDistPath = Resolve-RepoPath "dist/autodarts-local-tournament.user.js"
$canonicalMetaPath = Resolve-RepoPath "dist/autodarts-local-tournament.meta.js"
$legacyDistPath = Resolve-RepoPath "dist/autodarts-tournament-assistant.user.js"
$legacyMetaPath = Resolve-RepoPath "dist/autodarts-tournament-assistant.meta.js"

$packageConfig = Get-Content $packagePath -Raw -Encoding utf8 | ConvertFrom-Json
$appVersion = [string]$packageConfig.version
if (-not $appVersion) {
  throw "Build discipline QA failed: version missing in package.json."
}

$constants = Get-Content $constantsPath -Raw -Encoding utf8
if ($constants -notmatch '__ATA_APP_VERSION__') {
  throw "Build discipline QA failed: src/core/constants.js must use __ATA_APP_VERSION__ placeholder."
}

$artifacts = @(
  @{ Label = "canonical dist"; Path = $canonicalDistPath },
  @{ Label = "canonical meta"; Path = $canonicalMetaPath },
  @{ Label = "legacy dist"; Path = $legacyDistPath },
  @{ Label = "legacy meta"; Path = $legacyMetaPath }
)

foreach ($artifact in $artifacts) {
  if (-not (Test-Path $artifact.Path)) {
    throw "Build discipline QA failed: missing artifact $($artifact.Label) -> $($artifact.Path)"
  }
  $content = Get-Content $artifact.Path -Raw -Encoding utf8
  if ($content -match '__ATA_APP_VERSION__') {
    throw "Build discipline QA failed: unresolved __ATA_APP_VERSION__ placeholder found in $($artifact.Label)."
  }
  if ($content -notmatch "@version\s+$([regex]::Escape($appVersion))") {
    throw "Build discipline QA failed: $($artifact.Label) version does not match package.json."
  }
}

$canonicalDist = Get-Content $canonicalDistPath -Raw -Encoding utf8
if ($canonicalDist -notmatch "const APP_VERSION = `"$([regex]::Escape($appVersion))`";") {
  throw "Build discipline QA failed: canonical dist APP_VERSION does not match package.json."
}
if ($canonicalDist -notmatch "@downloadURL\s+https://raw\.githubusercontent\.com/thomasasen/autodarts_local_tournament/main/dist/autodarts-local-tournament\.user\.js") {
  throw "Build discipline QA failed: canonical dist downloadURL is incorrect."
}
if ($canonicalDist -notmatch "@updateURL\s+https://raw\.githubusercontent\.com/thomasasen/autodarts_local_tournament/main/dist/autodarts-local-tournament\.meta\.js") {
  throw "Build discipline QA failed: canonical dist updateURL is incorrect."
}

$legacyDist = Get-Content $legacyDistPath -Raw -Encoding utf8
if ($legacyDist -notmatch "@downloadURL\s+https://raw\.githubusercontent\.com/thomasasen/autodarts_local_tournament/main/dist/autodarts-tournament-assistant\.user\.js") {
  throw "Build discipline QA failed: legacy dist downloadURL is incorrect."
}
if ($legacyDist -notmatch "@updateURL\s+https://raw\.githubusercontent\.com/thomasasen/autodarts_local_tournament/main/dist/autodarts-tournament-assistant\.meta\.js") {
  throw "Build discipline QA failed: legacy dist updateURL is incorrect."
}

Write-Host "Build discipline QA successful."
