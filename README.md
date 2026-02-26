# Autodarts Tournament Assistant

Lokales Turniermanagement direkt in `https://play.autodarts.io` als Userscript.

Der Assistent erweitert die Autodarts-Oberfläche um einen eigenen Bereich für:
- Turnieranlage (KO, Liga, Gruppenphase + KO)
- Ergebnisführung
- Turnieransicht (Tabelle + Bracket)
- Import/Export
- API-Halbautomatik (Start per Klick + Ergebnis-Sync)

## Inhalt
1. [Schnellstart](#schnellstart)
2. [Funktionen](#funktionen)
3. [Turniermodi](#turniermodi)
4. [Regelbasis und Limits](#regelbasis-und-limits)
5. [Einstellungen](#einstellungen)
6. [Turnier anlegen](#turnier-anlegen)
7. [API-Halbautomatik](#api-halbautomatik)
8. [Import und Export](#import-und-export)
9. [Troubleshooting](#troubleshooting)
10. [Entwicklung](#entwicklung)
11. [Limitationen](#limitationen)

## Schnellstart
1. Tampermonkey im Browser installieren.
2. Loader installieren:
   - `https://github.com/thomasasen/autodarts_local_tournament/raw/refs/heads/main/installer/Autodarts%20Tournament%20Assistant%20Loader.user.js`
3. `https://play.autodarts.io` neu laden.
4. Im linken Menü auf **xLokale Turniere** klicken.

## Funktionen
- Turniermodi:
  - KO
  - Liga (Round Robin)
  - Gruppenphase + KO
- Ergebnisführung:
  - Manuelles Speichern pro Match
  - API-Matchstart per Klick
  - API-Sync für Ergebnisse
  - Präsenter Inline-Button auf `/history/matches/{id}`: `Ergebnis aus Statistik übernehmen & Turnier öffnen`
- KO-Ansicht:
  - Bracket via `brackets-viewer` (primär)
  - HTML-Fallback bei CDN-Fehler/Timeout
- Turnieranlage:
  - KO-Erstrunde als Hybrid-Draw (`seeded` oder `open_draw`)
  - X01-Preset-Button für Matchanlage (PDC-Defaults + Custom-Status)
  - Kompaktes Formular-Layout (Konfiguration + Teilnehmerbereich)
  - Teilnehmerliste kann per Button gemischt werden
  - Formularentwurf bleibt erhalten (z. B. beim Moduswechsel)
- Import/Export:
  - JSON-Datei exportieren
  - JSON in die Zwischenablage kopieren
  - JSON per Datei oder Text importieren

## Turniermodi
| Modus | Beschreibung | Typischer Einsatz |
|---|---|---|
| `ko` | Klassischer Single-Elimination-Baum | Schnelles Turnier mit Finalrunde |
| `league` | Jeder gegen jeden (Round Robin) | Kleine Gruppe mit kompletter Tabelle |
| `groups_ko` | 2 Gruppen, danach KO-Phase | Kombination aus Gruppenphase und Finalrunde |

### KO (`ko`)
- Hybrid-Draw:
  - `KO-Erstrunde zufällig mischen = OFF` -> `seeded` (Eingabereihenfolge als Seed 1..n).
  - `KO-Erstrunde zufällig mischen = ON` -> `open_draw` (zufällige Seed-Reihenfolge).
- Bye-Verteilung ist PDC/DRA-konform für gesetzte Draws:
  - Bei nicht voller 2er-Potenz erhalten Top-Seeds Freilose.
  - Beispiel mit 9 Spielern im 16er-Baum: Nur Seed 8 vs Seed 9 spielt in Runde 1.
- KO-Matches werden pro Turnierast freigeschaltet:
  - Ein Match ist spielbar, sobald beide Teilnehmer feststehen.
  - Bei Runde > 1 müssen die direkten Vorgänger-Matches abgeschlossen sein.
- Nur Runde-1-Byes dürfen automatisch als abgeschlossen gesetzt werden.
- Freilose werden im Tab `Spiele` explizit als `Freilos` markiert.

### Liga (`league`)
- Vollständiger Round-Robin-Spielplan.
- Tabelle basiert auf:
  - Punkte
  - Direktvergleich (bei 2 Punktgleichen, DRA strict)
  - Teilgruppen-Leg-Differenz (bei 3+ Punktgleichen, DRA strict)
  - Leg-Differenz gesamt
  - Legs For gesamt
  - Bei weiterem Gleichstand: `Playoff erforderlich`

### Gruppenphase + KO (`groups_ko`)
- Zwei Gruppen (`A`, `B`).
- Top-2 jeder Gruppe qualifizieren sich für KO.
- Kreuz-Halbfinale:
  - `A1 vs B2`
  - `B1 vs A2`
- Das Finale folgt nach den Halbfinals.

## Regelbasis und Limits
Priorisierung für Limits in diesem Projekt:
1. Offizielle Darts-Regeln
2. Mathematische Turnierlogik
3. Technische Machbarkeit im Userscript

### Was sagen die offiziellen Regeln?
- Offizielle DRA-Rulebook-Seite: https://www.thedra.co.uk/dra-rulebook
- DRA-Rulebook-PDF (Projektkopie): [docs/DRA-RULE_BOOK.pdf](docs/DRA-RULE_BOOK.pdf)
- DRA-Referenzen (Punkt + Seite im PDF):
  - **Definition Bye**: Abschnitt `2`, „Bye“ (Seite 4): [DRA-RULE_BOOK.pdf#page=4](docs/DRA-RULE_BOOK.pdf#page=4)
  - **Turnierformat KO / Round Robin**: `6.8.1` und `6.8.2` (Seite 17): [DRA-RULE_BOOK.pdf#page=17](docs/DRA-RULE_BOOK.pdf#page=17)
  - **Teilnehmer und Veranstalter-Ermessen**: `6.10.1` und `6.10.5.2` (Seiten 17-18): [DRA-RULE_BOOK.pdf#page=18](docs/DRA-RULE_BOOK.pdf#page=18)
  - **Draw bleibt bestehen (auch bei Bye durch Nichtantritt)**: `6.12.1` (Seite 18): [DRA-RULE_BOOK.pdf#page=18](docs/DRA-RULE_BOOK.pdf#page=18)
  - **Tie-Break im Ermessen des Veranstalters**: `6.16.1` (Seite 20): [DRA-RULE_BOOK.pdf#page=20](docs/DRA-RULE_BOOK.pdf#page=20)
- Kurzzitate aus dem Rulebook:
  - `6.8.1`: „The basic principle of Darts Tournaments ... is a knockout format.“
  - `6.16.1`: „Tie breaks may be employed at the discretion of the Promoter ...“

### Umgesetzte Limits (begründet)
| Modus | Limit | Begründung |
|---|---|---|
| `ko` | `2..128` | Regelkonform ohne kleines Kunstlimit; technisch auf 128 gedeckelt, damit Bracket/Rendering stabil bleiben. |
| `league` | `2..16` | Round Robin wächst quadratisch (`n*(n-1)/2` Matches); bei größeren Feldern wird es für lokale Turniere unpraktisch. |
| `groups_ko` | `4..16` | Mindestens 4 für zwei Gruppen mit anschließender KO-Phase (A1/B2, B1/A2); Obergrenze aus Spielanzahl/Bedienbarkeit. |

Hinweis:
- Es gibt zusätzlich ein technisches Hard-Cap bei `128` Teilnehmern, um Browser-Last und UI-Stabilität zu schützen.
- Die GUI verweist für Regelhintergründe über `§` auf [docs/dra-regeln-gui.md](docs/dra-regeln-gui.md).

## Einstellungen
Tab: `Einstellungen`

### Info-Symbole
- `ⓘ` = **Technische Information**
  - Verweist auf Bedienung, Implementierung und interne Projektdokumentation (README).
- `§` = **Regelwerk**
  - Verweist auf die zentrale Regelerklärung in [docs/dra-regeln-gui.md](docs/dra-regeln-gui.md).
  - Dort sind die DRA-Regeln didaktisch auf Deutsch erklärt und mit Kapitel/Punkt/Seite sowie PDF-Link hinterlegt.

### Debug-Mode
- Aktiviert ausführliche Logs in der Browser-Konsole.
- Prefix z. B. `[ATA][api]`, `[ATA][bracket]`, `[ATA][storage]`.

### Automatischer Lobby-Start + API-Sync
- Wenn aktiv:
  - `Match starten` erstellt eine Lobby, fügt Spieler hinzu und startet.
  - Das Ergebnis wird per API synchronisiert.

### KO-Erstrunde zufällig mischen (Standard)
- Gilt für neu erstellte KO-Turniere.
- Bei aktivem Schalter wird ein `open_draw` erzeugt (zufällige Seed-Reihenfolge).
- Bei deaktiviertem Schalter wird `seeded` verwendet (Eingabereihenfolge als Seed-Rang).
- Zusätzlich gibt es im Turnier-Formular den Button `Teilnehmer mischen`.

### KO Draw-Lock (Standard)
- Standard: `EIN`.
- Neue KO-Turniere übernehmen damit das Initial-Draw unverändert (`drawLocked = true`).
- Bezug: DRA `6.12.1` (Draw bleibt bestehen).
- Im Tab `Einstellungen` kann das aktive KO-Turnier bei Bedarf explizit entsperrt werden.

### Promoter Tie-Break-Profil
- `Promoter H2H + Mini-Tabelle` (empfohlen):
  - Punkte (2 Sieg, 1 Unentschieden, 0 Niederlage)
  - Direktvergleich bei 2 Punktgleichen
  - Teilgruppen-Leg-Differenz bei 3+ Punktgleichen
  - danach Gesamt-Leg-Differenz und Legs gewonnen
  - bei weiterem Gleichstand: `Playoff erforderlich`
- `Promoter Punkte + LegDiff`:
  - Vereinfachte, legacy-kompatible Sortierung
  - Reihenfolge: Punkte -> Gesamt-Leg-Differenz -> Legs gewonnen
- Offizielle Regelbasis (DRA): https://www.thedra.co.uk/dra-rulebook
- Relevante Regelstelle: `6.16.1` (Seite 20) im DRA-Rulebook-PDF
  - [DRA-RULE_BOOK.pdf#page=20](docs/DRA-RULE_BOOK.pdf#page=20)

## Turnier anlegen
Tab: `Turnier`

Pflichtfelder:
- Turniername
- Modus
- Teilnehmer (eine Zeile pro Person)

Weitere Felder:
- Best-of Legs
- Startscore
- Preset-Button (`PDC Preset anwenden`)
- In mode / Out mode
- Bull mode / Bull-off
- Max Runden
- Lobby ist immer `Privat` (lokal fest verdrahtet)
- KO-Erstrunde zufällig mischen
- Limits je Modus siehe: [Regelbasis und Limits](#regelbasis-und-limits)

### PDC-Standard-Preset
- Bei Neuanlage ist standardmäßig `PDC Standard` aktiv.
- Das Preset wird per Button auf die Felder angewendet (kein Dropdown-Select).
- Das Preset setzt:
  - Turniermodus `KO`
  - `Best of Legs` auf `5`
  - Matchart `X01`
  - X01 501
  - Straight In
  - Double Out
  - Bull mode `25/50`
  - Bull-off `Normal`
  - Max Runden `50`
  - Lobby `Privat` (fix)
- Der Spielmodus bleibt `Legs`; `Best-of Legs` ist führend für die Matchlänge und wird API-seitig als `First to N Legs` umgesetzt.
- `Best of 1` gilt nicht als PDC-Standardprofil im Tool.
- Das PDC-Logo-Badge erscheint, wenn das Setup vollständig passt:
  - KO
  - Best of mindestens 3 Legs
  - 501 Straight In, Double Out, Bull 25/50, Bull-off Normal, Max Runden 50
- Formularlogik:
  - Wenn `Bull-off = Off`, wird `Bull mode` read-only ausgegraut.
  - Bei jeder manuellen Änderung der X01-Felder wird der Preset-Status auf `Custom` gesetzt.

### Verhalten beim Formular
- Das Eingabeformular speichert einen Entwurf.
- Dadurch bleiben Eingaben erhalten, auch wenn:
  - der Modus gewechselt wird
  - die UI neu gerendert wird
- Das Formular ist für Desktop als kompakte Zwei-Zonen-Ansicht aufgebaut:
  - links Match-/Turnierkonfiguration
  - rechts Teilnehmerliste + Aktionen

## API-Halbautomatik
Tab: `Spiele`

### Voraussetzungen
- Gültiger Autodarts-Login (Auth-Token)
- Aktives Board in Autodarts
- Feature-Flag `Automatischer Lobby-Start + API-Sync` aktiv

### Ablauf
1. Match per `Match starten` auslösen.
2. Eine Lobby wird mit den Turnier-Settings erstellt (X01-Preset/Felder + Legs aus `Best-of Legs`), immer als private Lobby. Spieler werden hinzugefügt und das Match wird gestartet.
3. Das Match-Ergebnis wird per API geholt und gespeichert.
4. Nach dem Finish steht auf der Statistikseite (`/history/matches/{id}`) zusätzlich ein direkter Import-Button bereit.

### Schutzmechanismen
- Nur ein aktives API-Match gleichzeitig (Single-Board-Flow).
- Duplikatnamen werden für API-Sync blockiert.
- Ungültige Ergebnisse werden abgewiesen.

## Import und Export
Tab: `Import/Export`

### Export
- JSON als Datei herunterladen
- JSON in die Zwischenablage kopieren

### Import
- JSON-Datei auswählen
- JSON direkt in ein Textfeld einfügen

### Hinweise
- Das Persistenzschema ist `schemaVersion: 4`.
- Beim Import werden Daten defensiv normalisiert.
- Legacy-KO-Turniere werden auf KO-Engine v3 migriert.
- Vor KO-Migration wird ein Backup unter `ata:tournament:ko-migration-backups:v2` abgelegt.
- Bestehende Turniere werden auf `tournament.rules.tieBreakProfile = promoter_h2h_minitable` normalisiert.

## Troubleshooting
### "Match ist abgeschlossen", obwohl neu
- Ursache ist meist ein inkonsistenter Altzustand.
- Lösung:
  1. Seite neu laden.
  2. Falls nötig Turnier neu anlegen.
  3. Prüfen, ob `Freilos` in Runde 1 automatisch weitergeleitet wurde (das ist korrekt).

### "Board-ID ungültig (manual)"
- Einmal in Autodarts manuell eine Lobby öffnen und ein Board setzen.
- Danach Seite neu laden.

### API-Start/Sync funktioniert nicht
- Login prüfen (Token vorhanden?).
- Feature-Flag aktiv?
- Eindeutige Teilnehmernamen verwenden.
- Bei mehreren offenen Matches mit derselben Paarung wird absichtlich nicht automatisch übernommen (`Mehrdeutige Zuordnung`), um falsche Ergebnisse zu vermeiden.

### Bracket wird nicht gerendert
- Das CDN kann temporär nicht erreichbar sein.
- Der HTML-Fallback wird dann angezeigt.

## Entwicklung
### Repo-Struktur
```text
autodarts_local_tournament/
|- src/
|  |- core/
|  |- data/
|  |- domain/
|  |- infra/
|  |- ui/
|  |  |- styles/
|  |- bracket/
|  |- runtime/
|- build/
|  |- manifest.json
|- scripts/
|  |- build.ps1
|  |- qa.ps1
|  |- qa-encoding.ps1
|  |- qa-regelcheck.ps1
|- tests/
|  |- fixtures/
|  |- selftest-runtime.js
|- installer/
|  |- Autodarts Tournament Assistant Loader.user.js
|- dist/
|  |- autodarts-tournament-assistant.user.js
|- docs/
|  |- architecture.md
|  |- pdc-dra-compliance.md
|  |- refactor-guide.md
|  |- selector-strategy.md
|  |- changelog.md
|- README.md
|- LICENSE
```

### Hauptdateien
- Quellcode: `src/*`
- Build-Metadaten: `build/manifest.json`
- Build/QA: `scripts/*.ps1`
- Runtime-Script: `dist/autodarts-tournament-assistant.user.js`
- Loader-Script: `installer/Autodarts Tournament Assistant Loader.user.js`

### Build und QA
```powershell
powershell -ExecutionPolicy Bypass -File scripts/build.ps1
powershell -ExecutionPolicy Bypass -File scripts/qa.ps1
```

### Architektur
- Shadow DOM für gekapselte UI
- SPA-Routing-Hooks für stabile Einbindung in Autodarts
- Defensive Persistenz-Normalisierung
- Bracket-Rendering in sandboxed iframe

## Limitationen
- Modus-Limits:
  - `ko`: `2..128`
  - `league`: `2..16`
  - `groups_ko`: `4..16`
- Technisches Hard-Cap: `128` Teilnehmer
- API-Halbautomatik basiert auf in der Praxis verwendeten Endpunkten (Inference)
- DOM-Autodetect bleibt best-effort

## Quellen
- DRA (offizielle Regelbasis):
  - https://www.thedra.co.uk/dra-rulebook
  - [docs/DRA-RULE_BOOK.pdf](docs/DRA-RULE_BOOK.pdf)
- PDC (Open Draw Kontext, Eventregeln):
  - https://www.pdc.tv/news/2013/01/16/rules-challenge-youth-tours
- JS-Modularisierung:
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
- Tampermonkey Dokumentation:
  - https://www.tampermonkey.net/documentation.php?locale=en
- Referenz-Extension:
  - https://chromewebstore.google.com/detail/autodarts-local-tournamen/algfbicoennnolleogigbefngpkkmcng
- Bracket Viewer:
  - https://github.com/Drarig29/brackets-viewer.js
- Autodarts Themes/Pattern Inspiration:
  - https://github.com/thomasasen/autodarts-tampermonkey-themes
