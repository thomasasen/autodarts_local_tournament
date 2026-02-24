param(
  [string[]]$Paths = @("src", "dist", "docs", "README.md")
)

$ErrorActionPreference = "Stop"

function Resolve-RepoPath([string]$RelativePath) {
  $scriptDir = Split-Path -Parent $PSCommandPath
  $repoRoot = Split-Path -Parent $scriptDir
  return (Join-Path $repoRoot $RelativePath)
}

$mojibakePattern = '\u00C3|\u00C2|\u00E2\u20AC'
$legacyUmlautFallbackPattern = 'Naech|naech|Oeff|oeff|Ueber|ueber'
$filesToCheck = New-Object System.Collections.Generic.List[string]

foreach ($path in $Paths) {
  $full = Resolve-RepoPath $path
  if (-not (Test-Path $full)) {
    continue
  }
  $item = Get-Item $full
  if ($item.PSIsContainer) {
    Get-ChildItem $full -Recurse -File | ForEach-Object {
      if ($_.Extension -in @('.js', '.ps1', '.md', '.json', '.css')) {
        $filesToCheck.Add($_.FullName)
      }
    }
  } else {
    $filesToCheck.Add($item.FullName)
  }
}

$errors = @()

foreach ($file in $filesToCheck) {
  $content = Get-Content $file -Raw -Encoding utf8
  if ($content -match $mojibakePattern) {
    $errors += "Mojibake pattern found in $file"
  }
  $isRuntimeCode = $file -match '[\\/]src[\\/]' -or $file -match '[\\/]dist[\\/]'
  if ($isRuntimeCode -and $content -match $legacyUmlautFallbackPattern) {
    $errors += "Legacy umlaut fallback spelling found in $file"
  }
}

$distPath = Resolve-RepoPath "dist/autodarts-tournament-assistant.user.js"
if (Test-Path $distPath) {
  $dist = Get-Content $distPath -Raw -Encoding utf8
  if (-not ($dist -match 'N(\\u00e4|\\x{00E4})chstes Match')) {
    $errors += "Required UI term 'Nächstes Match' missing (escaped or UTF-8)."
  }
  if (-not ($dist -match 'Freilos\s*\(Bye\)')) {
    $errors += "Required UI term 'Freilos (Bye)' missing."
  }
}

if ($errors.Count -gt 0) {
  $errors | ForEach-Object { Write-Error $_ }
  throw "Encoding QA failed."
}

Write-Host "Encoding QA successful."
