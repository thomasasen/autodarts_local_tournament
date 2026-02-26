param(
  [string]$DistPath = "dist/autodarts-tournament-assistant.user.js"
)

$ErrorActionPreference = "Stop"

function Resolve-RepoPath([string]$RelativePath) {
  $scriptDir = Split-Path -Parent $PSCommandPath
  $repoRoot = Split-Path -Parent $scriptDir
  return (Join-Path $repoRoot $RelativePath)
}

$distFull = Resolve-RepoPath $DistPath
if (-not (Test-Path $distFull)) {
  throw "Dist file not found: $distFull"
}

$dist = Get-Content $distFull -Raw -Encoding utf8

$checks = @(
  @{ Rule = "Promoter Tie-Break-Profil vorhanden"; Pattern = "TIE_BREAK_PROFILE_PROMOTER_H2H_MINITABLE" },
  @{ Rule = "Legacy-Mapping auf Promoter-Profil vorhanden"; Pattern = "mapLegacyTieBreakModeToProfile" },
  @{ Rule = "Direktvergleich bei 2 punktgleichen Spielern"; Pattern = "bucketRows\.length === 2" },
  @{ Rule = "Teilgruppen-Logik bei 3\+ punktgleichen Spielern"; Pattern = "miniLegDiffById" },
  @{ Rule = "Globale LegDiff/Legs\+ Fallbacks"; Pattern = "right\.legDiff !== left\.legDiff[\s\S]*right\.legsFor !== left\.legsFor" },
  @{ Rule = "Deadlock-Markierung Playoff erforderlich"; Pattern = "playoff_required" },
  @{ Rule = "Gruppenaufloesung blockiert bei Playoff"; Pattern = 'groupResolution\?\.status === "resolved"' },
  @{ Rule = "KO Bracketgroesse wird berechnet"; Pattern = "calculateBracketSize" },
  @{ Rule = "Deterministische Seed-Generierung vorhanden"; Pattern = "generateSeeds" },
  @{ Rule = "Byes werden strukturell zugewiesen"; Pattern = "assignByes" },
  @{ Rule = "KO-Struktur trennt Runden und virtuelle Matches"; Pattern = "buildBracketStructure" },
  @{ Rule = "Vollstaendige KO-Matchmaterialisierung aktiv"; Pattern = "buildKoMatchesFromStructure" },
  @{ Rule = "Bye-Ergebnisse werden explizit synchronisiert"; Pattern = "synchronizeStructuralByeMatch" },
  @{ Rule = "Draw-Lock je KO-Turnier vorhanden"; Pattern = "drawLocked" },
  @{ Rule = "Globales Draw-Lock-Default vorhanden"; Pattern = "koDrawLockDefault" },
  @{ Rule = "PDC-UI-Begriff Straight Knockout"; Pattern = "Straight Knockout" },
  @{ Rule = "PDC-UI-Begriff Round Robin"; Pattern = "Round Robin" }
)

$errors = @()
foreach ($check in $checks) {
  if (-not ([regex]::IsMatch($dist, $check.Pattern))) {
    $errors += "Regelcheck fehlgeschlagen: $($check.Rule)"
  }
}

if ($errors.Count -gt 0) {
  $errors | ForEach-Object { Write-Error $_ }
  throw "Regelcheck QA failed."
}

Write-Host "Regelcheck QA successful."
