# Architektur

Diese Datei erklärt die Architektur auf hoher Ebene.
Die vollständige Ordner- und Dateikarte inklusive Build-/Runtime-Verbindungen steht in [codebase-map.md](codebase-map.md).

## Überblick
Der Assistent ist in fachliche Schichten aufgeteilt und wird weiterhin als einzelnes Userscript ausgeliefert (`dist/autodarts-tournament-assistant.user.js`).

- `src/core`: Konstanten, State, Utilities, Events, Logging
- `src/domain`: fachliche Turnierregeln, pure Match-/KO-/Standings-/Zeitprognose-Logik
- `src/data`: Storage-I/O, Normalisierung, Migration
- `src/bracket`: low-level Bracket-Payload, Iframe-Template und Frame-Transport
- `src/app`: Orchestrierung zwischen Domain, Persistenz, Bracket und UI
- `src/infra`: API-Client, API-Automation, DOM-Autodetect, History-Import, Route-Hooks
- `src/ui`: Rendering, View-Helper, Handler, Styles
- `src/runtime`: nur Bootstrap-/Wiring-Dateien

## Ziel-DAG
- `core -> (none)`
- `domain -> core`
- `data -> core, domain`
- `bracket -> core, domain`
- `app -> core, data, domain, bracket`
- `infra -> core, app`
- `ui -> core, app`
- `runtime -> core, app, infra, ui`

## Build und Distribution
- Der Build läuft ohne npm/Node über `scripts/build.ps1`.
- Die Reihenfolge ist deterministisch über `build/manifest.json`.
- Die Versionsquelle liegt in `build/version.json` und wird beim Build in Header und `APP_VERSION` injiziert.
- CSS liegt in `src/ui/styles/main.css` und wird beim Build in das Bundle eingebettet.
- Der Build erzeugt `dist/autodarts-tournament-assistant.user.js` plus den leichten Versions-Endpoint `dist/autodarts-tournament-assistant.meta.js`.
- `dist/*` bleibt ein generiertes Artefakt und wird nicht manuell gepflegt.

## Runtime
- Runtime-Guard: `window.__ATA_RUNTIME_BOOTSTRAPPED`
- Public API: `window.__ATA_RUNTIME`
  - `openDrawer`, `closeDrawer`, `toggleDrawer`, `isReady`, `version`
  - `runSelfTests()` für lokale Diagnose
- `src/runtime/bootstrap.js` startet den Ablauf.
- `src/app/public-api.js` veröffentlicht die Runtime-API.
- `src/app/browser-lifecycle.js`, `src/infra/dom-autodetect.js` und `src/infra/history-import.js` tragen die eigentliche Browser-/DOM-Logik.
- `src/infra/update-check.js` prüft best-effort die veröffentlichte GitHub-Version; `src/app/update-status.js` spiegelt den Status in UI und Loader-Menü.

## Datenmodell
- Storage-Key: `ata:tournament:v1`
- `schemaVersion: 5`
- Neues Regelobjekt pro Turnier:
  - `tournament.rules.tieBreakProfile: "promoter_h2h_minitable" | "promoter_points_legdiff"`
- Neues globales Settings-Feld:
  - `settings.tournamentTimeProfile: "fast" | "normal" | "slow"`
- Turnier-Presetlogik:
  - die native Radio-Gruppe im Bereich `Turnierformat` ist die einzige autoritative Formularquelle für `x01Preset`; `ui.createDraft.x01Preset` hält den daraus persistierten Create-Preset-Status
  - eine bewusste Preset-Auswahl wendet die vorhandene Definition direkt an; manuelle Änderungen an preset-relevanten Sachwerten setzen den Status auf Custom
  - Default ist `pdc_european_tour_official`
  - Legacy `pdc_standard` wird auf `pdc_501_double_out_basic` normalisiert
- Modusabhängige Turnieranlage:
  - `CREATE_MODE_RULE_FIELDS` und `CREATE_MODE_RULE_GROUPS` bilden die zentrale Zuordnung für alle fünf Create-Modi
  - der persistierte Draft behält inaktive modusspezifische Werte; DOM-Controls sind außerhalb ihres Modus verborgen und deaktiviert
  - `scopeCreateConfigToMode()` projiziert vor Validation und Domain-Factory ausschließlich die aktiven Zusatzregeln
  - `state.createGameRulesExpanded` ist flüchtiger UI-State und wird nicht im Storage-Schema persistiert
