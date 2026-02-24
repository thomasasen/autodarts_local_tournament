param()

$ErrorActionPreference = "Stop"

function Resolve-RepoPath([string]$RelativePath) {
  $scriptDir = Split-Path -Parent $PSCommandPath
  $repoRoot = Split-Path -Parent $scriptDir
  return (Join-Path $repoRoot $RelativePath)
}

$buildScript = Resolve-RepoPath "scripts/build.ps1"
$encodingScript = Resolve-RepoPath "scripts/qa-encoding.ps1"
$rulesScript = Resolve-RepoPath "scripts/qa-regelcheck.ps1"
$distPath = Resolve-RepoPath "dist/autodarts-tournament-assistant.user.js"

& $buildScript
& $encodingScript
& $rulesScript

$dist = Get-Content $distPath -Raw -Encoding utf8
if (-not ($dist -match 'runSelfTests')) {
  throw "Smoke QA failed: runSelfTests not found in dist."
}
if (-not ($dist -match 'STORAGE_SCHEMA_VERSION\s*=\s*3')) {
  throw "Smoke QA failed: STORAGE_SCHEMA_VERSION=3 not found in dist."
}
if (-not ($dist -match 'function\s+standingsForMatches')) {
  throw "Smoke QA failed: standingsForMatches not found in dist."
}

Write-Host "QA successful."
