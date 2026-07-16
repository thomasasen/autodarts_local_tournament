param()

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $PSCommandPath
$repoRoot = Split-Path -Parent $scriptDir
$repoPathPrefix = $repoRoot.TrimEnd([char[]]"\/") + [IO.Path]::DirectorySeparatorChar
$failures = New-Object System.Collections.Generic.List[string]

function Add-HygieneFailure([string]$Message) {
  $failures.Add($Message)
}

function Get-RelativeRepoPath([string]$FullPath) {
  return $FullPath.Substring($repoRoot.Length).TrimStart([char[]]"\/").Replace("\", "/")
}

function ConvertTo-MarkdownAnchor([string]$Heading) {
  $value = [System.Net.WebUtility]::HtmlDecode([string]$Heading).ToLowerInvariant()
  $value = [regex]::Replace($value, '<[^>]+>', '')
  $value = [regex]::Replace($value, '[^\p{L}\p{Nd}\s_-]', '')
  $value = [regex]::Replace($value, '\s', '-')
  return $value.Trim('-')
}

function Get-MarkdownAnchors([string]$Path) {
  $content = Get-Content -LiteralPath $Path -Raw -Encoding utf8
  $anchors = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
  $slugCounts = @{}

  foreach ($match in [regex]::Matches($content, '(?im)\bid\s*=\s*["'']([^"'']+)["'']')) {
    [void]$anchors.Add($match.Groups[1].Value)
  }

  foreach ($match in [regex]::Matches($content, '(?m)^\s{0,3}#{1,6}\s+(?<heading>.+?)\s*#*\s*$')) {
    $slug = ConvertTo-MarkdownAnchor $match.Groups['heading'].Value
    if (-not $slug) {
      continue
    }
    $count = if ($slugCounts.ContainsKey($slug)) { [int]$slugCounts[$slug] } else { 0 }
    $slugCounts[$slug] = $count + 1
    if ($count -gt 0) {
      $slug = "$slug-$count"
    }
    [void]$anchors.Add($slug)
  }

  return $anchors
}

$trackedFiles = @(& git -C $repoRoot ls-files)
if ($LASTEXITCODE -ne 0) {
  throw "Repository hygiene QA failed: git ls-files could not be executed."
}

foreach ($trackedFile in $trackedFiles) {
  $normalized = $trackedFile.Replace("\", "/")
  if ($normalized -match '(^|/)\.tmp-[^/]+(?:/|$)' -or $normalized -match '\.(bak|orig|rej|log)$') {
    Add-HygieneFailure "Unerwartetes versioniertes temporäres Artefakt: $normalized"
  }
}

$planPath = Join-Path $repoRoot "plan"
if (Test-Path -LiteralPath $planPath) {
  Add-HygieneFailure "Das abgeschlossene plan/-Verzeichnis ist noch vorhanden."
}

$repositoryFiles = Get-ChildItem -LiteralPath $repoRoot -File -Force -Recurse | Where-Object {
  $_.FullName -notlike "$repoRoot\.git\*"
}
foreach ($file in $repositoryFiles) {
  $relative = Get-RelativeRepoPath $file.FullName
  if (
    $file.Name -match '^CODEX_STARTPROMPT_.*\.md$' -or
    $file.Name -match '^CODEX_.*PROMPT.*\.md$' -or
    $file.Name -match '.*_IMPLEMENTATION_PLAN\.md$' -or
    $file.Name -match '^PLAN\.md$' -or
    $file.Name -match '^AUDIT.*\.md$' -or
    $file.Name -match '^REVIEW.*\.md$'
  ) {
    Add-HygieneFailure "Temporäre Arbeits-/Promptdatei gefunden: $relative"
  }
}

$currentDocumentation = @(
  (Join-Path $repoRoot "README.md")
) + @(Get-ChildItem -LiteralPath (Join-Path $repoRoot "docs") -Filter "*.md" -File | Where-Object {
  $_.Name -ne "changelog.md"
} | ForEach-Object { $_.FullName })
$staleReleasePatterns = @(
  'Release 7 nicht begonnen',
  'Release 7 vorbehalten',
  'folgt mit Release 7',
  'späteren Release 7'
)
foreach ($path in $currentDocumentation) {
  $content = Get-Content -LiteralPath $path -Raw -Encoding utf8
  foreach ($pattern in $staleReleasePatterns) {
    if ($content -match [regex]::Escape($pattern)) {
      Add-HygieneFailure "Veralteter Release-7-Zukunftshinweis in $(Get-RelativeRepoPath $path): $pattern"
    }
  }
}

$markdownFiles = $repositoryFiles | Where-Object { $_.Extension -ieq ".md" }
$anchorCache = @{}
foreach ($markdownFile in $markdownFiles) {
  $content = Get-Content -LiteralPath $markdownFile.FullName -Raw -Encoding utf8
  $linkMatches = @([regex]::Matches(
    $content,
    '(?m)!?\[[^\]]*\]\((?<target><[^>]+>|[^)\s]+)(?:\s+["''][^)]*)?\)|^\s*\[[^\]]+\]:\s*(?<target><[^>]+>|\S+)|(?:href|src)\s*=\s*["''](?<target>[^"'']+)["'']'
  ))
  foreach ($linkMatch in $linkMatches) {
    $rawTarget = $linkMatch.Groups['target'].Value.Trim().Trim([char[]]"<>")
    if (
      -not $rawTarget -or
      $rawTarget -match '^[A-Za-z][A-Za-z0-9+.-]*:' -or
      $rawTarget.StartsWith("//")
    ) {
      continue
    }

    $fragment = ""
    $targetPath = $rawTarget
    $fragmentIndex = $targetPath.IndexOf('#')
    if ($fragmentIndex -ge 0) {
      $fragment = $targetPath.Substring($fragmentIndex + 1)
      $targetPath = $targetPath.Substring(0, $fragmentIndex)
    }
    $queryIndex = $targetPath.IndexOf('?')
    if ($queryIndex -ge 0) {
      $targetPath = $targetPath.Substring(0, $queryIndex)
    }
    $targetPath = [Uri]::UnescapeDataString($targetPath)
    $fragment = [Uri]::UnescapeDataString($fragment)

    try {
      if (-not $targetPath) {
        $targetFullPath = $markdownFile.FullName
      } elseif ($targetPath.StartsWith('/')) {
        $targetFullPath = [IO.Path]::GetFullPath((Join-Path $repoRoot $targetPath.TrimStart('/')))
      } else {
        $targetFullPath = [IO.Path]::GetFullPath((Join-Path $markdownFile.DirectoryName $targetPath))
      }
    } catch {
      Add-HygieneFailure "Ungültiger lokaler Link in $(Get-RelativeRepoPath $markdownFile.FullName): $rawTarget"
      continue
    }

    if (-not $targetFullPath.StartsWith($repoPathPrefix, [StringComparison]::OrdinalIgnoreCase)) {
      Add-HygieneFailure "Lokaler Link verlässt das Repository in $(Get-RelativeRepoPath $markdownFile.FullName): $rawTarget"
      continue
    }
    if (-not (Test-Path -LiteralPath $targetFullPath -PathType Leaf)) {
      Add-HygieneFailure "Fehlendes lokales Linkziel in $(Get-RelativeRepoPath $markdownFile.FullName): $rawTarget"
      continue
    }

    if (-not $fragment -or [IO.Path]::GetExtension($targetFullPath) -ieq ".pdf") {
      continue
    }
    if ([IO.Path]::GetExtension($targetFullPath) -ine ".md") {
      continue
    }
    if (-not $anchorCache.ContainsKey($targetFullPath)) {
      $anchorCache[$targetFullPath] = Get-MarkdownAnchors $targetFullPath
    }
    if (-not $anchorCache[$targetFullPath].Contains($fragment)) {
      Add-HygieneFailure "Fehlender Markdown-Anker in $(Get-RelativeRepoPath $markdownFile.FullName): $rawTarget"
    }
  }
}

if ($failures.Count -gt 0) {
  $details = $failures | ForEach-Object { "- $_" }
  throw "Repository hygiene QA failed:`n$($details -join "`n")"
}

Write-Host "Repository hygiene QA successful ($($markdownFiles.Count) Markdown files checked)."