- Kontextbezogene Regelhilfe:
  - `src/ui/tournament-help-topics.js` enthält elf stabile Topic-IDs und reine Resolver für Auswahl, Auswirkungen, Beispiele, Tipps, Abhängigkeiten, Grenzen, Herkunft, Regelstatus und Quellen
  - Resolver normalisieren den Draft und verwenden bestehende pure Domain-Analysen für Limits, Gruppen, Vorrunde, Spielregeln und Zeitprognose; sie verändern weder Draft noch Domainzustand
  - `state.activeCreateHelpTopicId` und der auslösende Fokusanker bleiben flüchtig; relevante Eingaben aktualisieren nur den offenen Inhalt und wählen kein anderes Thema
  - `src/ui/render-tournament-help.js` rendert Herkunft und Regelstatus als getrennte Abschnitte; ein Topic-Status ist keine Gesamtbewertung des Turniers
- KO-spezifisch:
  - `settings.featureFlags.koDrawLockDefault: boolean`
  - `tournament.ko.drawLocked: boolean`
  - `tournament.ko.placement: number[]`
- Vorrunde + Finalphase:
  - `tournament.preliminary` hält den deterministischen regulären Paarungsplan, Fixed-2-Legs-Format und das Veranstalter-Punkteprofil
  - `tournament.finalStage` hält Qualifikantenzahl, unabhängiges Best-of, Status, Tabellen-Seeds und wiederverwendete KO-Metadaten

## Zeitprognose
- Details zur Formel und zur externen Kalibrierung stehen in `docs/tournament-duration.md`.
- Die Turnierzeit-Prognose lebt als pure Domain-Logik in `src/domain/tournament-duration.js`.
- Grundlage der Schätzung:
  - Modus und Teilnehmerzahl
  - erwartete Legs pro Match aus `Best of`
  - X01-Setup (`Startscore`, `In`, `Out`, `Bull-off`, `Bull-Modus`, `Max Runden`)
  - globales Zeitprofil (`fast | normal | slow`)
- Die UI rendert daraus einen Live-Block im Bereich `Turnierübersicht` des fünfstufig gegliederten Turnierformulars. Eine separate kompakte Spielregel-Zusammenfassung wird aus denselben Draft-Werten abgeleitet; der Inline-Editor ändert Draft, Preset-Status und Prognose ohne Shell-Rerender. Die Abschnittsstruktur bleibt reine Darstellung; bestehende Feld-IDs und Handler-Verträge tragen weiterhin Draft-, Preset- und Submit-Verhalten.
- Bei `preliminary_final` werden Vorrunde und abhängige KO-/Doppel-KO-Finalphase als getrennte Tasks mit eigenen Leg-Erwartungen modelliert.
- `src/ui/handlers.js` aktualisiert diesen Block gezielt bei jedem Formular-Input, ohne die gesamte Shell neu zu rendern.

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
  - Entsperren ist nur als expliziter Promoter-Override mit Bestätigung möglich

## Qualitätssicherung
- `scripts/qa.ps1`: Orchestrierung
- `scripts/qa-architecture.ps1`: Layer-Regeln und verbotene Seiteneffekte
- `scripts/qa-encoding.ps1`: UTF-8/Umlaute/Mojibake
- `scripts/qa-regelcheck.ps1`: Regelpunkt-zu-Code-Mapping
- `scripts/test-domain.ps1`: isolierter Domain-Harness ohne npm und ohne Mock-DOM
- `scripts/test-runtime-contract.ps1`: Runtime-API-, Selftest- und Turnieranlage-DOM-Contract gegen `dist/*`
- `scripts/qa-build-discipline.ps1`: Versionsquelle und generiertes `dist/*`
- `tests/unit-update-check.js`: Regressionen für Versionvergleich, TTL, Fallback und Cache-Busting
- Runtime-Selbsttests: `window.__ATA_RUNTIME.runSelfTests()`
