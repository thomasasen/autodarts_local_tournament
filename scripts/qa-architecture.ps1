param(
  [switch]$ReportOnly
)

$ErrorActionPreference = "Stop"

function Resolve-RepoPath([string]$RelativePath) {
  $scriptDir = Split-Path -Parent $PSCommandPath
  $repoRoot = (Resolve-Path (Split-Path -Parent $scriptDir)).Path
  return (Join-Path $repoRoot $RelativePath)
}

function Get-RelativeRepoPath([string]$FullPath, [string]$RepoRoot) {
  $repoRootNormalized = $RepoRoot.TrimEnd('\')
  return $FullPath.Substring($repoRootNormalized.Length + 1).Replace('\', '/')
}

function Get-LayerName([string]$RelativePath) {
  if ($RelativePath -match '^src/([^/]+)/') {
    return $Matches[1]
  }
  if ($RelativePath -match '^tests/') {
    return 'tests'
  }
  if ($RelativePath -match '^scripts/') {
    return 'scripts'
  }
  if ($RelativePath -match '^build/') {
    return 'build'
  }
  return 'root'
}

function Add-Dependency([hashtable]$Map, [string]$From, [string]$To) {
  if (-not $Map.ContainsKey($From)) {
    $Map[$From] = [System.Collections.Generic.HashSet[string]]::new()
  }
  if ($From -ne $To) {
    [void]$Map[$From].Add($To)
  }
}

function Visit-Node([string]$Node, [hashtable]$Map, [System.Collections.Generic.HashSet[string]]$Visited, [System.Collections.Generic.HashSet[string]]$Stack, [System.Collections.Generic.List[string]]$Cycles) {
  if ($Stack.Contains($Node)) {
    $Cycles.Add($Node) | Out-Null
    return
  }
  if ($Visited.Contains($Node)) {
    return
  }

  $Visited.Add($Node) | Out-Null
  $Stack.Add($Node) | Out-Null
  $targets = @()
  if ($Map.ContainsKey($Node)) {
    $targets = @($Map[$Node])
  }
  foreach ($target in $targets) {
    Visit-Node $target $Map $Visited $Stack $Cycles
  }
  $Stack.Remove($Node) | Out-Null
}

$repoRoot = (Resolve-Path (Split-Path -Parent (Split-Path -Parent $PSCommandPath))).Path
$srcRoot = Resolve-RepoPath "src"
$domainRoot = Resolve-RepoPath "src/domain"
$bracketRoot = Resolve-RepoPath "src/bracket"
$runtimeRoot = Resolve-RepoPath "src/runtime"
$storagePath = Resolve-RepoPath "src/data/storage.js"

$domainForbiddenPatterns = @(
  @{ Label = 'document'; Pattern = '\bdocument\b' },
  @{ Label = 'window'; Pattern = '\bwindow\b' },
  @{ Label = 'localStorage'; Pattern = '\blocalStorage\b' },
  @{ Label = 'fetch'; Pattern = '\bfetch\b' },
  @{ Label = 'console'; Pattern = '\bconsole\b' },
  @{ Label = 'state'; Pattern = '\bstate\.' },
  @{ Label = 'schedulePersist'; Pattern = '\bschedulePersist\s*\(' },
  @{ Label = 'renderShell'; Pattern = '\brenderShell\s*\(' },
  @{ Label = 'logDebug'; Pattern = '\blogDebug\s*\(' },
  @{ Label = 'logWarn'; Pattern = '\blogWarn\s*\(' },
  @{ Label = 'logError'; Pattern = '\blogError\s*\(' }
)

$dependencyMap = [ordered]@{
  core = @()
  domain = @('core')
  data = @('core', 'domain')
  bracket = @('core', 'domain')
  app = @('core', 'data', 'domain', 'bracket')
  infra = @('core', 'app')
  ui = @('core', 'app')
  runtime = @('core', 'app', 'infra', 'ui')
}

$violations = New-Object System.Collections.Generic.List[object]
$domainFiles = Get-ChildItem -Path $domainRoot -Filter *.js | Sort-Object Name
foreach ($file in $domainFiles) {
  $content = Get-Content $file.FullName -Raw -Encoding utf8
  foreach ($pattern in $domainForbiddenPatterns) {
    if ($content -match $pattern.Pattern) {
      $violations.Add([PSCustomObject]@{
        File = Get-RelativeRepoPath $file.FullName $repoRoot
        Rule = $pattern.Label
      }) | Out-Null
    }
  }
}

$layerViolations = New-Object System.Collections.Generic.List[object]
foreach ($file in (Get-ChildItem -Path $bracketRoot -Filter *.js | Sort-Object Name)) {
  $content = Get-Content $file.FullName -Raw -Encoding utf8
  foreach ($pattern in @(
      @{ Label = 'state'; Pattern = '\bstate\.' },
      @{ Label = 'setNotice'; Pattern = '\bsetNotice\s*\(' },
      @{ Label = 'renderShell'; Pattern = '\brenderShell\s*\(' },
      @{ Label = 'syncBracketFallbackVisibility'; Pattern = '\bsyncBracketFallbackVisibility\s*\(' }
    )) {
    if ($content -match $pattern.Pattern) {
      $layerViolations.Add([PSCustomObject]@{
        From = Get-RelativeRepoPath $file.FullName $repoRoot
        To = $pattern.Label
      }) | Out-Null
    }
  }
}

$storageContent = Get-Content $storagePath -Raw -Encoding utf8
foreach ($pattern in @(
    @{ Label = 'state'; Pattern = '\bstate\.' },
    @{ Label = 'setNotice'; Pattern = '\bsetNotice\s*\(' },
    @{ Label = 'renderShell'; Pattern = '\brenderShell\s*\(' },
    @{ Label = 'refreshDerivedMatches'; Pattern = '\brefreshDerivedMatches\s*\(' }
  )) {
  if ($storageContent -match $pattern.Pattern) {
    $layerViolations.Add([PSCustomObject]@{
      From = "src/data/storage.js"
      To = $pattern.Label
    }) | Out-Null
  }
}

foreach ($file in (Get-ChildItem -Path $runtimeRoot -Filter *.js | Sort-Object Name)) {
  if ($file.Name -eq 'bootstrap.js') {
    continue
  }
  $content = Get-Content $file.FullName -Raw -Encoding utf8
  $trimmed = ($content -replace '^\uFEFF', '') `
    -replace '(?m)^\s*//.*$', '' `
    -replace '\s+', ''
  if ($trimmed) {
    $layerViolations.Add([PSCustomObject]@{
      From = Get-RelativeRepoPath $file.FullName $repoRoot
      To = 'non-bootstrap-runtime-code'
    }) | Out-Null
  }
}

foreach ($file in (Get-ChildItem -Path (Resolve-RepoPath "src/ui") -Filter "render-*.js" | Sort-Object Name)) {
  $content = Get-Content $file.FullName -Raw -Encoding utf8
  foreach ($pattern in @(
      @{ Label = 'compareMatchesByRound'; Pattern = 'function\s+compareMatchesByRound\s*\(' },
      @{ Label = 'getMatchPriorityReadyFirst'; Pattern = 'function\s+getMatchPriorityReadyFirst\s*\(' },
      @{ Label = 'getMatchPriorityStatus'; Pattern = 'function\s+getMatchPriorityStatus\s*\(' },
      @{ Label = 'sortMatchesForDisplay'; Pattern = 'function\s+sortMatchesForDisplay\s*\(' },
      @{ Label = 'findSuggestedNextMatch'; Pattern = 'function\s+findSuggestedNextMatch\s*\(' }
    )) {
    if ($content -match $pattern.Pattern) {
      $layerViolations.Add([PSCustomObject]@{
        From = Get-RelativeRepoPath $file.FullName $repoRoot
        To = $pattern.Label
      }) | Out-Null
    }
  }
}

$cycles = New-Object System.Collections.Generic.List[string]

Write-Host "Architecture dependency map:"
foreach ($layer in $dependencyMap.Keys) {
  $targets = @($dependencyMap[$layer])
  $targetText = if ($targets.Count) { $targets -join ', ' } else { '(none)' }
  Write-Host "  $layer -> $targetText"
}

Write-Host ""
Write-Host "Domain forbidden pattern violations:"
if ($violations.Count -eq 0) {
  Write-Host "  none"
} else {
  foreach ($violation in $violations) {
    Write-Host "  $($violation.File) -> $($violation.Rule)"
  }
}

Write-Host ""
Write-Host "Layer violations:"
if ($layerViolations.Count -eq 0) {
  Write-Host "  none"
} else {
  foreach ($violation in $layerViolations) {
    Write-Host "  $($violation.From) -> $($violation.To)"
  }
}

Write-Host ""
Write-Host "Cycle hints:"
if ($layerViolations.Count -eq 0 -and $violations.Count -eq 0) {
  Write-Host "  none"
} else {
  Write-Host "  indirect global-function cycles are not detected soundly in this repo layout;"
  Write-Host "  rely on the layer-violation checks above."
}

if (-not $ReportOnly) {
  if ($violations.Count -gt 0) {
    throw "Architecture QA failed: domain forbidden patterns found."
  }
  if ($layerViolations.Count -gt 0) {
    throw "Architecture QA failed: layer violations found."
  }
}
