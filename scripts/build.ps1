param(
  [string]$ManifestPath = "build/manifest.json",
  [string]$CssPath = "src/ui/styles/main.css",
  [string]$LogoPath = "assets/pdc_logo.png",
  [string]$OutputPath = "dist/autodarts-tournament-assistant.user.js"
)

$ErrorActionPreference = "Stop"

function Resolve-RepoPath([string]$RelativePath) {
  $scriptDir = Split-Path -Parent $PSCommandPath
  $repoRoot = Split-Path -Parent $scriptDir
  return (Join-Path $repoRoot $RelativePath)
}

$manifestFull = Resolve-RepoPath $ManifestPath
$cssFull = Resolve-RepoPath $CssPath
$logoFull = Resolve-RepoPath $LogoPath
$outputFull = Resolve-RepoPath $OutputPath

if (-not (Test-Path $manifestFull)) {
  throw "Manifest not found: $manifestFull"
}
if (-not (Test-Path $cssFull)) {
  throw "CSS file not found: $cssFull"
}
if (-not (Test-Path $logoFull)) {
  throw "Logo file not found: $logoFull"
}

$manifest = Get-Content $manifestFull -Raw -Encoding utf8 | ConvertFrom-Json
if (-not $manifest.files -or $manifest.files.Count -eq 0) {
  throw "Manifest contains no files."
}

$parts = New-Object System.Collections.Generic.List[string]
foreach ($relativeFile in $manifest.files) {
  $fullFile = Resolve-RepoPath $relativeFile
  if (-not (Test-Path $fullFile)) {
    throw "Source file not found: $relativeFile"
  }
  $raw = Get-Content $fullFile -Raw -Encoding utf8
  $raw = $raw -replace '^\s*// Auto-generated module split from dist source\.\r?\n', ''
  $parts.Add($raw.TrimEnd())
}

$bundle = ($parts -join "`n`n") + "`n"

$cssRaw = Get-Content $cssFull -Raw -Encoding utf8
$cssRaw = $cssRaw.Trim("`r", "`n")
$cssEscaped = $cssRaw.Replace('`', '``').Replace('${', '\${')
$bundle = $bundle.Replace('__ATA_UI_MAIN_CSS__', $cssEscaped)
$logoBytes = [System.IO.File]::ReadAllBytes($logoFull)
$logoBase64 = [Convert]::ToBase64String($logoBytes)
$logoDataUri = "data:image/png;base64,$logoBase64"
$logoEscaped = $logoDataUri.Replace('`', '``').Replace('${', '\${')
$bundle = $bundle.Replace('__ATA_PDC_LOGO_DATA_URI__', $logoEscaped)

if ($bundle.Contains('__ATA_UI_MAIN_CSS__')) {
  throw "CSS placeholder replacement failed."
}
if ($bundle.Contains('__ATA_PDC_LOGO_DATA_URI__')) {
  throw "Logo placeholder replacement failed."
}

$bundle = $bundle -replace "`r`n", "`n"

Set-Content -Path $outputFull -Value $bundle -Encoding utf8

if (-not (Test-Path $outputFull)) {
  throw "Output write failed: $outputFull"
}
if (-not (Get-Content $outputFull -Raw -Encoding utf8).Contains("// ==UserScript==")) {
  throw "Output is missing userscript header."
}

Write-Host "Build successful: $OutputPath"
