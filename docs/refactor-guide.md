# Refactor Guide

## Ziel
Modulare Pflege des Userscripts ohne npm/Node mit reproduzierbarem Build.

## Arbeitsweise
1. Änderungen in `src/*` durchführen.
2. Build ausführen:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/build.ps1
```
3. QA ausführen:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/qa.ps1
```

## Modulgrenzen
- `core`: generische Laufzeit-Bausteine
- `data`: Persistenz und Normalisierung
- `domain`: fachliche Turnierregeln
- `infra`: externe API-Integration
- `ui`: Rendering und Interaktionen
- `bracket`: isolierte Bracket-Einbettung
- `runtime`: Bootstrap, Lifecycle und Public API

## Regeln für Änderungen
1. Fachlogik nur in `domain/*`
2. API-seitige Änderungen nur in `infra/*`
3. UI-Texte mit Umlauten sauber führen (UTF-8, kein Mojibake)
4. DRA/PDC-Begriffe konsistent verwenden
5. Nach jeder Änderung Build und QA ausführen

## Debug-Hinweise
- Browser-Konsole:
```js
window.__ATA_RUNTIME?.runSelfTests?.()
```
- QA-Skripte:
  - `qa-encoding.ps1` prüft Umlaute und Mojibake
  - `qa-regelcheck.ps1` prüft zentrale DRA/PDC-Mappings
