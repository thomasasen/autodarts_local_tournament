param()

$ErrorActionPreference = "Stop"

function Resolve-RepoPath([string]$RelativePath) {
  $scriptDir = Split-Path -Parent $PSCommandPath
  $repoRoot = Split-Path -Parent $scriptDir
  return (Join-Path $repoRoot $RelativePath)
}

$buildScript = Resolve-RepoPath "scripts/build-userscript.mjs"
if (-not (Test-Path $buildScript)) {
  throw "Build script not found: $buildScript"
}

$nodeResult = & node $buildScript
if ($LASTEXITCODE -ne 0) {
  throw "Build failed."
}

Write-Host $nodeResult
