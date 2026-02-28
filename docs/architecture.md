# Architektur

Diese Datei erklärt die Architektur auf hoher Ebene.
Die vollständige Ordner- und Dateikarte inklusive Build-/Runtime-Verbindungen steht in [codebase-map.md](codebase-map.md).

## Überblick
Der Assistent ist in fachliche Schichten aufgeteilt und wird weiterhin als einzelnes Userscript ausgeliefert (`dist/autodarts-tournament-assistant.user.js`).

- `src/core`: Konstanten, State, Utilities, Events, Logging
- `src/data`: Storage, Normalisierung, Migration
- `src/domain`: Turniererstellung, KO-Engine, Gruppen-/Liga-Logik, Ergebnislogik, DRA-Tie-Break
- `src/infra`: API-Client, API-Automation, Route-Hooks
- `src/ui`: Rendering, Tabs, Handler, Styles
- `src/bracket`: Bracket-Payload, Iframe-Template, Message-Bridge
- `src/runtime`: Lifecycle, Public API, Bootstrap

## Build und Distribution
- Der Build läuft ohne npm/Node über `scripts/build.ps1`.
- Die Reihenfolge ist deterministisch über `build/manifest.json`.
- CSS liegt in `src/ui/styles/main.css` und wird beim Build in das Bundle eingebettet.
- Die Ausgabe bleibt eine einzelne Datei in `dist/` (Loader-kompatibel).

## Runtime
- Runtime-Guard: `window.__ATA_RUNTIME_BOOTSTRAPPED`
- Public API: `window.__ATA_RUNTIME`
  - `openDrawer`, `closeDrawer`, `toggleDrawer`, `isReady`, `version`
  - `runSelfTests()` für lokale Diagnose

## Datenmodell
- Storage-Key: `ata:tournament:v1`
- `schemaVersion: 4`
- Neues Regelobjekt pro Turnier:
  - `tournament.rules.tieBreakProfile: "promoter_h2h_minitable" | "promoter_points_legdiff"`
- KO-spezifisch:
  - `settings.featureFlags.koDrawLockDefault: boolean`
  - `tournament.ko.drawLocked: boolean`
  - `tournament.ko.placement: number[]`

## Regelmodell (DRA/PDC)
- Standard: `promoter_h2h_minitable` (auch bei Migration von Bestandsdaten).
- Tie-Break-Reihenfolge (Round Robin):
  1. Punkte (2 Sieg, 1 Remis, 0 Niederlage)
  2. Bei 2 Punktgleichen: Direktvergleich
  3. Bei 3+ Punktgleichen: Leg-Differenz innerhalb der Teilgruppe
  4. Leg-Differenz gesamt
  5. Legs gewonnen gesamt
  6. Bei weiterem Gleichstand: `playoff_required`
- Gruppen-zu-KO-Zuordnung wird blockiert, solange `playoff_required` aktiv ist.

## KO-Logik
- KO bleibt `Straight Knockout`.
- Draw-Modi:
  - `seeded`
  - `open_draw`
- vollständige Match-Materialisierung über alle Runden:
  - offene spätere Runden werden als nicht editierbare Slots geführt
  - Freilose werden als explizite Bye-Matches gespeichert
- Draw-Lock:
  - Standardmäßig bleibt der initiale KO-Draw stabil (`drawLocked = true`)
  - kann pro aktivem KO-Turnier bewusst umgeschaltet werden

## Qualitätssicherung
- `scripts/qa.ps1`: Orchestrierung
- `scripts/qa-encoding.ps1`: UTF-8/Umlaute/Mojibake
- `scripts/qa-regelcheck.ps1`: Regelpunkt-zu-Code-Mapping
- Runtime-Selbsttests: `window.__ATA_RUNTIME.runSelfTests()`
