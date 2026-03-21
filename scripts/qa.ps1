param()

$ErrorActionPreference = "Stop"

function Resolve-RepoPath([string]$RelativePath) {
  $scriptDir = Split-Path -Parent $PSCommandPath
  $repoRoot = Split-Path -Parent $scriptDir
  return (Join-Path $repoRoot $RelativePath)
}

$buildScript = Resolve-RepoPath "scripts/build.ps1"
$architectureScript = Resolve-RepoPath "scripts/qa-architecture.ps1"
$buildDisciplineScript = Resolve-RepoPath "scripts/qa-build-discipline.ps1"
$encodingScript = Resolve-RepoPath "scripts/qa-encoding.ps1"
$rulesScript = Resolve-RepoPath "scripts/qa-regelcheck.ps1"
$domainTestScript = Resolve-RepoPath "scripts/test-domain.ps1"
$runtimeContractScript = Resolve-RepoPath "scripts/test-runtime-contract.ps1"
$canonicalDistPath = Resolve-RepoPath "dist/autodarts-local-tournament.user.js"
$legacyDistPath = Resolve-RepoPath "dist/autodarts-tournament-assistant.user.js"

& $buildScript
& $architectureScript
& $encodingScript
& $rulesScript
& $domainTestScript
& $runtimeContractScript
& $buildDisciplineScript

$canonicalDist = Get-Content $canonicalDistPath -Raw -Encoding utf8
$legacyDist = Get-Content $legacyDistPath -Raw -Encoding utf8

if (-not ($canonicalDist -match 'runSelfTests')) {
  throw "Smoke QA failed: runSelfTests not found in canonical dist."
}
if (-not ($canonicalDist -match 'STORAGE_SCHEMA_VERSION\s*=\s*4')) {
  throw "Smoke QA failed: STORAGE_SCHEMA_VERSION=4 not found in canonical dist."
}
if (-not ($canonicalDist -match 'function\s+standingsForMatches')) {
  throw "Smoke QA failed: standingsForMatches not found in canonical dist."
}
if (-not ($legacyDist -match 'runSelfTests')) {
  throw "Smoke QA failed: runSelfTests not found in legacy alias dist."
}

Write-Host "QA successful."
