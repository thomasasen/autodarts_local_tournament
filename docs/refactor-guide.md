# Refactor Guide

## Ziel
Modulare Pflege des Userscripts ohne npm/Node mit reproduzierbarem Build.

## Arbeitsweise
1. Änderungen in `src/*` durchführen.
2. Versionsquelle bei Releases in `build/version.json` pflegen.
3. Build ausführen:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/build.ps1
```
4. Domänennahe Änderungen direkt mit dem Harness prüfen:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-domain.ps1
```
5. QA ausführen:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/qa.ps1
```

## Modulgrenzen
- `core`: generische Laufzeit-Bausteine
- `domain`: fachliche Turnierregeln, rein funktional testbar
- `data`: Persistenz-I/O, Normalisierung und Migration
- `bracket`: isolierte Bracket-Einbettung ohne UI-State-Kopplung
- `app`: Orchestrierung zwischen Domain, Persistenz, Bracket und UI
- `infra`: externe API- und Browser-Integration
- `ui`: Rendering, View-Helper und Event-Eingang
- `runtime`: nur Bootstrap-/Wiring-Dateien

## Regeln für Änderungen
1. Fachlogik nur in `domain/*`
2. API-seitige Änderungen nur in `infra/*`
3. `domain/*` darf kein `document`, `window`, `localStorage`, `fetch`, `console`, `state`, `schedulePersist()` oder `renderShell()` kennen
4. `src/data/storage.js` bleibt reine I/O-Schicht ohne Render-/Notice-/Derived-State-Orchestrierung
5. `src/runtime/*` bleibt bootstrap-only; Browser-Workflows gehören nach `app/*` oder `infra/*`
6. UI-Texte mit Umlauten sauber führen (UTF-8, kein Mojibake)
7. DRA/PDC-Begriffe konsistent verwenden
8. Nach jeder strukturellen Änderung Build und QA ausführen

## Debug-Hinweise
- Browser-Konsole:
```js
window.__ATA_RUNTIME?.runSelfTests?.()
```
- QA-Skripte:
  - `qa-architecture.ps1` prüft Layer-Regeln und Seiteneffekte
  - `qa-encoding.ps1` prüft Umlaute und Mojibake
  - `qa-regelcheck.ps1` prüft zentrale DRA/PDC-Mappings
  - `qa-repository-hygiene.ps1` prüft temporäre Repository-Artefakte sowie lokale Markdown-Datei- und Ankerziele
  - `test-domain.ps1` prüft isolierbare Domain-Logik
  - `test-runtime-contract.ps1` prüft die öffentliche Runtime-API
  - `qa-build-discipline.ps1` prüft Versionsquelle und Dist-Disziplin

## GitHub Actions und Release-Gates

- `.github/workflows/qa.yml` läuft bei Pushes und Pull Requests gegen `main` sowie manuell per `workflow_dispatch`.
- `scripts/qa.ps1` ist lokal und in GitHub Actions das autoritative Gate; danach muss `git diff --exit-code` bestätigen, dass die committed Distribution reproduzierbar ist.
- Der Workflow verwendet `windows-latest`, weil die bestehenden PowerShell-Skripte und die Edge-/Chrome-Erkennung unverändert wiederverwendet werden.
- Authentifizierte AutoDarts-Account-, Lobby-, Board- und API-Tests sowie physische Screenreader- und Touch-Prüfungen gehören nicht zur CI. Sie stehen in der [manuellen Release-Checkliste](release-checklist.md).
